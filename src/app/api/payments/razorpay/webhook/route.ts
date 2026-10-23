import { processDemoWebhook } from "@/lib/demo-order-store";
import { verifyWebhookSignature } from "@/lib/payment-security";
import { getPaymentRuntime } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

type WebhookPayload = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string } };
    order?: { entity?: { id?: string; amount_paid?: number; currency?: string } };
  };
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 256_000) return Response.json({ error: "Webhook payload is too large." }, { status: 413 });
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!signature || !eventId) return Response.json({ error: "Webhook headers are missing." }, { status: 400 });
  const rawBody = await request.text();
  if (rawBody.length > 256_000) return Response.json({ error: "Webhook payload is too large." }, { status: 413 });

  try {
    const runtime = getPaymentRuntime();
    if (runtime.provider !== "razorpay") return Response.json({ error: "Razorpay webhooks are not configured." }, { status: 503 });
    if (!verifyWebhookSignature(rawBody, signature, runtime.webhookSecret)) {
      return Response.json({ error: "Webhook signature verification failed." }, { status: 400 });
    }
    const body = JSON.parse(rawBody) as WebhookPayload;
    const event = body.event ?? "unknown";
    const payment = body.payload?.payment?.entity;
    const providerOrder = body.payload?.order?.entity;
    const providerOrderId = payment?.order_id ?? providerOrder?.id ?? null;
    const result = processDemoWebhook({
      eventId,
      event,
      providerOrderId,
      paymentId: payment?.id ?? null,
      amountInPaise: payment?.amount ?? providerOrder?.amount_paid ?? null,
      currency: payment?.currency ?? providerOrder?.currency ?? null,
    });
    return Response.json({ ok: true, replayed: result.replayed }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Webhook body is not valid JSON." }, { status: 400 });
    return Response.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 500 });
  }
}
