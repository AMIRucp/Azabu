import {
  PublicKey, SystemProgram, Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import { createFeeInstruction, getSendFeeLamports, FEES } from './fees';
import { getConnection } from './rpc';

const connection = getConnection();

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface SendParams {
  senderPublicKey: string;
  recipientAddress: string;
  tokenMint: string;
  amount: number;
  decimals: number;
}

export interface SendResult {
  transaction: string;
  platformFeeSol: number;
  feeLabel: string;
}

export async function buildSendTransaction(params: SendParams): Promise<SendResult> {
  const sender = new PublicKey(params.senderPublicKey);
  const recipient = new PublicKey(params.recipientAddress);
  const atomicAmount = Math.round(params.amount * (10 ** params.decimals));

  const tx = new Transaction();

  if (params.tokenMint === SOL_MINT || params.tokenMint === 'SOL') {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports: atomicAmount,
      })
    );
  } else {
    const mint = new PublicKey(params.tokenMint);
    const senderAta = await getAssociatedTokenAddress(mint, sender);
    const recipientAta = await getAssociatedTokenAddress(mint, recipient);

    try {
      await getAccount(connection, recipientAta);
    } catch {
      tx.add(
        createAssociatedTokenAccountInstruction(
          sender,
          recipientAta,
          recipient,
          mint,
        )
      );
    }

    tx.add(
      createTransferInstruction(
        senderAta,
        recipientAta,
        sender,
        atomicAmount,
      )
    );
  }

  const feeLamports = getSendFeeLamports();
  tx.add(createFeeInstruction(sender, feeLamports));

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = sender;

  return {
    transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'),
    platformFeeSol: FEES.SEND_FEE_FLAT_SOL,
    feeLabel: FEES.FEE_LABEL,
  };
}
