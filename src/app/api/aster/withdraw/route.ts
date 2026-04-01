import { NextRequest, NextResponse } from "next/server";

const TREASURY_ADDRESS = "0x9E36CB86a159d479cEd94Fa05036f235Ac40E1d5";
const USDT_ARBITRUM = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const USDC_ARBITRUM = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const CHAIN_ID = 42161;

const TREASURY_ABI = [
  "function withdraw(address currency, uint256 amount) external",
  "function withdrawAll(address[] calldata currencies) external",
] as const;

const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, amount, asset } = body;

    if (!userAddress || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const token = (asset || "USDT").toUpperCase();
    const tokenAddress = token === "USDC" ? USDC_ARBITRUM : USDT_ARBITRUM;

    return NextResponse.json({
      treasuryAddress: TREASURY_ADDRESS,
      tokenAddress,
      decimals: 6,
      asset: token,
      chainId: CHAIN_ID,
      withdrawAmount: amount,
      treasuryAbi: TREASURY_ABI,
      erc20Abi: ERC20_ABI,
    });
  } catch (e: any) {
    console.error("[aster/withdraw] Error:", e.message);
    return NextResponse.json({ error: e.message || "Failed to prepare withdrawal" }, { status: 500 });
  }
}
