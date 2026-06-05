// Cloudflare Pages Function — POST /api/payment/nowpayments-status

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const nowKey      = env.NOWPAYMENTS_API_KEY || "";

  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 503);

  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const user = await getUser(supabaseUrl, serviceKey, auth.slice(7));
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { reference, userId } = await request.json();
  if (!reference || !userId) return json({ error: "reference and userId required" }, 400);
  if (userId !== user.id)    return json({ error: "Forbidden" }, 403);

  const intentRes = await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/payment_intents?reference=eq.${encodeURIComponent(reference)}&user_id=eq.${userId}&limit=1`);
  const intents = await intentRes.json();
  const intent  = intents[0];
  if (!intent) return json({ error: "Payment intent not found" }, 404);
  if (intent.status === "success") return json({ status: "success", alreadyCredited: true });

  if (!nowKey) return json({ error: "NOWPayments not configured" }, 500);

  const nowRes = await fetch(
    `https://api.nowpayments.io/v1/payment?order_id=${encodeURIComponent(reference)}&limit=1`,
    { headers: { "x-api-key": nowKey } }
  );
  if (!nowRes.ok) return json({ error: "Failed to check payment status" }, 502);

  const nowData = await nowRes.json();
  const paymentStatus = nowData.data?.[0]?.payment_status ?? "waiting";

  if (paymentStatus === "finished" || paymentStatus === "confirmed") {
    await ensureWallet(supabaseUrl, serviceKey, userId);
    const rpcRes = await sbFetch(supabaseUrl, serviceKey, "/rest/v1/rpc/credit_wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _user_id: userId, _amount: Number(intent.amount),
        _provider: "nowpayments", _reference: reference,
        _description: "Wallet funded via NOWPayments (crypto)",
      }),
    });
    if (rpcRes.ok) {
      await sbFetch(supabaseUrl, serviceKey,
        `/rest/v1/payment_intents?id=eq.${intent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ status: "success", updated_at: new Date().toISOString() }),
      });
      return json({ status: "success", alreadyCredited: false });
    }
  }
  return json({ status: paymentStatus, alreadyCredited: false });
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
