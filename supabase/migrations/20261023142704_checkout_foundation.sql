create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  area_description text not null default '',
  pincodes text[] not null default '{}',
  delivery_fee_paise integer not null default 3000 check (delivery_fee_paise >= 0),
  free_above_paise integer not null default 49900 check (free_above_paise >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_windows (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  start_time time not null,
  end_time time not null,
  cutoff_minutes integer not null default 120 check (cutoff_minutes >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  discount_type text not null check (discount_type in ('percent', 'flat')),
  value_paise_or_bps integer not null check (value_paise_or_bps > 0),
  min_order_paise integer not null default 0 check (min_order_paise >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (usage_limit is null or used_count <= usage_limit)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid,
  session_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (profile_id is not null or session_id is not null)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique check (order_number ~ '^PBU-[0-9]{6}-[0-9]{4}$'),
  idempotency_key uuid not null unique,
  profile_id uuid,
  contact_name text not null check (length(trim(contact_name)) between 2 and 100),
  contact_phone text not null check (contact_phone ~ '^[6-9][0-9]{9}$'),
  email text check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  zone_id uuid not null references public.zones(id) on delete restrict,
  address_snapshot jsonb not null,
  slot_date date not null,
  slot_window_id uuid not null references public.delivery_windows(id) on delete restrict,
  subtotal_paise integer not null check (subtotal_paise >= 0),
  delivery_fee_paise integer not null check (delivery_fee_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  tax_paise integer not null default 0 check (tax_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  coupon_id uuid references public.coupons(id) on delete set null,
  payment_method text not null check (payment_method in ('cod', 'upi', 'card')),
  payment_status text not null default 'due_on_delivery' check (payment_status in ('due_on_delivery', 'pending', 'paid', 'failed', 'refunded')),
  status text not null default 'placed' check (status in ('placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  notes text check (notes is null or length(notes) <= 300),
  delivery_person_name text,
  delivery_person_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_paise = subtotal_paise + delivery_fee_paise - discount_paise),
  check ((delivery_person_name is null and delivery_person_phone is null) or status in ('out_for_delivery', 'delivered'))
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  name_snapshot text not null,
  size_snapshot text not null,
  colour_snapshot text not null,
  price_paise integer not null check (price_paise >= 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total_paise integer not null check (line_total_paise = price_paise * quantity),
  created_at timestamptz not null default now()
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  actor_id uuid,
  note text check (note is null or length(note) <= 500),
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carts_profile_id_idx on public.carts(profile_id);
create index cart_items_cart_id_idx on public.cart_items(cart_id);
create index orders_profile_id_created_idx on public.orders(profile_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_supplier_id_idx on public.order_items(supplier_id);
create index order_events_order_created_idx on public.order_events(order_id, created_at);

alter table public.zones enable row level security;
alter table public.delivery_windows enable row level security;
alter table public.coupons enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.settings enable row level security;

create policy "Public can read active zones"
on public.zones for select to anon, authenticated
using (is_active);

create policy "Public can read active delivery windows"
on public.delivery_windows for select to anon, authenticated
using (is_active);

create policy "Public can read store settings"
on public.settings for select to anon, authenticated
using (key in ('delivery', 'returns', 'payments'));

revoke all on public.zones, public.delivery_windows, public.coupons, public.carts,
  public.cart_items, public.orders, public.order_items, public.order_events, public.settings
  from anon, authenticated;

grant select on public.zones, public.delivery_windows, public.settings to anon, authenticated;

comment on table public.coupons is 'Coupons are validated only by trusted server code; no public table access.';
comment on table public.orders is 'Customer details are private. Public tracking is served by a route that returns a minimised projection.';
comment on column public.orders.idempotency_key is 'Unique client request key preventing duplicate order creation.';
