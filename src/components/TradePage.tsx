"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { BookOpen, Activity, Percent, X } from "lucide-react";
import SimpleTradeCard from "@/components/trade/SimpleTradeCard";
import ActivePositionCard from "@/components/trade/ActivePositionCard";
import MarketDataPanel from "@/components/trade/MarketDataPanel";
import useMarketStore from "@/stores/useMarketStore";

const TerminalChart = dynamic(() => import("@/components/perps/TerminalChart"), { ssr: false });

const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";
const MARKET_KEY = "afx_trade_market";

type DataModal = "book" | "trades" | "funding" | null;

interface CanonicalMarket { sym: string; protocol: string; }

function readCanonicalMarket(): CanonicalMarket | null {
  try {
    const raw = localStorage.getItem(MARKET_KEY);
    if (raw) return JSON.parse(raw);
    const bare = localStorage.getItem("afx_perps_asset") || localStorage.getItem("afx_last_market");
    if (bare) {
      const cleaned = bare.replace(/-PERP$/, "").replace(/USDT$/, "").replace(/\/[A-Z]+$/, "").toUpperCase();
      return { sym: cleaned, protocol: "hyperliquid" };
    }
  } catch {}
  return null;
}

function writeCanonicalMarket(market: CanonicalMarket) {
  localStorage.setItem(MARKET_KEY, JSON.stringify(market));
  localStorage.setItem("afx_perps_asset", market.sym);
  localStorage.setItem("afx_last_market", market.sym);
}

const DATA_BUTTONS: { key: "book" | "trades" | "funding"; label: string; icon: typeof BookOpen }[] = [
  { key: "book", label: "Book", icon: BookOpen },
  { key: "trades", label: "Trades", icon: Activity },
  { key: "funding", label: "Funding", icon: Percent },
];

interface TradePageProps { fromMarkets?: boolean; }

