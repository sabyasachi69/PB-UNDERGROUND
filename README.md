# PB UNDERGROUND

An editorial, mobile-first storefront and supplier operating platform for a locally sourced fashion and essentials brand serving the LPU community.

## Status

Phase 3 (cart and checkout) is complete. The repository now includes the branded storefront and catalogue plus a persistent browser cart, save for later, server-validated coupons and totals, delivery-zone checks, cutoff-aware slots, a three-step guest checkout, idempotent COD orders, stock decrement, confirmation, and privacy-minimised tracking.

All fictional maker names, products, reviews, imagery, and commercial claims remain explicitly labelled `[SAMPLE]` until launch content is supplied. Phase 4 will add Razorpay test-mode UPI, webhook verification, payment polling, and failed-payment stock release.

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

The catalogue and COD walkthrough work without a database connection by using checked-in sample data and an isolated in-memory server order store. This demo order store resets when the server restarts and must not be used for live orders. The verified Supabase migrations include the durable Phase 2 and Phase 3 tables and are ready to connect once project credentials are supplied.

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
- Supabase tables in exposed schemas must use Row Level Security.
- Real secrets are never committed. See `.env.example` for the required names.
- Missing owner-provided content is labelled `[SAMPLE]`, never presented as fact.

See [`DECISIONS.md`](./DECISIONS.md) for working assumptions and [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) for the phased delivery sequence.
