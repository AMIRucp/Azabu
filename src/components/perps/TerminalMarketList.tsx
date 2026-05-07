"use client";
import { useState, useMemo, useEffect, memo } from "react";
import TokenIcon from "@/components/shared/TokenIcon";
import FavoriteStar from "@/components/shared/FavoriteStar";
import { fmtPrice, fmtCompact, fmtFunding, fmtChange } from "@/utils/marketFormatters";
import { useMarketList, CATEGORIES, type CategoryFilter, type CollateralFilter, type SortKey } from "@/hooks/useMarketList";
import { getDedupId } from "@/services/marketDeduplicator";
import type { UnifiedMarket } from "@/types/market";
import type { Protocol } from "@/config/protocolRegistry";
import { PROTOCOLS } from "@/config/protocolRegistry";
import useMarketStore from "@/stores/useMarketStore";
import { T, mono } from "./terminalTheme";

const sans = "'Inter', -apple-system, sans-serif";

const COLLATERAL_ICON: Record<string, string> = {
  USDC: "/tokens/usdc.webp",
  USDT: "/tokens/usdt.png",
};

function getCollaterals(primary: UnifiedMarket, alternatives: UnifiedMarket[]): string[] {
  const quotes = [primary, ...alternatives].map(m => (m.quoteAsset || "USDC").toUpperCase());
  return [...new Set(quotes)].filter(q => COLLATERAL_ICON[q]);
}

type TabType = "Perpetuals" | "Favorites";

const CHAIN_BADGE: Record<string, { label: string; color: string; icon?: string }> = {
  solana: { label: "SOL", color: "#9945FF" },
  hyperliquid: { label: "HL", color: "#33FF88", icon: "/tokens/hyperliquid.webp" },
  lighter: { label: "LTR", color: "#6366F1" },
};

function ProtocolBadge({ protocol }: { protocol: Protocol }) {
  const cfg = PROTOCOLS[protocol];
  const chain = CHAIN_BADGE[cfg.chain] || { label: cfg.chain.toUpperCase(), color: cfg.color };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 2,
      fontSize: 8, fontWeight: 700, fontFamily: mono,
      color: chain.color, background: `${chain.color}14`,
      padding: "1px 4px", borderRadius: 3, lineHeight: "14px",
      letterSpacing: "0.04em", textTransform: "uppercase",
    }} data-testid={`badge-chain-${cfg.chain}`}>
      {chain.icon ? <img src={chain.icon} alt={chain.label} style={{ width: 10, height: 10, borderRadius: "50%" }} /> : chain.label}
    </span>
  );
}

interface TerminalMarketListProps {
  chain: "arbitrum" | "hyperliquid" | "lighter";
  selectedSymbol: string;
  onSelect: (symbol: string, protocol?: string, meta?: { category?: string; baseAsset?: string; assetId?: number }) => void;
  livePrices?: Record<string, { price: number; change24h: number; vol24h?: number; openInterest?: number; fundingRate?: number }>;
  unifiedMarkets?: UnifiedMarket[];
}

