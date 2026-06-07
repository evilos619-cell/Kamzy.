-- =============================================================================
-- SAMMY STORE LOGS — Complete Database Bootstrap
-- Run this entire script once in the Supabase SQL Editor for your project.
-- It is idempotent: safe to run multiple times.
-- =============================================================================

-- ── 0. Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Enums ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role       AS ENUM ('user', 'admin');       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.tx_type        AS ENUM ('credit', 'debit');     EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.tx_status      AS ENUM ('pending', 'success', 'failed', 'reversed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.payment_provider AS ENUM ('paystack', 'nowpayments', 'manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.order_status   AS ENUM ('pending', 'completed', 'failed', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Profiles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  display_name text,
  avatar_url   text,
  phone        text,
  suspended    boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_select   ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update   ON public.profiles;
DROP POLICY IF EXISTS profiles_self_insert   ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_select  ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_update  ON public.profiles;

CREATE POLICY profiles_self_select  ON public.profiles FOR SELECT    TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_self_update  ON public.profiles FOR UPDATE    TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_self_insert  ON public.profiles FOR INSERT    TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_admin_select ON public.profiles FOR SELECT    TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_admin_update ON public.profiles FOR UPDATE    TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ── 3. User roles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role    NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS roles_self_select        ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_insert  ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_update  ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_delete  ON public.user_roles;

CREATE POLICY roles_self_select       ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_insert ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_update ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_delete ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ── 4. Wallets ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallets (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid           NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance    numeric(14,2)  NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency   text           NOT NULL DEFAULT 'NGN',
  created_at timestamptz    NOT NULL DEFAULT now(),
  updated_at timestamptz    NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL    ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wallets_self_select ON public.wallets;
DROP POLICY IF EXISTS wallets_self_insert ON public.wallets;

CREATE POLICY wallets_self_select ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY wallets_self_insert ON public.wallets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ── 5. Wallet transactions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id           uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id    uuid           NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id      uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         tx_type        NOT NULL,
  amount       numeric(14,2)  NOT NULL CHECK (amount > 0),
  balance_after numeric(14,2) NOT NULL,
  status       tx_status      NOT NULL DEFAULT 'success',
  provider     payment_provider,
  reference    text           UNIQUE,
  description  text,
  metadata     jsonb          DEFAULT '{}'::jsonb,
  created_at   timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL    ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tx_self_select ON public.wallet_transactions;
CREATE POLICY tx_self_select ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ── 6. Payment intents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id         uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider   payment_provider NOT NULL,
  reference  text             NOT NULL UNIQUE,
  amount     numeric(14,2)    NOT NULL CHECK (amount > 0),
  currency   text             NOT NULL DEFAULT 'NGN',
  status     tx_status        NOT NULL DEFAULT 'pending',
  raw        jsonb            DEFAULT '{}'::jsonb,
  created_at timestamptz      NOT NULL DEFAULT now(),
  updated_at timestamptz      NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payment_intents TO authenticated;
GRANT ALL             ON public.payment_intents TO service_role;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intents_self        ON public.payment_intents;
DROP POLICY IF EXISTS intents_self_insert ON public.payment_intents;
DROP POLICY IF EXISTS intents_admin_update ON public.payment_intents;

CREATE POLICY intents_self         ON public.payment_intents FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY intents_self_insert  ON public.payment_intents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY intents_admin_update ON public.payment_intents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ── 7. Product categories ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  slug        text        NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT ALL    ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cats_public_read ON public.product_categories;
DROP POLICY IF EXISTS cats_admin_all   ON public.product_categories;

CREATE POLICY cats_public_read ON public.product_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cats_admin_all   ON public.product_categories FOR ALL   TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 8. Products ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid           REFERENCES public.product_categories(id) ON DELETE SET NULL,
  title       text           NOT NULL,
  slug        text           NOT NULL UNIQUE,
  description text,
  price       numeric(14,2)  NOT NULL CHECK (price >= 0),
  currency    text           NOT NULL DEFAULT 'NGN',
  stock       int            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   text,
  published   boolean        NOT NULL DEFAULT false,
  metadata    jsonb          DEFAULT '{}'::jsonb,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(published, created_at DESC);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL    ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_public_read ON public.products;
DROP POLICY IF EXISTS products_admin_all   ON public.products;

CREATE POLICY products_public_read ON public.products FOR SELECT TO anon, authenticated USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY products_admin_all   ON public.products FOR ALL   TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 9. Orders ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total         numeric(14,2) NOT NULL CHECK (total >= 0),
  currency      text          NOT NULL DEFAULT 'NGN',
  status        order_status  NOT NULL DEFAULT 'pending',
  wallet_tx_id  uuid          REFERENCES public.wallet_transactions(id),
  created_at    timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, created_at DESC);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL    ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_self         ON public.orders;
DROP POLICY IF EXISTS orders_admin_update ON public.orders;

CREATE POLICY orders_self         ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY orders_admin_update ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ── 10. Order items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id        uuid          REFERENCES public.products(id) ON DELETE SET NULL,
  title             text          NOT NULL,
  unit_price        numeric(14,2) NOT NULL,
  quantity          int           NOT NULL DEFAULT 1 CHECK (quantity > 0),
  delivered_payload text,
  created_at        timestamptz   NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL    ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_items_self ON public.order_items;
CREATE POLICY order_items_self ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- ── 11. Product credentials ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_credentials (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  content      text        NOT NULL,
  username     text,
  password     text,
  email        text,
  email_password text,
  two_factor   text,
  label        text,
  order_id     uuid        REFERENCES public.orders(id) ON DELETE SET NULL,
  assigned_to  uuid,
  delivered_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pc_product_avail ON public.product_credentials(product_id) WHERE order_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_pc_assigned      ON public.product_credentials(assigned_to);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_credentials TO authenticated;
GRANT ALL ON public.product_credentials TO service_role;
ALTER TABLE public.product_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pc_admin_all  ON public.product_credentials;
DROP POLICY IF EXISTS pc_self_read  ON public.product_credentials;

CREATE POLICY pc_admin_all ON public.product_credentials FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY pc_self_read ON public.product_credentials FOR SELECT TO authenticated USING (assigned_to = auth.uid());

-- ── 12. Site settings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        text  PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL    ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS settings_public_read  ON public.site_settings;
DROP POLICY IF EXISTS settings_admin_read   ON public.site_settings;
DROP POLICY IF EXISTS settings_admin_write  ON public.site_settings;

CREATE POLICY settings_admin_read  ON public.site_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY settings_admin_write ON public.site_settings FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 13. Activity logs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text        NOT NULL,
  target     text,
  metadata   jsonb       DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL    ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS logs_admin_read   ON public.activity_logs;
DROP POLICY IF EXISTS logs_admin_insert ON public.activity_logs;

CREATE POLICY logs_admin_read   ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY logs_admin_insert ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 14. Realtime ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- ── 15. Core functions ────────────────────────────────────────────────────────

-- handle_new_user: auto-provisions profile + wallet + role on every signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role app_role := 'user';
  v_admin_email text;
BEGIN
  -- Respect ADMIN_EMAIL env setting (falls back to hardcoded address)
  v_admin_email := coalesce(current_setting('app.admin_email', true), '1sammystore1@gmail.com');
  IF lower(coalesce(NEW.email, '')) = lower(v_admin_email) THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ensure_user_wallet: client-callable SECURITY DEFINER — always returns wallet row
CREATE OR REPLACE FUNCTION public.ensure_user_wallet()
RETURNS TABLE (id uuid, balance numeric, currency text, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  RETURN QUERY SELECT w.id, w.balance, w.currency, w.updated_at
               FROM   public.wallets w WHERE w.user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_user_wallet() TO authenticated;

-- credit_wallet: atomic credit — called only via service_role (webhooks / admin)
CREATE OR REPLACE FUNCTION public.credit_wallet(
  _user_id    uuid,
  _amount     numeric,
  _provider   payment_provider,
  _reference  text,
  _description text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_wallet_id   uuid;
  v_new_balance numeric(14,2);
  v_tx_id       uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE reference = _reference) THEN
    RETURN NULL; -- idempotent: already credited
  END IF;
  UPDATE public.wallets SET balance = balance + _amount, updated_at = now()
    WHERE user_id = _user_id RETURNING id, balance INTO v_wallet_id, v_new_balance;
  IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'wallet not found for user %', _user_id; END IF;
  INSERT INTO public.wallet_transactions(wallet_id, user_id, type, amount, balance_after, status, provider, reference, description)
    VALUES (v_wallet_id, _user_id, 'credit', _amount, v_new_balance, 'success', _provider, _reference, _description)
    RETURNING id INTO v_tx_id;
  RETURN v_tx_id;
END;
$$;
-- credit_wallet is service_role-only
REVOKE ALL ON FUNCTION public.credit_wallet(uuid, numeric, payment_provider, text, text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, payment_provider, text, text) TO service_role;

-- purchase_with_wallet: atomic wallet debit + stock decrement + order creation
CREATE OR REPLACE FUNCTION public.purchase_with_wallet(_user_id uuid, _product_id uuid, _quantity int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product     public.products;
  v_total       numeric(14,2);
  v_wallet_id   uuid;
  v_new_balance numeric(14,2);
  v_tx_id       uuid;
  v_order_id    uuid;
BEGIN
  IF _quantity <= 0 THEN RAISE EXCEPTION 'quantity must be positive'; END IF;
  SELECT * INTO v_product FROM public.products WHERE id = _product_id AND published = true FOR UPDATE;
  IF v_product.id IS NULL THEN RAISE EXCEPTION 'product not available'; END IF;
  IF v_product.stock < _quantity THEN RAISE EXCEPTION 'insufficient stock'; END IF;
  v_total := v_product.price * _quantity;

  SELECT id, balance INTO v_wallet_id, v_new_balance FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'wallet not found'; END IF;
  IF v_new_balance < v_total THEN RAISE EXCEPTION 'insufficient wallet balance'; END IF;

  UPDATE public.wallets SET balance = balance - v_total, updated_at = now() WHERE id = v_wallet_id RETURNING balance INTO v_new_balance;
  UPDATE public.products SET stock = stock - _quantity, updated_at = now() WHERE id = _product_id;

  INSERT INTO public.wallet_transactions(wallet_id, user_id, type, amount, balance_after, status, provider, reference, description)
    VALUES (v_wallet_id, _user_id, 'debit', v_total, v_new_balance, 'success', 'manual', 'purchase-' || gen_random_uuid()::text, 'Purchase: ' || v_product.title)
    RETURNING id INTO v_tx_id;

  INSERT INTO public.orders(user_id, total, currency, status, wallet_tx_id)
    VALUES (_user_id, v_total, v_product.currency, 'completed', v_tx_id) RETURNING id INTO v_order_id;
  INSERT INTO public.order_items(order_id, product_id, title, unit_price, quantity)
    VALUES (v_order_id, v_product.id, v_product.title, v_product.price, _quantity);
  PERFORM public.assign_credential_to_order(v_order_id, _product_id);
  RETURN v_order_id;
END;
$$;

-- assign_credential_to_order: service_role-only atomic delivery
CREATE OR REPLACE FUNCTION public.assign_credential_to_order(_order_id uuid, _product_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cred_id uuid;
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.orders WHERE id = _order_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;

  SELECT id INTO v_cred_id
  FROM public.product_credentials
  WHERE product_id = _product_id AND order_id IS NULL
  ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF v_cred_id IS NULL THEN RETURN NULL; END IF;

  UPDATE public.product_credentials
    SET order_id = _order_id, assigned_to = v_user_id, delivered_at = now()
    WHERE id = v_cred_id;
  UPDATE public.order_items SET delivered_payload = v_cred_id::text
    WHERE order_id = _order_id AND product_id = _product_id;
  RETURN v_cred_id;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_credential_to_order(uuid, uuid) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.assign_credential_to_order(uuid, uuid) TO service_role;

-- ── 16. Backfill existing users (if any) ─────────────────────────────────────
-- Creates wallets and profiles for any users that signed up before this ran
INSERT INTO public.profiles (id, email, display_name)
SELECT u.id, u.email, split_part(u.email, '@', 1)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.wallets (user_id)
SELECT u.id FROM auth.users u
LEFT JOIN public.wallets w ON w.user_id = u.id
WHERE w.id IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.id IS NULL;

-- Promote admin email
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = '1sammystore1@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ── 17. Seed product categories ───────────────────────────────────────────────
INSERT INTO public.product_categories (name, slug, description) VALUES
  ('Aged Twitter',                         'aged-twitter',       'Verified aged Twitter/X accounts'),
  ('Aged Instagram',                       'aged-instagram',     'Verified aged Instagram accounts'),
  ('Random Facebook',                      'random-facebook',    'Random Facebook accounts'),
  ('USA Facebook',                         'usa-facebook',       'USA-based verified Facebook accounts'),
  ('Tools',                                'tools',              'Social media tools and utilities'),
  ('Working Profiles with Picture & Video','working-profiles',   'Active profiles with pictures and videos'),
  ('Below 50 Friend Countries Facebook',   'below-50-friend',    'Facebook accounts with below 50 friend countries'),
  ('TikTok',                               'tiktok',             'Verified TikTok accounts'),
  ('Facebook',                             'facebook',           'Facebook accounts'),
  ('Instagram',                            'instagram',          'Instagram accounts'),
  ('Telegram',                             'telegram',           'Telegram accounts'),
  ('YouTube',                              'youtube',            'YouTube accounts'),
  ('Twitter/X',                            'twitter-x',          'Twitter/X accounts'),
  ('LinkedIn',                             'linkedin',           'LinkedIn accounts')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- Done! All tables, policies, functions, and triggers are ready.
-- =============================================================================
