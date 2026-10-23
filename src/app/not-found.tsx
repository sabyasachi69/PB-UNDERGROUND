import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found" id="main-content">
      <span>404 / Wrong tunnel</span>
      <h1>Nothing<br />down here.</h1>
      <Link className="button button--ink" href="/">
        <ArrowLeft aria-hidden="true" size={18} /> Back to the surface
      </Link>
    </main>
  );
}
