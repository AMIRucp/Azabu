"use client";
import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { getIcon } from "@/config/tokenIcons";
import { ASTER_MARKET_LIST } from "@/config/asterMarkets";
import type { PerpMarket } from "@/config/asterMarkets";


const CATEGORIES: Record<string, { label: string; color: string }> = {
  crypto_major:   { label: "Majors",             color: "#3B82F6" },
  meme:           { label: "Meme & Speculative", color: "#D4A574" },
  defi:           { label: "DeFi",               color: "#10B981" },
  stock:          { label: "Stocks",             color: "#8B5CF6" },
  commodity:      { label: "Commodities",        color: "#D97706" },
  political:      { label: "Political",          color: "#EC4899" },
  exchange_token: { label: "Exchange Token",     color: "#6366F1" },
};

const PERP_MARKETS: PerpMarket[] = ASTER_MARKET_LIST;

function getSymbolFromPerp(perpSymbol: string): string {
  return perpSymbol.replace(/-PERP$/, "").replace(/-USD$/, "").replace(/^1M/, "");
}

function fmtPrice(p: number): string {
  if (p === 0) return "--";
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

function fmtVol(v: number): string {
  if (v === 0) return "--";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

function fmtFunding(f: number): string {
  if (f === 0) return "--";
  return (f > 0 ? "+" : "") + (f * 100).toFixed(4) + "%";
}

function TokenLogo({ symbol, name, size = 24 }: { symbol: string; name: string; size?: number }) {
  const icon = getIcon(symbol);
  const hue = [...(name || symbol)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  if (icon.type === 'img') {
    return (
      <img
        src={icon.value}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          const div = document.createElement('div');
          div.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:hsl(${hue},30%,20%);display:flex;align-items:center;justify-content:center;font-size:${size*0.42}px;font-weight:700;color:hsl(${hue},50%,65%);font-family:monospace;flex-shrink:0`;
          div.textContent = (name || symbol).charAt(0);
          el.replaceWith(div);
        }}
      />
    );
  }

  if (icon.type === 'emoji') {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: '#1E2329',
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.55, lineHeight: 1, flexShrink: 0,
      }}>
        {icon.value}
      </div>
    );
  }

  const label = icon.type === "letter" ? icon.value : (name || symbol).charAt(0);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `hsl(${hue}, 30%, 20%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontFamily: MONO, fontWeight: 700,
      color: `hsl(${hue}, 50%, 65%)`, flexShrink: 0, overflow: "hidden",
    }}>
      {label}
    </div>
  );
}

const MONO = "'IBM Plex Mono', monospace";
const SANS = "'Inter', -apple-system, sans-serif";

interface PerpMarketSelectorProps {
  chain: string;
  onChainChange: (chain: string) => void;
  selected: string;
  onSelect: (market: PerpMarket) => void;
  livePrices?: Record<string, { price: number; change24h: number; funding?: number; vol24h?: number }>;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

function PerpMarketSelectorInner({ chain, onChainChange, selected, onSelect, livePrices }: PerpMarketSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const baseMarkets = PERP_MARKETS;
  const chainInfo = { label: "Markets", color: "#D4A574" };

  const markets = useMemo(() => {
    if (!livePrices) return baseMarkets;
    return baseMarkets.map(m => {
      const sym = getSymbolFromPerp(m.symbol);
      const live = livePrices[m.symbol] || livePrices[sym];
      if (live) {
        return {
          ...m,
          price: live.price || m.price,
          change24h: live.change24h ?? m.change24h,
          funding: live.funding ?? m.funding,
          vol24h: live.vol24h ?? m.vol24h,
        };
      }
      return m;
    });
  }, [baseMarkets, livePrices]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return markets;
    return markets.filter(
      m => m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [markets, search]);

  const grouped = useMemo(() => {
    const order = ["crypto_major", "meme", "defi", "stock", "commodity", "political", "exchange_token"];
    const groups: { category: string; items: PerpMarket[] }[] = [];
    for (const cat of order) {
      const items = filtered.filter(m => m.category === cat);
      if (items.length > 0) groups.push({ category: cat, items });
    }
    return groups;
  }, [filtered, chain]);

  const flatFiltered = useMemo(() => grouped.flatMap(g => g.items), [grouped]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
      setSearch("");
      setHighlightIdx(0);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx(i => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const m = flatFiltered[highlightIdx];
        if (m) { onSelect(m); setOpen(false); }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, flatFiltered, highlightIdx, onSelect]
  );

  const currentMarket = markets.find(m => m.symbol === selected) || markets[0];

  return (
    <div ref={dropdownRef} style={st.wrapper}>
      <div style={st.chainToggleWrap} />

      <button
        style={st.trigger}
        onClick={() => setOpen(!open)}
        data-testid="perps-market-trigger"
      >
        <TokenLogo symbol={getSymbolFromPerp(currentMarket.symbol)} name={currentMarket.name} size={24} />
        <div style={st.triggerInfo}>
          <span style={st.triggerSymbol}>{currentMarket.symbol}</span>
          <span style={st.triggerPrice}>{currentMarket.price > 0 ? `$${fmtPrice(currentMarket.price)}` : "..."}</span>
        </div>
        {currentMarket.price > 0 && (
          <span style={{ ...st.triggerChange, color: currentMarket.change24h >= 0 ? "#22C55E" : "#EF4444" }}>
            {currentMarket.change24h >= 0 ? "+" : ""}{currentMarket.change24h.toFixed(2)}%
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={isMobile
            ? { ...st.dropdown, position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100vw", height: "100dvh", maxHeight: "100dvh", borderRadius: 0, border: "none", zIndex: 200 } as React.CSSProperties
            : st.dropdown
          }
          onKeyDown={handleKeyDown}
          data-testid="perps-market-dropdown"
        >
          <div style={st.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setHighlightIdx(0); }}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${chainInfo.label} markets...`}
              style={st.searchInput}
              spellCheck={false}
              data-testid="perps-market-search"
            />
            <span style={st.marketCount} data-testid="perps-market-count">{filtered.length}</span>
            {isMobile && (
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#71717A", fontSize: 18, lineHeight: 1 }}
                data-testid="perps-market-close"
              >
                x
              </button>
            )}
          </div>

          <div style={st.colHeaders}>
            <span style={{ ...st.colH, flex: 2 }}>Market</span>
            <span style={{ ...st.colH, flex: 1, textAlign: "right" }}>Price</span>
            <span style={{ ...st.colH, flex: 0.8, textAlign: "right" }}>24h</span>
            {!isMobile && <span style={{ ...st.colH, flex: 0.8, textAlign: "right" }}>Funding</span>}
            {!isMobile && <span style={{ ...st.colH, flex: 0.7, textAlign: "right" }}>Vol</span>}
          </div>

          <div style={{ ...st.listScroll, maxHeight: isMobile ? "none" : 380, flex: isMobile ? 1 : undefined }}>
            {grouped.length === 0 && (
              <div style={st.empty}>No markets found</div>
            )}
            {grouped.map(group => (
              <div key={group.category}>
                <div style={st.catHeader} data-testid={`perps-category-${group.category}`}>
                  <div style={{ ...st.catDot, background: CATEGORIES[group.category]?.color || "#6B7280" }} />
                  <span style={st.catLabel}>{CATEGORIES[group.category]?.label || group.category}</span>
                  <span style={st.catCount}>{group.items.length}</span>
                </div>

                {group.items.map(market => {
                  const flatIdx = flatFiltered.indexOf(market);
                  const isHighlighted = flatIdx === highlightIdx;
                  const isSelected = selected === market.symbol;
                  const sym = getSymbolFromPerp(market.symbol);
                  return (
                    <button
                      key={market.symbol}
                      data-testid={`perps-market-option-${market.symbol}`}
                      onClick={() => { onSelect(market); setOpen(false); }}
                      onMouseEnter={() => setHighlightIdx(flatIdx)}
                      style={{
                        ...st.row,
                        background: isHighlighted ? "#111114" : isSelected ? "#0D0D10" : "transparent",
                        borderLeft: isSelected ? `2px solid ${chainInfo.color}` : "2px solid transparent",
                      }}
                    >
                      <div style={{ flex: 2, display: "flex", alignItems: "center", gap: isMobile ? 8 : 10 }}>
                        <TokenLogo symbol={sym} name={market.name} size={isMobile ? 20 : 22} />
                        <div style={{ minWidth: 0 }}>
                          <div style={st.rowSymbol}>{market.symbol}</div>
                          <div style={st.rowName}>{market.name}</div>
                        </div>
                        {market.maxLev >= 50 && (
                          <span style={st.levBadge}>{market.maxLev}x</span>
                        )}
                      </div>
                      <div style={{ flex: 1, textAlign: "right" }}>
                        <span style={st.rowPrice}>{market.price > 0 ? `$${fmtPrice(market.price)}` : "--"}</span>
                      </div>
                      <div style={{ flex: 0.8, textAlign: "right" }}>
                        <span style={{ ...st.rowChange, color: market.change24h >= 0 ? "#22C55E" : "#EF4444" }}>
                          {market.price > 0 ? `${market.change24h >= 0 ? "+" : ""}${market.change24h.toFixed(2)}%` : "--"}
                        </span>
                      </div>
                      {!isMobile && (
                        <div style={{ flex: 0.8, textAlign: "right" }}>
                          <span style={{ ...st.rowFunding, color: market.funding > 0 ? "#22C55E" : market.funding < 0 ? "#EF4444" : "#6B7280" }}>
                            {fmtFunding(market.funding)}
                          </span>
                        </div>
                      )}
                      {!isMobile && (
                        <div style={{ flex: 0.7, textAlign: "right" }}>
                          <span style={st.rowVol}>{fmtVol(market.vol24h)}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PerpMarketSelectorInner);
export { PERP_MARKETS, getSymbolFromPerp };

const st: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontFamily: SANS,
    width: "100%",
  },
  chainToggleWrap: {
    display: "flex", gap: 4,
    background: "#000000", borderRadius: 8, padding: 3,
  },
  chainBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "5px 12px", borderRadius: 6,
    border: "1px solid transparent",
    fontSize: 12, fontWeight: 450, cursor: "pointer",
    fontFamily: SANS,
    transition: "all 0.15s", whiteSpace: "nowrap",
  },
  chainProtocol: {
    fontSize: 10, opacity: 0.5,
    fontFamily: MONO,
  },
  trigger: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 14px", borderRadius: 10,
    border: "1px solid #1B2030", background: "#000000",
    cursor: "pointer", transition: "border-color 0.15s",
    minWidth: 0, width: "100%", maxWidth: 400,
  },
  triggerInfo: {
    display: "flex", flexDirection: "column", gap: 1, flex: 1,
    textAlign: "left",
  },
  triggerSymbol: {
    fontSize: 14, fontWeight: 500, color: "#E6EDF3",
    fontFamily: MONO,
  },
  triggerPrice: {
    fontSize: 12, color: "#71717A",
    fontFamily: MONO, fontWeight: 300,
  },
  triggerChange: {
    fontSize: 12, fontFamily: MONO, fontWeight: 500,
  },
  dropdown: {
    position: "absolute", top: "100%", left: 0,
    marginTop: 6, width: 520, maxHeight: 480,
    background: "#000000", border: "1px solid #1B2030",
    borderRadius: 12, overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)",
    zIndex: 100, display: "flex", flexDirection: "column",
  },
  searchWrap: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px", borderBottom: "1px solid #141416",
  },
  searchInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    color: "#E6EDF3", fontSize: 13,
    fontFamily: SANS,
    caretColor: "#3B82F6",
  },
  marketCount: {
    fontSize: 11, color: "#6B7280",
    fontFamily: MONO,
  },
  colHeaders: {
    display: "flex", padding: "6px 14px",
    borderBottom: "1px solid #111520",
  },
  colH: {
    fontSize: 10, fontFamily: MONO,
    fontWeight: 400, color: "#1C1C1C", textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  listScroll: {
    overflowY: "auto", flex: 1, padding: "4px 0",
    maxHeight: 380,
  },
  catHeader: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px 4px",
  },
  catDot: {
    width: 6, height: 6, borderRadius: 3, flexShrink: 0,
  },
  catLabel: {
    fontSize: 11, fontWeight: 500, color: "#6B7280",
    fontFamily: SANS,
    textTransform: "uppercase", letterSpacing: "0.04em",
  },
  catCount: {
    fontSize: 10, color: "#1C1C1C",
    fontFamily: MONO,
  },
  row: {
    display: "flex", alignItems: "center", gap: 0,
    padding: "7px 12px", width: "100%",
    border: "none", cursor: "pointer",
    transition: "background 0.1s",
    borderLeft: "2px solid transparent",
  },
  rowSymbol: {
    fontSize: 13, fontWeight: 500, color: "#E4E4E7",
    fontFamily: MONO, lineHeight: "16px",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  rowName: {
    fontSize: 11, fontWeight: 300, color: "#6B7280", lineHeight: "14px",
  },
  levBadge: {
    fontSize: 9, fontFamily: MONO,
    fontWeight: 500, color: "#6366F1",
    background: "rgba(99,102,241,0.1)", borderRadius: 4,
    padding: "1px 5px", whiteSpace: "nowrap",
  },
  rowPrice: {
    fontSize: 12, fontFamily: MONO,
    fontWeight: 400, color: "#9BA4AE",
  },
  rowChange: {
    fontSize: 11, fontFamily: MONO, fontWeight: 500,
  },
  rowFunding: {
    fontSize: 11, fontFamily: MONO, fontWeight: 400,
  },
  rowVol: {
    fontSize: 11, fontFamily: MONO,
    fontWeight: 300, color: "#6B7280",
  },
  empty: {
    padding: "32px 0", textAlign: "center",
    color: "#1C1C1C", fontSize: 13,
  },
};
