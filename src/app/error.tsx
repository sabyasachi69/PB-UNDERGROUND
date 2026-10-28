"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="not-found" id="main-content"><span>500 / Something went wrong</span><h1>We lost<br />the thread.</h1><p>Please try this page again. If it keeps happening, let us know.</p><div className="error-actions"><button className="button button--signal" onClick={reset}>Try again</button><Link className="button button--ink" href="/shop">Back to shop</Link></div></main>;
}
