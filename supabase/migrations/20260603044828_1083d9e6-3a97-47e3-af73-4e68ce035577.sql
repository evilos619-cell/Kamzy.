
-- 1. product_credentials table
CREATE TABLE IF NOT EXISTS public.product_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  content text NOT NULL,
  label text,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  assigned_to uuid,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pc_product_available
  ON public.product_credentials (product_id) WHERE order_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_pc_assigned_to ON public.product_credentials (assigned_to);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_credentials TO authenticated;
GRANT ALL ON public.product_credentials TO service_role;

ALTER TABLE public.product_credentials ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY pc_admin_all ON public.product_credentials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users: can read credentials assigned to them
CREATE POLICY pc_self_read ON public.product_credentials
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());

-- 2. Atomic assignment function (security definer; called from server fn with service role)
CREATE OR REPLACE FUNCTION public.assign_credential_to_order(_order_id uuid, _product_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cred_id uuid;
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.orders WHERE id = _order_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;

  -- atomically pick & lock one available credential
  SELECT id INTO v_cred_id
  FROM public.product_credentials
  WHERE product_id = _product_id AND order_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_cred_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.product_credentials
  SET order_id = _order_id, assigned_to = v_user_id, delivered_at = now()
  WHERE id = v_cred_id;

  -- record on the order item for visibility
  UPDATE public.order_items
  SET delivered_payload = v_cred_id::text
  WHERE order_id = _order_id AND product_id = _product_id;

  RETURN v_cred_id;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_credential_to_order(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.assign_credential_to_order(uuid, uuid) TO service_role;

-- 3. Ensure all requested social categories exist
INSERT INTO public.product_categories (name, slug) VALUES
  ('TikTok', 'tiktok'),
  ('Facebook', 'facebook'),
  ('Instagram', 'instagram'),
  ('Telegram', 'telegram'),
  ('YouTube', 'youtube'),
  ('Twitter/X', 'twitter-x'),
  ('LinkedIn', 'linkedin')
ON CONFLICT (slug) DO NOTHING;
