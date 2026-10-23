import { isSameOrigin, takeRateLimit } from "@/lib/api-security";
import { paymentVerificationSchema } from "@/lib/commerce-schema";
import { getDemoPaymentContext, getDemoTrackingOrder } from "@/lib/demo-order-store";
import { verifyPaymentSignature } from "@/lib/payment-security";
import { getPaymentRuntime } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const rateLimit = takeRateLimit(request, "payment-verification", 15, 60_000);
  if (!rateLimit.allowed) return Response.json({ error: "Too many payment checks. Try again shortly." }, { status: 429 });
  const parsed = paymentVerificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The payment response is incomplete." }, { status: 400 });

  try {
    const runtime = getPaymentRuntime();
    if (runtime.provider !== "razorpay") return Response.json({ error: "Razorpay test mode is not configured." }, { status: 409 });
    const context = getDemoPaymentContext(parsed.data.orderNumber, parsed.data.attemptToken);
    if (context.provider !== "razorpay") return Response.json({ error: "The payment provider does not match." }, { status: 409 });
    const valid = verifyPaymentSignature(
      context.providerOrderId,
      parsed.data.razorpayPaymentId,
      parsed.data.razorpaySignature,
      runtime.keySecret,
    );
    if (!valid) return Response.json({ error: "Payment signature verification failed." }, { status: 400 });
    return Response.json(
      { verified: true, order: getDemoTrackingOrder(parsed.data.orderNumber) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Payment verification failed." }, { status: 422 });
  }
}
