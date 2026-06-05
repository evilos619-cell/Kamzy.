-- Backfill: create wallet for any user without one
INSERT INTO public.wallets (user_id)
SELECT u.id FROM auth.users u
LEFT JOIN public.wallets w ON w.user_id = u.id
WHERE w.id IS NULL;

-- Allow users to self-create their own wallet (safety net)
CREATE POLICY "wallets_self_insert" ON public.wallets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
