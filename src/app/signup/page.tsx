import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } };

export default function SignupPage() {
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-story"><p className="eyebrow">Account / New</p><h1>Less typing.<br />More wearing.</h1><p>Save up to five delivery addresses, keep a wishlist, reorder previous fits, and open a return request from one quiet place.</p></section>
      <section className="auth-panel" aria-labelledby="signup-title"><span>01 / Your details</span><h2 id="signup-title">Make it yours.</h2><Suspense fallback={<p>Opening sign up…</p>}><AuthForm mode="signup" /></Suspense></section>
    </main>
  );
}
