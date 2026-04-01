import { hlInfoPost } from './hlClient';

export interface HlPosition {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  leverage: { type: string; value: number };
  liquidationPx: string | null;
  marginUsed: string;
  maxLeverage: number;
}

export interface HlAccountState {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  crossMarginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  assetPositions: {
    position: {
      coin: string;
      szi: string;
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      returnOnEquity: string;
      leverage: { type: string; value: number };
      liquidationPx: string | null;
      marginUsed: string;
      maxLeverage: number;
    };
    type: string;
  }[];
}

export async function fetchAccountState(userAddress: string): Promise<HlAccountState> {
  return hlInfoPost({
    type: 'clearinghouseState',
    user: userAddress,
  });
}

export async function fetchOpenOrders(userAddress: string) {
  return hlInfoPost({
    type: 'openOrders',
    user: userAddress,
  });
}

export async function fetchUserFills(userAddress: string) {
  return hlInfoPost({
    type: 'userFills',
    user: userAddress,
  });
}
