import {
  ALL_RWA_TOKENS, RWA_BY_MINT, RWA_BY_SYMBOL, RWA_BY_ALIAS,
  type RwaToken,
} from './tokens';
import type { RwaCategory } from './categories';

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
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

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;
  const dist = levenshtein(q, t);
  const maxLen = Math.max(q.length, t.length);
  if (maxLen === 0) return 0;
  const similarity = 1 - dist / maxLen;
  return similarity > 0.6 ? similarity * 70 : 0;
}

export function searchRwa(
  query: string,
  category?: RwaCategory,
  limit = 8
): RwaToken[] {
  const q = query.trim();
  if (!q) {
    if (category) {
      return ALL_RWA_TOKENS.filter(t => t.category === category).slice(0, limit);
    }
    return [];
  }

  if (RWA_BY_MINT.has(q)) {
    const t = RWA_BY_MINT.get(q)!;
    return category && t.category !== category ? [] : [t];
  }

  const bySymbol = RWA_BY_SYMBOL.get(q.toUpperCase());
  if (bySymbol) {
    return category && bySymbol.category !== category ? [] : [bySymbol];
  }

  const byAlias = RWA_BY_ALIAS.get(q.toLowerCase());
  if (byAlias) {
    return category && byAlias.category !== category ? [] : [byAlias];
  }

  const scored: Array<{ token: RwaToken; score: number }> = [];
  for (const token of ALL_RWA_TOKENS) {
    if (category && token.category !== category) continue;

    let best = 0;
    best = Math.max(best, fuzzyScore(q, token.symbol) * 1.5);
    if (token.underlyingTicker) {
      best = Math.max(best, fuzzyScore(q, token.underlyingTicker) * 1.4);
    }
    best = Math.max(best, fuzzyScore(q, token.name));
    if (token.underlyingName) {
      best = Math.max(best, fuzzyScore(q, token.underlyingName));
    }
    for (const alias of token.aliases) {
      best = Math.max(best, fuzzyScore(q, alias) * 1.2);
    }
    if (best > 0) {
      scored.push({ token, score: best });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.token);
}

export function resolveRwaToken(query: string): RwaToken | null {
  const results = searchRwa(query, undefined, 1);
  return results.length > 0 ? results[0] : null;
}

export function getRwaByCategory(category: RwaCategory): RwaToken[] {
  return ALL_RWA_TOKENS
    .filter(t => t.category === category)
    .sort((a, b) => {
      if (a.issuer === 'xStocks' && b.issuer !== 'xStocks') return -1;
      if (b.issuer === 'xStocks' && a.issuer !== 'xStocks') return 1;
      return a.symbol.localeCompare(b.symbol);
    });
}

export function extractRwaTokensFromText(text: string): RwaToken[] {
  const found: RwaToken[] = [];
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    for (let span = 3; span >= 1; span--) {
      if (i + span > words.length) continue;
      const phrase = words.slice(i, i + span).join(' ');
      const cleaned = phrase.replace(/^\$/, '');

      const byAlias = RWA_BY_ALIAS.get(cleaned);
      if (byAlias && !found.find(t => t.mint === byAlias.mint)) {
        found.push(byAlias);
        break;
      }

      const bySymbol = RWA_BY_SYMBOL.get(cleaned.toUpperCase());
      if (bySymbol && !found.find(t => t.mint === bySymbol.mint)) {
        found.push(bySymbol);
        break;
      }
    }
  }
  return found;
}

export function getAllRwaGrouped(): Record<RwaCategory, RwaToken[]> {
  const groups: Record<string, RwaToken[]> = {};
  for (const token of ALL_RWA_TOKENS) {
    if (!groups[token.category]) {
      groups[token.category] = [];
    }
    groups[token.category].push(token);
  }
  return groups as Record<RwaCategory, RwaToken[]>;
}
