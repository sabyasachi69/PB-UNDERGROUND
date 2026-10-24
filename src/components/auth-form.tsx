"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = {
      ...(isSignup ? { displayName: String(form.get("displayName") ?? "") } : {}),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };
    try {
      const response = await fetch(`/api/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as { error?: string; needsEmailConfirmation?: boolean };
      if (!response.ok) throw new Error(result.error ?? "Authentication failed.");
      if (result.needsEmailConfirmation) {
        setMessage("Check your email to confirm the account, then sign in.");
        setPending(false);
        return;
      }
      const requested = searchParams.get("next");
      const destination = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
      router.push(destination);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed.");
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {isSignup ? <label>Full name<input name="displayName" autoComplete="name" minLength={2} maxLength={80} required /></label> : null}
      <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 8 : 1} maxLength={72} required /><small>{isSignup ? "At least 8 characters, with a letter and a number." : "Use the password you created for this account."}</small></label>
      <p className="privacy-note"><ShieldCheck aria-hidden="true" size={16} /> We use these details only for your account and orders. No marketing consent is implied.</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {message ? <p className="form-success" role="status">{message}</p> : null}
      <button className="button button--signal" type="submit" disabled={pending}>{pending ? "Working…" : isSignup ? "Create account" : "Sign in"}<ArrowRight aria-hidden="true" size={17} /></button>
      <p className="auth-switch">{isSignup ? "Already have an account?" : "New here?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create one"}</Link></p>
    </form>
  );
}
