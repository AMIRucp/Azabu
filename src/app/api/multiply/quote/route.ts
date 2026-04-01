import { NextRequest, NextResponse } from "next/server";
import { getMultiplyVaultBySymbol, buildMultiplyConfirm } from "../../../../../server/multiplyService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    const amount = parseFloat(searchParams.get("amount") || "0");
    const multiplier = parseFloat(searchParams.get("multiplier") || "1");

    if (!symbol || symbol.length > 20) {
      return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
    }
    if (isNaN(amount) || amount < 0 || amount > 1e12) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (isNaN(multiplier) || multiplier < 1 || multiplier > 20) {
      return NextResponse.json({ error: "Invalid multiplier" }, { status: 400 });
    }

    const vault = getMultiplyVaultBySymbol(symbol);
    if (!vault) {
      return NextResponse.json({
        available: false,
        symbol,
        message: `No multiply vault available for ${symbol}`,
      });
    }

    if (amount > 0 && multiplier > 1) {
      const confirm = buildMultiplyConfirm(symbol, amount, multiplier);
      return NextResponse.json({
        available: true,
        vault: {
          id: vault.id,
          collateralSymbol: vault.collateralSymbol,
          maxMultiplier: vault.maxMultiplier,
          netApyPercent: vault.netApyPercent,
        },
        confirm: {
          targetMultiplier: confirm.targetMultiplier,
          totalExposure: confirm.totalExposure,
          debtAmount: confirm.debtAmount,
          netApyAtTarget: confirm.netApyAtTarget,
          isNearMaxLeverage: confirm.isNearMaxLeverage,
          deepLink: confirm.deepLink,
        },
      });
    }

    return NextResponse.json({
      available: true,
      vault: {
        id: vault.id,
        collateralSymbol: vault.collateralSymbol,
        maxMultiplier: vault.maxMultiplier,
        netApyPercent: vault.netApyPercent,
      },
    });
  } catch (err: unknown) {
    console.error("[Multiply quote]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to fetch multiply quote" }, { status: 500 });
  }
}
