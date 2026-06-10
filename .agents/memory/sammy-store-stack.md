---
name: Sammy Store Stack
description: Core patterns for the Sammy Store Logs TanStack Start + Supabase app
---

# Sammy Store Stack

**Why:** Multi-session app with SSR, Supabase RLS, wallet system, Paystack + NOWPayments.

## Key rules

- `supabaseAdmin` (service role) lives in `src/integrations/supabase/client.server.ts` — use for server fns that must bypass RLS (e.g. `credit_wallet` RPC, admin queries).
- `credit_wallet` RPC is revoked from `authenticated` — must be called via service_role only (use `supabaseAdmin.rpc()`).
- `purchase_with_wallet` RPC is callable by `authenticated` users from the client.
- Server functions: `createServerFn({ method: "POST" }).inputValidator(z.schema).handler(async ({ data }) => {...})` pattern — file must end in `.ts` (not `.tsx`).
- Auth: `useAuth()` returns `{ user, role, isAdmin, loading }` — always wait for `loading === false` before redirecting.
- Admin email hardcoded: `kamzybotsmedia@gmail.com` (DB trigger + `ADMIN_OWNER_EMAIL` in `src/data/site.ts`).
- Paystack: load `https://js.paystack.co/v1/inline.js` via script tag; `window.PaystackPop.setup({...}).openIframe()`. Env: `VITE_PAYSTACK_PUBLIC_KEY` (client) + `PAYSTACK_SECRET_KEY` (server).
- NOWPayments: server-side invoice via `https://api.nowpayments.io/v1/invoice`. Env: `NOWPAYMENTS_API_KEY`.
- `payment_provider` is a Postgres enum: `('paystack', 'nowpayments', 'manual')` — must match exactly.
- All new routes go in `src/routes/` — TanStack Router auto-generates `routeTree.gen.ts` on file save.
- Brand: `bg-brand-orange`, `hover:bg-brand-orange-hover`, `text-brand-navy`.

## Route → file map
- `/dashboard` → `src/routes/dashboard.tsx`
- `/wallet` → `src/routes/wallet.tsx`
- `/admin` → `src/routes/admin.tsx`
- `/reset-password` → `src/routes/reset-password.tsx`
- `/products` → `src/routes/products.tsx` (updated with DB categories + buy dialog)
- Payment server fns → `src/lib/api/payment.ts`
