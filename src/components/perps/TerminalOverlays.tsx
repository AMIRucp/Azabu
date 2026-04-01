"use client";

import dynamic from "next/dynamic";
import { T, mono } from "./terminalTheme";
import type { UnifiedMarket } from "@/types/market";
import type { BookData, TradeEntry, DepthData } from "./TerminalPanels";

const TerminalMarketList = dynamic(() => import("./TerminalMarketList"), { ssr: false });
const TerminalPositions = dynamic(() => import("./TerminalPositions"), { ssr: false });
const OrderBook = dynamic(() => import("./TerminalPanels").then(m => ({ default: m.OrderBook })), { ssr: false });
const Trades = dynamic(() => import("./TerminalPanels").then(m => ({ default: m.Trades })), { ssr: false });
const DepthChart = dynamic(() => import("./TerminalPanels").then(m => ({ default: m.DepthChart })), { ssr: false });
const Funding = dynamic(() => import("./TerminalPanels").then(m => ({ default: m.Funding })), { ssr: false });

type ChainId = "arbitrum" | "hyperliquid" | "lighter";

interface MarketSelectorOverlayProps {
  isMobile: boolean;
  chainForMarketList: "arbitrum" | "hyperliquid" | "lighter";
  sym: string;
  livePrices: Record<string, { price: number; change24h: number; vol24h?: number; openInterest?: number; fundingRate?: number }>;
  allMarkets: UnifiedMarket[];
  onSelect: (symbol: string, protocol?: string) => void;
  onClose: () => void;
}

export function MarketSelectorOverlay({
  isMobile, chainForMarketList, sym, livePrices, allMarkets, onSelect, onClose,
}: MarketSelectorOverlayProps) {
  if (isMobile) {
    return (
      <div
        data-testid="market-selector-overlay"
        style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            width: "100%", maxWidth: 420,
            maxHeight: "85vh",
            background: "linear-gradient(165deg, #141820 0%, #0E1218 50%, #111519 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}
          data-testid="market-selector-popup"
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: mono, letterSpacing: "-0.01em" }}>
              Select Market
            </span>
            <button
              onClick={onClose}
              data-testid="btn-close-market-selector"
              style={{
                background: "rgba(255,255,255,0.06)", border: "none",
                borderRadius: 8, width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: T.text3, fontSize: 14,
              }}
            >
              &#x2715;
            </button>
          </div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
          <div style={{ flex: 1, overflow: "auto" }}>
            <TerminalMarketList
              chain={chainForMarketList}
              selectedSymbol={sym}
              onSelect={onSelect}
              livePrices={livePrices}
              unifiedMarkets={allMarkets}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="market-selector-overlay"
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 48,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "min(900px, 90vw)",
          maxHeight: "calc(100vh - 96px)",
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        data-testid="market-selector-popup"
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", borderBottom: `1px solid ${T.border}`,
          background: T.bgCard, flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: mono }}>
            Select Market
          </span>
          <button
            onClick={onClose}
            data-testid="btn-close-market-selector"
            style={{
              background: T.bgEl, border: `1px solid ${T.border}`,
              borderRadius: 6, width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: T.text2, fontSize: 14,
            }}
          >
            &#x2715;
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <TerminalMarketList
            chain={chainForMarketList}
            selectedSymbol={sym}
            onSelect={onSelect}
            livePrices={livePrices}
            unifiedMarkets={allMarkets}
          />
        </div>
      </div>
    </div>
  );
}

interface DataPanelOverlayProps {
  isMobile: boolean;
  dataTab: string;
  bottomTab: "data" | "positions";
  book: BookData | null;
  trades: TradeEntry[];
  depth: DepthData | null;
  panelMarket: { sym: string; price: number };
  sym: string;
  chain: ChainId;
  posRefreshKey: number;
  chainForPositions: "arbitrum" | "hyperliquid" | "lighter";
  livePrices: Record<string, { price: number; change24h: number; vol24h?: number; openInterest?: number; fundingRate?: number }>;
  asterUserId: string | null;
  setDataTab: (t: string) => void;
  setBottomTab: (t: "data" | "positions") => void;
  onClose: () => void;
}

const TABS = ["Order Book", "Trades", "Depth", "Funding"];
const TAB_KEYS = ["orderbook", "trades", "depth", "funding"];

