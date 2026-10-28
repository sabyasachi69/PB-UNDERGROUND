"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Please try again later.");
      form.reset();
      setMessage("Your message has been sent.");
      setState("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again later.");
      setState("error");
    }
  }
  return <form className="contact-form" onSubmit={submit}>
    <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
    <label>Topic<select name="topic" required defaultValue=""><option value="" disabled>Select a topic</option><option value="order">Order</option><option value="delivery">Delivery</option><option value="supplier">Supplier partnership</option><option value="other">Other</option></select></label>
    <label>Message<textarea name="message" required minLength={10} maxLength={3000} rows={6} /></label>
    <div className="contact-honeypot" aria-hidden="true"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <p>Your details are used to answer this message. See our <Link href="/legal/privacy">draft privacy notice</Link>.</p>
    <button className="button button--signal" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send message"}</button>
    {state === "sent" || state === "error" ? <p className={state === "error" ? "is-error" : "is-success"} role="status">{message}</p> : null}
  </form>;
}
