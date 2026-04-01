import { HttpTransport, ExchangeClient, InfoClient } from '@nktkas/hyperliquid';
import { privateKeyToAccount } from 'viem/accounts';

const transport = new HttpTransport();

export function createInfoClient() {
  return new InfoClient({ transport });
}

export function createExchangeClient(privateKey: `0x${string}`) {
  const wallet = privateKeyToAccount(privateKey);
  return new ExchangeClient({ transport, wallet });
}

export interface HlOrderParams {
  coin: string;
  isBuy: boolean;
  size: string;
  price: string;
  orderType: 'market' | 'limit';
  reduceOnly?: boolean;
  tpsl?: {
    type: 'tp' | 'sl';
    triggerPx: string;
  };
}

export async function placeOrder(
  agentKey: `0x${string}`,
  assetIndex: number,
  params: HlOrderParams,
) {
  const exchange = createExchangeClient(agentKey);

  const orderType = params.orderType === 'market'
    ? { limit: { tif: 'FrontendMarket' as const } }
    : { limit: { tif: 'Gtc' as const } };

  const result = await exchange.order({
    orders: [{
      a: assetIndex,
      b: params.isBuy,
      p: params.price,
      s: params.size,
      r: params.reduceOnly ?? false,
      t: orderType,
    }],
    grouping: 'na',
  });

  if (params.tpsl) {
    try {
      await exchange.order({
        orders: [{
          a: assetIndex,
          b: !params.isBuy,
          p: params.tpsl.triggerPx,
          s: params.size,
          r: true,
          t: {
            trigger: {
              isMarket: true,
              triggerPx: params.tpsl.triggerPx,
              tpsl: params.tpsl.type,
            },
          },
        }],
        grouping: 'positionTpsl',
      });
    } catch (e) {
      console.warn('[HL] TP/SL placement failed:', e);
    }
  }

  return result;
}

/**
 * Register a referral code for the account tied to `agentKey`.
 * Called once after the agent is approved. Silently ignored if
 * HL_REFERRAL_CODE env var is not set or if the call fails.
 */
export async function applyReferralCode(agentKey: `0x${string}`) {
  const code = process.env.HL_REFERRAL_CODE;
  if (!code) return;
  try {
    const exchange = createExchangeClient(agentKey);
    await exchange.setReferrer({ code });
    console.log(`[HL] Referral code "${code}" applied successfully`);
  } catch (e: any) {
    // Non-fatal — user may already have a referrer set
    console.warn('[HL] setReferrer failed (non-fatal):', e.message);
  }
}

export async function setPositionTpSl(
  agentKey: `0x${string}`,
  assetIndex: number,
  isBuy: boolean,
  size: string,
  triggerPx: string,
  tpslType: 'tp' | 'sl',
) {
  const exchange = createExchangeClient(agentKey);
  return exchange.order({
    orders: [{
      a: assetIndex,
      b: !isBuy,
      p: triggerPx,
      s: size,
      r: true,
      t: {
        trigger: {
          isMarket: true,
          triggerPx,
          tpsl: tpslType,
        },
      },
    }],
    grouping: 'positionTpsl',
  });
}

export async function cancelOrder(
  agentKey: `0x${string}`,
  assetIndex: number,
  orderId: number,
) {
  const exchange = createExchangeClient(agentKey);
  return exchange.cancel({
    cancels: [{ a: assetIndex, o: orderId }],
  });
}

export async function updateLeverage(
  agentKey: `0x${string}`,
  assetIndex: number,
  leverage: number,
  isCross: boolean,
) {
  const exchange = createExchangeClient(agentKey);
  return exchange.updateLeverage({
    asset: assetIndex,
    isCross,
    leverage,
  });
}
