import { describe, expect, it } from "vitest";

import { products } from "@/data/products";
import { findCatalogueVariantByIdentity, findCatalogueVariantByLocalId } from "@/lib/catalogue-identifiers";

describe("catalogue variant identifiers", () => {
  it("round-trips every storefront variant through its database identity", () => {
    for (const product of products) {
      for (const variant of product.variants) {
        expect(findCatalogueVariantByLocalId(variant.id)?.variant).toBe(variant);
        expect(
          findCatalogueVariantByIdentity(product.slug, variant.size, variant.colour.name)?.variant.id,
        ).toBe(variant.id);
      }
    }
  });

  it("does not invent an identifier for an unknown database row", () => {
    expect(findCatalogueVariantByIdentity("missing", "M", "Black")).toBeNull();
  });
});
