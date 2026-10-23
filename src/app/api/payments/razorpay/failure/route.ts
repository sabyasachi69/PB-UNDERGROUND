import { isSameOrigin, takeRateLimit } from "@/lib/api-security";
import { paymentFailureSchema } from "@/lib/commerce-schema";
import { failDemoPayment } from "@/lib/demo-order-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const rateLimit = takeRateLimit(request, "payment-failure", 15, 60_000);
  if (!rateLimit.allowed) return Response.json({ error: "Too many payment updates. Try again shortly." }, { status: 429 });
  const parsed = paymentFailureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The payment failure response is incomplete." }, { status: 400 });
  try {
    const result = failDemoPayment(parsed.data.orderNumber, parsed.data.attemptToken);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Payment failure could not be recorded." }, { status: 422 });
  }
}
