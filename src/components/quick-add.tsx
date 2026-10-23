"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";

import type { ProductVariant } from "@/data/products";
import { addCartItem } from "@/lib/cart";

type QuickAddProps = { productName: string; variants: readonly ProductVariant[] };

export function QuickAdd({ productName, variants }: QuickAddProps) {
  const [addedSize, setAddedSize] = useState<string>();
  const sizes = [...new Set(variants.map((variant) => variant.size))];

  function addSize(size: string) {
    const variant = variants.find((item) => item.size === size && item.stockQty > 0);
    if (!variant) return;
    addCartItem(variant.id);
    setAddedSize(size);
  }

  return (
    <details className="quick-add">
      <summary><Plus aria-hidden="true" size={15} /> Quick add</summary>
      <div className="quick-add-sheet" aria-label={`Choose a size for ${productName}`}>
        <span>Choose size</span>
        <div>
          {sizes.map((size) => {
            const available = variants.some((variant) => variant.size === size && variant.stockQty > 0);
            return (
              <button key={size} type="button" disabled={!available} onClick={() => addSize(size)}>
                {addedSize === size ? <Check aria-hidden="true" size={14} /> : size}
                <span className="sr-only">{available ? `Add size ${size} to bag` : `Size ${size} is sold out`}</span>
              </button>
            );
          })}
        </div>
        {addedSize ? <p role="status">Size {addedSize} added to bag.</p> : null}
      </div>
    </details>
  );
}
