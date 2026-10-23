import { getProductBySlug, products } from "@/data/products";

type ProductRouteContext = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function GET(_request: Request, { params }: ProductRouteContext) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
  return Response.json({ data: product });
}
