"use client";

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
}

import { useState, useEffect, useCallback, useRef } from "react";
import { usePositionRefresh } from "@/hooks/usePositionRefresh";
import useMarketStore from "@/stores/useMarketStore";
import usePositionStore from "@/stores/usePositionStore";
import { WalletButton } from "@/components/WalletButton";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import MarketTicker from "@/components/MarketTicker";
import dynamic from 'next/dynamic';
import UserHeader from '@/components/UserHeader';
import { initUser, resetUser } from '@/stores/useUserStore';
import useSettingsStore from '@/stores/useSettingsStore';
import { updateTabPnl, updateFavicon, TRADE_SOUNDS } from '@/lib/tradeAnimations';
import type { UnifiedMarket } from '@/types/market';
import MobileNavDrawer from '@/components/perps/MobileNavDrawer';
import MobileBottomNav from '@/components/MobileBottomNav';

const TradePage = dynamic(() => import('@/components/TradePage'), { ssr: false });
const PerpsTerminal = dynamic(() => import('@/components/perps/PerpsTerminal'), { ssr: false });
const SwapPageContent = dynamic(() => import('@/components/SwapPage').then(m => ({ default: m.SwapPageContent })), { ssr: false });
const HomePage = dynamic(() => import('@/components/HomePage'), { ssr: false });
const PortfolioPage = dynamic(() => import('@/components/PortfolioPage'), { ssr: false });
const SettingsPage = dynamic(() => import('@/components/SettingsPage'), { ssr: false });
const HelpModal = dynamic(() => import('@/components/HelpModal'), { ssr: false });
const LeaderboardPage = dynamic(() => import('@/components/LeaderboardPage'), { ssr: false });
type ActivePage = "home" | "trade" | "perps" | "swap" | "portfolio" | "settings" | "leaderboard";

const PRIMARY_NAV: { id: ActivePage; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "trade", label: "Trade" },
  { id: "perps", label: "Markets" },
  { id: "portfolio", label: "Portfolio" },
];

const SECONDARY_NAV: { id: ActivePage; label: string }[] = [
  { id: "swap", label: "Swap" },
  { id: "leaderboard", label: "Leaderboard" },
];

const NAV_ACTIVE = '#D4A574';
const NAV_INACTIVE = '#6B7280';