export function DataPanelOverlay({
  isMobile, dataTab, bottomTab, book, trades, depth,
  panelMarket, sym, chain, posRefreshKey, chainForPositions,
  livePrices, asterUserId, setDataTab, setBottomTab, onClose,
}: DataPanelOverlayProps) {
  const renderDataPanel = () => {
    if (dataTab === "orderbook" && book) {
      return <OrderBook book={book} market={panelMarket} marketSymbol={sym} chain={chain} />;
    }
    if (dataTab === "trades") {
      return <Trades trades={trades} />;
    }
    if (dataTab === "depth" && depth) {
      return <DepthChart depth={depth} market={panelMarket} />;
    }
    if (dataTab === "funding") {
      return <Funding />;
    }
    return null;
  };

  const activeLabel = bottomTab === "positions" ? "Positions" : TABS[TAB_KEYS.indexOf(dataTab)] || "Data";

  if (isMobile) {
    return (
      <div
        data-testid="data-panel-overlay"
        style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            width: "100%", maxWidth: 420,
            maxHeight: "80vh",
            background: "linear-gradient(165deg, #141820 0%, #0E1218 50%, #111519 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
          }}
          data-testid="data-panel-popup"
        >
          <div style={{
            padding: "14px 18px 0", flexShrink: 0,
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: T.text, fontFamily: mono, letterSpacing: "-0.01em" }}>{activeLabel}</span>
              <button
                onClick={onClose}
                data-testid="btn-close-data-panel"
                style={{
                  background: "rgba(255,255,255,0.06)", border: "none",
                  borderRadius: 8, width: 30, height: 30,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: T.text3, fontSize: 14,
                }}
              >
                &#x2715;
              </button>
            </div>
            <div style={{
              display: "flex", gap: 4, paddingBottom: 12,
              overflowX: "auto", scrollbarWidth: "none",
            }}>
              {TABS.map((tab, i) => {
                const isActive = dataTab === TAB_KEYS[i] && bottomTab === "data";
                return (
                  <button
                    key={tab}
                    data-testid={`data-popup-tab-${TAB_KEYS[i]}`}
                    onClick={() => { setDataTab(TAB_KEYS[i]); setBottomTab("data"); }}
                    style={{
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      background: isActive ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                      color: isActive ? T.text : T.text3,
                      fontSize: 11, fontWeight: isActive ? 600 : 400,
                      cursor: "pointer", fontFamily: mono, whiteSpace: "nowrap",
                      transition: "all 0.12s",
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
              <button
                data-testid="data-popup-tab-positions"
                onClick={() => setBottomTab("positions")}
                style={{
                  padding: "6px 12px", borderRadius: 8, border: "none",
                  background: bottomTab === "positions" ? "rgba(212,165,116,0.12)" : "rgba(255,255,255,0.03)",
                  color: bottomTab === "positions" ? T.orange : T.text3,
                  fontSize: 11, fontWeight: bottomTab === "positions" ? 600 : 400,
                  cursor: "pointer", fontFamily: mono, whiteSpace: "nowrap",
                  transition: "all 0.12s",
                }}
              >
                Positions
              </button>
            </div>
          </div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {bottomTab === "data" ? renderDataPanel() : (
              <TerminalPositions key={posRefreshKey} chain={chainForPositions} livePrices={livePrices} asterUserId={asterUserId || undefined} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="data-panel-overlay"
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "min(700px, 85vw)",
          maxHeight: "min(500px, 70vh)",
          background: T.bg,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        data-testid="data-panel-popup"
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", borderBottom: `1px solid ${T.border}`,
          background: T.bgCard, flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none", flex: 1, minWidth: 0 }}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                data-testid={`data-popup-tab-${TAB_KEYS[i]}`}
                onClick={() => { setDataTab(TAB_KEYS[i]); setBottomTab("data"); }}
                style={{
                  padding: "10px 12px", border: "none", background: "transparent",
                  color: dataTab === TAB_KEYS[i] && bottomTab === "data" ? T.text : T.text2,
                  fontSize: 11, fontWeight: dataTab === TAB_KEYS[i] && bottomTab === "data" ? 700 : 400,
                  cursor: "pointer",
                  borderBottom: dataTab === TAB_KEYS[i] && bottomTab === "data" ? `2px solid ${T.text}` : "2px solid transparent",
                  fontFamily: mono, whiteSpace: "nowrap",
                }}
              >
                {tab}
              </button>
            ))}
            <button
              data-testid="data-popup-tab-positions"
              onClick={() => setBottomTab("positions")}
              style={{
                padding: "10px 12px", border: "none", background: "transparent",
                color: bottomTab === "positions" ? T.orange : T.text2,
                fontSize: 11, fontWeight: bottomTab === "positions" ? 700 : 400,
                cursor: "pointer",
                borderBottom: bottomTab === "positions" ? `2px solid ${T.orange}` : "2px solid transparent",
                fontFamily: mono, whiteSpace: "nowrap",
              }}
            >
              Positions
            </button>
          </div>
          <button
            onClick={onClose}
            data-testid="btn-close-data-panel"
            style={{
              background: T.bgEl, border: `1px solid ${T.border}`,
              borderRadius: 6, width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: T.text2, fontSize: 14, flexShrink: 0,
            }}
          >
            &#x2715;
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {bottomTab === "data" ? renderDataPanel() : (
            <TerminalPositions key={posRefreshKey} chain={chainForPositions} livePrices={livePrices} asterUserId={asterUserId || undefined} />
          )}
        </div>
      </div>
    </div>
  );
}
