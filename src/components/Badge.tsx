'use client';

import { useState } from 'react';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface BadgeDefinition {
  id: string;
  name: string;
  japanese: string;
  romaji: string;
  rarity: BadgeRarity;
  category: 'tier' | 'milestone' | 'leverage' | 'streak' | 'exploration' | 'style' | 'recovery' | 'winstreak' | 'special';
  earnCondition: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Tier badges
  { id: 'tier-novice',     name: 'Novice',          japanese: '初心者',   romaji: 'Shoshinsha',  rarity: 'common',    category: 'tier',      earnCondition: 'Make your first trade.' },
  { id: 'tier-challenger', name: 'Challenger',       japanese: '挑戦者',   romaji: 'Chōsensha',   rarity: 'uncommon',  category: 'tier',      earnCondition: 'Reach Level 6 (500 XP).' },
  { id: 'tier-trader',     name: 'Trader',           japanese: '商人',     romaji: 'Shōnin',      rarity: 'rare',      category: 'tier',      earnCondition: 'Reach Level 16 (2,000 XP).' },
  { id: 'tier-pro',        name: 'Pro',              japanese: '達人',     romaji: 'Tatsujin',    rarity: 'epic',      category: 'tier',      earnCondition: 'Reach Level 31 (10,000 XP).' },
  { id: 'tier-elite',      name: 'Elite',            japanese: '精鋭',     romaji: 'Seiei',       rarity: 'legendary', category: 'tier',      earnCondition: 'Reach Level 51 (50,000 XP).' },
  { id: 'tier-legend',     name: 'Legend',           japanese: '伝説',     romaji: 'Densetsu',    rarity: 'mythic',    category: 'tier',      earnCondition: 'Reach Level 76 (200,000 XP).' },
  // Achievement badges
  { id: 'first-blood',     name: 'First Blood',      japanese: '初戦',     romaji: 'Shosen',      rarity: 'common',    category: 'milestone', earnCondition: 'Execute your first ever trade.' },
  { id: 'century',         name: 'Century',          japanese: '百',       romaji: 'Hyaku',       rarity: 'rare',      category: 'milestone', earnCondition: 'Execute 100 total trades.' },
  { id: 'thousand-cuts',   name: 'Thousand Cuts',    japanese: '千',       romaji: 'Sen',         rarity: 'epic',      category: 'milestone', earnCondition: 'Execute 1,000 total trades.' },
  { id: 'degen',           name: 'Degen',            japanese: '無謀',     romaji: 'Mubō',        rarity: 'common',    category: 'leverage',  earnCondition: 'Trade at 100x leverage or higher.' },
  { id: 'max-degen',       name: 'Max Degen',        japanese: '狂気',     romaji: 'Kyōki',       rarity: 'rare',      category: 'leverage',  earnCondition: 'Trade at 300x leverage (Aster only).' },
  { id: 'leverage-god',    name: 'Leverage God',     japanese: '神様',     romaji: 'Kamisama',    rarity: 'legendary', category: 'leverage',  earnCondition: 'Trade at max leverage on 5 different markets.' },
  { id: 'burning-spirit',  name: 'Burning Spirit',   japanese: '燃える',   romaji: 'Moeru',       rarity: 'uncommon',  category: 'streak',    earnCondition: 'Maintain a 7-day trading streak.' },
  { id: 'inferno',         name: 'Inferno',          japanese: '火炎地獄', romaji: 'Kaen Jigoku', rarity: 'legendary', category: 'streak',    earnCondition: 'Maintain a 30-day trading streak.' },
  { id: 'eternal-flame',   name: 'Eternal Flame',    japanese: '永火',     romaji: 'Eien no Hi',  rarity: 'mythic',    category: 'streak',    earnCondition: 'Maintain a 100-day trading streak.' },
  { id: 'explorer',        name: 'Explorer',         japanese: '探検',     romaji: 'Tanken',      rarity: 'common',    category: 'exploration', earnCondition: 'Trade 5 different markets.' },
  { id: 'globe-trotter',   name: 'Globe Trotter',    japanese: '世界',     romaji: 'Sekai',       rarity: 'rare',      category: 'exploration', earnCondition: 'Trade 25 different markets.' },
  { id: 'protocol-tourist',name: 'Protocol Tourist', japanese: '遍歴',     romaji: 'Henreki',     rarity: 'uncommon',  category: 'exploration', earnCondition: 'Trade on all 3 venues in one week.' },
  { id: 'night-owl',       name: 'Night Owl',        japanese: '梟',       romaji: 'Fukurō',      rarity: 'uncommon',  category: 'style',     earnCondition: 'Execute a trade between midnight and 4am UTC.' },
  { id: 'sniper',          name: 'Sniper',           japanese: '狙撃',     romaji: 'Sogeki',      rarity: 'rare',      category: 'style',     earnCondition: 'Close a trade within 0.5% of entry price.' },
  { id: 'diamond-hands',   name: 'Diamond Hands',    japanese: '金剛',     romaji: 'Kongō',       rarity: 'rare',      category: 'style',     earnCondition: 'Hold a position for 7+ days without closing.' },
  { id: 'survivor',        name: 'Survivor',         japanese: '不死身',   romaji: 'Fujimi',      rarity: 'uncommon',  category: 'recovery',  earnCondition: 'Get liquidated and trade again within 24 hours.' },
  { id: 'comeback-kid',    name: 'Comeback Kid',     japanese: '復活',     romaji: 'Fukkatsu',    rarity: 'epic',      category: 'recovery',  earnCondition: 'Recover from a -50% drawdown to break even.' },
  { id: 'on-fire',         name: 'On Fire',          japanese: '連勝',     romaji: 'Renshō',      rarity: 'uncommon',  category: 'winstreak', earnCondition: 'Win 5 consecutive trades.' },
  { id: 'untouchable',     name: 'Untouchable',      japanese: '無敵',     romaji: 'Muteki',      rarity: 'legendary', category: 'winstreak', earnCondition: 'Win 20 consecutive trades.' },
  { id: 'og',              name: 'OG',               japanese: '元祖',     romaji: 'Ganso',       rarity: 'legendary', category: 'special',   earnCondition: 'Trade during the platform launch week.' },
  { id: 'top-10',          name: 'Top 10',           japanese: '十傑',     romaji: 'Jukketsu',    rarity: 'legendary', category: 'special',   earnCondition: 'Reach top 10 on the weekly leaderboard.' },
  { id: 'whale',           name: 'Whale',            japanese: '鯨',       romaji: 'Kujira',      rarity: 'rare',      category: 'special',   earnCondition: 'Open a position worth $10,000+ notional.' },
];

