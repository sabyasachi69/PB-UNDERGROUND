import { randomInt, randomUUID } from "node:crypto";

import { products } from "@/data/products";
import {
  canTransitionOrderStatus,
  checkDeliveryZone,
  getAvailableDeliverySlots,
  quoteCart,
  type OrderStatus,
} from "@/lib/commerce";
import type { CreateOrderInput } from "@/lib/commerce-schema";
import type { TrackingOrder } from "@/lib/order-types";

type PrivateOrder = TrackingOrder & {
  idempotencyKey: string;
  contactPhone: string;
  email: string | null;
  address: CreateOrderInput["address"];
  notes: string | null;
  paymentAttemptToken: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  stockReleasedAt: string | null;
};

type DemoOrderState = {
  stock: Map<string, number>;
  orders: Map<string, PrivateOrder>;
  idempotency: Map<string, string>;
  providerOrders: Map<string, string>;
  webhookEvents: Set<string>;
};

const globalForOrders = globalThis as typeof globalThis & {
  __pbUndergroundDemoOrders?: DemoOrderState;
};

function initialState(): DemoOrderState {
  return {
    stock: new Map(products.flatMap((product) => product.variants.map((variant) => [variant.id, variant.stockQty]))),
    orders: new Map(),
    idempotency: new Map(),
    providerOrders: new Map(),
    webhookEvents: new Set(),
  };
}

const state = globalForOrders.__pbUndergroundDemoOrders ?? initialState();
state.providerOrders ??= new Map();
state.webhookEvents ??= new Set();
globalForOrders.__pbUndergroundDemoOrders = state;

const trackingLabels: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed by supplier",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const standardTimeline: readonly OrderStatus[] = ["placed", "confirmed", "packed", "out_for_delivery", "delivered"];

function orderNumber(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const date = `${value("year")}${value("month")}${value("day")}`;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `PBU-${date}-${randomInt(0, 10_000).toString().padStart(4, "0")}`;
    if (!state.orders.has(candidate)) return candidate;
  }
  throw new Error("Could not allocate an order number. Please try again.");
}

export function getDemoStock(now = new Date()) {
  expirePaymentReservations(now);
  return new Map(state.stock);
}

export function createDemoOrder(
  input: CreateOrderInput,
  now = new Date(),
  paymentProvider: "razorpay" | "simulator" = "simulator",
) {
  expirePaymentReservations(now);
  const existingOrderNumber = state.idempotency.get(input.idempotencyKey);
  if (existingOrderNumber) {
    const existingOrder = state.orders.get(existingOrderNumber);
    if (existingOrder) return { order: toTrackingOrder(existingOrder), replayed: true };
  }

  const zoneCheck = checkDeliveryZone(input.zoneId, input.address.pincode);
  if (!zoneCheck.serviceable || !zoneCheck.zone) {
    throw new Error("That address is outside the selected delivery zone.");
  }
  const slot = getAvailableDeliverySlots(now).find((item) => item.id === input.slotId);
  if (!slot) throw new Error("That delivery slot is no longer available. Choose another slot.");

  const quote = quoteCart(input.lines, input.zoneId, input.couponCode, state.stock);
  if (!quote.isCheckoutReady) {
    throw new Error(quote.errors[0] ?? "The order could not be validated.");
  }

  for (const line of quote.lines) {
    state.stock.set(line.variantId, (state.stock.get(line.variantId) ?? 0) - line.quantity);
  }

  const placedAt = now.toISOString();
  const number = orderNumber(now);
  const order: PrivateOrder = {
    orderNumber: number,
    idempotencyKey: input.idempotencyKey,
    firstName: input.contact.name.trim().split(/\s+/)[0] ?? "Guest",
    contactPhone: input.contact.phone,
    email: input.contact.email || null,
    address: input.address,
    notes: input.notes || null,
    area: input.address.landmark?.trim() || input.address.line2?.trim() || zoneCheck.zone.area,
    zoneName: zoneCheck.zone.name,
    status: "placed",
    placedAt,
    slotDate: slot.date,
    slotDateLabel: slot.dateLabel,
    slotLabel: slot.label,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "cod" ? "due_on_delivery" : "pending",
    paymentProvider: input.paymentMethod === "upi" ? paymentProvider : null,
    paymentExpiresAt: input.paymentMethod === "upi" ? new Date(now.getTime() + 15 * 60_000).toISOString() : null,
    paymentAttemptToken: input.paymentMethod === "upi" ? randomUUID() : null,
    providerOrderId: input.paymentMethod === "upi" && paymentProvider === "simulator" ? `order_test_${randomUUID().replaceAll("-", "").slice(0, 18)}` : null,
    providerPaymentId: null,
    stockReleasedAt: null,
    subtotalInPaise: quote.subtotalInPaise,
    discountInPaise: quote.discountInPaise,
    deliveryFeeInPaise: quote.deliveryFeeInPaise,
    totalInPaise: quote.totalInPaise,
    couponCode: quote.coupon?.code ?? null,
    items: quote.lines.map((line) => ({
      variantId: line.variantId,
      productSlug: line.productSlug,
      name: line.productName,
      size: line.size,
      colour: line.colour,
      quantity: line.quantity,
      lineTotalInPaise: line.lineTotalInPaise,
    })),
    events: standardTimeline.map((status) => ({
      status,
      label: trackingLabels[status],
      timestamp: status === "placed" ? placedAt : null,
    })),
    deliveryPerson: null,
  };
  state.orders.set(number, order);
  state.idempotency.set(input.idempotencyKey, number);
  if (order.providerOrderId) state.providerOrders.set(order.providerOrderId, number);
  return { order: toTrackingOrder(order), replayed: false };
}

