import { deleteAccountSchema, profileSchema } from "@/lib/account-schema";
import { getAccountSnapshot, updateAccountProfile } from "@/lib/account-repository";
import { isSameOrigin } from "@/lib/api-security";
import { deleteDemoAuthAccount, getCurrentUser, logoutAccount } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to open your account." }, { status: 401 });
  try {
    return Response.json(await getAccountSnapshot(user), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Account data could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to update your profile." }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the profile fields.", issues: parsed.error.issues }, { status: 400 });
  try {
    return Response.json({ user: await updateAccountProfile(user, parsed.data) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Profile update failed." }, { status: 422 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin was rejected." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in to delete your account." }, { status: 401 });
  const parsed = deleteAccountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
  if (isSupabaseConfigured()) {
    const admin = createSupabaseAdminClient();
    if (!admin) return Response.json({ error: "Account deletion needs the server-only Supabase secret key." }, { status: 503 });
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return Response.json({ error: error.message }, { status: 422 });
    await logoutAccount();
  } else {
    await deleteDemoAuthAccount(user.id);
  }
  return Response.json({ ok: true });
}
