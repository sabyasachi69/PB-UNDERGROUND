import { isSameOrigin, takeRateLimit } from "@/lib/api-security";
import { createOrderSchema } from "@/lib/commerce-schema";
import { createDemoOrder } from "@/lib/demo-order-store";

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
    const result = createDemoOrder(parsed.data);
    return Response.json(result, {
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

