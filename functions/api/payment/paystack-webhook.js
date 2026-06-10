// Cloudflare Pages Function — POST /api/payment/paystack-webhook
// Set this URL in Paystack Dashboard → Settings → API → Webhook URL:
// https://kamzybotsmedia.com/api/payment/paystack-webhook

import { createHmac } from "node:crypto";

export async function onRequestPost({ request, env }) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY || "";
  const paystackKey = env.PAYSTACK_SECRET_KEY || "";

  if (!supabaseUrl || !serviceKey || !paystackKey) {
    return json({ error: "Server not configured" }, 503);
  }

  // Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";

  // Verify the request is genuinely from Paystack
  const expectedSig = createHmac("sha512", paystackKey)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSig) {
    return json({ error: "Invalid signature" }, 401);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Only handle successful charge events
  if (event.event !== "charge.success") {
    return json({ received: true }, 200);
  }

  const data      = event.data ?? {};
  const reference = data.reference;
  const amountKobo = data.amount ?? 0;
  const amount    = amountKobo / 100; // Convert kobo → naira
  const email     = data.customer?.email;

  if (!reference || !email || amount <= 0) {
    return json({ error: "Missing required fields" }, 400);
  }

  // Look up user by email
  const userRes = await sbFetch(supabaseUrl, serviceKey,
    `/auth/v1/admin/users?email=${encodeURIComponent(email)}&page=1&per_page=1`,
    {}, true);

  if (!userRes.ok) {
    return json({ error: "Could not look up user" }, 500);
  }

  const userBody = await userRes.json();
  const userId   = userBody?.users?.[0]?.id;

  if (!userId) {
    // User not found — log and return 200 so Paystack doesn't retry
    console.warn("[webhook] No user found for email:", email);
    return json({ received: true }, 200);
  }

  // Check if this reference was already processed (idempotency)
  const intentRes = await sbFetch(supabaseUrl, serviceKey,
    `/rest/v1/payment_intents?reference=eq.${encodeURIComponent(reference)}&status=eq.success&limit=1`);
  const intents = await intentRes.json();
  if (intents?.length > 0) {
    return json({ received: true, alreadyProcessed: true }, 200);
  }

  // Ensure wallet exists
  await ensureWallet(supabaseUrl, serviceKey, userId);

  // Credit the wallet via RPC
  const rpcRes = await sbFetch(supabaseUrl, serviceKey, "/rest/v1/rpc/credit_wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _user_id:     userId,
      _amount:      amount,
      _provider:    "paystack",
      _reference:   reference,
      _description: `Wallet funded via Paystack (₦${amount.toLocaleString()})`,
    }),
  });

  if (!rpcRes.ok) {
    const msg = await rpcRes.text();
    console.error("[webhook] credit_wallet failed:", msg);
    return json({ error: "Failed to credit wallet" }, 500);
  }

  // Upsert payment_intent record as success
  await sbFetch(supabaseUrl, serviceKey, "/rest/v1/payment_intents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id:    userId,
      provider:   "paystack",
      reference:  reference,
      amount:     amount,
      currency:   "NGN",
      status:     "success",
      updated_at: new Date().toISOString(),
    }),
  });

  console.log(`[webhook] Credited ₦${amount} to user ${userId} (ref: ${reference})`);
  return json({ received: true, credited: amount }, 200);
}

async function ensureWallet(supabaseUrl, serviceKey, userId) {
  const res  = await sbFetch(supabaseUrl, serviceKey, `/rest/v1/wallets?user_id=eq.${userId}&limit=1`);
  const rows = await res.json();
  if (rows?.length > 0) return rows[0];
  const cr = await sbFetch(supabaseUrl, serviceKey, "/rest/v1/wallets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ user_id: userId, balance: 0, currency: "NGN" }),
  });
  const created = await cr.json();
  return Array.isArray(created) ? created[0] : created;
}

// isAuth=true uses /auth/v1 endpoint with different path structure
function sbFetch(supabaseUrl, serviceKey, path, extra = {}, isAuth = false) {
  const { headers: h = {}, ...rest } = extra;
  const base = isAuth ? supabaseUrl : supabaseUrl;
  return fetch(`${base}${path}`, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      ...h,
    },
    ...rest,
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
