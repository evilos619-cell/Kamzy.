// Cloudflare Pages Function — POST /api/payment/nowpayments-invoice
// Supports NOWPayments (legacy) and Monify (if configured). This file updates
// provider identifiers used for payment_intents lookup without changing core
// payment logic. If Monify is used you must provide MONIFY_API_KEY and
// MONIFY_API_URL in the environment; otherwise the function will fall back to
// NOWPAYMENTS_API_KEY and the NOWPayments endpoint.

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const monifyKey = env.MONIFY_API_KEY || "";
  const nowKey = env.NOWPAYMENTS_API_KEY || "";
  const apiKey = monifyKey || nowKey;

  // Determine provider name for DB records and lookups
  const provider = monifyKey ? "monify" : nowKey ? "nowpayments" : "";

  if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 503);
  if (!apiKey) return json({ error: "Payment provider API key not configured" }, 500);

  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const user = await getUser(supabaseUrl, serviceKey, auth.slice(7));
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { amount, userId, reference } = await request.json();
  if (!amount || !userId || !reference) return json({ error: "amount, userId and reference required" }, 400);
  if (userId !== user.id) return json({ error: "Forbidden" }, 403);

  // Verify intent exists (use detected provider)
  const intentRes = await sbFetch(
    supabaseUrl,
    serviceKey,
    `/rest/v1/payment_intents?reference=eq.${encodeURIComponent(reference)}&user_id=eq.${userId}&provider=eq.${provider}&limit=1`
  );
  const intents = await intentRes.json();
  if (!intents[0]) return json({ error: "Invalid payment reference" }, 400);

  const siteUrl = env.SITE_URL || "https://kamzybotsmedia.com";

  // Choose API endpoint: NOWPayments (default) or MONIFY_API_URL (if using Monify)
  const apiUrl = provider === "nowpayments" ? "https://api.nowpayments.io/v1/invoice" : env.MONIFY_API_URL || "";

  if (provider === "monify" && !apiUrl) {
    return json({ error: "Monify configured but MONIFY_API_URL is missing" }, 501);
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      price_amount: amount,
      price_currency: "ngn",
      order_id: reference,
      order_description: "KAMZYBOT'S MEDIA — Wallet Funding",
      success_url: `${siteUrl}/wallet?funded=crypto`,
      cancel_url: `${siteUrl}/wallet`,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    return json({ error: `${provider} error: ${msg}` }, 502);
  }
  const invoice = await res.json();

  // Response shape may vary between providers; attempt common fields
  return json({ invoiceUrl: invoice.invoice_url || invoice.payment_url || invoice.url, invoiceId: invoice.id || invoice.payment_id || null });
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
