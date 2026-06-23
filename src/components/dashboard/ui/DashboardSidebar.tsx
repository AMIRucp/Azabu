"use client";

import type { ReactNode } from "react";
import { DEMO_PORTFOLIO } from "../demoData";
import { callsignInitials, fmtLeaderboardXp, fmtUsd, navigateApp } from "../formatters";
import type { LeaderboardEntry } from "../useDashboardData";
import {
  accountCardLabelStyle,
  accountCardRowLabelStyle,
  accountCardRowValueStyle,
  dashboardTokens,
  rankCardStyle,
  sidebarCardStyle,
} from "../tokens";

const { font, color, gradient, layout } = dashboardTokens;

const rankNumberGradientStyle = {
  background: gradient.rankNumber,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
} as const;

function RankNumber({ rank }: { rank: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        lineHeight: 1,
        fontFamily: font.sans,
        fontWeight: 700,
        letterSpacing: "-0.02em",
      }}
    >
      <span style={{ fontSize: 38, ...rankNumberGradientStyle }}>#</span>
      <span style={{ fontSize: 52, ...rankNumberGradientStyle }}>{rank}</span>
    </div>
  );
}

function LeaderAvatar({ initials }: { initials: string }) {
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "#1B2433",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        fontWeight: 700,
        color: "#8EC8FF",
        fontFamily: font.sans,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

type DashboardSidebarProps = {
  portfolioValue: number;
  displayFreeMargin: number;
  todayPnl: number;
  marginRatioPct: number;
  callerRank: number | null;
  displayXp: number;
  proTarget: number;
  xpToPro: number;
  displayHandle: string;
  topEntries: LeaderboardEntry[];
};

export function DashboardSidebar({
  portfolioValue,
  displayFreeMargin,
  todayPnl,
  marginRatioPct,
  callerRank,
  displayXp,
  proTarget,
  xpToPro,
  displayHandle,
  topEntries,
}: DashboardSidebarProps) {
  const accountRows: { id: string; label: ReactNode; value: string; color?: string }[] = [
    { id: "portfolio", label: "Portfolio value", value: fmtUsd(portfolioValue, { compact: true }) },
    { id: "margin", label: "Available margin", value: fmtUsd(displayFreeMargin, { compact: true }) },
    {
      id: "pnl",
      label: (
        <>
          Today&apos;s
          <br />
          PnL
        </>
      ),
      value: fmtUsd(todayPnl, { signed: true }),
      color: todayPnl >= 0 ? color.green : color.red,
    },
    {
      id: "ratio",
      label: "Margin ratio",
      value: `${marginRatioPct.toFixed(1)}%`,
      color: color.green,
    },
    { id: "network", label: "Network", value: "Arbitrum" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        width: layout.sidebarWidth,
      }}
    >
      <div
        style={{
          ...sidebarCardStyle,
          padding: layout.accountCardPad,
          width: layout.accountCardWidth,
          height: layout.accountCardHeight,
          boxSizing: "border-box",
          alignSelf: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ ...accountCardLabelStyle, marginBottom: layout.accountCardHeaderGap }}>ACCOUNT</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: layout.accountCardRowGap,
          }}
        >
          {accountRows.map((row) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <span style={{ ...accountCardRowLabelStyle, flexShrink: 0 }}>{row.label}</span>
              <span style={{ ...accountCardRowValueStyle, color: row.color || color.white }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          ...rankCardStyle,
          marginTop: 20,
          padding: `${layout.rankCardPadY}px ${layout.rankCardPadX}px ${layout.rankCardPadY}px ${layout.rankCardPadLeft}px`,
          width: layout.rankCardWidth,
          height: layout.rankCardHeight,
          boxSizing: "border-box",
          alignSelf: "center",
          display: "flex",
          flexDirection: "column",
          gap: layout.rankCardGap,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: color.rankLabel,
              letterSpacing: "0.12em",
              fontFamily: font.display,
              textTransform: "uppercase",
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            MY RANK
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: color.white,
                  fontFamily: font.sans,
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                THIS WEEK
              </div>
              <RankNumber rank={callerRank ?? DEMO_PORTFOLIO.rank} />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: color.rankMeta,
                  fontFamily: font.sans,
                  marginTop: 8,
                  lineHeight: 1.3,
                }}
              >
                {displayHandle} · {DEMO_PORTFOLIO.level}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: color.orange, fontFamily: font.sans, lineHeight: 1 }}>
                {displayXp.toLocaleString()} XP
              </div>
              <div style={{ fontSize: 11, color: color.label, fontFamily: font.sans, marginTop: 8 }}>
                {xpToPro > 0 ? `${xpToPro.toLocaleString()} to Pro` : "Pro tier reached"}
              </div>
            </div>
          </div>

          <div
            style={{
              height: 5,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              marginTop: 16,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                width: `${Math.min(100, proTarget > 0 ? (displayXp / proTarget) * 100 : 0)}%`,
                background: gradient.rankProgress,
              }}
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 0,
            paddingTop: layout.rankListPadTop,
          }}
        >
          {topEntries.map((entry) => (
            <div
              key={entry.rank}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: color.label,
                    fontFamily: font.mono,
                    width: 12,
                    flexShrink: 0,
                  }}
                >
                  {entry.rank}
                </span>
                <LeaderAvatar initials={callsignInitials(entry.callsign)} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: color.white,
                    fontFamily: font.sans,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.callsign}
                </span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: color.white, fontFamily: font.mono, flexShrink: 0 }}>
                {fmtLeaderboardXp(entry.xp)}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigateApp("leaderboard")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: layout.leaderboardBtnWidth,
            maxWidth: "100%",
            alignSelf: "center",
            height: layout.leaderboardBtnHeight,
            flexShrink: 0,
            padding: 0,
            borderRadius: 999,
            border: "none",
            background: gradient.leaderboardBtn,
            color: color.white,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: font.sans,
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          View Leaderboard
        </button>
      </div>
    </div>
  );
}
