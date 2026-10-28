import type { MetadataRoute } from "next";
import { categories, products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pb-underground.vercel.app";
  const paths = ["/", "/shop", "/about", "/delivery", "/partner", "/contact", ...categories.map((category) => `/shop/${category.slug}`), ...products.map((product) => `/product/${product.slug}`)];
  return paths.map((path) => ({ url: new URL(path, origin).toString(), changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.6 }));
}
