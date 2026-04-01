import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../../server/storage";

const SOLANA_SIG_RE = /^[1-9A-HJ-NP-Za-km-z]{80,90}$/;

const PROTOCOL_CHAIN_MAP: Record<string, { chain: string; validateTx: (sig: string) => boolean; walletRe: RegExp }> = {
  drift: {
    chain: "Solana",
    validateTx: (sig) => SOLANA_SIG_RE.test(sig),
    walletRe: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
  aster: {
    chain: "Solana",
    validateTx: (sig) => SOLANA_SIG_RE.test(sig),
    walletRe: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
  jupiter: {
    chain: "Solana",
    validateTx: (sig) => SOLANA_SIG_RE.test(sig),
    walletRe: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wallet, protocol, market, side, sizeUsd, entryPrice, leverage, txSignature } = body;

    if (!wallet || !protocol || !market || !side || !sizeUsd || !txSignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const protocolConfig = PROTOCOL_CHAIN_MAP[protocol];
    if (!protocolConfig) {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }

    if (!protocolConfig.walletRe.test(wallet)) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
    }

    if (!protocolConfig.validateTx(txSignature)) {
      return NextResponse.json({ error: "Invalid transaction signature format" }, { status: 400 });
    }

    const allowedSides = ["long", "short"];
    if (!allowedSides.includes(side)) {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }

    const numSize = Number(sizeUsd);
    if (!Number.isFinite(numSize) || numSize <= 0 || numSize > 50_000_000) {
      return NextResponse.json({ error: "Invalid sizeUsd" }, { status: 400 });
    }

    let validEntryPrice: string | null = null;
    if (entryPrice != null) {
      const ep = Number(entryPrice);
      if (!Number.isFinite(ep) || ep <= 0) {
        return NextResponse.json({ error: "Invalid entryPrice" }, { status: 400 });
      }
      validEntryPrice = String(ep);
    }

    let validLeverage: number | null = null;
    if (leverage != null) {
      const lev = Number(leverage);
      if (!Number.isFinite(lev) || lev < 1 || lev > 200) {
        return NextResponse.json({ error: "Invalid leverage" }, { status: 400 });
      }
      validLeverage = Math.floor(lev);
    }

    const record = await storage.recordTrade({
      wallet,
      protocol,
      chain: protocolConfig.chain,
      market,
      side,
      sizeUsd: String(numSize),
      entryPrice: validEntryPrice,
      leverage: validLeverage,
      txSignature,
    });

    return NextResponse.json({ ok: true, id: record.id });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as Record<string, unknown>).code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("Failed to record trade:", err);
    return NextResponse.json({ error: "Failed to record trade" }, { status: 500 });
  }
}
