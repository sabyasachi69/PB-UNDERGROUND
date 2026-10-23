alter table public.orders
  add column payment_provider text check (payment_provider is null or payment_provider in ('razorpay')),
  add column provider_order_id text unique,
  add column provider_payment_id text unique,
  add column payment_expires_at timestamptz,
  add column stock_released_at timestamptz,
  add constraint orders_online_payment_shape check (
    (payment_method = 'cod' and payment_provider is null and payment_expires_at is null)
    or
    (payment_method in ('upi', 'card') and payment_provider is not null and payment_expires_at is not null)
  );

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  provider text not null check (provider in ('razorpay')),
  provider_order_id text not null unique,
  provider_payment_id text unique,
  amount_paise integer not null check (amount_paise >= 100),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (paid_at is null or status in ('paid', 'refunded')),
  check (failed_at is null or status = 'failed')
);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 10),
  status text not null default 'active' check (status in ('active', 'committed', 'released')),
  expires_at timestamptz not null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, variant_id),
  check ((status = 'released') = (released_at is not null))
);

create table public.payment_webhook_events (
  provider_event_id text primary key,
  event_type text not null,
  order_id uuid references public.orders(id) on delete set null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

create index payments_status_expires_idx on public.payments(status, expires_at);
create index inventory_reservations_status_expires_idx on public.inventory_reservations(status, expires_at);
create index payment_webhook_events_order_idx on public.payment_webhook_events(order_id, received_at desc);

alter table public.payments enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.payment_webhook_events enable row level security;

revoke all on public.payments, public.inventory_reservations, public.payment_webhook_events from anon, authenticated;

create function public.release_expired_payment_reservations()
returns integer
language sql
security definer
set search_path = ''
as $$
  with released as (
    update public.inventory_reservations
    set status = 'released', released_at = now()
    where status = 'active' and expires_at <= now()
    returning order_id, variant_id, quantity
  ), restored as (
    update public.product_variants as variant
    set stock_qty = variant.stock_qty + totals.quantity
    from (
      select variant_id, sum(quantity)::integer as quantity
      from released
      group by variant_id
    ) as totals
    where variant.id = totals.variant_id
    returning variant.id
  ), failed_payments as (
    update public.payments as payment
    set status = 'failed', failed_at = now(), failure_reason = 'reservation_expired', updated_at = now()
    where payment.order_id in (select distinct order_id from released) and payment.status = 'pending'
    returning payment.order_id
  ), failed_orders as (
    update public.orders as placed_order
    set payment_status = 'failed', status = 'cancelled', stock_released_at = now(), updated_at = now()
    where placed_order.id in (select order_id from failed_payments)
    returning placed_order.id
  )
  select count(*)::integer from released;
$$;

revoke all on function public.release_expired_payment_reservations() from public, anon, authenticated;
grant execute on function public.release_expired_payment_reservations() to service_role;

comment on table public.payment_webhook_events is 'Stores Razorpay event IDs and hashes only, providing replay protection without retaining full webhook payloads.';
comment on function public.release_expired_payment_reservations() is 'Atomically releases expired inventory once and fails the associated pending payment and order.';
