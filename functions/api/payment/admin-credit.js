// Cloudflare Pages Function — POST /api/payment/admin-credit

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 503);

  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const user = await getUser(supabaseUrl, serviceKey, auth.slice(7));
  if (!user) return json({ error: "Unauthorized" }, 401);

  // Check admin role
  const rolesRes = await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/user_roles?user_id=eq.${user.id}&role=eq.admin&limit=1`);
  const roles = await rolesRes.json();
  if (!roles.length) return json({ error: "Forbidden: admin access required" }, 403);

  const { targetUserId, amount, description } = await request.json();
  if (!targetUserId || !amount || !description)
    return json({ error: "targetUserId, amount and description required" }, 400);

  const ref = `admin-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  await ensureWallet(supabaseUrl, serviceKey, targetUserId);

  const rpcRes = await sbFetch(supabaseUrl, serviceKey, "/rest/v1/rpc/credit_wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _user_id: targetUserId, _amount: amount,
      _provider: "manual", _reference: ref, _description: description,
    }),
  });
  if (!rpcRes.ok) {
    const msg = await rpcRes.text();
    return json({ error: msg }, 500);
  }

  await sbFetch(supabaseUrl, serviceKey, "/rest/v1/activity_logs", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      actor_id: user.id, action: "admin_credit_wallet",
      target: targetUserId, metadata: { amount, description, ref },
    }),
  });

  return json({ success: true });
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
