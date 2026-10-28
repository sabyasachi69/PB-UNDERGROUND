# Phase status — 28 October 2026

This is an evidence-based checkpoint against the Website Build Specification v1.0 and Next Steps Plan v1.0. The source PDFs are owner-provided planning documents; their acceptance criteria are tracked here rather than assumed complete. The site remains a labelled demo. Passing a build is not the same as passing a real-device, connected-data or commercial launch gate.

| Phase | Current status | Evidence | Remaining gate |
| --- | --- | --- | --- |
| 0 Foundation | Partial | Next.js, TypeScript, CI scripts, Supabase migrations, GitHub and Vercel project exist. | Connect a production Supabase project and verify a preview deployment. |
| 1 Brand and home | Partial | Home, About, responsive CSS and reduced-motion styles exist; visual redesign was reviewed on desktop. | Mobile Lighthouse 90+, real phone motion/scroll and accessibility checks. |
| 2 Catalogue | Partial | Twelve labelled sample products, category/product routes, URL filters, stock states and product API. | Connected catalogue path, authentic product images and accessibility checks. |
| 3 Cart and checkout | Partial | Cart, coupons, zones, slots, guest COD flow and unit tests. | Durable transactional order creation, database-backed stock decrement and end-to-end tests. |
| 4 Payments | Partial | Razorpay test integration and local simulator; webhook validation and replay logic. | Connected durable payment state, provider test success/failure and restart tests. |
| 5 Accounts | Partial | Demo and Supabase-ready auth, profile, addresses, orders, wishlist and returns. | Connected end-to-end ownership and return tests against a Supabase project. |
| 6 Supplier side | In progress | Partner sales page, earnings calculator and guided demo. | Real supplier signup/approval, product manager, order queue, settlements and RLS tests. |
| 7 Demo mode | Partial | Eight-step guided sample flow, reset, CSV and printable meeting card. | Offline-after-first-load support; timed mobile/laptop run under six minutes. |
| 8 Admin | Not built | No admin routes or role-based management console. | Dashboard and operational tables, status/refund actions, settings, audit log and owner-only tests. |
| 9 Hardening | In progress | CSP/HSTS and other headers, rate limits, 404/500 UI, delivery/contact and draft policy pages, sitemap, robots and OG images. | Shared rate limiter, monitoring, backups, full axe/Lighthouse/device matrix, security review and final legal review. |
| 10 Launch prep | Not complete | Demo URL and GitHub repository exist. | Real content, commercial hosting decision, production database, verified support inbox, owner-approved policies, live payment onboarding and handover smoke test. |

## Work completed in this checkpoint

- Added `/delivery` with sample zones, fees, windows, return flow and FAQ.
- Added `/contact` with validation, honeypot and rate limiting. Messages send through Resend only if `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL` are configured. Otherwise the API returns 503 rather than claiming delivery.
- Added five clearly marked, non-indexed legal drafts. Business identity, contact details and final policy terms remain placeholders for owner and lawyer review.
- Added `robots.txt`, `sitemap.xml`, a home Open Graph image, sample product Open Graph images and an on-brand error page.
- Added a one-page printable meeting script to the supplier walkthrough.
- Confirmed `npm run check` (lint, TypeScript, 32 tests) and `npm run build` pass. Local HTTP smoke checks returned 200 for the home, shop, product, delivery, contact, privacy, robots, sitemap and Open Graph routes. The unconfigured contact endpoint returned its expected 503.

## Launch blockers and inputs

The owner must supply confirmed supplier relationships, products/photos/prices, registered business details, support inbox, delivery operating rules and approved policy wording. Supabase and Razorpay credentials, a commercial-use hosting decision and real-device user testing are needed before claiming production readiness. The code still contains an in-memory demo runtime; it is not a durable live-order system.

## Next implementation order

1. Create a single database-backed demo/production runtime and finish transactional orders, canonical variant IDs and durable payments.
2. Build supplier onboarding/approval, connected product and order tools, then settlements.
3. Build the admin operations console and audit trail on the same durable model.
4. Run automated end-to-end, accessibility and performance checks across the specified device matrix; fix observed failures.
5. Replace sample content, configure operational services and complete owner sign-off for launch.
