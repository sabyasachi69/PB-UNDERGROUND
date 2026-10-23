"use client";

import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, ShieldCheck, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { clearCart } from "@/lib/cart";
import { STORE_SETTINGS, type CartQuote, type DeliverySlot } from "@/lib/commerce";
import { formatInrFromPaise } from "@/lib/money";
import { useCartLines, useHydrated } from "@/hooks/use-cart";

type ZoneCheck = { serviceable: boolean; message: string };

type ContactState = {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  landmark: string;
  pincode: string;
  notes: string;
};

const emptyContact: ContactState = {
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  landmark: "",
  pincode: "",
  notes: "",
};

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedZone = searchParams.get("zone");
  const initialZone = STORE_SETTINGS.zones.some((zone) => zone.id === requestedZone)
    ? requestedZone ?? STORE_SETTINGS.zones[0].id
    : STORE_SETTINGS.zones[0].id;
  const couponCode = searchParams.get("coupon") ?? "";
  const lines = useCartLines();
  const hydrated = useHydrated();
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState<ContactState>(emptyContact);
  const [zoneId, setZoneId] = useState(initialZone);
  const [zoneCheck, setZoneCheck] = useState<ZoneCheck | null>(null);
  const [checkingZone, setCheckingZone] = useState(false);
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [slotId, setSlotId] = useState("");
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || !lines.length) return;
    const controller = new AbortController();
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, zoneId, couponCode: couponCode || undefined }),
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<CartQuote>)
      .then(setQuote)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSubmitError("The server could not refresh the order total.");
      });
    return () => controller.abort();
  }, [couponCode, hydrated, lines, zoneId]);

  useEffect(() => {
    const pincode = contact.pincode.replace(/\D/g, "");
    if (pincode.length !== 6) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCheckingZone(true);
      fetch("/api/zones/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, pincode }),
        signal: controller.signal,
      })
        .then(async (response) => response.json() as Promise<ZoneCheck>)
        .then(setZoneCheck)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setZoneCheck({ serviceable: false, message: "We could not check this pincode. Try again." });
        })
        .finally(() => setCheckingZone(false));
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [contact.pincode, zoneId]);

  useEffect(() => {
    if (step < 2 || !zoneCheck?.serviceable) return;
    const controller = new AbortController();
    fetch(`/api/slots?zone=${encodeURIComponent(zoneId)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("No slots available.");
        return response.json() as Promise<{ slots: DeliverySlot[] }>;
      })
      .then((result) => {
        setSlots(result.slots);
        setSlotId((current) => current || result.slots[0]?.id || "");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSubmitError("Delivery slots could not be loaded. Try again.");
      });
    return () => controller.abort();
  }, [step, zoneCheck?.serviceable, zoneId]);

  function updateContact(field: keyof ContactState, value: string) {
    if (field === "pincode") setZoneCheck(null);
    setContact((current) => ({ ...current, [field]: field === "pincode" || field === "phone" ? value.replace(/\D/g, "") : value }));
  }

  function continueFromAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!zoneCheck?.serviceable) {
      setSubmitError("Choose a serviceable area and pincode before continuing.");
      return;
    }
    setSubmitError("");
    setStep(2);
  }

  function continueFromSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slotId) {
      setSubmitError("Choose an available delivery slot.");
      return;
    }
    setSubmitError("");
    setStep(3);
  }

  async function placeOrder() {
    if (placingOrder || !quote?.isCheckoutReady || !slotId) return;
    setPlacingOrder(true);
    setSubmitError("");
    idempotencyKey.current ??= crypto.randomUUID();
    const payload = {
      idempotencyKey: idempotencyKey.current,
      lines,
      couponCode: couponCode || undefined,
      contact: { name: contact.name, phone: contact.phone, email: contact.email },
      address: {
        line1: contact.line1,
        line2: contact.line2 || undefined,
        landmark: contact.landmark || undefined,
        pincode: contact.pincode,
      },
      zoneId,
      slotId,
      paymentMethod: "cod",
      notes: contact.notes || undefined,
    } as const;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string; order?: { orderNumber: string } };
      if (!response.ok || !result.order) throw new Error(result.error ?? "The order could not be placed.");
      clearCart();
      router.push(`/order/${result.order.orderNumber}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The order could not be placed.");
      setPlacingOrder(false);
    }
  }

  if (!hydrated) return <div className="checkout-loading" aria-live="polite">Preparing secure checkout…</div>;
  if (!lines.length) {
    return (
      <section className="checkout-empty">
        <h2>Your bag is empty.</h2>
        <p>Add a piece before opening checkout.</p>
        <Link className="button button--ink" href="/shop">Return to the shop</Link>
      </section>
    );
  }

  const itemCount = lines.reduce((count, line) => count + line.quantity, 0);

  return (
    <div className="checkout-shell">
      <section className="checkout-flow" aria-label="Checkout steps">
        <ol className="checkout-progress">
          {["Contact + address", "Delivery slot", "Payment + review"].map((label, index) => {
            const number = index + 1;
            return <li className={number === step ? "is-current" : number < step ? "is-complete" : ""} key={label}><span>{number < step ? <Check aria-hidden="true" size={14} /> : number}</span><strong>{label}</strong></li>;
          })}
        </ol>

        {step === 1 ? (
          <form className="checkout-step" onSubmit={continueFromAddress}>
            <div className="step-heading"><span>01</span><div><p className="eyebrow">Guest checkout</p><h2>Where should this reach you?</h2></div></div>
            <div className="form-grid">
              <label>Full name<input required autoComplete="name" value={contact.name} onChange={(event) => updateContact("name", event.target.value)} /></label>
              <label>Mobile number<input required inputMode="tel" autoComplete="tel" minLength={10} maxLength={10} value={contact.phone} onChange={(event) => updateContact("phone", event.target.value)} /></label>
              <label className="span-two">Email <small>Optional — used only for the receipt</small><input type="email" autoComplete="email" value={contact.email} onChange={(event) => updateContact("email", event.target.value)} /></label>
              <label className="span-two">Address line<input required autoComplete="street-address" value={contact.line1} onChange={(event) => updateContact("line1", event.target.value)} placeholder="Hostel, block, room or street" /></label>
              <label>More address detail<input value={contact.line2} onChange={(event) => updateContact("line2", event.target.value)} placeholder="Floor or gate" /></label>
              <label>Landmark<input value={contact.landmark} onChange={(event) => updateContact("landmark", event.target.value)} placeholder="Nearest known point" /></label>
              <label>Delivery area<select value={zoneId} onChange={(event) => { setZoneId(event.target.value); setZoneCheck(null); }}>{STORE_SETTINGS.zones.map((zone) => <option value={zone.id} key={zone.id}>{zone.name}</option>)}</select></label>
              <label>Pincode<input required inputMode="numeric" autoComplete="postal-code" minLength={6} maxLength={6} value={contact.pincode} onChange={(event) => updateContact("pincode", event.target.value)} placeholder="144411" /></label>
            </div>
            <div className={`zone-result ${zoneCheck?.serviceable ? "is-success" : zoneCheck ? "is-error" : ""}`} aria-live="polite">
              <MapPin aria-hidden="true" size={19} />
              <span>{checkingZone ? "Checking this pincode…" : zoneCheck?.message ?? "Enter a six-digit pincode to check delivery."}</span>
            </div>
            <p className="collection-notice"><ShieldCheck aria-hidden="true" size={17} /> We collect only the contact and address details needed to deliver this order.</p>
            {submitError ? <p className="form-message is-error" role="alert">{submitError}</p> : null}
            <button className="button button--signal step-next" type="submit">Choose delivery time <ArrowRight aria-hidden="true" size={18} /></button>
          </form>
        ) : null}

        {step === 2 ? (
          <form className="checkout-step" onSubmit={continueFromSlot}>
            <div className="step-heading"><span>02</span><div><p className="eyebrow">Two-hour cutoff applied</p><h2>Choose a hand-off window.</h2></div></div>
            <div className="slot-list" role="radiogroup" aria-label="Available delivery slots">
              {slots.map((slot) => (
                <label className={slot.id === slotId ? "is-selected" : ""} key={slot.id}>
                  <input type="radio" name="slot" value={slot.id} checked={slot.id === slotId} onChange={() => setSlotId(slot.id)} />
                  <span><strong>{slot.dateLabel}</strong><small>{slot.label}</small></span><Clock3 aria-hidden="true" size={19} />
                </label>
              ))}
            </div>
            {!slots.length ? <p className="form-message">Checking the next available windows…</p> : null}
            {submitError ? <p className="form-message is-error" role="alert">{submitError}</p> : null}
            <div className="step-actions"><button className="button button--ghost" type="button" onClick={() => setStep(1)}><ArrowLeft aria-hidden="true" size={18} /> Back</button><button className="button button--signal" type="submit" disabled={!slotId}>Review payment <ArrowRight aria-hidden="true" size={18} /></button></div>
          </form>
        ) : null}

        {step === 3 ? (
          <section className="checkout-step">
            <div className="step-heading"><span>03</span><div><p className="eyebrow">No account required</p><h2>Review it once. Place it once.</h2></div></div>
            <div className="payment-choice is-selected">
              <span><WalletCards aria-hidden="true" size={22} /></span><div><strong>Cash on Delivery</strong><p>Keep exact change if possible. The delivery person’s details appear on tracking once dispatched.</p></div><Check aria-hidden="true" size={18} />
            </div>
            <div className="payment-choice is-disabled" aria-disabled="true">
              <span>UPI</span><div><strong>UPI via Razorpay</strong><p>Test-mode UPI arrives in Phase 4 after webhook verification is added.</p></div>
            </div>
            <label className="checkout-notes">Note for delivery <small>Optional</small><textarea value={contact.notes} onChange={(event) => updateContact("notes", event.target.value)} maxLength={300} placeholder="Gate, timing or hand-off detail" /></label>
            <div className="review-address"><span>Deliver to</span><strong>{contact.name}</strong><p>{contact.line1}{contact.line2 ? `, ${contact.line2}` : ""}<br />{STORE_SETTINGS.zones.find((zone) => zone.id === zoneId)?.name} — {contact.pincode}</p><button type="button" onClick={() => setStep(1)}>Edit address</button></div>
            {submitError ? <p className="form-message is-error" role="alert">{submitError}</p> : null}
            <div className="step-actions"><button className="button button--ghost" type="button" onClick={() => setStep(2)}><ArrowLeft aria-hidden="true" size={18} /> Back</button><button className="button button--signal" type="button" disabled={placingOrder || !quote?.isCheckoutReady} onClick={placeOrder}>{placingOrder ? "Placing once…" : `Place COD order · ${formatInrFromPaise(quote?.totalInPaise ?? 0)}`}</button></div>
          </section>
        ) : null}
      </section>

      <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
        <p className="eyebrow">Your order</p><h2 id="checkout-summary-title">{itemCount} {itemCount === 1 ? "piece" : "pieces"}</h2>
        <div className="checkout-mini-lines">{quote?.lines.map((line) => <div key={line.variantId}><span>{line.quantity} × {line.productName}<small>{line.colour} / {line.size}</small></span><strong>{formatInrFromPaise(line.lineTotalInPaise)}</strong></div>)}</div>
        <dl className="totals-list">
          <div><dt>Subtotal</dt><dd>{formatInrFromPaise(quote?.subtotalInPaise ?? 0)}</dd></div>
          {quote?.discountInPaise ? <div className="is-discount"><dt>{quote.coupon?.code}</dt><dd>−{formatInrFromPaise(quote.discountInPaise)}</dd></div> : null}
          <div><dt>Delivery</dt><dd>{quote?.deliveryFeeInPaise ? formatInrFromPaise(quote.deliveryFeeInPaise) : "Free"}</dd></div>
          <div className="totals-grand"><dt>Total</dt><dd>{formatInrFromPaise(quote?.totalInPaise ?? 0)}</dd></div>
        </dl>
        <p>GST included. Final prices, coupon, stock and slot are recalculated by the server when the order is placed.</p>
      </aside>
    </div>
  );
}

