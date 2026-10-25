alter table public.orders
  add column tracking_token uuid not null default gen_random_uuid();

create unique index orders_tracking_token_idx on public.orders(tracking_token);

comment on column public.orders.tracking_token is
  'Unpredictable bearer token required by the public order-tracking route. Never grant anonymous table access.';