function toTrackingOrder(order: PrivateOrder): TrackingOrder {
  return {
    orderNumber: order.orderNumber,
    firstName: order.firstName,
    area: order.area,
    zoneName: order.zoneName,
    status: order.status,
    placedAt: order.placedAt,
    slotDate: order.slotDate,
    slotDateLabel: order.slotDateLabel,
    slotLabel: order.slotLabel,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentExpiresAt: order.paymentExpiresAt,
    subtotalInPaise: order.subtotalInPaise,
    discountInPaise: order.discountInPaise,
    deliveryFeeInPaise: order.deliveryFeeInPaise,
    totalInPaise: order.totalInPaise,
    couponCode: order.couponCode,
    items: order.items.map((item) => ({ ...item })),
    events: order.events.map((event) => ({ ...event })),
    deliveryPerson: order.deliveryPerson ? { ...order.deliveryPerson } : null,
  };
}

export function getDemoTrackingOrder(number: string, now = new Date()) {
  expirePaymentReservations(now);
  const order = state.orders.get(number.toUpperCase());
  return order ? toTrackingOrder(order) : null;
}

function releaseReservedStock(order: PrivateOrder, now: Date) {
  if (order.stockReleasedAt || order.paymentMethod !== "upi") return false;
  for (const item of order.items) {
    state.stock.set(item.variantId, (state.stock.get(item.variantId) ?? 0) + item.quantity);
  }
  order.stockReleasedAt = now.toISOString();
  return true;
}

function failOrderPayment(order: PrivateOrder, now: Date) {
  if (order.paymentStatus === "paid" || order.paymentStatus === "failed") return false;
  order.paymentStatus = "failed";
  order.status = "cancelled";
  releaseReservedStock(order, now);
  const existingEvent = order.events.find((item) => item.status === "cancelled");
  if (existingEvent) existingEvent.timestamp ??= now.toISOString();
  else order.events.push({ status: "cancelled", label: trackingLabels.cancelled, timestamp: now.toISOString() });
  return true;
}

function expirePaymentReservations(now: Date) {
  for (const order of state.orders.values()) {
    if (
      order.paymentStatus === "pending" &&
      order.paymentExpiresAt &&
      new Date(order.paymentExpiresAt).getTime() <= now.getTime()
    ) {
      failOrderPayment(order, now);
    }
  }
}

function paymentOrder(number: string, attemptToken?: string, now = new Date()) {
  expirePaymentReservations(now);
  const order = state.orders.get(number.toUpperCase());
  if (!order || order.paymentMethod !== "upi") throw new Error("UPI payment order not found.");
  if (attemptToken && order.paymentAttemptToken !== attemptToken) throw new Error("Payment attempt could not be verified.");
  return order;
}

export function attachDemoProviderOrder(number: string, providerOrderId: string, attemptToken: string) {
  const order = paymentOrder(number, attemptToken);
  if (order.providerOrderId && order.providerOrderId !== providerOrderId) {
    throw new Error("A different payment order is already attached.");
  }
  order.providerOrderId = providerOrderId;
  state.providerOrders.set(providerOrderId, order.orderNumber);
  return toTrackingOrder(order);
}

