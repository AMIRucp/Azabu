"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ChevronDown, AlertTriangle, Search, LineChart, X } from "lucide-react";
import useMarketStore from "@/stores/useMarketStore";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useTradeExecution } from "@/hooks/useTradeExecution";
import { useCollateralBalance } from "@/hooks/useCollateralBalance";
import type { TradeChain } from "@/config/collateralConfig";
import TradeSuccessOverlay from "@/components/perps/TradeSuccessOverlay";
import type { CelebrationTrade } from "@/components/perps/TradeSuccessOverlay";
import type { UnifiedMarket } from "@/types/market";
import TokenIcon from "@/components/shared/TokenIcon";

const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

interface TopAsset {
  sym: string;
  label: string;
  icon: string;
}

function buildAssetsFromMarkets(markets: UnifiedMarket[]): TopAsset[] {
  const seen = new Map<string, TopAsset>();
  // Priority order: aster > hyperliquid > lighter
  const protocolOrder = ["aster", "hyperliquid", "lighter"];
  const sorted = [...markets].sort((a, b) => {
    return protocolOrder.indexOf(a.protocol) - protocolOrder.indexOf(b.protocol);
  });
  for (const m of sorted) {
    if (m.type !== "perp") continue;
    const key = m.baseAsset.toUpperCase();
    if (!seen.has(key)) {
      seen.set(key, {
        sym: m.baseAsset,
        label: m.name || m.baseAsset,
        icon: "",
      });
    }
  }
  return Array.from(seen.values());
}

const FALLBACK_ASSETS: TopAsset[] = [
  { sym: "BTC", label: "Bitcoin",  icon: "" },
  { sym: "ETH", label: "Ethereum", icon: "" },
];

const SIZE_PRESETS: { label: string; value: number; exposure: string }[] = [
  { label: "Small", value: 25, exposure: "~$25" },
  { label: "Medium", value: 100, exposure: "~$100" },
  { label: "Large", value: 500, exposure: "~$500" },
];

type Collateral = "USDC" | "USDT";

interface VenueResolution {
  venue: "aster" | "hyperliquid";
  chain: TradeChain;
  marketSymbol: string;
  maxLev: number;
  market: UnifiedMarket | null;
}

function resolveSmartVenue(sym: string, collateral: Collateral, markets: UnifiedMarket[]): VenueResolution {
  const upperSym = sym.toUpperCase();
  const asterMatch = markets.find(m => m.protocol === "aster" && m.baseAsset.toUpperCase() === upperSym);
  const hlMatch = markets.find(m => m.protocol === "hyperliquid" && m.baseAsset.toUpperCase() === upperSym);

  if (collateral === "USDT" && asterMatch) {
    return { venue: "aster", chain: "arbitrum", marketSymbol: asterMatch.symbol, maxLev: asterMatch.maxLeverage ?? 20, market: asterMatch };
  }
  if (collateral === "USDC" && hlMatch) {
    return { venue: "hyperliquid", chain: "hyperliquid", marketSymbol: hlMatch.symbol, maxLev: hlMatch.maxLeverage ?? 20, market: hlMatch };
  }
  if (asterMatch) {
    return { venue: "aster", chain: "arbitrum", marketSymbol: asterMatch.symbol, maxLev: asterMatch.maxLeverage ?? 20, market: asterMatch };
  }
  if (hlMatch) {
    return { venue: "hyperliquid", chain: "hyperliquid", marketSymbol: hlMatch.symbol, maxLev: hlMatch.maxLeverage ?? 20, market: hlMatch };
  }
  return { venue: "aster", chain: "arbitrum", marketSymbol: `${sym}USDT`, maxLev: 20, market: null };
}

function estimateLiqPrice(entry: number, lev: number, side: "long" | "short"): number {
  if (lev <= 0 || entry <= 0) return 0;
  const mm = 0.005;
  return side === "long"
    ? entry * (1 - (1 / lev) + mm)
    : entry * (1 + (1 / lev) - mm);
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 100) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return p.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function findAssetBySym(sym: string, allAssets: TopAsset[]): TopAsset | undefined {
  const upper = sym.toUpperCase();
  // Try exact base match first, then strip USDT suffix
  return allAssets.find(a => a.sym.toUpperCase() === upper)
    || allAssets.find(a => a.sym.toUpperCase() === upper.replace(/USDT$/, '').replace(/-PERP$/, ''));
}

function getMaxLevForAsset(sym: string, collateral: Collateral, markets: UnifiedMarket[]): number {
  const resolution = resolveSmartVenue(sym, collateral, markets);
  return resolution.maxLev;
}

