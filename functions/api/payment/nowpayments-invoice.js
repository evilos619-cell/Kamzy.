// Cloudflare Pages Function — POST /api/payment/nowpayments-invoice

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const nowKey      = env.NOWPAYMENTS_API_KEY || "";

  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 503);
  if (!nowKey) return json({ error: "NOWPayments not configured — contact support" }, 500);

  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const user = await getUser(supabaseUrl, serviceKey, auth.slice(7));
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { amount, userId, reference } = await request.json();
  if (!amount || !userId || !reference) return json({ error: "amount, userId and reference required" }, 400);
  if (userId !== user.id) return json({ error: "Forbidden" }, 403);

  // Verify intent exists
  const intentRes = await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/payment_intents?reference=eq.${encodeURIComponent(reference)}&user_id=eq.${userId}&provider=eq.nowpayments&limit=1`);
  const intents = await intentRes.json();
  if (!intents[0]) return json({ error: "Invalid payment reference" }, 400);

  const siteUrl = env.SITE_URL || "https://mmystorelogs.com";

  const nowRes = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: { "x-api-key": nowKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      price_amount: amount,
      price_currency: "ngn",
      order_id: reference,
      order_description: "Sammy Store Logs — Wallet Funding",
      success_url: `${siteUrl}/wallet?funded=crypto`,
      cancel_url:  `${siteUrl}/wallet`,
    }),
  });
  if (!nowRes.ok) {
    const msg = await nowRes.text();
    return json({ error: `NOWPayments error: ${msg}` }, 502);
  }
  const invoice = await nowRes.json();
  return json({ invoiceUrl: invoice.invoice_url, invoiceId: invoice.id });
}

async function getUser(supabaseUrl, serviceKey, token) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: serviceKey },
  });
  return res.ok ? res.json() : null;
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
