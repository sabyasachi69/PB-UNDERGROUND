import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getProductBySlug, products } from "@/data/products";
import { formatInrFromPaise } from "@/lib/money";

export const alt = "PB UNDERGROUND sample product card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", padding: 70, background: "#11120f", color: "#f4f0e8", flexDirection: "column", justifyContent: "space-between", fontFamily: "sans-serif" }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 27, fontWeight: 700 }}><span>PB UNDERGROUND</span><span style={{ color: "#f66d60" }}>[SAMPLE PRODUCT]</span></div><div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}><span style={{ color: "#f66d60", fontSize: 25, marginBottom: 20 }}>{product.category.toUpperCase()} / DROP 001</span><strong style={{ fontSize: 105, lineHeight: 0.94, letterSpacing: -4 }}>{product.name}</strong></div><div style={{ display: "flex", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid #888", fontSize: 30 }}><span>{product.supplierName}</span><strong>{formatInrFromPaise(product.priceInPaise)}</strong></div></div>, size);
}
