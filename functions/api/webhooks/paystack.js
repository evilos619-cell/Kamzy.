// Cloudflare Pages Function — POST /api/webhooks/paystack
// Paystack sends charge.success webhooks here; we credit the wallet server-side
// so the user doesn't need to stay on the page.
//
// Configure in Paystack dashboard:
//   Webhook URL → https://mmystorelogs.com/api/webhooks/paystack

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const paystackKey = env.PAYSTACK_SECRET_KEY || "";

  if (!supabaseUrl || !serviceKey || !paystackKey)
    return json({ error: "Server not configured" }, 503);

  // Read body as text so we can verify the HMAC signature
  const body      = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";

  if (!(await verifySignature(body, signature, paystackKey)))
    return json({ error: "Invalid signature" }, 401);

  let event;
  try { event = JSON.parse(body); } catch { return json({ error: "Bad JSON" }, 400); }

  // Only handle charge.success
  if (event.event !== "charge.success") return json({ received: true });

  const { reference, amount, customer, metadata } = event.data ?? {};
  const email  = customer?.email ?? "";
  // Paystack sends metadata as set in the Paystack.setup() call
  const userId = metadata?.userId || metadata?.user_id || null;

  // Resolve user id
  let resolvedUserId = userId;
  if (!resolvedUserId && email) {
    resolvedUserId = await getUserIdByEmail(supabaseUrl, serviceKey, email);
  }
  if (!resolvedUserId) {
    console.error("[Paystack webhook] Could not resolve user for reference:", reference);
    return json({ received: true }); // 200 so Paystack doesn't retry
  }

  // Idempotency — check if already credited
  const intentRes = await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/payment_intents?reference=eq.${encodeURIComponent(reference)}&limit=1`);
  const intents = await intentRes.json();
  const intent  = intents[0];
  if (intent?.status === "success") return json({ received: true, alreadyCredited: true });

  // Ensure wallet row exists
  await ensureWallet(supabaseUrl, serviceKey, resolvedUserId);

  // Credit wallet (service_role RPC)
  const amountNgn = (amount ?? 0) / 100;
  const rpcRes = await sbFetch(supabaseUrl, serviceKey, "/rest/v1/rpc/credit_wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _user_id: resolvedUserId,
      _amount:  amountNgn,
      _provider: "paystack",
      _reference: reference,
      _description: "Wallet funded via Paystack",
    }),
  });

  if (!rpcRes.ok) {
    const errText = await rpcRes.text();
    console.error("[Paystack webhook] credit_wallet failed:", errText);
    return json({ error: "Failed to credit wallet" }, 500);
  }

  // Update or insert payment_intent
  if (intent) {
    await sbFetch(supabaseUrl, serviceKey,
      `/rest/v1/payment_intents?id=eq.${intent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "success", updated_at: new Date().toISOString() }),
    });
  } else {
    await sbFetch(supabaseUrl, serviceKey, "/rest/v1/payment_intents", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: resolvedUserId, provider: "paystack",
        reference, amount: amountNgn, currency: "NGN",
        status: "success", raw: event.data,
      }),
    });
  }

  return json({ received: true, credited: true });
}

// ─── helpers ──────────────────────────────────────────────────────────────────
async function verifySignature(body, signature, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false, ["sign"]
  );
  const sigBuf  = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

async function getUserIdByEmail(supabaseUrl, serviceKey, email) {
  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}&per_page=1`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.users?.[0]?.id ?? null;
}

async function ensureWallet(supabaseUrl, serviceKey, userId) {
  const res = await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/wallets?user_id=eq.${userId}&limit=1`);
  const rows = await res.json();
  if (rows.length > 0) return rows[0];
  const cr = await sbFetch(supabaseUrl, serviceKey, "/rest/v1/wallets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ user_id: userId, balance: 0, currency: "NGN" }),
  });
  const created = await cr.json();
  return Array.isArray(created) ? created[0] : created;
}

function sbFetch(supabaseUrl, serviceKey, path, extra = {}) {
  const { headers: h = {}, ...rest } = extra;
  return fetch(`${supabaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, ...h },
    ...rest,
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
