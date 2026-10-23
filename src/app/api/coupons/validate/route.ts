import { z } from "zod";

import { quoteCart } from "@/lib/commerce";
import { cartLineSchema } from "@/lib/commerce-schema";
import { getDemoStock } from "@/lib/demo-order-store";

const requestSchema = z.object({
  code: z.string().trim().min(1).max(40),
  lines: z.array(cartLineSchema).min(1).max(30),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ valid: false, message: "Enter a coupon code." }, { status: 400 });
  const quote = quoteCart(parsed.data.lines, undefined, parsed.data.code, getDemoStock());
  if (!quote.coupon) {
    return Response.json({ valid: false, message: quote.errors[0] ?? "That coupon is not valid." }, { status: 422 });
  }
  return Response.json({ valid: true, coupon: quote.coupon });
}

