import type { Metadata } from "next";

import { CartClient } from "@/components/cart-client";
import { HeaderScene } from "@/components/header-scene";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review your PB UNDERGROUND bag, apply a student coupon and preview delivery.",
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return (
    <main className="commerce-page" id="main-content">
      <header className="commerce-heading commerce-heading--bag scene-host">
        <HeaderScene kind="bag" />
        <p className="eyebrow">Bag / Live stock check</p>
        <h1>Keep what<br />earns the space.</h1>
        <p>Adjust the fit, check the fee, then choose when it reaches your gate.</p>
      </header>
      <CartClient />
    </main>
  );
}
