import { Connection, PublicKey } from "@solana/web3.js";

const VAULT_PROGRAM_ID = new PublicKey("vAuLTsyrvSfZRuRB3XgvkPwNGgYSs9YRYymVebLKoxR");

function getRpcUrl(): string {
  const heliusKey = process.env.HELIUS_API_KEY;
  if (heliusKey) return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  return "https://api.mainnet-beta.solana.com";
}

const SPOT_SYMBOLS: Record<number, string> = {
  0: "USDC", 1: "SOL", 2: "BTC", 3: "ETH", 4: "USDT",
  5: "JTO", 6: "JUP", 7: "PYTH", 8: "RNDR", 9: "W",
};

export interface VaultInfo {
  address: string;
  name: string;
  manager: string;
  userShares: number;
  totalShares: number;
  redeemPeriodDays: number;
  maxTokens: number;
  managementFee: number;
  netDeposits: number;
  totalDeposits: number;
  totalWithdraws: number;
  minDepositAmount: number;
  profitShare: number;
  sharesBase: number;
  spotMarketIndex: number;
  depositAsset: string;
  permissioned: boolean;
  equity: number;
  sharePrice: number;
}

let vaultCache: { data: VaultInfo[]; ts: number } | null = null;
const CACHE_TTL = 120_000;

export async function fetchAllVaults(): Promise<VaultInfo[]> {
  if (vaultCache && Date.now() - vaultCache.ts < CACHE_TTL) {
    return vaultCache.data;
  }

  const connection = new Connection(getRpcUrl(), { commitment: "confirmed" });

  try {
    const accounts = await connection.getProgramAccounts(VAULT_PROGRAM_ID, {
      commitment: "confirmed",
    });

    const vaults: VaultInfo[] = [];

    for (const { pubkey, account } of accounts) {
      try {
        const data = account.data;
        if (data.length < 472) continue;

        const parsed = parseVaultAccount(data, pubkey.toBase58());
        if (parsed && parsed.name && parsed.name.length > 0) {
          vaults.push(parsed);
        }
      } catch {}
    }

    vaults.sort((a, b) => b.equity - a.equity);

    const topVaults = vaults.filter(v => v.equity > 0).slice(0, 100);

    vaultCache = { data: topVaults, ts: Date.now() };
    return topVaults;
  } catch (e: any) {
    console.warn("fetchAllVaults error:", e.message);
    if (vaultCache) return vaultCache.data;
    return [];
  }
}

function readU64Safe(buf: Buffer, offset: number): bigint {
  return buf.readBigUInt64LE(offset);
}

function readI64Safe(buf: Buffer, offset: number): bigint {
  return buf.readBigInt64LE(offset);
}

function readU128AsBigInt(buf: Buffer, offset: number): bigint {
  const low = buf.readBigUInt64LE(offset);
  const high = buf.readBigUInt64LE(offset + 8);
  return (high << 64n) + low;
}

function bigToNum(b: bigint): number {
  return Number(b);
}

