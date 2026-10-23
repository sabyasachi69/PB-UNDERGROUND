"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CART_UPDATED_EVENT, getCartCount } from "@/lib/cart";

export function BagLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => setCount(getCartCount());
    updateCount();
    window.addEventListener(CART_UPDATED_EVENT, updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  return (
    <Link className="bag-link" href="/cart" aria-label={`Open shopping bag, ${count} ${count === 1 ? "item" : "items"}`}>
      <ShoppingBag aria-hidden="true" size={18} strokeWidth={1.6} />
      <span>Bag</span>
      <span className="bag-count" aria-hidden="true">{count}</span>
    </Link>
  );
}