function leverageColor(lev: number, max: number): string {
  const ratio = max > 1 ? (lev - 1) / (max - 1) : 0;
  if (ratio <= 0.15) return "#3D6B5C";
  if (ratio <= 0.35) return "#6B8C5A";
  if (ratio <= 0.60) return "#8C7A3D";
  if (ratio <= 0.80) return "#9C6040";
  return "#7C3A3A";
}

function leverageGradient(max: number): string {
  return `linear-gradient(to right, #2A4A3A 0%, #3D6B5C 15%, #6B8C5A 35%, #8C7A3D 55%, #9C6040 75%, #7C3A3A 100%)`;
}

interface PerpsSwapContentProps {
  preselectedAsset?: string;
}

export function PerpsSwapContent({ preselectedAsset }: PerpsSwapContentProps) {
  const { markets, livePrices, startPolling } = useMarketStore();
  const { evmAddress, isEvmConnected, connectEvm } = useEvmWallet();
  const { txState, txMsg, execute, dismiss } = useTradeExecution();
  const sliderRef = useRef<HTMLInputElement>(null);

  const allAssets = useMemo(
    () => { const a = buildAssetsFromMarkets(markets); return a.length > 0 ? a : FALLBACK_ASSETS; },
    [markets]
  );

  const initialAsset = useMemo(() => {
    if (preselectedAsset) {
      const found = findAssetBySym(preselectedAsset, allAssets);
      if (found) return found;
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("afx_perps_asset");
      if (stored) {
        const found = findAssetBySym(stored, allAssets);
        if (found) return found;
      }
    }
    return allAssets[0] || FALLBACK_ASSETS[0];
  }, [preselectedAsset, allAssets]);

  const [asset, setAsset] = useState<TopAsset>(initialAsset);
  const [side, setSide] = useState<"long" | "short">("long");
  const [collateral, setCollateral] = useState<Collateral>("USDC");
  const [sizeUsd, setSizeUsd] = useState<string>("");
  const [customSize, setCustomSize] = useState(false);
  const [leverage, setLeverage] = useState(2);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [celebTrade, setCelebTrade] = useState<CelebrationTrade | null>(null);
  const [showChart, setShowChart] = useState(false);

  // Sync asset when markets load (in case initialAsset was a fallback)
  useEffect(() => {
    if (allAssets.length > 0 && allAssets !== FALLBACK_ASSETS) {
      const current = findAssetBySym(asset.sym, allAssets);
      if (current && current.icon !== asset.icon) setAsset(current);
    }
  }, [allAssets]);

  useEffect(() => {
    if (preselectedAsset) {
      const found = findAssetBySym(preselectedAsset, allAssets);
      if (found) setAsset(found);
    }
  }, [preselectedAsset, allAssets]);

  useEffect(() => {
    localStorage.setItem("afx_perps_asset", asset.sym);
  }, [asset.sym]);

  useEffect(() => {
    const cleanup = startPolling();
    return cleanup;
  }, [startPolling]);

  const venueResolution = useMemo(
    () => resolveSmartVenue(asset.sym, collateral, markets),
    [asset.sym, collateral, markets]
  );
  const { venue: effectiveVenue, chain: effectiveChain, marketSymbol: effectiveSymbol, maxLev: effectiveMaxLev } = venueResolution;

  useEffect(() => {
    setLeverage(prev => Math.min(prev, effectiveMaxLev));
  }, [effectiveMaxLev]);
  const effectiveCollateral = effectiveVenue === "aster" ? "USDT" : "USDC";
  const collateralAdjusted = effectiveCollateral !== collateral;
  const noMarketAvailable = venueResolution.market === null;
  const clampedLev = Math.min(leverage, effectiveMaxLev);

  const sizeNum = parseFloat(sizeUsd) || 0;
  const collateralRequired = clampedLev > 0 ? sizeNum / clampedLev : sizeNum;

  const collateralState = useCollateralBalance(effectiveChain, collateralRequired);

  const livePrice = livePrices[effectiveSymbol]?.price ?? 0;
  const change24h = livePrices[effectiveSymbol]?.change24h ?? 0;
  const fundingRate = livePrices[effectiveSymbol]?.fundingRate ?? 0;

  const liqPrice = livePrice > 0 ? estimateLiqPrice(livePrice, clampedLev, side) : 0;
  const moveToLiq = livePrice > 0 && liqPrice > 0 ? Math.abs((liqPrice - livePrice) / livePrice) * 100 : 0;
  const maxLoss = collateralRequired;
  const positionSize = sizeNum;
  const assetQty = livePrice > 0 ? positionSize / livePrice : 0;
  const pnlAt2Pct = positionSize * 0.02;

  const canTrade = isEvmConnected && sizeNum > 0 && livePrice > 0 && collateralState.sufficient && !noMarketAvailable;

  const handleTrade = useCallback(async () => {
    if (!canTrade) return;

    const marketInfo = {
      sym: asset.sym,
      price: livePrice,
      maxLev: effectiveMaxLev,
      marketName: effectiveSymbol,
      category: "crypto",
    };

    await execute({
      chain: effectiveVenue === "hyperliquid" ? "hyperliquid" : "arbitrum",
      market: marketInfo,
      side,
      sizeNum: assetQty,
      posValue: positionSize,
      lev: clampedLev,
      otype: "market",
      price: livePrice.toString(),
      maxLev: effectiveMaxLev,
      marketSymbol: effectiveSymbol,
      collateral: collateralRequired,
      tp: "",
      sl: "",
      hiddenOrder: false,
      asterUserId: evmAddress || undefined,
      onTradeSuccess: () => {
        setCelebTrade({
          side,
          sym: asset.sym,
          lev: clampedLev,
          posValue: positionSize,
          entryPrice: livePrice,
        });
      },
    });
  }, [canTrade, asset, livePrice, effectiveMaxLev, effectiveVenue, effectiveSymbol, side, assetQty, positionSize, clampedLev, collateralRequired, evmAddress, execute]);

  const handleConnect = useCallback(() => {
    connectEvm();
  }, [connectEvm]);

  const handleDismissCeleb = useCallback(() => {
    setCelebTrade(null);
    dismiss();
    setSizeUsd("");
    setCustomSize(false);
  }, [dismiss]);

  const handleSelectAsset = useCallback((a: TopAsset) => {
    setAsset(a);
    setShowAssetPicker(false);
    setPickerSearch("");
  }, []);

  const isLong = side === "long";
  const accentColor = isLong ? "#D4A574" : "#ef4461";
  const accentDim = isLong ? "rgba(212,165,116,0.06)" : "rgba(239,68,97,0.06)";
  const accentBorder = isLong ? "rgba(212,165,116,0.15)" : "rgba(239,68,97,0.15)";
  const accentGlow = isLong ? "rgba(212,165,116,0.04)" : "rgba(239,68,97,0.04)";

  const levColor = leverageColor(clampedLev, effectiveMaxLev);
  const sliderPct = effectiveMaxLev > 1 ? ((clampedLev - 1) / (effectiveMaxLev - 1)) * 100 : 0;

  const venueLabel = effectiveVenue === "aster" ? "Aster" : "Hyperliquid";

  const sectionStyle: React.CSSProperties = {
    background: "#0E1014", borderRadius: 16, border: "1px solid #1A1D24", padding: "16px 18px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.025)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10, color: "#555B6A", fontFamily: SANS, letterSpacing: "0.02em",
  };

  const metricLabel: React.CSSProperties = {
    fontSize: 9, color: "#555B6A", fontFamily: MONO,
  };

  const metricValue: React.CSSProperties = {
    fontSize: 9, fontWeight: 600, color: "#9BA4AE", fontFamily: MONO,
  };

  return (
    <div data-testid="perps-swap-content" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <style>{`
        .perps-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 2px;
          border-radius: 1px;
          outline: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .perps-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #E6EDF3;
          border: 2px solid ${levColor};
          box-shadow: 0 0 8px ${levColor}44, 0 1px 4px rgba(0,0,0,0.4);
          cursor: grab;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .perps-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          box-shadow: 0 0 14px ${levColor}66, 0 1px 6px rgba(0,0,0,0.5);
        }
        .perps-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #E6EDF3;
          border: 2px solid ${levColor};
          box-shadow: 0 0 8px ${levColor}44, 0 1px 4px rgba(0,0,0,0.4);
          cursor: grab;
        }
        .perps-side-btn {
          transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
        }
        .perps-side-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      <div data-testid="direction-toggle" style={{
        display: "flex", gap: 0,
        background: "#0E1014", borderRadius: 14, border: "1px solid #1A1D24",
        boxShadow: "0 4px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.025)",
        overflow: "hidden",
      }}>
        {/* ── LONG ── */}
        <button
          data-testid="button-long"
          onClick={() => setSide("long")}
          style={{
            flex: 1, height: 60, border: "none",
            background: isLong
              ? "linear-gradient(135deg, rgba(212,165,116,0.22) 0%, rgba(212,165,116,0.09) 100%)"
              : "transparent",
            cursor: "pointer",
            display: "flex", alignItems: "center",
            padding: "0 16px",
            position: "relative", overflow: "hidden",
            transition: "background 0.2s",
            borderRight: "1px solid #1A1D24",
          }}
        >
          {isLong && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(212,165,116,0.7)", pointerEvents: "none" }} />}
          {/* Bullish sparkline watermark */}
          <svg width="90" height="44" viewBox="0 0 90 44" fill="none" aria-hidden="true"
            style={{ position: "absolute", right: -4, top: 8, opacity: isLong ? 0.22 : 0.07, transition: "opacity 0.2s", pointerEvents: "none" }}>
            <polyline points="0,42 14,34 26,38 38,24 52,18 64,12 76,6 90,2"
              stroke={isLong ? "#D4A574" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <polygon points="0,42 14,34 26,38 38,24 52,18 64,12 76,6 90,2 90,44 0,44"
              fill={isLong ? "#D4A574" : "#fff"} opacity="0.25" />
          </svg>
          {/* Content */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, position: "relative", zIndex: 1 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26, borderRadius: 7,
              background: isLong ? "rgba(212,165,116,0.18)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isLong ? "rgba(212,165,116,0.5)" : "rgba(255,255,255,0.08)"}`,
              fontSize: 14, fontWeight: 900, lineHeight: 1,
              fontFamily: "'Noto Serif JP', serif",
              color: isLong ? "#D4A574" : "#3A4050",
              flexShrink: 0, transition: "all 0.2s",
            }}>買</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 800, fontFamily: SANS, color: isLong ? "#F2F2F2" : "#3A4050", letterSpacing: "0.01em", transition: "color 0.2s", lineHeight: 1 }}>Long</span>
              <span style={{ fontSize: 9, fontWeight: 500, fontFamily: SANS, color: isLong ? "rgba(212,165,116,0.7)" : "rgba(255,255,255,0.15)", letterSpacing: "0.06em", lineHeight: 1, textTransform: "uppercase" }}>Buy / 買い</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", position: "relative", zIndex: 1 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 14V4M9 4L5 8M9 4L13 8" stroke={isLong ? "#D4A574" : "#3A4050"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>

        {/* ── SHORT ── */}
        <button
          data-testid="button-short"
          onClick={() => setSide("short")}
          style={{
            flex: 1, height: 60, border: "none",
            background: !isLong
              ? "linear-gradient(135deg, rgba(239,68,97,0.22) 0%, rgba(239,68,97,0.09) 100%)"
              : "transparent",
            cursor: "pointer",
            display: "flex", alignItems: "center",
            padding: "0 16px",
            position: "relative", overflow: "hidden",
            transition: "background 0.2s",
          }}
        >
          {!isLong && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(239,68,97,0.7)", pointerEvents: "none" }} />}
          {/* Bearish sparkline watermark */}
          <svg width="90" height="44" viewBox="0 0 90 44" fill="none" aria-hidden="true"
            style={{ position: "absolute", right: -4, top: 8, opacity: !isLong ? 0.22 : 0.07, transition: "opacity 0.2s", pointerEvents: "none" }}>
            <polyline points="0,2 14,8 26,6 38,16 52,22 64,30 76,36 90,42"
              stroke={!isLong ? "#ef4461" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <polygon points="0,2 14,8 26,6 38,16 52,22 64,30 76,36 90,42 90,44 0,44"
              fill={!isLong ? "#ef4461" : "#fff"} opacity="0.25" />
          </svg>
          {/* Content */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, position: "relative", zIndex: 1 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26, borderRadius: 7,
              background: !isLong ? "rgba(239,68,97,0.18)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${!isLong ? "rgba(239,68,97,0.5)" : "rgba(255,255,255,0.08)"}`,
              fontSize: 14, fontWeight: 900, lineHeight: 1,
              fontFamily: "'Noto Serif JP', serif",
              color: !isLong ? "#ef4461" : "#3A4050",
              flexShrink: 0, transition: "all 0.2s",
            }}>売</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 800, fontFamily: SANS, color: !isLong ? "#F2F2F2" : "#3A4050", letterSpacing: "0.01em", transition: "color 0.2s", lineHeight: 1 }}>Short</span>
              <span style={{ fontSize: 9, fontWeight: 500, fontFamily: SANS, color: !isLong ? "rgba(239,68,97,0.7)" : "rgba(255,255,255,0.15)", letterSpacing: "0.06em", lineHeight: 1, textTransform: "uppercase" }}>Sell / 売り</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", position: "relative", zIndex: 1 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 4V14M9 14L5 10M9 14L13 10" stroke={!isLong ? "#ef4461" : "#3A4050"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={labelStyle}>Asset</span>
          <button
            data-testid="button-chart-popup"
            onClick={() => setShowChart(true)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer",
              padding: "2px 6px", borderRadius: 5,
              color: "rgba(255,255,255,0.22)",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.22)"; }}
            title="View chart"
          >
            <LineChart size={11} />
            <span style={{ fontSize: 9, fontFamily: MONO, letterSpacing: "0.04em" }}>chart</span>
          </button>
        </div>
        <button
          data-testid="button-asset-picker"
          onClick={() => { setShowAssetPicker(v => !v); if (showAssetPicker) setPickerSearch(""); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 10px", borderRadius: 8,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer", transition: "border-color 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TokenIcon symbol={asset.sym} size={28} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>
                {asset.sym}<span style={{ color: "#D4A574" }}>{getMaxLevForAsset(asset.sym, collateral, markets)}X</span> <span style={{ fontSize: 11, color: "#6B7280" }}>({effectiveCollateral})</span>
              </div>
              <div style={{ fontSize: 9, color: "#4A5568", fontFamily: MONO }}>{asset.label}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {livePrice > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#C9D1D9", fontFamily: MONO }}>${formatPrice(livePrice)}</div>
                <div style={{ fontSize: 9, color: change24h >= 0 ? "#3D6B5C" : "#7C3A3A", fontFamily: MONO }}>
                  {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                </div>
              </div>
            )}
            <ChevronDown style={{
              width: 14, height: 14, color: "#4A5568",
              transform: showAssetPicker ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }} />
          </div>
        </button>

        {showAssetPicker && (
          <div data-testid="asset-picker-dropdown" style={{
            marginTop: 6, borderRadius: 12,
            background: "#0E1014", border: "1px solid #1A1D24",
          }}>
            {/* Search */}
            <div style={{ padding: "8px 8px 6px", borderBottom: "1px solid #1A1D24", display: "flex", alignItems: "center", gap: 6 }}>
              <Search style={{ width: 12, height: 12, color: "#4A5568", flexShrink: 0 }} />
              <input
                data-testid="input-asset-search"
                type="text"
                placeholder={`Search ${collateral} markets…`}
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                autoFocus
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#C9D1D9", fontSize: 11, fontFamily: MONO,
                  padding: 0,
                }}
              />
              {pickerSearch && (
                <button onClick={() => setPickerSearch("")} style={{ background: "none", border: "none", color: "#4A5568", cursor: "pointer", fontSize: 11, padding: 0, lineHeight: 1 }}>✕</button>
              )}
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {(() => {
                const q = pickerSearch.trim().toLowerCase();
                const filtered = allAssets.filter(a =>
                  !q || a.sym.toLowerCase().includes(q) || a.label.toLowerCase().includes(q)
                );
                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: "16px 10px", textAlign: "center", fontSize: 10, color: "#4A5568", fontFamily: MONO }}>
                      No markets found
                    </div>
                  );
                }
                return filtered.map(a => {
                  const res = resolveSmartVenue(a.sym, collateral, markets);
                  const pk = res.marketSymbol;
                  const p = livePrices[pk]?.price ?? livePrices[a.sym]?.price ?? 0;
                  const ch = livePrices[pk]?.change24h ?? livePrices[a.sym]?.change24h ?? 0;
                  return (
                    <button
                      key={a.sym}
                      data-testid={`asset-option-${a.sym}`}
                      onClick={() => handleSelectAsset(a)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "7px 10px", border: "none",
                        background: asset.sym === a.sym ? "rgba(255,255,255,0.03)" : "transparent",
                        cursor: "pointer", transition: "background 0.1s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = asset.sym === a.sym ? "rgba(255,255,255,0.03)" : "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <TokenIcon symbol={a.sym} size={22} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS, lineHeight: 1.2 }}>
                            {a.sym} <span style={{ fontSize: 9, color: "#D4A574" }}>{res.maxLev}x</span>
                          </div>
                          <div style={{ fontSize: 8, color: "#4A5568", fontFamily: MONO }}>{a.label}</div>
                        </div>
                      </div>
                      {p > 0 && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#C9D1D9", fontFamily: MONO }}>${formatPrice(p)}</div>
                          <div style={{ fontSize: 8, color: ch >= 0 ? "#3D6B5C" : "#7C3A3A", fontFamily: MONO }}>
                            {ch >= 0 ? "+" : ""}{ch.toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={labelStyle}>Leverage</span>
          <span data-testid="text-leverage-value" style={{
            fontSize: 16, fontWeight: 700, color: "#D4A574", fontFamily: MONO,
          }}>
            {clampedLev}x
          </span>
        </div>

        <div style={{ padding: "0 2px", marginBottom: 12 }}>
          <input
            ref={sliderRef}
            data-testid="input-leverage-slider"
            type="range"
            min={1}
            max={effectiveMaxLev}
            step={1}
            value={clampedLev}
            onChange={e => setLeverage(parseInt(e.target.value, 10))}
            className="perps-slider"
            style={{
              background: `linear-gradient(to right, ${levColor} 0%, ${levColor} ${sliderPct}%, #1A1D24 ${sliderPct}%, #1A1D24 100%)`,
            }}
          />
          <div style={{
            display: "flex", justifyContent: "space-between", marginTop: 4,
          }}>
            <span style={{ fontSize: 8, color: "#3A4550", fontFamily: MONO }}>1x</span>
            <span style={{ fontSize: 8, color: "#3A4550", fontFamily: MONO }}>{effectiveMaxLev}x</span>
          </div>
        </div>

      </div>

      <div style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={labelStyle}>Capital</span>
          <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3 }}>
            {([
              { id: "USDC" as Collateral, icon: "/tokens/usdc.webp" },
              { id: "USDT" as Collateral, icon: "/tokens/usdt.png" },
            ]).map(({ id: c, icon }) => {
              const active = collateral === c;
              return (
                <button
                  key={c}
                  data-testid={`collateral-${c}`}
                  onClick={() => setCollateral(c)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 6, border: "none",
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    boxShadow: active ? "0 0 0 1px rgba(255,255,255,0.12)" : "none",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <img src={icon} alt={c} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <span style={{
                    fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: MONO,
                    color: active ? "#E6EDF3" : "#4A5568",
                    letterSpacing: "0.03em",
                  }}>{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            fontSize: 18, color: sizeUsd ? "#9BA4AE" : "#3A4550", fontFamily: MONO, pointerEvents: "none",
            fontWeight: 400,
          }}>$</span>
          <input
            data-testid="input-custom-size"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={sizeUsd}
            onChange={e => setSizeUsd(e.target.value)}
            className="swp-field"
            style={{
              width: "100%", padding: "16px 14px 16px 28px", borderRadius: 10,
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${sizeUsd ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)"}`,
              color: "#E6EDF3", fontSize: 22, fontWeight: 600, fontFamily: MONO,
              outline: "none", transition: "border-color 0.15s",
            }}
          />
        </div>

        {collateralAdjusted && !noMarketAvailable && (
          <div data-testid="text-collateral-adjusted" style={{
            marginTop: 4, padding: "5px 8px", borderRadius: 6,
            background: "rgba(40,160,240,0.03)",
            fontSize: 8, color: "#5A7A9A", fontFamily: MONO, textAlign: "center",
          }}>
            {asset.sym} settles on {venueLabel} in {effectiveCollateral}
          </div>
        )}
      </div>

      {noMarketAvailable && (
        <div data-testid="text-no-market" style={{
          padding: "10px 12px", borderRadius: 8,
          background: "rgba(239,68,97,0.04)", border: "1px solid rgba(239,68,97,0.08)",
          fontSize: 10, color: "#7C3A3A", fontFamily: MONO, textAlign: "center",
        }}>
          {asset.sym} is not available for perpetual trading
        </div>
      )}

      {sizeNum > 0 && livePrice > 0 && !noMarketAvailable && (
        <div data-testid="position-review" style={{
          background: "#0E1014", borderRadius: 16,
          border: `1px solid ${accentBorder}`,
          padding: "10px 12px",
          boxShadow: `0 4px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.025)`,
        }}>
          {/* Title row */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: accentColor, fontFamily: SANS,
            marginBottom: 8, textAlign: "center", letterSpacing: "0.01em",
          }} data-testid="text-outcome">
            {isLong ? "Long" : "Short"} {asset.sym}
          </div>

          {/* 2×2 compact grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", marginBottom: 8 }}>
            {[
              { label: "Entry", value: `$${formatPrice(livePrice)}`, id: "review-entry" },
              { label: "Leverage", value: `${clampedLev}x`, id: "review-lev" },
              { label: "Position", value: `$${formatCompact(positionSize)}`, id: "review-size" },
              { label: "Collateral", value: `$${formatCompact(collateralRequired)} ${effectiveCollateral}`, id: "review-collateral" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 8, color: "#4A5568", fontFamily: MONO }}>{r.label}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#C9D1D9", fontFamily: MONO }} data-testid={r.id}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Liq + Max loss + PnL on one compact row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "5px 7px", borderRadius: 6, background: "rgba(255,255,255,0.02)",
            gap: 8,
          }}>
            {liqPrice > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 8, color: "#4A5568", fontFamily: MONO }}>Liq</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#C9D1D9", fontFamily: MONO }} data-testid="review-liq">
                  ${formatPrice(liqPrice)}
                  <span style={{ fontSize: 8, color: "#4A5568", marginLeft: 4 }}>{moveToLiq.toFixed(1)}% away</span>
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "right" }}>
                <span style={{ fontSize: 8, color: "#4A5568", fontFamily: MONO }}>Max loss</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#C9D1D9", fontFamily: MONO }} data-testid="review-max-loss">${formatCompact(maxLoss)}</span>
              </div>
              {pnlAt2Pct > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "right" }}>
                  <span style={{ fontSize: 8, color: "#4A5568", fontFamily: MONO }}>PnL 2%</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#3D6B5C", fontFamily: MONO }} data-testid="review-pnl-2pct">{isLong ? "+" : "-"}${formatCompact(pnlAt2Pct)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Funding + venue on one line */}
          <div style={{
            marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            {fundingRate !== 0 ? (
              <span style={{ fontSize: 8, color: "#4A5568", fontFamily: MONO }} data-testid="text-funding-note">
                {fundingRate.toFixed(4)}%/8h · {isLong ? (fundingRate > 0 ? "you pay" : "you earn") : (fundingRate > 0 ? "you earn" : "you pay")}
              </span>
            ) : <span />}
            <span style={{ fontSize: 8, color: "#2A3040", fontFamily: MONO }} data-testid="text-venue-attribution">
              via {venueLabel}
            </span>
          </div>
        </div>
      )}

      {!collateralState.sufficient && sizeNum > 0 && isEvmConnected && (
        <div data-testid="insufficient-balance-prompt" style={{
          padding: "10px 12px", borderRadius: 8,
          background: "rgba(233,185,49,0.04)", border: "1px solid rgba(233,185,49,0.10)",
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <AlertTriangle style={{ width: 12, height: 12, color: "#8C7A3D", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 10, color: "#C9D1D9", fontFamily: MONO, fontWeight: 600, marginBottom: 2 }}>
              Insufficient {effectiveCollateral}
            </div>
            <div style={{ fontSize: 9, color: "#5A6070", fontFamily: MONO, lineHeight: 1.5 }}>
              Need ${collateralRequired.toFixed(2)} — balance ${(collateralState.balance ?? 0).toFixed(2)}{" "}
              <button
                data-testid="button-fund-bridge"
                onClick={() => {
                  const el = document.querySelector('[data-testid="tab-swap"]') as HTMLElement;
                  el?.click();
                }}
                style={{
                  background: "none", border: "none", color: "#8C7A3D",
                  fontSize: 9, fontFamily: MONO, cursor: "pointer", textDecoration: "underline",
                  padding: 0,
                }}
              >
                Bridge funds
              </button>
            </div>
          </div>
        </div>
      )}

      {txState === "error" && txMsg && (
        <div data-testid="text-trade-error" style={{
          padding: "8px 10px", borderRadius: 6,
          background: "rgba(239,68,97,0.05)", border: "1px solid rgba(239,68,97,0.10)",
          fontSize: 10, color: "#7C3A3A", fontFamily: MONO, textAlign: "center",
        }}>
          {txMsg}
        </div>
      )}

      {txState === "signing" && (
        <div data-testid="text-trade-signing" style={{
          padding: "8px 10px", borderRadius: 6,
          background: "rgba(40,160,240,0.04)", border: "1px solid rgba(40,160,240,0.08)",
          fontSize: 10, color: "#5A7A9A", fontFamily: MONO, textAlign: "center",
        }}>
          {txMsg || "Submitting order..."}
        </div>
      )}

      <button
        data-testid="button-open-position"
        disabled={isEvmConnected && (!canTrade || txState === "signing")}
        onClick={isEvmConnected ? handleTrade : handleConnect}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 10,
          border: `1px solid ${!isEvmConnected ? "rgba(40,160,240,0.12)" : canTrade ? accentBorder : "rgba(255,255,255,0.04)"}`,
          background: !isEvmConnected
            ? "rgba(40,160,240,0.06)"
            : txState === "signing"
              ? "rgba(255,255,255,0.02)"
              : canTrade
                ? accentDim
                : "rgba(255,255,255,0.02)",
          color: !isEvmConnected
            ? "#5A7A9A"
            : txState === "signing"
              ? "#4A5568"
              : canTrade
                ? accentColor
                : "#3A4550",
          fontSize: 14, fontWeight: 700, fontFamily: SANS,
          cursor: isEvmConnected && (!canTrade || txState === "signing") ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          letterSpacing: "0.01em",
        }}
      >
        {!isEvmConnected
          ? "Connect Wallet"
          : txState === "signing"
            ? "Opening Position..."
            : sizeNum <= 0
              ? "Enter amount"
              : !collateralState.sufficient
                ? `Insufficient ${effectiveCollateral}`
                : "Open Position"
        }
      </button>

      {celebTrade && (
        <TradeSuccessOverlay trade={celebTrade} onDismiss={handleDismissCeleb} />
      )}

      {/* Chart popup modal */}
      {showChart && (
        <div
          data-testid="chart-popup-overlay"
          onClick={() => setShowChart(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 900,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            padding: 0,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              height: "72vh",
              background: "#0E0E10",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              border: "1px solid rgba(255,255,255,0.07)",
              borderBottom: "none",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 -12px 48px rgba(0,0,0,0.7)",
            }}
          >
            {/* Handle bar */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
              <div style={{ width: 36, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
            </div>

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "4px 18px 10px",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F0F2F5", fontFamily: SANS }}>
                  {asset.sym}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: MONO }}>perpetual</span>
                {livePrice > 0 && (
                  <>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#C9D1D9", fontFamily: MONO }}>
                      ${formatPrice(livePrice)}
                    </span>
                    <span style={{
                      fontSize: 10, fontFamily: MONO,
                      color: change24h >= 0 ? "#3D9B6B" : "#C04040",
                    }}>
                      {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowChart(false)}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "50%", width: 28, height: 28,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "rgba(255,255,255,0.4)",
                }}
              >
                <X size={12} />
              </button>
            </div>

            {/* TradingView chart — stock perps use real exchange feed, crypto uses Hyperliquid */}
            <iframe
              src={(() => {
                const s = asset.sym.toUpperCase();
                const NASDAQ_STOCKS = new Set(["TSLA","NVDA","AAPL","GOOGL","AMZN","META","MSFT",
                  "COIN","HOOD","PLTR","INTC","MU","NFLX","AMD","RIVN","MSTR","CRWV","SNDK",
                  "DKNG","COST","QQQ"]);
                const NYSE_STOCKS = new Set(["TSM","BABA","ORCL","DASH","CRCL","HIMS","LLY"]);
                const AMEX_ETFS = new Set(["EWY","EWJ","KWEB","USAR","URNM","SPY","IWM"]);
                // Commodities: ISO metal codes + common word names → TVC feed
                const TVC_COMMODITIES: Record<string, string> = {
                  XAU: "TVC:GOLD", GOLD: "TVC:GOLD",
                  XAG: "TVC:SILVER", SILVER: "TVC:SILVER",
                  XPT: "TVC:PLATINUM", PLATINUM: "TVC:PLATINUM",
                  XPD: "TVC:PALLADIUM", PALLADIUM: "TVC:PALLADIUM",
                  XCU: "TVC:COPPER", COPPER: "TVC:COPPER",
                  CL: "NYMEX:CL1!", WTI: "TVC:USOIL", OIL: "TVC:USOIL", USOIL: "TVC:USOIL",
                  BRENTOIL: "TVC:UKOIL", NATGAS: "TVC:NATURALGAS",
                };
                let tvSym: string;
                if (TVC_COMMODITIES[s]) tvSym = TVC_COMMODITIES[s];
                else if (NASDAQ_STOCKS.has(s)) tvSym = `NASDAQ:${s}`;
                else if (NYSE_STOCKS.has(s)) tvSym = `NYSE:${s}`;
                else if (AMEX_ETFS.has(s)) tvSym = `AMEX:${s}`;
                else tvSym = `HYPERLIQUID:${s}USDC`;
                const enc = encodeURIComponent(tvSym);
                return `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${enc}&interval=60&hide_top_toolbar=0&save_image=0&theme=dark&style=1&locale=en&allow_symbol_change=0&calendar=0&news=0&studies=%5B%5D&show_popup_button=0&popup_width=0&popup_height=0`;
              })()}
              style={{ flex: 1, width: "100%", border: "none", display: "block" }}
              title={`${asset.sym} perpetual chart`}
              allow="clipboard-write"
            />
          </div>
        </div>
      )}
    </div>
  );
}
