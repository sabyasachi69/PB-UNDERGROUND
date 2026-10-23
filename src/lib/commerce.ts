import { products } from "@/data/products";

export type CartInputLine = {
  variantId: string;
  quantity: number;
};

export type DeliveryZone = {
  id: string;
  name: string;
  area: string;
  pincodes: readonly string[];
  deliveryFeeInPaise: number;
  freeAboveInPaise: number;
  isActive: boolean;
};

export type DeliverySlot = {
  id: string;
  date: string;
  dateLabel: string;
  windowId: string;
  label: string;
  startsAt: string;
  endsAt: string;
};

export type CouponResult = {
  code: string;
  label: string;
  discountInPaise: number;
};

export type QuotedCartLine = {
  variantId: string;
  productSlug: string;
  productName: string;
  supplierName: string;
  size: string;
  colour: string;
  palette: string;
  quantity: number;
  stockQty: number;
  unitPriceInPaise: number;
  lineTotalInPaise: number;
};

export type CartQuote = {
  lines: QuotedCartLine[];
  subtotalInPaise: number;
  discountInPaise: number;
  deliveryFeeInPaise: number;
  taxIncludedInPaise: number;
  totalInPaise: number;
  freeDeliveryRemainingInPaise: number;
  minimumOrderRemainingInPaise: number;
  coupon: CouponResult | null;
  zone: DeliveryZone | null;
  errors: string[];
  isCheckoutReady: boolean;
};

export const STORE_SETTINGS = {
  minimumOrderInPaise: 19_900,
  defaultDeliveryFeeInPaise: 3_000,
  freeDeliveryAboveInPaise: 49_900,
  slotCutoffMinutes: 120,
  zones: [
    {
      id: "main-gate",
      name: "LPU Main Gate",
      area: "Main gate and university offices",
      pincodes: ["144411"],
      deliveryFeeInPaise: 3_000,
      freeAboveInPaise: 49_900,
      isActive: true,
    },
    {
      id: "boys-hostels",
      name: "Boys’ Hostels",
      area: "Designated hostel gate hand-off",
      pincodes: ["144411"],
      deliveryFeeInPaise: 3_000,
      freeAboveInPaise: 49_900,
      isActive: true,
    },
    {
      id: "girls-hostels",
      name: "Girls’ Hostels",
      area: "Designated hostel gate hand-off",
      pincodes: ["144411"],
      deliveryFeeInPaise: 3_000,
      freeAboveInPaise: 49_900,
      isActive: true,
    },
    {
      id: "phagwara-side",
      name: "Phagwara Side",
      area: "Selected nearby localities",
      pincodes: ["144401", "144402", "144411"],
      deliveryFeeInPaise: 3_000,
      freeAboveInPaise: 49_900,
      isActive: true,
    },
  ] satisfies readonly DeliveryZone[],
  deliveryWindows: [
    { id: "late-morning", label: "11:00–13:00", startTime: "11:00", endTime: "13:00" },
    { id: "afternoon", label: "15:00–17:00", startTime: "15:00", endTime: "17:00" },
    { id: "evening", label: "18:00–20:00", startTime: "18:00", endTime: "20:00" },
  ],
} as const;

const coupons = [
  {
    code: "STUDENT10",
    label: "10% student discount",
    type: "percent",
    value: 1_000,
    minimumInPaise: 49_900,
  },
  {
    code: "LOCAL50",
    label: "₹50 local drop discount",
    type: "flat",
    value: 5_000,
    minimumInPaise: 29_900,
  },
] as const;

const productByVariant = new Map(
  products.flatMap((product) => product.variants.map((variant) => [variant.id, { product, variant }] as const)),
);

export function getDeliveryZone(zoneId: string | undefined) {
  return STORE_SETTINGS.zones.find((zone) => zone.id === zoneId && zone.isActive) ?? null;
}

export function checkDeliveryZone(zoneId: string, pincode: string) {
  const zone = getDeliveryZone(zoneId);
  const normalizedPincode = pincode.replace(/\D/g, "");
  return {
    serviceable: Boolean(zone?.pincodes.includes(normalizedPincode)),
    zone,
    normalizedPincode,
  };
}

export function validateCoupon(code: string | undefined, subtotalInPaise: number): CouponResult | null {
  if (!code?.trim()) return null;
  const normalizedCode = code.trim().toUpperCase();
  const coupon = coupons.find((item) => item.code === normalizedCode);
  if (!coupon) throw new Error("That code is not recognised.");
  if (subtotalInPaise < coupon.minimumInPaise) {
    throw new Error(`This code needs a basket of at least ₹${coupon.minimumInPaise / 100}.`);
  }
  const discountInPaise = coupon.type === "percent"
    ? Math.floor((subtotalInPaise * coupon.value) / 10_000)
    : Math.min(coupon.value, subtotalInPaise);
  return { code: coupon.code, label: coupon.label, discountInPaise };
}

