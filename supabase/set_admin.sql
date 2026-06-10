-- =====================================================================
-- Set kamzybotsmedia@gmail.com as admin
-- Run this in your Supabase SQL Editor (safe to run multiple times)
-- =====================================================================

DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = 'kamzybotsmedia@gmail.com'
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE NOTICE 'User not found — make sure the account is registered first.';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Admin role granted to user %', v_uid;
  END IF;
END $$;
