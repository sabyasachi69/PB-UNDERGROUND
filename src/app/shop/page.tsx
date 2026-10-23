import type { Metadata } from "next";

import { ProductCard } from "@/components/product-card";
import { featuredProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse PB UNDERGROUND's first sample catalogue of locally sourced campus clothing.",
};

export default function ShopPage() {
  return (
    <main className="shop-page" id="main-content">
      <header className="shop-heading">
        <div>
          <p className="eyebrow">Drop 001 / Sample catalogue</p>
          <h1>Useful pieces.<br />Close to home.</h1>
        </div>
        <p>Catalogue data is currently marked as sample content. Search, URL filters and live stock arrive in Phase 2.</p>
      </header>
      <div className="shop-toolbar" aria-label="Catalogue summary">
        <span>{featuredProducts.length} sample pieces</span>
        <span>Prices include GST</span>
      </div>
      <section className="product-grid product-grid--shop" aria-label="Products">
        {featuredProducts.map((product, index) => (
          <ProductCard key={product.slug} product={product} index={index} />
        ))}
      </section>
    </main>
  );
}
