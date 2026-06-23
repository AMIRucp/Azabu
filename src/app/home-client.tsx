"use client";

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const noop = () => { };
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
import dynamic from 'next/dynamic';
import { initUser, resetUser } from '@/stores/useUserStore';
import useSettingsStore from '@/stores/useSettingsStore';
import { updateTabPnl, updateFavicon, TRADE_SOUNDS } from '@/lib/tradeAnimations';
import type { UnifiedMarket } from '@/types/market';
import MobileNavDrawer from '@/components/perps/MobileNavDrawer';
import { HomeAmbientBackground } from '@/components/dashboard/HomeAmbientBackground';
import { DesktopExchangeHeader } from '@/components/dashboard/DesktopExchangeHeader';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Menu } from 'lucide-react';
import {
  VALID_PAGES,
  type ActivePage,
} from '@/config/exchangeNav';
const TradePage = dynamic(() => import('@/components/TradePage'), { ssr: false });
const PerpsTerminal = dynamic(() => import('@/components/perps/PerpsTerminal'), { ssr: false });
const SwapPageContent = dynamic(() => import('@/components/swap/SwapPage').then(m => ({ default: m.SwapPageContent })), { ssr: false });
const DashboardPage = dynamic(() => import('@/components/dashboard/DashboardPage'), { ssr: false });
const PortfolioPage = dynamic(() => import('@/components/PortfolioPage'), { ssr: false });
const SettingsPage = dynamic(() => import('@/components/SettingsPage'), { ssr: false });
const HelpModal = dynamic(() => import('@/components/HelpModal'), { ssr: false });
const LeaderboardPage = dynamic(() => import('@/components/leaderboard/LeaderboardPage'), { ssr: false });

function ExchangeShell() {
  // collapse the desktop nav into the hamburger header below 1024px
  const isMobile = useIsMobile(1024);
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

  const handleDesktopNavigate = useCallback((page: ActivePage, options?: { fromMarkets?: boolean }) => {
    if (page === "trade") setTradeFromMarkets(options?.fromMarkets ?? false);
    else if (page !== "perps") setTradeFromMarkets(false);
    setActivePage(page);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const page = detail?.page;
      if (page && VALID_PAGES.has(page)) {
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
    <div className="flex flex-col h-[100dvh] overflow-hidden" style={{ background: '#050505', position: 'relative' }}>
      {activePage === "home" && <HomeAmbientBackground />}

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

      {!isMobile ? (
        <DesktopExchangeHeader
          activePage={activePage}
          onNavigate={handleDesktopNavigate}
          showTicker={activePage === "home"}
        />
      ) : null}

      {isMobile ? (
      <header
        className="shrink-0 flex items-center justify-between px-4"
        style={{
          position: 'relative',
          zIndex: 2,
          background: '#050505',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          height: 48,
        }}
        data-testid="exchange-header-mobile"
      >
        <img
          src="/Azabu%20logo.png"
          alt="Azabu"
          style={{ width: 72, height: 22, objectFit: "contain", flexShrink: 0 }}
          data-testid="img-logo-mobile"
        />

        <div className="flex items-center gap-3 shrink-0">
          <WalletButton navbar />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            data-testid="mobile-nav-drawer-trigger"
            aria-label="Open menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.88)',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>
        </div>
      </header>
      ) : null}

      <main className="flex-1 min-h-0 overflow-hidden" style={{ position: "relative", zIndex: 1 }}>
        <ErrorBoundary>
          {activePage === "home" && (
            <div className="afx-page-enter h-full overflow-y-auto" data-testid="page-home">
              <DashboardPage />
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


      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

export default function Home() {
  return <ExchangeShell />;
}
