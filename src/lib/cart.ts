export const CART_STORAGE_KEY = "pb-underground-cart-v1";
export const SAVED_STORAGE_KEY = "pb-underground-saved-cart-v1";
export const CART_UPDATED_EVENT = "pb-underground:cart-updated";

export type CartLine = { variantId: string; quantity: number };

export function parseCartSnapshot(rawCart: string | null): CartLine[] {
  try {
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

export function readCart(): CartLine[] {
  return parseCartSnapshot(window.localStorage.getItem(CART_STORAGE_KEY));
}

export function addCartItem(variantId: string) {
  const cart = readCart();
  const existingLine = cart.find((line) => line.variantId === variantId);
  if (existingLine) existingLine.quantity = Math.min(10, existingLine.quantity + 1);
  else cart.push({ variantId, quantity: 1 });
  writeCart(cart);
}

export function writeCart(cart: readonly CartLine[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function updateCartItem(variantId: string, quantity: number) {
  const nextCart = readCart()
    .map((line) => line.variantId === variantId ? { ...line, quantity: Math.max(0, Math.min(10, quantity)) } : line)
    .filter((line) => line.quantity > 0);
  writeCart(nextCart);
}

export function removeCartItem(variantId: string) {
  writeCart(readCart().filter((line) => line.variantId !== variantId));
}

export function clearCart() {
  writeCart([]);
}

export function readSavedCart(): CartLine[] {
  return parseCartSnapshot(window.localStorage.getItem(SAVED_STORAGE_KEY));
}

function writeSavedCart(lines: readonly CartLine[]) {
  window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function saveCartItemForLater(variantId: string) {
  const cart = readCart();
  const line = cart.find((item) => item.variantId === variantId);
  if (!line) return;
  const saved = readSavedCart().filter((item) => item.variantId !== variantId);
  writeSavedCart([...saved, line]);
  removeCartItem(variantId);
}

export function restoreSavedCartItem(variantId: string) {
  const saved = readSavedCart();
  const line = saved.find((item) => item.variantId === variantId);
  if (!line) return;
  const cart = readCart();
  const existing = cart.find((item) => item.variantId === variantId);
  if (existing) existing.quantity = Math.min(10, existing.quantity + line.quantity);
  else cart.push(line);
  writeSavedCart(saved.filter((item) => item.variantId !== variantId));
  writeCart(cart);
}

export function getCartCount() {
  return readCart().reduce((count, line) => count + line.quantity, 0);
}
