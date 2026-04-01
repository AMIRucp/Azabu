import { NextResponse } from 'next/server';

const ARBITRUM_CHAIN_ID = 42161;
const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const BRIDGE_ADDRESS = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const;

const BRIDGE_ABI = [
  'function sendUSDC(uint64 usdc, address destination) payable',
] as const;

export async function GET() {
  return NextResponse.json({
    chainId: ARBITRUM_CHAIN_ID,
    usdcAddress: USDC_ADDRESS,
    bridgeAddress: BRIDGE_ADDRESS,
    erc20Abi: ERC20_ABI,
    bridgeAbi: BRIDGE_ABI,
    instructions: [
      '1. Switch to Arbitrum network',
      '2. Approve USDC spending on bridge contract',
      '3. Call sendUSDC(amount, destination) to deposit to your HL account',
      '4. Wait ~1 minute for funds to appear',
    ],
  });
}
