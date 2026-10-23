import { isProductInStock, products } from "@/data/products";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const category = params.get("category") ?? "";
  const size = params.get("size") ?? "";
  const colour = (params.get("colour") ?? "").toLowerCase();
  const supplier = params.get("supplier") ?? "";
  const inStock = params.get("stock") === "1";
  const sort = params.get("sort") ?? "new";
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 12) || 12, 1), 24);
  const cursor = params.get("cursor");

  const filtered = products
    .filter((product) => {
      const searchable = `${product.name} ${product.description} ${product.supplierName}`.toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (!category || product.categorySlug === category) &&
        (!size || product.sizes.includes(size)) &&
        (!colour || product.colours.some((item) => item.name.toLowerCase() === colour)) &&
        (!supplier || product.supplierSlug === supplier) &&
        (!inStock || isProductInStock(product))
      );
    })
    .sort((left, right) => {
      if (sort === "price-low") return left.priceInPaise - right.priceInPaise;
      if (sort === "price-high") return right.priceInPaise - left.priceInPaise;
      if (sort === "popular") return right.popularity - left.popularity;
      return Date.parse(right.releasedAt) - Date.parse(left.releasedAt);
    });

  const cursorIndex = cursor ? filtered.findIndex((product) => product.slug === cursor) : -1;
  const page = filtered.slice(cursorIndex + 1, cursorIndex + 1 + limit);
  const hasMore = cursorIndex + 1 + limit < filtered.length;

  return Response.json({
    data: page,
    page: { count: page.length, total: filtered.length, nextCursor: hasMore ? page.at(-1)?.slug ?? null : null },
  });
}
