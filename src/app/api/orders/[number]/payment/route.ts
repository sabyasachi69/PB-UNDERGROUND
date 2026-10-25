import { getDemoPublicTrackingOrder } from "@/lib/demo-order-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ number: string }> }) {
  const { number } = await context.params;
  const token = new URL(request.url).searchParams.get("token");
  const order = token ? getDemoPublicTrackingOrder(number, token) : null;
  if (!order) return Response.json({ error: "This tracking link is invalid or has expired." }, { status: 404 });
  return Response.json({
    payment: {
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.paymentProvider,
      paymentExpiresAt: order.paymentExpiresAt,
      status: order.status,
      events: order.events,
    },
  }, { headers: { "Cache-Control": "no-store, private" } });
}
