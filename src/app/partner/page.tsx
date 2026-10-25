import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Banknote, Boxes, Clock3, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";

import { SupplierEarningsCalculator } from "@/components/supplier-earnings-calculator";

export const metadata: Metadata = {
  title: "Partner with us",
  description: "See how local cloth and garment businesses can list products, fulfil campus orders and receive clear weekly settlements with PB UNDERGROUND.",
};

const steps = [
  { title: "List what you already sell", text: "Add products, sizes, colours and current stock in about fifteen minutes. No separate website needed." },
  { title: "Accept a clear order", text: "A dashboard alert shows the pieces, campus zone, delivery slot and the thirty-minute response window." },
  { title: "Pack. We coordinate hand-off.", text: "Mark the order packed, then hand it over at the agreed pickup point or follow the arranged pickup." },
  { title: "Get a weekly statement", text: "Every delivered order, commission and approved deduction is itemised before the Monday settlement." },
] as const;

const objections = [
  { question: "Do I need a website?", answer: "No. Your PB dashboard is the working tool. We handle the customer-facing catalogue, checkout and tracking experience." },
  { question: "Who handles returns?", answer: "The customer starts the request through PB. Size and defect claims are reviewed with photos, and any approved deduction is visible on the next statement." },
  { question: "What if I cannot fulfil on time?", answer: "Decline inside the response window or flag an issue early. The PB team can reassign or contact the customer before the delivery promise is missed." },
  { question: "How much extra work is this?", answer: "The daily loop is intentionally short: confirm stock, accept, pack and mark the hand-off. Product setup is occasional; order actions take a few taps." },
] as const;

export default function PartnerPage() {
  return (
    <main className="partner-page" id="main-content">
      <header className="partner-hero">
        <div>
          <p className="eyebrow eyebrow--light">For local cloth and garment businesses</p>
          <h1>Your cloth.<br />Our delivery.<br /><em>Their campus.</em></h1>
        </div>
        <div className="partner-hero-note">
          <p>Sell to students around LPU without building an online shop or guessing what you will be paid.</p>
          <div>
            <Link className="button button--signal" href="/partner/demo">See the live demo <ArrowRight aria-hidden="true" size={18} /></Link>
            <Link className="button partner-outline-button" href="/signup?intent=supplier">Apply to supply</Link>
          </div>
          <small>[SAMPLE PROGRAM] Final commercial terms and pickup coverage require owner approval.</small>
        </div>
      </header>

      <section className="supplier-loop" aria-labelledby="supplier-loop-heading">
        <div className="supplier-section-heading">
          <p className="eyebrow">One practical loop</p>
          <h2 id="supplier-loop-heading">From your counter to a campus gate.</h2>
        </div>
        <ol>
          {steps.map((step, index) => (
            <li key={step.title}>
              <span>0{index + 1}</span>
              <div><h3>{step.title}</h3><p>{step.text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <SupplierEarningsCalculator />

      <section className="supplier-trust" aria-labelledby="supplier-trust-heading">
        <div className="supplier-section-heading supplier-section-heading--light">
          <p className="eyebrow eyebrow--light">Trust is operational</p>
          <h2 id="supplier-trust-heading">Clear checks. Clear promises. Clear responsibilities.</h2>
        </div>
        <div className="supplier-trust-grid">
          <article><BadgeCheck aria-hidden="true" /><span>We verify</span><h3>The business behind the products.</h3><p>Identity and business details, GSTIN when applicable, pickup address and a masked bank reference.</p></article>
          <article><ShieldCheck aria-hidden="true" /><span>We promise</span><h3>No invisible deductions.</h3><p>Statements show gross sales, commission and returns. Settlement disputes stay open for fourteen days.</p></article>
          <article><Boxes aria-hidden="true" /><span>You own</span><h3>Quality, stock and packing truth.</h3><p>Keep counts current, describe fabric honestly and respond inside the displayed acceptance window.</p></article>
        </div>
      </section>

      <section className="supplier-objections" aria-labelledby="supplier-questions-heading">
        <div className="supplier-section-heading">
          <p className="eyebrow">Straight answers</p>
          <h2 id="supplier-questions-heading">The questions we would ask too.</h2>
        </div>
        <div className="supplier-question-list">
          {objections.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary><span>{String(index + 1).padStart(2, "0")}</span>{item.question}<strong aria-hidden="true">+</strong></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="sample-supplier" aria-labelledby="sample-supplier-heading">
        <div className="sample-supplier-art" aria-label="Abstract sample profile art direction for folded charcoal and brick fabric">
          <span>[SAMPLE PROFILE]</span>
          <Store aria-hidden="true" />
        </div>
        <article>
          <p className="eyebrow">What customers can see</p>
          <div className="sample-supplier-title"><h2 id="sample-supplier-heading">Singh Cloth House</h2><BadgeCheck aria-label="Sample verified supplier" /></div>
          <p className="sample-supplier-bio">[SAMPLE] A neighbourhood cloth counter focused on dependable cotton layers and small ready-to-wear runs.</p>
          <dl>
            <div><dt><Clock3 aria-hidden="true" /> Dispatch rhythm</dt><dd>Same day</dd></div>
            <div><dt><Banknote aria-hidden="true" /> Settlement</dt><dd>Weekly</dd></div>
            <div><dt><Boxes aria-hidden="true" /> Live pieces</dt><dd>4 sample products</dd></div>
          </dl>
        </article>
      </section>

      <section className="partner-final-cta">
        <p className="eyebrow eyebrow--light">Six minutes. The whole cycle.</p>
        <h2>See an order arrive before you decide.</h2>
        <p>The guided supplier demo uses sample data only. Nothing is charged, published or sent to a real customer.</p>
        <div>
          <Link className="button button--paper" href="/partner/demo">Open supplier demo <ArrowRight aria-hidden="true" size={18} /></Link>
          <Link className="button partner-outline-button" href="/signup?intent=supplier">Apply to supply</Link>
        </div>
      </section>
    </main>
  );
}
