import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import BN from "bn.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import { IDL, type Perpetuals } from "./jupiterPerpetualsIdl";
import { getConnection } from "../rpc";

export const JUPITER_PERPETUALS_PROGRAM_ID = new PublicKey(
  "PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu",
);

export const JUPITER_PERPETUALS_EVENT_AUTHORITY = new PublicKey(
  "37hJBDnntwqhGbK7L6M1bLyvccj4u55CCUiLPdYkiqBN",
);

export const JLP_POOL_ACCOUNT_PUBKEY = new PublicKey(
  "5BUwFW4nRbftYTDMbgxykoFWqWHPzahFSNAaaaJtVKsq",
);

export const JLP_MINT_PUBKEY = new PublicKey(
  "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
);

export enum CUSTODY_PUBKEY {
  SOL = "7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz",
  ETH = "AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn",
  BTC = "5Pv3gM9JrFFH883SWAhvJC9RPYmo8UNxuFtv5bMMALkm",
  USDC = "G18jKKXQwBbrHeiK3C9MRXhkHsLHf7XgCSisykV46EZa",
  USDT = "4vkNeXiYEUizLdrpdPS1eC2mccyM4NUPRtERrk6ZETkk",
}

export const CUSTODY_DETAILS: Record<string, {
  name: string;
  mint: PublicKey;
  pythnetOracle: PublicKey;
  dovesOracle: PublicKey;
  chainlinkOracle: PublicKey;
  dovesAgOracle: PublicKey;
  tokenAccount: PublicKey;
}> = {
  [CUSTODY_PUBKEY.SOL]: {
    name: "SOL",
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    pythnetOracle: new PublicKey("7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE"),
    dovesOracle: new PublicKey("39cWjvHrpHNz2SbXv6ME4NPhqBDBd4KsjUYv5JkHEAJU"),
    chainlinkOracle: new PublicKey("FWLXDDgW2Qm2VuX8MdV99VYpo6X1HLEykUjfAsjz2G78"),
    dovesAgOracle: new PublicKey("FYq2BWQ1V5P1WFBqr3qB2Kb5yHVvSv7upzKodgQE5zXh"),
    tokenAccount: new PublicKey("BUvduFTd2sWFagCunBPLupG8fBTJqweLw9DuhruNFSCm"),
  },
  [CUSTODY_PUBKEY.ETH]: {
    name: "ETH",
    mint: new PublicKey("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"),
    pythnetOracle: new PublicKey("42amVS4KgzR9rA28tkVYqVXjq9Qa8dcZQMbH5EYFX6XC"),
    dovesOracle: new PublicKey("5URYohbPy32nxK1t3jAHVNfdWY2xTubHiFvLrE3VhXEp"),
    chainlinkOracle: new PublicKey("BNQzYvnidN8vVVn78xh6wgLo5ozmV8Dx8AE8rndqeLEe"),
    dovesAgOracle: new PublicKey("AFZnHPzy4mvVCffrVwhewHbFc93uTHvDSFrVH7GtfXF1"),
    tokenAccount: new PublicKey("Bgarxg65CEjN3kosjCW5Du3wEqvV3dpCGDR3a2HRQsYJ"),
  },
  [CUSTODY_PUBKEY.BTC]: {
    name: "BTC",
    mint: new PublicKey("3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh"),
    pythnetOracle: new PublicKey("4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo"),
    dovesOracle: new PublicKey("4HBbPx9QJdjJ7GUe6bsiJjGybvfpDhQMMPXP1UEa7VT5"),
    chainlinkOracle: new PublicKey("A6F8mvoM8Qc9wTaKjrD1B5Fgpp6NhPQyJLWXeafWrbsV"),
    dovesAgOracle: new PublicKey("hUqAT1KQ7eW1i6Csp9CXYtpPfSAvi835V7wKi5fRfmC"),
    tokenAccount: new PublicKey("FgpXg2J3TzSs7w3WGYYE7aWePdrxBVLCXSxmAKnCZNtZ"),
  },
  [CUSTODY_PUBKEY.USDC]: {
    name: "USDC",
    mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    pythnetOracle: new PublicKey("Dpw1EAVrSB1ibxiDQyTAW6Zip3J4Btk2x4SgApQCeFbX"),
    dovesOracle: new PublicKey("A28T5pKtscnhDo6C1Sz786Tup88aTjt8uyKewjVvPrGk"),
    chainlinkOracle: new PublicKey("3Z4gQ5ujXZSYeVyPhkakVcrmyMxhAk6VT2NYSVV3RGGU"),
    dovesAgOracle: new PublicKey("6Jp2xZUTWdDD2ZyUPRzeMdc6AFQ5K3pFgZxk2EijfjnM"),
    tokenAccount: new PublicKey("WzWUoCmtVv7eqAbU3BfKPU3fhLP6CXR8NCJH78UK9VS"),
  },
  [CUSTODY_PUBKEY.USDT]: {
    name: "USDT",
    mint: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    pythnetOracle: new PublicKey("HT2PLQBcG5EiCcNSaMHAjSgd9F98ecpATbk4Sk5oYuM"),
    dovesOracle: new PublicKey("AGW7q2a3WxCzh5TB2Q6yNde1Nf41g3HLaaXdybz7cbBU"),
    chainlinkOracle: new PublicKey("5KQxzQ4xQGPUiJGYbujLjygm6Frin9zE5h996hxxfyqe"),
    dovesAgOracle: new PublicKey("Fgc93D641F8N2d1xLjQ4jmShuD3GE3BsCXA56KBQbF5u"),
    tokenAccount: new PublicKey("Gex24YznvguMad1mBzTQ7a64U1CJy59gvsStQmNnnwAd"),
  },
};

export const MARKET_TO_CUSTODY: Record<string, { custody: string; collateralCustody: string }> = {
  SOL: { custody: CUSTODY_PUBKEY.SOL, collateralCustody: CUSTODY_PUBKEY.USDC },
  BTC: { custody: CUSTODY_PUBKEY.BTC, collateralCustody: CUSTODY_PUBKEY.USDC },
  ETH: { custody: CUSTODY_PUBKEY.ETH, collateralCustody: CUSTODY_PUBKEY.USDC },
};

export const USDC_DECIMALS = 6;
export const BPS_POWER = new BN(10_000);
export const RATE_POWER = new BN(1_000_000_000);
export const JLP_DECIMALS = 6;
export const USD_POWER = new BN(1_000_000);

let programInstance: Program<Perpetuals> | null = null;

export function getPerpetualsProgram(): Program<Perpetuals> {
  if (!programInstance) {
    const connection = getConnection();
    const provider = new AnchorProvider(
      connection,
      new Wallet(Keypair.generate()),
      { preflightCommitment: "confirmed" },
    );
    programInstance = new Program<Perpetuals>(
      IDL,
      JUPITER_PERPETUALS_PROGRAM_ID,
      provider,
    );
  }
  return programInstance;
}
