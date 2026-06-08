import { NextRequest, NextResponse } from "next/server";
import { fusionPlusSubmitSecret } from "@/services/fusionPlusBridgeService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderHash, secret } = body;

    if (!orderHash || !secret) {
      return NextResponse.json({ error: "orderHash and secret required" }, { status: 400 });
    }

    await fusionPlusSubmitSecret(String(orderHash), String(secret));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
