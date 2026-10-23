import { isSameOrigin, takeRateLimit } from "@/lib/api-security";
import { testPaymentCompletionSchema } from "@/lib/commerce-schema";
import { completeSimulatedPayment } from "@/lib/demo-order-store";
import { getPaymentRuntime } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const rateLimit = takeRateLimit(request, "test-payment", 12, 60_000);
  if (!rateLimit.allowed) return Response.json({ error: "Too many test payment attempts." }, { status: 429 });
  if (getPaymentRuntime().provider !== "simulator") {
    return Response.json({ error: "The local simulator is disabled while Razorpay test keys are configured." }, { status: 409 });
  }
  const parsed = testPaymentCompletionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The test payment response is incomplete." }, { status: 400 });
  try {
    const result = completeSimulatedPayment(parsed.data.orderNumber, parsed.data.attemptToken, parsed.data.outcome);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Test payment could not be completed." }, { status: 422 });
  }
}
