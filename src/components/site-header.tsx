import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";

const navigation = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Story" },
  { href: "/#delivery", label: "Delivery" },
  { href: "/#partners", label: "For suppliers" },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="PB Underground home">
        <span>PB</span> UNDERGROUND
      </Link>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {navigation.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        <Link className="bag-link" href="/shop" aria-label="Open shopping bag, currently empty">
          <ShoppingBag aria-hidden="true" size={18} strokeWidth={1.6} />
          <span>Bag</span>
          <span className="bag-count">0</span>
        </Link>

        <details className="mobile-menu">
          <summary aria-label="Open navigation">
            <Menu className="menu-open" aria-hidden="true" size={22} />
            <X className="menu-close" aria-hidden="true" size={22} />
          </summary>
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
