import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { demoProductImages } from "@/data/demo-images";
import { categories, products } from "@/data/products";

describe("demo catalogue coverage", () => {
  it("offers at least ten distinct styles and two colour choices in every category", () => {
    expect(new Set(products.map((product) => product.slug)).size).toBe(products.length);

    for (const category of categories) {
      const styles = products.filter((product) => product.categorySlug === category.slug);
      expect(styles.length, category.name).toBeGreaterThanOrEqual(10);
      for (const style of styles) {
        expect(style.colours.length, style.slug).toBeGreaterThanOrEqual(2);
        for (const colour of style.colours) {
          expect(style.variants.some((variant) => variant.colour.name === colour.name), `${style.slug} / ${colour.name}`).toBe(true);
        }
      }
    }
  });

  it("has a real concept image file for every selectable style", () => {
    for (const product of products) {
      const image = demoProductImages[product.slug];
      expect(image?.src, product.slug).toBeTruthy();
      expect(existsSync(join(process.cwd(), "public", image.src.replace(/^\//, ""))), product.slug).toBe(true);
    }
  });
});
