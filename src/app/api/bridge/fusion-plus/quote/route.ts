import { NextRequest, NextResponse } from "next/server";
import { PresetEnum } from "@1inch/cross-chain-sdk";
import { fusionPlusGetQuote } from "@/services/fusionPlusBridgeService";
import { serializeBigInt } from "@/lib/serializeBigInt";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      srcChainId,
      dstChainId,
      srcTokenAddress,
      dstTokenAddress,
      amount,
      walletAddress,
      preset,
    } = body;

    if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const result = await fusionPlusGetQuote({
      srcChainId: Number(srcChainId),
      dstChainId: Number(dstChainId),
      srcTokenAddress: String(srcTokenAddress),
      dstTokenAddress: String(dstTokenAddress),
      amount: String(amount),
      walletAddress: String(walletAddress),
      preset: preset ? (String(preset) as PresetEnum) : undefined,
    });

    return NextResponse.json(serializeBigInt({ success: true, ...result }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      error instanceof Error && "httpStatus" in error && typeof error.httpStatus === "number"
        ? error.httpStatus
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
