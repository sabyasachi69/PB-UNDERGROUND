"use client";

import { ArrowRight, Bookmark, Minus, Plus, RotateCcw, Tag, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { products } from "@/data/products";
import { removeCartItem, restoreSavedCartItem, saveCartItemForLater, updateCartItem, type CartLine } from "@/lib/cart";
import { STORE_SETTINGS, type CartQuote } from "@/lib/commerce";
import { formatInrFromPaise } from "@/lib/money";
import { useCartLines, useHydrated, useSavedCartLines } from "@/hooks/use-cart";

const variantLookup = new Map(
  products.flatMap((product) => product.variants.map((variant) => [variant.id, { product, variant }] as const)),
);

export function CartClient() {
  const lines = useCartLines();
  const savedLines = useSavedCartLines();
  const hydrated = useHydrated();
  const [zoneId, setZoneId] = useState(STORE_SETTINGS.zones[0].id);
  const [couponDraft, setCouponDraft] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    const controller = new AbortController();
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, zoneId, couponCode: couponCode || undefined }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("The server could not price this bag.");
        return response.json() as Promise<CartQuote>;
      })
      .then((nextQuote) => { setQuote(nextQuote); setQuoteError(""); })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setQuoteError(error instanceof Error ? error.message : "The server could not price this bag.");
      });
    return () => controller.abort();
  }, [couponCode, hydrated, lines, zoneId]);

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCouponMessage("");
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponDraft, lines }),
    });
    const result = await response.json() as { valid: boolean; message?: string; coupon?: { code: string; label: string } };
    if (!response.ok || !result.valid || !result.coupon) {
      setCouponMessage(result.message ?? "That coupon could not be applied.");
      return;
    }
    setCouponCode(result.coupon.code);
    setCouponDraft(result.coupon.code);
    setCouponMessage(`${result.coupon.label} applied.`);
  }

  if (!hydrated) return <div className="cart-loading" aria-live="polite">Opening your bag…</div>;

  const itemCount = lines.reduce((count, line) => count + line.quantity, 0);

  if (lines.length === 0) {
    return (
      <section className="cart-empty">
        <span>00 / Empty</span>
        <h2>Your bag has room.</h2>
        <p>Start with a useful layer, a dependable tee, or whatever earns a place in the daily rotation.</p>
        <Link className="button button--ink" href="/shop">Browse the drop <ArrowRight aria-hidden="true" size={17} /></Link>
        {savedLines.length ? <SavedItems lines={savedLines} /> : null}
      </section>
    );
  }

  const progress = quote ? Math.min(100, (quote.subtotalInPaise / STORE_SETTINGS.freeDeliveryAboveInPaise) * 100) : 0;

  return (
    <div className="cart-layout">
      <section className="cart-lines" aria-labelledby="cart-items-title">
        <div className="cart-section-heading">
          <h2 id="cart-items-title">In the bag</h2>
          <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        </div>
        {quote?.lines.map((line, index) => (
          <article className="cart-line" key={line.variantId}>
            <Link className={`cart-line-art product-visual product-visual--${line.palette}`} href={`/product/${line.productSlug}`} aria-label={`View ${line.productName}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </Link>
            <div className="cart-line-copy">
              <p>{line.supplierName}</p>
              <h3><Link href={`/product/${line.productSlug}`}>{line.productName}</Link></h3>
              <span>{line.colour} / {line.size}</span>
              <div className="quantity-stepper" aria-label={`Quantity for ${line.productName}`}>
                <button type="button" onClick={() => updateCartItem(line.variantId, line.quantity - 1)} aria-label={`Decrease ${line.productName} quantity`}><Minus aria-hidden="true" size={15} /></button>
                <output aria-live="polite">{line.quantity}</output>
                <button type="button" onClick={() => updateCartItem(line.variantId, line.quantity + 1)} disabled={line.quantity >= line.stockQty} aria-label={`Increase ${line.productName} quantity`}><Plus aria-hidden="true" size={15} /></button>
              </div>
              <div className="cart-line-actions">
                <button type="button" onClick={() => saveCartItemForLater(line.variantId)}><Bookmark aria-hidden="true" size={14} /> Save for later</button>
                <button type="button" onClick={() => removeCartItem(line.variantId)}><Trash2 aria-hidden="true" size={14} /> Remove</button>
              </div>
            </div>
            <strong>{formatInrFromPaise(line.lineTotalInPaise)}</strong>
          </article>
        ))}
        {!quote ? <p className="cart-inline-status" aria-live="polite">Checking live prices and stock…</p> : null}
        {quote?.errors.filter((error) => !error.toLowerCase().includes("minimum order")).map((error) => <p className="form-message is-error" key={error}>{error}</p>)}
        {quoteError ? <p className="form-message is-error">{quoteError}</p> : null}
        {savedLines.length ? <SavedItems lines={savedLines} /> : null}
      </section>

      <aside className="cart-summary" aria-labelledby="summary-title">
        <p className="eyebrow">Server-checked totals</p>
        <h2 id="summary-title">Order ledger</h2>
        <div className="free-delivery-meter">
          <div><Truck aria-hidden="true" size={18} /><span>{quote?.freeDeliveryRemainingInPaise ? `${formatInrFromPaise(quote.freeDeliveryRemainingInPaise)} from free delivery` : "Free delivery unlocked"}</span></div>
          <div className="meter-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        </div>

        <label className="field-label" htmlFor="cart-zone">Delivery area</label>
        <select id="cart-zone" value={zoneId} onChange={(event) => setZoneId(event.target.value)}>
          {STORE_SETTINGS.zones.map((zone) => <option value={zone.id} key={zone.id}>{zone.name}</option>)}
        </select>
        <p className="field-help">Final serviceability is checked against your pincode at checkout.</p>

        <form className="coupon-form" onSubmit={applyCoupon}>
          <label htmlFor="coupon"><Tag aria-hidden="true" size={16} /> Student coupon</label>
          <div><input id="coupon" value={couponDraft} onChange={(event) => setCouponDraft(event.target.value.toUpperCase())} placeholder="Try STUDENT10" /><button type="submit">Apply</button></div>
          {couponMessage ? <p className={couponCode ? "is-success" : "is-error"} role="status">{couponMessage}</p> : null}
          {couponCode ? <button className="coupon-remove" type="button" onClick={() => { setCouponCode(""); setCouponDraft(""); setCouponMessage("Coupon removed."); }}>Remove code</button> : null}
        </form>

        <dl className="totals-list">
          <div><dt>Subtotal</dt><dd>{formatInrFromPaise(quote?.subtotalInPaise ?? 0)}</dd></div>
          {quote?.discountInPaise ? <div className="is-discount"><dt>Coupon</dt><dd>−{formatInrFromPaise(quote.discountInPaise)}</dd></div> : null}
          <div><dt>Delivery</dt><dd>{quote?.deliveryFeeInPaise ? formatInrFromPaise(quote.deliveryFeeInPaise) : "Free"}</dd></div>
          <div className="totals-tax"><dt>GST</dt><dd>{formatInrFromPaise(quote?.taxIncludedInPaise ?? 0)} included</dd></div>
          <div className="totals-grand"><dt>Total</dt><dd>{formatInrFromPaise(quote?.totalInPaise ?? 0)}</dd></div>
        </dl>

        {quote?.minimumOrderRemainingInPaise ? <p className="form-message is-error">Add {formatInrFromPaise(quote.minimumOrderRemainingInPaise)} to reach the minimum order.</p> : null}
        {quote?.isCheckoutReady ? (
          <Link className="button button--signal cart-checkout" href={`/checkout?zone=${zoneId}${couponCode ? `&coupon=${couponCode}` : ""}`}>Continue to checkout <ArrowRight aria-hidden="true" size={18} /></Link>
        ) : (
          <button className="button button--signal cart-checkout" type="button" disabled>Continue to checkout</button>
        )}
        <p className="privacy-note">Prices and stock are checked again on the server when you place the order.</p>
      </aside>
    </div>
  );
}

function SavedItems({ lines }: { lines: readonly CartLine[] }) {
  return (
    <section className="saved-items" aria-labelledby="saved-title">
      <div className="cart-section-heading"><h2 id="saved-title">Saved for later</h2><span>{lines.length}</span></div>
      {lines.map((line) => {
        const match = variantLookup.get(line.variantId);
        if (!match) return null;
        return (
          <article key={line.variantId}>
            <div><strong>{match.product.name}</strong><span>{match.variant.colour.name} / {match.variant.size}</span></div>
            <button type="button" onClick={() => restoreSavedCartItem(line.variantId)}><RotateCcw aria-hidden="true" size={14} /> Move to bag</button>
          </article>
        );
      })}
    </section>
  );
}

