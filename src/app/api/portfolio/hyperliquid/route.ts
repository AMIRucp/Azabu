import { NextRequest, NextResponse } from "next/server";
import { HttpTransport, InfoClient, SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

const CACHE_TTL = 5_000;

interface CacheEntry {
  data: any;
  ts: number;
}

const cache = new Map<string, CacheEntry>();

const g = globalThis as typeof globalThis & {
  _portfolioWsSubscription?: SubscriptionClient;
  _portfolioLivePrices?: Map<string, { price: number; timestamp: number }>;
  _portfolioWsInitialized?: boolean;
};

if (!g._portfolioLivePrices) {
  g._portfolioLivePrices = new Map();
}

async function initPortfolioWebSocket() {
  if (g._portfolioWsInitialized) return;
  g._portfolioWsInitialized = true;

  try {
    const transport = new WebSocketTransport();
    const subs = new SubscriptionClient({ transport });

    await subs.allMids((data) => {
      if (!g._portfolioLivePrices) g._portfolioLivePrices = new Map();
      
      Object.entries(data).forEach(([coin, priceStr]) => {
        g._portfolioLivePrices!.set(coin, {
          price: parseFloat(priceStr as string),
          timestamp: Date.now(),
        });
      });
    });

    g._portfolioWsSubscription = subs;
  } catch (error) {
    g._portfolioWsInitialized = false;
  }
}

initPortfolioWebSocket();

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "address parameter required" },
      { status: 400 }
    );
  }

  const cacheKey = address.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    const updatedPositions = cached.data.positions.map((pos: any) => {
      const livePrice = g._portfolioLivePrices?.get(pos.coin);
      if (livePrice) {
        return {
          ...pos,
          markPrice: livePrice.price,
        };
      }
      return pos;
    });

    return NextResponse.json(
      { 
        ...cached.data, 
        positions: updatedPositions,
        livePriceCount: g._portfolioLivePrices?.size || 0,
        wsConnected: !!g._portfolioWsSubscription,
      },
      {
        headers: { 
          "X-Cache": "HIT-LIVE",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }

  try {
    const transport = new HttpTransport();
    const info = new InfoClient({ transport });

    const [state, openOrders, spotState] = await Promise.all([
      info.clearinghouseState({ user: address }),
      info.openOrders({ user: address }),
      info.spotClearinghouseState({ user: address }),
    ]);

    const accountValue = state.marginSummary
      ? parseFloat(state.marginSummary.accountValue)
      : 0;
    const withdrawable = parseFloat(state.withdrawable || "0");
    const totalMarginUsed = state.marginSummary
      ? parseFloat(state.marginSummary.totalMarginUsed)
      : 0;
    const totalNtlPos = state.marginSummary
      ? parseFloat(state.marginSummary.totalNtlPos)
      : 0;
    const totalRawUsd = state.marginSummary
      ? parseFloat(state.marginSummary.totalRawUsd)
      : 0;

    // Get spot USDC balance
    let spotUsdcBalance = 0;
    if (spotState && spotState.balances) {
      const usdcBalance = spotState.balances.find(b => b.coin === "USDC");
      if (usdcBalance) {
        const total = parseFloat(usdcBalance.total);
        const hold = parseFloat(usdcBalance.hold);
        spotUsdcBalance = total - hold; // Available USDC
      }
    }

    // Total account value = perp account + spot USDC
    const totalAccountValue = accountValue + spotUsdcBalance;

    const positions = (state.assetPositions || []).map((pos) => {
      const position = pos.position;
      const size = parseFloat(position.szi);
      const entryPrice = parseFloat(position.entryPx);
      const leverage = typeof position.leverage.value === 'string' 
        ? parseFloat(position.leverage.value)
        : position.leverage.value;
      const unrealizedPnl = parseFloat(position.unrealizedPnl);
      const returnOnEquity = parseFloat(position.returnOnEquity);
      const liquidationPrice = position.liquidationPx
        ? parseFloat(position.liquidationPx)
        : null;

      const livePrice = g._portfolioLivePrices?.get(position.coin);
      const markPrice = livePrice?.price || entryPrice;

      return {
        coin: position.coin,
        side: size > 0 ? "long" : "short",
        size: Math.abs(size),
        entryPrice,
        markPrice,
        leverage,
        unrealizedPnl,
        returnOnEquity: returnOnEquity * 100,
        liquidationPrice,
        marginType: position.leverage.type,
        rawPosition: position,
      };
    });

    const orders = (openOrders || []).map((order) => ({
      orderId: order.oid,
      coin: order.coin,
      side: order.side,
      price: parseFloat(order.limitPx),
      size: parseFloat(order.sz),
      filled: 0,
      orderType: "limit",
      rawOrder: order,
    }));

    const response = {
      success: true,
      address,
      account: {
        accountValue: totalAccountValue,
        availableBalance: withdrawable + spotUsdcBalance,
        marginUsed: totalMarginUsed,
        positionValue: totalNtlPos,
        rawUsd: totalRawUsd,
        spotUsdcBalance,
      },
      positions,
      openOrders: orders,
      timestamp: Date.now(),
      livePriceCount: g._portfolioLivePrices?.size || 0,
      wsConnected: !!g._portfolioWsSubscription,
    };

    cache.set(cacheKey, { data: response, ts: Date.now() });

    return NextResponse.json(response, {
      headers: { 
        "X-Cache": "MISS",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("does not exist")) {
      return NextResponse.json(
        {
          success: false,
          error: "Account not found or still initializing",
          details: errorMessage,
          address,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch portfolio data",
        details: errorMessage,
        address,
      },
      { status: 500 }
    );
  }
}
