"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  CART_STORAGE_KEY,
  CART_UPDATED_EVENT,
  SAVED_STORAGE_KEY,
  parseCartSnapshot,
} from "@/lib/cart";

const EMPTY_CART = "[]";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CART_UPDATED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function useStoredCart(key: string) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key) ?? EMPTY_CART,
    () => EMPTY_CART,
  );
  return useMemo(() => parseCartSnapshot(snapshot), [snapshot]);
}

export function useCartLines() {
  return useStoredCart(CART_STORAGE_KEY);
}

export function useSavedCartLines() {
  return useStoredCart(SAVED_STORAGE_KEY);
}

export function useHydrated() {
  return useSyncExternalStore(() => () => undefined, () => true, () => false);
}
