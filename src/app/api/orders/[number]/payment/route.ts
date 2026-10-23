import { getDemoTrackingOrder } from "@/lib/demo-order-store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ number: string }> }) {
  const { number } = await context.params;
  const order = getDemoTrackingOrder(number);
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });
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
