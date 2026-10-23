# PB UNDERGROUND

An editorial, mobile-first storefront and supplier operating platform for a locally sourced fashion and essentials brand serving the LPU community.

## Status

Phase 0 foundation and the first branded storefront slice are in progress. Sample names and claims are explicitly labelled until the owner supplies launch content.

## Local setup

Requirements:

- Node.js 22+
- npm 10+

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Project principles

- Server Components by default; client code only where interaction requires it.
- All money uses integer paise.
- Prices, stock, delivery rules, coupons, roles, and state transitions are enforced on the server.
- Supabase tables in exposed schemas must use Row Level Security.
- Real secrets are never committed. See `.env.example` for the required names.
- Missing owner-provided content is labelled `[SAMPLE]`, never presented as fact.

See [`DECISIONS.md`](./DECISIONS.md) for working assumptions and [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) for the phased delivery sequence.
