export type Protocol = 'aster' | 'hyperliquid' | 'lighter';

export type Chain = 'arbitrum' | 'hyperliquid' | 'lighter';

export type MarketType = 'perp' | 'spot';

export interface ProtocolConfig {
  id: Protocol;
  name: string;
  chain: Chain;
  perps: boolean;
  spot: boolean;
  maxLeverage: number;
  settlement: string;
  apiBase: string;
  fees: { maker: number; taker: number; closing?: number };
  color: string;
  badge: string;
  logo: string;
  viewOnly?: boolean;
  contracts?: {
    usdc?: string;
    trading?: string;
    tradingStorage?: string;
  };
}

export const PROTOCOLS: Record<Protocol, ProtocolConfig> = {
  aster: {
    id: 'aster',
    name: 'Aster DEX',
    chain: 'arbitrum',
    perps: true,
    spot: true,
    maxLeverage: 300,
    settlement: 'USDT',
    apiBase: 'https://fapi.asterdex.com',
    fees: { maker: 0.0001, taker: 0.00035 },
    color: '#D4A574',
    badge: 'ASTER',
    logo: '/assets/aster-logo.png',
  },
  hyperliquid: {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    chain: 'hyperliquid',
    perps: true,
    spot: true,
    maxLeverage: 200,
    settlement: 'USDC',
    apiBase: 'https://api.hyperliquid.xyz',
    fees: { maker: 0.0001, taker: 0.00035 },
    color: '#33FF88',
    badge: 'HL',
    logo: '/tokens/hyperliquid.webp',
  },
  lighter: {
    id: 'lighter',
    name: 'Lighter',
    chain: 'lighter',
    perps: true,
    spot: false,
    maxLeverage: 50,
    settlement: 'USDC',
    apiBase: 'https://mainnet.zklighter.elliot.ai',
    fees: { maker: 0.0001, taker: 0.0003 },
    color: '#6366F1',
    badge: 'LTR',
    logo: '/tokens/lighter.webp',
  },
};

export const PROTOCOL_LIST = Object.values(PROTOCOLS);

export function getProtocolByChain(chain: Chain): ProtocolConfig[] {
  return PROTOCOL_LIST.filter((p) => p.chain === chain);
}
