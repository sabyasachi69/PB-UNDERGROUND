import { isSameOrigin, takeRateLimit } from "@/lib/api-security";
import { getCurrentUser } from "@/lib/auth";
import { createOrderSchema } from "@/lib/commerce-schema";
import {
  attachDemoProviderOrder,
  createDemoOrder,
  failDemoPayment,
  getDemoPaymentLaunch,
  getDemoPaymentSetup,
} from "@/lib/demo-order-store";
import { createRazorpayOrder, getPaymentRuntime } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const rateLimit = takeRateLimit(request, "checkout", 8, 60_000);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many checkout attempts. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Check the checkout details and try again.", issues: parsed.error.issues }, { status: 400 });
  }
  const idempotencyHeader = request.headers.get("idempotency-key");
  if (idempotencyHeader && idempotencyHeader !== parsed.data.idempotencyKey) {
    return Response.json({ error: "The idempotency key does not match the order." }, { status: 400 });
  }

  try {
    const runtime = parsed.data.paymentMethod === "upi" ? getPaymentRuntime() : null;
    const user = await getCurrentUser();
    const result = createDemoOrder(parsed.data, new Date(), runtime?.provider, user?.id ?? null);
    let payment = undefined;
    if (parsed.data.paymentMethod === "upi") {
      const setup = getDemoPaymentSetup(result.order.orderNumber);
      try {
        if (runtime?.provider === "razorpay" && !result.replayed) {
          const providerOrder = await createRazorpayOrder({
            orderNumber: result.order.orderNumber,
            amountInPaise: setup.amountInPaise,
          });
          attachDemoProviderOrder(result.order.orderNumber, providerOrder.id, setup.attemptToken);
        }
        payment = getDemoPaymentLaunch(
          result.order.orderNumber,
          runtime?.provider === "razorpay" ? runtime.keyId : undefined,
        );
      } catch (error) {
        failDemoPayment(result.order.orderNumber, setup.attemptToken);
        throw error;
      }
    }
    return Response.json({ ...result, payment }, {
      status: result.replayed ? 200 : 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The order could not be placed." },
      { status: 422 },
    );
  }
}

