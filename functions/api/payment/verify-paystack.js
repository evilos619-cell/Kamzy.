// Cloudflare Pages Function — POST /api/payment/verify-paystack

export async function onRequestPost({ request, env }) {
  const supabaseUrl  = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey   = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const paystackKey  = env.PAYSTACK_SECRET_KEY || "";

  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 503);
  if (!paystackKey) return json({ error: "Paystack not configured — contact support" }, 500);

  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const user = await getUser(supabaseUrl, serviceKey, auth.slice(7));
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { reference, userId } = await request.json();
  if (!reference || !userId) return json({ error: "reference and userId required" }, 400);
  if (userId !== user.id)    return json({ error: "Forbidden" }, 403);

  // Check payment_intent
  const intentRes = await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/payment_intents?reference=eq.${encodeURIComponent(reference)}&user_id=eq.${userId}&provider=eq.paystack&limit=1`);
  const intents = await intentRes.json();
  const intent  = intents[0];
  if (!intent) return json({ error: "Invalid or expired payment reference" }, 400);
  if (intent.status === "success") return json({ success: true, amount: Number(intent.amount), alreadyCredited: true });

  // Verify with Paystack
  const psRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${paystackKey}` } }
  );
  if (!psRes.ok) return json({ error: "Could not verify with Paystack" }, 502);
  const psData = await psRes.json();
  if (!psData.status || psData.data?.status !== "success")
    return json({ error: "Payment not confirmed — contact support if charged" }, 400);

  const amount = (psData.data.amount ?? 0) / 100;

  // Ensure wallet exists first
  await ensureWallet(supabaseUrl, serviceKey, userId);

  // Credit wallet via RPC
  const rpcRes = await sbFetch(supabaseUrl, serviceKey, "/rest/v1/rpc/credit_wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _user_id: userId, _amount: amount,
      _provider: "paystack", _reference: reference,
      _description: "Wallet funded via Paystack",
    }),
  });
  if (!rpcRes.ok) {
    const msg = await rpcRes.text();
    return json({ error: msg }, 500);
  }

  // Mark intent as success
  await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/payment_intents?id=eq.${intent.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status: "success", updated_at: new Date().toISOString() }),
  });

  return json({ success: true, amount, alreadyCredited: false });
}

async function getUser(supabaseUrl, serviceKey, token) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: serviceKey },
  });
  return res.ok ? res.json() : null;
}

async function ensureWallet(supabaseUrl, serviceKey, userId) {
  const res = await sbFetch(supabaseUrl, serviceKey, `/rest/v1/wallets?user_id=eq.${userId}&limit=1`);
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
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
