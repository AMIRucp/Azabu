"use client";

import { useEffect, useState, type ReactNode } from "react";
import { mono } from "./terminalTheme";
import {
  MarketsIcon,
  TradeIcon,
  SwapIcon,
  PortfolioIcon,
  LeaderboardIcon,
  SettingsIcon,
  PredictionsIcon,
  LanguageIcon,
  DocsIcon,
} from "../navIcons";

const SANS = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
const DASHBOARD_NAV_ICON = "/icons/dashboard-nav.png";
const TEXT_INACTIVE = "#9CA3AF";
const TEXT_ACTIVE = "#FFFFFF";
const PANEL_GRADIENT = "linear-gradient(180deg, rgba(22,22,22,0.9) 0%, rgba(10,10,10,0.9) 100%)";

function DashboardNavIcon({ active, size = 18 }: { active: boolean; size?: number }) {
  return (
    <img
      src={DASHBOARD_NAV_ICON}
      alt=""
      width={size}
      height={size}
      style={{
        display: "block",
        objectFit: "contain",
        flexShrink: 0,
        opacity: active ? 1 : 0.72,
        transition: "opacity 0.2s",
      }}
    />
  );
}

function NavItem({
  icon,
  label,
  onClick,
  active,
  disabled,
  comingSoon,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ padding: "2px 12px" }}>
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          width: "100%",
          padding: "10px 12px",
          cursor: disabled ? "default" : "pointer",
          textAlign: "left",
          border: "none",
          borderRadius: 10,
          transition: "background 0.2s",
          outline: "none",
          background: active
            ? "rgba(255,255,255,0.06)"
            : hovered && !disabled
              ? "rgba(255,255,255,0.03)"
              : "transparent",
        }}
      >
        <span style={{ flexShrink: 0, display: "flex", width: 18, justifyContent: "center" }}>{icon}</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            lineHeight: "20px",
            color: disabled
              ? "rgba(156,163,175,0.55)"
              : active
                ? TEXT_ACTIVE
                : TEXT_INACTIVE,
            fontFamily: SANS,
            flex: 1,
            letterSpacing: 0,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {label}
            {comingSoon ? (
              <span style={{ fontSize: 10, fontWeight: 400, color: "rgba(156,163,175,0.45)" }}>
                Coming soon
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </div>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        color: "rgba(156,163,175,0.7)",
        textDecoration: "none",
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = TEXT_INACTIVE; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(156,163,175,0.7)"; }}
    >
      {children}
    </a>
  );
}

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  chain?: "arbitrum" | "hyperliquid";
  activePage?: string;
  marketCount?: number;
  onNavigateTrade?: () => void;
  onNavigateMarkets?: () => void;
  onOpenMarkets: () => void;
  onOpenPortfolio: () => void;
  onOpenSettings: () => void;
  onNavigateSwap: () => void;
  onNavigateLeaderboard?: () => void;
}

export default function MobileNavDrawer({
  open,
  onClose,
  activePage,
  onNavigateTrade,
  onNavigateMarkets,
  onOpenMarkets,
  onOpenPortfolio,
  onOpenSettings,
  onNavigateSwap,
  onNavigateLeaderboard,
}: MobileNavDrawerProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isHome = activePage === "home";
  const isTrade = activePage === "trade";
  const isMarkets = activePage === "perps";
  const isSwap = activePage === "swap";
  const isLeaderboard = activePage === "leaderboard";
  const isSettings = activePage === "settings";

  const closeAnd = (fn?: () => void) => {
    fn?.();
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.22s ease",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      <nav
        aria-label="Mobile navigation"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          bottom: 16,
          zIndex: 201,
          width: 287,
          maxWidth: "calc(100vw - 32px)",
          background: PANEL_GRADIENT,
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 16,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(calc(100% + 16px))",
          opacity: open ? 1 : 0,
          transition: "transform 0.26s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.2s ease",
          willChange: "transform, opacity",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
          overflow: "hidden",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "16px 16px 4px",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            data-testid="mobile-drawer-close"
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: 24,
              height: 24,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: TEXT_INACTIVE,
              padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingTop: 4, paddingBottom: 8 }}>
          <NavItem
            active={isHome}
            onClick={() => closeAnd(onOpenMarkets)}
            label="Dashboard"
            icon={<DashboardNavIcon active={isHome} size={18} />}
          />
          <NavItem
            active={isTrade}
            onClick={() => closeAnd(onNavigateTrade)}
            label="Trade"
            icon={<TradeIcon active={isTrade} size={18} />}
          />
          <NavItem
            active={isMarkets}
            onClick={() => closeAnd(onNavigateMarkets)}
            label="Markets"
            icon={<MarketsIcon active={isMarkets} size={18} />}
          />
          <NavItem
            label="Portfolio"
            disabled
            icon={<PortfolioIcon active={false} size={18} />}
          />
          <NavItem
            active={isSwap}
            onClick={() => closeAnd(onNavigateSwap)}
            label="Swap"
            icon={<SwapIcon active={isSwap} size={18} />}
          />
          <NavItem
            active={isLeaderboard}
            onClick={() => closeAnd(onNavigateLeaderboard)}
            label="Leaderboard"
            icon={<LeaderboardIcon active={isLeaderboard} size={18} />}
          />
          <NavItem
            label="Predictions"
            disabled
            comingSoon
            icon={<PredictionsIcon active={false} disabled size={18} />}
          />

          <div style={{ margin: "8px 24px", height: 1, background: "rgba(255,255,255,0.06)" }} />

          <NavItem
            active={isSettings}
            onClick={() => closeAnd(onOpenSettings)}
            label="Settings"
            icon={<SettingsIcon active={isSettings} size={18} />}
          />
          <NavItem
            onClick={() => closeAnd(onOpenSettings)}
            label="Language"
            icon={<LanguageIcon active={false} size={18} />}
          />
          <NavItem
            onClick={() => {
              window.open("https://docs.azabu.fi", "_blank", "noopener,noreferrer");
              onClose();
            }}
            label="Docs"
            icon={<DocsIcon active={false} size={18} />}
          />
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: "14px 20px",
            paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(156,163,175,0.55)",
              fontFamily: mono,
            }}
          >
            Charts by TradingView
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SocialLink href="https://x.com/azabufi" label="X">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </SocialLink>
            <SocialLink href="https://azabu.fi" label="Website">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </SocialLink>
            <SocialLink href="https://github.com/azabufi" label="GitHub">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </SocialLink>
            <SocialLink href="https://t.me/azabufi" label="Telegram">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </SocialLink>
            <SocialLink href="https://discord.gg/azabufi" label="Discord">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </SocialLink>
          </div>
        </div>
      </nav>
    </>
  );
}
