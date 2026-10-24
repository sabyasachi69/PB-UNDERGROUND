import { wishlistSchema } from "@/lib/account-schema";
import { addAccountWishlistItem, removeAccountWishlistItem } from "@/lib/account-repository";
import { isSameOrigin } from "@/lib/api-security";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to save favourites." }, { status: 401 });
  const parsed = wishlistSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "That wishlist item is invalid." }, { status: 400 });
  try {
    return Response.json({ item: await addAccountWishlistItem(user, parsed.data.variantId) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Item could not be saved." }, { status: 422 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to update favourites." }, { status: 401 });
  const variantId = new URL(request.url).searchParams.get("variantId");
  if (!variantId) return Response.json({ error: "Variant ID is required." }, { status: 400 });
  try {
    const removed = await removeAccountWishlistItem(user, variantId);
    return removed ? Response.json({ ok: true }) : Response.json({ error: "Wishlist item not found." }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Item could not be removed." }, { status: 422 });
  }
}
