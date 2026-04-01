"use client";

import type { UnifiedPosition } from "@/stores/usePositionStore";

function fmtDuration(openedAt: number): string {
  const mins = Math.floor((Date.now() - openedAt) / 60000);
  const h = Math.floor(mins / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${mins % 60}m`;
  return `${mins}m`;
}

function risk(mark: number, liq: number) {
  if (!liq || liq <= 0) return { distance: 100, isAtRisk: false, isCritical: false };
  const d = (Math.abs(mark - liq) / mark) * 100;
  return { distance: d, isAtRisk: d < 5, isCritical: d < 2 };
}

function base(
  id: string, protocol: string, chain: string, symbol: string, baseAsset: string,
  quote: string, side: "LONG" | "SHORT", lev: number, sizeBase: number, sizeUsd: number,
  margin: number, entry: number, mark: number, liq: number, pnl: number,
  openedAt: number, closeMethod: "phantom" | "api",
  extra?: Partial<UnifiedPosition>
): UnifiedPosition {
  const r = risk(mark, liq);
  return {
    id, protocol, chain, type: "perp", symbol, baseAsset, quoteAsset: quote,
    side, leverage: Math.round(lev), sizeBase, sizeUsd, margin, marginUsed: margin,
    marginRatio: lev > 0 ? 1 / lev : 1, entryPrice: entry, markPrice: mark,
    liquidationPrice: liq, liquidationDistance: r.distance,
    unrealizedPnl: pnl, unrealizedPnlPercent: margin > 0 ? (pnl / margin) * 100 : 0,
    realizedPnl: 0, fundingPaid: 0, feesPaid: 0, totalPnl: pnl,
    openedAt, duration: fmtDuration(openedAt),
    isCloseable: true, closeMethod, isAtRisk: r.isAtRisk, isCritical: r.isCritical,
    ...extra,
  };
}

export async function fetchAllPositions(
  solWallet?: string,
  evmAddress?: string
): Promise<UnifiedPosition[]> {
  const results = await Promise.allSettled([
    fetchDrift(solWallet), fetchAster(evmAddress, solWallet), fetchHyperliquid(evmAddress),
  ]);
  const all: UnifiedPosition[] = [];
  for (const r of results) if (r.status === "fulfilled") all.push(...r.value);
  all.sort((a, b) => b.sizeUsd - a.sizeUsd);
  return all;
}

async function fetchDrift(sol?: string): Promise<UnifiedPosition[]> {
  if (!sol) return [];
  try {
    const res = await fetch(`/api/drift/account?pubkey=${sol}`);
    if (!res.ok) return [];
    const d = await res.json();
    if (d.noAccount || !d.positions?.length) return [];
    const lev = d.leverage || 1;
    const col = d.totalCollateral || 0;
    return d.positions.map((p: Record<string, unknown>) => {
      const mkt = (p.market as string) || "UNKNOWN";
      const sz = Math.abs((p.size as number) || 0);
      const usd = (p.sizeUsd as number) || (p.notional as number) || 0;
      const isLong = ((p.direction as string) || "long") === "long" || ((p.size as number) || 0) > 0;
      const entry = (p.entryPrice as number) || 0;
      const mark = (p.markPrice as number) || 0;
      const pnl = (p.unrealizedPnl as number) ?? (p.unrealisedPnl as number) ?? 0;
      const margin = col > 0 ? usd / lev : usd;
      const side = isLong ? "LONG" as const : "SHORT" as const;
      return base(`drift:${mkt}:${side}`, "drift", "Solana", mkt, mkt.replace("-PERP", ""),
        "USDC", side, lev, sz, usd, margin,
        entry, mark, (p.liquidationPrice as number) || 0, pnl, Date.now() - 3600000, "phantom");
    });
  } catch (e) { console.error("[POS] Drift:", e); return []; }
}

async function fetchAster(evmAddress?: string, solWallet?: string): Promise<UnifiedPosition[]> {
  try {
    const uid = localStorage.getItem("aster-user-id") || localStorage.getItem("aster_user_id") || evmAddress || solWallet;
    if (!uid) return [];
    const res = await fetch(`/api/aster/positions?userId=${uid}`);
    if (!res.ok) return [];
    const d = await res.json();
    return (d.positions || [])
      .filter((p: Record<string, string>) => parseFloat(p.positionAmt || "0") !== 0)
      .map((p: Record<string, string>) => {
        const sz = Math.abs(parseFloat(p.positionAmt || "0"));
        const entry = parseFloat(p.entryPrice || "0");
        const mark = parseFloat(p.markPrice || "0");
        const usd = Math.abs(parseFloat(p.notional || "0")) || sz * mark;
        const pnl = parseFloat(p.unRealizedProfit || "0");
        const lev = parseInt(p.leverage || "1");
        const margin = lev > 0 ? usd / lev : usd;
        const isLong = p.positionSide === "LONG" || (p.positionSide !== "SHORT" && parseFloat(p.positionAmt || "0") > 0);
        const openedAt = parseInt(p.updateTime || "0") || Date.now();
        const side = isLong ? "LONG" as const : "SHORT" as const;
        return base(`aster:${p.symbol}:${side}`, "aster", "Arbitrum", p.symbol || "UNKNOWN",
          (p.symbol || "").replace("USDT", ""), "USDT", side,
          lev, sz, usd, margin, entry, mark, parseFloat(p.liquidationPrice || "0"),
          pnl, openedAt, "api", { marginUsed: parseFloat(p.initialMargin || "0") || margin });
      });
  } catch (e) { console.error("[POS] Aster:", e); return []; }
}

async function fetchHyperliquid(evmAddress?: string): Promise<UnifiedPosition[]> {
  if (!evmAddress) return [];
  try {
    const res = await fetch(`/api/hyperliquid/account?address=${evmAddress}`);
    if (!res.ok) return [];
    const d = await res.json();
    return (d.positions || []).map((p: Record<string, any>) => {
      const sz = Math.abs(parseFloat(p.size || "0"));
      const entry = parseFloat(p.entryPrice || "0");
      const posVal = parseFloat(p.positionValue || "0");
      const pnl = parseFloat(p.unrealizedPnl || "0");
      const lev = p.leverage?.value || 1;
      const margin = parseFloat(p.marginUsed || "0") || (posVal > 0 ? posVal / lev : 0);
      const isLong = parseFloat(p.size || "0") > 0;
      const side = isLong ? "LONG" as const : "SHORT" as const;
      const liqPx = parseFloat(p.liquidationPrice || "0");
      const mark = sz > 0 ? posVal / sz : entry;
      return base(
        `hl:${p.coin}:${side}`, "hyperliquid", "Hyperliquid",
        p.coin, p.coin, "USDC", side, lev, sz, posVal, margin,
        entry, mark, liqPx, pnl, Date.now() - 3600000, "api",
        { marginUsed: margin }
      );
    });
  } catch (e) { console.error("[POS] Hyperliquid:", e); return []; }
}
