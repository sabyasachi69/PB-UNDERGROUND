-- Customer writes must not set workflow outcomes or claim unrelated order items.
revoke insert on public.returns from public, anon, authenticated;
grant insert (id, order_id, profile_id, item_ids, reason, details, photo_urls)
  on public.returns to authenticated;

drop policy if exists "Customers request returns for their own orders" on public.returns;
create policy "Customers request returns for their own order items"
on public.returns for insert to authenticated
with check (
  (select auth.uid()) = profile_id
  and status = 'requested'
  and resolution is null
  and exists (
    select 1 from public.orders as placed_order
    where placed_order.id = returns.order_id
      and placed_order.profile_id = (select auth.uid())
      and placed_order.status = 'delivered'
      and placed_order.updated_at >= now() - interval '48 hours'
  )
  and cardinality(item_ids) = (
    select count(distinct requested.item_id)
    from unnest(item_ids) as requested(item_id)
  )
  and not exists (
    select 1 from unnest(item_ids) as requested(item_id)
    where not exists (
      select 1 from public.order_items as ordered_item
      where ordered_item.id = requested.item_id
        and ordered_item.order_id = returns.order_id
    )
  )
  and not exists (
    select 1 from unnest(photo_urls) as evidence(path)
    where evidence.path is null
      or evidence.path !~ (
        '^' || returns.profile_id::text || '/' || returns.id::text || '/[1-3][.](jpg|png|webp)$'
      )
      or not exists (
        select 1 from storage.objects as uploaded
        where uploaded.bucket_id = 'return-evidence' and uploaded.name = evidence.path
      )
  )
);

-- These samples have no verified notification workflow or storage quota.
-- Keep notification requests in the browser demo until a controlled API exists.
drop policy if exists "Public can request stock notifications" on public.stock_notifications;
revoke insert on public.stock_notifications from public, anon, authenticated;
revoke insert (product_variant_id, email) on public.stock_notifications from anon, authenticated;

-- Return photos are uploaded only by the server after eligibility checks.
-- The restrictive policy also protects this bucket if other permissive
-- Storage INSERT policies are added later. Service-role uploads bypass RLS.
drop policy if exists "Customers upload their own return evidence" on storage.objects;
create policy "Return evidence uploads require server authorization"
on storage.objects as restrictive for insert to authenticated
with check (bucket_id <> 'return-evidence');
