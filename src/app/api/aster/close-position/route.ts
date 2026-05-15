import { NextRequest, NextResponse } from "next/server";
import { assertWalletMatchesUser } from "@/lib/asterApiUser";
import {
  agentApprovalHint,
  asterPlaceOrder,
  resolveAsterUserAndSigner,
} from "@/lib/asterFapiSign";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, symbol, side, quantity } = body;

    if (!userId || !symbol || !side || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: "userId, symbol, side, and quantity are required" },
        { status: 400 }
      );
    }

    const qtyStr = String(quantity).trim();
    if (!qtyStr || qtyStr === "0") {
      return NextResponse.json({ error: "quantity must be non-zero" }, { status: 400 });
    }

    const walletCheck = assertWalletMatchesUser(request, String(userId));
    if (!walletCheck.ok) return walletCheck.response;

    const resolvedOut = await resolveAsterUserAndSigner(walletCheck.user);
    if (!resolvedOut.ok) {
      return NextResponse.json({ error: resolvedOut.error }, { status: resolvedOut.status });
    }

    const result = await asterPlaceOrder(resolvedOut.resolved, {
      symbol: String(symbol).replace(/-/g, "").toUpperCase(),
      type: "MARKET",
      side: String(side).toUpperCase(),
      quantity: qtyStr,
      reduceOnly: "true",
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: agentApprovalHint(result.error), code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, orderId: result.orderId, data: result.data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to close position", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
