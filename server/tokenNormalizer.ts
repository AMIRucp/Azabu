import { TOKEN_REGISTRY, STOCK_ALIASES } from './tokenRegistry';

const NAME_TO_SYMBOL: Record<string, string> = {
  'SOLANA': 'SOL',
  'BITCOIN': 'BTC',
  'ETHEREUM': 'ETH',
  'TETHER': 'USDT',
  'USD COIN': 'USDC',
  'BONK': 'BONK',
  'JUPITER': 'JUP',
  'RAYDIUM': 'RAY',
  'PYTH NETWORK': 'PYTH',
  'PYTH': 'PYTH',
  'DOGWIFHAT': 'WIF',
  'DOG WIF HAT': 'WIF',
  'DOGE WIF HAT': 'WIF',
  'RENDER': 'RENDER',
  'MARINADE': 'MNDE',
  'MARINADE STAKED SOL': 'MSOL',
  'MSOL': 'MSOL',
  'JITO': 'JTO',
  'JITOSOL': 'JITOSOL',
  'TENSOR': 'TNSR',
  'HELIUM': 'HNT',
  'ORCA': 'ORCA',
  'POPCAT': 'POPCAT',
  'MEW': 'MEW',
  'TRUMP': 'TRUMP',
  'FARTCOIN': 'FARTCOIN',
  'HELIUM MOBILE': 'MOBILE',
  'WORLD LIBERTY FINANCIAL': 'WLFI',
  'WORLD LIBERTY': 'WLFI',
  'WLFI': 'WLFI',
  'USD1': 'USD1',
  'WORLDCOIN': 'WLD',
  'ONDO': 'ONDO',
  'USDY': 'USDY',
  'BUIDL': 'BUIDL',
  'PENGU': 'PENGU',
  'PUDGY PENGUINS': 'PENGU',
  'AI16Z': 'AI16Z',
  'VIRTUAL': 'VIRTUAL',
  'VIRTUALS': 'VIRTUAL',
};

import { ALL_RWA_TOKENS } from './rwa/tokens';

const CANONICAL_SYMBOLS = new Set([
  ...Object.keys(TOKEN_REGISTRY),
  ...Object.keys(STOCK_ALIASES),
  ...ALL_RWA_TOKENS.map(t => t.symbol.toUpperCase()),
  ...ALL_RWA_TOKENS.flatMap(t => t.aliases.map(a => a.toUpperCase())),
  'BTC', 'ETH', 'DOGE', 'SHIB', 'PEPE', 'AVAX', 'MATIC',
  'W', 'POPCAT', 'MEW', 'TRUMP', 'FARTCOIN', 'MNDE', 'JITOSOL', 'TNSR', 'MSOL',
  'WLFI', 'USD1', 'WLD', 'ONDO', 'USDY', 'BUIDL', 'PENGU', 'AI16Z', 'VIRTUAL',
]);

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export interface NormalizeResult {
  normalized: string;
  original: string;
  corrected: boolean;
  confidence: 'exact' | 'high' | 'medium' | 'low';
  suggestion?: string;
}

export function normalizeTokenInput(raw: string): NormalizeResult {
  const original = raw;

  let cleaned = raw.trim().toUpperCase()
    .replace(/^\$/, '')
    .replace(/[.,!?;:]+$/, '')
    .trim();

  if (CANONICAL_SYMBOLS.has(cleaned)) {
    return { normalized: cleaned, original, corrected: false, confidence: 'exact' };
  }

  if (NAME_TO_SYMBOL[cleaned]) {
    return {
      normalized: NAME_TO_SYMBOL[cleaned],
      original, corrected: true, confidence: 'high',
    };
  }

  if (cleaned.endsWith('S') && cleaned.length > 2) {
    const stripped = cleaned.slice(0, -1);
    if (CANONICAL_SYMBOLS.has(stripped)) {
      return { normalized: stripped, original, corrected: true, confidence: 'high' };
    }
  }

  if (cleaned.length > 2 && cleaned[cleaned.length - 1] === cleaned[cleaned.length - 2]) {
    const stripped = cleaned.slice(0, -1);
    if (CANONICAL_SYMBOLS.has(stripped)) {
      return { normalized: stripped, original, corrected: true, confidence: 'high' };
    }
  }

  let bestMatch = '';
  let bestDist = Infinity;
  for (const sym of Array.from(CANONICAL_SYMBOLS)) {
    const dist = levenshtein(cleaned, sym);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = sym;
    }
  }

  const maxHighConfDist = cleaned.length <= 3 ? 1 : cleaned.length <= 5 ? 1 : 2;

  if (bestDist <= maxHighConfDist && bestDist > 0) {
    if (bestDist === 1 && cleaned.length <= 4 && Math.abs(cleaned.length - bestMatch.length) > 1) {
      return {
        normalized: cleaned, original,
        corrected: false, confidence: 'low',
      };
    }
    return {
      normalized: bestMatch, original,
      corrected: true, confidence: 'high',
    };
  }

  if (bestDist === maxHighConfDist + 1 && bestDist > 0 && cleaned.length > 5) {
    return {
      normalized: bestMatch, original,
      corrected: true, confidence: 'medium',
      suggestion: `Did you mean ${bestMatch}?`,
    };
  }

  return {
    normalized: cleaned, original,
    corrected: false, confidence: 'low',
  };
}
