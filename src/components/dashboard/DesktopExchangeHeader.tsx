"use client";

import { useCallback } from "react";
import { WalletButton } from "@/components/WalletButton";
import MarketTicker from "@/components/MarketTicker";
import {
  EXTRA_NAV,
  PRIMARY_NAV,
  SECONDARY_NAV,
  type ActivePage,
  type NavItem,
} from "@/config/exchangeNav";
import { dashboardTokens } from "./tokens";

const { font, color } = dashboardTokens;

const SHELL_STYLE = {
  overflow: "visible" as const,
  background: "transparent",
  zIndex: 1,
  paddingTop: 4,
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
};

const HEADER_STYLE = {
  background: "transparent",
  borderBottom: "none",
  height: 52,
  padding: "0 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  position: "relative" as const,
  zIndex: 1,
};

const NAV_GROUP_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  minWidth: 0,
  marginLeft: 60,
};

const LEFT_CLUSTER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  minWidth: 0,
};

type DesktopExchangeHeaderProps = {
  activePage: ActivePage;
  onNavigate: (page: ActivePage, options?: { fromMarkets?: boolean }) => void;
  showTicker?: boolean;
};

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={item.disabled}
      data-testid={`desktop-nav-${item.id}`}
      style={{
        padding: "7px 16px",
        borderRadius: 9999,
        cursor: item.disabled ? "default" : "pointer",
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        fontFamily: font.sans,
        color: active ? color.white : item.disabled ? "rgba(156,163,175,0.55)" : color.navInactive,
        background: "transparent",
        border: active ? "1px solid rgba(255,255,255,0.22)" : "1px solid transparent",
        lineHeight: "20px",
        transition: "color 0.15s, border-color 0.15s",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!active && !item.disabled) e.currentTarget.style.color = color.navHover;
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = item.disabled ? "rgba(156,163,175,0.55)" : color.navInactive;
        }
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {item.label}
        {item.comingSoon ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: "rgba(156,163,175,0.55)",
              letterSpacing: "0.02em",
            }}
          >
            Coming soon
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function DesktopExchangeHeader({
  activePage,
  onNavigate,
  showTicker = false,
}: DesktopExchangeHeaderProps) {
  const handleNavClick = useCallback(
    (item: NavItem) => {
      if (item.disabled || item.id === "predictions") return;
      onNavigate(item.id as ActivePage, { fromMarkets: false });
    },
    [onNavigate],
  );

  const renderNavItem = (item: NavItem) => (
    <NavButton
      key={item.id}
      item={item}
      active={activePage === item.id}
      onClick={() => handleNavClick(item)}
    />
  );

  return (
    <div className="shrink-0 relative" style={SHELL_STYLE}>
      <header style={HEADER_STYLE} data-testid="exchange-header">
        <div style={LEFT_CLUSTER_STYLE}>
          <img
            src="/Azabu%20logo.png"
            alt="Azabu"
            style={{ height: 26, width: "auto", objectFit: "contain", flexShrink: 0, marginLeft: 12 }}
            data-testid="img-logo-desktop"
          />

          <nav style={NAV_GROUP_STYLE} aria-label="Main navigation">
            {[...PRIMARY_NAV, ...SECONDARY_NAV, ...EXTRA_NAV].map(renderNavItem)}
          </nav>
        </div>

        <div className="flex items-center shrink-0" style={{ zIndex: 30 }}>
          <WalletButton navbar />
        </div>
      </header>

      {showTicker ? <MarketTicker /> : null}
    </div>
  );
}
