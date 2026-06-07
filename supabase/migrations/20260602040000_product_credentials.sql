
-- Product credentials pool (one slot = one deliverable account)
create table if not exists public.product_credentials (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  content text not null,
  username text,
  password text,
  email text,
  email_password text,
  two_factor text,
  label text,
  is_delivered boolean not null default false,
  order_id uuid references public.orders(id) on delete set null,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_prodcreds_product on public.product_credentials(product_id, is_delivered);
create index if not exists idx_prodcreds_order on public.product_credentials(order_id);

alter table public.product_credentials enable row level security;

-- Users may read credentials tied to their own completed orders
create policy "creds_user_select" on public.product_credentials
  for select to authenticated
  using (
    order_id is not null and
    exists (
      select 1 from public.orders o
      where o.id = product_credentials.order_id
        and o.user_id = auth.uid()
    )
  );

-- Admins have full access
create policy "creds_admin_all" on public.product_credentials
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant select on public.product_credentials to authenticated;
grant all   on public.product_credentials to service_role;

-- Atomically assign one free credential to a freshly created order (no races)
create or replace function public.assign_credential_to_order(
  _order_id uuid,
  _product_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _cred_id uuid;
begin
  update public.product_credentials
  set
    is_delivered = true,
    order_id     = _order_id,
    delivered_at = now()
  where id = (
    select id
    from public.product_credentials
    where product_id   = _product_id
      and is_delivered = false
      and order_id     is null
    order by created_at
    limit 1
    for update skip locked          -- prevents concurrent duplicates
  )
  returning id into _cred_id;

  return _cred_id;
end;
$$;

-- Only service_role may call this function (prevents client-side abuse)
revoke execute on function public.assign_credential_to_order(uuid, uuid) from public, anon, authenticated;
grant  execute on function public.assign_credential_to_order(uuid, uuid) to service_role;
