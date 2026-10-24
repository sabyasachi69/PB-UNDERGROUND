import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { addressSchema, loginSchema, registerSchema, returnRequestSchema } from "../src/lib/account-schema";
import { DemoAccountStore } from "../src/lib/demo-account-store";

function user(name: string) {
  return { id: randomUUID(), email: `${name.toLowerCase()}@example.com`, displayName: name, phone: null };
}

function address(index: number) {
  return {
    label: `Gate ${index}`,
    recipientName: "Priya Student",
    phone: "9876543210",
    line1: `${index} Sample Hostel`,
    line2: null,
    landmark: "LPU campus",
    pincode: "144411",
    zoneId: "main-gate",
    isDefault: index === 1,
  };
}

describe("account validation", () => {
  it("accepts a strong signup and rejects weak credentials", () => {
    expect(registerSchema.safeParse({ displayName: "Priya", email: "priya@example.com", password: "campus123" }).success).toBe(true);
    expect(registerSchema.safeParse({ displayName: "P", email: "bad", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "priya@example.com", password: "campus123" }).success).toBe(true);
  });

  it("validates Indian delivery details and photo-backed returns", () => {
    expect(addressSchema.safeParse({ ...address(1), line2: "", landmark: "" }).success).toBe(true);
    expect(addressSchema.safeParse({ ...address(1), phone: "123" }).success).toBe(false);
    expect(returnRequestSchema.safeParse({ orderId: "order-1", itemIds: ["item-1"], reason: "size", details: "Please exchange this size.", photos: ["data:image/png;base64,YQ=="] }).success).toBe(true);
    expect(returnRequestSchema.safeParse({ orderId: "order-1", itemIds: [], reason: "other", details: "No", photos: [] }).success).toBe(false);
  });
});

describe("demo account authorization", () => {
  it("never copies authentication credential fields into the customer profile", () => {
    const store = new DemoAccountStore();
    const priya = { ...user("Credential Boundary"), salt: "private", passwordHash: "private" };
    store.createProfile(priya);
    expect(store.getProfile(priya.id)).toEqual({ id: priya.id, email: priya.email, displayName: priya.displayName, phone: null });
    expect(JSON.stringify(store.snapshot(priya.id))).not.toContain("passwordHash");
  });

  it("keeps addresses and wishlist records scoped to their owner", () => {
    const store = new DemoAccountStore();
    const priya = user("Priya");
    const arjun = user("Arjun");
    store.createProfile(priya);
    store.createProfile(arjun);
    store.addAddress(priya.id, address(1));
    store.addWishlist(priya.id, "everyday-heavy-tee-bone-xs");

    expect(store.listAddresses(priya.id)).toHaveLength(1);
    expect(store.listWishlist(priya.id)).toHaveLength(1);
    expect(store.listAddresses(arjun.id)).toEqual([]);
    expect(store.listWishlist(arjun.id)).toEqual([]);
  });

  it("enforces the five-address cap", () => {
    const store = new DemoAccountStore();
    const priya = user("Five Addresses");
    store.createProfile(priya);
    for (let index = 1; index <= 5; index += 1) store.addAddress(priya.id, address(index));
    expect(() => store.addAddress(priya.id, address(6))).toThrow("up to five addresses");
  });

  it("prevents one customer from returning another customer's order", () => {
    const store = new DemoAccountStore();
    const priya = user("Return Owner");
    const arjun = user("Other Customer");
    store.createProfile(priya);
    store.createProfile(arjun);
    const order = store.listOrders(priya.id).find((item) => item.status === "delivered");
    expect(order).toBeDefined();
    const input = {
      orderId: order!.id,
      itemIds: order!.items.map((item) => item.id),
      reason: "size" as const,
      details: "The delivered sample needs a size exchange.",
      photos: ["data:image/png;base64,YQ=="],
    };
    expect(() => store.createReturn(arjun.id, input)).toThrow("does not belong");
    expect(store.createReturn(priya.id, input).status).toBe("requested");
    expect(() => store.createReturn(priya.id, input)).toThrow("already exists");
  });
});
