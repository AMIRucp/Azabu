"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import useMarketStore from "@/stores/useMarketStore";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useTradeExecution } from "@/hooks/useTradeExecution";
import { useCollateralBalance } from "@/hooks/useCollateralBalance";
import TradeSuccessOverlay from "@/components/perps/TradeSuccessOverlay";
import type { CelebrationTrade } from "@/components/perps/TradeSuccessOverlay";
import type { UnifiedMarket } from "@/types/market";
import TokenIcon from "@/components/shared/TokenIcon";
import { DepositModal } from "@/components/DepositModal";
import type { TradeChain } from "@/config/collateralConfig";

const ProtectIcon = ({ size = 14, color = "#D4A574", opacity = 1 }: { size?: number; color?: string; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 20" fill="none" style={{ opacity, flexShrink: 0 }}>
    <path
      d="M9 1L16.5 4V9.5C16.5 14.2 9.5 18.6 9 18.8C8.5 18.6 1.5 14.2 1.5 9.5V4L9 1Z"
      stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
    />
    <path d="M4.2 4.8L4.2 6.2" stroke={color} strokeWidth="0.85" strokeLinecap="round" opacity="0.4" />
    <path d="M13.8 4.8L13.8 6.2" stroke={color} strokeWidth="0.85" strokeLinecap="round" opacity="0.4" />
    <path d="M6.6 9.6V8.4C6.6 7.0 11.4 7.0 11.4 8.4V9.6" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="5.8" y="9.4" width="6.4" height="4.6" rx="1.1" stroke={color} strokeWidth="1.1" />
    <circle cx="9" cy="11.4" r="0.9" fill={color} />
    <path d="M9 12.2V13.2" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
  </svg>
);

const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

type Collateral = "USDC" | "USDT";

interface VenueResolution {
  venue: "aster" | "hyperliquid" | "lighter";
  chain: TradeChain;
  marketSymbol: string;
  maxLev: number;
  market: UnifiedMarket | null;
}

function resolveSmartVenue(sym: string, collateral: Collateral, markets: UnifiedMarket[]): VenueResolution {
  const upperSym = sym.toUpperCase();
  const asterMatch = markets.find(m => m.protocol === "aster" && m.baseAsset.toUpperCase() === upperSym);
  const hlMatch = markets.find(m => m.protocol === "hyperliquid" && m.type === "perp" && m.baseAsset.toUpperCase() === upperSym);
  const lighterMatch = markets.find(m => m.protocol === "lighter" && m.baseAsset.toUpperCase() === upperSym);

  if (collateral === "USDT" && asterMatch) {
    return { venue: "aster", chain: "arbitrum", marketSymbol: asterMatch.symbol, maxLev: asterMatch.maxLeverage ?? 20, market: asterMatch };
  }
  if (collateral === "USDC" && hlMatch) {
    return { venue: "hyperliquid", chain: "hyperliquid", marketSymbol: hlMatch.symbol, maxLev: hlMatch.maxLeverage ?? 20, market: hlMatch };
  }
  if (hlMatch) {
    return { venue: "hyperliquid", chain: "hyperliquid", marketSymbol: hlMatch.symbol, maxLev: hlMatch.maxLeverage ?? 20, market: hlMatch };
  }
  if (asterMatch) {
    return { venue: "aster", chain: "arbitrum", marketSymbol: asterMatch.symbol, maxLev: asterMatch.maxLeverage ?? 20, market: asterMatch };
  }
  if (lighterMatch) {
    return { venue: "lighter", chain: "lighter" as TradeChain, marketSymbol: lighterMatch.symbol, maxLev: lighterMatch.maxLeverage ?? 10, market: lighterMatch };
  }
  return { venue: "hyperliquid", chain: "hyperliquid", marketSymbol: sym, maxLev: 20, market: null };
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 100) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return p.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

interface TopAsset {
  sym: string;
  label: string;
}

function buildAssetsFromMarkets(markets: UnifiedMarket[]): TopAsset[] {
  const seen = new Map<string, TopAsset>();
  for (const m of markets) {
    if (m.type !== "perp") continue;
    const key = m.baseAsset.toUpperCase();
    if (!seen.has(key)) {
      seen.set(key, { sym: m.baseAsset, label: m.name || m.baseAsset });
    }
  }
  return Array.from(seen.values());
}

const FALLBACK_ASSETS: TopAsset[] = [
  { sym: "BTC", label: "Bitcoin" },
  { sym: "ETH", label: "Ethereum" },
  { sym: "SOL", label: "Solana" },
];

const SIZE_PRESETS = [25, 100, 250];


interface SimpleTradeCardProps {
  selectedAsset?: string;
  onAssetChange?: (sym: string) => void;
  onVenueChange?: (venue: string) => void;
}

export default function SimpleTradeCard({ selectedAsset, onAssetChange, onVenueChange }: SimpleTradeCardProps) {
  const { markets, livePrices, startPolling } = useMarketStore();
  const { evmAddress, isEvmConnected, connectEvm } = useEvmWallet();
  const { txState, txMsg, execute, dismiss } = useTradeExecution();

  const allAssets = useMemo(
    () => { const a = buildAssetsFromMarkets(markets); return a.length > 0 ? a : FALLBACK_ASSETS; },
    [markets]
  );

  const [assetSym, setAssetSym] = useState<string>(() => {
    if (selectedAsset) return selectedAsset;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("afx_perps_asset");
      if (stored) return stored;
    }
    return "BTC";
  });

  const [collateral, setCollateral] = useState<Collateral>("USDC");
  const [side, setSide] = useState<"long" | "short">("long");
  const [sizeUsd, setSizeUsd] = useState<string>("");
  const [leverage, setLeverage] = useState(5);
  const [protectOpen, setProtectOpen] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(true);
  const [slEnabled, setSlEnabled] = useState(true);
  const [tpPercent, setTpPercent] = useState(50);
  const [slPercent, setSlPercent] = useState(25);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [celebTrade, setCelebTrade] = useState<CelebrationTrade | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  useEffect(() => {
    if (selectedAsset) setAssetSym(selectedAsset);
  }, [selectedAsset]);

  useEffect(() => {
    localStorage.setItem("afx_perps_asset", assetSym);
    onAssetChange?.(assetSym);
  }, [assetSym, onAssetChange]);

  useEffect(() => {
    const cleanup = startPolling();
    return cleanup;
  }, [startPolling]);

  const venueResolution = useMemo(
    () => resolveSmartVenue(assetSym, collateral, markets),
    [assetSym, collateral, markets]
  );
  const { venue, chain, marketSymbol, maxLev, market: resolvedMarket } = venueResolution;

  useEffect(() => {
    onVenueChange?.(venue);
  }, [venue, onVenueChange]);

  const effectiveLeverage = useMemo(
    () => Math.max(1, Math.min(leverage, maxLev)),
    [leverage, maxLev]
  );

  useEffect(() => {
    setLeverage(prev => Math.min(prev, maxLev));
  }, [maxLev]);

  const livePrice = livePrices[marketSymbol]?.price ?? 0;
  const change24h = livePrices[marketSymbol]?.change24h ?? 0;

  const sizeNum = parseFloat(sizeUsd) || 0;
  const collateralRequired = effectiveLeverage > 0 ? sizeNum / effectiveLeverage : sizeNum;
  const assetQty = livePrice > 0 ? sizeNum / livePrice : 0;
  const positionSize = sizeNum;

  const collateralState = useCollateralBalance(chain, collateralRequired);
  const { balance, deficit, loading: balLoading, token: collateralToken, chainLabel: collateralChainLabel, evmConnected } = collateralState;

  const liqDistPct = effectiveLeverage > 0 ? (1 / effectiveLeverage) * 100 * 0.95 : 0;

  const tpPriceTarget = livePrice > 0 ? livePrice * (side === "long" ? (1 + tpPercent / 100) : (1 - tpPercent / 100)) : 0;
  const slPriceTarget = livePrice > 0 ? livePrice * (side === "long" ? (1 - slPercent / 100) : (1 + slPercent / 100)) : 0;

  const potentialProfit = sizeNum > 0 && tpEnabled ? sizeNum * (tpPercent / 100) : 0;
  const moveForProfit = tpPercent;
  const moveToLiq = liqDistPct;

  const venueLabel = venue === "aster" ? "Aster" : "Hyperliquid";
  const isLong = side === "long";
  const accentColor = isLong ? "#22C55E" : "#EF4444";
  const accentDim = isLong ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)";
  const accentBorder = isLong ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";

  const needsFunding = isEvmConnected && sizeNum > 0 && deficit > 0;
  const canTrade = isEvmConnected && sizeNum > 0 && livePrice > 0 && !needsFunding;

  const filteredAssets = useMemo(() => {
    if (!pickerSearch) return allAssets;
    const q = pickerSearch.toLowerCase();
    return allAssets.filter(a => a.sym.toLowerCase().includes(q) || a.label.toLowerCase().includes(q));
  }, [allAssets, pickerSearch]);

  const handleSelectAsset = useCallback((sym: string) => {
    setAssetSym(sym);
    setShowAssetPicker(false);
    setPickerSearch("");
  }, []);

  const handleTrade = useCallback(async () => {
    if (!canTrade) return;

    const tpPrice = tpEnabled && tpPriceTarget > 0 ? tpPriceTarget.toFixed(2) : "";
    const slPrice = slEnabled && slPriceTarget > 0 ? slPriceTarget.toFixed(2) : "";

    const marketInfo = {
      sym: assetSym,
      price: livePrice,
      maxLev,
      marketName: marketSymbol,
      category: "crypto",
    };

    await execute({
      chain: chain === "hyperliquid" ? "hyperliquid" : "arbitrum",
      market: marketInfo,
      side,
      sizeNum: assetQty,
      posValue: positionSize,
      lev: effectiveLeverage,
      otype: "market",
      price: livePrice.toString(),
      maxLev,
      marketSymbol,
      collateral: collateralRequired,
      tp: tpPrice,
      sl: slPrice,
      hiddenOrder: false,
      asterUserId: evmAddress || undefined,
      onTradeSuccess: () => {
        setCelebTrade({
          side,
          sym: assetSym,
          lev: effectiveLeverage,
          posValue: positionSize,
          entryPrice: livePrice,
        });
        setSizeUsd("");
      },
    });
  }, [canTrade, assetSym, livePrice, maxLev, marketSymbol, chain, side, assetQty, positionSize, effectiveLeverage, collateralRequired, tpEnabled, slEnabled, tpPriceTarget, slPriceTarget, evmAddress, execute]);

  const sectionStyle: React.CSSProperties = {
    background: "#0C0D10",
    borderRadius: 14,
    border: "1px solid #1A1D24",
    padding: "14px 16px",
  };

  const currentAsset = allAssets.find(a => a.sym.toUpperCase() === assetSym.toUpperCase()) || { sym: assetSym, label: assetSym };

  return (
    <div data-testid="simple-trade-card" style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: SANS }}>
      <style>{`
        .simple-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 2px;
          background: #1A1D24;
          outline: none;
          cursor: pointer;
        }
        .simple-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #E6EDF3;
          border: 2px solid #D4A574;
          cursor: grab;
          box-shadow: 0 0 6px rgba(212,165,116,0.35);
          transition: box-shadow 0.2s;
        }
        .simple-slider::-webkit-slider-thumb:active {
          box-shadow: 0 0 12px rgba(212,165,116,0.6);
        }
        .simple-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #E6EDF3;
          border: 2px solid #D4A574;
          cursor: grab;
        }
        .protect-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 2px;
          border-radius: 1px;
          background: #1A1D24;
          outline: none;
          cursor: pointer;
        }
        .protect-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #E6EDF3;
          cursor: grab;
          border: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.06);
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .protect-slider::-webkit-slider-thumb:active {
          transform: scale(1.2);
        }
        .protect-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #E6EDF3;
          cursor: grab;
          border: none;
        }
      `}</style>

      {/* Asset Picker Row */}
      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            data-testid="simple-asset-picker-trigger"
            onClick={() => setShowAssetPicker(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "8px 12px", cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <TokenIcon symbol={currentAsset.sym} size={26} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#D4A574" }}>{currentAsset.sym}</div>
              <div style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO }}>Perpetual</div>
            </div>
            <ChevronDown size={14} style={{ color: "#6B7280", transform: showAssetPicker ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          <div style={{ textAlign: "right" }}>
            {livePrice > 0 ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#E6EDF3", fontFamily: MONO }}>${formatPrice(livePrice)}</div>
                <div style={{ fontSize: 11, color: change24h >= 0 ? "#22C55E" : "#EF4444", fontFamily: MONO }}>
                  {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#3A4050" }}>Loading...</div>
            )}
          </div>
        </div>

        {/* Asset Picker Dropdown */}
        {showAssetPicker && (
          <div style={{
            marginTop: 10, background: "#0A0B0E", border: "1px solid #1A1D24",
            borderRadius: 10, overflow: "hidden",
          }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #1A1D24" }}>
              <input
                data-testid="simple-asset-search"
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder={`Search ${collateral} markets...`}
                style={{
                  width: "100%", background: "transparent", border: "none", outline: "none",
                  color: "#E6EDF3", fontSize: 13, fontFamily: SANS,
                }}
              />
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto", padding: "4px 0" }}>
              {filteredAssets.slice(0, 30).map(a => {
                const res = resolveSmartVenue(a.sym, collateral, markets);
                const venueShort = res.venue === "aster" ? "Aster" : "Hyperliquid";
                const isSelected = a.sym.toUpperCase() === assetSym.toUpperCase();
                return (
                  <button
                    key={a.sym}
                    data-testid={`simple-asset-option-${a.sym}`}
                    onClick={() => handleSelectAsset(a.sym)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "8px 12px", border: "none",
                      background: isSelected ? "rgba(212,165,116,0.08)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <TokenIcon symbol={a.sym} size={20} />
                    <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: isSelected ? "#D4A574" : "#E6EDF3", fontWeight: isSelected ? 700 : 600 }}>{a.sym}</div>
                      <div style={{ fontSize: 10, color: "#6B7280" }}>{a.label}</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "#4A5568", fontFamily: MONO }}>{venueShort}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#D4A574", fontFamily: MONO }}>{res.maxLev}x</span>
                      {isSelected && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#D4A574", marginLeft: 2 }} />}
                    </div>
                  </button>
                );
              })}
              {filteredAssets.length === 0 && (
                <div style={{ padding: "16px 12px", textAlign: "center", color: "#3A4050", fontSize: 12 }}>No markets found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Direction Toggle */}
      <div style={{
        display: "flex", borderRadius: 14, overflow: "hidden",
        border: "1px solid #1A1D24",
      }}>
        <button
          data-testid="simple-button-long"
          onClick={() => setSide("long")}
          style={{
            flex: 1, padding: "14px 0", border: "none", cursor: "pointer",
            background: isLong
              ? "linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.08) 100%)"
              : "#0C0D10",
            borderRight: "1px solid #1A1D24",
            position: "relative", overflow: "hidden",
            transition: "background 0.2s",
          }}
        >
          {isLong && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#22C55E" }} />}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5" stroke={isLong ? "#22C55E" : "#3A4050"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 800, color: isLong ? "#F0F0F0" : "#3A4050", letterSpacing: "0.02em" }}>Long</span>
          </div>
        </button>

        <button
          data-testid="simple-button-short"
          onClick={() => setSide("short")}
          style={{
            flex: 1, padding: "14px 0", border: "none", cursor: "pointer",
            background: !isLong
              ? "linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.08) 100%)"
              : "#0C0D10",
            position: "relative", overflow: "hidden",
            transition: "background 0.2s",
          }}
        >
          {!isLong && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#EF4444" }} />}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3V11M7 11L3.5 7.5M7 11L10.5 7.5" stroke={!isLong ? "#EF4444" : "#3A4050"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 800, color: !isLong ? "#F0F0F0" : "#3A4050", letterSpacing: "0.02em" }}>Short</span>
          </div>
        </button>
      </div>

      {/* Amount Input — swap-style with collateral token inline */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 10, color: "#555B6A", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: MONO }}>Amount</div>
        <div style={{
          display: "flex", alignItems: "center",
          background: "rgba(255,255,255,0.025)", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "4px 4px 4px 12px",
          marginBottom: 10,
        }}>
          <input
            data-testid="simple-size-input"
            type="number"
            inputMode="decimal"
            value={sizeUsd}
            onChange={e => setSizeUsd(e.target.value)}
            placeholder="0.00"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 22, fontWeight: 700, color: "#E6EDF3", fontFamily: MONO,
              minWidth: 0,
            }}
          />
          {/* Collateral token pill — inline toggle */}
          <div style={{ display: "flex", background: "#0C0D10", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", padding: 3, gap: 2, flexShrink: 0 }}>
            {([
              { id: "USDC" as Collateral, icon: "/tokens/usdc.webp" },
              { id: "USDT" as Collateral, icon: "/tokens/usdt.png" },
            ]).map(({ id: c, icon }) => {
              const active = collateral === c;
              return (
                <button
                  key={c}
                  data-testid={`simple-collateral-${c.toLowerCase()}`}
                  onClick={() => setCollateral(c)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 10px", borderRadius: 6, border: "none",
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    boxShadow: active ? "0 0 0 1px rgba(255,255,255,0.1)" : "none",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <img src={icon} alt={c} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <span style={{
                    fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: MONO,
                    color: active ? "#E6EDF3" : "#4A5568", letterSpacing: "0.03em",
                  }}>{c}</span>
                </button>
              );
            })}
          </div>
        </div>
        {sizeNum > 0 && livePrice > 0 && (
          <div style={{ fontSize: 10, color: "#4A5568", fontFamily: MONO, marginBottom: 8 }}>
            ≈ {assetQty.toFixed(4)} {assetSym}
          </div>
        )}
        <div style={{ display: "flex", gap: 5 }}>
          {SIZE_PRESETS.map(preset => (
            <button
              key={preset}
              data-testid={`simple-preset-${preset}`}
              onClick={() => setSizeUsd(String(preset))}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 7, cursor: "pointer",
                background: sizeNum === preset ? "rgba(212,165,116,0.1)" : "rgba(255,255,255,0.03)",
                border: sizeNum === preset ? "1px solid rgba(212,165,116,0.3)" : "1px solid rgba(255,255,255,0.05)",
                color: sizeNum === preset ? "#D4A574" : "#555B6A",
                fontSize: 11, fontWeight: 600, fontFamily: MONO,
                transition: "all 0.12s",
              }}
            >${preset}</button>
          ))}
          <button
            data-testid="simple-preset-max"
            onClick={() => {
              if (balance !== null && balance > 0) {
                setSizeUsd((balance * effectiveLeverage).toFixed(0));
              }
            }}
            style={{
              flex: 1, padding: "7px 0", borderRadius: 7, cursor: "pointer",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "#555B6A",
              fontSize: 11, fontWeight: 600, fontFamily: MONO,
              transition: "all 0.12s",
            }}
          >Max</button>
        </div>
      </div>

      {/* Leverage Slider */}
      {(() => {
        const pct = maxLev > 1 ? ((effectiveLeverage - 1) / (maxLev - 1)) * 100 : 0;
        return (
          <div style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: "#555B6A", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: MONO }}>Leverage</span>
              <span data-testid="simple-leverage-value" style={{ fontSize: 18, fontWeight: 700, color: "#D4A574", fontFamily: MONO }}>{effectiveLeverage}x</span>
            </div>
            <input
              data-testid="simple-leverage-slider"
              type="range"
              min={1}
              max={maxLev || 50}
              step={1}
              value={effectiveLeverage}
              onChange={e => setLeverage(parseInt(e.target.value, 10))}
              className="simple-slider"
              style={{ background: `linear-gradient(to right, #D4A574 0%, #D4A574 ${pct}%, #1A1D24 ${pct}%, #1A1D24 100%)` }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 9, color: "#3A4050", fontFamily: MONO }}>1x</span>
              <span style={{ fontSize: 9, color: "#3A4050", fontFamily: MONO }}>{maxLev || 50}x</span>
            </div>
          </div>
        );
      })()}

      {/* ── Protect Trade — compact trigger row ── */}
      <button
        data-testid="simple-protect-toggle"
        onClick={() => setProtectOpen(true)}
        style={{
          ...sectionStyle,
          padding: "11px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", cursor: "pointer", border: "none", textAlign: "left",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <ProtectIcon size={13} color="#D4A574" opacity={0.75} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#E6EDF3", letterSpacing: "-0.01em" }}>Protect Trade</span>
          {(tpEnabled || slEnabled) && (
            <span style={{ fontSize: 9, color: "rgba(212,165,116,0.5)", fontFamily: MONO }}>
              {tpEnabled ? `TP +${tpPercent}%` : ""}{tpEnabled && slEnabled ? " · " : ""}{slEnabled ? `SL -${slPercent}%` : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 500, color: (tpEnabled || slEnabled) ? "rgba(212,165,116,0.6)" : "rgba(255,255,255,0.2)", fontFamily: MONO }}>
            {tpEnabled || slEnabled ? "ON" : "OFF"}
          </span>
          <ChevronUp size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
        </div>
      </button>

      {/* ── Protect Trade — slide-up bottom sheet ── */}
      {protectOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setProtectOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 500,
              background: "rgba(0,0,0,0.60)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              animation: "fadeIn 0.2s ease",
            }}
          />
          {/* Sheet */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 501,
            background: "#0A0C10",
            borderTop: "1px solid rgba(212,165,116,0.12)",
            borderRadius: "16px 16px 0 0",
            padding: "0 0 calc(28px + env(safe-area-inset-bottom, 0px))",
            boxShadow: "0 -24px 80px rgba(0,0,0,0.8)",
            animation: "slideUp 0.26s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}>
            <style>{`
              @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
              @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
            `}</style>

            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.10)" }} />
            </div>

            {/* Sheet header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 18px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ProtectIcon size={15} color="#D4A574" opacity={0.85} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#E6EDF3", letterSpacing: "-0.01em" }}>Protect Trade</span>
              </div>
              <button
                onClick={() => setProtectOpen(false)}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "rgba(255,255,255,0.35)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* TP / SL controls */}
            <div style={{ padding: "18px 18px 0", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Take Profit */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: tpEnabled ? "rgba(74,222,128,0.8)" : "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: MONO }}>Take Profit</span>
                    <span data-testid="simple-tp-value" style={{ fontSize: 16, fontWeight: 700, color: tpEnabled ? "#4ADE80" : "rgba(255,255,255,0.15)", fontFamily: MONO, letterSpacing: "-0.02em", transition: "color 0.2s" }}>
                      +{tpPercent}%
                    </span>
                    {livePrice > 0 && (
                      <span style={{ fontSize: 11, color: tpEnabled ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)", fontFamily: MONO, transition: "color 0.2s" }}>
                        ${formatPrice(tpPriceTarget)}
                      </span>
                    )}
                  </div>
                  <button
                    data-testid="simple-tp-toggle"
                    onClick={() => setTpEnabled(v => !v)}
                    style={{
                      width: 26, height: 14, borderRadius: 7, cursor: "pointer",
                      border: tpEnabled ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,255,255,0.10)",
                      background: tpEnabled ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)",
                      position: "relative", transition: "all 0.2s", flexShrink: 0,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3, left: tpEnabled ? 13 : 3,
                      width: 6, height: 6, borderRadius: "50%",
                      background: tpEnabled ? "rgba(74,222,128,0.85)" : "rgba(255,255,255,0.2)",
                      transition: "left 0.18s, background 0.2s",
                    }} />
                  </button>
                </div>
                <input
                  data-testid="simple-tp-slider"
                  type="range" min={5} max={200} value={tpPercent}
                  onChange={e => { setTpPercent(parseInt(e.target.value)); if (!tpEnabled) setTpEnabled(true); }}
                  className="protect-slider"
                  style={{
                    background: `linear-gradient(to right, rgba(74,222,128,${tpEnabled ? 0.45 : 0.1}) 0%, rgba(74,222,128,${tpEnabled ? 0.45 : 0.1}) ${((tpPercent - 5) / 195) * 100}%, #1A1D24 ${((tpPercent - 5) / 195) * 100}%, #1A1D24 100%)`,
                    opacity: tpEnabled ? 1 : 0.35,
                    transition: "opacity 0.2s",
                    width: "100%",
                  }}
                />
              </div>

              {/* Separator */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

              {/* Stop Loss */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: slEnabled ? "rgba(248,113,113,0.8)" : "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: MONO }}>Stop Loss</span>
                    <span data-testid="simple-sl-value" style={{ fontSize: 16, fontWeight: 700, color: slEnabled ? "#F87171" : "rgba(255,255,255,0.15)", fontFamily: MONO, letterSpacing: "-0.02em", transition: "color 0.2s" }}>
                      -{slPercent}%
                    </span>
                    {livePrice > 0 && (
                      <span style={{ fontSize: 11, color: slEnabled ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)", fontFamily: MONO, transition: "color 0.2s" }}>
                        ${formatPrice(slPriceTarget)}
                      </span>
                    )}
                  </div>
                  <button
                    data-testid="simple-sl-toggle"
                    onClick={() => setSlEnabled(v => !v)}
                    style={{
                      width: 26, height: 14, borderRadius: 7, cursor: "pointer",
                      border: slEnabled ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(255,255,255,0.10)",
                      background: slEnabled ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.04)",
                      position: "relative", transition: "all 0.2s", flexShrink: 0,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3, left: slEnabled ? 13 : 3,
                      width: 6, height: 6, borderRadius: "50%",
                      background: slEnabled ? "rgba(248,113,113,0.85)" : "rgba(255,255,255,0.2)",
                      transition: "left 0.18s, background 0.2s",
                    }} />
                  </button>
                </div>
                <input
                  data-testid="simple-sl-slider"
                  type="range" min={5} max={90} value={slPercent}
                  onChange={e => { setSlPercent(parseInt(e.target.value)); if (!slEnabled) setSlEnabled(true); }}
                  className="protect-slider"
                  style={{
                    background: `linear-gradient(to right, rgba(248,113,113,${slEnabled ? 0.45 : 0.1}) 0%, rgba(248,113,113,${slEnabled ? 0.45 : 0.1}) ${((slPercent - 5) / 85) * 100}%, #1A1D24 ${((slPercent - 5) / 85) * 100}%, #1A1D24 100%)`,
                    opacity: slEnabled ? 1 : 0.35,
                    transition: "opacity 0.2s",
                    width: "100%",
                  }}
                />
              </div>

              {/* Done button */}
              <button
                onClick={() => setProtectOpen(false)}
                style={{
                  width: "100%", padding: "13px", marginTop: 4,
                  borderRadius: 10,
                  background: "rgba(212,165,116,0.08)",
                  border: "1px solid rgba(212,165,116,0.15)",
                  color: "#E8C4A0", fontSize: 14, fontWeight: 500,
                  letterSpacing: "0.2px", cursor: "pointer",
                  transition: "background 0.15s",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Done
              </button>

            </div>
          </div>
        </>
      )}

      {/* Outcome Summary */}
      {sizeNum > 0 && livePrice > 0 && (
        <div style={{
          ...sectionStyle,
          background: isLong ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
          border: isLong ? "1px solid rgba(34,197,94,0.12)" : "1px solid rgba(239,68,68,0.12)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tpEnabled && potentialProfit > 0 && (
              <div data-testid="simple-outcome-profit" style={{ fontSize: 12, color: "#E6EDF3" }}>
                If <span style={{ fontWeight: 700 }}>{assetSym}</span> {isLong ? "rises" : "falls"}{" "}
                <span style={{ color: "#22C55E", fontWeight: 700 }}>{moveForProfit}%</span>,{" "}
                you earn <span style={{ color: "#22C55E", fontWeight: 700 }}>~${potentialProfit.toFixed(0)}</span>
              </div>
            )}
            <div data-testid="simple-outcome-liq" style={{ fontSize: 12, color: "#E6EDF3" }}>
              Your trade liquidates if <span style={{ fontWeight: 700 }}>{assetSym}</span>{" "}
              {isLong ? "drops" : "rises"}{" "}
              <span style={{ color: "#EF4444", fontWeight: 700 }}>{moveToLiq.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Collateral Warning */}
      {isEvmConnected && sizeNum > 0 && deficit > 0 && !balLoading && (
        <div
          data-testid="simple-fund-banner"
          style={{
            ...sectionStyle,
            background: "rgba(249,115,22,0.06)",
            border: "1px solid rgba(249,115,22,0.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={14} style={{ color: "#F97316", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, color: "#E6EDF3", fontWeight: 600 }}>Fund This Trade</div>
              <div style={{ fontSize: 11, color: "#9BA4AE" }}>
                Need ${deficit.toFixed(2)} more {collateralToken} on {collateralChainLabel}
              </div>
            </div>
          </div>
          <button
            data-testid="simple-fund-button"
            onClick={() => setDepositModalOpen(true)}
            style={{
              width: "100%", padding: "9px 0", borderRadius: 8, cursor: "pointer",
              background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)",
              color: "#F97316", fontSize: 12, fontWeight: 700, fontFamily: MONO,
              letterSpacing: "0.04em",
            }}
          >
            Fund Account →
          </button>
        </div>
      )}

      {/* Action Button */}
      <button
        data-testid="simple-trade-button"
        onClick={isEvmConnected ? handleTrade : () => connectEvm()}
        disabled={isEvmConnected && (!canTrade || txState === "signing")}
        style={{
          width: "100%", padding: "16px 0", borderRadius: 14, border: "none", cursor: "pointer",
          background: !isEvmConnected
            ? "rgba(255,255,255,0.06)"
            : !canTrade
              ? `${accentColor}22`
              : `linear-gradient(135deg, ${accentColor}CC 0%, ${accentColor}99 100%)`,
          color: !isEvmConnected ? "#9BA4AE" : !canTrade ? accentColor : "#fff",
          fontSize: 16, fontWeight: 800, fontFamily: SANS, letterSpacing: "0.02em",
          transition: "all 0.15s",
          opacity: (isEvmConnected && txState === "signing") ? 0.6 : 1,
        }}
      >
        {!isEvmConnected
          ? "Connect Wallet"
          : txState === "signing"
            ? "Opening..."
            : isLong
              ? `Open Long ${assetSym}`
              : `Open Short ${assetSym}`
        }
      </button>

      {/* Venue Chip */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
        <span data-testid="simple-venue-chip" style={{ fontSize: 11, color: "#3A4050", fontFamily: MONO }}>
          via {venueLabel}
        </span>
        {sizeNum > 0 && livePrice > 0 && (
          <span style={{ fontSize: 11, color: "#3A4050", fontFamily: MONO }}>
            · Est. fee ${(sizeNum * 0.00035).toFixed(2)}
          </span>
        )}
      </div>

      {/* TX Status */}
      {txState !== "idle" && txState !== "success" && (
        <div
          data-testid="simple-tx-status"
          onClick={dismiss}
          style={{
            padding: "10px 12px", borderRadius: 8, cursor: "pointer",
            background: txState === "error" ? "rgba(239,68,68,0.08)" : "rgba(249,115,22,0.08)",
            border: txState === "error" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(249,115,22,0.2)",
            fontSize: 11, color: "#E6EDF3", fontFamily: MONO,
          }}
        >
          {txMsg || "Processing..."}
        </div>
      )}

      {celebTrade && (
        <TradeSuccessOverlay
          trade={celebTrade}
          onDismiss={() => { setCelebTrade(null); dismiss(); }}
        />
      )}

      <DepositModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        defaultProtocol={venue === "aster" ? "aster" : "hyperliquid"}
      />
    </div>
  );
}
