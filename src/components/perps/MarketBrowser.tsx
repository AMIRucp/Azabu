"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Search, ChevronUp, ChevronDown, Flame } from "lucide-react";
import TokenIcon from "@/components/shared/TokenIcon";
import FavoriteStar from "@/components/shared/FavoriteStar";
import { fmtPrice, fmtCompact, fmtChange, fmtFunding } from "@/utils/marketFormatters";
import { useMarketList, CATEGORIES, type SortKey } from "@/hooks/useMarketList";
import { getDedupId, type DeduplicatedMarket } from "@/services/marketDeduplicator";
import type { UnifiedMarket } from "@/types/market";
import { T } from "./terminalTheme";
import PillButton, { PILL_ACCENT_BG } from "@/components/shared/PillButton";

const sans = "'Inter', -apple-system, sans-serif";

const ORANGE_PILL = PILL_ACCENT_BG;

const COLLATERAL_ICON: Record<string, string> = {
  USDC: "/tokens/usdc.webp",
  USDT: "/tokens/usdt.png",
};

const MAJORS = new Set(["BTC","ETH","SOL","BNB","XRP","AVAX","ADA","DOGE","LTC","DOT","TRX","XLM","ATOM","NEAR","ALGO","ICP","BCH","TON"]);

// Category badge shown on each row (matches the new design's CRYPTO / DEFI pills)
const CAT_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  crypto:    { label: "CRYPTO", color: "#F7C948", bg: "rgba(247,201,72,0.10)",  border: "rgba(247,201,72,0.20)" },
  defi:      { label: "DEFI",   color: "#4ADE80", bg: "rgba(30,58,58,0.55)",    border: "rgba(74,222,128,0.20)" },
  meme:      { label: "MEME",   color: "#C084FC", bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.22)" },
  l1l2:      { label: "L1/L2",  color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)" },
  stock:     { label: "STOCK",  color: "#38BDF8", bg: "rgba(56,189,248,0.10)",  border: "rgba(56,189,248,0.22)" },
  commodity: { label: "COMM",   color: "#FBBF24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.22)" },
  index:     { label: "INDEX",  color: "#A78BFA", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.22)" },
  forex:     { label: "FX",     color: "#2DD4BF", bg: "rgba(45,212,191,0.10)",  border: "rgba(45,212,191,0.22)" },
};
function badgeFor(m: UnifiedMarket) {
  return (m.category && CAT_BADGE[m.category]) || CAT_BADGE.crypto;
}

// Section ordering for the grouped table
const SECTION_ORDER = ["CRYPTO · MAJORS", "DEFI PERPETUALS", "MEME", "L1 / L2", "STOCKS", "COMMODITIES", "INDICES", "FOREX", "CRYPTO"];
function sectionFor(m: UnifiedMarket): string {
  if (MAJORS.has(m.baseAsset)) return "CRYPTO · MAJORS";
  switch (m.category) {
    case "defi": return "DEFI PERPETUALS";
    case "meme": return "MEME";
    case "l1l2": return "L1 / L2";
    case "stock": return "STOCKS";
    case "commodity": return "COMMODITIES";
    case "index": return "INDICES";
    case "forex": return "FOREX";
    default: return "CRYPTO";
  }
}

function getCollaterals(primary: UnifiedMarket, alternatives: UnifiedMarket[]): string[] {
  const quotes = [primary, ...alternatives].map(m => (m.quoteAsset || "USDC").toUpperCase());
  return [...new Set(quotes)].filter(q => COLLATERAL_ICON[q]);
}

interface MarketBrowserProps {
  allMarkets: UnifiedMarket[];
  livePrices: Record<string, { price: number; change24h: number; vol24h?: number; openInterest?: number; fundingRate?: number }>;
  onSelectMarket: (symbol: string, protocol?: string, meta?: { category?: string; baseAsset?: string; assetId?: number }) => void;
  isMobile: boolean;
  activeSym?: string;
  /** page = full Markets page; picker = trade asset selector overlay */
  mode?: "page" | "picker";
}

