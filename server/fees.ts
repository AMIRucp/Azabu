import { SystemProgram, PublicKey, TransactionInstruction, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnection } from './rpc';

const connection = getConnection();

const treasuryWallet = process.env.APRICITY_TREASURY_WALLET;
if (!treasuryWallet) {
  console.warn('[fees] APRICITY_TREASURY_WALLET not set - fee transactions will fail');
}

export const FEES = {
  TREASURY: treasuryWallet || '',
  SWAP_FEE_BPS: 50,
  SEND_FEE_FLAT_SOL: 0.001,
  LAUNCH_FEE_BPS: 50,
  BATCH_SWAP_FEE_BPS: 50,
  BATCH_SWAP_MIN_SOL: 0.0005,
  SHOW_FEE_BREAKDOWN: true,
  FEE_LABEL: 'AFX fee',
} as const;

let treasury: PublicKey;
try {
  treasury = new PublicKey(FEES.TREASURY);
} catch {
  treasury = PublicKey.default;
}

export function calcSwapFeeSol(inputAmountSol: number): number {
  return inputAmountSol * (FEES.SWAP_FEE_BPS / 10000);
}

export function calcSwapFeeLamports(inputAmountSol: number): number {
  return Math.ceil(calcSwapFeeSol(inputAmountSol) * LAMPORTS_PER_SOL);
}

export function calcBatchSwapFeeLamports(inputAmountSol: number): number {
  const feeSol = inputAmountSol * (FEES.BATCH_SWAP_FEE_BPS / 10000);
  const floorSol = FEES.BATCH_SWAP_MIN_SOL;
  return Math.ceil(Math.max(feeSol, floorSol) * LAMPORTS_PER_SOL);
}

export function getSendFeeLamports(): number {
  return Math.ceil(FEES.SEND_FEE_FLAT_SOL * LAMPORTS_PER_SOL);
}

export function calcLaunchFeeSol(initialBuySol: number): number {
  if (initialBuySol <= 0) return 0;
  return initialBuySol * (FEES.LAUNCH_FEE_BPS / 10000);
}

export function calcLaunchFeeLamports(initialBuySol: number): number {
  return Math.ceil(calcLaunchFeeSol(initialBuySol) * LAMPORTS_PER_SOL);
}

export function createFeeInstruction(
  payerPubkey: PublicKey,
  feeLamports: number
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: payerPubkey,
    toPubkey: treasury,
    lamports: feeLamports,
  });
}

export async function buildFeeTx(payerPubkey: string, feeLamports: number): Promise<string> {
  const payer = new PublicKey(payerPubkey);
  const tx = new Transaction();
  tx.add(createFeeInstruction(payer, feeLamports));

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer;

  return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
}
