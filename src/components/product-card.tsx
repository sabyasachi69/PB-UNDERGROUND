import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { FeaturedProduct } from "@/data/products";
import { formatInrFromPaise } from "@/lib/money";

type ProductCardProps = {
  product: FeaturedProduct;
  index: number;
};

export function ProductCard({ product, index }: ProductCardProps) {
  return (
    <article className="product-card">
      <Link className={`product-visual product-visual--${product.palette}`} href={`/shop#${product.slug}`}>
        <span className="product-index">0{index + 1}</span>
        <span className="sample-asset">Sample art direction</span>
        <span className="product-silhouette" aria-hidden="true" />
      </Link>
      <div className="product-details">
        <div>
          <p>{product.category}</p>
          <h3>{product.name}</h3>
          <span>{product.maker}</span>
        </div>
        <div className="product-price">
          <strong>{formatInrFromPaise(product.priceInPaise)}</strong>
          <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.5} />
        </div>
      </div>
    </article>
  );
}
