"use client";

import { ArrowLeft, ArrowRight, Check, Clock3, MapPin, ShieldCheck, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { clearCart } from "@/lib/cart";
import type { AccountSnapshot, SavedAddress } from "@/lib/account-types";
import { STORE_SETTINGS, type CartQuote, type DeliverySlot } from "@/lib/commerce";
import { formatInrFromPaise } from "@/lib/money";
import type { PaymentLaunch } from "@/lib/order-types";
import { useCartLines, useHydrated } from "@/hooks/use-cart";

type ZoneCheck = { serviceable: boolean; message: string };
type PaymentMethod = "cod" | "upi";
type PaymentSession = { orderNumber: string; payment: PaymentLaunch };

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error: {
    description?: string;
    reason?: string;
    metadata?: { payment_id?: string };
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

async function loadRazorpayCheckout() {
  if (window.Razorpay) return;
  const existing = document.querySelector<HTMLScriptElement>('script[data-pbu-razorpay="checkout"]');
  existing?.remove();
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.pbuRazorpay = "checkout";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Razorpay Checkout could not load.")), { once: true });
    document.head.append(script);
  });
}

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [completingPayment, setCompletingPayment] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<AccountSnapshot> : null)
      .then((account) => {
        if (!account) return;
        setSavedAddresses(account.addresses);
        setContact((current) => ({ ...current, name: current.name || account.user.displayName, email: current.email || account.user.email, phone: current.phone || account.user.phone || "" }));
      })
      .catch((caught: unknown) => { if (!(caught instanceof DOMException && caught.name === "AbortError")) setSavedAddresses([]); });
    return () => controller.abort();
  }, []);

  function applySavedAddress(address: SavedAddress) {
    setContact((current) => ({
      ...current,
      name: address.recipientName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      landmark: address.landmark ?? "",
      pincode: address.pincode,
    }));
    if (address.zoneId && STORE_SETTINGS.zones.some((zone) => zone.id === address.zoneId)) setZoneId(address.zoneId);
    setZoneCheck(null);
  }

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

  async function recordPaymentFailure(session: PaymentSession, failure?: RazorpayFailure) {
    await fetch("/api/payments/razorpay/failure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: session.orderNumber,
        attemptToken: session.payment.attemptToken,
        razorpayPaymentId: failure?.error.metadata?.payment_id,
        reason: failure?.error.reason ?? failure?.error.description,
      }),
    });
  }

  async function openRazorpayPayment(session: PaymentSession) {
    if (!session.payment.keyId) throw new Error("The Razorpay test key is missing from this payment session.");
    await loadRazorpayCheckout();
    if (!window.Razorpay) throw new Error("Razorpay Checkout did not initialise.");
    const checkout = new window.Razorpay({
      key: session.payment.keyId,
      amount: session.payment.amountInPaise,
      currency: session.payment.currency,
      name: "PB UNDERGROUND",
      description: `Test payment for ${session.orderNumber}`,
      order_id: session.payment.providerOrderId,
      method: "upi",
      remember_customer: false,
      timeout: 900,
      prefill: {
        name: contact.name,
        email: contact.email,
        contact: `+91${contact.phone}`,
      },
      theme: { color: "#c8431e" },
      modal: {
        confirm_close: true,
        ondismiss: () => router.push(`/order/${session.orderNumber}`),
      },
      handler: async (response: RazorpaySuccess) => {
        try {
          const verification = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderNumber: session.orderNumber,
              attemptToken: session.payment.attemptToken,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const result = await verification.json() as { error?: string };
          if (!verification.ok) throw new Error(result.error ?? "The payment could not be verified.");
          clearCart();
          router.push(`/order/${session.orderNumber}`);
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : "The payment could not be verified.");
          router.push(`/order/${session.orderNumber}`);
        }
      },
    });
    checkout.on("payment.failed", (failure) => {
      void recordPaymentFailure(session, failure).finally(() => router.push(`/order/${session.orderNumber}`));
    });
    checkout.open();
  }

  async function completeTestPayment(outcome: "success" | "failure") {
    if (!paymentSession || paymentSession.payment.provider !== "simulator" || completingPayment) return;
    setCompletingPayment(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/payments/test/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: paymentSession.orderNumber,
          attemptToken: paymentSession.payment.attemptToken,
          outcome,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The test payment could not be completed.");
      if (outcome === "success") clearCart();
      router.push(`/order/${paymentSession.orderNumber}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The test payment could not be completed.");
      setCompletingPayment(false);
    }
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
      paymentMethod,
      notes: contact.notes || undefined,
    } as const;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string; order?: { orderNumber: string }; payment?: PaymentLaunch };
      if (!response.ok || !result.order) {
        if (response.ok === false) idempotencyKey.current = null;
        throw new Error(result.error ?? "The order could not be placed.");
      }
      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/order/${result.order.orderNumber}`);
        return;
      }
      if (!result.payment) throw new Error("The payment session was not returned.");
      const session = { orderNumber: result.order.orderNumber, payment: result.payment };
      setPaymentSession(session);
      if (result.payment.provider === "razorpay") await openRazorpayPayment(session);
      setPlacingOrder(false);
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
            {savedAddresses.length ? <div className="saved-address-picker"><span>Use a saved address</span><div>{savedAddresses.map((address) => <button key={address.id} type="button" onClick={() => applySavedAddress(address)}><strong>{address.label}</strong><small>{address.line1} / {address.pincode}</small></button>)}</div></div> : null}
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
            <button className={`payment-choice ${paymentMethod === "cod" ? "is-selected" : ""}`} type="button" aria-pressed={paymentMethod === "cod"} onClick={() => setPaymentMethod("cod")}>
              <span><WalletCards aria-hidden="true" size={22} /></span><div><strong>Cash on Delivery</strong><p>Keep exact change if possible. The delivery person’s details appear on tracking once dispatched.</p></div>{paymentMethod === "cod" ? <Check aria-hidden="true" size={18} /> : null}
            </button>
            <button className={`payment-choice ${paymentMethod === "upi" ? "is-selected" : ""}`} type="button" aria-pressed={paymentMethod === "upi"} onClick={() => setPaymentMethod("upi")}>
              <span>UPI</span><div><strong>UPI via Razorpay</strong><p>Runs in test mode. Payment is signature-verified and stock is held for 15 minutes.</p></div>{paymentMethod === "upi" ? <Check aria-hidden="true" size={18} /> : null}
            </button>
            <label className="checkout-notes">Note for delivery <small>Optional</small><textarea value={contact.notes} onChange={(event) => updateContact("notes", event.target.value)} maxLength={300} placeholder="Gate, timing or hand-off detail" /></label>
            <div className="review-address"><span>Deliver to</span><strong>{contact.name}</strong><p>{contact.line1}{contact.line2 ? `, ${contact.line2}` : ""}<br />{STORE_SETTINGS.zones.find((zone) => zone.id === zoneId)?.name} — {contact.pincode}</p><button type="button" onClick={() => setStep(1)}>Edit address</button></div>
            {submitError ? <p className="form-message is-error" role="alert">{submitError}</p> : null}
            <div className="step-actions"><button className="button button--ghost" type="button" onClick={() => setStep(2)}><ArrowLeft aria-hidden="true" size={18} /> Back</button><button className="button button--signal" type="button" disabled={placingOrder || !quote?.isCheckoutReady} onClick={placeOrder}>{placingOrder ? "Preparing securely…" : `${paymentMethod === "cod" ? "Place COD order" : "Pay with UPI"} · ${formatInrFromPaise(quote?.totalInPaise ?? 0)}`}</button></div>
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

      {paymentSession?.payment.provider === "simulator" ? (
        <div className="payment-test-overlay" role="dialog" aria-modal="true" aria-labelledby="test-payment-title">
          <section className="payment-test-panel">
            <p className="eyebrow">[SAMPLE] Local test payment</p>
            <h2 id="test-payment-title">Choose the bank response.</h2>
            <p>No money moves. This credential-free simulator exercises the same paid and failed order states used by Razorpay test mode.</p>
            <dl><div><dt>Order</dt><dd>{paymentSession.orderNumber}</dd></div><div><dt>Amount</dt><dd>{formatInrFromPaise(paymentSession.payment.amountInPaise)}</dd></div></dl>
            {submitError ? <p className="form-message is-error" role="alert">{submitError}</p> : null}
            <div className="payment-test-actions">
              <button className="button button--signal" type="button" disabled={completingPayment} onClick={() => completeTestPayment("success")}>{completingPayment ? "Recording…" : "Simulate success"}</button>
              <button className="button button--ghost" type="button" disabled={completingPayment} onClick={() => completeTestPayment("failure")}>Simulate failure</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

