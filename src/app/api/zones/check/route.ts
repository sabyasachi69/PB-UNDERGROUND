import { checkDeliveryZone } from "@/lib/commerce";
import { zoneCheckSchema } from "@/lib/commerce-schema";

export async function POST(request: Request) {
  const parsed = zoneCheckSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ serviceable: false, message: parsed.error.issues[0]?.message ?? "Check the address." }, { status: 400 });
  }
  const result = checkDeliveryZone(parsed.data.zoneId, parsed.data.pincode);
  return Response.json({
    serviceable: result.serviceable,
    zone: result.zone,
    message: result.serviceable ? "We deliver here." : "This address is outside the selected delivery zone.",
  });
}

