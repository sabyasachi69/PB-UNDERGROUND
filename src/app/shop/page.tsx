import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogueClient } from "@/components/catalogue-client";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse PB UNDERGROUND's sample catalogue of locally sourced campus clothing.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <main className="shop-page" id="main-content">
      <header className="shop-heading">
        <div><p className="eyebrow">Drop 001 / Sample catalogue</p><h1>Useful pieces.<br />Close to home.</h1></div>
        <p>Twelve sample pieces from four fictional local makers. Filter the cloth, share the URL, and find the variant that works.</p>
      </header>
      <Suspense fallback={<p className="catalogue-loading">Opening the racks…</p>}><CatalogueClient /></Suspense>
    </main>
  );
}