export function getDemoPaymentLaunch(number: string, keyId?: string) {
  const order = paymentOrder(number);
  if (!order.paymentProvider || !order.paymentAttemptToken || !order.providerOrderId || !order.paymentExpiresAt) {
    throw new Error("The payment session is not ready.");
  }
  return {
    provider: order.paymentProvider,
    attemptToken: order.paymentAttemptToken,
    providerOrderId: order.providerOrderId,
    amountInPaise: order.totalInPaise,
    currency: "INR" as const,
    expiresAt: order.paymentExpiresAt,
    ...(keyId ? { keyId } : {}),
  };
}

export function getDemoPaymentSetup(number: string) {
  const order = paymentOrder(number);
  if (!order.paymentProvider || !order.paymentAttemptToken) throw new Error("The payment session is not ready.");
  return {
    provider: order.paymentProvider,
    attemptToken: order.paymentAttemptToken,
    amountInPaise: order.totalInPaise,
  };
}

export function getDemoPaymentContext(number: string, attemptToken: string, now = new Date()) {
  const order = paymentOrder(number, attemptToken, now);
  if (!order.providerOrderId) throw new Error("The payment session is not ready.");
  return {
    provider: order.paymentProvider,
    providerOrderId: order.providerOrderId,
    paymentStatus: order.paymentStatus,
    totalInPaise: order.totalInPaise,
  };
}

export function confirmDemoPayment(number: string, paymentId: string, attemptToken: string, now = new Date()) {
  const order = paymentOrder(number, attemptToken, now);
  if (order.paymentStatus === "failed") throw new Error("This payment reservation has expired or failed.");
  if (order.paymentStatus === "paid") return { order: toTrackingOrder(order), changed: false };
  order.paymentStatus = "paid";
  order.providerPaymentId = paymentId;
  return { order: toTrackingOrder(order), changed: true };
}

export function failDemoPayment(number: string, attemptToken: string, now = new Date()) {
  const order = paymentOrder(number, attemptToken, now);
  const changed = failOrderPayment(order, now);
  return { order: toTrackingOrder(order), changed };
}

export function completeSimulatedPayment(
  number: string,
  attemptToken: string,
  outcome: "success" | "failure",
  now = new Date(),
) {
  const context = getDemoPaymentContext(number, attemptToken, now);
  if (context.provider !== "simulator") throw new Error("This endpoint only completes local simulated payments.");
  if (outcome === "failure") return failDemoPayment(number, attemptToken, now);
  return confirmDemoPayment(number, `pay_test_${randomUUID().replaceAll("-", "").slice(0, 18)}`, attemptToken, now);
}

export function processDemoWebhook(input: {
  eventId: string;
  event: string;
  providerOrderId: string | null;
  paymentId: string | null;
  amountInPaise?: number | null;
  currency?: string | null;
  now?: Date;
}) {
  if (state.webhookEvents.has(input.eventId)) return { replayed: true, order: null };
  const now = input.now ?? new Date();
  expirePaymentReservations(now);
  let trackedOrder: TrackingOrder | null = null;
  const number = input.providerOrderId ? state.providerOrders.get(input.providerOrderId) : undefined;
  const order = number ? state.orders.get(number) : undefined;
  if (order) {
    const paidEventMatchesOrder =
      input.amountInPaise === order.totalInPaise && input.currency === "INR";
    if (
      (input.event === "payment.captured" || input.event === "order.paid") &&
      order.paymentStatus === "pending" &&
      paidEventMatchesOrder
    ) {
      order.paymentStatus = "paid";
      order.providerPaymentId = input.paymentId;
    } else if (input.event === "payment.failed") {
      const changed = failOrderPayment(order, now);
      if (changed) order.providerPaymentId = input.paymentId;
    }
    trackedOrder = toTrackingOrder(order);
  }
  state.webhookEvents.add(input.eventId);
  return { replayed: false, order: trackedOrder };
}

export function transitionDemoOrder(number: string, nextStatus: OrderStatus, now = new Date()) {
  const order = state.orders.get(number.toUpperCase());
  if (!order) throw new Error("Order not found.");
  if (!canTransitionOrderStatus(order.status, nextStatus)) {
    throw new Error(`Order cannot move from ${order.status} to ${nextStatus}.`);
  }
  order.status = nextStatus;
  const event = order.events.find((item) => item.status === nextStatus);
  if (event) event.timestamp = now.toISOString();
  else order.events.push({ status: nextStatus, label: trackingLabels[nextStatus], timestamp: now.toISOString() });
  return toTrackingOrder(order);
}
