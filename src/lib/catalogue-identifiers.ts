import { products, type Product, type ProductVariant } from "@/data/products";

export type CatalogueVariantReference = {
  product: Product;
  variant: ProductVariant;
};

const variantsByLocalId = new Map<string, CatalogueVariantReference>(
  products.flatMap((product) =>
    product.variants.map((variant) => [variant.id, { product, variant }] as const),
  ),
);

const variantIdentity = (productSlug: string, size: string, colour: string) =>
  `${productSlug}\u0000${size}\u0000${colour}`;

const variantsByIdentity = new Map<string, CatalogueVariantReference>(
  products.flatMap((product) =>
    product.variants.map((variant) => [
      variantIdentity(product.slug, variant.size, variant.colour.name),
      { product, variant },
    ] as const),
  ),
);

export function findCatalogueVariantByLocalId(localVariantId: string) {
  return variantsByLocalId.get(localVariantId) ?? null;
}

export function findCatalogueVariantByIdentity(productSlug: string, size: string, colour: string) {
  return variantsByIdentity.get(variantIdentity(productSlug, size, colour)) ?? null;
}