export default function MarketBrowser({ allMarkets, livePrices, onSelectMarket, isMobile, activeSym, mode = "page" }: MarketBrowserProps) {
  const isPicker = mode === "picker";
  const {
    search, setSearch,
    category, setCategory,
    collateralFilter,
    sortKey, sortAsc, handleSort,
    favorites, toggleFav,
    kbIdx, setKbIdx,
    sorted,
    deduplicated,
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

  // Group the (already filtered + sorted) list into category sections, preserving sort order within each.
  const sections = useMemo(() => {
    if (category === "Favorites") {
      return sorted.length ? [{ label: "★ FAVORITES", items: sorted }] : [];
    }
    const map = new Map<string, DeduplicatedMarket[]>();
    for (const d of sorted) {
      const s = sectionFor(d.primary);
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(d);
    }
    const ordered: { label: string; items: DeduplicatedMarket[] }[] = [];
    for (const label of SECTION_ORDER) {
      if (map.has(label)) { ordered.push({ label, items: map.get(label)! }); map.delete(label); }
    }
    for (const [label, items] of map) ordered.push({ label, items });
    return ordered;
  }, [sorted, category]);

  const maxOI = useMemo(() => Math.max(1, ...sorted.map(d => d.totalOpenInterest || 0)), [sorted]);

  const totalInstruments = deduplicated.length;
  const totalCategories = useMemo(
    () => new Set(deduplicated.map(d => sectionFor(d.primary))).size,
    [deduplicated]
  );

  // --- per-category pagination: render 20 rows per section, auto-expand on scroll-to-end ---
  const PAGE_SIZE = 20;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [perCatLimit, setPerCatLimit] = useState(PAGE_SIZE);

  const hasMore = useMemo(
    () => sections.some(s => s.items.length > perCatLimit),
    [sections, perCatLimit]
  );
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  // reset the cap whenever the visible result set changes
  useEffect(() => { setPerCatLimit(PAGE_SIZE); }, [category, search, collateralFilter, sortKey, sortAsc]);

  // grow the cap as the user scrolls near the bottom, until everything is shown
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => {
      if (!hasMoreRef.current) return;
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 320) {
        setPerCatLimit(l => l + PAGE_SIZE);
      }
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  const SortHeader = ({ label, sortId }: { label: string; sortId: SortKey }) => {
    const active = sortKey === sortId;
    return (
      <button
        data-testid={`browser-sort-${sortId}`}
        onClick={() => handleSort(sortId)}
        style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 3,
          color: active ? "rgba(255,255,255,0.8)" : "#6B7280",
          fontSize: 9, fontFamily: sans, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          transition: "color 0.15s", whiteSpace: "nowrap", flexShrink: 0,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#6B7280"; }}
      >
        {label}
        {active
          ? (sortAsc
            ? <ChevronUp style={{ width: 9, height: 9, color: "#FF6B00", flexShrink: 0 }} />
            : <ChevronDown style={{ width: 9, height: 9, color: "#FF6B00", flexShrink: 0 }} />)
          : <ChevronDown style={{ width: 8, height: 8, opacity: 0.2, flexShrink: 0 }} />}
      </button>
    );
  };

  // shared column layout — one flex row with a single uniform gap so the spacing
  // between every column is equal. Header and data rows use the SAME ratios to stay aligned.
  const COL_GAP = isMobile ? 14 : 28;
  const COL: Record<string, CSSProperties> = {
    market:  { flex: isMobile ? "1 1 0%" : "2.4 1 0%", minWidth: 0 },
    price:   { flex: "1 1 0%", textAlign: "right" },
    change:  { flex: "0.85 1 0%", textAlign: "right" },
    volume:  { flex: "1 1 0%", textAlign: "right" },
    oi:      { flex: "1.5 1 0%" },
    funding: { flex: "0.95 1 0%", textAlign: "right" },
    trade:   { flex: "0 0 90px" },
  };
  const headCell = (c: CSSProperties, align: "left" | "right"): CSSProperties => ({
    ...c, display: "flex", alignItems: "center", justifyContent: align === "left" ? "flex-start" : "flex-end",
  });

  const TradeButton = ({ d, m }: { d: DeduplicatedMarket; m: UnifiedMarket }) => (
    <button
      data-testid={`browser-trade-${getDedupId(d)}`}
      onClick={(e) => { e.stopPropagation(); onSelectMarket(m.symbol, m.protocol, { category: m.category, baseAsset: m.baseAsset, assetId: m.assetId }); }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
        width: 80, height: 30, flexShrink: 0,
        background: ORANGE_PILL, borderRadius: 24,
        border: "1px solid #3E3E3E", boxShadow: "0px 3px 4px rgba(0,0,0,0.25)",
        cursor: "pointer", color: "#fff", fontFamily: sans, fontSize: 11, fontWeight: 700,
        transition: "transform 0.12s, filter 0.12s",
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}
    >
      Trade <span style={{ fontWeight: 500, opacity: 0.9 }}>›</span>
    </button>
  );

  let flatIdx = -1; // running index into `sorted` for keyboard highlight

  return (
    <div ref={scrollRef} data-testid="market-browser" style={{
      background: "#050505", height: "100%", overflowY: "auto", overflowX: "hidden",
      fontFamily: sans, color: T.text, position: "relative",
    }}>
      {/* decorative 3D candlestick — page only */}
      {!isMobile && !isPicker && (
        <img
          src="/Market/3D_Candlestick.png"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", top: -30, right: -48,
            width: 300, height: "auto", zIndex: 0, opacity: 0.9,
            transform: "rotate(9deg)", transformOrigin: "top right",
            pointerEvents: "none", userSelect: "none",
          }}
        />
      )}
      <div style={{
        position: "relative", zIndex: 1,
        padding: isPicker ? (isMobile ? "12px 12px 16px" : "16px 20px 20px") : (isMobile ? "16px 12px 24px" : "32px 40px 40px"),
        display: "flex", flexDirection: "column",
        gap: isPicker ? 12 : 20,
      }}>

        {/* Header: title + subtitle + search (page) | search only (picker) */}
        <div style={{
          display: "flex", alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: 16,
        }}>
          {!isPicker && (
            <div>
              <div className="text-gradient" style={{ fontSize: isMobile ? 24 : 32, fontWeight: 700, lineHeight: 1 }}>Markets</div>
              <div style={{ marginTop: 8, fontSize: 12.5, color: "#9CA3AF" }}>
                {totalInstruments > 0
                  ? `${totalInstruments} instruments across ${totalCategories} categories`
                  : "Loading markets…"}
              </div>
            </div>
          )}
          <div style={{
            position: "relative", display: "flex", alignItems: "center", gap: 8,
            width: isMobile || isPicker ? "100%" : 374, height: 45,
            background: "rgba(17,17,17,0.60)", borderRadius: 11,
            border: "1px solid #1E1E1E", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)",
            padding: "0 14px",
          }}>
            <Search style={{ width: 15, height: 15, color: "#6B7280", flexShrink: 0 }} />
            <input
              data-testid="browser-search"
              value={search}
              onChange={e => { setSearch(e.target.value); setKbIdx(-1); }}
              onKeyDown={e => handleKeyDown(e, onSelectMarket)}
              placeholder="Search market"
              spellCheck={false}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: T.text, fontSize: 14, fontFamily: sans, letterSpacing: "0.01em",
              }}
            />
            {search && (
              <button
                data-testid="browser-search-clear"
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}
              >×</button>
            )}
          </div>
        </div>

        {/* Filters: category pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* category pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", flex: 1, minWidth: 0 }}>
            {CATEGORIES.map(f => {
              const active = category === f;
              return (
                <PillButton
                  key={f}
                  variant="accent"
                  active={active}
                  data-testid={`browser-cat-${f.toLowerCase()}`}
                  onClick={() => setCategory(f)}
                >
                  {f === "Favorites" ? "★" : f}
                </PillButton>
              );
            })}
          </div>
        </div>

        {/* trending chips (preserved feature, shown when browsing All without a search) */}
        {trendingNow.length > 0 && !search && category === "All" && (
          <div
            data-testid="trending-now-row"
            style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}
          >
            <Flame style={{ width: 12, height: 12, color: "#FF6B00", flexShrink: 0 }} />
            {trendingNow.map(({ m }) => {
              const lp = livePrices[m.symbol];
              const change = lp?.change24h ?? m.change24h ?? 0;
              const isPos = change >= 0;
              return (
                <button
                  key={m.symbol + m.protocol}
                  data-testid={`trending-chip-${m.baseAsset?.toLowerCase() || m.symbol.toLowerCase()}`}
                  onClick={() => onSelectMarket(m.symbol, m.protocol, { category: m.category, baseAsset: m.baseAsset, assetId: m.assetId })}
                  style={{
                    flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 24,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                >
                  <TokenIcon symbol={m.baseAsset} size={14} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>
                    {m.baseAsset?.replace(/^spot:/, "") || m.symbol}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: isPos ? T.green : T.red }}>
                    {isPos ? "+" : ""}{change.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Table card */}
        <div style={{
          position: "relative",
          background: "linear-gradient(180deg, rgba(22,22,22,0.60) 0%, rgba(10,10,10,0.60) 100%)",
          borderRadius: 14.222, border: "0.889px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(6.222px)", WebkitBackdropFilter: "blur(6.222px)", overflow: "hidden",
        }}>
          {/* inner glow — matches leaderboard .lb-table::before (warm glow from bottom-left, blurred) */}
          <div aria-hidden style={{
            position: "absolute", left: "-12%", bottom: "-18%", width: "115%", height: "125%",
            zIndex: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 130% 135% at 0% 100%, rgba(48,11,4,0.72) 0%, rgba(48,11,4,0.36) 38%, transparent 72%)",
            filter: "blur(48px)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
          {/* column header row */}
          <div style={{
            display: "flex", alignItems: "center", gap: COL_GAP,
            padding: isMobile ? "12px 14px" : "14px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={headCell(COL.market, "left")}><SortHeader label="Market" sortId="market" /></div>
            <div style={headCell(COL.price, "right")}><SortHeader label="Price" sortId="price" /></div>
            <div style={headCell(COL.change, "right")}><SortHeader label="24h %" sortId="change" /></div>
            {!isMobile && <div style={headCell(COL.volume, "right")}><SortHeader label="Volume" sortId="volume" /></div>}
            {!isMobile && <div style={headCell(COL.oi, "right")}><SortHeader label="Open Int." sortId="oi" /></div>}
            {!isMobile && <div style={headCell(COL.funding, "right")}><SortHeader label="Funding" sortId="funding" /></div>}
            {!isMobile && <div style={COL.trade} />}
          </div>

          {/* skeleton */}
          {allMarkets.length === 0 && (
            <div data-testid="browser-skeleton">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: isMobile ? "14px 14px" : "16px 24px",
                  borderTop: "1px solid rgba(31,31,31,0.30)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    <div>
                      <div style={{ width: 80, height: 14, borderRadius: 3, background: T.bgEl }} />
                      <div style={{ width: 110, height: 10, borderRadius: 3, marginTop: 5, background: T.bgEl, opacity: 0.5 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ width: 70, height: 14, borderRadius: 3, background: T.bgEl }} />
                    <div style={{ width: 50, height: 14, borderRadius: 3, background: T.bgEl }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* empty */}
          {allMarkets.length > 0 && sorted.length === 0 && (
            <div style={{ padding: 48, textAlign: "center", fontSize: 13, color: T.text3 }} data-testid="browser-empty">
              {category === "Favorites" ? "No favorites yet — star a market to add it" : "No markets found"}
            </div>
          )}

          {/* grouped sections */}
          {sections.map(section => (
            <div key={section.label}>
              <div style={{
                padding: isMobile ? "16px 14px 8px" : "20px 24px 10px",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "#9CA3AF",
              }}>
                {section.label}
              </div>
              {section.items.slice(0, perCatLimit).map(d => {
                flatIdx += 1;
                const idx = flatIdx;
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
                const isActive = activeSym
                  ? (m.symbol === activeSym || [d.primary, ...d.alternatives].some(a => a.symbol === activeSym))
                  : false;
                const badge = badgeFor(m);
                const fundingPos = (d.bestFundingRate || 0) >= 0;
                const oiRatio = Math.max(0, Math.min(1, (d.totalOpenInterest || 0) / maxOI));

                return (
                  <div
                    key={dedupKey}
                    data-testid={`browser-row-${dedupKey}`}
                    onClick={() => onSelectMarket(m.symbol, m.protocol, { category: m.category, baseAsset: m.baseAsset, assetId: m.assetId })}
                    ref={isKb ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
                    style={{
                      display: "flex", alignItems: "center", gap: COL_GAP,
                      padding: isMobile ? "12px 14px" : "13px 24px",
                      cursor: "pointer",
                      borderTop: "1px solid rgba(31,31,31,0.30)",
                      borderLeft: isActive ? "2px solid rgba(255,107,0,0.6)" : "2px solid transparent",
                      background: isActive
                        ? "linear-gradient(90deg, rgba(255,107,0,0.06) 0%, transparent 100%)"
                        : isKb ? "rgba(255,255,255,0.04)" : "transparent",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isActive ? "linear-gradient(90deg, rgba(255,107,0,0.06) 0%, transparent 100%)" : isKb ? "rgba(255,255,255,0.04)" : "transparent"; }}
                  >
                    {/* market cell */}
                    <div style={{ ...COL.market, display: "flex", alignItems: "center", gap: 12 }}>
                      <FavoriteStar
                        active={isFav}
                        onClick={(e) => toggleFav(dedupKey, e)}
                        activeColor="#FF6B00"
                        inactiveColor={T.text3}
                        testId={`browser-fav-${dedupKey}`}
                      />
                      <TokenIcon symbol={m.baseAsset} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? "#FF8A3C" : "#fff" }}>
                            {m.symbol}
                          </span>
                          {m.type === "spot" && (
                            <span style={{
                              fontSize: 7, fontWeight: 700, color: "#3B82F6",
                              background: "rgba(59,130,246,0.1)", padding: "1px 5px", borderRadius: 8,
                              letterSpacing: "0.04em", lineHeight: "13px",
                            }}>SPOT</span>
                          )}
                          <span style={{
                            fontSize: 7, fontWeight: 500, color: badge.color,
                            background: badge.bg, border: `1px solid ${badge.border}`,
                            padding: "2px 6px", borderRadius: 10, lineHeight: "11px",
                            textTransform: "uppercase", letterSpacing: "0.02em",
                          }}>{badge.label}</span>
                          {m.isMarketOpen === false && (
                            <span style={{ fontSize: 7, color: T.text3, background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 8, fontWeight: 700, lineHeight: "13px" }}>CLOSED</span>
                          )}
                        </div>
                        <div style={{ marginTop: 3, fontSize: 10.5, color: "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {(m.name || m.baseAsset)}
                          {m.maxLeverage ? ` · up to ${m.maxLeverage}x` : ""}
                        </div>
                      </div>
                    </div>

                    {/* price */}
                    <div style={{ ...COL.price, fontSize: 14, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                      ${fmtPrice(m.price)}
                    </div>
                    {/* 24h change */}
                    <div style={{ ...COL.change, fontSize: 14, fontWeight: 600, color: isPos ? "#94FFBB" : "#FF8383", fontVariantNumeric: "tabular-nums" }}>
                      {fmtChange(change)}
                    </div>
                    {!isMobile && (
                      <div style={{ ...COL.volume, fontSize: 12, fontWeight: 700, color: "#888888", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        {fmtCompact(d.totalVolume24h)}
                      </div>
                    )}
                    {!isMobile && (
                      <div style={{ ...COL.oi, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          {fmtCompact(d.totalOpenInterest)}
                        </span>
                        <span style={{ width: 44, height: 4, background: "rgba(255,255,255,0.10)", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                          <span style={{
                            display: "block", height: "100%", width: `${oiRatio * 100}%`,
                            background: "radial-gradient(ellipse 50% 50% at 50% 50%, #FF6B00 0%, #994000 100%)",
                            boxShadow: "0px 0px 9px rgba(255,107,0,0.40)", borderRadius: 8,
                          }} />
                        </span>
                      </div>
                    )}
                    {!isMobile && (
                      <div style={{
                        ...COL.funding, fontSize: 13, fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        color: (d.bestFundingRate || 0) === 0 ? T.text3 : fundingPos ? "#94FFBB" : "#FF8383",
                      }}>
                        {fmtFunding(d.bestFundingRate)}
                      </div>
                    )}
                    {!isMobile && (
                      <div style={{ ...COL.trade, display: "flex", justifyContent: "flex-end" }}>
                        <TradeButton d={d} m={m} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          </div>
        </div>

        {hasMore && (
          <div data-testid="browser-load-more" style={{ textAlign: "center", padding: "2px 0", fontSize: 11, color: T.text3, letterSpacing: "0.04em" }}>
            Scroll for more…
          </div>
        )}

        {!isPicker && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <img src="/azabu-logo.png" alt="" aria-hidden="true" style={{ width: 14, height: 14, opacity: 0.035, pointerEvents: "none", userSelect: "none" }} />
        </div>
        )}
      </div>
    </div>
  );
}
