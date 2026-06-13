-- Idempotent migration: ensure wallets, wallet_transactions, product_categories, and products.currency exist
-- Safe to run multiple times. Also enables basic RLS and issues a PostgREST cache reload.

-- Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL    ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  balance_after numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'success',
  provider text,
  reference text UNIQUE,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL    ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Product categories (product_categories)
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT ALL    ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Ensure products.currency exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'NGN';
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies to ease debugging (remove when verified)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_all_wallets') THEN
    EXECUTE $$CREATE POLICY allow_all_wallets ON public.wallets FOR ALL USING (true) WITH CHECK (true);$$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_all_wallet_transactions') THEN
    EXECUTE $$CREATE POLICY allow_all_wallet_transactions ON public.wallet_transactions FOR ALL USING (true) WITH CHECK (true);$$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_all_products') THEN
    EXECUTE $$CREATE POLICY allow_all_products ON public.products FOR ALL USING (true) WITH CHECK (true);$$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_all_product_categories') THEN
    EXECUTE $$CREATE POLICY allow_all_product_categories ON public.product_categories FOR ALL USING (true) WITH CHECK (true);$$;
  END IF;
END $$;

-- Reload PostgREST schema cache (notify pgrst to refresh)
NOTIFY pgrst, 'reload schema';

-- List present tables for verification (client can run separately)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
