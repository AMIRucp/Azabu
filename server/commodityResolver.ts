import { TOKEN_REGISTRY, REGISTRY_BY_MINT, type RegisteredToken } from './tokenRegistry';
import { resolveTokenMint } from './jupiter';

export interface CommodityToken {
  symbol: string;
  mint: string;
  name: string;
  provider: 'gold_issuance' | 'remora' | 'elmnts' | 'usor';
  commodityType: 'precious_metal' | 'industrial_metal' | 'energy';
  commodityLabel: string;
  tradfiTicker: string;
  decimals: number;
  isSecurityToken: boolean;
}

const COMMODITY_ALIASES: Record<string, string> = {
  'GOLD': 'GOLD',
  'GOLD TOKEN': 'GOLD',
  'BUY GOLD': 'GOLD',
  'PHYSICAL GOLD': 'GOLD',

  'GLDR': 'GLDr',
  'GOLD RSTOCK': 'GLDr',
  'REMORA GOLD': 'GLDr',

  'SLVR': 'SLVr',
  'SILVER': 'SLVr',
  'SILVER RSTOCK': 'SLVr',

  'PPLTR': 'PPLTr',
  'PLATINUM': 'PPLTr',
  'PLAT': 'PPLTr',
  'PLATINUM RSTOCK': 'PPLTr',

  'PALLR': 'PALLr',
  'PALLADIUM': 'PALLr',
  'PALLADIUM RSTOCK': 'PALLr',

  'CPERR': 'CPERr',
  'COPPER': 'CPERr',
  'COPPER RSTOCK': 'CPERr',

  'USOR': 'USOR',
  'US OIL': 'USOR',
  'OIL': 'USOR',
  'CRUDE': 'USOR',
  'CRUDE OIL': 'USOR',
  'WTI': 'USOR',
  'BRENT': 'USOR',
  'PETROLEUM': 'USOR',

  'ELMNTS': 'ELMNTS',
  'OIL GAS': 'ELMNTS',
  'OIL AND GAS': 'ELMNTS',
  'MINERAL RIGHTS': 'ELMNTS',
  'OIL ROYALTIES': 'ELMNTS',
};

const COMMODITY_META: Record<string, Omit<CommodityToken, 'mint'>> = {
  'GOLD': {
    symbol: 'GOLD',
    name: 'Gold Token',
    provider: 'gold_issuance',
    commodityType: 'precious_metal',
    commodityLabel: 'Gold (Physical-Backed)',
    tradfiTicker: 'XAU',
    decimals: 9,
    isSecurityToken: false,
  },
  'GLDr': {
    symbol: 'GLDr',
    name: 'Gold rStock',
    provider: 'remora',
    commodityType: 'precious_metal',
    commodityLabel: 'Gold rStock (Price Exposure)',
    tradfiTicker: 'XAU',
    decimals: 9,
    isSecurityToken: false,
  },
  'SLVr': {
    symbol: 'SLVr',
    name: 'Silver rStock',
    provider: 'remora',
    commodityType: 'precious_metal',
    commodityLabel: 'Silver rStock',
    tradfiTicker: 'XAG',
    decimals: 9,
    isSecurityToken: false,
  },
  'PPLTr': {
    symbol: 'PPLTr',
    name: 'Platinum rStock',
    provider: 'remora',
    commodityType: 'precious_metal',
    commodityLabel: 'Platinum rStock',
    tradfiTicker: 'XPT',
    decimals: 9,
    isSecurityToken: false,
  },
  'PALLr': {
    symbol: 'PALLr',
    name: 'Palladium rStock',
    provider: 'remora',
    commodityType: 'precious_metal',
    commodityLabel: 'Palladium rStock',
    tradfiTicker: 'XPD',
    decimals: 9,
    isSecurityToken: false,
  },
  'CPERr': {
    symbol: 'CPERr',
    name: 'Copper rStock',
    provider: 'remora',
    commodityType: 'industrial_metal',
    commodityLabel: 'Copper rStock',
    tradfiTicker: 'HG',
    decimals: 9,
    isSecurityToken: false,
  },
  'ELMNTS': {
    symbol: 'ELMNTS',
    name: 'Elmnts Oil & Gas Royalties',
    provider: 'elmnts',
    commodityType: 'energy',
    commodityLabel: 'Oil & Gas Royalty Rights (Chevron)',
    tradfiTicker: 'CL',
    decimals: 9,
    isSecurityToken: true,
  },
  'USOR': {
    symbol: 'USOR',
    name: 'US Oil',
    provider: 'usor',
    commodityType: 'energy',
    commodityLabel: 'US Oil (Crude Oil Tracker)',
    tradfiTicker: 'CL',
    decimals: 9,
    isSecurityToken: false,
  },
};

const resolvedMints: Record<string, string> = {};

export function resolveCommodityAlias(input: string): string | null {
  const upper = input.toUpperCase().trim();
  return COMMODITY_ALIASES[upper] || null;
}

export async function resolveCommodityToken(input: string): Promise<CommodityToken | null> {
  const upper = input.toUpperCase().trim();
  const symbol = COMMODITY_ALIASES[upper];
  if (!symbol) return null;

  const meta = COMMODITY_META[symbol];
  if (!meta) return null;

  let mint = resolvedMints[symbol];
  if (!mint) {
    try {
      mint = await resolveTokenMint(symbol);
      if (mint) {
        resolvedMints[symbol] = mint;
      }
    } catch {
      // fall through
    }
  }

  if (!mint) {
    return null;
  }

  return { ...meta, mint };
}

export function isCommodityInput(input: string): boolean {
  const upper = input.toUpperCase().trim();
  return !!COMMODITY_ALIASES[upper];
}

export function getCommodityMeta(symbol: string): typeof COMMODITY_META[string] | null {
  const resolved = COMMODITY_ALIASES[symbol.toUpperCase().trim()] || symbol;
  return COMMODITY_META[resolved] || null;
}

export function getCommodityByMint(mint: string): CommodityToken | null {
  for (const [symbol, m] of Object.entries(resolvedMints)) {
    if (m === mint) {
      const meta = COMMODITY_META[symbol];
      if (meta) return { ...meta, mint };
    }
  }
  return null;
}

export function getAllCommoditySymbols(): string[] {
  return Object.keys(COMMODITY_META);
}

export function getProviderLabel(provider: string): string {
  switch (provider) {
    case 'gold_issuance': return 'Gold Issuance Inc.';
    case 'remora': return 'Remora Markets';
    case 'elmnts': return 'Elmnts';
    default: return provider;
  }
}
