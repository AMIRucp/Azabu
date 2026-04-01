import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import BN from 'bn.js';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

function getConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed');
}

const LENDABLE_ASSETS: Record<string, { mint: string; decimals: number; symbol: string }> = {
  'USDC': { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, symbol: 'USDC' },
  'SOL': { mint: 'So11111111111111111111111111111111111111112', decimals: 9, symbol: 'SOL' },
  'USDT': { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, symbol: 'USDT' },
  'EURC': { mint: 'HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzKKUCVpFHGnPSu', decimals: 6, symbol: 'EURC' },
  'USDG': { mint: 'USDGavPRGGaGpe27pyDBx4JCZRveFZoEboEAaCPwYXh', decimals: 6, symbol: 'USDG' },
  'USDS': { mint: 'USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA', decimals: 6, symbol: 'USDS' },
  'JupSOL': { mint: 'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjdb9J', decimals: 9, symbol: 'JupSOL' },
  'JitoSOL': { mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', decimals: 9, symbol: 'JitoSOL' },
  'JLP': { mint: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4', decimals: 6, symbol: 'JLP' },
  'cbBTC': { mint: 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij', decimals: 8, symbol: 'cbBTC' },
  'JUP': { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, symbol: 'JUP' },
};

export async function buildDepositTransaction(params: {
  asset: string;
  amount: number;
  signerPubkey: string;
}): Promise<{ transaction: string; asset: string; amount: number; decimals: number }> {
  const assetInfo = LENDABLE_ASSETS[params.asset.toUpperCase()];
  if (!assetInfo) {
    throw new Error(`Asset ${params.asset} is not supported for lending. Supported: ${Object.keys(LENDABLE_ASSETS).join(', ')}`);
  }

  const connection = getConnection();
  const signer = new PublicKey(params.signerPubkey);
  const assetMint = new PublicKey(assetInfo.mint);
  const rawAmount = new BN(Math.floor(params.amount * 10 ** assetInfo.decimals));

  const { getDepositIxs } = await import('@jup-ag/lend/earn');
  const { ixs } = await getDepositIxs({
    amount: rawAmount,
    asset: assetMint,
    signer,
    connection,
  });

  const latestBlockhash = await connection.getLatestBlockhash('confirmed');
  const messageV0 = new TransactionMessage({
    payerKey: signer,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  const serialized = Buffer.from(tx.serialize()).toString('base64');

  return {
    transaction: serialized,
    asset: assetInfo.symbol,
    amount: params.amount,
    decimals: assetInfo.decimals,
  };
}

export async function buildWithdrawTransaction(params: {
  asset: string;
  amount: number;
  signerPubkey: string;
}): Promise<{ transaction: string; asset: string; amount: number; decimals: number }> {
  const assetInfo = LENDABLE_ASSETS[params.asset.toUpperCase()];
  if (!assetInfo) {
    throw new Error(`Asset ${params.asset} is not supported. Supported: ${Object.keys(LENDABLE_ASSETS).join(', ')}`);
  }

  const connection = getConnection();
  const signer = new PublicKey(params.signerPubkey);
  const assetMint = new PublicKey(assetInfo.mint);
  const rawAmount = new BN(Math.floor(params.amount * 10 ** assetInfo.decimals));

  const { getWithdrawIxs } = await import('@jup-ag/lend/earn');
  const { ixs } = await getWithdrawIxs({
    amount: rawAmount,
    asset: assetMint,
    signer,
    connection,
  });

  const latestBlockhash = await connection.getLatestBlockhash('confirmed');
  const messageV0 = new TransactionMessage({
    payerKey: signer,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  const serialized = Buffer.from(tx.serialize()).toString('base64');

  return {
    transaction: serialized,
    asset: assetInfo.symbol,
    amount: params.amount,
    decimals: assetInfo.decimals,
  };
}

export interface EarnRate {
  asset: string;
  symbol: string;
  name?: string;
  apy: number;
  price?: number;
  totalSupply?: number;
  totalSupplyRaw?: number;
  availableLiquidity?: number;
  utilization?: number;
  logoUrl?: string;
}

let earnRatesCache: { data: EarnRate[]; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function getEarnRates(): Promise<EarnRate[]> {
  if (earnRatesCache && Date.now() - earnRatesCache.ts < CACHE_TTL) {
    return earnRatesCache.data;
  }

  try {
    const apiKey = process.env.JUPITER_API_KEY;
    const res = await fetch('https://api.jup.ag/lend/v1/earn/tokens', {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const raw = await res.json();
      const tokens = Array.isArray(raw) ? raw : raw?.tokens || raw?.data || [];
      if (tokens.length > 0) {
        const rates: EarnRate[] = tokens.map((t: any) => {
          const assetInfo = t.asset || {};
          const totalRateBps = t.totalRate ?? t.supplyRate ?? 0;
          const decimals = assetInfo.decimals ?? t.decimals ?? 6;
          const totalAssetsRaw = Number(t.totalAssets || 0);
          const totalAssetsUi = totalAssetsRaw / (10 ** decimals);
          const price = parseFloat(assetInfo.price || '0');
          const liqData = t.liquiditySupplyData || {};
          const withdrawableRaw = Number(liqData.withdrawable || 0);
          const withdrawableUi = withdrawableRaw / (10 ** decimals);

          return {
            asset: assetInfo.address || t.assetAddress || '',
            symbol: assetInfo.uiSymbol || assetInfo.symbol || t.symbol || 'Unknown',
            name: (assetInfo.name === 'Wrapped SOL' ? 'Solana' : assetInfo.name) || t.name || undefined,
            apy: totalRateBps / 100,
            price: price > 0 ? price : undefined,
            totalSupply: price > 0 ? totalAssetsUi * price : totalAssetsUi,
            totalSupplyRaw: totalAssetsUi,
            availableLiquidity: price > 0 ? withdrawableUi * price : withdrawableUi,
            logoUrl: assetInfo.logoUrl || undefined,
          };
        }).sort((a: EarnRate, b: EarnRate) => b.apy - a.apy);

        earnRatesCache = { data: rates, ts: Date.now() };
        return rates;
      }
    }
  } catch (err: any) {
    console.error('REST earn/tokens failed:', err.message);
  }

  return [];
}

export function getLendableAssets(): string[] {
  return Object.keys(LENDABLE_ASSETS);
}

export async function buildBorrowTransaction(params: {
  vaultId: number;
  collateralAmount: number;
  borrowAmount: number;
  collateralAsset: string;
  borrowAsset: string;
  signerPubkey: string;
}): Promise<{ transaction: string; collateralAsset: string; borrowAsset: string; collateralAmount: number; borrowAmount: number }> {
  const connection = getConnection();
  const signer = new PublicKey(params.signerPubkey);

  const colInfo = LENDABLE_ASSETS[params.collateralAsset.toUpperCase()];
  const debtInfo = LENDABLE_ASSETS[params.borrowAsset.toUpperCase()];
  if (!colInfo || !debtInfo) {
    throw new Error('Unsupported collateral or borrow asset');
  }

  const colAmount = new BN(Math.floor(params.collateralAmount * 10 ** colInfo.decimals));
  const debtAmount = new BN(Math.floor(params.borrowAmount * 10 ** debtInfo.decimals));

  const { getOperateIx } = await import('@jup-ag/lend/borrow');
  const { ixs, addressLookupTableAccounts } = await getOperateIx({
    vaultId: params.vaultId,
    positionId: 0,
    colAmount,
    debtAmount,
    signer,
    connection,
  });

  const latestBlockhash = await connection.getLatestBlockhash('confirmed');
  const messageV0 = new TransactionMessage({
    payerKey: signer,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: ixs,
  }).compileToV0Message(addressLookupTableAccounts || []);

  const tx = new VersionedTransaction(messageV0);
  const serialized = Buffer.from(tx.serialize()).toString('base64');

  return {
    transaction: serialized,
    collateralAsset: colInfo.symbol,
    borrowAsset: debtInfo.symbol,
    collateralAmount: params.collateralAmount,
    borrowAmount: params.borrowAmount,
  };
}
