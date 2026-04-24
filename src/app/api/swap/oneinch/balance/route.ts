import { NextRequest, NextResponse } from "next/server";

const CHAIN_IDS: Record<number, number> = {
  1: 1,
  42161: 42161,
  8453: 8453,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenAddress, walletAddress, chainId } = body;

    if (!tokenAddress || !walletAddress || !chainId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ONEINCH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const oneInchChainId = CHAIN_IDS[chainId];
    if (!oneInchChainId) {
      return NextResponse.json(
        { error: `Unsupported chain: ${chainId}` },
        { status: 400 }
      );
    }

    const url = `https://api.1inch.com/balance/v1.2/${oneInchChainId}/balances/${walletAddress}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status}`);
    }

    const data = await response.json();
    
    const tokenLower = tokenAddress.toLowerCase();
    let balance = "0";

    if (typeof data === 'object' && data !== null) {
      if (data[tokenLower]) {
        balance = data[tokenLower];
      } else if (data.balances && typeof data.balances === 'object' && data.balances[tokenLower]) {
        balance = data.balances[tokenLower];
      } else {
        for (const [key, value] of Object.entries(data)) {
          if (key.toLowerCase() === tokenLower) {
            balance = String(value);
            break;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      balance: balance.toString(),
      formatted: balance,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch balance", details: errorMessage },
      { status: 500 }
    );
  }
}
