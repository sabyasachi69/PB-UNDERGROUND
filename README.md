# PB UNDERGROUND

An editorial, mobile-first storefront and supplier operating platform for a locally sourced fashion and essentials brand serving the LPU community.

## Status

Phase 4 (payments) is complete. The repository now includes the branded storefront, catalogue and Phase 3 checkout plus Cash on Delivery, Razorpay test-mode UPI Orders, server-side checkout-signature verification, raw-body webhook verification, webhook replay protection, payment-status polling, and exactly-once inventory release for failed or 15-minute-expired payments.

All fictional maker names, products, reviews, imagery, and commercial claims remain explicitly labelled `[SAMPLE]` until launch content is supplied. Phase 5 will add customer accounts, saved addresses, order history, reorder, wishlist and returns.

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

The catalogue, COD checkout and UPI success/failure walkthrough work without a database or payment account by using checked-in sample data, an isolated in-memory server order store and a clearly labelled local payment simulator. This demo state resets when the server restarts and must not be used for live orders. The verified Supabase migrations include the durable Phase 2–4 tables and are ready to connect once project credentials are supplied.

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
- Supabase tables in exposed schemas must use Row Level Security.
- Real secrets are never committed. See `.env.example` for the required names.
- Online orders are fulfilled only after a verified payment state; browser totals and unverified payment callbacks are never trusted.
- Missing owner-provided content is labelled `[SAMPLE]`, never presented as fact.

See [`DECISIONS.md`](./DECISIONS.md) for working assumptions and [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) for the phased delivery sequence.
