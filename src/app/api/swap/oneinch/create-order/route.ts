import { NextRequest, NextResponse } from "next/server";
import { fusionSwapService } from "@/services/fusionSwapService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { fromTokenAddress, toTokenAddress, amount, walletAddress, chainId, preset } = body;

    if (!fromTokenAddress || !toTokenAddress || !amount || !walletAddress || !chainId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const result = await fusionSwapService.createOrder({
      fromTokenAddress, 
      toTokenAddress, 
      amount, 
      walletAddress, 
      chainId: Number(chainId),
      preset: preset || "fast",
    });

    return NextResponse.json({
      success: true,
      quoteId: result.quoteId,
      typedData: result.typedData,
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

