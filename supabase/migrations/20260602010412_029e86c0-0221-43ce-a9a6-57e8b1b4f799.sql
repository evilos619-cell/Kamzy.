
-- Enums
create type public.app_role as enum ('user', 'admin');
create type public.tx_type as enum ('credit', 'debit');
create type public.tx_status as enum ('pending', 'success', 'failed', 'reversed');
create type public.payment_provider as enum ('paystack', 'nowpayments', 'manual');
create type public.order_status as enum ('pending', 'completed', 'pending_credentials', 'failed', 'refunded');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_self_select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles_self_select" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Wallets
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  currency text not null default 'NGN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "wallets_self_select" on public.wallets for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Wallet transactions
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type tx_type not null,
  amount numeric(14,2) not null check (amount > 0),
  balance_after numeric(14,2) not null,
  status tx_status not null default 'success',
  provider payment_provider,
  reference text unique,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.wallet_transactions(user_id, created_at desc);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
create policy "tx_self_select" on public.wallet_transactions for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Payment intents (dedupe webhook double-credit)
create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider payment_provider not null,
  reference text not null unique,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'NGN',
  status tx_status not null default 'pending',
  raw jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert on public.payment_intents to authenticated;
grant all on public.payment_intents to service_role;
alter table public.payment_intents enable row level security;
create policy "intents_self" on public.payment_intents for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "intents_self_insert" on public.payment_intents for insert to authenticated with check (user_id = auth.uid());

-- Categories
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);
grant select on public.product_categories to anon, authenticated;
grant all on public.product_categories to service_role;
alter table public.product_categories enable row level security;
create policy "cats_public_read" on public.product_categories for select to anon, authenticated using (true);
create policy "cats_admin_all" on public.product_categories for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  price numeric(14,2) not null check (price >= 0),
  currency text not null default 'NGN',
  stock int not null default 0 check (stock >= 0),
  image_url text,
  published boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.products(published, created_at desc);
grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products_public_read" on public.products for select to anon, authenticated using (published = true or public.has_role(auth.uid(), 'admin'));
create policy "products_admin_all" on public.products for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total numeric(14,2) not null check (total >= 0),
  currency text not null default 'NGN',
  status order_status not null default 'pending',
  wallet_tx_id uuid references public.wallet_transactions(id),
  created_at timestamptz not null default now()
);
create index on public.orders(user_id, created_at desc);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders_self" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  unit_price numeric(14,2) not null,
  quantity int not null default 1 check (quantity > 0),
  delivered_payload text,
  created_at timestamptz not null default now()
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order_items_self" on public.order_items for select to authenticated using (
  exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
);

-- Site settings
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings_public_read" on public.site_settings for select to anon, authenticated using (true);
create policy "settings_admin_write" on public.site_settings for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Activity logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
alter table public.activity_logs enable row level security;
create policy "logs_admin_read" on public.activity_logs for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Auto-provision profile + wallet + role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role app_role := 'user';
begin
  if lower(coalesce(new.email,'')) = 'kamzybotsmedia@gmail.com' then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;

  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, v_role) on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic wallet credit (used by webhooks via service role)
create or replace function public.credit_wallet(
  _user_id uuid, _amount numeric, _provider payment_provider, _reference text, _description text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_wallet_id uuid; v_new_balance numeric(14,2); v_tx_id uuid;
begin
  if exists(select 1 from public.wallet_transactions where reference = _reference) then
    return null; -- already credited
  end if;
  update public.wallets set balance = balance + _amount, updated_at = now()
    where user_id = _user_id returning id, balance into v_wallet_id, v_new_balance;
  if v_wallet_id is null then raise exception 'wallet not found'; end if;
  insert into public.wallet_transactions(wallet_id, user_id, type, amount, balance_after, status, provider, reference, description)
    values (v_wallet_id, _user_id, 'credit', _amount, v_new_balance, 'success', _provider, _reference, _description)
    returning id into v_tx_id;
  return v_tx_id;
end;
$$;

-- Atomic wallet-based purchase
create or replace function public.purchase_with_wallet(_user_id uuid, _product_id uuid, _quantity int)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_product public.products; v_total numeric(14,2); v_wallet_id uuid; v_new_balance numeric(14,2);
  v_tx_id uuid; v_order_id uuid;
begin
  if _quantity <= 0 then raise exception 'quantity must be positive'; end if;
  select * into v_product from public.products where id = _product_id and published = true for update;
  if v_product.id is null then raise exception 'product not available'; end if;
  if v_product.stock < _quantity then raise exception 'insufficient stock'; end if;
  v_total := v_product.price * _quantity;

  select id, balance into v_wallet_id, v_new_balance from public.wallets where user_id = _user_id for update;
  if v_wallet_id is null then raise exception 'wallet not found'; end if;
  if v_new_balance < v_total then raise exception 'insufficient wallet balance'; end if;

  update public.wallets set balance = balance - v_total, updated_at = now() where id = v_wallet_id returning balance into v_new_balance;
  update public.products set stock = stock - _quantity, updated_at = now() where id = _product_id;

  insert into public.wallet_transactions(wallet_id, user_id, type, amount, balance_after, status, provider, reference, description)
    values (v_wallet_id, _user_id, 'debit', v_total, v_new_balance, 'success', 'manual', 'purchase-' || gen_random_uuid()::text, 'Purchase: ' || v_product.title)
    returning id into v_tx_id;

  insert into public.orders(user_id, total, currency, status, wallet_tx_id) values (_user_id, v_total, v_product.currency, 'completed', v_tx_id) returning id into v_order_id;
  insert into public.order_items(order_id, product_id, title, unit_price, quantity) values (v_order_id, v_product.id, v_product.title, v_product.price, _quantity);
  perform public.assign_credential_to_order(v_order_id, _product_id);
  return v_order_id;
end;
$$;

-- Realtime
alter publication supabase_realtime add table public.wallets;
alter publication supabase_realtime add table public.wallet_transactions;
