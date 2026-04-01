import useUserStore, { saveUser } from '@/stores/useUserStore';
import { getLevelInfo } from '@/services/xpService';
import { BADGE_DEFINITIONS } from '@/components/Badge';

// XP reward per achievement (keyed by badge id)
const ACHIEVEMENT_XP: Record<string, number> = {
  'first-blood':      50,
  'century':          250,
  'thousand-cuts':    1000,
  'degen':            75,
  'max-degen':        200,
  'leverage-god':     500,
  'burning-spirit':   150,
  'inferno':          750,
  'eternal-flame':    5000,
  'explorer':         100,
  'globe-trotter':    400,
  'protocol-tourist': 200,
  'night-owl':        75,
  'sniper':           200,
  'diamond-hands':    300,
  'survivor':         150,
  'comeback-kid':     500,
  'on-fire':          200,
  'untouchable':      1000,
  'og':               500,
  'top-10':           750,
  'whale':            250,
};

// State for tracking per-session data (non-persisted across reloads)
let _consecutiveWins = 0;
let _lastLiquidatedAt: number | null = null;
let _maxLeverageMarketsCount = 0;
const _maxLeverageMarkets = new Set<string>();

export function resetConsecutiveWins() {
  _consecutiveWins = 0;
}

export function recordLiquidation() {
  _lastLiquidatedAt = Date.now();
}

/**
 * Award an achievement by badge id.
 * Shows a rich achievement toast using the badge SVG art.
 */
export function checkAchievement(id: string) {
  const store = useUserStore.getState();
  if (!store.initialized) return false;
  if (store.achievements.includes(id)) return false;

  const def = BADGE_DEFINITIONS.find((b) => b.id === id);
  if (!def) return false;

  const xpBonus = ACHIEVEMENT_XP[id] || 0;
  const newXp = store.xp + xpBonus;
  const { current: newLevel } = getLevelInfo(newXp);

  useUserStore.setState({
    achievements: [...store.achievements, id],
    xp: newXp,
    level: newLevel.level,
    rank: newLevel.rank,
  });
  saveUser();

  // Fire the rich achievement toast
  showAchievementToast(id, def.name, def.japanese, def.rarity, xpBonus);

  return true; // newly earned
}

function rarityColor(rarity: string): string {
  switch (rarity) {
    case 'uncommon':  return '#22C55E';
    case 'rare':      return '#3B82F6';
    case 'epic':      return '#A855F7';
    case 'legendary': return '#F59E0B';
    case 'mythic':    return '#FFD700';
    default:          return '#9CA3AF';
  }
}