const RARITY_RING: Record<BadgeRarity, string> = {
  common:    'ring-1 ring-gray-500',
  uncommon:  'ring-1 ring-green-500',
  rare:      'ring-2 ring-blue-500',
  epic:      'ring-2 ring-purple-500',
  legendary: 'ring-[3px] ring-yellow-500',
  mythic:    'ring-[3px] ring-yellow-500',
};

const RARITY_SHADOW: Record<BadgeRarity, string> = {
  common:    '',
  uncommon:  'shadow-[0_0_6px_rgba(34,197,94,0.4)]',
  rare:      'shadow-[0_0_8px_rgba(59,130,246,0.5)]',
  epic:      'shadow-[0_0_10px_rgba(168,85,247,0.5)]',
  legendary: 'shadow-[0_0_14px_rgba(245,158,11,0.6)]',
  mythic:    'shadow-[0_0_18px_rgba(245,158,11,0.7)]',
};

const RARITY_LABEL: Record<BadgeRarity, string> = {
  common:    '#9CA3AF',
  uncommon:  '#22C55E',
  rare:      '#3B82F6',
  epic:      '#A855F7',
  legendary: '#F59E0B',
  mythic:    '#FFD700',
};

interface BadgeProps {
  id: string;
  earned?: boolean;
  earnedDate?: string;
  size?: number;
  showTooltip?: boolean;
  className?: string;
}

