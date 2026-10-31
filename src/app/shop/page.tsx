import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogueClient } from "@/components/catalogue-client";
import { HeaderScene } from "@/components/header-scene";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse PB UNDERGROUND's sample catalogue of locally sourced campus clothing.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <main className="shop-page" id="main-content">
      <header className="shop-heading scene-host shop-heading--collection">
        <HeaderScene kind="collection" />
        <div><p className="eyebrow">The collection / Drop 001</p><h1>Find your<br /><em>everyday</em> layer.</h1></div>
        <p>Browse {products.length} concept pieces, compare fits and colours, and build a bag for your next campus day. Product imagery and makers are currently samples.</p>
      </header>
      <Suspense fallback={<p className="catalogue-loading">Opening the racks…</p>}><CatalogueClient /></Suspense>
    </main>
  );
}
