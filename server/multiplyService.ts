export interface MultiplyVault {
  id: string;
  collateralSymbol: string;
  collateralName: string;
  collateralMint: string;
  debtSymbol: string;
  debtMint: string;
  maxMultiplier: number;
  netApyPercent: number;
  marketSizeUsd: number;
  category: 'sol' | 'btc' | 'stablecoin' | 'other';
  isPegged: boolean;
  hasRewards: boolean;
  logoUrl?: string;
}

const MULTIPLY_VAULTS: Array<{
  collateralSymbol: string;
  collateralName: string;
  collateralMint: string;
  debtSymbol: string;
  debtMint: string;
  maxMultiplier: number;
  baseYieldPercent: number;
  borrowCostPercent: number;
  marketSizeUsd: number;
  category: 'sol' | 'btc' | 'stablecoin' | 'other';
  isPegged: boolean;
}> = [
  {
    collateralSymbol: 'JLP',
    collateralName: 'Jupiter Perps LP',
    collateralMint: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
    debtSymbol: 'USDC',
    debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    maxMultiplier: 6.4,
    baseYieldPercent: 12.4,
    borrowCostPercent: 4.1,
    marketSizeUsd: 384_000_000,
    category: 'other',
    isPegged: false,
  },
  {
    collateralSymbol: 'SOL',
    collateralName: 'Wrapped SOL',
    collateralMint: 'So11111111111111111111111111111111111111112',
    debtSymbol: 'USDC',
    debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    maxMultiplier: 3.8,
    baseYieldPercent: 5.6,
    borrowCostPercent: 4.1,
    marketSizeUsd: 187_000_000,
    category: 'sol',
    isPegged: false,
  },
  {
    collateralSymbol: 'INF',
    collateralName: 'Infinity',
    collateralMint: '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm',
    debtSymbol: 'SOL',
    debtMint: 'So11111111111111111111111111111111111111112',
    maxMultiplier: 16.6,
    baseYieldPercent: 6.4,
    borrowCostPercent: 4.0,
    marketSizeUsd: 89_100_000,
    category: 'sol',
    isPegged: true,
  },
  {
    collateralSymbol: 'JupSOL',
    collateralName: 'Jupiter Staked SOL',
    collateralMint: 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjdb9J',
    debtSymbol: 'SOL',
    debtMint: 'So11111111111111111111111111111111111111112',
    maxMultiplier: 16.6,
    baseYieldPercent: 6.6,
    borrowCostPercent: 4.0,
    marketSizeUsd: 91_400_000,
    category: 'sol',
    isPegged: true,
  },
  {
    collateralSymbol: 'syrupUSDC',
    collateralName: 'Syrup USDC',
    collateralMint: 'Bt44ABbo3YkLVHf5KVUF3XpBiRxDCvjQHDkTkRiY3GTs',
    debtSymbol: 'USDC',
    debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    maxMultiplier: 9.9,
    baseYieldPercent: 4.6,
    borrowCostPercent: 4.1,
    marketSizeUsd: 100_000_000,
    category: 'stablecoin',
    isPegged: true,
  },
  {
    collateralSymbol: 'JUICED',
    collateralName: 'jupiter lend JUPUSD',
    collateralMint: 'Jui8EXG1FaTsjiFFXaCvFmGHiMT4xWMQfx3hPRH9Czb',
    debtSymbol: 'USDC',
    debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    maxMultiplier: 9.0,
    baseYieldPercent: 4.9,
    borrowCostPercent: 4.1,
    marketSizeUsd: 32_400_000,
    category: 'stablecoin',
    isPegged: true,
  },
  {
    collateralSymbol: 'dfdvSOL',
    collateralName: 'DeFi Development Corp Staked SOL',
    collateralMint: 'DfDvSoLZqN4SxC4i3fk3e3SvNX3y9YwLrFLWKhCunaJh',
    debtSymbol: 'SOL',
    debtMint: 'So11111111111111111111111111111111111111112',
    maxMultiplier: 12.4,
    baseYieldPercent: 6.2,
    borrowCostPercent: 4.0,
    marketSizeUsd: 16_700_000,
    category: 'sol',
    isPegged: true,
  },
  {
    collateralSymbol: 'cbBTC',
    collateralName: 'Coinbase Wrapped BTC',
    collateralMint: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij',
    debtSymbol: 'USDC',
    debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    maxMultiplier: 6.4,
    baseYieldPercent: 0,
    borrowCostPercent: 4.1,
    marketSizeUsd: 28_500_000,
    category: 'btc',
    isPegged: false,
  },
  {
    collateralSymbol: 'WBTC',
    collateralName: 'Wrapped BTC (Wormhole)',
    collateralMint: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    debtSymbol: 'USDC',
    debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    maxMultiplier: 4.8,
    baseYieldPercent: 0,
    borrowCostPercent: 4.1,
    marketSizeUsd: 2_520_000,
    category: 'btc',
    isPegged: false,
  },
  {
    collateralSymbol: 'JitoSOL',
    collateralName: 'Jito Staked SOL',
    collateralMint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    debtSymbol: 'SOL',
    debtMint: 'So11111111111111111111111111111111111111112',
    maxMultiplier: 16.6,
    baseYieldPercent: 5.7,
    borrowCostPercent: 4.0,
    marketSizeUsd: 6_850_000,
    category: 'sol',
    isPegged: true,
  },
  {
    collateralSymbol: 'mSOL',
    collateralName: 'Marinade staked SOL',
    collateralMint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    debtSymbol: 'SOL',
    debtMint: 'So11111111111111111111111111111111111111112',
    maxMultiplier: 9.0,
    baseYieldPercent: 5.9,
    borrowCostPercent: 4.0,
    marketSizeUsd: 2_490_000,
    category: 'sol',
    isPegged: true,
  },
  {
    collateralSymbol: 'fwdSOL',
    collateralName: 'Forward Industries Staked SOL',
    collateralMint: 'FwdSoL1tiZ9axBc4oqGHJKRwPYFkzqSqFaLJ1D4ow5Bs',
    debtSymbol: 'SOL',
    debtMint: 'So11111111111111111111111111111111111111112',
    maxMultiplier: 16.6,
    baseYieldPercent: 6.3,
    borrowCostPercent: 4.0,
    marketSizeUsd: 72_200,
    category: 'sol',
    isPegged: true,
  },
  {
    collateralSymbol: 'LBTC',
    collateralName: 'Lombard Staked BTC',
    collateralMint: 'LBTCxMEVMVFB3kYBbiCfEKnw2jWKP6oVzSGhEBp4XCb',
    debtSymbol: 'USDC',
    debtMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    maxMultiplier: 8.3,
    baseYieldPercent: 0.4,
    borrowCostPercent: 4.1,
    marketSizeUsd: 52_500_000,
    category: 'btc',
    isPegged: false,
  },
];

