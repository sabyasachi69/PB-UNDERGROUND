import { describe, expect, it } from "vitest";

import { products } from "@/data/products";
import { getAvailableDeliverySlots } from "@/lib/commerce";
import { createDemoOrder, getDemoPublicTrackingOrder, getDemoStock, getDemoTrackingOrder } from "@/lib/demo-order-store";

describe("COD order creation", () => {
  it("keeps sample stock available across idempotent demo requests", () => {
    const now = new Date("2026-10-23T01:00:00.000Z");
    const variant = products.find((product) => product.slug === "gate-seven-hoodie")!.variants[0];
    const before = getDemoStock().get(variant.id);
    const slot = getAvailableDeliverySlots(now)[0];
    const input = {
      idempotencyKey: "12345678-1234-4234-8234-123456789012",
      lines: [{ variantId: variant.id, quantity: 1 }],
      contact: { name: "Priya Sharma", phone: "9876543210", email: "priya@example.com" },
      address: { line1: "Block 12, Room 204", landmark: "Hostel gate", pincode: "144411" },
      zoneId: "girls-hostels",
      slotId: slot.id,
      paymentMethod: "cod" as const,
    };

    const first = createDemoOrder(input, now);
    const replay = createDemoOrder(input, now);

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.order.orderNumber).toBe(first.order.orderNumber);
    expect(replay.trackingToken).toBe(first.trackingToken);
    expect(first.trackingToken).not.toBe(first.order.orderNumber);
    expect(first.order.orderNumber).toMatch(/^PBU-261023-\d{4}$/);
    expect(getDemoStock().get(variant.id)).toBe(before);
    expect(getDemoTrackingOrder(first.order.orderNumber)?.firstName).toBe("Priya");
    expect(getDemoPublicTrackingOrder(first.order.orderNumber, "wrong-token")).toBeNull();
    const publicOrder = getDemoPublicTrackingOrder(first.order.orderNumber, first.trackingToken);
    expect(publicOrder?.firstName).toBe("Priya");
    expect(publicOrder).not.toHaveProperty("items");
    expect(publicOrder).not.toHaveProperty("totalInPaise");
  });
});
