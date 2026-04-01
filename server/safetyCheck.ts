import { PublicKey } from '@solana/web3.js';
import { getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { getConnection } from './rpc';

const connection = getConnection();

export interface OnChainSafetyResult {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  mintAuthDisabled: boolean;
  freezeAuthDisabled: boolean;
  supply: string;
  decimals: number;
  isToken2022: boolean;
  topHolderConcentration: number | null;
  topHolders: { address: string; percentage: number }[];
  risks: string[];
  score: number;
}

async function detectTokenProgram(mintPubkey: PublicKey): Promise<PublicKey> {
  try {
    await getMint(connection, mintPubkey, 'confirmed', TOKEN_PROGRAM_ID);
    return TOKEN_PROGRAM_ID;
  } catch {
    try {
      await getMint(connection, mintPubkey, 'confirmed', TOKEN_2022_PROGRAM_ID);
      return TOKEN_2022_PROGRAM_ID;
    } catch {
      return TOKEN_PROGRAM_ID;
    }
  }
}

async function getTopHolders(mintAddress: string): Promise<{ address: string; percentage: number }[]> {
  try {
    const res = await connection.getTokenLargestAccounts(new PublicKey(mintAddress));
    if (!res.value || res.value.length === 0) return [];

    const totalFromTop = res.value.reduce((sum, acc) => sum + Number(acc.uiAmount || 0), 0);
    if (totalFromTop === 0) return [];

    return res.value.slice(0, 10).map(acc => ({
      address: acc.address.toBase58(),
      percentage: totalFromTop > 0 ? (Number(acc.uiAmount || 0) / totalFromTop) * 100 : 0,
    }));
  } catch {
    return [];
  }
}

export async function getOnChainSafety(mintAddress: string): Promise<OnChainSafetyResult> {
  const risks: string[] = [];
  let score = 100;

  const mintPubkey = new PublicKey(mintAddress);

  const programId = await detectTokenProgram(mintPubkey);
  const isToken2022 = programId.equals(TOKEN_2022_PROGRAM_ID);

  const mintInfo = await getMint(connection, mintPubkey, 'confirmed', programId);

  const mintAuthority = mintInfo.mintAuthority?.toBase58() || null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() || null;
  const mintAuthDisabled = mintAuthority === null;
  const freezeAuthDisabled = freezeAuthority === null;
  const supply = mintInfo.supply.toString();
  const decimals = mintInfo.decimals;

  if (!mintAuthDisabled) {
    risks.push('Mint authority is active - new tokens can be minted at any time, diluting supply');
    score -= 30;
  }

  if (!freezeAuthDisabled) {
    risks.push('Freeze authority is active - your token accounts could be frozen by the issuer');
    score -= 25;
  }

  if (isToken2022) {
    risks.push('Uses Token-2022 program - may have additional extensions (transfer fees, permanent delegate, etc.)');
    score -= 5;
  }

  const topHolders = await getTopHolders(mintAddress);
  let topHolderConcentration: number | null = null;

  if (topHolders.length > 0) {
    topHolderConcentration = topHolders[0].percentage;

    if (topHolderConcentration > 50) {
      risks.push(`Top holder owns ${topHolderConcentration.toFixed(1)}% of circulating supply - extreme concentration risk`);
      score -= 25;
    } else if (topHolderConcentration > 20) {
      risks.push(`Top holder owns ${topHolderConcentration.toFixed(1)}% of circulating supply - high concentration`);
      score -= 10;
    }

    const top5Total = topHolders.slice(0, 5).reduce((s, h) => s + h.percentage, 0);
    if (top5Total > 80) {
      risks.push(`Top 5 holders control ${top5Total.toFixed(1)}% of circulating supply`);
      score -= 15;
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    mintAuthority,
    freezeAuthority,
    mintAuthDisabled,
    freezeAuthDisabled,
    supply,
    decimals,
    isToken2022,
    topHolderConcentration,
    topHolders: topHolders.slice(0, 5),
    risks,
    score,
  };
}