function showAchievementToast(id: string, name: string, japanese: string, rarity: string, xpBonus: number) {
  if (typeof document === 'undefined') return;
  const color = rarityColor(rarity);

  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed; top:68px; right:16px; z-index:9999;
    background:#12151A;
    border:1px solid ${color}44;
    box-shadow:0 0 16px ${color}22;
    border-radius:10px;
    padding:10px 14px;
    display:flex; align-items:center; gap:12px;
    font-family:'IBM Plex Mono',monospace;
    min-width:220px; max-width:300px;
    animation: slideIn 0.35s ease, fadeOut 0.4s ease 3.5s forwards;
    cursor:pointer;
  `;
  el.innerHTML = `
    <img src="/badges/${id}.svg"
         width="44" height="44"
         style="border-radius:50%;flex-shrink:0;ring:2px solid ${color};box-shadow:0 0 8px ${color}66" />
    <div style="flex:1;min-width:0">
      <div style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${color};margin-bottom:1px">${rarity} · badge unlocked</div>
      <div style="font-size:12px;font-weight:700;color:#F0F2F5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
      <div style="font-size:15px;color:${color};font-family:serif;line-height:1.1">${japanese}</div>
    </div>
    ${xpBonus ? `<div style="font-size:10px;color:rgba(212,165,116,0.7);flex-shrink:0">+${xpBonus} xp</div>` : ''}
  `;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/**
 * Main achievement check — call this after every trade with full params.
 */
export function checkTradeAchievements(params: {
  leverage?: number;
  category?: string;
  pnl?: number;
  sizeUsd?: number;
  entryPrice?: number;
  closePrice?: number;
  market?: string;
  isLiquidated?: boolean;
  winConsecutive?: boolean;
}) {
  const store = useUserStore.getState();
  if (!store.initialized) return;

  // --- Trading milestones ---
  if (store.totalTrades >= 1)    checkAchievement('first-blood');
  if (store.totalTrades >= 100)  checkAchievement('century');
  if (store.totalTrades >= 1000) checkAchievement('thousand-cuts');

  // --- Leverage ---
  if (params.leverage) {
    if (params.leverage >= 100) checkAchievement('degen');
    if (params.leverage >= 300) checkAchievement('max-degen');

    // Leverage god: max leverage on 5 different markets
    if (params.market) {
      const maxLevMap: Record<string, number> = {
        'BTC': 125, 'ETH': 100, 'SOL': 75, 'BNB': 75,
        // approximate max levs — any value >= known max
      };
      const knownMax = maxLevMap[params.market?.toUpperCase?.() ?? ''] ?? 125;
      if (params.leverage >= knownMax * 0.95) {
        _maxLeverageMarkets.add(params.market);
        if (_maxLeverageMarkets.size >= 5) checkAchievement('leverage-god');
      }
    }
  }

  // --- Streaks ---
  if (store.streak >= 7)   checkAchievement('burning-spirit');
  if (store.streak >= 30)  checkAchievement('inferno');
  if (store.streak >= 100) checkAchievement('eternal-flame');

  // --- Market exploration ---
  const marketsCount = store.marketsTraded.length;
  if (marketsCount >= 5)  checkAchievement('explorer');
  if (marketsCount >= 25) checkAchievement('globe-trotter');

  // --- Protocol tourist (all 3 venues traded) ---
  const protocols = store.protocolsTraded;
  const hasAllVenues = ['aster', 'hyperliquid', 'lighter'].every(
    (v) => protocols.some((p) => p.toLowerCase().includes(v))
  );
  if (hasAllVenues) checkAchievement('protocol-tourist');

  // --- Night owl: trade between midnight-4am UTC ---
  const utcHour = new Date().getUTCHours();
  if (utcHour < 4) checkAchievement('night-owl');

  // --- Sniper: close within 0.5% of entry ---
  if (params.entryPrice && params.closePrice && params.entryPrice > 0) {
    const pctDiff = Math.abs(params.closePrice - params.entryPrice) / params.entryPrice;
    if (pctDiff <= 0.005 && pctDiff > 0) checkAchievement('sniper');
  }

  // --- Whale: position >= $10k notional ---
  if (params.sizeUsd && params.sizeUsd >= 10000) checkAchievement('whale');

  // --- Survivor: liquidated then traded again within 24h ---
  if (params.isLiquidated) {
    recordLiquidation();
  } else if (_lastLiquidatedAt && Date.now() - _lastLiquidatedAt < 86400000) {
    checkAchievement('survivor');
    _lastLiquidatedAt = null; // reset after earning
  }

  // --- Win streaks ---
  if (params.winConsecutive === true) {
    _consecutiveWins += 1;
    if (_consecutiveWins >= 5)  checkAchievement('on-fire');
    if (_consecutiveWins >= 20) checkAchievement('untouchable');
  } else if (params.winConsecutive === false) {
    _consecutiveWins = 0; // streak broken
  }

  // --- P&L based ---
  if (params.pnl !== undefined) {
    // PnL checks don't directly award badges but are used by the recovery logic
    // Comeback kid is handled externally when drawdown->breakeven is detected
  }
}

/**
 * Check if the user traded during the OG launch window.
 * Call this on first trade with a timestamp.
 */
export function checkOgBadge(firstTradeTimestamp?: number) {
  // Launch week: hard-coded start. Adjust to actual launch date.
  const LAUNCH_DATE = new Date('2025-01-01T00:00:00Z').getTime();
  const LAUNCH_WEEK_END = LAUNCH_DATE + 7 * 24 * 60 * 60 * 1000;
  const ts = firstTradeTimestamp ?? Date.now();
  if (ts >= LAUNCH_DATE && ts <= LAUNCH_WEEK_END) {
    checkAchievement('og');
  }
}

/**
 * Check top-10 leaderboard badge (call when leaderboard rank is known).
 */
export function checkLeaderboardBadge(rank: number) {
  if (rank <= 10) checkAchievement('top-10');
}

/**
 * Legacy compatibility shim for old achievement ids.
 */
export const ACHIEVEMENTS = BADGE_DEFINITIONS.filter(
  (b) => b.category !== 'tier'
).map((b) => ({
  id: b.id,
  name: b.name,
  desc: b.earnCondition,
  icon: '🏅',
  xp: ACHIEVEMENT_XP[b.id] || 0,
}));
