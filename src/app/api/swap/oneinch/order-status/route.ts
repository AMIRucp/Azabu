import { NextRequest, NextResponse } from "next/server";
import { fusionSwapService } from "@/services/fusionSwapService";

function serializeBigInt(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  }
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map(serializeBigInt);
    }
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }
  return obj;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderHash = searchParams.get("orderHash");
    const chainId = parseInt(searchParams.get("chainId") || "42161");

    if (!orderHash) {
      return NextResponse.json({ error: "Missing orderHash parameter" }, { status: 400 });
    }

    const status = await fusionSwapService.getOrderStatus(orderHash, chainId);
    const serializedStatus = serializeBigInt(status);

    return NextResponse.json(serializedStatus, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get order status", details: errorMessage },
      { status: 500 }
    );
  }
}
