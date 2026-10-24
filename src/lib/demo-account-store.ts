import { randomUUID } from "node:crypto";

import { products } from "@/data/products";
import type {
  AccountOrder,
  AccountSnapshot,
  AccountUser,
  ReturnRequest,
  SavedAddress,
  WishlistEntry,
} from "@/lib/account-types";
import { getDemoOrdersForProfile } from "@/lib/demo-order-store";

type DemoProfile = AccountUser;

type DemoAccountState = {
  profiles: Map<string, DemoProfile>;
  addresses: Map<string, SavedAddress[]>;
  wishlist: Map<string, WishlistEntry[]>;
  returns: Map<string, ReturnRequest[]>;
};

const globalForAccounts = globalThis as typeof globalThis & { __pbUndergroundDemoAccounts?: DemoAccountState };
const sharedState: DemoAccountState = globalForAccounts.__pbUndergroundDemoAccounts ?? {
  profiles: new Map(),
  addresses: new Map(),
  wishlist: new Map(),
  returns: new Map(),
};
globalForAccounts.__pbUndergroundDemoAccounts = sharedState;

function sampleDeliveredOrder(profileId: string): AccountOrder {
  const product = products[1];
  const variant = product.variants.find((item) => item.stockQty > 0) ?? product.variants[0];
  const deliveredAt = new Date(Date.now() - 60 * 60_000);
  const placedAt = new Date(deliveredAt.getTime() - 5 * 60 * 60_000);
  return {
    id: `sample-delivered-${profileId}`,
    orderNumber: `PBU-SAMPLE-${profileId.slice(0, 4).toUpperCase()}`,
    status: "delivered",
    paymentStatus: "paid",
    totalInPaise: variant.priceInPaise,
    placedAt: placedAt.toISOString(),
    deliveredAt: deliveredAt.toISOString(),
    returnEligibleUntil: new Date(deliveredAt.getTime() + 48 * 60 * 60_000).toISOString(),
    items: [{
      id: `sample-item-${profileId}`,
      variantId: variant.id,
      productSlug: product.slug,
      name: product.name,
      size: variant.size,
      colour: variant.colour.name,
      quantity: 1,
      lineTotalInPaise: variant.priceInPaise,
    }],
  };
}

export class DemoAccountStore {
  constructor(private readonly state: DemoAccountState = sharedState) {}

  createProfile(user: AccountUser) {
    this.state.profiles.set(user.id, {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
    });
    this.state.addresses.set(user.id, []);
    this.state.wishlist.set(user.id, []);
    this.state.returns.set(user.id, []);
  }

  getProfile(profileId: string) {
    const profile = this.state.profiles.get(profileId);
    return profile ? { ...profile } : null;
  }

  updateProfile(profileId: string, input: { displayName: string; phone: string | null }) {
    const profile = this.requireProfile(profileId);
    Object.assign(profile, input);
    return { ...profile };
  }

  listAddresses(profileId: string) {
    this.requireProfile(profileId);
    return (this.state.addresses.get(profileId) ?? []).map((address) => ({ ...address }));
  }

  addAddress(profileId: string, input: Omit<SavedAddress, "id">) {
    this.requireProfile(profileId);
    const addresses = this.state.addresses.get(profileId) ?? [];
    if (addresses.length >= 5) throw new Error("You can save up to five addresses.");
    if (input.isDefault || addresses.length === 0) {
      for (const address of addresses) address.isDefault = false;
    }
    const address = { ...input, id: randomUUID(), isDefault: input.isDefault || addresses.length === 0 };
    addresses.push(address);
    this.state.addresses.set(profileId, addresses);
    return { ...address };
  }

  removeAddress(profileId: string, addressId: string) {
    this.requireProfile(profileId);
    const addresses = this.state.addresses.get(profileId) ?? [];
    const index = addresses.findIndex((address) => address.id === addressId);
    if (index < 0) return false;
    const [removed] = addresses.splice(index, 1);
    if (removed.isDefault && addresses[0]) addresses[0].isDefault = true;
    return true;
  }

