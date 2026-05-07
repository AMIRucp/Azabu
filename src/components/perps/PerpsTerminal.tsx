"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { ASTER_MARKET_LIST, getAsterSymbolFromPerp } from "@/config/asterMarkets";
import type { UnifiedMarket } from "@/types/market";
import { normalizeBaseAsset } from "@/services/marketDeduplicator";
import useMarketStore from "@/stores/useMarketStore";
import { getStockSwapSymbol } from "@/config/stockSwapMap";
import TerminalHeader from "./TerminalHeader";
import { MarketSelectorOverlay, DataPanelOverlay } from "./TerminalOverlays";
import type { BookData, TradeEntry, DepthData } from "./TerminalPanels";
import SimpleTradeCard from "@/components/trade/SimpleTradeCard";
import ActivePositionCard from "@/components/trade/ActivePositionCard";


const TerminalChart = dynamic(() => import("./TerminalChart"), { ssr: false });
const TerminalTradePanel = dynamic(() => import("./TerminalTradePanel"), { ssr: false });
const AsterProTerminal = dynamic(() => import("./AsterProTerminal"), { ssr: false });
const MarketBrowser = dynamic(() => import("./MarketBrowser"), { ssr: false });

const genBookFn = () => import("./TerminalPanels").then(m => m.genBook);
const genTradesFn = () => import("./TerminalPanels").then(m => m.genTrades);
const genDepthFn = () => import("./TerminalPanels").then(m => m.genDepth);

export { T, mono } from "./terminalTheme";
import { T, mono } from "./terminalTheme";

