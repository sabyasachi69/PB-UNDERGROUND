# PB UNDERGROUND decisions

This file records reversible implementation choices that are not final business decisions.

## Accepted working defaults

- Tagline: **Made close. Delivered closer.**
- Demo supplier commission: **12%**.
- Initial delivery scope: **LPU gates and hostels**, expanded later through configured zones.
- Launch payment methods: **Cash on Delivery and UPI**.
- Initial fulfillment: **PB UNDERGROUND owner or trusted staff**, with supplier self-dispatch reserved for a later operating model.
- Phone verification: **disabled in the demo**, required as a launch decision.
- Demo content is marked with `[SAMPLE]` wherever it could be mistaken for a real person, supplier, testimonial, or statistic.

## Technical decisions

- Node.js 22 is the project baseline because current Supabase client libraries no longer support Node.js 20.
- The storefront is built with Next.js App Router and Server Components by default.
- The guided supplier demo will use an isolated browser-side fixture store and will never touch live customer or payment data.
- Multi-supplier orders will use supplier-specific fulfillment records rather than one shared supplier status.
- Vercel Hobby may be used for a non-commercial demo only. Commercial hosting is a launch-gate decision.
- Until a Supabase project is connected, the Phase 3 COD walkthrough uses an isolated in-memory server order store. It performs real validation, idempotency, and stock decrement for the running demo, but resets on restart and is explicitly not a live-order datastore.

## Decisions still requiring owner approval

- Final business/legal identity and GST details.
- Real delivery zones, fees, slot windows, and support hours.
- Final founder story, supplier identities, product media, and customer testimonials.
- Commercial production host, backup policy, and Razorpay live activation.
