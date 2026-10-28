import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";
import { HeaderScene } from "@/components/header-scene";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-story scene-host"><HeaderScene kind="fabric" /><p className="eyebrow">Account / Returning</p><h1>Your sizes.<br />Your orders.<br />Still here.</h1><p>Sign in to track the pieces you bought, use a saved gate address, and reorder a basic without rebuilding the bag.</p></section>
      <section className="auth-panel" aria-labelledby="login-title"><span>01 / Secure access</span><h2 id="login-title">Welcome back.</h2><Suspense fallback={<p>Opening sign in…</p>}><AuthForm mode="login" /></Suspense></section>
    </main>
  );
}
