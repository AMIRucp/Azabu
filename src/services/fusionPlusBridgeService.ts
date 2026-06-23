import {
  HashLock,
  NetworkEnum,
  PresetEnum,
  RelayerRequestEvm,
  SDK,
  SupportedChains,
  type OrderParams,
  type Quote,
  type QuoteParams,
  type SupportedChain,
} from "@1inch/cross-chain-sdk";
import { getAddress } from "ethers";
import { FUSION_PLUS_API } from "@/config/bridgeConfig";
import { isFusionPlusEvmChain } from "@/config/bridgeEvmChains";
import type { EvmCrossChainOrder } from "@1inch/cross-chain-sdk";
import { oneinchApiHttpStatus, parseOneinchApiError } from "@/lib/oneinchApiError";

const SOURCE = "azabu-bridge";

type QuoteCacheEntry = { quote: Quote; at: number };
type PreparedCacheEntry = {
  order: EvmCrossChainOrder;
  hash: string;
  quoteId: string;
  srcChainId: number;
  secretHashes: string[];
  at: number;
};

const QUOTE_TTL_MS = 10 * 60 * 1000;
const PREPARED_TTL_MS = 10 * 60 * 1000;

const g = globalThis as typeof globalThis & {
  _fusionPlusQuoteCache?: Map<string, QuoteCacheEntry>;
  _fusionPlusPreparedCache?: Map<string, PreparedCacheEntry>;
};

function quoteCache(): Map<string, QuoteCacheEntry> {
  if (!g._fusionPlusQuoteCache) g._fusionPlusQuoteCache = new Map();
  return g._fusionPlusQuoteCache;
}

function preparedCache(): Map<string, PreparedCacheEntry> {
  if (!g._fusionPlusPreparedCache) g._fusionPlusPreparedCache = new Map();
  return g._fusionPlusPreparedCache;
}

function getAuthKey(): string {
  const key = process.env.DEV_PORTAL_API_TOKEN?.trim() || process.env.ONEINCH_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing DEV_PORTAL_API_TOKEN or ONEINCH_API_KEY for Fusion+ bridge");
  }
  return key;
}

function getSdk(): SDK {
  return new SDK({
    url: FUSION_PLUS_API,
    authKey: getAuthKey(),
  });
}

function pruneMap<T extends { at: number }>(map: Map<string, T>, ttlMs: number, max = 80): void {
  const now = Date.now();
  for (const [k, v] of map) {
    if (now - v.at > ttlMs) map.delete(k);
  }
  if (map.size > max) {
    const sorted = [...map.entries()].sort((a, b) => a[1].at - b[1].at);
    for (let i = 0; i < sorted.length - max; i++) {
      map.delete(sorted[i][0]);
    }
  }
}

function normalizeEvmTokenAddress(address: string): string {
  try {
    return getAddress(address.trim());
  } catch {
    throw new Error("Invalid token address");
  }
}

function normalizeWalletAddress(address: string): string {
  try {
    return getAddress(address.trim());
  } catch {
    throw new Error("Invalid wallet address");
  }
}

function wrapFusionPlusCall<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch((error) => {
    const message = parseOneinchApiError(error);
    const err = new Error(message);
    (err as Error & { httpStatus?: number }).httpStatus = oneinchApiHttpStatus(error);
    throw err;
  });
}

function assertFusionPlusRoute(srcChainId: number, dstChainId: number): void {
  if (srcChainId === dstChainId) {
    throw new Error("Source and destination chains must be different");
  }
  if (!isFusionPlusEvmChain(srcChainId) || !isFusionPlusEvmChain(dstChainId)) {
    throw new Error("Unsupported chain for Fusion+ bridge");
  }
  if (srcChainId === NetworkEnum.SOLANA || dstChainId === NetworkEnum.SOLANA) {
    throw new Error("Solana routes are not supported in this UI");
  }
  if (!SupportedChains.includes(srcChainId as SupportedChain)) {
    throw new Error("Source chain is not supported by 1inch Fusion+");
  }
  if (!SupportedChains.includes(dstChainId as SupportedChain)) {
    throw new Error("Destination chain is not supported by 1inch Fusion+");
  }
}

