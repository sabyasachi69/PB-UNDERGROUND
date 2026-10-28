import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HeaderScene } from "@/components/header-scene";

const policies = {
  terms: { title: "Terms of use", sections: [
    ["Who operates this site", "[REGISTERED BUSINESS NAME], [BUSINESS ADDRESS], [GSTIN IF APPLICABLE], operates PB UNDERGROUND. These details must be completed before live trading."],
    ["Orders and prices", "Product availability, prices, delivery areas and fees are confirmed at checkout. A placed order can be declined if stock or delivery service is unavailable; any collected payment must then be refunded under the final approved policy."],
    ["Contact and disputes", "For questions about an order, use the contact page and quote the order number. The owner must add a working support email, phone and response hours before launch."],
  ] },
  privacy: { title: "Privacy notice", sections: [
    ["Information used for orders", "The checkout asks for a name, phone number and delivery address; email is used when provided. An account also stores saved addresses, order history and wishlist choices."],
    ["Why it is used", "Order details are used to take payment, arrange delivery, provide tracking, handle returns and respond to support requests. Optional marketing requires a separate choice."],
    ["Service providers and retention", "The site is designed to use Supabase for account and order storage, Razorpay for test payment checkout and the selected hosting provider. The owner must approve actual processors, retention periods, deletion procedure and contact details before launch."],
    ["Your choices", "Account holders can view and edit profile details and saved addresses and request account deletion. For other data requests, contact [PRIVACY CONTACT EMAIL]."],
  ] },
  returns: { title: "Refund and return policy", sections: [
    ["Demo eligibility", "The current demo accepts a return request within 48 hours of delivery for a size or defect issue, with photos. The item should be unworn with tags."],
    ["Review and resolution", "A request is reviewed before approval. The owner must confirm pickup arrangements, exclusions, exchange availability, refund method and timing before accepting live orders."],
    ["How to request", "Sign in and open the order in your account, or contact [SUPPORT EMAIL] with the order number."],
  ] },
  shipping: { title: "Shipping and delivery policy", sections: [
    ["Sample delivery area", "The demo lists selected LPU gates, hostels and nearby localities. The checkout checks the chosen zone and pincode before order placement."],
    ["Fees and slots", "The demo fee is ₹30 below ₹499 and free at or above ₹499. Available same-day windows are shown at checkout and close two hours before their start. These terms require owner confirmation before launch."],
    ["Missed hand-off", "If a delivery slot cannot be met, the final support process should explain how the customer is contacted, rescheduled or refunded."],
  ] },
  supplier: { title: "Supplier agreement summary", sections: [
    ["Demo commercial model", "The sample programme uses 12% commission and a weekly statement. No supplier is bound by this summary; final individual terms need a signed agreement."],
    ["Supplier responsibilities", "Suppliers should keep stock accurate, describe products honestly, and confirm or decline orders within the agreed response window."],
    ["PB responsibilities", "The proposed platform provides the customer storefront, order notices, delivery coordination and itemised settlement records. The final agreement must assign return, tax and dispute responsibilities."],
  ] },
} as const;

type PolicyPageProps = { params: Promise<{ policy: string }> };
export function generateStaticParams() { return Object.keys(policies).map((policy) => ({ policy })); }
export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { policy } = await params;
  const data = policies[policy as keyof typeof policies];
  return { title: data ? `${data.title} — draft` : "Policy not found", robots: { index: false } };
}
export default async function PolicyPage({ params }: PolicyPageProps) {
  const { policy } = await params;
  const data = policies[policy as keyof typeof policies];
  if (!data) notFound();
  return <main className="information-page" id="main-content"><header className="information-hero information-hero--legal scene-host"><HeaderScene kind="document" /><p className="eyebrow eyebrow--light">Legal / owner review required</p><h1>{data.title}.</h1><p>Draft for review by a qualified lawyer. This page describes the current demo design; it is not the final policy for live orders.</p></header><div className="legal-content"><p className="draft-note">[DRAFT FOR REVIEW] Complete [REGISTERED BUSINESS NAME], [BUSINESS ADDRESS], [GSTIN IF APPLICABLE], [SUPPORT EMAIL] and [PRIVACY CONTACT EMAIL]. Confirm every commercial and operational term before launch.</p>{data.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}<Link className="button button--ink" href="/contact">Contact and support</Link></div></main>;
}
