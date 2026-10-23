type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export type PaymentRuntime =
  | { provider: "simulator" }
  | { provider: "razorpay"; keyId: string; keySecret: string; webhookSecret: string };

export function getPaymentRuntime(): PaymentRuntime {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!keyId && !keySecret && !webhookSecret) return { provider: "simulator" };
  if (!keyId || !keySecret || !webhookSecret) {
    throw new Error("Razorpay test mode needs the key ID, key secret and webhook secret together.");
  }
  if (!keyId.startsWith("rzp_test_")) {
    throw new Error("Phase 4 accepts Razorpay test keys only. Live payments are a launch-gate task.");
  }
  return { provider: "razorpay", keyId, keySecret, webhookSecret };
}

export async function createRazorpayOrder(input: {
  orderNumber: string;
  amountInPaise: number;
}): Promise<RazorpayOrder> {
  const runtime = getPaymentRuntime();
  if (runtime.provider !== "razorpay") throw new Error("Razorpay test credentials are not configured.");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${runtime.keyId}:${runtime.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: "INR",
      receipt: input.orderNumber,
      notes: { pb_underground_order: input.orderNumber },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => null) as RazorpayOrder | { error?: { description?: string } } | null;
  if (!response.ok || !body || !("id" in body)) {
    const description = body && "error" in body ? body.error?.description : undefined;
    throw new Error(description ?? "Razorpay could not create the test payment order.");
  }
  if (body.amount !== input.amountInPaise || body.currency !== "INR") {
    throw new Error("Razorpay returned an unexpected order total.");
  }
  return body;
}
