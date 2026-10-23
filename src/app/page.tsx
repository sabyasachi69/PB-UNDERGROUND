import { ArrowDown, ArrowRight, MapPin, MoveRight } from "lucide-react";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { featuredProducts } from "@/data/products";

const journey = [
  { number: "01", title: "Local maker", body: "A shop close enough to know by name." },
  { number: "02", title: "Cut + stitched", body: "Small runs, useful fabrics, no distant warehouse." },
  { number: "03", title: "Your order", body: "Picked on your phone between classes." },
  { number: "04", title: "At your gate", body: "A clear slot. A familiar place. No guessing." },
] as const;

const zones = [
  { name: "Main gate", time: "45–75 min", fee: "₹30 / free over ₹499" },
  { name: "Boys' hostels", time: "60–90 min", fee: "₹30 / free over ₹499" },
  { name: "Girls' hostels", time: "60–90 min", fee: "₹30 / free over ₹499" },
  { name: "Phagwara side", time: "Same-day slots", fee: "Zone check at checkout" },
] as const;

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-kicker">
          <span>Drop 001 / LPU</span>
          <span>Made close. Delivered closer.</span>
        </div>
        <h1 id="hero-title">
          <span>PB</span>
          <span>UNDERGROUND</span>
        </h1>
        <div className="hero-bottom">
          <p>Local cloth. Campus fits. A new label moving at the speed of your day.</p>
          <Link className="round-link" href="#manifesto" aria-label="Scroll to the story">
            <ArrowDown aria-hidden="true" size={24} />
          </Link>
        </div>
        <div className="hero-fabric" aria-hidden="true">
          <span className="thread thread-one" />
          <span className="thread thread-two" />
          <span className="stitch-mark">PBU / 31.25°N</span>
        </div>
      </section>

      <section className="manifesto" id="manifesto" aria-labelledby="manifesto-title">
        <p className="eyebrow">01 / Why we exist</p>
        <h2 id="manifesto-title">
          The best thing in your wardrobe should not have travelled farther than you have.
        </h2>
        <div className="manifesto-note">
          <span />
          <p>We connect local makers with the campus next door—good cloth, honest prices, delivery you can actually plan around.</p>
        </div>
      </section>

      <section className="journey" aria-labelledby="journey-title">
        <div className="section-heading">
          <p className="eyebrow eyebrow--light">02 / The loop</p>
          <h2 id="journey-title">From their counter to your gate.</h2>
        </div>
        <ol className="journey-grid">
          {journey.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div className="journey-mark" aria-hidden="true" />
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="drops" aria-labelledby="drops-title">
        <div className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">03 / Fresh pieces</p>
            <h2 id="drops-title">The first drop.</h2>
          </div>
          <Link className="text-link" href="/shop">
            See everything <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </div>
      </section>

      <section className="delivery" id="delivery" aria-labelledby="delivery-title">
        <div className="delivery-copy">
          <p className="eyebrow">04 / The near side</p>
          <h2 id="delivery-title">Your campus is our delivery map.</h2>
          <p>
            Choose your gate or hostel at checkout. We show the fee and available window before you pay—never after.
          </p>
          <Link className="button button--ink" href="/shop">
            Check your zone <MoveRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <div className="zone-board">
          <div className="zone-map" aria-hidden="true">
            <span className="map-ring map-ring--one" />
            <span className="map-ring map-ring--two" />
            <span className="map-road" />
            <MapPin size={34} strokeWidth={1.4} />
          </div>
          <ul>
            {zones.map((zone) => (
              <li key={zone.name}>
                <strong>{zone.name}</strong>
                <span>{zone.time}</span>
                <small>{zone.fee}</small>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="partners" id="partners" aria-labelledby="partners-title">
        <p className="eyebrow eyebrow--signal">05 / Built with the neighbourhood</p>
        <div className="partners-grid">
          <h2 id="partners-title">Your cloth.<br />Our delivery.<br />Their campus.</h2>
          <div>
            <p>
              Keep your shop. Keep your way of working. Add a new counter that happens to fit inside every student’s phone.
            </p>
            <ul>
              <li>List a product in minutes</li>
              <li>See every fee before you agree</li>
              <li>Get a dated weekly statement</li>
            </ul>
            <Link className="button button--paper" href="/about#suppliers">
              See how partnering works <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </div>
        <div className="partner-stats" aria-label="Sample targets, not live business statistics">
          <span>[SAMPLE TARGETS]</span>
          <div><strong>15 min</strong><small>to list a first product</small></div>
          <div><strong>12%</strong><small>demo commission</small></div>
          <div><strong>Mon</strong><small>weekly settlement day</small></div>
        </div>
      </section>

      <section className="voices" aria-labelledby="voices-title">
        <p className="eyebrow">06 / Early voices</p>
        <div className="voices-grid">
          <h2 id="voices-title">“It should feel local before we even say it.”</h2>
          <div className="voice-card">
            <span>[SAMPLE TESTIMONIAL]</span>
            <p>“Show me what to pack, where it goes and what I earn. That is the whole decision.”</p>
            <small>Sample supplier perspective / final quote pending permission</small>
          </div>
        </div>
      </section>

      <section className="closing" aria-labelledby="closing-title">
        <p className="eyebrow">07 / Start here</p>
        <h2 id="closing-title">Wear what is<br />already close.</h2>
        <div className="closing-actions">
          <Link className="button button--signal" href="/shop">
            Shop the drop <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link className="button button--ghost" href="/about#suppliers">
            Partner with us
          </Link>
        </div>
      </section>
    </main>
  );
}
