-- ensure_user_wallet(): client-callable SECURITY DEFINER fallback
-- Lets an authenticated user guarantee their wallet row exists without needing
-- an INSERT policy. Used as last-resort fallback when the CF Pages Function is
-- unreachable.
CREATE OR REPLACE FUNCTION public.ensure_user_wallet()
RETURNS TABLE (id uuid, balance numeric, currency text, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY
    SELECT w.id, w.balance, w.currency, w.updated_at
    FROM   public.wallets w
    WHERE  w.user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_wallet() TO authenticated;