function parseVaultAccount(data: Buffer, address: string): VaultInfo | null {
  try {
    if (data.length < 472) return null;

    const nameBytes = data.slice(8, 8 + 32);
    const name = Buffer.from(nameBytes).toString("utf8").replace(/\0/g, "").trim();
    if (!name || name.length < 1) return null;

    const manager = new PublicKey(data.slice(72, 104)).toBase58();

    const userSharesBig = readU128AsBigInt(data, 264);
    const totalSharesBig = readU128AsBigInt(data, 280);

    const redeemPeriod = bigToNum(readI64Safe(data, 312));
    const maxTokensBig = readU64Safe(data, 328);
    const managementFeeBig = readI64Safe(data, 336);
    const netDepositsBig = readI64Safe(data, 352);
    const totalDepositsBig = readU64Safe(data, 368);
    const totalWithdrawsBig = readU64Safe(data, 376);
    const minDepositAmountBig = readU64Safe(data, 416);

    const sharesBase = data.readUInt32LE(456);
    const profitShareRaw = data.readUInt32LE(460);
    const spotMarketIndex = data.readUInt16LE(468);
    const permissioned = data[471] === 1;

    const decimals = spotMarketIndex === 0 || spotMarketIndex === 4 ? 6 : 9;
    const divisorBig = BigInt(10 ** decimals);

    const netDepositsNorm = Number(netDepositsBig) / Number(divisorBig);
    const totalDepositsNorm = Number(totalDepositsBig) / Number(divisorBig);
    const totalWithdrawsNorm = Number(totalWithdrawsBig) / Number(divisorBig);

    const equity = totalDepositsNorm - totalWithdrawsNorm;

    const SHARE_PRECISION = 1e6;
    const sharesRebase = sharesBase > 0 ? 10 ** sharesBase : 1;
    const totalSharesDivisor = SHARE_PRECISION * sharesRebase;
    const userSharesNorm = Number(userSharesBig) / totalSharesDivisor;
    const totalSharesNorm = Number(totalSharesBig) / totalSharesDivisor;
    const sharePrice = totalSharesNorm > 0 ? Math.abs(equity) / totalSharesNorm : 1;

    return {
      address,
      name,
      manager,
      userShares: userSharesNorm,
      totalShares: totalSharesNorm,
      redeemPeriodDays: redeemPeriod / 86400,
      maxTokens: Number(maxTokensBig) / Number(divisorBig),
      managementFee: (Number(managementFeeBig) / 1e6) * 100,
      netDeposits: netDepositsNorm,
      totalDeposits: totalDepositsNorm,
      totalWithdraws: totalWithdrawsNorm,
      minDepositAmount: Number(minDepositAmountBig) / Number(divisorBig),
      profitShare: profitShareRaw / 10000,
      sharesBase,
      spotMarketIndex,
      depositAsset: SPOT_SYMBOLS[spotMarketIndex] || `Spot#${spotMarketIndex}`,
      permissioned,
      equity,
      sharePrice,
    };
  } catch {
    return null;
  }
}

export async function fetchUserVaultPositions(
  walletPubkey: string,
  vaults: VaultInfo[]
): Promise<any[]> {
  const connection = new Connection(getRpcUrl(), { commitment: "confirmed" });
  const authority = new PublicKey(walletPubkey);
  const positions: any[] = [];

  const depositorPdas = vaults.slice(0, 50).map((vault) => {
    const vaultPk = new PublicKey(vault.address);
    const [depositorPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_depositor"),
        vaultPk.toBuffer(),
        authority.toBuffer(),
      ],
      VAULT_PROGRAM_ID
    );
    return { vault, depositorPda };
  });

  const BATCH = 10;
  for (let i = 0; i < depositorPdas.length; i += BATCH) {
    const batch = depositorPdas.slice(i, i + BATCH);
    const acctInfos = await connection.getMultipleAccountsInfo(
      batch.map(b => b.depositorPda)
    );
    for (let j = 0; j < batch.length; j++) {
      const acctInfo = acctInfos[j];
      if (!acctInfo || acctInfo.data.length < 100) continue;
      const { vault } = batch[j];
      try {
        const data = acctInfo.data;
        const sharesBig = readU128AsBigInt(data, 8 + 32 + 32);
        if (sharesBig <= 0n) continue;

        const SHARE_PRECISION = 1e6;
        const sharesRebase = vault.sharesBase > 0 ? 10 ** vault.sharesBase : 1;
        const myShares = Number(sharesBig) / (SHARE_PRECISION * sharesRebase);
        const myEquity = vault.totalShares > 0 ? (myShares / vault.totalShares) * vault.equity : 0;

        const decimals = vault.spotMarketIndex === 0 || vault.spotMarketIndex === 4 ? 6 : 9;
        const netDepositsOffset = 8 + 32 + 32 + 16 + 16;
        const netDep = bigToNum(readI64Safe(data, netDepositsOffset));
        const depositAmount = netDep / (10 ** decimals);
        const pnl = myEquity - depositAmount;

        positions.push({
          vault,
          myShares,
          myEquity,
          depositAmount,
          pnl,
          pnlPercent: depositAmount > 0 ? (pnl / depositAmount) * 100 : 0,
        });
      } catch {}
    }
  }

  return positions;
}
