import useUserStore, { saveUser } from '@/stores/useUserStore';
import useSettingsStore from '@/stores/useSettingsStore';

export const XP_EVENTS = {
  TRADE_EXECUTED: 25,
  TRADE_PROFITABLE: 10,
  FIRST_TRADE_TODAY: 50,
  STREAK_DAY: 15,
  NEW_MARKET_TRADED: 40,
  USED_LIMIT_ORDER: 20,
  USED_TP_SL: 15,
  CROSSED_CHAINS: 60,
  SWAPPED_TOKENS: 20,
  BRIDGED_CROSS_CHAIN: 75,
} as const;

// Japanese tier system — matches the badge design doc exactly
// L1-5=Novice, L6-15=Challenger, L16-30=Trader, L31-50=Pro, L51-75=Elite, L76+=Legend
export const LEVELS = [
  // Novice tier (L1-5)
  { level: 1,  xp: 0,       rank: 'Novice',     tier: 'novice',     color: '#9CA3AF' },
  { level: 2,  xp: 100,     rank: 'Novice',     tier: 'novice',     color: '#9CA3AF' },
  { level: 3,  xp: 200,     rank: 'Novice',     tier: 'novice',     color: '#9CA3AF' },
  { level: 4,  xp: 350,     rank: 'Novice',     tier: 'novice',     color: '#9CA3AF' },
  { level: 5,  xp: 500,     rank: 'Novice',     tier: 'novice',     color: '#9CA3AF' },
  // Challenger tier (L6-15)
  { level: 6,  xp: 700,     rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 7,  xp: 950,     rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 8,  xp: 1200,    rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 9,  xp: 1500,    rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 10, xp: 1800,    rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 11, xp: 2200,    rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 12, xp: 2700,    rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 13, xp: 3300,    rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 14, xp: 4000,    rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  { level: 15, xp: 5000,    rank: 'Challenger', tier: 'challenger', color: '#22C55E' },
  // Trader tier (L16-30)
  { level: 16, xp: 6000,    rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 17, xp: 7200,    rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 18, xp: 8600,    rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 19, xp: 10000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 20, xp: 12000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 21, xp: 14500,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 22, xp: 17500,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 23, xp: 21000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 24, xp: 25000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 25, xp: 30000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 26, xp: 36000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 27, xp: 43000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 28, xp: 51000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 29, xp: 60000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  { level: 30, xp: 70000,   rank: 'Trader',     tier: 'trader',     color: '#3B82F6' },
  // Pro tier (L31-50)
  { level: 31, xp: 82000,   rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 32, xp: 96000,   rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 33, xp: 112000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 34, xp: 130000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 35, xp: 150000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 36, xp: 175000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 37, xp: 200000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 38, xp: 230000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 39, xp: 260000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 40, xp: 300000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 41, xp: 345000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 42, xp: 395000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 43, xp: 450000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 44, xp: 510000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 45, xp: 580000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 46, xp: 660000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 47, xp: 750000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 48, xp: 850000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 49, xp: 960000,  rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  { level: 50, xp: 1000000, rank: 'Pro',        tier: 'pro',        color: '#A855F7' },
  // Elite tier (L51-75)
  { level: 51, xp: 1100000, rank: 'Elite',      tier: 'elite',      color: '#F59E0B' },
  { level: 60, xp: 2000000, rank: 'Elite',      tier: 'elite',      color: '#F59E0B' },
  { level: 75, xp: 5000000, rank: 'Elite',      tier: 'elite',      color: '#F59E0B' },
  // Legend tier (L76+)
  { level: 76, xp: 6000000, rank: 'Legend',     tier: 'legend',     color: '#EF4444' },
] as const;

type LevelEntry = typeof LEVELS[number];

export function getLevelInfo(xp: number): { current: LevelEntry; next: LevelEntry | null; progress: number } {
  // Find the highest level threshold that xp meets
  let current: LevelEntry = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xp) current = l;
  }
  const nextIdx = LEVELS.findIndex((l) => l.level === current.level + 1);
  const next = nextIdx !== -1 ? LEVELS[nextIdx] : null;
  const progress = next ? Math.min((xp - current.xp) / (next.xp - current.xp), 1) : 1;
  return { current, next, progress };
}

function showXpToast(points: number) {
  if (typeof document === 'undefined') return;
  if (!useSettingsStore.getState().showXpNotifications) return;
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed; bottom:32px; right:16px; z-index:9999;
    font-family:'IBM Plex Mono',monospace; font-size:10px;
    color:rgba(212,165,116,0.5); pointer-events:none;
    animation: xpFloat 1.5s ease forwards;
  `;
  el.textContent = `+${points} xp`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

function showLevelUpToast(level: LevelEntry, prevTier: string) {
  if (typeof document === 'undefined') return;
  const tierChanged = level.tier !== prevTier;
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed; top:60px; left:50%; transform:translateX(-50%); z-index:9999;
    background:#12151A; border:1px solid ${level.color}40; border-radius:8px;
    padding:10px 20px; display:flex; align-items:center; gap:12px;
    font-family:'IBM Plex Mono',monospace; min-width:240px;
    animation: slideIn 0.3s ease, fadeOut 0.3s ease 3s forwards;
  `;
  el.innerHTML = `
    <img src="/badges/tier-${level.tier}.svg" width="40" height="40" style="border-radius:50%;flex-shrink:0" />
    <div>
      <div style="font-size:10px;font-weight:700;color:${level.color}">${tierChanged ? 'TIER UP' : 'LEVEL UP'}</div>
      <div style="font-size:12px;font-weight:700;color:#F0F2F5">${level.rank} · Level ${level.level}</div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function awardXp(event: keyof typeof XP_EVENTS) {
  const store = useUserStore.getState();
  if (!store.initialized) return;

  const points = XP_EVENTS[event];
  const newXp = store.xp + points;
  const { current: newLevel } = getLevelInfo(newXp);
  const { current: oldLevel } = getLevelInfo(store.xp);
  const leveled = newLevel.level > store.level;

  useUserStore.setState({
    xp: newXp,
    level: newLevel.level,
    rank: newLevel.rank,
  });
  saveUser();

  showXpToast(points);

  if (leveled) {
    showLevelUpToast(newLevel, oldLevel.tier);
  }
}

export function recordTrade(params: {
  volume: number;
  profitable?: boolean;
  chain?: string;
  protocol?: string;
  market?: string;
}) {
  const store = useUserStore.getState();
  if (!store.initialized) return;

  const isNewMarket = params.market && !store.marketsTraded.includes(params.market);

  const updates: Partial<typeof store> = {
    totalTrades: store.totalTrades + 1,
    totalVolume: store.totalVolume + params.volume,
    lastActive: new Date().toISOString(),
  };

  if (params.chain && !store.chainsTraded.includes(params.chain)) {
    updates.chainsTraded = [...store.chainsTraded, params.chain];
  }
  if (params.protocol && !store.protocolsTraded.includes(params.protocol)) {
    updates.protocolsTraded = [...store.protocolsTraded, params.protocol];
  }
  if (params.market && isNewMarket) {
    updates.marketsTraded = [...store.marketsTraded, params.market];
  }

  useUserStore.setState(updates);
  saveUser();

  awardXp('TRADE_EXECUTED');

  if (params.profitable) {
    awardXp('TRADE_PROFITABLE');
  }

  if (isNewMarket) {
    awardXp('NEW_MARKET_TRADED');
  }
}
