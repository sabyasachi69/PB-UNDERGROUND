import type { OrderStatus } from "@/lib/commerce";

export type TrackingEvent = {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
};

export type TrackingOrder = {
  orderNumber: string;
  firstName: string;
  area: string;
  zoneName: string;
  status: OrderStatus;
  placedAt: string;
  slotDate: string;
  slotDateLabel: string;
  slotLabel: string;
  paymentMethod: "cod" | "upi";
  paymentStatus: "due_on_delivery" | "pending" | "paid" | "failed";
  paymentProvider: "razorpay" | "simulator" | null;
  paymentExpiresAt: string | null;
  subtotalInPaise: number;
  discountInPaise: number;
  deliveryFeeInPaise: number;
  totalInPaise: number;
  couponCode: string | null;
  items: Array<{
    variantId: string;
    productSlug: string;
    name: string;
    size: string;
    colour: string;
    quantity: number;
    lineTotalInPaise: number;
  }>;
  events: TrackingEvent[];
  deliveryPerson: { name: string; phone: string } | null;
};

export type PaymentLaunch = {
  provider: "razorpay" | "simulator";
  attemptToken: string;
  providerOrderId: string;
  amountInPaise: number;
  currency: "INR";
  expiresAt: string;
  keyId?: string;
};

