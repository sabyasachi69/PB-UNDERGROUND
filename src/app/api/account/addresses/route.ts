import { addressSchema } from "@/lib/account-schema";
import { addAccountAddress, removeAccountAddress } from "@/lib/account-repository";
import { isSameOrigin } from "@/lib/api-security";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to save an address." }, { status: 401 });
  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the address fields.", issues: parsed.error.issues }, { status: 400 });
  try {
    const address = await addAccountAddress(user, {
      ...parsed.data,
      line2: parsed.data.line2 || null,
      landmark: parsed.data.landmark || null,
    });
    return Response.json({ address }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Address could not be saved." }, { status: 422 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to remove an address." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Address ID is required." }, { status: 400 });
  try {
    const removed = await removeAccountAddress(user, id);
    return removed ? Response.json({ ok: true }) : Response.json({ error: "Address not found." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Address could not be removed." }, { status: 422 });
  }
}
