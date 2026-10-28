import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="footer-wordmark" href="/">
          PB UNDERGROUND
        </Link>
        <p>Made close. Delivered closer.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/shop">Shop</Link>
        <Link href="/about">Our story</Link>
        <Link href="/delivery">Delivery and returns</Link>
        <Link href="/partner">Partner with us</Link>
        <Link href="/contact">Contact</Link>
      </nav>
      <nav aria-label="Draft policies">
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/returns">Returns</Link>
        <Link href="/legal/shipping">Shipping</Link>
        <Link href="/legal/supplier">Supplier terms</Link>
      </nav>
      <div className="footer-meta">
        <span>LPU + nearby</span>
        <span>© {new Date().getFullYear()} PB UNDERGROUND</span>
      </div>
    </footer>
  );
}