export default function Badge({ id, earned = false, earnedDate, size = 64, showTooltip = true, className = '' }: BadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const def = BADGE_DEFINITIONS.find((b) => b.id === id);
  if (!def) return null;

  const { rarity, name, japanese, romaji, earnCondition } = def;
  const ringCls = RARITY_RING[rarity];
  const shadowCls = RARITY_SHADOW[rarity];
  const animationCls = rarity === 'epic' ? 'animate-pulse-subtle' : rarity === 'mythic' ? 'animate-border-spin' : '';

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => showTooltip && setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      data-testid={`badge-${id}`}
    >
      {/* Badge image */}
      <div
        className={`rounded-full overflow-hidden ${ringCls} ${shadowCls} ${animationCls} transition-all duration-200`}
        style={{ width: size, height: size }}
      >
        <img
          src={`/badges/${id}.svg`}
          alt={name}
          width={size}
          height={size}
          className="w-full h-full rounded-full"
          style={{
            filter: earned ? 'none' : 'grayscale(100%) brightness(30%)',
            transition: 'filter 0.3s ease',
          }}
        />
        {/* Unearned question mark overlay */}
        {!earned && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <span style={{ fontSize: size * 0.35, color: 'rgba(255,255,255,0.4)' }}>?</span>
          </div>
        )}
      </div>

      {/* Mythic animated border */}
      {rarity === 'mythic' && earned && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, #FFD700, #D4A574, #EF4444, #FFD700)',
            padding: 3,
            borderRadius: '50%',
            zIndex: -1,
            animation: 'spin 4s linear infinite',
          }}
        />
      )}

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            bottom: size + 8,
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 180,
          }}
        >
          <div
            className="rounded-lg px-3 py-2 text-center"
            style={{
              background: '#12151A',
              border: `1px solid ${RARITY_LABEL[rarity]}33`,
              boxShadow: `0 0 12px ${RARITY_LABEL[rarity]}22`,
            }}
          >
            {/* Rarity dot */}
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: RARITY_LABEL[rarity] }}
              />
              <span
                className="text-[9px] uppercase tracking-widest font-mono"
                style={{ color: RARITY_LABEL[rarity] }}
              >
                {rarity}
              </span>
            </div>
            <div className="text-white font-bold text-[11px] leading-tight">{name}</div>
            <div
              className="text-[13px] font-semibold mt-0.5"
              style={{ color: RARITY_LABEL[rarity], fontFamily: 'serif' }}
            >
              {japanese}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5 font-mono italic">{romaji}</div>
            <div className="mt-1.5 pt-1.5 border-t border-gray-800">
              {earned ? (
                <div className="text-[9px] text-green-400 font-mono">
                  ✓ Earned{earnedDate ? ` · ${new Date(earnedDate).toLocaleDateString()}` : ''}
                </div>
              ) : (
                <div className="text-[9px] text-gray-500 font-mono leading-tight">
                  {earnCondition}
                </div>
              )}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div
            className="w-0 h-0 mx-auto"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${RARITY_LABEL[rarity]}33`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// Tier badge helper — returns the current tier badge id based on level
export function getTierBadgeId(level: number): string {
  if (level >= 76) return 'tier-legend';
  if (level >= 51) return 'tier-elite';
  if (level >= 31) return 'tier-pro';
  if (level >= 16) return 'tier-trader';
  if (level >= 6)  return 'tier-challenger';
  return 'tier-novice';
}

export function getTierName(level: number): string {
  if (level >= 76) return 'Legend';
  if (level >= 51) return 'Elite';
  if (level >= 31) return 'Pro';
  if (level >= 16) return 'Trader';
  if (level >= 6)  return 'Challenger';
  return 'Novice';
}
