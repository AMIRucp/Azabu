"use client";

import dynamic from "next/dynamic";
import { tradePageTokens as T } from "./tradePageTokens";

const TerminalTradePanel = dynamic(() => import("@/components/perps/TerminalTradePanel"), { ssr: false });

interface TradeSidebarProps {
  market: {
    sym: string;
    price: number;
    maxLev: number;
    marketName?: string;
    protocol?: string;
    category?: string;
    assetId?: number;
    szDecimals?: number;
  };
  chain: "arbitrum" | "hyperliquid" | "lighter";
  selectedProtocol?: string;
  fundingRate?: number;
  openInterest?: number;
  volume24h?: number;
  asterUserId?: string;
  onTradeSuccess?: () => void;
  isMobile?: boolean;
}

export default function TradeSidebar({
  market, chain, selectedProtocol, fundingRate, openInterest, volume24h,
  asterUserId, onTradeSuccess, isMobile,
}: TradeSidebarProps) {
  return (
    <div
      data-testid="trade-sidebar"
      style={{
        width: isMobile ? "100%" : T.sidebarWidth,
        flexShrink: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: T.cardBg,
        borderLeft: isMobile ? "none" : `1px solid ${T.stroke}`,
        marginTop: isMobile ? 0 : -70,
        alignSelf: isMobile ? "stretch" : "flex-start",
        height: isMobile ? "auto" : "calc(100% + 32px)",
        position: "relative",
      }}
    >
      <div className="trade-figma-panel" style={{ flex: 1, minHeight: 30, minWidth: 0, overflow: "auto" }}>
        <TerminalTradePanel
          market={market}
          chain={chain}
          asterUserId={asterUserId}
          onTradeSuccess={onTradeSuccess}
          selectedProtocol={selectedProtocol}
          fundingRate={fundingRate}
          openInterest={openInterest}
          volume24h={volume24h}
          isMobile={isMobile}
          figmaLayout
        />
      </div>
    </div>
  );
}
