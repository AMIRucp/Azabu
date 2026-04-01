"use client";

import { useState, type ReactNode } from "react";
import { HomeIcon, MarketsIcon, TradeIcon, SwapIcon, PortfolioIcon } from "./navIcons";

type ActivePage = "home" | "trade" | "perps" | "swap" | "portfolio" | "settings" | "leaderboard";

const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const ACCENT = "#D4A574";
const ACCENT_LIGHT = "#E8C4A0";
const INACTIVE = "rgba(255,255,255,0.30)";

interface NavTab {
  id: ActivePage;
  label: string;
  icon: (active: boolean) => ReactNode;
  center?: boolean;
}

const TABS: NavTab[] = [
  { id: "home", label: "Home", icon: (a) => <HomeIcon active={a} /> },
  { id: "perps", label: "Markets", icon: (a) => <MarketsIcon active={a} /> },
  { id: "trade", label: "Trade", icon: (a) => <TradeIcon active={a} />, center: true },
  { id: "swap", label: "Swap", icon: (a) => <SwapIcon active={a} /> },
  { id: "portfolio", label: "Portfolio", icon: (a) => <PortfolioIcon active={a} /> },
];

interface MobileBottomNavProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

export default function MobileBottomNav({ activePage, onNavigate }: MobileBottomNavProps) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 150,
        background: "rgba(4,4,8,0.88)",
        backdropFilter: "blur(24px) saturate(1.2)",
        WebkitBackdropFilter: "blur(24px) saturate(1.2)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      data-testid="mobile-bottom-nav"
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${ACCENT}22, transparent)`,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          padding: "0 4px",
          height: 58,
        }}
      >
        {TABS.map((tab) => {
          const active = activePage === tab.id;

          if (tab.center) {
            return (
              <CenterTab
                key={tab.id}
                tab={tab}
                active={active}
                onNavigate={onNavigate}
              />
            );
          }

          return (
            <TabButton
              key={tab.id}
              tab={tab}
              active={active}
              onNavigate={onNavigate}
            />
          );
        })}
      </div>
    </nav>
  );
}

function TabButton({ tab, active, onNavigate }: { tab: NavTab; active: boolean; onNavigate: (p: ActivePage) => void }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={() => onNavigate(tab.id)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      data-testid={`nav-tab-${tab.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        flex: 1,
        height: 54,
        background: "none",
        border: "none",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        padding: 0,
        position: "relative",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.1s ease",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            top: -1,
            left: "50%",
            transform: "translateX(-50%)",
            width: 16,
            height: 2,
            borderRadius: 1,
            background: ACCENT,
            boxShadow: `0 0 8px ${ACCENT}60`,
          }}
        />
      )}

      <span style={{
        display: "flex",
        transition: "transform 0.15s ease",
        transform: active ? "translateY(-1px)" : "translateY(0)",
      }}>
        {tab.icon(active)}
      </span>

      <span style={{
        fontSize: 9.5,
        fontWeight: active ? 600 : 400,
        color: active ? ACCENT_LIGHT : INACTIVE,
        fontFamily: SANS,
        letterSpacing: "0.02em",
        lineHeight: 1,
        transition: "color 0.15s ease",
      }}>
        {tab.label}
      </span>
    </button>
  );
}

function CenterTab({ tab, active, onNavigate }: { tab: NavTab; active: boolean; onNavigate: (p: ActivePage) => void }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={() => onNavigate(tab.id)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      data-testid={`nav-tab-${tab.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        flex: 1,
        height: 54,
        background: "none",
        border: "none",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        padding: 0,
        position: "relative",
        transform: pressed ? "scale(0.92)" : "scale(1)",
        transition: "transform 0.1s ease",
      }}
    >
      <div
        style={{
          width: 44,
          height: 36,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active
            ? `linear-gradient(135deg, ${ACCENT}20 0%, ${ACCENT}10 100%)`
            : "rgba(255,255,255,0.03)",
          border: active
            ? `1px solid ${ACCENT}25`
            : "1px solid rgba(255,255,255,0.04)",
          transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          boxShadow: active
            ? `0 0 12px ${ACCENT}15, inset 0 1px 0 rgba(255,255,255,0.06)`
            : "none",
          position: "relative",
        }}
      >
        {tab.icon(active)}
      </div>

      <span style={{
        fontSize: 9.5,
        fontWeight: active ? 600 : 500,
        color: active ? "#fff" : "rgba(255,255,255,0.45)",
        fontFamily: SANS,
        letterSpacing: "0.02em",
        lineHeight: 1,
        transition: "color 0.15s ease",
      }}>
        {tab.label}
      </span>
    </button>
  );
}