export function quoteCart(
  inputLines: readonly CartInputLine[],
  zoneId?: string,
  couponCode?: string,
  liveStock?: ReadonlyMap<string, number>,
): CartQuote {
  const errors: string[] = [];
  const quantities = new Map<string, number>();
  for (const line of inputLines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      errors.push("Cart quantities must be whole numbers greater than zero.");
      continue;
    }
    quantities.set(line.variantId, (quantities.get(line.variantId) ?? 0) + line.quantity);
  }

  const lines: QuotedCartLine[] = [];
  for (const [variantId, quantity] of quantities) {
    const match = productByVariant.get(variantId);
    if (!match) {
      errors.push("A cart item is no longer available.");
      continue;
    }
    const stockQty = liveStock?.get(variantId) ?? match.variant.stockQty;
    if (quantity > stockQty) {
      errors.push(`${match.product.name} (${match.variant.size}, ${match.variant.colour.name}) only has ${stockQty} left.`);
    }
    lines.push({
      variantId,
      productSlug: match.product.slug,
      productName: match.product.name,
      supplierName: match.product.supplierName,
      size: match.variant.size,
      colour: match.variant.colour.name,
      palette: match.product.palette,
      quantity,
      stockQty,
      unitPriceInPaise: match.variant.priceInPaise,
      lineTotalInPaise: match.variant.priceInPaise * quantity,
    });
  }

  const subtotalInPaise = lines.reduce((total, line) => total + line.lineTotalInPaise, 0);
  const taxIncludedInPaise = lines.reduce((total, line) => {
    const product = productByVariant.get(line.variantId)?.product;
    if (!product) return total;
    return total + Math.round((line.lineTotalInPaise * product.gstBps) / (10_000 + product.gstBps));
  }, 0);
  const zone = getDeliveryZone(zoneId);
  if (zoneId && !zone) errors.push("Choose an active delivery zone.");

  let coupon: CouponResult | null = null;
  if (couponCode?.trim()) {
    try {
      coupon = validateCoupon(couponCode, subtotalInPaise);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "The coupon could not be applied.");
    }
  }

  const freeAboveInPaise = zone?.freeAboveInPaise ?? STORE_SETTINGS.freeDeliveryAboveInPaise;
  const deliveryFeeInPaise = subtotalInPaise >= freeAboveInPaise
    ? 0
    : (zone?.deliveryFeeInPaise ?? STORE_SETTINGS.defaultDeliveryFeeInPaise);
  const discountInPaise = coupon?.discountInPaise ?? 0;
  const minimumOrderRemainingInPaise = Math.max(0, STORE_SETTINGS.minimumOrderInPaise - subtotalInPaise);
  if (inputLines.length > 0 && minimumOrderRemainingInPaise > 0) {
    errors.push(`Minimum order is ₹${STORE_SETTINGS.minimumOrderInPaise / 100}.`);
  }
  if (inputLines.length > 0 && lines.length === 0) errors.push("Your cart has no available items.");

  return {
    lines,
    subtotalInPaise,
    discountInPaise,
    deliveryFeeInPaise,
    taxIncludedInPaise,
    totalInPaise: Math.max(0, subtotalInPaise - discountInPaise + deliveryFeeInPaise),
    freeDeliveryRemainingInPaise: Math.max(0, freeAboveInPaise - subtotalInPaise),
    minimumOrderRemainingInPaise,
    coupon,
    zone,
    errors: [...new Set(errors)],
    isCheckoutReady: inputLines.length > 0 && errors.length === 0 && Boolean(zone),
  };
}

function istDateId(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getAvailableDeliverySlots(now = new Date(), days = 3): DeliverySlot[] {
  const slots: DeliverySlot[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const candidate = new Date(now.getTime() + offset * 86_400_000);
    const date = istDateId(candidate);
    const dateLabel = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(candidate);
    for (const window of STORE_SETTINGS.deliveryWindows) {
      const startsAt = new Date(`${date}T${window.startTime}:00+05:30`);
      const endsAt = new Date(`${date}T${window.endTime}:00+05:30`);
      const cutoffAt = startsAt.getTime() - STORE_SETTINGS.slotCutoffMinutes * 60_000;
      if (now.getTime() >= cutoffAt) continue;
      slots.push({
        id: `${date}:${window.id}`,
        date,
        dateLabel,
        windowId: window.id,
        label: window.label,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
    }
  }
  return slots;
}

export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from].includes(to);
}

