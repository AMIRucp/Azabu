import { NextRequest, NextResponse } from "next/server";
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

export async function POST(request: NextRequest) {
  try {
    const { userPrivateKey, asset, isCross, leverage } = await request.json();

    if (!userPrivateKey) {
      return NextResponse.json(
        { error: "userPrivateKey is required" },
        { status: 400 }
      );
    }

    if (asset === undefined || leverage === undefined) {
      return NextResponse.json(
        { error: "asset and leverage are required" },
        { status: 400 }
      );
    }

    if (leverage < 1 || leverage > 50) {
      return NextResponse.json(
        { error: "leverage must be between 1 and 50" },
        { status: 400 }
      );
    }

    const wallet = privateKeyToAccount(userPrivateKey as `0x${string}`);
    const transport = new HttpTransport();
    const exchange = new ExchangeClient({ transport, wallet });

    const result = await exchange.updateLeverage({
      asset,
      isCross: isCross ?? true,
      leverage,
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: Date.now(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update leverage",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
