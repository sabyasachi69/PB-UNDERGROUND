import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CatalogueClient } from "@/components/catalogue-client";
import { categories, getCategoryBySlug } from "@/data/products";

type CategoryPageProps = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return { title: category.name, description: category.description, alternates: { canonical: `/shop/${category.slug}` } };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <main className="shop-page category-page" id="main-content">
      <header className={`category-hero category-hero--${category.slug}`}>
        <p className="eyebrow">Category / {category.name}</p><h1>{category.name}</h1>
        <div><p>{category.description}</p><span>{category.note}</span></div>
      </header>
      <Suspense fallback={<p className="catalogue-loading">Opening the racks…</p>}><CatalogueClient lockedCategory={category.slug} /></Suspense>
    </main>
  );
}
