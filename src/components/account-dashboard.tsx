"use client";

import { ArrowRight, Heart, LogOut, MapPin, PackageCheck, RefreshCw, RotateCcw, ShieldCheck, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

import type { AccountOrder, AccountSnapshot } from "@/lib/account-types";
import { readCart, writeCart } from "@/lib/cart";
import { STORE_SETTINGS } from "@/lib/commerce";
import { formatInrFromPaise } from "@/lib/money";

type Panel = "orders" | "addresses" | "wishlist" | "returns" | "profile";

async function jsonRequest<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "That request did not complete.");
  return result;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("A selected photo could not be read."));
    reader.readAsDataURL(file);
  });
}

export function AccountDashboard() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [panel, setPanel] = useState<Panel>("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [returnOrder, setReturnOrder] = useState<AccountOrder | null>(null);
  const [pending, setPending] = useState(false);
  const [loadedAt] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/account", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/login?next=/account");
        return;
      }
      const result = await response.json() as AccountSnapshot & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Account data could not be loaded.");
      setAccount(result);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Account data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login?next=/account");
          return null;
        }
        const result = await response.json() as AccountSnapshot & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Account data could not be loaded.");
        return result;
      })
      .then((result) => { if (result) { setAccount(result); setError(""); } })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Account data could not be loaded.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [router]);

  async function mutate(work: () => Promise<unknown>, success: string) {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await work();
      setNotice(success);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That change did not complete.");
    } finally {
      setPending(false);
    }
  }

  function reorder(order: AccountOrder) {
    const next = readCart();
    for (const item of order.items) {
      const existing = next.find((line) => line.variantId === item.variantId);
      if (existing) existing.quantity = Math.min(10, existing.quantity + item.quantity);
      else next.push({ variantId: item.variantId, quantity: Math.min(10, item.quantity) });
    }
    writeCart(next);
    router.push("/cart");
  }

  async function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutate(() => jsonRequest("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"), recipientName: form.get("recipientName"), phone: form.get("phone"),
        line1: form.get("line1"), line2: form.get("line2"), landmark: form.get("landmark"),
        pincode: form.get("pincode"), zoneId: form.get("zoneId"), isDefault: form.get("isDefault") === "on",
      }),
    }), "Address saved.");
    event.currentTarget.reset();
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await mutate(() => jsonRequest("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: form.get("displayName"), phone: form.get("phone") }) }), "Profile updated.");
  }

  async function submitReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!returnOrder) return;
    const form = new FormData(event.currentTarget);
    const files = form.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
    if (files.some((file) => file.size > 2_097_152)) {
      setError("Each return photo must be 2 MB or smaller.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const photos = await Promise.all(files.map(fileToDataUrl));
      await jsonRequest("/api/account/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: returnOrder.id,
          itemIds: returnOrder.items.map((item) => item.id),
          reason: form.get("reason"),
          details: form.get("details"),
          photos,
        }),
      });
      setReturnOrder(null);
      setPanel("returns");
      setNotice("Return request sent. The team can now review the evidence.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Return request failed.");
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading && !account) return <div className="account-loading">Opening your account…</div>;
  if (!account) return <section className="account-failed"><h1>Account unavailable.</h1><p>{error}</p><button className="button button--ink" onClick={() => void load()}>Try again</button></section>;

  const tabs: Array<{ id: Panel; label: string; icon: typeof PackageCheck }> = [
    { id: "orders", label: "Orders", icon: PackageCheck },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "returns", label: "Returns", icon: RotateCcw },
    { id: "profile", label: "Profile", icon: UserRound },
  ];

  return (
    <>
      <header className="account-hero">
        <div><p className="eyebrow">Customer account / {account.runtime === "demo" ? "Local demo" : "Supabase"}</p><h1>Morning,<br />{account.user.displayName.split(" ")[0]}.</h1></div>
        <div><p>Orders, saved gates and the pieces you meant to come back for.</p><button type="button" onClick={signOut}><LogOut aria-hidden="true" size={16} /> Sign out</button></div>
      </header>

      <div className="account-shell">
        <nav className="account-nav" aria-label="Account sections">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} className={panel === id ? "is-active" : ""} onClick={() => { setPanel(id); setError(""); setNotice(""); }} type="button"><Icon aria-hidden="true" size={17} />{label}<span>{id === "orders" ? account.orders.length : id === "addresses" ? account.addresses.length : id === "wishlist" ? account.wishlist.length : id === "returns" ? account.returns.length : ""}</span></button>)}
        </nav>

        <section className="account-panel">
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {notice ? <p className="form-success" role="status">{notice}</p> : null}

          {panel === "orders" ? <OrdersPanel account={account} now={loadedAt} reorder={reorder} requestReturn={setReturnOrder} /> : null}
          {panel === "addresses" ? <AddressesPanel account={account} pending={pending} submit={submitAddress} remove={(id) => mutate(() => jsonRequest(`/api/account/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE" }), "Address removed.")} /> : null}
          {panel === "wishlist" ? <WishlistPanel account={account} remove={(variantId) => mutate(() => jsonRequest(`/api/account/wishlist?variantId=${encodeURIComponent(variantId)}`, { method: "DELETE" }), "Removed from wishlist.")} /> : null}
          {panel === "returns" ? <ReturnsPanel account={account} /> : null}
          {panel === "profile" ? <ProfilePanel account={account} pending={pending} submit={submitProfile} onDelete={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void mutate(async () => {
              await jsonRequest("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: form.get("confirmation") }) });
              router.push("/");
              router.refresh();
            }, "Account deleted.");
          }} /> : null}
        </section>
      </div>

      {returnOrder ? <ReturnDialog order={returnOrder} pending={pending} close={() => setReturnOrder(null)} submit={submitReturn} /> : null}
    </>
  );
}

function PanelHeading({ number, eyebrow, title, text }: { number: string; eyebrow: string; title: string; text: string }) {
  return <header className="account-panel-heading"><span>{number}</span><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{text}</p></div></header>;
}

function OrdersPanel({ account, now, reorder, requestReturn }: { account: AccountSnapshot; now: number; reorder: (order: AccountOrder) => void; requestReturn: (order: AccountOrder) => void }) {
  return <><PanelHeading number="01" eyebrow="Order history" title="What made it to the bag." text="Every signed-in checkout lands here. The sample delivered order keeps the return walkthrough testable before launch data exists." />
    <div className="account-orders">{account.orders.length ? account.orders.map((order) => {
      const eligible = Boolean(order.returnEligibleUntil && Date.parse(order.returnEligibleUntil) > now && !account.returns.some((item) => item.orderId === order.id));
      const isSample = order.orderNumber.startsWith("PBU-SAMPLE");
      const trackingHref = order.trackingToken ? `/order/${encodeURIComponent(order.orderNumber)}?token=${encodeURIComponent(order.trackingToken)}` : null;
      return <article key={order.id}><header><div><span>{isSample ? "[SAMPLE] Delivered order" : "Order"}</span><strong>{order.orderNumber}</strong></div><b data-status={order.status}>{order.status.replaceAll("_", " ")}</b></header><div className="order-lines">{order.items.map((item) => <p key={item.id}><span>{item.name}<small>{item.colour} / {item.size} × {item.quantity}</small></span><strong>{formatInrFromPaise(item.lineTotalInPaise)}</strong></p>)}</div><footer><div><small>{new Date(order.placedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</small><strong>{formatInrFromPaise(order.totalInPaise)}</strong></div><div>{trackingHref ? <Link href={trackingHref}>Track</Link> : null}<button type="button" onClick={() => reorder(order)}><RefreshCw aria-hidden="true" size={14} /> Reorder</button>{eligible ? <button type="button" onClick={() => requestReturn(order)}><RotateCcw aria-hidden="true" size={14} /> Return</button> : null}</div></footer></article>;
    }) : <EmptyState title="No orders yet." text="Orders placed while signed in will appear here." href="/shop" link="Open the shop" />}</div>
  </>;
}

function AddressesPanel({ account, pending, submit, remove }: { account: AccountSnapshot; pending: boolean; submit: (event: FormEvent<HTMLFormElement>) => void; remove: (id: string) => void }) {
  return <><PanelHeading number="02" eyebrow="Saved delivery" title="Five shortcuts to your gate." text="Save only the addresses you use. The first address becomes the default; you can keep at most five." />
    <div className="address-grid">{account.addresses.map((address) => <article key={address.id}><span>{address.label}{address.isDefault ? " / Default" : ""}</span><strong>{address.recipientName}</strong><p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.landmark ? `${address.landmark}, ` : ""}{address.pincode}<br />+91 {address.phone}</p><button type="button" onClick={() => remove(address.id)}><Trash2 aria-hidden="true" size={14} /> Remove</button></article>)}</div>
    {account.addresses.length < 5 ? <form className="account-form" onSubmit={submit}><h3>Add an address</h3><div className="form-grid"><label>Label<input name="label" placeholder="Hostel / Home" required minLength={2} /></label><label>Recipient name<input name="recipientName" defaultValue={account.user.displayName} required /></label><label>Mobile number<input name="phone" inputMode="numeric" pattern="[6-9][0-9]{9}" defaultValue={account.user.phone ?? ""} required /></label><label>Delivery zone<select name="zoneId" defaultValue={STORE_SETTINGS.zones[0].id}>{STORE_SETTINGS.zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label><label className="span-two">Address line<input name="line1" autoComplete="address-line1" required minLength={5} /></label><label>Area / room<input name="line2" autoComplete="address-line2" /></label><label>Landmark<input name="landmark" /></label><label>Pincode<input name="pincode" inputMode="numeric" pattern="[0-9]{6}" required /></label><label className="check-field"><input name="isDefault" type="checkbox" /> Make this the default</label></div><button className="button button--ink" type="submit" disabled={pending}>Save address <ArrowRight aria-hidden="true" size={16} /></button></form> : <p className="account-limit">Five saved addresses reached. Remove one before adding another.</p>}
  </>;
}

function WishlistPanel({ account, remove }: { account: AccountSnapshot; remove: (id: string) => void }) {
  return <><PanelHeading number="03" eyebrow="Wishlist" title="Pieces worth a second look." text="Save a specific size and colour from any product page, then move it to the bag when you are ready." />
    <div className="wishlist-list">{account.wishlist.length ? account.wishlist.map((item) => <article key={item.variantId}><Link className="wishlist-art" href={`/product/${item.productSlug}`}><Heart aria-hidden="true" /></Link><div><span>Saved {new Date(item.addedAt).toLocaleDateString("en-IN")}</span><h3><Link href={`/product/${item.productSlug}`}>{item.productName}</Link></h3><p>{item.colour} / {item.size}</p></div><strong>{formatInrFromPaise(item.priceInPaise)}</strong><div><button onClick={() => { const cart = readCart(); const existing = cart.find((line) => line.variantId === item.variantId); if (existing) existing.quantity = Math.min(10, existing.quantity + 1); else cart.push({ variantId: item.variantId, quantity: 1 }); writeCart(cart); }} type="button">Add to bag</button><button onClick={() => remove(item.variantId)} type="button">Remove</button></div></article>) : <EmptyState title="Nothing saved yet." text="Use the heart beside a product variant to keep it here." href="/shop" link="Find a piece" />}</div>
  </>;
}

function ReturnsPanel({ account }: { account: AccountSnapshot }) {
  return <><PanelHeading number="04" eyebrow="Returns + exchanges" title="Clear, fair, forty-eight hours." text="Delivered pieces can be requested for size or defect while the 48-hour window is open. One to three photos are required." />
    <div className="returns-list">{account.returns.length ? account.returns.map((request) => <article key={request.id}><div><span>{request.orderNumber}</span><strong>{request.reason === "size" ? "Size exchange" : "Defect return"}</strong><p>{request.details}</p></div><b data-status={request.status}>{request.status}</b><time>{new Date(request.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time></article>) : <EmptyState title="No return requests." text="Eligible delivered orders show a return button in order history." />}</div>
  </>;
}

function ProfilePanel({ account, pending, submit, onDelete }: { account: AccountSnapshot; pending: boolean; submit: (event: FormEvent<HTMLFormElement>) => void; onDelete: (event: FormEvent<HTMLFormElement>) => void }) {
  return <><PanelHeading number="05" eyebrow="Profile + privacy" title="Only what delivery needs." text="Review your account details or permanently remove the account and customer records." />
    <form className="account-form profile-form" onSubmit={submit}><h3>Your details</h3><label>Full name<input name="displayName" defaultValue={account.user.displayName} required minLength={2} /></label><label>Email address<input value={account.user.email} disabled /></label><label>Mobile number<input name="phone" defaultValue={account.user.phone ?? ""} inputMode="numeric" pattern="[6-9][0-9]{9}" placeholder="Optional" /></label><p className="privacy-note"><ShieldCheck aria-hidden="true" size={16} /> Email is managed by authentication. Saved delivery data is visible only to this signed-in user.</p><button className="button button--ink" type="submit" disabled={pending}>Update profile</button></form>
    <form className="delete-account" onSubmit={onDelete}><h3>Delete account</h3><p>This permanently removes the account and saved customer data. Type <strong>DELETE</strong> to confirm.</p><label>Confirmation<input name="confirmation" required pattern="DELETE" autoComplete="off" /></label><button type="submit" disabled={pending}><Trash2 aria-hidden="true" size={15} /> Delete my account</button></form>
  </>;
}

function ReturnDialog({ order, pending, close, submit }: { order: AccountOrder; pending: boolean; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="return-overlay" role="presentation"><section className="return-dialog" role="dialog" aria-modal="true" aria-labelledby="return-title"><button className="return-close" onClick={close} type="button" aria-label="Close return form">×</button><p className="eyebrow">Return / {order.orderNumber}</p><h2 id="return-title">Show us what went wrong.</h2><form onSubmit={submit}><label>Resolution needed<select name="reason" defaultValue="size"><option value="size">Size exchange</option><option value="defect">Defect return</option></select></label><label>What should the team know?<textarea name="details" minLength={10} maxLength={500} required /></label><label>Photos (1–3, JPEG/PNG/WebP, 2 MB each)<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required /></label><p>The item must be unworn with tags. Submission does not guarantee approval; the team reviews the evidence first.</p><button className="button button--signal" type="submit" disabled={pending}>{pending ? "Sending…" : "Request return"}</button></form></section></div>;
}

function EmptyState({ title, text, href, link }: { title: string; text: string; href?: string; link?: string }) {
  return <div className="account-empty"><span>—</span><h3>{title}</h3><p>{text}</p>{href && link ? <Link href={href}>{link} <ArrowRight aria-hidden="true" size={15} /></Link> : null}</div>;
}
