"use client";

import { ArrowRight, Check, MapPin, PackageCheck, Share2, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatInrFromPaise } from "@/lib/money";
import type { TrackingOrder } from "@/lib/order-types";

export function OrderTracking({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}/track`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { order?: TrackingOrder; error?: string };
        if (!response.ok || !result.order) throw new Error(result.error ?? "Order not found.");
        return result.order;
      })
      .then(setOrder)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Order not found.");
      });
    return () => controller.abort();
  }, [orderNumber]);

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
      <header className="tracking-hero">
        <div><p className="eyebrow">Order confirmed / Cash on Delivery</p><h1>It’s on<br />the board.</h1></div>
        <div className="tracking-number"><span>Order number</span><strong>{order.orderNumber}</strong><button type="button" onClick={shareTracking}><Share2 aria-hidden="true" size={16} /> Share tracking</button><p role="status">{shareStatus}</p></div>
      </header>

      <section className="tracking-layout">
        <div className="tracking-main">
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
          <p className="eyebrow">Order summary</p>
          <div className="tracking-destination"><MapPin aria-hidden="true" size={18} /><div><strong>{order.zoneName}</strong><span>{order.area}</span></div></div>
          <div className="tracking-items">{order.items.map((item) => <div key={item.variantId}><span>{item.quantity} × <Link href={`/product/${item.productSlug}`}>{item.name}</Link><small>{item.colour} / {item.size}</small></span><strong>{formatInrFromPaise(item.lineTotalInPaise)}</strong></div>)}</div>
          <dl className="totals-list">
            <div><dt>Subtotal</dt><dd>{formatInrFromPaise(order.subtotalInPaise)}</dd></div>
            {order.discountInPaise ? <div className="is-discount"><dt>{order.couponCode}</dt><dd>−{formatInrFromPaise(order.discountInPaise)}</dd></div> : null}
            <div><dt>Delivery</dt><dd>{order.deliveryFeeInPaise ? formatInrFromPaise(order.deliveryFeeInPaise) : "Free"}</dd></div>
            <div className="totals-grand"><dt>COD due</dt><dd>{formatInrFromPaise(order.totalInPaise)}</dd></div>
          </dl>
          <div className="tracking-help"><span>Need help?</span><p>Keep this order number ready. Support contact details will be added with the owner’s launch information.</p></div>
        </aside>
      </section>

      <section className="post-order-account"><div><p className="eyebrow">Guest checkout complete</p><h2>Want this order waiting next time?</h2><p>Account creation, saved addresses and one-tap reorder arrive in Phase 5. This tracking link works without an account.</p></div><Link className="text-link" href="/shop">Keep browsing <ArrowRight aria-hidden="true" size={17} /></Link></section>
    </>
  );
}

