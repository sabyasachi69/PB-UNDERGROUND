# PB UNDERGROUND

An editorial, mobile-first storefront and supplier operating platform for a locally sourced fashion and essentials brand serving the LPU community.

## Status

Phase 2 (catalogue) is complete. The repository now includes the branded home and About pages plus a responsive sample catalogue with category pages, product detail pages, live variants, URL-synced filters, search, sorting, quick add, stock notifications, product APIs, and a Supabase catalogue schema with seed data.

All fictional maker names, products, reviews, imagery, and commercial claims remain explicitly labelled `[SAMPLE]` until launch content is supplied. Phase 3 will add the full cart and checkout journey; the Phase 2 bag badge is intentionally local-only.

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

The catalogue works without a database connection by using the checked-in sample data. The migration and seed files are ready for a Supabase project once its credentials are supplied.

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
