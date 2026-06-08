import { NextRequest, NextResponse } from "next/server";
import { fusionPlusOrderStatus } from "@/services/fusionPlusBridgeService";
import { serializeBigInt } from "@/lib/serializeBigInt";

export const dynamic = "force-dynamic";

const TERMINAL = new Set(["executed", "expired", "refunded", "cancelled"]);

export async function GET(request: NextRequest) {
  try {
    const orderHash = request.nextUrl.searchParams.get("orderHash");
    if (!orderHash) {
      return NextResponse.json({ error: "orderHash required" }, { status: 400 });
    }

    const data = await fusionPlusOrderStatus(orderHash);
    const status = String((data as { status?: string }).status || "").toLowerCase();

    return NextResponse.json(
      serializeBigInt({
        success: true,
        status: (data as { status?: string }).status,
        isCompleted: status === "executed",
        isTerminal: TERMINAL.has(status),
        isExpired: status === "expired",
        isRefunded: status === "refunded",
        raw: data,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
