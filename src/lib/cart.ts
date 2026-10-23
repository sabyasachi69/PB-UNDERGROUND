const CART_STORAGE_KEY = "pb-underground-cart-v1";
export const CART_UPDATED_EVENT = "pb-underground:cart-updated";

export type CartLine = { variantId: string; quantity: number };

export function readCart(): CartLine[] {
  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) return [];
    const parsedCart: unknown = JSON.parse(rawCart);
    if (!Array.isArray(parsedCart)) return [];
    return parsedCart.filter(
      (line): line is CartLine =>
        typeof line === "object" && line !== null &&
        "variantId" in line && typeof line.variantId === "string" &&
        "quantity" in line && Number.isInteger(line.quantity) && line.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function addCartItem(variantId: string) {
  const cart = readCart();
  const existingLine = cart.find((line) => line.variantId === variantId);
  if (existingLine) existingLine.quantity += 1;
  else cart.push({ variantId, quantity: 1 });
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function getCartCount() {
  return readCart().reduce((count, line) => count + line.quantity, 0);
}
