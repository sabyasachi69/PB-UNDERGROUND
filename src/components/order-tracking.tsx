"use client";

import { ArrowRight, Check, CircleAlert, Clock3, MapPin, PackageCheck, Share2, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { PublicTrackingOrder } from "@/lib/order-types";
import { HeaderScene } from "@/components/header-scene";

export function OrderTracking({ orderNumber, trackingToken }: { orderNumber: string; trackingToken: string }) {
  const [order, setOrder] = useState<PublicTrackingOrder | null>(null);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ token: trackingToken });
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}/track?${query}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { order?: PublicTrackingOrder; error?: string };
        if (!response.ok || !result.order) throw new Error(result.error ?? "Order not found.");
        return result.order;
      })
      .then(setOrder)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Order not found.");
      });
    return () => controller.abort();
  }, [orderNumber, trackingToken]);

  useEffect(() => {
    if (order?.paymentStatus !== "pending") return;
    const controller = new AbortController();
    const timer = window.setInterval(() => {
      const query = new URLSearchParams({ token: trackingToken });
      fetch(`/api/orders/${encodeURIComponent(orderNumber)}/payment?${query}`, { signal: controller.signal, cache: "no-store" })
        .then(async (response) => {
          const result = await response.json() as {
            payment?: Pick<PublicTrackingOrder, "paymentMethod" | "paymentStatus" | "paymentProvider" | "paymentExpiresAt" | "status" | "events">;
          };
          if (!response.ok || !result.payment) return;
          setOrder((current) => current ? { ...current, ...result.payment } : current);
        })
        .catch((pollError: unknown) => {
          if (pollError instanceof DOMException && pollError.name === "AbortError") return;
        });
    }, 3_000);
    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
  }, [order?.paymentStatus, orderNumber, trackingToken]);

  async function shareTracking() {
    const url = window.location.href;
    try {
      const nativeShare = Reflect.get(navigator, "share") as ((data: ShareData) => Promise<void>) | undefined;
      if (nativeShare) await nativeShare.call(navigator, { title: `Track ${orderNumber}`, url });
      else await navigator.clipboard.writeText(url);
      setShareStatus(nativeShare ? "Share sheet opened." : "Tracking link copied.");
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setShareStatus("Could not copy the link. Copy it from the address bar.");
    }
  }

  if (error) {
    return <section className="tracking-error"><span>404 / Tracking</span><h1>That order is not on this run.</h1><p>{error}</p><Link className="button button--ink" href="/shop">Back to the shop</Link></section>;
  }
  if (!order) return <div className="tracking-loading" aria-live="polite">Finding the latest hand-off…</div>;

  return (
    <>
      <header className="tracking-hero scene-host">
        <HeaderScene kind="delivery" />
        <div><p className="eyebrow">Order {order.paymentStatus === "paid" || order.paymentStatus === "due_on_delivery" ? "confirmed" : "received"} / {order.paymentMethod === "cod" ? "Cash on Delivery" : "UPI"}</p><h1>{order.paymentStatus === "failed" ? <>Payment<br />didn’t land.</> : <>It’s on<br />the board.</>}</h1></div>
        <div className="tracking-number"><span>Order number</span><strong>{order.orderNumber}</strong><button type="button" onClick={shareTracking}><Share2 aria-hidden="true" size={16} /> Share tracking</button><p role="status">{shareStatus}</p></div>
      </header>

      <section className="tracking-layout">
        <div className="tracking-main">
          {order.paymentMethod === "upi" ? (
            <div className={`payment-status-banner is-${order.paymentStatus}`} role="status">
              {order.paymentStatus === "pending" ? <Clock3 aria-hidden="true" size={22} /> : order.paymentStatus === "paid" ? <ShieldCheck aria-hidden="true" size={22} /> : <CircleAlert aria-hidden="true" size={22} />}
              <div>
                <strong>{order.paymentStatus === "pending" ? "Waiting for payment confirmation" : order.paymentStatus === "paid" ? "UPI payment verified" : "UPI payment failed or expired"}</strong>
                <p>{order.paymentStatus === "pending" ? "This page checks securely every three seconds. Reserved stock is released after 15 minutes." : order.paymentStatus === "paid" ? "The verified payment is attached to this order." : "Reserved stock has been returned. Your bag remains available so you can place a new order."}</p>
              </div>
            </div>
          ) : null}
          <div className="tracking-intro"><span className="tracking-mark"><PackageCheck aria-hidden="true" size={28} /></span><div><h2>Thanks, {order.firstName}.</h2><p>Your order is placed for {order.slotDateLabel}, {order.slotLabel}. We’ll update this page as each hand-off happens.</p></div></div>
          <ol className="tracking-timeline">
            {order.events.map((event) => {
              const current = event.status === order.status;
              const complete = Boolean(event.timestamp);
              return (
                <li className={current ? "is-current" : complete ? "is-complete" : ""} key={event.status}>
                  <span className="timeline-node">{complete && !current ? <Check aria-hidden="true" size={14} /> : null}</span>
                  <div><strong>{event.label}</strong><time>{event.timestamp ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.timestamp)) : "Waiting"}</time></div>
                </li>
              );
            })}
          </ol>
          {order.deliveryPerson ? <div className="delivery-person"><Truck aria-hidden="true" size={22} /><div><span>Your delivery person</span><strong>{order.deliveryPerson.name}</strong><a href={`tel:${order.deliveryPerson.phone}`}>{order.deliveryPerson.phone}</a></div></div> : <p className="dispatch-note"><Truck aria-hidden="true" size={18} /> Delivery person details appear only after dispatch.</p>}
        </div>

        <aside className="tracking-summary">
          <p className="eyebrow">Private tracking</p>
          <div className="tracking-destination"><MapPin aria-hidden="true" size={18} /><div><strong>{order.zoneName}</strong><span>{order.area}</span></div></div>
          <div className="tracking-help"><span>Share carefully</span><p>This private link is the key to the order’s delivery progress. It intentionally hides the item list, amount, phone, email and street address.</p></div>
          <Link className="text-link" href="/account">Open signed-in order history <ArrowRight aria-hidden="true" size={16} /></Link>
        </aside>
      </section>

      <section className="post-order-account"><div><p className="eyebrow">Guest checkout complete</p><h2>Want this order waiting next time?</h2><p>Account creation, saved addresses and one-tap reorder arrive in Phase 5. This tracking link works without an account.</p></div><Link className="text-link" href="/shop">Keep browsing <ArrowRight aria-hidden="true" size={17} /></Link></section>
    </>
  );
}

