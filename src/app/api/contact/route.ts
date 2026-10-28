import { z } from "zod";
import { isSameOrigin, takeRateLimit } from "@/lib/api-security";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  topic: z.enum(["order", "delivery", "supplier", "other"]),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const limit = takeRateLimit(request, "contact", 3, 60_000);
  if (!limit.allowed) return Response.json({ error: "Too many messages. Please wait and try again." }, { status: 429 });
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please check the form fields." }, { status: 400 });
  if (parsed.data.website) return Response.json({ ok: true });
  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !from || !to) return Response.json({ error: "The support inbox is not configured yet. Please try again later." }, { status: 503 });
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], reply_to: parsed.data.email, subject: `PB UNDERGROUND: ${parsed.data.topic}`, text: `From: ${parsed.data.name} <${parsed.data.email}>\nTopic: ${parsed.data.topic}\n\n${parsed.data.message}` }), cache: "no-store" });
    if (!response.ok) throw new Error("Email provider rejected the message.");
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Message could not be sent. Please try again later." }, { status: 502 });
  }
}
