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
        <Link href="/#delivery">Delivery</Link>
        <Link href="/#partners">Partner with us</Link>
      </nav>
      <div className="footer-meta">
        <span>LPU + nearby</span>
        <span>© {new Date().getFullYear()} PB UNDERGROUND</span>
      </div>
    </footer>
  );
}
