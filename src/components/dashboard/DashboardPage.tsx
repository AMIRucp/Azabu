"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { fmtPct, fmtUsd, navigateApp } from "./formatters";
import { cardStyle, dashboardTokens, sectionTitleStyle } from "./tokens";
import { useDashboardData } from "./useDashboardData";
import { DashboardSidebar } from "./ui/DashboardSidebar";
import { OpenPositionCard } from "./ui/OpenPositionCard";
import { PortfolioOverviewTitle } from "./ui/PortfolioOverviewTitle";
import { SectionLink } from "./ui/SectionLink";
import { StatCard } from "./ui/StatCard";
import { TodaysMovers } from "./ui/TodaysMovers";
import { TrendingPerpCard } from "./ui/TrendingPerpCard";

const { font, color, layout } = dashboardTokens;

export default function DashboardPage() {
  const isMobile = useIsMobile();
  const data = useDashboardData();

  const {
    balancesLoading,
    useDemo,
    moverTab,
    setMoverTab,
    callerRank,
    topEntries,
    portfolioValue,
    todayPnl,
    todayPnlPct,
    unrealisedPnl,
    displayPositionCount,
    displayFreeMargin,
    freeMarginPct,
    marginRatioPct,
    trendingCards,
    movers,
    moversLoading,
    openPositions,
    positionsLoading,
    displayXp,
    proTarget,
    xpToPro,
    displayHandle,
  } = data;

  return (
    <div
      data-testid="page-home-content"
      style={{ minHeight: "100%", background: "transparent", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          boxSizing: "border-box",
          padding: isMobile ? "12px 16px 48px" : "0 24px 48px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : `minmax(0, 1fr) ${layout.sidebarWidth}px`,
          gap: isMobile ? 24 : 20,
          alignItems: "start",
        }}
      >
        <div
          style={{
            minWidth: 0,
            paddingTop: isMobile ? 0 : layout.tickerToContentGap,
          }}
        >
          <section style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                width: "100%",
                minHeight: isMobile ? "auto" : layout.portfolioOverviewHeight,
                marginBottom: isMobile ? 14 : 16,
                gap: isMobile ? 8 : 0,
              }}
            >
              <PortfolioOverviewTitle isMobile={isMobile} />
              <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: isMobile ? layout.portfolioBalanceSizeMobile : 36,
                    fontWeight: 600,
                    color: color.white,
                    fontFamily: font.sans,
                    lineHeight: 1,
                  }}
                >
                  {balancesLoading && !useDemo ? "—" : fmtUsd(portfolioValue, { compact: isMobile })}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 11 : 13,
                    fontWeight: 500,
                    marginTop: isMobile ? 4 : 8,
                    fontFamily: font.sans,
                    color: todayPnl >= 0 ? color.green : color.red,
                    whiteSpace: isMobile ? "nowrap" : undefined,
                  }}
                >
                  {fmtUsd(todayPnl, { signed: true, compact: isMobile })} today {fmtPct(todayPnlPct)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
                gap: isMobile ? 10 : 12,
              }}
            >
              <StatCard
                label="Today's PnL"
                value={fmtUsd(todayPnl, { signed: true, compact: isMobile })}
                sub={fmtPct(todayPnlPct)}
                valueColor={todayPnl >= 0 ? color.green : color.red}
                subColor={todayPnl >= 0 ? color.green : color.red}
                isMobile={isMobile}
              />
              <StatCard
                label={isMobile ? "Unrealised" : "Unrealised PnL"}
                value={fmtUsd(unrealisedPnl, { signed: true, compact: isMobile })}
                sub={isMobile ? undefined : `${displayPositionCount} open position${displayPositionCount === 1 ? "" : "s"}`}
                valueColor={unrealisedPnl >= 0 ? color.green : color.red}
                subColor={color.label}
                isMobile={isMobile}
              />
              <StatCard
                label={isMobile ? "Margin" : "Available Margin"}
                value={fmtUsd(displayFreeMargin, { compact: true })}
                sub={isMobile ? undefined : `${freeMarginPct.toFixed(1)}% free`}
                subColor={color.label}
                isMobile={isMobile}
              />
              <StatCard
                label={isMobile ? "Ratio" : "Margin Ratio"}
                value={`${marginRatioPct.toFixed(1)}%`}
                sub={isMobile ? undefined : marginRatioPct < 50 ? "Healthy" : marginRatioPct < 80 ? "Moderate" : "High"}
                valueColor={marginRatioPct < 50 ? color.green : marginRatioPct < 80 ? "#D4A574" : color.red}
                subColor={marginRatioPct < 50 ? color.green : marginRatioPct < 80 ? "#D4A574" : color.red}
                isMobile={isMobile}
              />
            </div>
          </section>

          {!isMobile && (
          <section style={{ marginBottom: 52 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={sectionTitleStyle}>Open Positions</h2>
              <SectionLink label="View all in Portfolio" onClick={() => navigateApp("portfolio")} />
            </div>
            {positionsLoading && openPositions.length === 0 ? (
              <div
                style={{
                  ...cardStyle,
                  padding: "24px",
                  minHeight: layout.openPositionCardHeight,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 400, color: color.label, fontFamily: font.sans }}>
                  Loading positions…
                </span>
              </div>
            ) : openPositions.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {openPositions.map((position) => (
                  <OpenPositionCard key={position.id} position={position} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  ...cardStyle,
                  padding: "24px",
                  minHeight: layout.openPositionCardHeight,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                data-testid="open-positions-empty"
              >
                <span style={{ fontSize: 13, fontWeight: 400, color: color.label, fontFamily: font.sans }}>
                  No open positions available at this time.
                </span>
              </div>
            )}
          </section>
          )}

          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={sectionTitleStyle}>Trending Perpetuals</h2>
              <SectionLink label="See all" onClick={() => navigateApp("perps")} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {trendingCards.map((market) => (
                <TrendingPerpCard
                  key={market.baseAsset}
                  baseAsset={market.baseAsset}
                  price={market.price}
                  change24h={market.change24h}
                  volume24h={market.volume24h}
                  oi={market.oi}
                  symbol={market.symbol}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </section>

          <TodaysMovers
            movers={movers}
            moverTab={moverTab}
            onTabChange={setMoverTab}
            isLoading={moversLoading}
          />
        </div>

        <div
          style={{
            alignSelf: "start",
            paddingTop: isMobile ? 0 : layout.sidebarTopPad,
            display: isMobile ? "none" : undefined,
          }}
        >
          <DashboardSidebar
            portfolioValue={portfolioValue}
            displayFreeMargin={displayFreeMargin}
            todayPnl={todayPnl}
            marginRatioPct={marginRatioPct}
            callerRank={callerRank}
            displayXp={displayXp}
            proTarget={proTarget}
            xpToPro={xpToPro}
            displayHandle={displayHandle}
            topEntries={topEntries}
          />
        </div>
      </div>
    </div>
  );
}
