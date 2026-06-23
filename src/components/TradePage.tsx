"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import useMarketStore from "@/stores/useMarketStore";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useIsMobile } from "@/hooks/useIsMobile";
import TradePageHeader from "@/components/trade/TradePageHeader";
import TradeOrderBookColumn from "@/components/trade/TradeOrderBookColumn";
import TradeSidebar from "@/components/trade/TradeSidebar";
import TradeBottomPanel from "@/components/trade/TradeBottomPanel";
import { tradePageTokens as T } from "@/components/trade/tradePageTokens";

const TerminalChart = dynamic(() => import("@/components/perps/TerminalChart"), { ssr: false });

const MARKET_KEY = "afx_trade_market";

interface CanonicalMarket {
  sym: string;
  protocol: string;
  assetId?: number;
  baseAsset?: string;
}

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

interface TradePageProps {
  fromMarkets?: boolean;
}

export default function TradePage({ fromMarkets: _fromMarkets = false }: TradePageProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [mobileView, setMobileView] = useState<"chart" | "trade">("chart");
  const [posRefreshKey, setPosRefreshKey] = useState(0);

  const [selectedAsset, setSelectedAsset] = useState<string>(() => {
    if (typeof window === "undefined") return "SOL";
    return readCanonicalMarket()?.sym ?? "SOL";
  });
  const [assetProtocol, setAssetProtocol] = useState<string>(() => {
    if (typeof window === "undefined") return "hyperliquid";
    return readCanonicalMarket()?.protocol ?? "hyperliquid";
  });
  const [assetId, setAssetId] = useState<number | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return readCanonicalMarket()?.assetId;
  });

  const allMarkets = useMarketStore((s) => s.markets);
  const livePrices = useMarketStore((s) => s.livePrices);
  const { evmAddress } = useEvmWallet();

  const forcedProtocol =
    assetProtocol === "aster" || assetProtocol === "hyperliquid" || assetProtocol === "lighter"
      ? assetProtocol
      : undefined;

  useEffect(() => {
    setMounted(true);
    const m = readCanonicalMarket();
    if (m) {
      setSelectedAsset(m.sym);
      setAssetProtocol(m.protocol);
      if (m.assetId !== undefined) setAssetId(m.assetId);
    }
  }, []);

  const handleAssetChange = useCallback((sym: string, protocol?: string, meta?: { assetId?: number; baseAsset?: string }) => {
    const resolvedProtocol = protocol || "hyperliquid";
    setSelectedAsset(sym);
    setAssetProtocol(resolvedProtocol);
    if (meta?.assetId !== undefined) setAssetId(meta.assetId);
    writeCanonicalMarket({
      sym,
      protocol: resolvedProtocol,
      assetId: meta?.assetId,
      baseAsset: meta?.baseAsset,
    });
  }, []);

  const chain: "arbitrum" | "hyperliquid" | "lighter" =
    assetProtocol === "aster" ? "arbitrum" : assetProtocol === "lighter" ? "lighter" : "hyperliquid";
  const rawSym = assetProtocol === "aster" ? `${selectedAsset}USDT` : `${selectedAsset}-PERP`;

  const selectedUnifiedMarket = useMemo(() => {
    return (
      allMarkets.find((m) => m.baseAsset.toUpperCase() === selectedAsset.toUpperCase() && m.protocol === assetProtocol) ||
      allMarkets.find((m) => m.baseAsset.toUpperCase() === selectedAsset.toUpperCase() && m.type === "perp")
    );
  }, [allMarkets, selectedAsset, assetProtocol]);

  const maxLev = selectedUnifiedMarket?.maxLeverage ?? 20;
  const category = selectedUnifiedMarket?.category;

  const resolveLive = useCallback(() => {
    const keys = [rawSym, `${selectedAsset}-PERP`, `${selectedAsset}USDT`, selectedAsset];
    for (const k of keys) {
      if (livePrices[k]) return livePrices[k];
    }
    return null;
  }, [rawSym, selectedAsset, livePrices]);

  const live = resolveLive();

  const currentPrice = live?.price ?? selectedUnifiedMarket?.price ?? null;
  const priceChange = live?.change24h ?? selectedUnifiedMarket?.change24h ?? null;
  const fundingRate = live?.fundingRate ?? selectedUnifiedMarket?.fundingRate ?? null;
  const vol24h = live?.vol24h ?? selectedUnifiedMarket?.volume24h;
  const openInterest = live?.openInterest ?? selectedUnifiedMarket?.openInterest;

  const tradeMarket = useMemo(
    () => ({
      sym: selectedAsset,
      price: currentPrice ?? 0,
      maxLev,
      marketName: rawSym,
      protocol: assetProtocol,
      category,
      assetId: assetId ?? selectedUnifiedMarket?.assetId,
      szDecimals: selectedUnifiedMarket?.szDecimals,
    }),
    [selectedAsset, currentPrice, maxLev, rawSym, assetProtocol, category, assetId, selectedUnifiedMarket]
  );

  const handleTradeSuccess = useCallback(() => {
    setPosRefreshKey((k) => k + 1);
  }, []);

  if (!mounted) {
    return (
      <div style={{ height: "100%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${T.stroke}`, borderTopColor: T.orange, animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const chartNode = (
    <div style={{ width: "100%", height: "100%", position: "relative", background: T.bg }}>
      <TerminalChart symbol={rawSym} currentPrice={currentPrice ?? 0} chain={chain} tradeLayout />
    </div>
  );

  const header = (
    <TradePageHeader
      selectedAsset={selectedAsset}
      assetProtocol={assetProtocol}
      rawSym={rawSym}
      currentPrice={currentPrice}
      priceChange={priceChange}
      fundingRate={fundingRate}
      vol24h={vol24h}
      openInterest={openInterest}
      maxLev={maxLev}
      category={category}
      isMobile={isMobile}
      onAssetChange={handleAssetChange}
    />
  );

  if (isMobile) {
    return (
      <div data-testid="trade-page" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg, fontFamily: T.sans }}>
        {header}
        <div style={{ display: "flex", gap: 4, padding: "0 16px 10px" }}>
          <div style={{ display: "flex", background: T.inputBg, borderRadius: 10, padding: 3, border: `1px solid ${T.stroke}` }}>
            {(["chart", "trade"] as const).map((v) => {
              const active = mobileView === v;
              return (
                <button
                  key={v}
                  data-testid={`trade-view-${v}`}
                  onClick={() => setMobileView(v)}
                  style={{
                    padding: "6px 16px", borderRadius: 8, border: "none",
                    background: active ? T.tabActiveBg : "transparent",
                    color: active ? T.white : T.label,
                    fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: T.sans, cursor: "pointer",
                  }}
                >
                  {v === "chart" ? "Chart" : "Trade"}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: mobileView === "trade" ? "auto" : "hidden" }}>
          {mobileView === "chart" ? chartNode : (
            <TradeSidebar
              market={tradeMarket} chain={chain} selectedProtocol={forcedProtocol}
              fundingRate={fundingRate ?? undefined} openInterest={openInterest} volume24h={vol24h}
              asterUserId={evmAddress || undefined} onTradeSuccess={handleTradeSuccess} isMobile
            />
          )}
        </div>
        <TradeBottomPanel key={posRefreshKey} isMobile onTradeSuccess={handleTradeSuccess} />
      </div>
    );
  }

  return (
    <div data-testid="trade-page" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg, fontFamily: T.sans }}>
      {header}

      {/* Figma layout: chart+bottom left | orderbook | trade panel (full height right columns) */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", padding: "0 32px 24px", gap: 0 }}>
        {/* Left column: chart + positions */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderRight: `1px solid ${T.stroke}` }}>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", borderBottom: `1px solid ${T.stroke}` }}>
            {chartNode}
          </div>
          <TradeBottomPanel key={posRefreshKey} embedded onTradeSuccess={handleTradeSuccess} />
        </div>

        <TradeOrderBookColumn symbol={rawSym} chain={chain} currentPrice={currentPrice ?? 0} />

        <TradeSidebar
          market={tradeMarket}
          chain={chain}
          selectedProtocol={forcedProtocol}
          fundingRate={fundingRate ?? undefined}
          openInterest={openInterest}
          volume24h={vol24h}
          asterUserId={evmAddress || undefined}
          onTradeSuccess={handleTradeSuccess}
        />
      </div>
    </div>
  );
}
