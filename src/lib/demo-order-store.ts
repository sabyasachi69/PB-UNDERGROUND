import { randomInt } from "node:crypto";

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
};

type DemoOrderState = {
  stock: Map<string, number>;
  orders: Map<string, PrivateOrder>;
  idempotency: Map<string, string>;
};

const globalForOrders = globalThis as typeof globalThis & {
  __pbUndergroundDemoOrders?: DemoOrderState;
};

function initialState(): DemoOrderState {
  return {
    stock: new Map(products.flatMap((product) => product.variants.map((variant) => [variant.id, variant.stockQty]))),
    orders: new Map(),
    idempotency: new Map(),
  };
}

const state = globalForOrders.__pbUndergroundDemoOrders ?? initialState();
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

export function getDemoStock() {
  return new Map(state.stock);
}

export function createDemoOrder(input: CreateOrderInput, now = new Date()) {
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
    paymentMethod: "cod",
    paymentStatus: "due_on_delivery",
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

export function getDemoTrackingOrder(number: string) {
  const order = state.orders.get(number.toUpperCase());
  return order ? toTrackingOrder(order) : null;
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
