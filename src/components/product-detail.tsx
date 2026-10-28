"use client";

import { Check, Maximize2, ShieldCheck, Star, Truck, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useRef, useState } from "react";

import type { Product } from "@/data/products";
import { demoProductImages } from "@/data/demo-images";
import { addCartItem } from "@/lib/cart";
import { formatInrFromPaise } from "@/lib/money";
import { WishlistButton } from "@/components/wishlist-button";

type ProductDetailProps = { product: Product };

const deliveryWindows = {
  "main-gate": "45–75 minutes",
  "boys-hostels": "60–90 minutes",
  "girls-hostels": "60–90 minutes",
  phagwara: "Same-day slots",
} as const;

export function ProductDetail({ product }: ProductDetailProps) {
  const conceptImage = demoProductImages[product.slug];
  const firstVariant = product.variants.find((variant) => variant.stockQty > 0) ?? product.variants[0];
  const [selectedColour, setSelectedColour] = useState(firstVariant.colour.name);
  const [selectedSize, setSelectedSize] = useState(firstVariant.size);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [added, setAdded] = useState(false);
  const [notified, setNotified] = useState(false);
  const [zone, setZone] = useState<keyof typeof deliveryWindows>("main-gate");
  const sizeGuide = useRef<HTMLDialogElement>(null);

  const selectedVariant = product.variants.find(
    (variant) => variant.colour.name === selectedColour && variant.size === selectedSize,
  ) ?? firstVariant;
  const inStock = selectedVariant.stockQty > 0;

  function addSelectedVariant() {
    if (!inStock) return;
    addCartItem(selectedVariant.id);
    setAdded(true);
  }

  function requestNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    if (typeof email !== "string") return;
    let requests: unknown[] = [];
    try {
      const savedRequests: unknown = JSON.parse(window.localStorage.getItem("pb-underground-notify-v1") ?? "[]");
      if (Array.isArray(savedRequests)) requests = savedRequests;
    } catch {
      // Replace malformed local sample data with the new valid request.
    }
    window.localStorage.setItem(
      "pb-underground-notify-v1",
      JSON.stringify([...requests, { email, variantId: selectedVariant.id }]),
    );
    setNotified(true);
    event.currentTarget.reset();
  }

  return (
    <>
      <div className="product-detail">
        <section className="product-gallery" aria-label={`${product.name} sample gallery`}>
          <button
            className={`product-gallery-main product-visual product-visual--${product.palette} ${conceptImage ? "has-photo" : ""} ${zoomed ? "is-zoomed" : ""}`}
            data-product={product.slug}
            type="button"
            onClick={() => setZoomed((value) => !value)}
            aria-pressed={zoomed}
          >
            {conceptImage ? <Image className={`product-photo ${selectedImage === 1 ? "product-photo--crop" : ""}`} src={conceptImage.src} alt={selectedImage === 1 ? `${conceptImage.alt}, editorial crop` : conceptImage.alt} fill sizes="(max-width: 900px) 100vw, 52vw" priority /> : <span className="product-silhouette" aria-hidden="true" />}
            <span className="sample-asset">{conceptImage ? "AI concept image" : product.imageAlts[selectedImage]}</span>
            <span className="zoom-label"><Maximize2 aria-hidden="true" size={16} /> {zoomed ? "Close detail" : "Inspect cloth"}</span>
          </button>
          <div className="gallery-thumbs" aria-label="Choose gallery view">
            {product.imageAlts.map((alt, index) => (
              <button
                className={`product-visual--${product.palette} ${conceptImage ? "has-photo" : ""} ${selectedImage === index ? "is-active" : ""}`}
                type="button"
                onClick={() => { setSelectedImage(index); setZoomed(false); }}
                aria-label={conceptImage ? index === 0 ? "Show full AI concept image" : "Show closer crop of AI concept image" : `Show ${alt}`}
                aria-pressed={selectedImage === index}
                key={alt}
              >{conceptImage ? <Image className={`product-photo ${index === 1 ? "product-photo--crop" : ""}`} src={conceptImage.src} alt="" fill sizes="(max-width: 900px) 46vw, 14vw" /> : null}<span aria-hidden="true">0{index + 1}</span></button>
            ))}
          </div>
        </section>

        <section className="product-buy-panel" aria-labelledby="product-title">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/shop">Shop</Link><span>/</span><Link href={`/shop/${product.categorySlug}`}>{product.category}</Link>
          </nav>
          <p className="eyebrow">{product.supplierName}</p>
          <h1 id="product-title">{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <div className="detail-price">
            <strong>{formatInrFromPaise(selectedVariant.priceInPaise)}</strong>
            {product.compareAtPaise ? <del>{formatInrFromPaise(product.compareAtPaise)}</del> : null}
            <span>Inclusive of GST</span>
          </div>
          <p className="delivery-promise"><Truck aria-hidden="true" size={17} /> Delivery from 45 minutes around LPU. Exact promise shown before payment.</p>

          <fieldset className="variant-group colour-options">
            <legend>Colour <strong>{selectedColour}</strong></legend>
            <div>
              {product.colours.map((colour) => (
                <button
                  type="button"
                  key={colour.name}
                  onClick={() => { setSelectedColour(colour.name); setAdded(false); }}
                  aria-pressed={selectedColour === colour.name}
                  aria-label={`Choose ${colour.name}`}
                  style={{ "--swatch": colour.hex } as React.CSSProperties}
                ><span aria-hidden="true" /></button>
              ))}
            </div>
          </fieldset>
          {conceptImage ? <p className="concept-colour-note">AI demo image shows {product.colours[0].name}. Other colour options are sample data and may look different.</p> : null}

          <fieldset className="variant-group size-options">
            <legend>Size</legend>
            <button className="size-guide-link" type="button" onClick={() => sizeGuide.current?.showModal()}>Size guide</button>
            <div>
              {product.sizes.map((size) => {
                const variant = product.variants.find((item) => item.colour.name === selectedColour && item.size === size);
                const availability = !variant?.stockQty ? "Out" : variant.stockQty <= 2 ? "Low" : "";
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => { setSelectedSize(size); setAdded(false); }}
                    aria-pressed={selectedSize === size}
                    className={variant?.stockQty === 0 ? "is-unavailable" : ""}
                    disabled={!variant?.stockQty}
                  ><span>{size}</span>{availability ? <small>{availability}</small> : null}<span className="sr-only">{availability ? ` — ${availability === "Out" ? "sold out" : "low stock"}` : ""}</span></button>
                );
              })}
            </div>
          </fieldset>

          <div className={`stock-line ${inStock ? "is-available" : "is-sold-out"}`} aria-live="polite">
            <span />{inStock ? `${selectedVariant.stockQty} ready to dispatch` : "This variant is sold out"}
          </div>

          <button className="button button--signal add-to-bag" type="button" disabled={!inStock} onClick={addSelectedVariant}>
            {added ? <><Check aria-hidden="true" size={18} /> Added to bag</> : "Add to bag"}
          </button>
          <WishlistButton variantId={selectedVariant.id} />

          {!inStock ? (
            <form className="notify-form" onSubmit={requestNotification}>
              <label htmlFor="notify-email">Email me when this variant returns</label>
              <div><input id="notify-email" name="email" type="email" placeholder="you@example.com" required /><button type="submit">Notify me</button></div>
              {notified ? <p role="status">Saved locally for this sample build. We’ll wire email delivery in the launch phase.</p> : null}
            </form>
          ) : null}

          <div className="delivery-estimate">
            <Truck aria-hidden="true" size={20} />
            <label>Delivery to
              <select value={zone} onChange={(event) => setZone(event.target.value as keyof typeof deliveryWindows)}>
                <option value="main-gate">Main gate</option><option value="boys-hostels">Boys’ hostels</option>
                <option value="girls-hostels">Girls’ hostels</option><option value="phagwara">Phagwara side</option>
              </select>
            </label>
            <strong>{deliveryWindows[zone]}</strong>
          </div>

          <div className="product-facts">
            <details><summary>Fabric <span>+</span></summary><p>{product.fabric}</p></details>
            <details><summary>Care <span>+</span></summary><p>{product.care}</p></details>
            <details><summary>Returns <span>+</span></summary><p>Within 48 hours, unworn with tags, for size or defect.</p></details>
          </div>

          <Link className="maker-card" href={`/shop?supplier=${product.supplierSlug}`}>
            <span>Made nearby by</span><strong>{product.supplierName}</strong><small>See this maker’s pieces →</small>
          </Link>
        </section>
      </div>

      <div className="mobile-add-bar" aria-label="Selected product and add to bag">
        <div><span>{selectedColour} / {selectedSize}</span><strong>{formatInrFromPaise(selectedVariant.priceInPaise)}</strong></div>
        <button className="button button--signal" type="button" disabled={!inStock} onClick={addSelectedVariant}>
          {added ? <><Check aria-hidden="true" size={17} /> Added</> : inStock ? "Add to bag" : "Sold out"}
        </button>
      </div>

      <section className="reviews-section" aria-labelledby="reviews-title">
        <div><p className="eyebrow">Sample feedback layout</p><h2 id="reviews-title">How buyer feedback could look.</h2></div>
        {product.reviews.length ? product.reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <div aria-label={`${review.rating} out of 5 stars`}>
              {Array.from({ length: review.rating }, (_, index) => <Star aria-hidden="true" fill="currentColor" size={15} key={index} />)}
            </div>
            <blockquote><span className="sample-review-label">[SAMPLE REVIEW]</span> “{review.body}”</blockquote>
            <p>{review.author} {review.verified ? <span><ShieldCheck aria-hidden="true" size={14} /> Verified buyer</span> : null}</p>
          </article>
        )) : <p className="reviews-empty">No reviews yet. Only verified buyers can leave one.</p>}
      </section>

      <dialog className="size-guide" ref={sizeGuide} aria-labelledby="size-guide-title">
        <button className="dialog-close" type="button" onClick={() => sizeGuide.current?.close()} aria-label="Close size guide"><X aria-hidden="true" /></button>
        <p className="eyebrow">Measured flat / centimetres</p><h2 id="size-guide-title">Size guide</h2>
        <div className="size-table" role="table" aria-label="Garment size measurements">
          <div role="row"><strong role="columnheader">Size</strong><strong role="columnheader">Chest</strong><strong role="columnheader">Length</strong></div>
          {product.sizes.map((size, index) => <div role="row" key={size}><span role="cell">{size}</span><span role="cell">{index ? 52 + index * 3 : "Varies"}</span><span role="cell">{index ? 66 + index * 2 : "Varies"}</span></div>)}
        </div>
        <p>Sample measurements for the demo catalogue. Final measurements must be confirmed with each maker before launch.</p>
      </dialog>
    </>
  );
}
