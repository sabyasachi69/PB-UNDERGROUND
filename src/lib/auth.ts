import "server-only";

import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type { AccountUser } from "@/lib/account-types";
import { demoAccounts } from "@/lib/demo-account-store";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DemoCredential = AccountUser & { salt: string; passwordHash: string };
type DemoAuthState = { users: Map<string, DemoCredential>; emailIndex: Map<string, string>; secret: Buffer };
const globalForAuth = globalThis as typeof globalThis & { __pbUndergroundDemoAuth?: DemoAuthState };
const demoAuth: DemoAuthState = globalForAuth.__pbUndergroundDemoAuth ?? {
  users: new Map(),
  emailIndex: new Map(),
  secret: randomBytes(32),
};
globalForAuth.__pbUndergroundDemoAuth = demoAuth;

const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;
const sessionCookieName = process.env.NODE_ENV === "production" ? "__Host-pbu_demo_session" : "pbu_demo_session";

function passwordHash(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("base64url");
}

function sessionToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Date.now() + SESSION_AGE_SECONDS * 1_000 })).toString("base64url");
  const signature = createHmac("sha256", demoAuth.secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSessionToken(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", demoAuth.secret).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: string; exp?: number };
    if (!value.sub || !value.exp || value.exp < Date.now()) return null;
    return value.sub;
  } catch {
    return null;
  }
}

async function setDemoSession(userId: string) {
  const store = await cookies();
  store.set(sessionCookieName, sessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_AGE_SECONDS,
  });
}

export async function registerAccount(input: { displayName: string; email: string; password: string }) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase authentication is not available.");
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { display_name: input.displayName } },
    });
    if (error) throw new Error(error.message);
    return { needsEmailConfirmation: !data.session };
  }
  if (demoAuth.emailIndex.has(input.email)) throw new Error("An account already exists for this email.");
  const id = randomUUID();
  const salt = randomBytes(16).toString("base64url");
  const user: DemoCredential = { id, email: input.email, displayName: input.displayName, phone: null, salt, passwordHash: passwordHash(input.password, salt) };
  demoAuth.users.set(id, user);
  demoAuth.emailIndex.set(input.email, id);
  demoAccounts.createProfile(user);
  await setDemoSession(id);
  return { needsEmailConfirmation: false };
}

export async function loginAccount(input: { email: string; password: string }) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("Supabase authentication is not available.");
    const { error } = await supabase.auth.signInWithPassword(input);
    if (error) throw new Error("Email or password is incorrect.");
    return;
  }
  const id = demoAuth.emailIndex.get(input.email);
  const user = id ? demoAuth.users.get(id) : null;
  if (!user) throw new Error("Email or password is incorrect.");
  const expected = Buffer.from(user.passwordHash, "base64url");
  const received = Buffer.from(passwordHash(input.password, user.salt), "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error("Email or password is incorrect.");
  await setDemoSession(user.id);
}

export async function getCurrentUser(): Promise<AccountUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return null;
    const { data: profile } = await supabase.from("profiles").select("display_name, phone").eq("id", data.user.id).maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email,
      displayName: profile?.display_name ?? data.user.user_metadata.display_name ?? data.user.email.split("@")[0],
      phone: profile?.phone ?? null,
    };
  }
  const store = await cookies();
  const userId = readSessionToken(store.get(sessionCookieName)?.value);
  if (!userId) return null;
  const user = demoAuth.users.get(userId);
  return user ? { id: user.id, email: user.email, displayName: user.displayName, phone: user.phone } : null;
}

export async function logoutAccount() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
    return;
  }
  (await cookies()).delete(sessionCookieName);
}

export async function deleteDemoAuthAccount(userId: string) {
  const user = demoAuth.users.get(userId);
  if (user) demoAuth.emailIndex.delete(user.email);
  demoAuth.users.delete(userId);
  demoAccounts.deleteProfile(userId);
  (await cookies()).delete(sessionCookieName);
}
