import { quoteCart } from "@/lib/commerce";
import { cartQuoteSchema } from "@/lib/commerce-schema";
import { getDemoStock } from "@/lib/demo-order-store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ mode: "local-session", persistence: "browser", pricing: "server" });
}

async function quote(request: Request) {
  const parsed = cartQuoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Check the cart details and try again.", issues: parsed.error.issues }, { status: 400 });
  }
  return Response.json(quoteCart(parsed.data.lines, parsed.data.zoneId, parsed.data.couponCode, getDemoStock()), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  return quote(request);
}

export async function PATCH(request: Request) {
  return quote(request);
}

