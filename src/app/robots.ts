import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pb-underground.vercel.app";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/cart", "/order/", "/supplier/", "/admin/", "/api/", "/partner/demo"] }, sitemap: `${origin}/sitemap.xml` };
}
