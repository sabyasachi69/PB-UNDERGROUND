import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { QuickAdd } from "@/components/quick-add";
import { WishlistButton } from "@/components/wishlist-button";
import { isProductInStock, type Product } from "@/data/products";
import { demoProductImages } from "@/data/demo-images";
import { formatInrFromPaise } from "@/lib/money";

type ProductCardProps = { product: Product; index: number };

export function ProductCard({ product, index }: ProductCardProps) {
  const inStock = isProductInStock(product);
  const wishVariant = product.variants.find((variant) => variant.stockQty > 0) ?? product.variants[0];
  const conceptImage = demoProductImages[product.slug];
  return (
    <article className="product-card" id={product.slug}>
      <Link className={`product-visual product-visual--${product.palette} ${conceptImage ? "has-photo" : ""}`} href={`/product/${product.slug}`}>
        {conceptImage ? <Image className="product-photo" src={conceptImage.src} alt={conceptImage.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 32vw" /> : <span className="product-silhouette" aria-hidden="true" />}
        <span className="product-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="sample-asset">{conceptImage ? "AI concept image" : "Sample art direction"}</span>
        {!inStock ? <span className="stock-badge">Sold out</span> : null}
      </Link>
      <WishlistButton variantId={wishVariant.id} compact />
      <div className="product-details">
        <div>
          <p><Link href={`/shop/${product.categorySlug}`}>{product.category}</Link></p>
          <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
          <span>{product.supplierName}</span>
          <div className="product-swatches" aria-label={`Available colours: ${product.colours.map((colour) => colour.name).join(", ")}`}>
            {product.colours.map((colour) => <i key={colour.name} style={{ backgroundColor: colour.hex }} title={colour.name} />)}
          </div>
        </div>
        <div className="product-price">
          <div>
            {product.compareAtPaise ? <del>{formatInrFromPaise(product.compareAtPaise)}</del> : null}
            <strong>{formatInrFromPaise(product.priceInPaise)}</strong>
            <small>GST included</small>
          </div>
          <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.5} />
        </div>
      </div>
      {inStock ? <QuickAdd productName={product.name} variants={product.variants} /> : null}
    </article>
  );
}
