import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { ProductDetail } from "@/components/product-detail";
import { getProductBySlug, products } from "@/data/products";
import { formatInrFromPaise } from "@/lib/money";

type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Piece not found" };
  return {
    title: product.name,
    description: `${product.description} ${formatInrFromPaise(product.priceInPaise)}, GST included.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: `${product.name} — PB UNDERGROUND`, description: product.description, type: "website" },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = products.filter((item) => item.categorySlug === product.categorySlug && item.slug !== product.slug).slice(0, 2);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: "PB UNDERGROUND" },
    manufacturer: { "@type": "Organization", name: product.supplierName.replace("[SAMPLE] ", "") },
    category: product.category,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: product.priceInPaise / 100,
      highPrice: Math.max(...product.variants.map((variant) => variant.priceInPaise)) / 100,
      availability: product.variants.some((variant) => variant.stockQty > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      offerCount: product.variants.length,
    },
  };

  return (
    <main className="product-page" id="main-content">
      <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
      <ProductDetail product={product} />
      {related.length ? (
        <section className="related-products" aria-labelledby="related-title">
          <p className="eyebrow">Keep looking nearby</p><h2 id="related-title">More from {product.category.toLowerCase()}.</h2>
          <div className="product-grid">{related.map((item, index) => <ProductCard product={item} index={index} key={item.slug} />)}</div>
        </section>
      ) : null}
    </main>
  );
}
