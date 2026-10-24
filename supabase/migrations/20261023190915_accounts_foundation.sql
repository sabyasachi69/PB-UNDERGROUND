create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 2 and 80),
  phone text check (phone is null or phone ~ '^[6-9][0-9]{9}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carts
  add constraint carts_profile_id_fkey foreign key (profile_id) references public.profiles(id) on delete cascade;

alter table public.orders
  add constraint orders_profile_id_fkey foreign key (profile_id) references public.profiles(id) on delete set null;

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (length(trim(label)) between 2 and 30),
  recipient_name text not null check (length(trim(recipient_name)) between 2 and 100),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  line1 text not null check (length(trim(line1)) between 5 and 150),
  line2 text check (line2 is null or length(line2) <= 150),
  landmark text check (landmark is null or length(landmark) <= 120),
  pincode text not null check (pincode ~ '^[0-9]{6}$'),
  zone_id uuid references public.zones(id) on delete set null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index addresses_one_default_per_profile_idx
  on public.addresses(profile_id) where is_default;
create index addresses_profile_created_idx on public.addresses(profile_id, created_at);

create table public.wishlists (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, variant_id)
);

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  item_ids uuid[] not null check (cardinality(item_ids) between 1 and 20),
  reason text not null check (reason in ('size', 'defect')),
  details text not null check (length(trim(details)) between 10 and 500),
  photo_urls text[] not null check (cardinality(photo_urls) between 1 and 3),
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'refunded', 'exchanged')),
  resolution text check (resolution is null or length(resolution) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, profile_id)
);

create index returns_profile_created_idx on public.returns(profile_id, created_at desc);
create index returns_status_created_idx on public.returns(status, created_at);

create function private.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

revoke all on function private.handle_new_customer() from public, anon, authenticated;

create trigger on_auth_customer_created
  after insert on auth.users
  for each row execute function private.handle_new_customer();

create function private.enforce_customer_address_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.profiles where id = new.profile_id for update;
  if (select count(*) from public.addresses where profile_id = new.profile_id) >= 5 then
    raise exception 'A customer can save at most five addresses.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_customer_address_limit() from public, anon, authenticated;

create trigger customer_address_limit
  before insert on public.addresses
  for each row execute function private.enforce_customer_address_limit();

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.returns enable row level security;

create policy "Customers read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Customers update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Customers read their own addresses"
on public.addresses for select to authenticated
using ((select auth.uid()) = profile_id);

create policy "Customers add their own addresses"
on public.addresses for insert to authenticated
with check ((select auth.uid()) = profile_id);

create policy "Customers update their own addresses"
on public.addresses for update to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "Customers delete their own addresses"
on public.addresses for delete to authenticated
using ((select auth.uid()) = profile_id);

create policy "Customers read their own wishlist"
on public.wishlists for select to authenticated
using ((select auth.uid()) = profile_id);

create policy "Customers add their own wishlist items"
on public.wishlists for insert to authenticated
with check ((select auth.uid()) = profile_id);

create policy "Customers remove their own wishlist items"
on public.wishlists for delete to authenticated
using ((select auth.uid()) = profile_id);

create policy "Customers read their own orders"
on public.orders for select to authenticated
using ((select auth.uid()) = profile_id);

create policy "Customers read items from their own orders"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id and orders.profile_id = (select auth.uid())
  )
);

create policy "Customers read events from their own orders"
on public.order_events for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_events.order_id and orders.profile_id = (select auth.uid())
  )
);

create policy "Customers read their own returns"
on public.returns for select to authenticated
using ((select auth.uid()) = profile_id);

create policy "Customers request returns for their own orders"
on public.returns for insert to authenticated
with check (
  (select auth.uid()) = profile_id
  and exists (
    select 1 from public.orders
    where orders.id = returns.order_id
      and orders.profile_id = (select auth.uid())
      and orders.status = 'delivered'
      and orders.updated_at >= now() - interval '48 hours'
  )
);

revoke all on public.profiles, public.addresses, public.wishlists, public.returns from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, insert, delete on public.wishlists to authenticated;
grant select, insert on public.returns to authenticated;
grant select on public.orders, public.order_items, public.order_events to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('return-evidence', 'return-evidence', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Customers upload their own return evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'return-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Customers read their own return evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'return-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

comment on table public.profiles is 'Customer profile data keyed to Supabase Auth users; roles never come from editable user metadata.';
comment on table public.returns is 'Customer return or exchange requests. API and RLS enforce ownership and the 48-hour delivered-order window.';
