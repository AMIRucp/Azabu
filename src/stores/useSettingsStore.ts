"use client";
import { create } from 'zustand';

export interface Settings {
  defaultSizeMode: 'USD' | 'BASE';
  defaultLeverage: number;
  confirmBeforeTrade: boolean;
  showLeverageWarnings: boolean;
  autoSetTpSl: boolean;
  defaultTpPercent: number;
  defaultSlPercent: number;

  suggestBridges: boolean;
  autoBridgeEnabled: boolean;
  bridgeDismissed: boolean;

  showXpNotifications: boolean;
  showAchievements: boolean;
  showGlitchEffects: boolean;
  showScanlines: boolean;
  compactMode: boolean;
  defaultChartTimeframe: string;

  soundEnabled: boolean;
  soundVolume: number;

  showLiquidationAlerts: boolean;
  showPriceAlerts: boolean;
  showTradeToasts: boolean;

  showPnlInTitle: boolean;
  hideBalances: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  defaultSizeMode: 'USD',
  defaultLeverage: 100,
  confirmBeforeTrade: true,
  showLeverageWarnings: true,
  autoSetTpSl: false,
  defaultTpPercent: 5,
  defaultSlPercent: 3,
  suggestBridges: true,
  autoBridgeEnabled: false,
  bridgeDismissed: false,
  showXpNotifications: true,
  showAchievements: true,
  showGlitchEffects: true,
  showScanlines: true,
  compactMode: false,
  defaultChartTimeframe: '1h',
  soundEnabled: false,
  soundVolume: 0.15,
  showLiquidationAlerts: true,
  showPriceAlerts: true,
  showTradeToasts: true,
  showPnlInTitle: true,
  hideBalances: false,
};

function loadSettings(): Partial<Settings> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('afx-settings') || '{}');
  } catch {
    return {};
  }
}

const useSettingsStore = create<Settings & { update: (partial: Partial<Settings>) => void }>((set) => ({
  ...DEFAULT_SETTINGS,
  ...loadSettings(),
  update: (partial) => set(state => {
    const { update: _, ...current } = state;
    const next = { ...current, ...partial };
    try {
      localStorage.setItem('afx-settings', JSON.stringify(next));
    } catch {}
    return next;
  }),
}));

export default useSettingsStore;
