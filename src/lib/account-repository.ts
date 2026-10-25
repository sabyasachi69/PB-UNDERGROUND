import "server-only";

import { randomUUID } from "node:crypto";

import type { AccountOrder, AccountSnapshot, AccountUser, ReturnRequest, SavedAddress, WishlistEntry } from "@/lib/account-types";
import { findCatalogueVariantByIdentity, findCatalogueVariantByLocalId } from "@/lib/catalogue-identifiers";
import { demoAccounts } from "@/lib/demo-account-store";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type SupabaseVariantRow = {
  id: string;
  size: string;
  colour: string;
  price_paise: number | null;
  products: { slug: string; name: string; price_paise: number } | null;
};

function addressFromRow(row: Record<string, unknown>): SavedAddress {
  return {
    id: String(row.id),
    label: String(row.label),
    recipientName: String(row.recipient_name),
    phone: String(row.phone),
    line1: String(row.line1),
    line2: row.line2 ? String(row.line2) : null,
    landmark: row.landmark ? String(row.landmark) : null,
    pincode: String(row.pincode),
    zoneId: row.zone_id ? String(row.zone_id) : null,
    isDefault: Boolean(row.is_default),
  };
}

export async function getAccountSnapshot(user: AccountUser): Promise<AccountSnapshot> {
  if (!isSupabaseConfigured()) return demoAccounts.snapshot(user.id);
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const [addressesResult, wishlistResult, ordersResult, returnsResult] = await Promise.all([
    supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at"),
    supabase.from("wishlists").select("variant_id, created_at, product_variants(id, size, colour, price_paise, products(slug, name, price_paise))").order("created_at", { ascending: false }),
    supabase.from("orders").select("id, order_number, status, payment_status, total_paise, created_at, updated_at, order_items(id, variant_id, name_snapshot, size_snapshot, colour_snapshot, quantity, line_total_paise, products(slug))").order("created_at", { ascending: false }),
    supabase.from("returns").select("id, order_id, reason, details, photo_urls, status, created_at, orders(order_number)").order("created_at", { ascending: false }),
  ]);
  const failure = addressesResult.error ?? wishlistResult.error ?? ordersResult.error ?? returnsResult.error;
  if (failure) throw new Error(failure.message);

  const wishlist: WishlistEntry[] = (wishlistResult.data ?? []).flatMap((row) => {
    const variant = row.product_variants as unknown as SupabaseVariantRow | null;
    if (!variant?.products) return [];
    const localVariant = findCatalogueVariantByIdentity(variant.products.slug, variant.size, variant.colour);
    if (!localVariant) return [];
    return [{
      variantId: localVariant.variant.id,
      productSlug: variant.products.slug,
      productName: variant.products.name,
      size: variant.size,
      colour: variant.colour,
      priceInPaise: variant.price_paise ?? variant.products.price_paise,
      addedAt: row.created_at,
    }];
  });

  const orders: AccountOrder[] = (ordersResult.data ?? []).map((row) => {
    const deliveredAt = row.status === "delivered" ? row.updated_at : null;
    return {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      paymentStatus: row.payment_status,
      totalInPaise: row.total_paise,
      placedAt: row.created_at,
      deliveredAt,
      returnEligibleUntil: deliveredAt ? new Date(Date.parse(deliveredAt) + 48 * 60 * 60_000).toISOString() : null,
      items: (row.order_items ?? []).map((item) => {
        const productSlug = (item.products as unknown as { slug?: string } | null)?.slug ?? "shop";
        const localVariant = findCatalogueVariantByIdentity(productSlug, item.size_snapshot, item.colour_snapshot);
        return {
          id: item.id,
          variantId: localVariant?.variant.id ?? item.variant_id,
          productSlug,
          name: item.name_snapshot,
          size: item.size_snapshot,
          colour: item.colour_snapshot,
          quantity: item.quantity,
          lineTotalInPaise: item.line_total_paise,
        };
      }),
    };
  });

  const returnRequests: ReturnRequest[] = (returnsResult.data ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    orderNumber: (row.orders as unknown as { order_number?: string } | null)?.order_number ?? "Order",
    reason: row.reason,
    details: row.details,
    photoUrls: row.photo_urls,
    status: row.status,
    createdAt: row.created_at,
  }));

  return {
    runtime: "supabase",
    user,
    addresses: (addressesResult.data ?? []).map((row) => addressFromRow(row)),
    orders,
    wishlist,
    returns: returnRequests,
  };
}

