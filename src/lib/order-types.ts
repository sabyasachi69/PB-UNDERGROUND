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
  paymentMethod: "cod";
  paymentStatus: "due_on_delivery";
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

