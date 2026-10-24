"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function WishlistButton({ variantId, compact = false }: { variantId: string; compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (pending || saved) return;
    setPending(true);
    setError("");
    const response = await fetch("/api/account/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId }) });
    const result = await response.json() as { error?: string };
    if (response.status === 401) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!response.ok) {
      setError(result.error ?? "Could not save this piece.");
      setPending(false);
      return;
    }
    setSaved(true);
    setPending(false);
  }

  return (
    <div className={compact ? "wishlist-control is-compact" : "wishlist-control"}>
      <button type="button" onClick={save} disabled={pending || saved} aria-pressed={saved} title="Save to wishlist"><Heart aria-hidden="true" size={17} fill={saved ? "currentColor" : "none"} />{compact ? <span className="sr-only">{saved ? "Saved to wishlist" : "Save to wishlist"}</span> : saved ? "Saved to wishlist" : pending ? "Saving…" : "Save to wishlist"}</button>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
}
