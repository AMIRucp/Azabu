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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { tokenAddress, walletAddress, amount } = body;

    if (!tokenAddress || !walletAddress || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const allowance = await fusionSwapService.checkAllowance({
      tokenAddress,
      walletAddress,
      amount,
    });

    const serializedAllowance = serializeBigInt(allowance);

    return NextResponse.json({ success: true, ...serializedAllowance }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to check allowance", details: errorMessage },
      { status: 500 }
    );
  }
}