function computeNetApy(baseYield: number, borrowCost: number, multiplier: number): number {
  return (baseYield * multiplier) - (borrowCost * (multiplier - 1));
}

let vaultCache: { data: MultiplyVault[]; ts: number } | null = null;
const CACHE_TTL = 120_000;

export function getMultiplyVaults(categoryFilter?: string): MultiplyVault[] {
  if (vaultCache && Date.now() - vaultCache.ts < CACHE_TTL) {
    const vaults = vaultCache.data;
    if (categoryFilter) return vaults.filter(v => v.category === categoryFilter);
    return vaults;
  }

  const vaults: MultiplyVault[] = MULTIPLY_VAULTS.map(v => ({
    id: `${v.collateralSymbol}-${v.debtSymbol}`,
    collateralSymbol: v.collateralSymbol,
    collateralName: v.collateralName,
    collateralMint: v.collateralMint,
    debtSymbol: v.debtSymbol,
    debtMint: v.debtMint,
    maxMultiplier: v.maxMultiplier,
    netApyPercent: computeNetApy(v.baseYieldPercent, v.borrowCostPercent, v.maxMultiplier),
    marketSizeUsd: v.marketSizeUsd,
    category: v.category,
    isPegged: v.isPegged,
    hasRewards: v.baseYieldPercent > 0,
  })).sort((a, b) => b.marketSizeUsd - a.marketSizeUsd);

  vaultCache = { data: vaults, ts: Date.now() };
  if (categoryFilter) return vaults.filter(v => v.category === categoryFilter);
  return vaults;
}

const PERP_TO_COLLATERAL: Record<string, string> = {
  "sol": "SOL",
  "sol-perp": "SOL",
  "btc": "cbBTC",
  "btc-perp": "cbBTC",
  "jlp": "JLP",
  "jlp-perp": "JLP",
  "jitosol": "JitoSOL",
  "jitosol-perp": "JitoSOL",
  "msol": "mSOL",
  "msol-perp": "mSOL",
  "jupsol": "JupSOL",
  "jupsol-perp": "JupSOL",
  "inf": "INF",
  "inf-perp": "INF",
  "lbtc": "LBTC",
  "lbtc-perp": "LBTC",
  "wbtc": "WBTC",
  "wbtc-perp": "WBTC",
};

function resolveCollateralSymbol(symbol: string): string {
  const key = symbol.toLowerCase().replace(/[\s\/]+/g, "-");
  return PERP_TO_COLLATERAL[key] ?? symbol;
}

export function getMultiplyVaultBySymbol(symbol: string): MultiplyVault | undefined {
  const resolved = resolveCollateralSymbol(symbol);
  const vaults = getMultiplyVaults();
  return vaults.find(v => v.collateralSymbol.toLowerCase() === resolved.toLowerCase());
}

export interface MultiplyConfirmData {
  vault: MultiplyVault;
  collateralAmount: number;
  targetMultiplier: number;
  totalExposure: number;
  debtAmount: number;
  netApyAtTarget: number;
  estAnnualYield: number;
  monthlyInterestCost: number;
  isNearMaxLeverage: boolean;
  deepLink: string;
}

export function buildMultiplyConfirm(
  symbol: string,
  amount: number,
  multiplier: number,
): MultiplyConfirmData {
  const vault = getMultiplyVaultBySymbol(symbol);
  if (!vault) {
    throw new Error(`No multiply vault found for ${symbol}. Available: ${getMultiplyVaults().map(v => v.collateralSymbol).join(', ')}`);
  }

  const cappedMultiplier = Math.min(multiplier, vault.maxMultiplier);
  const vaultData = MULTIPLY_VAULTS.find(v => v.collateralSymbol.toLowerCase() === vault.collateralSymbol.toLowerCase())!;
  const netApy = computeNetApy(vaultData.baseYieldPercent, vaultData.borrowCostPercent, cappedMultiplier);
  const totalExposure = amount * cappedMultiplier;
  const debtAmount = amount * (cappedMultiplier - 1);
  const estAnnualYield = (amount * netApy) / 100;
  const monthlyInterestCost = (debtAmount * vaultData.borrowCostPercent / 100) / 12;
  const isNearMaxLeverage = cappedMultiplier >= vault.maxMultiplier * 0.8;

  const deepLink = `https://app.jup.ag/multiply/${vault.collateralSymbol}`;

  return {
    vault,
    collateralAmount: amount,
    targetMultiplier: cappedMultiplier,
    totalExposure,
    debtAmount,
    netApyAtTarget: netApy,
    estAnnualYield,
    monthlyInterestCost,
    isNearMaxLeverage,
    deepLink,
  };
}
