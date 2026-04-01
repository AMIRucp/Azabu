export interface SamuraiTraits {
  background: number;
  maskShape: number;
  maskColor: number;
  eyes: number;
  horns: number;
  mouth: number;
  markings: number;
  accessory: number;
  aura: number;
}

function simpleHash(str: string, seed: number): number {
  let h = seed ^ 0xdeadbeef;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x9e3779b9);
    h = ((h << 13) | (h >>> 19)) ^ (h >>> 7);
  }
  return Math.abs(h >>> 0);
}

export function generateSamuraiTraits(walletAddress: string): SamuraiTraits {
  const addr = walletAddress.toLowerCase();
  return {
    background: simpleHash(addr, 0x01) % 12,
    maskShape:  simpleHash(addr, 0x02) % 8,
    maskColor:  simpleHash(addr, 0x03) % 16,
    eyes:       simpleHash(addr, 0x04) % 10,
    horns:      simpleHash(addr, 0x05) % 10,
    mouth:      simpleHash(addr, 0x06) % 8,
    markings:   simpleHash(addr, 0x07) % 12,
    accessory:  simpleHash(addr, 0x08) % 8,
    aura:       simpleHash(addr, 0x09) % 6,
  };
}

export const MASK_COLOR_FILTERS: Record<number, string> = {
  0:  'hue-rotate(0deg)',
  1:  'hue-rotate(10deg) brightness(80%)',
  2:  'hue-rotate(-10deg) brightness(70%)',
  3:  'hue-rotate(22deg)',
  4:  'hue-rotate(35deg) saturate(120%)',
  5:  'hue-rotate(50deg) saturate(130%)',
  6:  'hue-rotate(57deg) saturate(150%)',
  7:  'hue-rotate(200deg) brightness(35%) saturate(80%)',
  8:  'hue-rotate(215deg) brightness(28%) saturate(70%)',
  9:  'hue-rotate(225deg) brightness(42%) saturate(90%)',
  10: 'hue-rotate(128deg) saturate(80%)',
  11: 'hue-rotate(180deg) saturate(90%)',
  12: 'hue-rotate(245deg) saturate(110%)',
  13: 'hue-rotate(280deg) saturate(120%)',
  14: 'hue-rotate(0deg) saturate(20%) brightness(38%)',
  15: 'hue-rotate(328deg) saturate(120%)',
};

export type TierName = 'novice' | 'challenger' | 'trader' | 'pro' | 'elite' | 'legend';

export function rankToTier(rank: string): TierName {
  const r = rank.toLowerCase();
  if (r.includes('legend')) return 'legend';
  if (r.includes('elite')) return 'elite';
  if (r.includes('pro')) return 'pro';
  if (r.includes('trader')) return 'trader';
  if (r.includes('challenger')) return 'challenger';
  return 'novice';
}

export const TIER_BORDER_COLORS: Record<TierName, string> = {
  novice:     'rgba(120,120,120,0.5)',
  challenger: 'rgba(56,197,105,0.6)',
  trader:     'rgba(59,130,246,0.6)',
  pro:        'rgba(168,85,247,0.6)',
  elite:      'rgba(234,179,8,0.7)',
  legend:     'rgba(249,115,22,0.8)',
};

export const TIER_GLOW_COLORS: Record<TierName, string> = {
  novice:     'transparent',
  challenger: 'rgba(56,197,105,0.15)',
  trader:     'rgba(59,130,246,0.2)',
  pro:        'rgba(168,85,247,0.25)',
  elite:      'rgba(234,179,8,0.3)',
  legend:     'rgba(249,115,22,0.35)',
};
