import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact and support", description: "Ask PB UNDERGROUND about orders, delivery coverage or supplying the campus.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return <main className="information-page" id="main-content"><header className="information-hero"><p className="eyebrow eyebrow--light">Contact / support</p><h1>Talk to a<br /><em>real person.</em></h1><p>Ask about an order, the sample delivery area or becoming a supplier. Final support hours and contact details will be added by the owner before launch.</p></header><section className="information-section contact-layout"><div><p className="eyebrow">Send a note</p><h2>What can we help with?</h2><p>Include your order number if you have one. Please do not send card details or passwords.</p><p className="draft-note">[DEMO NOTICE] The form can send only after the owner configures a support inbox and email service. It will report an error until then.</p></div><ContactForm /></section></main>;
}