function NavIconHome({ active }: { active: boolean }) {
  const c = active ? NAV_ACTIVE : NAV_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconSwap({ active }: { active: boolean }) {
  const c = active ? NAV_ACTIVE : NAV_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7 4L3 8L7 12" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8H17C19.2091 8 21 9.79086 21 12" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M17 20L21 16L17 12" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 16H7C4.79086 16 3 14.2091 3 12" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NavIconTrade({ active }: { active: boolean }) {
  const c = active ? '#000' : '#9BA4AE';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 20L7 14L11 16L15 9L21 4" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 4H21V8" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavIconPortfolio({ active }: { active: boolean }) {
  const c = active ? NAV_ACTIVE : NAV_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="2.5" height="16" rx="1.25" fill={c} opacity={active ? 1 : 0.6} />
      <rect x="10.75" y="8" width="2.5" height="12" rx="1.25" fill={c} opacity={active ? 0.85 : 0.5} />
      <rect x="16.5" y="6" width="2.5" height="14" rx="1.25" fill={c} opacity={active ? 0.7 : 0.4} />
    </svg>
  );
}

function NavIconMore({ active }: { active: boolean }) {
  const c = active ? NAV_ACTIVE : NAV_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2" fill={c} />
      <circle cx="12" cy="12" r="2" fill={c} />
      <circle cx="12" cy="19" r="2" fill={c} />
    </svg>
  );
}

const SANS = "Inter, -apple-system, sans-serif";

function HomeInner() {
  return <ExchangeShell />;
}

function MobileChainDots({ evmConnected }: { evmConnected: boolean }) {
  if (!evmConnected) return null;
  return (
    <div
      className="flex items-center gap-1"
      style={{ position: 'absolute', top: -6, right: -2 }}
      data-testid="mobile-chain-dots"
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#28A0F0', boxShadow: '0 0 4px #28A0F060' }} />
    </div>
  );
}

function ExchangeShell() {
  const evmWallet = useEvmWallet();
  const walletAddress = evmWallet.evmAddress || '';
  usePositionRefresh(30000);

  const totalPnl = usePositionStore((s) => s.totalUnrealizedPnl);
  const atRiskCount = usePositionStore((s) => s.atRiskCount);
  const positionCount = usePositionStore((s) => s.positionCount);
  const prevAtRiskRef = useRef(0);

  useEffect(() => {
    const settings = useSettingsStore.getState();
    if (settings.showPnlInTitle && positionCount > 0) {
      updateTabPnl(totalPnl);
      updateFavicon(totalPnl >= 0);
    } else {
      document.title = "Azabu";
    }
  }, [totalPnl, positionCount]);

  useEffect(() => {
    const settings = useSettingsStore.getState();
    if (atRiskCount > prevAtRiskRef.current && settings.soundEnabled) {
      TRADE_SOUNDS.liquidationWarning();
    }
    prevAtRiskRef.current = atRiskCount;
  }, [atRiskCount]);

  const startPolling = useMarketStore((s) => s.startPolling);
  useEffect(() => {
    const stop = startPolling();
    return stop;
  }, [startPolling]);
  const [activePage, setActivePage] = useState<ActivePage>("home");
  const [tradeFromMarkets, setTradeFromMarkets] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = () => setShowHelp(true);
    window.addEventListener("afx-open-help", handler);
    return () => window.removeEventListener("afx-open-help", handler);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      initUser(walletAddress);
    } else {
      resetUser();
    }
  }, [walletAddress]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const validPages = new Set<ActivePage>(["home", "trade", "perps", "swap", "portfolio", "settings", "leaderboard"]);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const page = detail?.page;
      if (page && validPages.has(page)) {
        if (detail?.market) {
          localStorage.setItem("afx_preselect_market", detail.market);
        }
        if (detail?.outputSymbol) {
          localStorage.setItem("afx_swap_output", detail.outputSymbol);
        }
        if (page === "trade") setTradeFromMarkets(true);
        else if (page !== "perps") setTradeFromMarkets(false);
        setActivePage(page);
      }
    };
    window.addEventListener("afx-navigate", handler);
    return () => window.removeEventListener("afx-navigate", handler);
  }, []);


  const handleSelectMarket = useCallback((market: UnifiedMarket) => {
    localStorage.setItem('afx_preselect_market', market.symbol);
    if (market.protocol) {
      localStorage.setItem('afx_preselect_protocol', market.protocol);
    } else {
      localStorage.removeItem('afx_preselect_protocol');
    }
    setTradeFromMarkets(true);
    setActivePage("trade");
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden" style={{ background: '#000000' }}>
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activePage={activePage}
        onNavigateTrade={() => { setTradeFromMarkets(false); setActivePage("trade"); setDrawerOpen(false); }}
        onNavigateMarkets={() => { setActivePage("perps"); setDrawerOpen(false); }}
        onOpenMarkets={() => { setActivePage("home"); setDrawerOpen(false); }}
        onOpenPortfolio={() => { setActivePage("portfolio"); setDrawerOpen(false); }}
        onNavigateSwap={() => { setActivePage("swap"); setDrawerOpen(false); }}
        onOpenSettings={() => { setActivePage("settings"); setDrawerOpen(false); }}
        onNavigateLeaderboard={() => { setActivePage("leaderboard"); setDrawerOpen(false); }}
      />

      <header
        className="shrink-0 hidden sm:flex items-center justify-center"
        style={{
          background: '#000000', borderBottom: '1px solid #1C1C1C',
          height: 44, padding: '0 16px', position: 'relative',
        }}
        data-testid="exchange-header"
      >
        {/* Logo - positioned absolutely on left */}
        <div className="absolute left-4 flex items-center" style={{ gap: 10, flexShrink: 0 }}>
          <img
            src="/azabu-logo.png"
            alt="Azabu"
            style={{ width: 28, height: 28, objectFit: "contain" }}
            data-testid="img-logo-desktop"
          />
        </div>

        {/* Desktop inline nav - truly centered */}
        <nav className="flex items-center" style={{ gap: 2 }}>
          {[...PRIMARY_NAV, ...SECONDARY_NAV].map(({ id, label }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => {
                  if (id === "trade") setTradeFromMarkets(false);
                  setActivePage(id);
                }}
                data-testid={`desktop-nav-${id}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                  color: active ? '#D4A574' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(212,165,116,0.08)' : 'transparent',
                  transition: 'all 0.15s',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* User header + Wallet - positioned absolutely on right */}
        <div className="absolute right-4 flex items-center shrink-0" style={{ gap: 6 }}>
          <UserHeader
            onDisconnect={() => {
              resetUser();
              evmWallet.disconnectEvm().catch(() => {});
            }}
          />
          <WalletButton />
        </div>
      </header>

      <header
        className="sm:hidden shrink-0 flex items-center px-3 justify-between"
        style={{ background: '#000000', borderBottom: '1px solid #1C1C1C', height: 44 }}
        data-testid="exchange-header-mobile"
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <img
            src="/azabu-logo.png"
            alt="Azabu"
            style={{ width: 28, height: 28, objectFit: "contain" }}
            data-testid="img-logo-mobile"
          />
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)' }} />
          <button
            onClick={() => setDrawerOpen(true)}
            data-testid="mobile-nav-drawer-trigger"
            style={{
              display: 'flex', alignItems: 'center',
              padding: '7px 14px', borderRadius: 10,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.015) 30%)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.1s',
              color: 'rgba(255,255,255,0.88)', fontSize: 14, fontWeight: 500,
              letterSpacing: '0.2px',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 6px 20px rgba(0,0,0,0.35)',
              WebkitTapHighlightColor: 'transparent',
            }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {activePage === 'settings' ? 'Settings' : [...PRIMARY_NAV, ...SECONDARY_NAV].find(n => n.id === activePage)?.label || 'Home'}
          </button>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <WalletButton />
        </div>
      </header>

      <div className="hidden sm:block">
        <MarketTicker />
      </div>

      <main className="flex-1 min-h-0 overflow-hidden sm:pb-0 pb-[72px]">
        <ErrorBoundary>
          {activePage === "home" && (
            <div className="afx-page-enter h-full overflow-y-auto" data-testid="page-home">
              <HomePage />
            </div>
          )}

          {activePage === "trade" && (
            <div className="afx-page-enter" style={{ height: "100%", overflow: "hidden" }} data-testid="page-trade">
              <TradePage fromMarkets={tradeFromMarkets} />
            </div>
          )}

          {activePage === "perps" && (
            <div className="afx-page-enter" style={{ height: "100%", overflow: "hidden" }} data-testid="page-perps">
              <PerpsTerminal />
            </div>
          )}

          {activePage === "swap" && (
            <div className="afx-page-enter h-full overflow-y-auto flex items-start justify-center" style={{ paddingTop: 16, paddingBottom: 32, paddingLeft: 16, paddingRight: 16 }} data-testid="page-swap">
              <SwapPageContent embedded />
            </div>
          )}

          {activePage === "portfolio" && (
            <div className="afx-page-enter h-full overflow-y-auto" data-testid="page-portfolio">
              <PortfolioPage />
            </div>
          )}

          {activePage === "settings" && (
            <div className="afx-page-enter h-full overflow-y-auto" data-testid="page-settings-wrapper">
              <SettingsPage />
            </div>
          )}

          {activePage === "leaderboard" && (
            <div className="afx-page-enter h-full overflow-y-auto" data-testid="page-leaderboard">
              <LeaderboardPage />
            </div>
          )}

        </ErrorBoundary>
      </main>


      <MobileBottomNav
        activePage={activePage}
        onNavigate={(page) => {
          if (page === "trade") setTradeFromMarkets(false);
          setActivePage(page);
        }}
      />

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

export default function Home() {
  return <HomeInner />;
}
