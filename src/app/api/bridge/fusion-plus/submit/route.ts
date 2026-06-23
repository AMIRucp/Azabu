import { NextRequest, NextResponse } from "next/server";
import { fusionPlusSubmitOrder } from "@/services/fusionPlusBridgeService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, signature } = body;

    if (!quoteId || !signature) {
      return NextResponse.json({ error: "quoteId and signature required" }, { status: 400 });
    }

    const result = await fusionPlusSubmitOrder({
      quoteId: String(quoteId),
      signature: String(signature),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      error instanceof Error && "httpStatus" in error && typeof error.httpStatus === "number"
        ? error.httpStatus
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
