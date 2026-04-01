import { PublicKey, Transaction } from "@solana/web3.js";
import { createCloseAccountInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "./rpc";

export interface EmptyTokenAccount {
  address: string;
  mint: string;
  rentLamports: number;
}

export interface ReclaimScanResult {
  accounts: EmptyTokenAccount[];
  totalReclaimable: number;
  totalAccounts: number;
  rentPerAccount: number;
}

const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export async function scanEmptyTokenAccounts(walletPubkey: string): Promise<ReclaimScanResult> {
  const connection = getConnection();
  const owner = new PublicKey(walletPubkey);

  const [splAccounts, token2022Accounts, rentPerAccount] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }).catch(() => ({ value: [] })),
    connection.getMinimumBalanceForRentExemption(165),
  ]);

  const allAccounts = [...splAccounts.value, ...token2022Accounts.value];
  const emptyAccounts: EmptyTokenAccount[] = [];

  for (const { pubkey, account } of allAccounts) {
    const parsed = account.data.parsed?.info;
    if (!parsed) continue;

    const amount = parsed.tokenAmount?.uiAmount ?? parseFloat(parsed.tokenAmount?.amount || "0");
    if (amount === 0) {
      emptyAccounts.push({
        address: pubkey.toBase58(),
        mint: parsed.mint,
        rentLamports: rentPerAccount,
      });
    }
  }

  const totalReclaimable = emptyAccounts.length * rentPerAccount;

  return {
    accounts: emptyAccounts,
    totalReclaimable,
    totalAccounts: allAccounts.length,
    rentPerAccount,
  };
}

export async function buildReclaimTransaction(
  walletPubkey: string,
  accountAddresses: string[]
): Promise<{ serializedTx: string; accountCount: number; reclaimLamports: number }> {
  const connection = getConnection();
  const owner = new PublicKey(walletPubkey);
  const rentPerAccount = await connection.getMinimumBalanceForRentExemption(165);

  const maxPerTx = 20;
  const batch = accountAddresses.slice(0, maxPerTx);

  const tx = new Transaction();
  for (const addr of batch) {
    const accountPubkey = new PublicKey(addr);
    tx.add(
      createCloseAccountInstruction(
        accountPubkey,
        owner,
        owner,
      )
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = owner;

  const serializedTx = tx.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  }).toString("base64");

  return {
    serializedTx,
    accountCount: batch.length,
    reclaimLamports: batch.length * rentPerAccount,
  };
}
