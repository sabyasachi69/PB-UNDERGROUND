import "server-only";

import { randomUUID } from "node:crypto";

import type { AccountOrder, AccountSnapshot, AccountUser, ReturnRequest, SavedAddress, WishlistEntry } from "@/lib/account-types";
import { findCatalogueVariantByIdentity, findCatalogueVariantByLocalId } from "@/lib/catalogue-identifiers";
import { demoAccounts } from "@/lib/demo-account-store";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    supabase.from("orders").select("id, order_number, tracking_token, status, payment_status, total_paise, created_at, updated_at, order_items(id, variant_id, name_snapshot, size_snapshot, colour_snapshot, quantity, line_total_paise, products(slug))").order("created_at", { ascending: false }),
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
      trackingToken: row.tracking_token,
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
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(match[2]) || match[2].length % 4 !== 0) {
    throw new Error("Return evidence is not valid base64 image data.");
  }
  const content = Buffer.from(match[2], "base64");
  const isJpeg = content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  const isPng = content.length >= 8 && content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isWebp = content.length >= 12 && content.toString("ascii", 0, 4) === "RIFF" && content.toString("ascii", 8, 12) === "WEBP";
  if (!(match[1] === "jpeg" ? isJpeg : match[1] === "png" ? isPng : isWebp)) {
    throw new Error("Return evidence does not match its image type.");
  }
  return { extension: match[1] === "jpeg" ? "jpg" : match[1], content };
}

export async function createAccountReturn(user: AccountUser, input: { orderId: string; itemIds: string[]; reason: "size" | "defect"; details: string; photos: string[] }) {
  if (!isSupabaseConfigured()) return demoAccounts.createReturn(user.id, input);
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) throw new Error("Return photo uploads need the server-only Supabase secret key.");
  const { data: order, error: orderError } = await supabase.from("orders")
    .select("id, status, updated_at")
    .eq("id", input.orderId).eq("profile_id", user.id).maybeSingle();
  if (orderError) throw new Error(orderError.message);
  if (!order || order.status !== "delivered" || Date.parse(order.updated_at) < Date.now() - 48 * 60 * 60_000) {
    throw new Error("The 48-hour return window has closed for this order.");
  }
  if (new Set(input.itemIds).size !== input.itemIds.length) throw new Error("Choose each return item only once.");
  const { data: items, error: itemsError } = await supabase.from("order_items")
    .select("id").eq("order_id", input.orderId).in("id", input.itemIds);
  if (itemsError) throw new Error(itemsError.message);
  if (items?.length !== input.itemIds.length) throw new Error("One or more return items do not belong to this order.");
  const { data: existing, error: existingError } = await supabase.from("returns")
    .select("id").eq("order_id", input.orderId).eq("profile_id", user.id).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) throw new Error("A return request already exists for this order.");

  const requestId = randomUUID();
  const uploaded: string[] = [];
  try {
    for (const [index, photo] of input.photos.entries()) {
      const file = decodeEvidence(photo);
      if (file.content.byteLength > 2_097_152) throw new Error("Each return photo must be 2 MB or smaller.");
      const path = `${user.id}/${requestId}/${index + 1}.${file.extension}`;
      const { error } = await admin.storage.from("return-evidence").upload(path, file.content, { contentType: `image/${file.extension === "jpg" ? "jpeg" : file.extension}`, upsert: false });
      if (error) throw new Error(error.message);
      uploaded.push(path);
    }
    const { data, error } = await supabase.from("returns").insert({
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
  } catch (error) {
    if (uploaded.length) {
      const cleanup = await admin.storage.from("return-evidence").remove(uploaded);
      if (cleanup.error) throw new Error("Return request failed and its uploaded photos could not be removed.");
    }
    throw error;
  }
}
