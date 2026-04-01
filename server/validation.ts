import { z } from "zod";

const solanaAddress = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address");
const evmAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address");
const walletAddress = z.string().refine(
  (val) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val) || /^0x[a-fA-F0-9]{40}$/.test(val),
  "Invalid wallet address"
);

export const asterOpenPositionSchema = z.object({
  userId: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
  leverage: z.number().int().min(1).max(300).default(1),
  orderType: z.enum(["MARKET", "LIMIT"]).default("MARKET"),
  price: z.number().positive().optional(),
  hidden: z.boolean().default(false),
});

export const asterClosePositionSchema = z.object({
  userId: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
});

export const asterTpSlSchema = z.object({
  userId: z.string().min(1).max(100),
  symbol: z.string().min(1).max(20),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
  takeProfitPrice: z.number().positive().optional(),
  stopLossPrice: z.number().positive().optional(),
});

export const driftPerpOrderSchema = z.object({
  userPublicKey: solanaAddress,
  marketSymbol: z.string().min(1).max(20),
  direction: z.enum(["long", "short"]),
  usdcSize: z.number().positive().optional(),
  leverage: z.number().min(1).max(300).default(1),
  orderType: z.enum(["market", "limit"]).default("market"),
  limitPrice: z.number().positive().nullable().default(null),
  reduceOnly: z.boolean().default(false),
  baseAmount: z.number().positive().nullable().default(null),
});

export const sendSchema = z.object({
  senderPublicKey: solanaAddress,
  recipientAddress: solanaAddress,
  tokenMint: solanaAddress,
  amount: z.number().positive(),
  decimals: z.number().int().min(0).max(18),
});

export const swapExecuteSchema = z.object({
  signedTransaction: z.string().min(1).max(100000),
  requestId: z.string().max(200).optional(),
});

export const swapBuildSchema = z.object({
  quoteResponse: z.record(z.unknown()).optional(),
  userPublicKey: z.string().min(1).max(50).optional(),
}).passthrough();

export const gmxPostSchema = z.object({
  action: z.enum(["long", "short"]),
  symbol: z.string().min(1).max(20),
  amount: z.union([z.string(), z.number()]).transform(v => String(v)),
  leverage: z.number().min(1).max(100).optional(),
  ethAddress: evmAddress,
});

export const dflowOrderSchema = z.object({
  inputMint: solanaAddress,
  outputMint: solanaAddress,
  amount: z.union([z.string(), z.number()]).transform(v => String(v)),
  userPublicKey: solanaAddress,
});

export const asterConnectSchema = z.object({
  userId: z.string().min(1).max(100),
  apiKey: z.string().min(1).max(200),
  apiSecret: z.string().min(1).max(200),
});

export const submitTransactionSchema = z.object({
  signedTransaction: z.string().min(1).max(100000),
});

export const tradeRecordSchema = z.object({
  wallet: walletAddress,
  protocol: z.string().min(1).max(20),
  chain: z.string().min(1).max(20),
  market: z.string().min(1).max(30),
  side: z.enum(["long", "short"]),
  sizeUsd: z.string(),
  entryPrice: z.string().nullable().optional(),
  leverage: z.number().int().nullable().optional(),
  txSignature: z.string().max(200).optional(),
});

export const profileSchema = z.object({
  username: z.string().min(1).max(30),
  avatarId: z.string().min(1).max(50),
  walletAddress: walletAddress.optional(),
});

export const balancesQuerySchema = z.object({
  solana: solanaAddress.optional(),
  evm: evmAddress.optional(),
}).refine(data => data.solana || data.evm, "Provide solana and/or evm address");

export const portfolioQuerySchema = z.object({
  wallet: solanaAddress.optional(),
  ethAddress: evmAddress.optional(),
});

export const lendActionSchema = z.object({
  asset: z.string().min(1).max(50),
  amount: z.union([z.string(), z.number()]).transform(v => String(v)),
  signer: solanaAddress.optional(),
  owner: solanaAddress.optional(),
  token: z.string().min(1).max(50).optional(),
}).refine(data => data.signer || data.owner, "signer or owner required");

export const bridgeQuoteSchema = z.object({
  srcChainId: z.number().int().positive(),
  dstChainId: z.number().int().positive(),
  srcChainTokenIn: z.string().min(1),
  dstChainTokenOut: z.string().min(1),
  srcChainTokenInAmount: z.string().min(1),
  walletAddress: walletAddress.optional(),
});

export const jupiterPredictionOrderSchema = z.object({
  ownerPubkey: solanaAddress,
  marketId: z.string().min(1).max(100),
  isBuy: z.boolean(),
  isYes: z.boolean(),
  depositAmount: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
  contracts: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
  positionPubkey: z.string().min(1).max(100).optional(),
  depositMint: solanaAddress.optional(),
}).refine(
  data => !data.isBuy || data.depositAmount,
  "depositAmount required for buys"
).refine(
  data => data.isBuy || (data.contracts && data.positionPubkey),
  "contracts and positionPubkey required for sells"
);

export { solanaAddress, evmAddress, walletAddress };