export default function TradePage({ fromMarkets = false }: TradePageProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"chart" | "trade">("chart");
  const [dataModal, setDataModal] = useState<DataModal>(null);

  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [assetProtocol, setAssetProtocol] = useState<string>("hyperliquid");

  const livePrices = useMarketStore(s => s.livePrices);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    const m = readCanonicalMarket();
    if (m) { setSelectedAsset(m.sym); setAssetProtocol(m.protocol); }
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!dataModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setDataModal(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dataModal]);

  const handleAssetChange = useCallback((sym: string, protocol?: string) => {
    const resolvedProtocol = protocol || "hyperliquid";
    setSelectedAsset(sym);
    setAssetProtocol(resolvedProtocol);
    writeCanonicalMarket({ sym, protocol: resolvedProtocol });
  }, []);

  const chain = assetProtocol === "aster" ? "arbitrum" : assetProtocol;
  const rawSym = assetProtocol === "aster" ? `${selectedAsset}USDT` : `${selectedAsset}-PERP`;
  const venueLogo = assetProtocol === "aster" ? "/tokens/aster-logo.png" : assetProtocol === "lighter" ? "/tokens/lighter-logo.png" : "/tokens/hyperliquid.webp";

  const currentPrice = (() => {
    const keys = [rawSym, `${selectedAsset}-PERP`, `${selectedAsset}USDT`];
    for (const k of keys) { const p = livePrices[k]?.price; if (p) return p; }
    return null;
  })();

  const priceChange = (() => {
    const keys = [rawSym, `${selectedAsset}-PERP`, `${selectedAsset}USDT`];
    for (const k of keys) { const c = livePrices[k]?.change24h; if (c !== undefined) return c; }
    return null;
  })();

  const fundingRate = (() => {
    const keys = [rawSym, `${selectedAsset}-PERP`, `${selectedAsset}USDT`];
    for (const k of keys) { const f = livePrices[k]?.fundingRate; if (f !== undefined) return f; }
    return null;
  })();

  const isPositive = (priceChange ?? 0) >= 0;

  if (!mounted) {
    return (
      <div style={{ height: "100%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #1A1D24", borderTopColor: "#D4A574", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const chartNode = (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <TerminalChart symbol={rawSym} currentPrice={currentPrice ?? 0} chain={chain} />
    </div>
  );

  /* ── Data pill buttons (shared between mobile and desktop) ─────────── */
  const dataPills = (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {DATA_BUTTONS.map(({ key, label, icon: Icon }) => {
        const active = dataModal === key;
        return (
          <button
            key={key}
            data-testid={`data-pill-${key}`}
            onClick={() => setDataModal(prev => prev === key ? null : key)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 9px",
              borderRadius: 7,
              border: active ? "1px solid rgba(212,165,116,0.40)" : "1px solid rgba(255,255,255,0.08)",
              background: active ? "rgba(212,165,116,0.12)" : "rgba(255,255,255,0.03)",
              color: active ? "#D4A574" : "rgba(255,255,255,0.40)",
              fontSize: 10, fontWeight: active ? 600 : 400,
              fontFamily: SANS, cursor: "pointer",
              transition: "all 0.15s",
              letterSpacing: "-0.01em",
            }}
          >
            <Icon size={11} />
            {label}
          </button>
        );
      })}
    </div>
  );

  /* ── Data Modal Overlay ────────────────────────────────────────────── */
  const dataModalOverlay = dataModal && (
    <div
      data-testid="data-modal-backdrop"
      onClick={() => setDataModal(null)}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 9000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile ? 12 : 32,
        animation: "fadeIn 0.15s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div
        data-testid="data-modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : 520,
          height: isMobile ? "80vh" : 480,
          maxHeight: "85vh",
          background: "#0E1014",
          border: "1px solid #1A1D24",
          borderRadius: 14,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          animation: "slideIn 0.2s ease",
        }}
      >
        {/* Modal header */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #1A1D24",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>
              {selectedAsset}-PERP
            </span>
            {/* Tab switcher inside modal */}
            <div style={{ display: "flex", gap: 2, marginLeft: 6 }}>
              {DATA_BUTTONS.map(({ key, label }) => {
                const active = dataModal === key;
                return (
                  <button
                    key={key}
                    data-testid={`modal-tab-${key}`}
                    onClick={() => setDataModal(key)}
                    style={{
                      padding: "3px 9px",
                      borderRadius: 5,
                      border: "none",
                      background: active ? "rgba(212,165,116,0.12)" : "transparent",
                      color: active ? "#D4A574" : "rgba(255,255,255,0.35)",
                      fontSize: 10, fontWeight: active ? 600 : 400,
                      fontFamily: SANS, cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            data-testid="data-modal-close"
            onClick={() => setDataModal(null)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.45)",
              cursor: "pointer", transition: "all 0.12s",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <MarketDataPanel
            symbol={rawSym} protocol={assetProtocol}
            isMobile={isMobile} currentPrice={currentPrice} fundingRate={fundingRate}
            defaultTab={dataModal}
          />
        </div>
      </div>
    </div>
  );

  /* ── Shared header ─────────────────────────────────────────────────── */
  const header = (
    <div data-testid="trade-page-header" style={{
      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 12px 7px 16px",
      borderBottom: "1px solid #1A1D24",
      background: "#000", gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, overflow: "hidden" }}>
        {isMobile && fromMarkets && (
          <button
            data-testid="back-to-markets"
            onClick={() => window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "perps" } }))}
            style={{
              display: "flex", alignItems: "center", gap: 3, padding: "4px 8px 4px 5px",
              borderRadius: 7, border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.04)", cursor: "pointer", flexShrink: 0,
              color: "rgba(255,255,255,0.42)", transition: "background 0.12s",
            }}
            onTouchStart={e => { e.currentTarget.style.background = "rgba(212,165,116,0.10)"; e.currentTarget.style.color = "#D4A574"; }}
            onTouchEnd={e => { const el = e.currentTarget; setTimeout(() => { if (el) { el.style.background = "rgba(255,255,255,0.04)"; el.style.color = "rgba(255,255,255,0.42)"; } }, 120); }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, whiteSpace: "nowrap" }}>
          {selectedAsset}-PERP
        </span>
        <img src={venueLogo} alt="venue" style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
        {currentPrice !== null && (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#E6EDF3", fontFamily: MONO, whiteSpace: "nowrap" }}>
              ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: currentPrice < 10 ? 4 : 2, maximumFractionDigits: currentPrice < 10 ? 4 : 2 })}
            </span>
            {priceChange !== null && (
              <span style={{ fontSize: 10, color: isPositive ? "#22C55E" : "#EF4444", fontFamily: MONO, whiteSpace: "nowrap" }}>
                {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
              </span>
            )}
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {isMobile && (
          <div style={{
            display: "flex",
            background: "#0E1014",
            border: "1px solid #1A1D24",
            borderRadius: 8,
            padding: 2,
            gap: 1,
          }}>
            {(["chart", "trade"] as const).map(v => {
              const active = mobileView === v;
              return (
                <button
                  key={v}
                  data-testid={`trade-view-${v}`}
                  onClick={() => setMobileView(v)}
                  style={{
                    padding: "5px 11px",
                    borderRadius: 6,
                    border: "none",
                    background: active ? "#1A1D24" : "transparent",
                    color: active ? "#E6EDF3" : "rgba(255,255,255,0.35)",
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    fontFamily: SANS,
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                    transition: "all 0.12s",
                  }}
                >
                  {v === "chart" ? "Chart" : "Trade"}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     MOBILE LAYOUT
  ══════════════════════════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div
        data-testid="trade-page"
        style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#000", fontFamily: SANS }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {header}
        <div style={{ flex: 1, minHeight: 0, overflow: mobileView === "trade" ? "auto" : "hidden", display: "flex", flexDirection: "column" }}>
          {mobileView === "chart" ? (
            <>
              <div style={{ flex: 1, minHeight: 0 }}>{chartNode}</div>
              <div style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                padding: "6px 12px",
                borderTop: "1px solid #1A1D24",
                background: "#07070D",
              }}>
                {dataPills}
              </div>
            </>
          ) : (
            <div style={{ padding: "12px 12px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
              <SimpleTradeCard selectedAsset={selectedAsset} onAssetChange={handleAssetChange} onVenueChange={setAssetProtocol} />
              <ActivePositionCard assetSym={selectedAsset} />
            </div>
          )}
        </div>
        {dataModalOverlay}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     DESKTOP LAYOUT
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div
      data-testid="trade-page"
      style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#000", fontFamily: SANS }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {header}

      <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {chartNode}
          </div>
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
            padding: "6px 12px",
            borderTop: "1px solid #1A1D24",
            background: "#07070D",
          }}>
            {dataPills}
          </div>
        </div>

        <div style={{
          width: 390, flexShrink: 0,
          borderLeft: "1px solid #1A1D24",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ height: "100%", overflowY: "auto", padding: "12px 12px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
            <SimpleTradeCard selectedAsset={selectedAsset} onAssetChange={handleAssetChange} onVenueChange={setAssetProtocol} />
            <ActivePositionCard assetSym={selectedAsset} />
          </div>
        </div>
      </div>
      {dataModalOverlay}
    </div>
  );
}
