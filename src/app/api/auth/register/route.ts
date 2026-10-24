import { registerSchema } from "@/lib/account-schema";
import { isSameOrigin, takeRateLimit } from "@/lib/api-security";
import { registerAccount } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const limit = takeRateLimit(request, "register", 5, 60_000);
  if (!limit.allowed) return Response.json({ error: "Too many attempts. Wait a minute and try again." }, { status: 429 });
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check your name, email and password.", issues: parsed.error.issues }, { status: 400 });
  try {
    const result = await registerAccount(parsed.data);
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Account creation failed." }, { status: 422 });
  }
}
