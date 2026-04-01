import { NextRequest, NextResponse } from "next/server";

const HL_EXCHANGE_URL = "https://api.hyperliquid.xyz/exchange";
const HL_CHAIN_ID = 42161; // Arbitrum mainnet for signature

/**
 * GET  – returns the EIP-712 typed data the user must sign in their EVM wallet.
 * POST – receives the signed payload from the client and proxies it to HL API.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination");
  const amount = searchParams.get("amount");

  if (!destination || !amount) {
    return NextResponse.json({ error: "destination and amount required" }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // HL requires exactly 1 decimal place minimum
  const amountStr = parsedAmount.toFixed(Math.max(1, (parsedAmount.toString().split(".")[1]?.length ?? 0)));
  const nonce = Date.now();

  const eip712Payload = {
    domain: {
      name: "HyperliquidSignTransaction",
      version: "1",
      chainId: HL_CHAIN_ID,
      verifyingContract: "0x0000000000000000000000000000000000000000",
    },
    types: {
      "HyperliquidTransaction:Withdraw": [
        { name: "hyperliquidChain", type: "string" },
        { name: "destination", type: "string" },
        { name: "amount", type: "string" },
        { name: "time", type: "uint64" },
      ],
    },
    primaryType: "HyperliquidTransaction:Withdraw",
    message: {
      hyperliquidChain: "Mainnet",
      destination,
      amount: amountStr,
      time: nonce,
    },
  };

  return NextResponse.json({ eip712Payload, nonce, amountStr });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, nonce, signature } = body;

    if (!action || !nonce || !signature) {
      return NextResponse.json({ error: "action, nonce, and signature required" }, { status: 400 });
    }

    if (action.type !== "withdraw3") {
      return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }

    const amount = parseFloat(action.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: "Invalid withdrawal amount" }, { status: 400 });
    }

    const hlBody = { action, nonce, signature };

    const res = await fetch(HL_EXCHANGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hlBody),
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[hl/withdraw] Error:", e.message);
    return NextResponse.json({ error: e.message || "Withdrawal failed" }, { status: 500 });
  }
}
