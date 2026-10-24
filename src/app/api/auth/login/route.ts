import { loginSchema } from "@/lib/account-schema";
import { isSameOrigin, takeRateLimit } from "@/lib/api-security";
import { loginAccount } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const limit = takeRateLimit(request, "login", 8, 60_000);
  if (!limit.allowed) return Response.json({ error: "Too many sign-in attempts. Wait a minute and try again." }, { status: 429 });
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email and password." }, { status: 400 });
  try {
    await loginAccount(parsed.data);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Sign in failed." }, { status: 401 });
  }
}
