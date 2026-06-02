
revoke execute on function public.credit_wallet(uuid, numeric, payment_provider, text, text) from public, anon, authenticated;
revoke execute on function public.purchase_with_wallet(uuid, uuid, int) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.purchase_with_wallet(uuid, uuid, int) to authenticated;
