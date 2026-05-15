import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, getAddress, http, parseUnits, type Address } from "viem";
import { arbitrum } from "viem/chains";
import { ARBITRUM_MAINNET_CHAIN_ID } from "@/config/asterFapi";

const ASTER_TREASURY = "0x9E36CB86a159d479cEd94Fa05036f235Ac40E1d5" as Address;
const USDC_ARBITRUM_NATIVE = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address;
const BROKER_ID = 1n;
const MIN_DEPOSIT = 1;

const USDC_ABI = [
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const TREASURY_DEPOSIT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "currency", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "broker", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const USDC_PERMIT_ABI = [
  {
    name: "permit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

const PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

let publicClient: ReturnType<typeof createPublicClient> | null = null;

function getPublicClient() {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: arbitrum,
      transport: http("https://arb1.arbitrum.io/rpc"),
    });
  }
  return publicClient;
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, amount, tokenAddress: tokenAddressRaw } = await request.json();

    if (!userAddress || !amount) {
      return NextResponse.json(
        { error: "userAddress and amount are required" },
        { status: 400 }
      );
    }

    const tokenAddress =
      tokenAddressRaw != null && tokenAddressRaw !== ""
        ? getAddress(tokenAddressRaw as Address)
        : USDC_ARBITRUM_NATIVE;

    if (tokenAddress.toLowerCase() !== USDC_ARBITRUM_NATIVE.toLowerCase()) {
      return NextResponse.json(
        { error: "Aster deposits use native Arbitrum USDC only." },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < MIN_DEPOSIT) {
      return NextResponse.json(
        { error: `Minimum deposit is ${MIN_DEPOSIT} USDC` },
        { status: 400 }
      );
    }

    const client = getPublicClient();
    const address = userAddress as Address;

    const [balanceWei, nonce] = await Promise.all([
      client.readContract({
        address: USDC_ARBITRUM_NATIVE,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      }),
      client.readContract({
        address: USDC_ARBITRUM_NATIVE,
        abi: USDC_ABI,
        functionName: "nonces",
        args: [address],
      }),
    ]);

    const balance = Number(balanceWei) / 1e6;

    if (balance < amountNum) {
      return NextResponse.json(
        {
          error: `Insufficient USDC balance. You have ${balance.toFixed(2)} USDC`,
        },
        { status: 400 }
      );
    }

    const amountWei = parseUnits(amountNum.toString(), 6);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

    const permitDomain = {
      name: "USD Coin",
      version: "2",
      chainId: ARBITRUM_MAINNET_CHAIN_ID,
      verifyingContract: USDC_ARBITRUM_NATIVE,
    } as const;

    return NextResponse.json({
      success: true,
      balance,
      domain: permitDomain,
      types: PERMIT_TYPES,
      message: {
        owner: address,
        spender: ASTER_TREASURY,
        value: amountWei.toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString(),
      },
      amountWei: amountWei.toString(),
      treasuryAddress: ASTER_TREASURY,
      tokenAddress: USDC_ARBITRUM_NATIVE,
      brokerId: BROKER_ID.toString(),
      treasuryAbi: TREASURY_DEPOSIT_ABI,
      tokenPermitAbi: USDC_PERMIT_ABI,
      asset: "USDC",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to prepare Aster deposit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
