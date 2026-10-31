# PB UNDERGROUND

An editorial, mobile-first storefront and supplier operating platform for a locally sourced fashion and essentials brand serving the LPU community.

## Status

This is a **demo, not a completed launch**. The storefront, sample catalogue, checkout/payment walkthrough, accounts, partner sales page and supplier walkthrough are implemented. Supplier operations, admin operations, connected database acceptance tests and launch checks remain open. See [the current phase matrix](./docs/PHASE_STATUS_2026-10-28.md) for the acceptance criteria and evidence.

The Phase 6 increment includes a supplier sales page at `/partner`, a tested commission calculator, and an eight-step sample-data walkthrough at `/partner/demo` covering profile setup, product entry, order acceptance, packing, hand-off, settlement export and return approval. A printable meeting card is available from the demo. Supplier authentication, approval, connected product management, the live fulfillment queue and database-backed settlements remain open.

Public information routes include `/delivery`, `/contact`, and clearly marked draft policies under `/legal/*`. The contact form requires `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL`; without them it reports that sending is unavailable. These drafts require owner and qualified legal review before live sales.

All fictional maker names, products, reviews, imagery, and commercial claims remain explicitly labelled `[SAMPLE]` until launch content is supplied.

The sample catalogue has 40 styles: ten each in Layers, Shirts, Bottoms and Essentials. Each style has at least two colour choices and a clearly labelled AI concept image. The image depicts the first listed colour; alternate colours are sample options and are not pictured. See [demo image provenance](./docs/DEMO_IMAGERY.md) for source and replacement details.

The latest architecture and connectivity review is available as a [downloadable technical audit](./output/pdf/PB_UNDERGROUND_Technical_Audit.pdf).

## Local setup

Requirements:

- Node.js 22+
- npm 10+
- Docker Desktop (only when running Supabase locally)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

To run the local database separately:

```bash
npm run supabase:start
npm run db:reset
```

The catalogue, COD checkout, UPI success/failure walkthrough, customer account flow and supplier walkthrough work without external accounts by using checked-in sample data, isolated in-memory server stores and a clearly labelled local payment simulator. Create a disposable account at `/signup`; a delivered sample order is added so the 48-hour return flow can be tested. The supplier walkthrough is available without an account at `/partner/demo`. Demo state resets and must not be used for live orders.

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set, authentication and customer records switch to Supabase Auth and the RLS-protected Phase 5 schema. `SUPABASE_SECRET_KEY` is server-only and is required for self-service account deletion. The migration also creates the private `return-evidence` Storage bucket, 2 MB image limits and owner-scoped policies.

To exercise Razorpay itself, add all three test-mode values to `.env.local`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Only `rzp_test_` keys are accepted in Phase 4. Configure the test webhook URL as `/api/payments/razorpay/webhook` and subscribe to `payment.captured`, `payment.failed` and `order.paid`. Secrets stay server-side.

Demo coupon codes:

- `STUDENT10` — 10% off orders of ₹499 or more.
- `LOCAL50` — ₹50 off orders of ₹299 or more.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:lint
```

## Project principles

- Server Components by default; client code only where interaction requires it.
- All money uses integer paise.
- Prices, stock, delivery rules, coupons, roles, and state transitions are enforced on the server.
- Supabase tables in exposed schemas use Row Level Security; account ownership is checked again in every server route.
- Real secrets are never committed. See `.env.example` for the required names.
- Online orders are fulfilled only after a verified payment state; browser totals and unverified payment callbacks are never trusted.
- Missing owner-provided content is labelled `[SAMPLE]`, never presented as fact.

See [`DECISIONS.md`](./DECISIONS.md) for working assumptions and [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) for the phased delivery sequence.
