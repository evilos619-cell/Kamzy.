// Cloudflare Pages Function — POST /api/wallet/ensure
// Ensures a wallet row exists for the authenticated user using the service role key (bypasses RLS)

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 503);

  // Verify bearer token
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const token = auth.slice(7);

  const user = await getUser(supabaseUrl, serviceKey, token);
  if (!user) return json({ error: "Unauthorized" }, 401);

  // Check existing wallet
  const walletRes = await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/wallets?user_id=eq.${user.id}&limit=1`);
  const wallets = await walletRes.json();
  if (wallets.length > 0) return json({ wallet: wallets[0] });

  // Create wallet
  const createRes = await sbFetch(supabaseUrl, serviceKey, "/rest/v1/wallets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ user_id: user.id, balance: 0, currency: "NGN" }),
  });
  if (!createRes.ok) {
    const msg = await createRes.text();
    return json({ error: `Could not create wallet: ${msg}` }, 500);
  }
  const created = await createRes.json();
  return json({ wallet: Array.isArray(created) ? created[0] : created });
}

// ─── helpers ──────────────────────────────────────────────────────────────────
async function getUser(supabaseUrl, serviceKey, token) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: serviceKey },
  });
  if (!res.ok) return null;
  return res.json();
}

function sbFetch(supabaseUrl, serviceKey, path, extra = {}) {
  const { headers: extraHeaders = {}, ...rest } = extra;
  return fetch(`${supabaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      ...extraHeaders,
    },
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
