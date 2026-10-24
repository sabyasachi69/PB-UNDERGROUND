import { z } from "zod";

const phone = z.string().regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number.");

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72)
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(72),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  phone: z.union([phone, z.literal("")]).transform((value) => value || null),
});

export const addressSchema = z.object({
  label: z.string().trim().min(2).max(30),
  recipientName: z.string().trim().min(2).max(100),
  phone,
  line1: z.string().trim().min(5).max(150),
  line2: z.string().trim().max(150).optional().default(""),
  landmark: z.string().trim().max(120).optional().default(""),
  pincode: z.string().regex(/^[0-9]{6}$/),
  zoneId: z.string().trim().max(80).nullable().optional().default(null),
  isDefault: z.boolean().default(false),
});

export const wishlistSchema = z.object({ variantId: z.string().trim().min(3).max(150) });

const evidence = z.string().max(2_800_000).regex(/^data:image\/(jpeg|png|webp);base64,/);
export const returnRequestSchema = z.object({
  orderId: z.string().trim().min(1).max(100),
  itemIds: z.array(z.string().trim().min(1).max(150)).min(1).max(20),
  reason: z.enum(["size", "defect"]),
  details: z.string().trim().min(10).max(500),
  photos: z.array(evidence).min(1).max(3),
});

export const deleteAccountSchema = z.object({ confirmation: z.literal("DELETE") });
