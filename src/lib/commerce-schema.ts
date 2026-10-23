import { z } from "zod";

export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(160),
  quantity: z.number().int().min(1).max(10),
});

export const cartQuoteSchema = z.object({
  lines: z.array(cartLineSchema).min(1).max(30),
  zoneId: z.string().min(1).max(80).optional(),
  couponCode: z.string().trim().max(40).optional(),
});

export const zoneCheckSchema = z.object({
  zoneId: z.string().min(1).max(80),
  pincode: z.string().regex(/^\d{6}$/, "Enter a six-digit pincode."),
});

export const createOrderSchema = z.object({
  idempotencyKey: z.uuid(),
  lines: z.array(cartLineSchema).min(1).max(30),
  couponCode: z.string().trim().max(40).optional(),
  contact: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
    email: z.email().max(160).optional().or(z.literal("")),
  }),
  address: z.object({
    line1: z.string().trim().min(5).max(160),
    line2: z.string().trim().max(160).optional(),
    landmark: z.string().trim().max(120).optional(),
    pincode: z.string().regex(/^\d{6}$/),
  }),
  zoneId: z.string().min(1).max(80),
  slotId: z.string().min(1).max(120),
  paymentMethod: z.literal("cod"),
  notes: z.string().trim().max(300).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
