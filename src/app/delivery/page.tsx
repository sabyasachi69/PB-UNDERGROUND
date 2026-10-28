import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { STORE_SETTINGS } from "@/lib/commerce";
import { formatInrFromPaise } from "@/lib/money";
import { HeaderScene } from "@/components/header-scene";

export const metadata: Metadata = {
  title: "Delivery and returns",
  description: "Preview PB UNDERGROUND's sample delivery zones, fees, time windows and return process around LPU.",
  alternates: { canonical: "/delivery" },
};

const questions = [
  { question: "When will I see the final delivery fee?", answer: "The cart quotes a fee for your selected zone. Checkout checks the pincode and shows the final amount before you place an order." },
  { question: "Can I choose a time?", answer: "Yes. Available slots depend on the day and the two-hour cutoff. Checkout offers only slots that are still open." },
  { question: "What if I am outside these areas?", answer: "The checkout zone check will stop an unsupported address. Please use the contact page to ask about future coverage." },
  { question: "How do returns work?", answer: "The demo policy accepts requests within 48 hours of delivery for size or defect issues, with photos. The item should be unworn with tags. Final terms need owner and legal review before live orders." },
] as const;

export default function DeliveryPage() {
  return (
    <main className="information-page" id="main-content">
      <header className="information-hero information-hero--delivery scene-host">
        <HeaderScene kind="delivery" />
        <p className="eyebrow eyebrow--light">Delivery / sample operating plan</p>
        <h1>From this side<br />of town to <em>your gate.</em></h1>
        <p>Choose your area, see the fee and pick an available slot before placing your order. The zones below are demo settings awaiting owner confirmation.</p>
      </header>
      <section className="information-section" aria-labelledby="zones-heading">
        <div className="information-heading"><p className="eyebrow">01 / Coverage</p><h2 id="zones-heading">Where we plan to deliver.</h2></div>
        <div className="zone-list">
          {STORE_SETTINGS.zones.filter((zone) => zone.isActive).map((zone, index) => (
            <details key={zone.id} open={index === 0}>
              <summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{zone.name}</strong><span>+</span></summary>
              <div><p>{zone.area}</p><p>Delivery fee: {formatInrFromPaise(zone.deliveryFeeInPaise)}. Free above {formatInrFromPaise(zone.freeAboveInPaise)}.</p><p>Sample serviceable pincode{zone.pincodes.length > 1 ? "s" : ""}: {zone.pincodes.join(", ")}</p></div>
            </details>
          ))}
        </div>
      </section>
      <section className="information-section information-section--dark" aria-labelledby="slots-heading">
        <div className="information-heading"><p className="eyebrow eyebrow--light">02 / Timing</p><h2 id="slots-heading">A window you can plan around.</h2></div>
        <div className="information-cards">
          {STORE_SETTINGS.deliveryWindows.map((window, index) => <article key={window.id}><span>0{index + 1}</span><h3>{window.label}</h3><p>Checkout confirms availability for your day and area.</p></article>)}
        </div>
        <p>Same-day slots close two hours before they begin. Current availability is always shown in checkout.</p>
      </section>
      <section className="information-section" aria-labelledby="returns-heading">
        <div className="information-heading"><p className="eyebrow">03 / Returns</p><h2 id="returns-heading">If the fit is off, tell us.</h2></div>
        <p className="information-lede">In the sample flow, signed-in customers can request a return within 48 hours after delivery, attach photos, and track the decision in their account. Please keep tags on and avoid wearing the item.</p>
        <p className="draft-note">[DRAFT FOR REVIEW] This is a demo policy. Final eligibility, pickup, refund timing and legal wording require the owner’s approval before live orders.</p>
        <Link className="button button--ink" href="/account">Open your account <ArrowRight aria-hidden="true" size={18} /></Link>
      </section>
      <section className="information-section" aria-labelledby="delivery-faq-heading">
        <div className="information-heading"><p className="eyebrow">04 / Good to know</p><h2 id="delivery-faq-heading">Quick answers.</h2></div>
        <div className="zone-list">{questions.map((item) => <details key={item.question}><summary><strong>{item.question}</strong><span>+</span></summary><div><p>{item.answer}</p></div></details>)}</div>
        <Link className="button button--signal" href="/shop">Shop the sample drop <ArrowRight aria-hidden="true" size={18} /></Link>
      </section>
    </main>
  );
}
