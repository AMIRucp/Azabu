"use client";
import { useMemo } from "react";
import { Search, ChevronUp, ChevronDown, Flame } from "lucide-react";
import TokenIcon from "@/components/shared/TokenIcon";
import FavoriteStar from "@/components/shared/FavoriteStar";
import { fmtPrice, fmtCompact, fmtChange } from "@/utils/marketFormatters";
import { useMarketList, CATEGORIES, type CategoryFilter, type CollateralFilter, type SortKey } from "@/hooks/useMarketList";
import { getDexBadge, DEX_BADGE_COLORS } from "@/services/hyperliquid/hlCategories";
import { getDedupId } from "@/services/marketDeduplicator";
import type { UnifiedMarket } from "@/types/market";
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

interface MarketBrowserProps {
  allMarkets: UnifiedMarket[];
  livePrices: Record<string, { price: number; change24h: number; vol24h?: number; openInterest?: number; fundingRate?: number }>;
  onSelectMarket: (symbol: string, protocol?: string, meta?: { category?: string; baseAsset?: string }) => void;
  isMobile: boolean;
  activeSym?: string;
}

export default function MarketBrowser({ allMarkets, livePrices, onSelectMarket, isMobile, activeSym }: MarketBrowserProps) {
  const {
    search, setSearch,
    category, setCategory,
    collateralFilter, setCollateralFilter,
    sortKey, sortAsc, handleSort,
    favorites, toggleFav,
    kbIdx, setKbIdx,
    sorted,
    handleKeyDown,
  } = useMarketList({
    allMarkets,
    livePrices,
    typeFilter: "all",
    defaultSortKey: "volume",
  });

  const trendingNow = useMemo(() => {
    if (allMarkets.length === 0) return [];
    const seen = new Set<string>();
    const candidates = allMarkets
      .filter(m => m.type === "perp")
      .map(m => {
        const lp = livePrices[m.symbol];
        return { m, absChange: Math.abs(lp?.change24h ?? m.change24h ?? 0) };
      })
      .sort((a, b) => b.absChange - a.absChange);
    const results: typeof candidates = [];
    for (const c of candidates) {
      const base = c.m.baseAsset?.toUpperCase() || c.m.symbol;
      if (!seen.has(base)) {
        seen.add(base);
        results.push(c);
        if (results.length >= 5) break;
      }
    }
    return results;
  }, [allMarkets, livePrices]);

  const HEADER_ICONS: Record<string, JSX.Element> = {
    market: (
      /* Torii gate — 鳥居 */
      <svg width="13" height="11" viewBox="0 0 13 11" fill="none" style={{ flexShrink: 0 }}>
        <path d="M1 3.5 Q6.5 1 12 3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <line x1="2.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
        <line x1="3.5" y1="5" x2="3.5" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <line x1="9.5" y1="5" x2="9.5" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
    price: (
      /* Coin/price — 円 circle with cross */
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1"/>
        <line x1="3" y1="5.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
        <line x1="5.5" y1="3" x2="5.5" y2="8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      </svg>
    ),
    change: (
      /* Wave/tide — 波 */
      <svg width="14" height="9" viewBox="0 0 14 9" fill="none" style={{ flexShrink: 0 }}>
        <path d="M0.5 6 C2 3 4 1 5.5 4.5 C7 8 9 8 10.5 4.5 C12 1 13 2 13.5 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    volume: (
      /* Mountain — 山 (Fuji-inspired volume bars) */
      <svg width="13" height="11" viewBox="0 0 13 11" fill="none" style={{ flexShrink: 0 }}>
        <line x1="2" y1="10.5" x2="2" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="10.5" x2="5" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="10.5" x2="8" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="11" y1="10.5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    oi: (
      /* Diamond — 菱 */
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
        <path d="M5.5 1 L10 5.5 L5.5 10 L1 5.5 Z" stroke="currentColor" strokeWidth="1" fill="none"/>
        <line x1="5.5" y1="3.5" x2="5.5" y2="7.5" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
  };

  const SortHeader = ({ label, sortId, width, align }: { label: string; sortId: SortKey; width?: number; align?: string }) => {
    const active = sortKey === sortId;
    return (
      <button
        data-testid={`browser-sort-${sortId}`}
        onClick={() => handleSort(sortId)}
        style={{
          background: "none",
          border: "none",
          padding: "0 2px",
          cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 3,
          color: active ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.28)",
          fontSize: 10, fontFamily: mono, fontWeight: 500,
          letterSpacing: "0.06em", textTransform: "uppercase",
          width, justifyContent: align === "left" ? "flex-start" : "flex-end",
          transition: "color 0.15s",
          whiteSpace: "nowrap", flexShrink: 0,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.28)"; }}
      >
        {label}
        {active
          ? (sortAsc
            ? <ChevronUp style={{ width: 9, height: 9, color: "#D4A574", flexShrink: 0 }} />
            : <ChevronDown style={{ width: 9, height: 9, color: "#D4A574", flexShrink: 0 }} />)
          : <ChevronDown style={{ width: 8, height: 8, opacity: 0.2, flexShrink: 0 }} />
        }
      </button>
    );
  };

  return (
    <div data-testid="market-browser" style={{
      background: "#000000", height: "100%", display: "flex", flexDirection: "column",
      fontFamily: mono, color: T.text,
    }}>

      {/* Search */}
      <div style={{ padding: isMobile ? "10px 12px 0" : "10px 16px 0", flexShrink: 0 }}>
        <div style={{
          position: "relative", display: "flex", alignItems: "center",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, padding: "0 12px", gap: 8,
        }}>
          <Search style={{ width: 15, height: 15, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          <input
            data-testid="browser-search"
            value={search}
            onChange={e => { setSearch(e.target.value); setKbIdx(-1); }}
            onKeyDown={e => handleKeyDown(e, onSelectMarket)}
            placeholder="Search markets"
            spellCheck={false}
            style={{
              flex: 1, padding: "8px 0", background: "transparent", border: "none",
              color: T.text, fontSize: 12, fontFamily: sans, outline: "none",
              letterSpacing: "0.01em",
            }}
          />
          {search && (
            <button
              data-testid="browser-search-clear"
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Collateral filter + Category tabs — single combined row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        padding: isMobile ? "6px 12px 0" : "6px 16px 0",
        flexShrink: 0,
      }}>
        {/* Collateral toggles */}
        <div data-testid="collateral-filter" style={{
          display: "inline-flex", flexShrink: 0,
          gap: 1, paddingRight: 8,
          borderRight: "1px solid rgba(255,255,255,0.07)",
          marginRight: 8,
        }}>
          {([
            { id: "all" as CollateralFilter, label: "ALL", icon: null as string | null },
            { id: "USDC" as CollateralFilter, label: "USDC", icon: "/tokens/usdc.webp" },
            { id: "USDT" as CollateralFilter, label: "USDT", icon: "/tokens/usdt.png" },
          ]).map(({ id, label, icon }) => {
            const active = collateralFilter === id;
            return (
              <button
                key={id}
                data-testid={`collateral-filter-${id.toLowerCase()}`}
                onClick={() => {
                  setCollateralFilter(id);
                  if (!CATEGORIES.includes(category)) setCategory("All");
                }}
                style={{
                  width: 26, height: 26,
                  border: "1px solid transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  borderRadius: 6,
                  transition: "all 0.15s",
                }}
              >
                {icon ? (
                  <img
                    src={icon}
                    alt={label}
                    title={label}
                    style={{
                      width: 14, height: 14,
                      borderRadius: "50%",
                      opacity: active ? 1 : 0.4,
                      transition: "opacity 0.15s",
                    }}
                  />
                ) : (
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    color: active ? "#D4A574" : "rgba(255,255,255,0.38)",
                    fontFamily: mono,
                  }}>{label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category tabs — scrollable */}
        <div style={{
          display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none",
          flex: 1, minWidth: 0,
        }}>
          {CATEGORIES.map(f => {
            const active = category === f;
            return (
              <button
                key={f}
                data-testid={`browser-cat-${f.toLowerCase()}`}
                onClick={() => setCategory(f)}
                style={{
                  padding: "3px 8px",
                  border: "none",
                  borderRadius: 10,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? T.text : T.text3,
                  fontSize: 10, fontWeight: active ? 600 : 400, cursor: "pointer",
                  fontFamily: sans, whiteSpace: "nowrap", flexShrink: 0,
                  transition: "background 0.12s, color 0.12s",
                }}
              >
                {f === "Favorites" ? "★" : f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: isMobile ? "5px 12px 4px" : "5px 16px 4px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        marginTop: 6,
        flexShrink: 0, gap: 6,
        background: "rgba(255,255,255,0.015)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SortHeader label="Market" sortId="market" align="left" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!isMobile && <SortHeader label="Vol." sortId="volume" width={72} />}
          {!isMobile && <SortHeader label="OI" sortId="oi" width={72} />}
          <SortHeader label="Price" sortId="price" width={isMobile ? 88 : 100} />
          <SortHeader label="24h %" sortId="change" width={isMobile ? 62 : 70} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>

        {/* Trending strip — lives inside the scroll area, scrolls away naturally */}
        {trendingNow.length > 0 && !search && (
          <div
            data-testid="trending-now-row"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: isMobile ? "6px 12px 6px" : "6px 16px 6px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              overflowX: "auto", scrollbarWidth: "none",
            }}
          >
            <Flame style={{ width: 10, height: 10, color: "#D4A574", flexShrink: 0 }} />
            {trendingNow.map(({ m }) => {
              const lp = livePrices[m.symbol];
              const change = lp?.change24h ?? m.change24h ?? 0;
              const isPos = change >= 0;
              return (
                <button
                  key={m.symbol + m.protocol}
                  data-testid={`trending-chip-${m.baseAsset?.toLowerCase() || m.symbol.toLowerCase()}`}
                  onClick={() => onSelectMarket(m.symbol, m.protocol, { category: m.category, baseAsset: m.baseAsset })}
                  style={{
                    flexShrink: 0,
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 7px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                >
                  <TokenIcon symbol={m.baseAsset} size={13} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.text, fontFamily: mono }}>
                    {m.baseAsset?.replace(/^spot:/, "") || m.symbol}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 500, fontFamily: mono, color: isPos ? T.green : T.red }}>
                    {isPos ? "+" : ""}{change.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {allMarkets.length === 0 && (
          <div data-testid="browser-skeleton">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: isMobile ? "12px 12px" : "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                  <div>
                    <div style={{ width: 60, height: 14, borderRadius: 3, background: T.bgEl }} />
                    <div style={{ width: 80, height: 10, borderRadius: 3, marginTop: 4, background: T.bgEl, opacity: 0.5 }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 70, height: 14, borderRadius: 3, background: T.bgEl }} />
                  <div style={{ width: 50, height: 14, borderRadius: 3, background: T.bgEl }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {allMarkets.length > 0 && sorted.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: T.text3, fontFamily: sans }} data-testid="browser-empty">
            {category === "Favorites" ? "No favorites yet -- star a market to add it" : "No markets found"}
          </div>
        )}
        {sorted.map((d, idx) => {
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
          const isKb = idx === kbIdx;
          const change = m.change24h || 0;
          const isPos = change >= 0;
          const isActive = activeSym ? (
            m.symbol === activeSym ||
            [d.primary, ...d.alternatives].some(a => a.symbol === activeSym)
          ) : false;

          return (
            <div
              key={dedupKey}
              data-testid={`browser-row-${dedupKey}`}
              onClick={() => onSelectMarket(m.symbol, m.protocol, { category: m.category, baseAsset: m.baseAsset })}
              ref={isKb ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
              style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                padding: isMobile ? "10px 12px" : "10px 16px",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                borderLeft: isActive ? "2px solid rgba(212,165,116,0.6)" : "2px solid transparent",
                background: isActive
                  ? "linear-gradient(90deg, rgba(212,165,116,0.06) 0%, transparent 100%)"
                  : isKb ? "rgba(255,255,255,0.04)" : "transparent",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isActive ? "linear-gradient(90deg, rgba(212,165,116,0.06) 0%, transparent 100%)" : isKb ? "rgba(255,255,255,0.04)" : "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <FavoriteStar
                  active={isFav}
                  onClick={(e) => toggleFav(dedupKey, e)}
                  activeColor={T.orange}
                  inactiveColor={T.text3}
                  testId={`browser-fav-${dedupKey}`}
                />
                <TokenIcon symbol={m.baseAsset} size={32} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#D4A574" : T.text, fontFamily: mono }}>
                      {d.normalizedBase.replace(/^spot:/, '').split('/')[0]}
                    </span>
                    {m.type === "spot" && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, fontFamily: mono,
                        color: "#3B82F6", background: "rgba(59,130,246,0.1)",
                        padding: "1px 4px", borderRadius: 3, lineHeight: "14px",
                        letterSpacing: "0.04em",
                      }}>SPOT</span>
                    )}
                    {m.protocol === 'hyperliquid' && (() => {
                      const badge = getDexBadge(m.symbol);
                      const color = DEX_BADGE_COLORS[badge] || '#6F7785';
                      const isCore = badge === 'CORE';
                      return (
                        <span style={{
                          fontSize: 8, fontWeight: 700, color,
                          fontFamily: mono, letterSpacing: '0.05em',
                          background: isCore ? 'transparent' : `${color}15`,
                          border: `1px solid ${isCore ? color : `${color}30`}`,
                          borderRadius: 3, padding: '1px 4px',
                        }}>
                          {badge}
                        </span>
                      );
                    })()}
                    {m.maxLeverage && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: T.orange,
                        fontFamily: mono,
                      }}>
                        {m.maxLeverage}x
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: "flex", gap: 8, marginTop: 2,
                    fontSize: 10, color: T.text3, fontFamily: mono,
                  }}>
                    <span>Vol. {fmtCompact(d.totalVolume24h)}</span>
                    {(() => {
                      const collaterals = getCollaterals(d.primary, d.alternatives);
                      if (collaterals.length === 0) return null;
                      return (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                          {collaterals.map(c => (
                            <img key={c} src={COLLATERAL_ICON[c]} alt={c} title={c}
                              style={{ width: 11, height: 11, borderRadius: "50%", opacity: 0.75 }} />
                          ))}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 0 : 4, flexShrink: 0 }}>
                {!isMobile && (
                  <span style={{
                    fontSize: 11, color: T.text2, fontFamily: mono,
                    width: 72, textAlign: "right",
                  }}>
                    {fmtCompact(d.totalVolume24h)}
                  </span>
                )}
                {!isMobile && (
                  <span style={{
                    fontSize: 11, color: T.text2, fontFamily: mono,
                    width: 72, textAlign: "right",
                  }}>
                    {fmtCompact(d.totalOpenInterest)}
                  </span>
                )}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
                  width: isMobile ? 90 : 100, flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: T.text,
                    fontFamily: mono, fontVariantNumeric: "tabular-nums",
                  }}>
                    ${fmtPrice(m.price)}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 500, fontFamily: mono,
                    color: isPos ? T.green : T.red,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {fmtChange(change)}
                  </span>
                </div>
                {m.isMarketOpen === false && (
                  <span style={{ fontSize: 8, color: T.text3, background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 2, fontFamily: mono, fontWeight: 600, marginLeft: 4 }}>CLOSED</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 4px", flexShrink: 0 }}>
        <img
          src="/azabu-logo.png"
          alt=""
          aria-hidden="true"
          style={{
            width: 12, height: 12, opacity: 0.035,
            pointerEvents: "none", userSelect: "none",
          }}
        />
      </div>
    </div>
  );
}
