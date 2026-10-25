import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { products } from "@/data/products";
import { getAvailableDeliverySlots } from "@/lib/commerce";
import {
  attachDemoProviderOrder,
  completeSimulatedPayment,
  createDemoOrder,
  getDemoPaymentSetup,
  getDemoStock,
  getDemoTrackingOrder,
  processDemoWebhook,
} from "@/lib/demo-order-store";
import { paymentSignature, verifyPaymentSignature, verifyWebhookSignature, webhookSignature } from "@/lib/payment-security";

function upiOrderInput(now: Date, variantId: string) {
  return {
    idempotencyKey: randomUUID(),
    lines: [{ variantId, quantity: 1 }],
    contact: { name: "Aman Singh", phone: "9876543210", email: "aman@example.com" },
    address: { line1: "Block 21, Room 404", landmark: "Hostel gate", pincode: "144411" },
    zoneId: "boys-hostels",
    slotId: getAvailableDeliverySlots(now)[0].id,
    paymentMethod: "upi" as const,
  };
}

describe("payment security", () => {
  it("verifies checkout and raw-body webhook signatures without accepting tampering", () => {
    const signature = paymentSignature("order_test_123", "pay_test_123", "checkout-secret");
    expect(verifyPaymentSignature("order_test_123", "pay_test_123", signature, "checkout-secret")).toBe(true);
    expect(verifyPaymentSignature("order_test_123", "pay_changed", signature, "checkout-secret")).toBe(false);

    const rawBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });
    const webhook = webhookSignature(rawBody, "webhook-secret");
    expect(verifyWebhookSignature(rawBody, webhook, "webhook-secret")).toBe(true);
    expect(verifyWebhookSignature(`${rawBody} `, webhook, "webhook-secret")).toBe(false);
  });
});

describe("UPI payment lifecycle", () => {
  it("keeps reserved stock on success and releases it exactly once on failure", () => {
    const now = new Date("2026-10-24T01:00:00.000Z");
    const [successVariant, failureVariant] = products.find((product) => product.slug === "gate-seven-hoodie")!.variants;

    const successBefore = getDemoStock(now).get(successVariant.id)!;
    const successful = createDemoOrder(upiOrderInput(now, successVariant.id), now, "simulator");
    const successSetup = getDemoPaymentSetup(successful.order.orderNumber, now);
    completeSimulatedPayment(successful.order.orderNumber, successSetup.attemptToken, "success", now);
    expect(getDemoTrackingOrder(successful.order.orderNumber, now)?.paymentStatus).toBe("paid");
    expect(getDemoStock(now).get(successVariant.id)).toBe(successBefore - 1);

    const failureBefore = getDemoStock(now).get(failureVariant.id)!;
    const failed = createDemoOrder(upiOrderInput(now, failureVariant.id), now, "simulator");
    const failureSetup = getDemoPaymentSetup(failed.order.orderNumber, now);
    completeSimulatedPayment(failed.order.orderNumber, failureSetup.attemptToken, "failure", now);
    completeSimulatedPayment(failed.order.orderNumber, failureSetup.attemptToken, "failure", now);
    expect(getDemoTrackingOrder(failed.order.orderNumber, now)?.paymentStatus).toBe("failed");
    expect(getDemoStock(now).get(failureVariant.id)).toBe(failureBefore);
  });

  it("expires a pending payment after fifteen minutes and restores stock", () => {
    const now = new Date("2026-10-24T02:00:00.000Z");
    const variant = products.find((product) => product.slug === "workshop-tote")!.variants[0];
    const before = getDemoStock(now).get(variant.id)!;
    const created = createDemoOrder(upiOrderInput(now, variant.id), now, "simulator");
    expect(getDemoStock(now).get(variant.id)).toBe(before - 1);

    const afterExpiry = new Date(now.getTime() + 16 * 60_000);
    expect(getDemoTrackingOrder(created.order.orderNumber, afterExpiry)?.paymentStatus).toBe("failed");
    expect(getDemoStock(afterExpiry).get(variant.id)).toBe(before);
  });

  it("deduplicates webhook replays by Razorpay event ID", () => {
    const now = new Date("2026-10-24T03:00:00.000Z");
    const variant = products.find((product) => product.slug === "everyday-heavy-tee")!.variants[0];
    const created = createDemoOrder(upiOrderInput(now, variant.id), now, "razorpay");
    const setup = getDemoPaymentSetup(created.order.orderNumber, now);
    attachDemoProviderOrder(created.order.orderNumber, "order_rzp_test_replay", setup.attemptToken, now);

    processDemoWebhook({
      eventId: "evt_wrong_amount",
      event: "payment.captured",
      providerOrderId: "order_rzp_test_replay",
      paymentId: "pay_wrong_amount",
      amountInPaise: created.order.totalInPaise - 1,
      currency: "INR",
      now,
    });
    expect(getDemoTrackingOrder(created.order.orderNumber, now)?.paymentStatus).toBe("pending");

    const first = processDemoWebhook({
      eventId: "evt_replay_123",
      event: "payment.captured",
      providerOrderId: "order_rzp_test_replay",
      paymentId: "pay_rzp_test_123",
      amountInPaise: created.order.totalInPaise,
      currency: "INR",
      now,
    });
    const replay = processDemoWebhook({
      eventId: "evt_replay_123",
      event: "payment.failed",
      providerOrderId: "order_rzp_test_replay",
      paymentId: "pay_rzp_test_123",
      amountInPaise: created.order.totalInPaise,
      currency: "INR",
      now,
    });

    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(getDemoTrackingOrder(created.order.orderNumber, now)?.paymentStatus).toBe("paid");
  });
});
