import { NextRequest, NextResponse } from "next/server";
import { fusionPlusReadySecrets } from "@/services/fusionPlusBridgeService";
import { serializeBigInt } from "@/lib/serializeBigInt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const orderHash = request.nextUrl.searchParams.get("orderHash");
    if (!orderHash) {
      return NextResponse.json({ error: "orderHash required" }, { status: 400 });
    }

    const data = await fusionPlusReadySecrets(orderHash);
    return NextResponse.json(serializeBigInt({ success: true, ...data }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
