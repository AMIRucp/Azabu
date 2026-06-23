"use client";

import type { UnifiedMarket } from "@/types/market";
import { TokenLogo } from "@/components/TokenLogo";
import { getHyperliquidCoinLogo } from "@/config/tokenIcons";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MOVER_META } from "../demoData";
import { fmtPct, fmtPrice, navigateApp, navigateMarket } from "../formatters";
import type { MoverTab } from "../useDashboardData";
import { cardStyle, dashboardTokens, moverTableHeaderStyle, sectionTitleStyle } from "../tokens";
import { SectionLink } from "./SectionLink";
import { TradeButton } from "./TradeButton";

const { font, color, layout } = dashboardTokens;

const MOVER_TABS: { id: MoverTab; label: string }[] = [
  { id: "gainers", label: "Top Gainers" },
  { id: "losers", label: "Top Losers" },
  { id: "active", label: "Most Active" },
];

function moverSubtext(market: UnifiedMarket) {
  const meta = MOVER_META[market.baseAsset];
  const name = meta?.name || market.baseAsset;
  const lev = market.maxLeverage ?? meta?.maxLeverage ?? 50;
  if (market.baseAsset === "SOL") return `${lev}x`;
  return `${name} · ${lev}x`;
}

function moverDisplaySymbol(market: UnifiedMarket) {
  if (market.symbol?.includes("-")) {
    return market.symbol.replace(/-USDC$/i, "-PERP").replace(/-USDT$/i, "-PERP");
  }
  return `${market.baseAsset}-PERP`;
}

type TodaysMoversProps = {
  movers: UnifiedMarket[];
  moverTab: MoverTab;
  onTabChange: (tab: MoverTab) => void;
  isLoading?: boolean;
};

export function TodaysMovers({ movers, moverTab, onTabChange, isLoading = false }: TodaysMoversProps) {
  const isMobile = useIsMobile();
  const rowGrid = isMobile ? layout.moversTableGridMobile : layout.moversTableGrid;
  const padX = isMobile ? layout.moversTablePadXMobile : layout.moversTablePadX;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: isMobile ? "nowrap" : "wrap",
          gap: 10,
        }}
      >
        <h2 style={{ ...sectionTitleStyle, ...(isMobile ? { flexShrink: 1, minWidth: 0 } : {}) }}>Today&apos;s Movers</h2>
        {isMobile ? (
          <SectionLink label="Full markets" onClick={() => navigateApp("perps")} />
        ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {MOVER_TABS.map((tab) => {
            const active = moverTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 9999,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: font.sans,
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.22)" : "1px solid transparent",
                  color: active ? color.white : color.label,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            );
          })}
          <div style={{ marginLeft: 4 }}>
            <SectionLink label="Full markets" onClick={() => navigateApp("perps")} />
          </div>
        </div>
        )}
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: rowGrid,
            padding: `${layout.moversTableHeaderPadY}px ${padX}px`,
            borderBottom: `1px solid ${color.stroke}`,
            alignItems: "center",
          }}
        >
          <span style={moverTableHeaderStyle}>Market</span>
          <span style={moverTableHeaderStyle}>Price</span>
          {!isMobile && <span style={moverTableHeaderStyle}>24h %</span>}
          <span style={isMobile ? { ...moverTableHeaderStyle, textAlign: "right" } : undefined}>
            {isMobile ? "Action" : ""}
          </span>
        </div>

        {isLoading ? (
          <div
            style={{
              padding: "28px 18px",
              textAlign: "center",
              fontSize: 13,
              fontWeight: 400,
              color: color.label,
              fontFamily: font.sans,
            }}
          >
            Loading markets…
          </div>
        ) : movers.length === 0 ? (
          <div
            style={{
              padding: "28px 18px",
              textAlign: "center",
              fontSize: 13,
              fontWeight: 400,
              color: color.label,
              fontFamily: font.sans,
            }}
            data-testid="movers-empty"
          >
            No market data available.
          </div>
        ) : (
        movers.map((market, index) => {
          const positive = market.change24h >= 0;
          const isLast = index === movers.length - 1;

          return (
            <div
              key={market.id}
              style={{
                display: "grid",
                gridTemplateColumns: rowGrid,
                padding: `${layout.moversTableRowPadY}px ${padX}px`,
                alignItems: "center",
                borderBottom: isLast ? "none" : `1px solid ${color.stroke}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <TokenLogo
                  symbol={market.baseAsset}
                  src={getHyperliquidCoinLogo(market.baseAsset)}
                  size={isMobile ? 28 : 26}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: color.white,
                      fontFamily: font.sans,
                      lineHeight: 1.2,
                    }}
                  >
                    {moverDisplaySymbol(market)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 400,
                      color: color.label,
                      fontFamily: font.sans,
                      marginTop: 2,
                      lineHeight: "15px",
                      ...(isMobile ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {}),
                    }}
                  >
                    {moverSubtext(market)}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: color.white,
                  fontFamily: font.mono,
                  lineHeight: 1.2,
                  textAlign: "left",
                  ...(isMobile ? { whiteSpace: "nowrap" } : {}),
                }}
              >
                ${fmtPrice(market.price)}
              </span>

              {!isMobile && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: "left",
                  color: positive ? color.green : color.red,
                  fontFamily: font.mono,
                  lineHeight: 1.2,
                }}
              >
                {fmtPct(market.change24h)}
              </span>
              )}

              <div style={{ justifySelf: "end" }}>
                <TradeButton onClick={() => navigateMarket(market.baseAsset)} iconSize={13} />
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