export async function updateAccountProfile(user: AccountUser, input: { displayName: string; phone: string | null }) {
  if (!isSupabaseConfigured()) return demoAccounts.updateProfile(user.id, input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!.from("profiles").update({ display_name: input.displayName, phone: input.phone, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) throw new Error(error.message);
  return { ...user, ...input };
}

export async function addAccountAddress(user: AccountUser, input: Omit<SavedAddress, "id">) {
  if (!isSupabaseConfigured()) return demoAccounts.addAddress(user.id, input);
  const supabase = await createSupabaseServerClient();
  if (input.isDefault) {
    const { error } = await supabase!.from("addresses").update({ is_default: false }).eq("profile_id", user.id).eq("is_default", true);
    if (error) throw new Error(error.message);
  }
  const { data, error } = await supabase!.from("addresses").insert({
    profile_id: user.id,
    label: input.label,
    recipient_name: input.recipientName,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2,
    landmark: input.landmark,
    pincode: input.pincode,
    zone_id: input.zoneId,
    is_default: input.isDefault,
  }).select().single();
  if (error) throw new Error(error.message);
  return addressFromRow(data);
}

export async function removeAccountAddress(user: AccountUser, addressId: string) {
  if (!isSupabaseConfigured()) return demoAccounts.removeAddress(user.id, addressId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase!.from("addresses").delete().eq("id", addressId).eq("profile_id", user.id).select("id").maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function addAccountWishlistItem(user: AccountUser, localVariantId: string) {
  if (!isSupabaseConfigured()) return demoAccounts.addWishlist(user.id, localVariantId);
  const local = findCatalogueVariantByLocalId(localVariantId);
  if (!local) throw new Error("That product variant no longer exists.");
  const supabase = await createSupabaseServerClient();
  const { data: productRow, error: productError } = await supabase!.from("products").select("id").eq("slug", local.product.slug).single();
  if (productError) throw new Error(productError.message);
  const { data: variant, error: variantError } = await supabase!.from("product_variants").select("id").eq("product_id", productRow.id).eq("size", local.variant.size).eq("colour", local.variant.colour.name).single();
  if (variantError) throw new Error(variantError.message);
  const { error } = await supabase!.from("wishlists").upsert({ profile_id: user.id, variant_id: variant.id });
  if (error) throw new Error(error.message);
  return { variantId: localVariantId };
}

export async function removeAccountWishlistItem(user: AccountUser, localVariantId: string) {
  if (!isSupabaseConfigured()) return demoAccounts.removeWishlist(user.id, localVariantId);
  const local = findCatalogueVariantByLocalId(localVariantId);
  if (!local) return false;
  const supabase = await createSupabaseServerClient();
  const { data: productRow, error: productError } = await supabase!.from("products").select("id").eq("slug", local.product.slug).single();
  if (productError) throw new Error(productError.message);
  const { data: variant, error: variantError } = await supabase!.from("product_variants").select("id").eq("product_id", productRow.id).eq("size", local.variant.size).eq("colour", local.variant.colour.name).single();
  if (variantError) throw new Error(variantError.message);
  const { data, error } = await supabase!.from("wishlists").delete().eq("profile_id", user.id).eq("variant_id", variant.id).select("variant_id").maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

function decodeEvidence(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
  if (!match) throw new Error("Return evidence must be a JPEG, PNG or WebP image.");
  return { extension: match[1] === "jpeg" ? "jpg" : match[1], content: Buffer.from(match[2], "base64") };
}

export async function createAccountReturn(user: AccountUser, input: { orderId: string; itemIds: string[]; reason: "size" | "defect"; details: string; photos: string[] }) {
  if (!isSupabaseConfigured()) return demoAccounts.createReturn(user.id, input);
  const supabase = await createSupabaseServerClient();
  const requestId = randomUUID();
  const uploaded: string[] = [];
  for (const [index, photo] of input.photos.entries()) {
    const file = decodeEvidence(photo);
    if (file.content.byteLength > 2_097_152) throw new Error("Each return photo must be 2 MB or smaller.");
    const path = `${user.id}/${requestId}/${index + 1}.${file.extension}`;
    const { error } = await supabase!.storage.from("return-evidence").upload(path, file.content, { contentType: `image/${file.extension === "jpg" ? "jpeg" : file.extension}`, upsert: false });
    if (error) throw new Error(error.message);
    uploaded.push(path);
  }
  const { data, error } = await supabase!.from("returns").insert({
    id: requestId,
    order_id: input.orderId,
    profile_id: user.id,
    item_ids: input.itemIds,
    reason: input.reason,
    details: input.details,
    photo_urls: uploaded,
  }).select("id, order_id, reason, details, photo_urls, status, created_at, orders(order_number)").single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    orderId: data.order_id,
    orderNumber: (data.orders as unknown as { order_number?: string } | null)?.order_number ?? "Order",
    reason: data.reason,
    details: data.details,
    photoUrls: data.photo_urls,
    status: data.status,
    createdAt: data.created_at,
  } as ReturnRequest;
}
