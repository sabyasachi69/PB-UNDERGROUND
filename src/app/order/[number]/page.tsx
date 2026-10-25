import type { Metadata } from "next";

import { OrderTracking } from "@/components/order-tracking";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  const { number } = await params;
  return {
    title: `Track ${number}`,
    description: "Track the latest status of a PB UNDERGROUND order.",
    robots: { index: false, follow: false },
  };
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const [{ number }, query] = await Promise.all([params, searchParams]);
  const trackingToken = typeof query.token === "string" ? query.token : "";
  return <main className="tracking-page" id="main-content"><OrderTracking orderNumber={number} trackingToken={trackingToken} /></main>;
}

