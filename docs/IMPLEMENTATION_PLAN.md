# Implementation plan

PB UNDERGROUND is delivered through strict phase gates:

0. Foundation: repository, Next.js, design tokens, environment contract, CI, tests and Supabase migration framework.
1. Brand and home: eight-act home page, About page, reduced-motion behaviour and performance gate.
2. Catalogue: product/category routes, variants, URL filters, search and seeded catalogue.
3. Cart and checkout: cart, coupons, zones, slots, COD order, confirmation and tracking.
4. Payments: Razorpay test integration, inventory reservation, webhooks and idempotency.
5. Accounts: authentication, addresses, orders, reorder, wishlist and returns.
6. Supplier side: partner page, onboarding, product manager, fulfillment and settlements.
7. Demo mode: isolated offline walkthrough, reset and printable script.
8. Admin: daily operations, moderation, refunds, settings and audit log.
9. Hardening: security, accessibility, performance, SEO, monitoring and legal drafts.
10. Launch: real content, production infrastructure, live payments and handover.

Each phase must pass lint, types, tests, responsive review, accessibility checks, and its documented acceptance criteria before the next phase is considered complete.
