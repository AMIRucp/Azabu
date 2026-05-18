import usePositionStore, { type UnifiedPosition } from "@/stores/usePositionStore";

const QUOTE_SUFFIXES = ["USDT", "USDC", "BUSD", "FDUSD"] as const;

function asterSymbolBase(symbol: string): { base: string; quote: string } {
  const s = String(symbol).toUpperCase();
  for (const q of QUOTE_SUFFIXES) {
    if (s.endsWith(q)) {
      return { base: s.slice(0, -q.length), quote: q };
    }
  }
  return { base: s, quote: "USDT" };
}

function parseNum(v: unknown): number {
  if (v === null || v === undefined) return NaN;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

export function asterPositionRowIsOpen(row: Record<string, unknown>): boolean {
  const amt = parseNum(row.positionAmt ?? row.positionAMT ?? row.positionSize ?? row.qty ?? row.quantity);
  if (Number.isFinite(amt) && amt !== 0) return true;
  const notional = parseNum(row.notional ?? row.positionValue ?? row.positionInitialMargin);
  return Number.isFinite(notional) && Math.abs(notional) > 0;
}

export function mapAsterPositionRiskRows(rows: unknown[]): UnifiedPosition[] {
  const out: UnifiedPosition[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (!asterPositionRowIsOpen(r)) continue;

    let positionAmt = parseNum(
      r.positionAmt ?? r.positionAMT ?? r.positionSize ?? r.positionQuantity ?? r.qty ?? r.quantity
    );
    const entryPrice = parseNum(r.entryPrice) || 0;
    const markPrice = parseNum(r.markPrice ?? r.entryPrice) || entryPrice;
    const notional = parseNum(r.notional ?? r.positionValue);

    if ((!Number.isFinite(positionAmt) || positionAmt === 0) && Number.isFinite(notional) && notional !== 0) {
      const px = markPrice > 0 ? markPrice : entryPrice;
      if (px > 0) positionAmt = notional / px;
      else positionAmt = notional > 0 ? 1 : -1;
    }

    if (!Number.isFinite(positionAmt) || positionAmt === 0) continue;

    const symbolPair = String(r.symbol ?? "");
    if (!symbolPair) continue;
    const { base, quote } = asterSymbolBase(symbolPair);
    const lev = parseNum(r.leverage) || 1;
    const absBase = Math.abs(positionAmt);
    const px = markPrice > 0 ? markPrice : entryPrice;
    const sizeUsd =
      Number.isFinite(notional) && notional !== 0 ? Math.abs(notional) : absBase * (px > 0 ? px : 0);
    const margin = lev > 0 ? sizeUsd / lev : sizeUsd;
    const liq = parseNum(r.liquidationPrice) || 0;
    const uPnl = parseNum(r.unRealizedProfit ?? r.unrealizedProfit) || 0;
    const roePct = margin > 0 && Number.isFinite(uPnl) ? (uPnl / margin) * 100 : 0;

    const sideRaw = String(r.positionSide ?? r.side ?? "").toUpperCase();
    let side: "LONG" | "SHORT" = positionAmt > 0 ? "LONG" : "SHORT";
    if (sideRaw === "LONG" || sideRaw === "BUY") side = "LONG";
    if (sideRaw === "SHORT" || sideRaw === "SELL") side = "SHORT";

    out.push({
      id: `aster-${symbolPair}`,
      protocol: "aster",
      chain: "Arbitrum",
      type: "perp",
      symbol: base,
      baseAsset: base,
      quoteAsset: quote,
      side,
      leverage: lev,
      sizeBase: absBase,
      sizeUsd,
      margin,
      marginUsed: margin,
      marginRatio: 0,
      entryPrice: entryPrice > 0 ? entryPrice : 0,
      markPrice: markPrice > 0 ? markPrice : entryPrice,
      liquidationPrice: liq,
      liquidationDistance: markPrice > 0 && liq > 0 ? Math.abs((markPrice - liq) / markPrice) * 100 : 0,
      unrealizedPnl: uPnl,
      unrealizedPnlPercent: roePct,
      realizedPnl: 0,
      fundingPaid: 0,
      feesPaid: 0,
      totalPnl: uPnl,
      openedAt: Date.now(),
      duration: "Active",
      isCloseable: true,
      closeMethod: "api",
      isAtRisk: false,
      isCritical: false,
    });
  }
  return out;
}

export function mergeAsterPositionsIntoStore(rows: unknown[]): void {
  const mapped = mapAsterPositionRiskRows(rows);
  const current = usePositionStore.getState().positions;
  usePositionStore.getState().setPositions([
    ...current.filter((p) => p.protocol !== "aster"),
    ...mapped,
  ]);
}
