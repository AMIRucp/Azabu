import { NextRequest, NextResponse } from "next/server";

const TREASURY_ADDRESSES: Record<number, string> = {
  42161: "0x9E36CB86a159d479cEd94Fa05036f235Ac40E1d5",
};

const TOKEN_MAP: Record<string, { address: string; decimals: number }> = {
  USDT:   { address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
  USDC:   { address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
  "USDC.e": { address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6 },
  ETH:    { address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
};

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const TREASURY_ABI = [
  "function deposit(address currency, uint256 amount, uint256 broker)",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, amount, asset } = body;

    if (!userAddress || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const token = (asset || "USDT").toUpperCase().replace("USDC.E", "USDC.e");
    const tokenInfo = TOKEN_MAP[token] || TOKEN_MAP["USDT"];
    const treasuryAddress = TREASURY_ADDRESSES[42161];

    if (!treasuryAddress) {
      return NextResponse.json({ error: "No treasury address for Arbitrum" }, { status: 500 });
    }

    return NextResponse.json({
      tokenAddress: tokenInfo.address,
      treasuryAddress,
      decimals: tokenInfo.decimals,
      asset: token,
      chainId: 42161,
      depositAmount: amount,
      erc20Abi: ERC20_ABI,
      treasuryAbi: TREASURY_ABI,
      broker: 0,
    });
  } catch (e: any) {
    console.error("[aster/deposit] Error:", e.message);
    return NextResponse.json({ error: e.message || "Failed to prepare deposit" }, { status: 500 });
  }
}
