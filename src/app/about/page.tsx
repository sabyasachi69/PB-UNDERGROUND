import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our story",
  description: "Why PB UNDERGROUND is building a shorter path between local makers and the LPU campus.",
};

export default function AboutPage() {
  return (
    <main className="editorial-page" id="main-content">
      <header className="editorial-hero">
        <p className="eyebrow">Our story / Draft 01</p>
        <h1>A shorter route for better cloth.</h1>
        <p className="editorial-lede">
          PB UNDERGROUND is being built between two places that already belong together: local garment counters and the campus a few minutes away.
        </p>
      </header>

      <section className="story-split">
        <div className="story-art" aria-label="Abstract sample art direction showing folded fabric">
          <span>Sample art direction</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">The idea</p>
          <h2>Not a campus shop. Not a distant fashion machine.</h2>
          <p>
            The aim is a small-batch label with an editorial eye and a practical local operating model. Students get clarity, speed and character. Makers get a new route to customers without having to become a technology company.
          </p>
          <p className="draft-note">[DRAFT FOR OWNER REVIEW] The final founder note and real maker stories will replace this copy before launch.</p>
        </div>
      </section>

      <section className="supplier-principles" id="suppliers">
        <p className="eyebrow eyebrow--light">For suppliers</p>
        <h2>Clear work. Clear money. No mystery layer.</h2>
        <div className="principle-grid">
          <article><span>01</span><h3>You choose the pieces</h3><p>List the products and variants that fit your actual stock.</p></article>
          <article><span>02</span><h3>We bring the order</h3><p>See the area, slot and packing deadline without exposing private customer details.</p></article>
          <article><span>03</span><h3>Every rupee is traced</h3><p>Gross, commission, deductions and payout date appear on one statement.</p></article>
        </div>
        <Link className="button button--paper" href="/#partners">
          Return to the partner overview <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </section>
    </main>
  );
}
