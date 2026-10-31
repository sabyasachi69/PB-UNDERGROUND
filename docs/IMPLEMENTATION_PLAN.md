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

## Current checkpoint

The original phase summaries below describe implementation increments, not fully passed acceptance gates. For the latest evidence and unresolved gates, see [Phase status — 28 October 2026](./PHASE_STATUS_2026-10-28.md).

- Phase 0: repository foundation, environment contract, CI, test harness, and Supabase migration framework complete.
- Phase 1: branded home and About experience complete with responsive and reduced-motion treatment.
- Phase 2: demo catalogue now has 40 labelled sample products, ten in each of four editorial categories, with URL-synced search/filter/sort, variant options, local quick add, notification capture and product APIs. The Supabase seed still needs synchronization before connected commerce.
- Phase 3: cart and checkout walkthrough includes persistent browser quantities, save for later, server quotes, coupon validation, zone checks, cutoff-aware slots, guest COD, idempotent demo order creation, confirmation and tracking. Demo orders do not consume shared sample stock; durable transactional inventory remains a launch gate.
- Phase 4: Razorpay test-mode UPI Orders and a credential-free local simulator have server-side signature checks, raw-body webhook validation, event-ID replay protection and three-second payment polling. Payment attempts expire after 15 minutes; durable provider reconciliation and inventory reservations remain launch gates.
- Phase 5: customer accounts complete with Supabase-ready email/password authentication, secure cookie sessions, profile editing, five-address enforcement, saved checkout addresses, owner-scoped order history, one-click reorder, variant wishlists, photo-backed 48-hour returns, sign-out, and confirmed account deletion.
- Phase 6: in progress. The supplier sales page, responsive earnings calculator and eight-step guided supplier walkthrough are complete. The next increments add supplier onboarding and approval, connected product management, the live fulfillment queue, earnings and settlements.

Production Supabase credentials, real products, photography, supplier approvals, and commercial copy remain launch inputs and are intentionally not represented as complete.