export async function fusionPlusGetQuote(params: {
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
  preset?: PresetEnum;
}) {
  assertFusionPlusRoute(params.srcChainId, params.dstChainId);

  const sdk = getSdk();
  const quoteParams: QuoteParams = {
    srcChainId: params.srcChainId as QuoteParams["srcChainId"],
    dstChainId: params.dstChainId as QuoteParams["dstChainId"],
    srcTokenAddress: normalizeEvmTokenAddress(params.srcTokenAddress),
    dstTokenAddress: normalizeEvmTokenAddress(params.dstTokenAddress),
    amount: params.amount,
    walletAddress: normalizeWalletAddress(params.walletAddress),
    enableEstimate: true,
    source: SOURCE,
  };

  const quote = await wrapFusionPlusCall(() => sdk.getQuote(quoteParams));
  if (!quote.quoteId) {
    throw new Error("Quote missing quoteId — enableEstimate may have failed");
  }

  pruneMap(quoteCache(), QUOTE_TTL_MS);
  quoteCache().set(quote.quoteId, { quote, at: Date.now() });

  const presetKey = (params.preset || quote.recommendedPreset) as PresetEnum;
  const preset = quote.getPreset(presetKey);

  return {
    quoteId: quote.quoteId,
    srcChainId: quote.srcChainId,
    dstChainId: quote.dstChainId,
    srcTokenAmount: quote.srcTokenAmount.toString(),
    dstTokenAmount: quote.dstTokenAmount.toString(),
    /** Best estimate for selected speed (preset startAmount; aligns with dst when 1inch returns one estimate). */
    receiveAmount: preset.startAmount.toString(),
    minReceiveAmount: preset.auctionEndAmount.toString(),
    maxReceiveAmount: preset.auctionStartAmount.toString(),
    recommendedPreset: quote.recommendedPreset,
    preset: presetKey,
    secretsCount: preset.secretsCount,
    auctionDurationSec: Number(preset.auctionDuration),
    auctionStartAmount: preset.auctionStartAmount.toString(),
    auctionEndAmount: preset.auctionEndAmount.toString(),
    srcEscrowFactory: String(quote.srcEscrowFactory),
    allowMultipleFills: preset.allowMultipleFills,
  };
}

export function fusionPlusCreatePreparedOrder(params: {
  quoteId: string;
  walletAddress: string;
  preset: PresetEnum;
  hashLock: string;
  secretHashes: string[];
}) {
  const cached = quoteCache().get(params.quoteId);
  if (!cached || Date.now() - cached.at > QUOTE_TTL_MS) {
    throw new Error("Quote expired or not found. Request a new quote.");
  }

  const { quote } = cached;
  const preset = quote.getPreset(params.preset);
  if (params.secretHashes.length !== preset.secretsCount) {
    throw new Error(`Expected ${preset.secretsCount} secret hashes, got ${params.secretHashes.length}`);
  }

  const orderParams: OrderParams = {
    walletAddress: params.walletAddress,
    hashLock: HashLock.fromString(params.hashLock),
    secretHashes: params.secretHashes,
    preset: params.preset,
    source: SOURCE,
  };

  const sdk = getSdk();
  const prepared = sdk.createOrder(quote, orderParams);
  const order = prepared.order as EvmCrossChainOrder;
  const srcChainId = Number(quote.srcChainId);
  const typedData = order.getTypedData(quote.srcChainId);

  pruneMap(preparedCache(), PREPARED_TTL_MS);
  preparedCache().set(prepared.quoteId, {
    order,
    hash: prepared.hash,
    quoteId: prepared.quoteId,
    srcChainId,
    secretHashes: params.secretHashes,
    at: Date.now(),
  });

  return {
    quoteId: prepared.quoteId,
    orderHash: prepared.hash,
    typedData,
    srcChainId,
  };
}

export async function fusionPlusSubmitOrder(params: {
  quoteId: string;
  signature: string;
}) {
  const cached = preparedCache().get(params.quoteId);
  if (!cached || Date.now() - cached.at > PREPARED_TTL_MS) {
    throw new Error("Prepared order expired. Start the bridge flow again.");
  }

  const order = cached.order;
  const secretHashes = cached.secretHashes;

  if (!order.multipleFillsAllowed && secretHashes.length > 1) {
    throw new Error("Invalid secret hash count for single-fill order");
  }

  const orderStruct = order.build();
  const relayerRequest = new RelayerRequestEvm({
    srcChainId: cached.srcChainId,
    order: orderStruct,
    signature: params.signature,
    quoteId: cached.quoteId,
    extension: order.extension.encode(),
    secretHashes: secretHashes.length === 1 ? undefined : secretHashes,
  });

  const sdk = getSdk();
  await wrapFusionPlusCall(() => sdk.api.submitOrder(relayerRequest));

  preparedCache().delete(params.quoteId);
  quoteCache().delete(params.quoteId);

  return {
    orderHash: order.getOrderHash(cached.srcChainId),
    quoteId: cached.quoteId,
  };
}

export async function fusionPlusOrderStatus(orderHash: string) {
  const sdk = getSdk();
  return wrapFusionPlusCall(() => sdk.getOrderStatus(orderHash));
}

export async function fusionPlusReadySecrets(orderHash: string) {
  const sdk = getSdk();
  return wrapFusionPlusCall(() => sdk.getReadyToAcceptSecretFills(orderHash));
}

export async function fusionPlusSubmitSecret(orderHash: string, secret: string) {
  const sdk = getSdk();
  await wrapFusionPlusCall(() => sdk.submitSecret(orderHash, secret));
}
