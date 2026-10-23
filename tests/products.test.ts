import { describe, expect, it } from "vitest";

import { categories, getProductBySlug, isProductInStock, products } from "../src/data/products";

describe("sample catalogue", () => {
  it("contains twelve uniquely addressable sample products", () => {
    expect(products).toHaveLength(12);
    expect(new Set(products.map((product) => product.slug)).size).toBe(products.length);
    expect(products.every((product) => getProductBySlug(product.slug) === product)).toBe(true);
  });

  it("gives every product variants, accessible image labels and a valid category", () => {
    const categorySlugs = new Set(categories.map((category) => category.slug));
    for (const product of products) {
      expect(product.variants.length).toBeGreaterThan(0);
      expect(product.imageAlts.every((alt) => alt.trim().length > 0)).toBe(true);
      expect(categorySlugs.has(product.categorySlug)).toBe(true);
      expect(product.variants.every((variant) => Number.isInteger(variant.priceInPaise))).toBe(true);
    }
  });

  it("retains sold-out products instead of removing them", () => {
    const soldOutProduct = products.find((product) => product.slug === "canteen-cap");
    expect(soldOutProduct).toBeDefined();
    expect(isProductInStock(soldOutProduct!)).toBe(false);
  });

  it("keeps compare-at prices above the live price", () => {
    const comparedProducts = products.filter((product) => product.compareAtPaise !== undefined);
    expect(comparedProducts.length).toBeGreaterThan(0);
    expect(comparedProducts.every((product) => product.compareAtPaise! > product.priceInPaise)).toBe(true);
  });
});
