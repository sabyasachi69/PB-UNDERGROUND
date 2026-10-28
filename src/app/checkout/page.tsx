import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CheckoutClient } from "@/components/checkout-client";
import { HeaderScene } from "@/components/header-scene";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Choose an address, delivery window and secure payment method for your PB UNDERGROUND order.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="commerce-page checkout-page" id="main-content">
      <header className="checkout-header scene-host"><HeaderScene kind="bag" /><Link href="/cart"><ArrowLeftIcon /> Back to bag</Link><span>Secure sample checkout / COD + UPI test mode</span></header>
      <Suspense fallback={<div className="checkout-loading">Preparing secure checkout…</div>}><CheckoutClient /></Suspense>
    </main>
  );
}

function ArrowLeftIcon() {
  return <span aria-hidden="true">←</span>;
}

