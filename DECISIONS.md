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
- Until Razorpay test credentials are supplied, Phase 4 uses a clearly labelled local success/failure simulator. With credentials present, only `rzp_test_` keys are accepted; live collection remains a launch-gate decision.
- UPI inventory reservations expire after 15 minutes. Failure and expiry restore stock exactly once, while successful signature verification commits the reservation.
- Razorpay webhook bodies are verified before JSON parsing, and `x-razorpay-event-id` is the replay-protection key. The durable schema stores only a payload hash rather than a full webhook body.
- Until a Supabase project is connected, Phase 5 uses scrypt-hashed disposable credentials, a signed HttpOnly SameSite=Lax cookie and an owner-scoped in-memory customer store. The local store is a demo fallback only and resets with the server.
- Connected customer authentication uses Supabase Auth email/password with `@supabase/ssr`. The app trusts `auth.getUser()` and database RLS, never editable user metadata, for ownership.
- Return evidence accepts one to three JPEG, PNG or WebP images of at most 2 MB each. Connected mode writes to the private `return-evidence` bucket; demo mode keeps data URLs in memory only.
- Supabase is the sole production data runtime. The in-memory stores exist only for an explicitly non-production demo; production order creation, payment state and tracking must use durable Supabase records before live commerce is enabled.
- Public order tracking requires both the display order number and a random bearer token. The public route returns only delivery progress, slot, coarse destination and payment state—not line items, totals, phone, email or street address.

## Decisions still requiring owner approval

- Final business/legal identity and GST details.
- Real delivery zones, fees, slot windows, and support hours.
- Final founder story, supplier identities, product media, and customer testimonials.
- Commercial production host, backup policy, and Razorpay live activation.