  listWishlist(profileId: string) {
    this.requireProfile(profileId);
    return (this.state.wishlist.get(profileId) ?? []).map((entry) => ({ ...entry }));
  }

  addWishlist(profileId: string, variantId: string) {
    this.requireProfile(profileId);
    const match = products.flatMap((product) => product.variants.map((variant) => ({ product, variant })))
      .find(({ variant }) => variant.id === variantId);
    if (!match) throw new Error("That product variant no longer exists.");
    const entries = this.state.wishlist.get(profileId) ?? [];
    const existing = entries.find((entry) => entry.variantId === variantId);
    if (existing) return { ...existing };
    const entry: WishlistEntry = {
      variantId,
      productSlug: match.product.slug,
      productName: match.product.name,
      size: match.variant.size,
      colour: match.variant.colour.name,
      priceInPaise: match.variant.priceInPaise,
      addedAt: new Date().toISOString(),
    };
    entries.unshift(entry);
    this.state.wishlist.set(profileId, entries);
    return { ...entry };
  }

  removeWishlist(profileId: string, variantId: string) {
    this.requireProfile(profileId);
    const entries = this.state.wishlist.get(profileId) ?? [];
    const next = entries.filter((entry) => entry.variantId !== variantId);
    this.state.wishlist.set(profileId, next);
    return next.length !== entries.length;
  }

  listOrders(profileId: string) {
    this.requireProfile(profileId);
    return [
      ...getDemoOrdersForProfile(profileId),
      sampleDeliveredOrder(profileId),
    ].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  }

  getOrder(profileId: string, orderId: string) {
    return this.listOrders(profileId).find((order) => order.id === orderId) ?? null;
  }

  createReturn(profileId: string, input: {
    orderId: string;
    itemIds: string[];
    reason: "size" | "defect";
    details: string;
    photos: string[];
  }) {
    const order = this.getOrder(profileId, input.orderId);
    if (!order) throw new Error("That order does not belong to this account.");
    if (order.status !== "delivered" || !order.returnEligibleUntil || Date.parse(order.returnEligibleUntil) < Date.now()) {
      throw new Error("The 48-hour return window has closed for this order.");
    }
    if (input.itemIds.some((id) => !order.items.some((item) => item.id === id))) {
      throw new Error("One or more return items do not belong to this order.");
    }
    const requests = this.state.returns.get(profileId) ?? [];
    if (requests.some((request) => request.orderId === input.orderId)) {
      throw new Error("A return request already exists for this order.");
    }
    const request: ReturnRequest = {
      id: randomUUID(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason: input.reason,
      details: input.details,
      photoUrls: [...input.photos],
      status: "requested",
      createdAt: new Date().toISOString(),
    };
    requests.unshift(request);
    this.state.returns.set(profileId, requests);
    return { ...request, photoUrls: [...request.photoUrls] };
  }

  deleteProfile(profileId: string) {
    const existed = this.state.profiles.delete(profileId);
    this.state.addresses.delete(profileId);
    this.state.wishlist.delete(profileId);
    this.state.returns.delete(profileId);
    return existed;
  }

  snapshot(profileId: string): AccountSnapshot {
    const user = this.requireProfile(profileId);
    return {
      runtime: "demo",
      user: { ...user },
      addresses: this.listAddresses(profileId),
      orders: this.listOrders(profileId),
      wishlist: this.listWishlist(profileId),
      returns: (this.state.returns.get(profileId) ?? []).map((request) => ({ ...request, photoUrls: [...request.photoUrls] })),
    };
  }

  private requireProfile(profileId: string) {
    const profile = this.state.profiles.get(profileId);
    if (!profile) throw new Error("Account not found.");
    return profile;
  }
}

export const demoAccounts = new DemoAccountStore();
