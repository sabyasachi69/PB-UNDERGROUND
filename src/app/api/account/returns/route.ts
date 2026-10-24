import { returnRequestSchema } from "@/lib/account-schema";
import { createAccountReturn } from "@/lib/account-repository";
import { isSameOrigin, takeRateLimit } from "@/lib/api-security";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const limit = takeRateLimit(request, "returns", 5, 60_000);
  if (!limit.allowed) return Response.json({ error: "Too many return attempts. Wait a minute and try again." }, { status: 429 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to request a return." }, { status: 401 });
  const parsed = returnRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Add a reason, details and one to three valid photos.", issues: parsed.error.issues }, { status: 400 });
  try {
    return Response.json({ request: await createAccountReturn(user, parsed.data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Return request could not be created." }, { status: 422 });
  }
}
