import { getAvailableDeliverySlots, getDeliveryZone } from "@/lib/commerce";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const zoneId = new URL(request.url).searchParams.get("zone") ?? "";
  if (!getDeliveryZone(zoneId)) return Response.json({ error: "Choose an active delivery zone." }, { status: 400 });
  return Response.json({ slots: getAvailableDeliverySlots() }, { headers: { "Cache-Control": "no-store" } });
}

