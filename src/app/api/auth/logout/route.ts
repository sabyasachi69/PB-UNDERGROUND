import { isSameOrigin } from "@/lib/api-security";
import { logoutAccount } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  await logoutAccount();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