function TerminalMarketListInner({ chain, selectedSymbol, onSelect, livePrices, unifiedMarkets }: TerminalMarketListProps) {
  const [tab, setTab] = useState<TabType>("Perpetuals");
  const storeMarkets = useMarketStore((s) => s.markets);
  const storeHasLoaded = useMarketStore((s) => s.hasLoaded);

  const markets = (unifiedMarkets && unifiedMarkets.length > 0) ? unifiedMarkets : storeMarkets;
  const loading = !storeHasLoaded && markets.length === 0;

  const {
    search, setSearch,
    category, setCategory,
    collateralFilter, setCollateralFilter,
    sortKey, sortAsc, handleSort,
    favorites, toggleFav,
    kbIdx, setKbIdx,
    sorted,
    deduplicated,
    handleKeyDown,
  } = useMarketList({
    allMarkets: markets,
    livePrices,
    typeFilter: "all",
    defaultSortKey: "volume",
    defaultCategory: "All",
  });

  useEffect(() => {
    setCollateralFilter("all");
  }, [chain, setCollateralFilter]);

  const visibleSorted = useMemo(() => {
    if (tab === "Favorites") {
      return deduplicated.filter(d => favorites.has(getDedupId(d)));
    }
    return sorted;
  }, [sorted, deduplicated, tab, favorites]);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortAsc ? " \u25B2" : " \u25BC";
  };

  return (
    <div style={{ background: T.bg, height: "100%", display: "flex", flexDirection: "column" }} data-testid="market-list-panel">
      {/* Search + tab toggle — single row */}
      <div style={{ padding: "8px 10px 0", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center",
          background: T.bgEl, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "0 8px", gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            data-testid="market-search-input"
            value={search}
            onChange={e => { setSearch(e.target.value); setKbIdx(-1); }}
            onKeyDown={e => handleKeyDown(e, onSelect)}
            placeholder="Search markets"
            spellCheck={false}
            style={{
              flex: 1, padding: "7px 0", background: "transparent", border: "none",
              color: T.text, fontSize: 11, fontFamily: sans, outline: "none",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}
              data-testid="market-search-clear"
            >
              ×
            </button>
          )}
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
          {(["Perpetuals", "Favorites"] as TabType[]).map(t => (
            <button
              key={t}
              data-testid={`market-tab-${t.toLowerCase()}`}
              onClick={() => setTab(t)}
              style={{
                padding: "2px 6px", border: "none",
                borderRadius: 5,
                background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
                color: tab === t ? T.text : T.text3,
                fontSize: 10, fontWeight: tab === t ? 600 : 400,
                cursor: "pointer", fontFamily: sans, flexShrink: 0,
              }}
            >
              {t === "Favorites" ? "★" : "Perps"}
            </button>
          ))}
        </div>
      </div>

      {/* Collateral toggles + Category pills — single combined row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        padding: "5px 10px 4px",
        borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{
          display: "inline-flex", flexShrink: 0, gap: 1,
          paddingRight: 7, borderRight: "1px solid rgba(255,255,255,0.06)", marginRight: 6,
        }}>
          {([
            { id: "all" as CollateralFilter, label: "ALL", icon: null },
            { id: "USDC" as CollateralFilter, label: "USDC", icon: "/tokens/usdc.webp" },
            { id: "USDT" as CollateralFilter, label: "USDT", icon: "/tokens/usdt.png" },
          ]).map(({ id, label, icon }) => {
            const active = collateralFilter === id;
            return (
              <button
                key={id}
                data-testid={`collateral-filter-${id.toLowerCase()}`}
                onClick={() => setCollateralFilter(id)}
                style={{
                  width: 24, height: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid transparent", cursor: "pointer",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  borderRadius: 5, transition: "all 0.12s",
                }}
              >
                {icon ? (
                  <img src={icon} alt={label} style={{ width: 13, height: 13, borderRadius: "50%", opacity: active ? 1 : 0.4 }} />
                ) : (
                  <span style={{ fontSize: 7, fontWeight: 700, color: active ? "#D4A574" : T.text3, fontFamily: mono }}>{label}</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none", flex: 1, minWidth: 0 }}>
          {CATEGORIES.filter(f => f !== "Favorites").map(f => (
            <button
              key={f}
              data-testid={`market-filter-${f.toLowerCase()}`}
              onClick={() => setCategory(f)}
              style={{
                padding: "2px 7px", border: "none",
                borderRadius: 8,
                background: category === f ? "rgba(255,255,255,0.08)" : "transparent",
                color: category === f ? T.text : T.text3,
                fontSize: 10, fontWeight: category === f ? 600 : 400, cursor: "pointer",
                fontFamily: sans, whiteSpace: "nowrap", flexShrink: 0,
                transition: "background 0.12s, color 0.12s",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 12px 4px", borderBottom: `1px solid ${T.borderSub}`, flexShrink: 0,
      }}>
        <button onClick={() => handleSort("alpha")} style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontSize: 9, color: sortKey === "alpha" ? T.text2 : T.text3,
          fontFamily: mono, fontWeight: 500,
        }} data-testid="sort-symbol">
          Symbol{sortIcon("alpha")}
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => handleSort("leverage")} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 9, color: sortKey === "leverage" ? T.orange : T.text3,
            fontFamily: mono, fontWeight: 500, width: 36, textAlign: "right",
          }} data-testid="sort-leverage">
            Lev{sortIcon("leverage")}
          </button>
          <button onClick={() => handleSort("funding")} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 9, color: sortKey === "funding" ? T.text2 : T.text3,
            fontFamily: mono, fontWeight: 500, width: 52, textAlign: "right",
          }} data-testid="sort-funding">
            Funding{sortIcon("funding")}
          </button>
          <button onClick={() => handleSort("volume")} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 9, color: sortKey === "volume" ? T.text2 : T.text3,
            fontFamily: mono, fontWeight: 500, width: 56, textAlign: "right",
          }} data-testid="sort-volume">
            Vol{sortIcon("volume")}
          </button>
          <button onClick={() => handleSort("oi")} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 9, color: sortKey === "oi" ? T.text2 : T.text3,
            fontFamily: mono, fontWeight: 500, width: 52, textAlign: "right",
          }} data-testid="sort-oi">
            OI{sortIcon("oi")}
          </button>
          <button onClick={() => handleSort("change")} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: 9, color: sortKey === "change" ? T.text2 : T.text3,
            fontFamily: mono, fontWeight: 500, width: 60, textAlign: "right",
          }} data-testid="sort-change">
            Price{sortIcon("change")}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {loading && visibleSorted.length === 0 && (
          <div data-testid="market-list-skeleton">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 10px 8px 8px", borderBottom: `1px solid ${T.borderSub}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: 'linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  <div>
                    <div style={{ width: 50, height: 11, borderRadius: 3, background: 'linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                    <div style={{ width: 30, height: 9, borderRadius: 3, marginTop: 3, background: 'linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ width: 55, height: 11, borderRadius: 3, background: 'linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  <div style={{ width: 40, height: 11, borderRadius: 3, background: 'linear-gradient(90deg, #1E2329 25%, #252a35 50%, #1E2329 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && visibleSorted.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", fontSize: 11, color: T.text3, fontFamily: sans }} data-testid="market-list-empty">
            {tab === "Favorites" ? "No favorites yet" : "No markets found"}
          </div>
        )}
        {visibleSorted.map((d, idx) => {
          let m = d.primary;
          if (collateralFilter === "USDC") {
            const alt = [d.primary, ...d.alternatives].find(a => (a.quoteAsset || "USDC").toUpperCase() === "USDC");
            if (alt) m = alt;
          } else if (collateralFilter === "USDT") {
            const alt = [d.primary, ...d.alternatives].find(a => (a.quoteAsset || "").toUpperCase() === "USDT");
            if (alt) m = alt;
          }
          const dedupKey = getDedupId(d);
          const isFav = favorites.has(dedupKey);
          const isSelected = selectedSymbol === m.symbol || d.alternatives.some(a => a.symbol === selectedSymbol);
          const isKbHighlighted = idx === kbIdx;
          const staggerDelay = idx < 20 ? `${idx * 0.02}s` : '0s';
          const funding = d.bestFundingRate;

          return (
            <div
              key={dedupKey}
              data-testid={`market-row-${dedupKey}`}
              onClick={() => onSelect(m.symbol, m.protocol, { category: m.category, baseAsset: m.baseAsset, assetId: m.assetId })}
              ref={isKbHighlighted ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 10px 8px 8px", cursor: "pointer",
                borderBottom: `1px solid ${T.borderSub}`,
                borderLeft: isSelected ? "2px solid rgba(212,165,116,0.65)" : "2px solid transparent",
                background: isKbHighlighted ? T.bgHover : isSelected ? "linear-gradient(90deg, rgba(212,165,116,0.07) 0%, transparent 100%)" : "transparent",
                transition: "background 0.08s",
                animation: idx < 20 ? `fadeIn 0.3s ease ${staggerDelay} both` : undefined,
              }}
              onMouseEnter={e => { if (!isSelected && !isKbHighlighted) e.currentTarget.style.background = T.bgHover; }}
              onMouseLeave={e => { if (!isSelected && !isKbHighlighted) e.currentTarget.style.background = isKbHighlighted ? T.bgHover : "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: 1 }}>
                <FavoriteStar
                  active={isFav}
                  onClick={(e) => toggleFav(dedupKey, e)}
                  size="sm"
                  activeColor={T.orange}
                  inactiveColor={T.text3}
                  testId="market-star"
                />
                <TokenIcon symbol={m.baseAsset} size={28} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "nowrap" }}>
                    <span style={{
                      fontWeight: isSelected ? 700 : 600, fontSize: 11, color: isSelected ? "#D4A574" : T.text, fontFamily: sans,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {m.symbol}
                    </span>
                    <ProtocolBadge protocol={m.protocol} />
                    {m.type === "spot" && (
                      <span style={{
                        fontSize: 7, fontWeight: 700, fontFamily: mono,
                        color: "#3B82F6", background: "rgba(59,130,246,0.1)",
                        padding: "1px 3px", borderRadius: 3, lineHeight: "12px",
                        letterSpacing: "0.04em",
                      }}>SPOT</span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: T.text3, marginTop: 1, fontFamily: sans, display: "flex", alignItems: "center", gap: 3 }}>
                    <span>
                      {m.type === "spot"
                        ? `${m.baseAsset}/${m.quoteAsset || "USDC"}`
                        : (m.name && m.name !== m.baseAsset ? m.name : fmtCompact(d.totalVolume24h) + " vol")}
                    </span>
                    {m.type !== "spot" && (() => {
                      const collaterals = getCollaterals(d.primary, d.alternatives);
                      if (collaterals.length === 0) return null;
                      return collaterals.map(c => (
                        <img key={c} src={COLLATERAL_ICON[c]} alt={c} title={c}
                          style={{ width: 9, height: 9, borderRadius: "50%", opacity: 0.65, flexShrink: 0 }} />
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, alignItems: "flex-start", flexShrink: 0 }}>
                <div style={{ textAlign: "right", width: 36 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, fontFamily: mono,
                    color: (m.maxLeverage || 0) >= 100 ? T.orange : T.text2,
                  }}>
                    {m.maxLeverage ? `${m.maxLeverage}x` : "--"}
                  </div>
                </div>
                <div style={{ textAlign: "right", width: 52 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 500, fontFamily: mono,
                    color: funding !== undefined && funding !== 0
                      ? (funding >= 0 ? T.green : T.red)
                      : T.text3,
                  }}>
                    {fmtFunding(funding)}
                  </div>
                </div>
                <div style={{ textAlign: "right", width: 56 }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: T.text2, fontFamily: mono }}>
                    {fmtCompact(d.totalVolume24h)}
                  </div>
                </div>
                <div style={{ textAlign: "right", width: 52 }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: T.text2, fontFamily: mono }}>
                    {d.totalOpenInterest > 0 ? fmtCompact(d.totalOpenInterest) : "--"}
                  </div>
                </div>
                <div style={{ textAlign: "right", width: 60 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                    {m.isMarketOpen === false && (
                      <span style={{ fontSize: 7, color: T.text3, background: 'rgba(255,255,255,0.06)', padding: '1px 3px', borderRadius: 2, fontFamily: mono, fontWeight: 600 }}>CLOSED</span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text, fontFamily: mono, fontVariantNumeric: 'tabular-nums' }}>
                      {m.price > 0 ? fmtPrice(m.price) : "--"}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 500, marginTop: 1,
                    fontFamily: mono, fontVariantNumeric: 'tabular-nums',
                    color: m.change24h >= 0 ? T.green : T.red,
                    transition: 'color 0.3s ease',
                  }}>
                    {m.price > 0 ? fmtChange(m.change24h) : "--"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        padding: "5px 12px", borderTop: `1px solid ${T.border}`,
        fontSize: 10, color: T.text3, fontFamily: mono, textAlign: "center", flexShrink: 0,
      }} data-testid="market-list-count">
        {visibleSorted.length} market{visibleSorted.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default memo(TerminalMarketListInner);
