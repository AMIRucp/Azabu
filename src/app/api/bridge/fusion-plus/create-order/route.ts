import { NextRequest, NextResponse } from "next/server";
import { PresetEnum } from "@1inch/cross-chain-sdk";
import { fusionPlusCreatePreparedOrder } from "@/services/fusionPlusBridgeService";
import { serializeBigInt } from "@/lib/serializeBigInt";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, walletAddress, preset, hashLock, secretHashes } = body;

    if (!quoteId || !walletAddress || !preset || !hashLock || !Array.isArray(secretHashes)) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const result = fusionPlusCreatePreparedOrder({
      quoteId: String(quoteId),
      walletAddress: String(walletAddress),
      preset: String(preset) as PresetEnum,
      hashLock: String(hashLock),
      secretHashes: secretHashes.map(String),
    });

    return NextResponse.json(serializeBigInt({ success: true, ...result }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
