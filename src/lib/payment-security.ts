import { createHmac, timingSafeEqual } from "node:crypto";

function hmacSha256(message: string, secret: string) {
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

function safeHexEqual(expected: string, received: string) {
  if (!/^[a-f0-9]+$/i.test(received) || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}

export function paymentSignature(orderId: string, paymentId: string, secret: string) {
  return hmacSha256(`${orderId}|${paymentId}`, secret);
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  return safeHexEqual(paymentSignature(orderId, paymentId, secret), signature);
}

export function webhookSignature(rawBody: string, secret: string) {
  return hmacSha256(rawBody, secret);
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  return safeHexEqual(webhookSignature(rawBody, secret), signature);
}
