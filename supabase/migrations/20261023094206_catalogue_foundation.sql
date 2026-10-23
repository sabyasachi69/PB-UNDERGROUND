create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  slug text not null unique,
  short_bio text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  commission_bps integer not null default 1200 check (commission_bps between 0 and 10000),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  hero_image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null,
  fabric text not null,
  care text not null,
  price_paise integer not null check (price_paise >= 0),
  compare_at_paise integer check (compare_at_paise is null or compare_at_paise > price_paise),
  gst_bps integer not null default 500 check (gst_bps between 0 and 10000),
  status text not null default 'draft' check (status in ('draft', 'live', 'paused')),
  is_featured boolean not null default false,
  palette text not null default 'paper',
  popularity integer not null default 0 check (popularity >= 0),
  released_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  colour text not null,
  colour_hex text not null check (colour_hex ~ '^#[0-9A-Fa-f]{6}$'),
  sku text not null unique,
  price_paise integer check (price_paise is null or price_paise >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, colour)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text not null check (length(trim(alt_text)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reviewer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (length(trim(body)) between 3 and 2000),
  verified_purchase boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now()
);

create table public.stock_notifications (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  email text not null check (length(email) between 3 and 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (product_variant_id, email)
);

create index products_category_id_idx on public.products(category_id);
create index products_supplier_id_idx on public.products(supplier_id);
create index products_status_released_idx on public.products(status, released_at desc);
create index product_variants_product_id_idx on public.product_variants(product_id);
create index reviews_product_status_idx on public.reviews(product_id, status);

alter table public.suppliers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.reviews enable row level security;
alter table public.stock_notifications enable row level security;

create policy "Public can read approved suppliers"
on public.suppliers for select to anon, authenticated
using (status = 'approved');

create policy "Public can read categories"
on public.categories for select to anon, authenticated
using (true);

create policy "Public can read live products from approved suppliers"
on public.products for select to anon, authenticated
using (
  status = 'live'
  and exists (
    select 1 from public.suppliers
    where suppliers.id = products.supplier_id and suppliers.status = 'approved'
  )
);

create policy "Public can read active variants for live products"
on public.product_variants for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.products
    join public.suppliers on suppliers.id = products.supplier_id
    where products.id = product_variants.product_id
      and products.status = 'live'
      and suppliers.status = 'approved'
  )
);

create policy "Public can read images for live products"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1 from public.products
    join public.suppliers on suppliers.id = products.supplier_id
    where products.id = product_images.product_id
      and products.status = 'live'
      and suppliers.status = 'approved'
  )
);

create policy "Public can read published verified reviews"
on public.reviews for select to anon, authenticated
using (status = 'published' and verified_purchase);

create policy "Public can request stock notifications"
on public.stock_notifications for insert to anon, authenticated
with check (notified_at is null);

revoke all on public.suppliers, public.categories, public.products, public.product_variants,
  public.product_images, public.reviews, public.stock_notifications from anon, authenticated;
grant select on public.suppliers, public.categories, public.products, public.product_variants,
  public.product_images, public.reviews to anon, authenticated;
grant insert (product_variant_id, email) on public.stock_notifications to anon, authenticated;