export default function PerpsTerminal() {
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [chain, setChain] = useState<"arbitrum" | "hyperliquid" | "lighter">(() => {
    if (typeof window !== "undefined") {
      const last = localStorage.getItem("afx_last_chain");
      if (last === "arbitrum" || last === "hyperliquid" || last === "lighter") return last;
    }
    return "hyperliquid";
  });
  const [sym, setSym] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("afx_last_market") || "SOL-PERP";
    }
    return "SOL-PERP";
  });
  const [selectedProtocol, setSelectedProtocol] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      const last = localStorage.getItem("afx_last_chain");
      if (last === "hyperliquid") return "hyperliquid";
      if (last === "arbitrum") return "aster";
    }
    return undefined;
  });
  const [dataTab, setDataTab] = useState("orderbook");
  const [bottomTab, setBottomTab] = useState<"data" | "positions">("data");
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const allMarkets = useMarketStore((s) => s.markets);
  const livePrices = useMarketStore((s) => s.livePrices);

  const [book, setBook] = useState<BookData | null>(null);
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [depth, setDepth] = useState<DepthData | null>(null);
  const [posRefreshKey, setPosRefreshKey] = useState(0);
  const [asterUserId, setAsterUserId] = useState<string | null>(null);
  const [mobileSide] = useState<"long" | "short">("long");
  const [mobileTab, setMobileTab] = useState<"trade" | "chart">("chart");
  const [browserMode, setBrowserMode] = useState(true);

  const skipChainReset = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aster_user_id");
      if (stored) setAsterUserId(stored);

      const preselect = localStorage.getItem("afx_preselect_market");
      const preselectProto = localStorage.getItem("afx_preselect_protocol");
      if (preselect) {
        localStorage.removeItem("afx_preselect_market");
        localStorage.removeItem("afx_preselect_protocol");

        if (window.innerWidth < 768) {
          const base = preselect.replace(/USDT?$/, "").replace(/-PERP$/i, "").replace(/\/[A-Z]+$/, "").toUpperCase();
          const proto = preselectProto || "hyperliquid";
          localStorage.setItem("afx_trade_market", JSON.stringify({ sym: base, protocol: proto }));
          localStorage.setItem("afx_perps_asset", base);
          window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "trade" } }));
          return;
        }

        skipChainReset.current = true;
        setSym(preselect);
        setBrowserMode(false);
        localStorage.setItem("afx_last_market", preselect);
        if (preselectProto === "lighter") {
          setChain("lighter");
          setSelectedProtocol("lighter");
          localStorage.setItem("afx_last_chain", "lighter");
        } else if (preselectProto === "hyperliquid") {
          setChain("hyperliquid");
          setSelectedProtocol("hyperliquid");
          localStorage.setItem("afx_last_chain", "hyperliquid");
        } else if (preselect.endsWith("USDT")) {
          setChain("arbitrum");
          setSelectedProtocol("aster");
        } else {
          setChain("hyperliquid");
          setSelectedProtocol(undefined);
        }
      }
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const market = detail?.market;
      const proto = detail?.protocol;
      if (market && detail?.page === "trade") {
        skipChainReset.current = true;
        setSym(market);
        setBrowserMode(false);
        localStorage.setItem("afx_last_market", market);
        if (proto === "lighter") {
          setChain("lighter");
          setSelectedProtocol("lighter");
          localStorage.setItem("afx_last_chain", "lighter");
        } else if (proto === "hyperliquid") {
          setChain("hyperliquid");
          setSelectedProtocol("hyperliquid");
          localStorage.setItem("afx_last_chain", "hyperliquid");
        } else if (market.endsWith("USDT")) {
          setChain("arbitrum");
          setSelectedProtocol("aster");
        } else {
          setChain("hyperliquid");
          setSelectedProtocol(proto || undefined);
        }
      }
    };
    window.addEventListener("afx-navigate", handler);
    return () => window.removeEventListener("afx-navigate", handler);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsMobile(window.innerWidth < 768), 150);
    };
    setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => { window.removeEventListener("resize", check); clearTimeout(timer); };
  }, []);


  useEffect(() => {
    if (skipChainReset.current) {
      skipChainReset.current = false;
      return;
    }
    if (allMarkets.length === 0) return;
    const currentBase = normalizeBaseAsset(sym);
    if (chain === "lighter") {
      const match = allMarkets.find(
        m => m.chain === "lighter" && m.type === "perp" && normalizeBaseAsset(m.baseAsset) === currentBase
      );
      setSym(match?.symbol ?? "SPYd-PERP");
      setSelectedProtocol("lighter");
    } else if (chain === "hyperliquid") {
      const match = allMarkets.find(
        m => m.chain === "hyperliquid" && m.type === "perp" && normalizeBaseAsset(m.baseAsset) === currentBase
      );
      setSym(match?.symbol ?? "BTC");
      setSelectedProtocol("hyperliquid");
    } else if (chain === "arbitrum") {
      const match = allMarkets.find(
        m => m.chain === "arbitrum" && normalizeBaseAsset(m.baseAsset) === currentBase
      );
      setSym(match?.symbol ?? "BTC/USD");
      setSelectedProtocol(match?.protocol ?? "aster");
    } else {
      setSym("BTC");
      setSelectedProtocol("hyperliquid");
    }
  }, [chain]);

  useEffect(() => {
    function handleCmdK(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowMarketSelector(true);
      }
    }
    window.addEventListener('keydown', handleCmdK);
    return () => window.removeEventListener('keydown', handleCmdK);
  }, []);


  useEffect(() => {
    const mid = currentPrice > 0 ? currentPrice : 2000;
    Promise.all([genBookFn(), genTradesFn(), genDepthFn()]).then(([gb, gt, gd]) => {
      setBook(gb(mid));
      setTrades(gt(mid));
      setDepth(gd(mid));
    });
  }, [sym]);

  const chainForMarketList = chain === "arbitrum" ? "arbitrum" as const : chain === "lighter" ? "lighter" as const : "hyperliquid" as const;
  const chainForPositions = chain;

  const isAsterSymbol = sym.endsWith("USDT");
  const rawSym = isAsterSymbol
    ? getAsterSymbolFromPerp(sym)
    : chain === "lighter"
    ? sym.replace(/d-PERP$/i, "").replace(/-PERP$/i, "")
    : chain === "arbitrum"
    ? sym.replace(/\/[A-Z]+$/, "")
    : sym.replace(/-PERP$/i, "").replace(/-USD$/i, "").replace(/^1M/i, "");

  const currentLive = livePrices[sym];
  const currentPrice = currentLive?.price ?? 0;
  const currentChange = currentLive?.change24h ?? 0;

  const marketList = ASTER_MARKET_LIST;
  const selectedMarket = useMemo(() => {
    return marketList.find(m => m.symbol === sym) || marketList[0];
  }, [marketList, sym]);
  const selectedUnifiedMarket = useMemo(() => {
    const proto = selectedProtocol || ({ arbitrum: 'aster', hyperliquid: 'hyperliquid', lighter: 'lighter' } as Record<string, string>)[chain];
    return allMarkets.find(m => m.symbol === sym && m.protocol === proto)
      || allMarkets.find(m => m.symbol === sym);
  }, [allMarkets, sym, chain, selectedProtocol]);
  const unifiedMaxLev = selectedUnifiedMarket?.maxLeverage ?? 0;
  const selectedMaxLev = unifiedMaxLev || selectedMarket?.maxLev || 20;

  const currentVol = currentLive?.vol24h ?? 0;
  const currentOI = currentLive?.openInterest ?? 0;
  const currentFunding = currentLive?.fundingRate ?? 0;

  const tradeMarket = useMemo(() => ({
    sym: rawSym,
    price: currentPrice,
    maxLev: selectedMaxLev,
    marketName: sym,
    protocol: selectedUnifiedMarket?.protocol,
    category: selectedUnifiedMarket?.category,
  }), [rawSym, currentPrice, selectedMaxLev, sym, selectedUnifiedMarket]);

  const panelMarket = useMemo(() => ({
    sym: rawSym,
    price: currentPrice,
  }), [rawSym, currentPrice]);

  const handleSelectMarket = useCallback((symbol: string, protocol?: string, meta?: { category?: string; baseAsset?: string; assetId?: number }) => {
    const category = meta?.category;
    const baseAsset = (meta?.baseAsset ?? symbol.replace(/USDT?$/, "").replace(/-PERP$/i, "").replace(/\/[A-Z]+$/, "")).toUpperCase();
    const assetId = meta?.assetId;

    if (category === "stock") {
      const swapSymbol = getStockSwapSymbol(baseAsset);
      if (swapSymbol) {
        window.dispatchEvent(new CustomEvent("afx-navigate", {
          detail: { page: "swap", outputSymbol: swapSymbol },
        }));
        return;
      }
    }

    if (isMobile) {
      const resolvedProto = protocol || "hyperliquid";
      localStorage.setItem("afx_trade_market", JSON.stringify({ 
        sym: baseAsset, 
        protocol: resolvedProto,
        assetId: assetId 
      }));
      localStorage.setItem("afx_perps_asset", baseAsset);
      localStorage.setItem("afx_last_market", baseAsset);
      const chainVal = resolvedProto === "aster" ? "arbitrum" : resolvedProto;
      localStorage.setItem("afx_last_chain", chainVal);
      window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "trade" } }));
      return;
    }

    setSym(symbol);
    setSelectedProtocol(protocol);
    setBrowserMode(false);
    localStorage.setItem("afx_last_market", symbol);
    if (protocol) {
      const chainMap: Record<string, "arbitrum" | "hyperliquid" | "lighter"> = {
        aster: "arbitrum",
        hyperliquid: "hyperliquid",
        lighter: "lighter",
      };
      const targetChain = chainMap[protocol];
      if (targetChain && targetChain !== chain) {
        skipChainReset.current = true;
        setChain(targetChain);
      }
      if (targetChain) localStorage.setItem("afx_last_chain", targetChain);
    }
    setShowMarketSelector(false);
    setBottomTab("data");
    setDataTab("orderbook");
  }, [chain, isMobile]);

  const handleTradeSuccess = useCallback(() => {
    setPosRefreshKey(k => k + 1);
  }, []);

  const openDataPanel = useCallback((tab: string) => {
    if (tab === "positions") {
      setBottomTab("positions");
    } else {
      setBottomTab("data");
      setDataTab(tab);
    }
    setShowDataPanel(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDataPanel) setShowDataPanel(false);
        else if (showMarketSelector) setShowMarketSelector(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showDataPanel, showMarketSelector]);

  const maxLevLabel = `${selectedMaxLev}x`;

  const crossProtocolData = useMemo(() => {
    if (!rawSym || allMarkets.length === 0) return [];
    const normalizedTarget = normalizeBaseAsset(rawSym);
    return allMarkets.filter(
      m => normalizeBaseAsset(m.baseAsset) === normalizedTarget && m.type === "perp" && m.price > 0
    ).sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
  }, [rawSym, allMarkets]);

  const tabs = ["Order Book", "Trades", "Depth", "Funding"];
  const tabKeys = ["orderbook", "trades", "depth", "funding"];

  const tabBar = (extra?: Record<string, string>) => (
    <div style={{
      display: "flex", gap: 4, padding: "6px 12px",
      borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", flexShrink: 0,
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      ...extra,
    }}>
      {[...tabs, "Positions"].map((label, i) => {
        const key = i < tabs.length ? tabKeys[i] : "positions";
        return (
          <button key={key} data-testid={`perps-tab-${key}`} onClick={() => openDataPanel(key)}
            style={{
              padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: 10, fontWeight: 500,
              fontFamily: mono, whiteSpace: "nowrap",
              color: key === "positions" ? T.orange : T.text2,
            }}>{label}</button>
        );
      })}
    </div>
  );

  const isViewOnly = false;
  const tradePanelProps = {
    market: tradeMarket, chain,
    asterUserId: asterUserId || undefined,
    onTradeSuccess: handleTradeSuccess,
    viewOnly: isViewOnly,
    isMobile,
    selectedProtocol,
    fundingRate: currentFunding,
    openInterest: currentOI,
    volume24h: currentVol,
  } as const;

  return (
    <div
      data-testid="perps-terminal"
      style={{
        background: "#000000", color: T.text, height: "100%", fontFamily: mono,
        display: "flex", flexDirection: "column", overflow: "hidden",
        position: "relative",
      }}
    >
      {(browserMode || isMobile) ? (
        <div style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, overflow: "hidden" }}>
          <MarketBrowser
            allMarkets={allMarkets}
            livePrices={livePrices}
            onSelectMarket={handleSelectMarket}
            isMobile={isMobile}
            activeSym={sym}
          />
        </div>
      ) : (
        <>
          {/* Clean TradePage-style header for desktop market view */}
          <div
            data-testid="perps-market-header"
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 16px",
              borderBottom: "1px solid #1A1D24",
              background: "#000",
              gap: 8,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
              <button
                data-testid="perps-back-to-markets"
                onClick={() => { setBrowserMode(true); localStorage.removeItem("afx_last_market"); localStorage.removeItem("afx_last_chain"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 10px 5px 7px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.04)",
                  cursor: "pointer", flexShrink: 0,
                  color: "rgba(255,255,255,0.45)",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,165,116,0.10)"; e.currentTarget.style.color = "#D4A574"; e.currentTarget.style.borderColor = "rgba(212,165,116,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2.5L4.5 7L9 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", fontFamily: mono, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  Markets
                </span>
              </button>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", whiteSpace: "nowrap" }}>
                {rawSym}-PERP
              </span>
              <img
                src={selectedProtocol === "aster" ? "/tokens/aster-logo.png" : selectedProtocol === "lighter" ? "/tokens/lighter-logo.png" : "/tokens/hyperliquid.webp"}
                alt="venue"
                style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
              />
            </div>
            {currentPrice > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {currentVol > 0 && (
                  <span style={{ fontSize: 10, color: "#6B7280", fontFamily: mono }}>
                    Vol ${currentVol >= 1e6 ? (currentVol / 1e6).toFixed(1) + "M" : currentVol >= 1e3 ? (currentVol / 1e3).toFixed(0) + "K" : currentVol.toFixed(0)}
                  </span>
                )}
                {currentFunding !== 0 && (
                  <span style={{ fontSize: 10, color: currentFunding >= 0 ? "#22C55E" : "#EF4444", fontFamily: mono }}>
                    {currentFunding >= 0 ? "+" : ""}{(currentFunding * 100).toFixed(4)}%
                  </span>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: "#E6EDF3", fontFamily: mono, whiteSpace: "nowrap" }}>
                  ${currentPrice.toLocaleString("en-US", {
                    minimumFractionDigits: currentPrice < 10 ? 4 : 2,
                    maximumFractionDigits: currentPrice < 10 ? 4 : 2,
                  })}
                </span>
                <span style={{ fontSize: 10, color: currentChange >= 0 ? "#22C55E" : "#EF4444", fontFamily: mono, whiteSpace: "nowrap" }}>
                  {currentChange >= 0 ? "+" : ""}{currentChange.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Desktop: chart left with data tabs, SimpleTradeCard right */}
          <div style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, display: "flex", overflow: "hidden" }}>
            <div style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
              <div style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 0, overflow: "hidden", background: T.bg }}>
                <TerminalChart symbol={rawSym} currentPrice={currentPrice} chain={chain} />
              </div>
              {tabBar()}
            </div>
            <div style={{
              width: 390, minWidth: 390, flexShrink: 0, overflow: "auto",
              borderLeft: "1px solid #1A1D24",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ padding: "12px 12px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
                <SimpleTradeCard selectedAsset={rawSym} />
                <ActivePositionCard assetSym={rawSym} />
              </div>
            </div>
          </div>
        </>
      )}

      

      {showMarketSelector && (
        <MarketSelectorOverlay
          isMobile={isMobile}
          chainForMarketList={chainForMarketList}
          sym={sym}
          livePrices={livePrices}
          allMarkets={allMarkets}
          onSelect={handleSelectMarket}
          onClose={() => setShowMarketSelector(false)}
        />
      )}

      {showDataPanel && (
        <DataPanelOverlay
          isMobile={isMobile}
          dataTab={dataTab}
          bottomTab={bottomTab}
          book={book}
          trades={trades}
          depth={depth}
          panelMarket={panelMarket}
          sym={sym}
          chain={chain}
          posRefreshKey={posRefreshKey}
          chainForPositions={chainForPositions}
          livePrices={livePrices}
          asterUserId={asterUserId}
          setDataTab={setDataTab}
          setBottomTab={setBottomTab}
          onClose={() => setShowDataPanel(false)}
        />
      )}
      <img
        src="/azabu-logo.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute", bottom: 6, right: 8,
          width: 18, height: 18, opacity: 0.025,
          pointerEvents: "none", userSelect: "none",
        }}
      />
    </div>
  );
}
