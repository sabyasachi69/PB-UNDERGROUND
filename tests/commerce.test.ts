import { describe, expect, it } from "vitest";

import { products } from "@/data/products";
import {
  canTransitionOrderStatus,
  checkDeliveryZone,
  getAvailableDeliverySlots,
  quoteCart,
  validateCoupon,
} from "@/lib/commerce";

const hoodieVariant = products.find((product) => product.slug === "gate-seven-hoodie")?.variants[0];
const soldOutVariant = products.find((product) => product.slug === "canteen-cap")?.variants[0];

describe("commerce rules", () => {
  it("recalculates prices, discounts and delivery on the server", () => {
    expect(hoodieVariant).toBeDefined();
    const quote = quoteCart(
      [{ variantId: hoodieVariant!.id, quantity: 1 }],
      "main-gate",
      "student10",
    );
    expect(quote.subtotalInPaise).toBe(129_900);
    expect(quote.discountInPaise).toBe(12_990);
    expect(quote.deliveryFeeInPaise).toBe(0);
    expect(quote.totalInPaise).toBe(116_910);
    expect(quote.isCheckoutReady).toBe(true);
  });

  it("rejects invalid coupons and insufficient stock", () => {
    expect(() => validateCoupon("NOTREAL", 100_000)).toThrow("not recognised");
    const quote = quoteCart([{ variantId: soldOutVariant!.id, quantity: 1 }], "main-gate");
    expect(quote.isCheckoutReady).toBe(false);
    expect(quote.errors.join(" ")).toContain("only has 0 left");
  });

  it("checks a selected zone and pincode together", () => {
    expect(checkDeliveryZone("boys-hostels", "144411").serviceable).toBe(true);
    expect(checkDeliveryZone("boys-hostels", "110001").serviceable).toBe(false);
  });

  it("removes same-day slots once their cutoff has passed", () => {
    const nineAmIst = new Date("2026-10-23T03:30:00.000Z");
    const slots = getAvailableDeliverySlots(nineAmIst, 1);
    expect(slots.map((slot) => slot.windowId)).toEqual(["afternoon", "evening"]);
  });

  it("allows only forward order-status transitions", () => {
    expect(canTransitionOrderStatus("placed", "confirmed")).toBe(true);
    expect(canTransitionOrderStatus("confirmed", "packed")).toBe(true);
    expect(canTransitionOrderStatus("delivered", "packed")).toBe(false);
    expect(canTransitionOrderStatus("cancelled", "confirmed")).toBe(false);
  });
});

