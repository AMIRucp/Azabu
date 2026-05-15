import { NextRequest, NextResponse } from "next/server";
import { assertWalletMatchesUser } from "@/lib/asterApiUser";
import {
  agentApprovalHint,
  asterPlaceOrder,
  asterSetLeverage,
  resolveAsterUserAndSigner,
} from "@/lib/asterFapiSign";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, symbol, side, quantity, leverage, orderType = "MARKET", price, hidden } = body;

    if (!userId || !symbol || !side || !quantity) {
      return NextResponse.json({ error: "userId, symbol, side, quantity are required" }, { status: 400 });
    }

    const walletCheck = assertWalletMatchesUser(request, String(userId));
    if (!walletCheck.ok) return walletCheck.response;

    const resolvedOut = await resolveAsterUserAndSigner(walletCheck.user);
    if (!resolvedOut.ok) {
      return NextResponse.json({ error: resolvedOut.error }, { status: resolvedOut.status });
    }

    const resolved = resolvedOut.resolved;

    if (leverage && leverage > 1) {
      await asterSetLeverage(resolved, String(symbol), Number(leverage));
    }

    const result = await asterPlaceOrder(resolved, {
      symbol: String(symbol),
      type: String(orderType),
      side: String(side),
      quantity: String(quantity),
      ...(orderType !== "MARKET" && price ? { price: String(price) } : {}),
      ...(hidden ? { hidden: "true" } : {}),
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
      { error: "Failed to place order", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
