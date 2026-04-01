import { type Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createCloseAccountInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token";
import type { IdlAccounts } from "@coral-xyz/anchor";
import type { Perpetuals } from "./jupiterPerpetualsIdl";
import type { CustodyAccount, Position, PoolData, OnChainPerpsResult } from "./types";
import {
  getPerpetualsProgram,
  JUPITER_PERPETUALS_PROGRAM_ID,
  JLP_POOL_ACCOUNT_PUBKEY,
  CUSTODY_PUBKEY,
  CUSTODY_DETAILS,
  MARKET_TO_CUSTODY,
  USDC_DECIMALS,
  USD_POWER,
} from "./constants";
import {
  generatePositionPda,
  generatePositionRequestPda,
  getPerpetualsPda,
} from "./pdaHelpers";
import { getConnection } from "../rpc";


export async function buildOpenPositionTx({
  market,
  side,
  collateralUsd,
  leverage,
  walletPubkey,
}: {
  market: string;
  side: "long" | "short";
  collateralUsd: number;
  leverage: number;
  walletPubkey: string;
}): Promise<OnChainPerpsResult> {
  const program = getPerpetualsProgram();
  const connection = getConnection();
  const marketKey = market.toUpperCase();
  const marketConfig = MARKET_TO_CUSTODY[marketKey];
  if (!marketConfig) throw new Error(`Unknown perps market: ${market}`);

  const owner = new PublicKey(walletPubkey);
  const custodyPubkey = new PublicKey(marketConfig.custody);
  const USDC_CUSTODY = new PublicKey(CUSTODY_PUBKEY.USDC);
  const collateralCustodyPubkey = side === "long" ? custodyPubkey : USDC_CUSTODY;

  const custodyDetails = CUSTODY_DETAILS[marketConfig.custody];
  if (!custodyDetails) throw new Error(`No custody details for market: ${market}`);

  const inputMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  const collateralTokenDelta = new BN(Math.floor(collateralUsd * Math.pow(10, USDC_DECIMALS)));
  const sizeUsdDelta = new BN(Math.floor(collateralUsd * leverage * Math.pow(10, USDC_DECIMALS)));

  const custodyAccount = await program.account.custody.fetch(custodyPubkey);
  const collateralCustodyAccount = await program.account.custody.fetch(collateralCustodyPubkey);

  const oraclePrice = (custodyAccount.oracle as any).price
    ? new BN((custodyAccount.oracle as any).price.toString())
    : null;
  let priceSlippage: BN;
  if (oraclePrice && !oraclePrice.isZero()) {
    if (side === "long") {
      priceSlippage = oraclePrice.mul(new BN(115)).div(new BN(100));
    } else {
      priceSlippage = oraclePrice.mul(new BN(85)).div(new BN(100));
    }
  } else {
    priceSlippage = new BN(Math.floor(100_000 * Math.pow(10, USDC_DECIMALS)));
  }

  const custody: CustodyAccount = { publicKey: custodyPubkey, account: custodyAccount };
  const collateralCustody: CustodyAccount = { publicKey: collateralCustodyPubkey, account: collateralCustodyAccount };

  const { position: positionPubkey } = generatePositionPda({
    custody: custodyPubkey,
    collateralCustody: collateralCustodyPubkey,
    walletAddress: owner,
    side,
  });

  const { positionRequest, counter } = generatePositionRequestPda({
    positionPubkey,
    requestChange: "increase",
  });

  const positionRequestAta = getAssociatedTokenAddressSync(
    inputMint,
    positionRequest,
    true,
  );

  const fundingAccount = getAssociatedTokenAddressSync(inputMint, owner);

  const preInstructions: TransactionInstruction[] = [];
  const postInstructions: TransactionInstruction[] = [];

  const sideEnum = side === "long" ? { long: {} } : { short: {} };

  console.log(`[Perps] === BUILD OPEN POSITION TX ===`);
  console.log(`[Perps] market=${marketKey} side=${side} collateralUsd=${collateralUsd} leverage=${leverage}`);
  console.log(`[Perps] owner=${owner.toString()}`);
  console.log(`[Perps] custody=${custodyPubkey.toString()}`);
  console.log(`[Perps] collateralCustody=${collateralCustodyPubkey.toString()}`);
  console.log(`[Perps] inputMint=${inputMint.toString()}`);
  console.log(`[Perps] position=${positionPubkey.toString()}`);
  console.log(`[Perps] positionRequest=${positionRequest.toString()}`);
  console.log(`[Perps] positionRequestAta=${positionRequestAta.toString()}`);
  console.log(`[Perps] fundingAccount=${fundingAccount.toString()}`);
  console.log(`[Perps] perpetuals=${getPerpetualsPda().toString()}`);
  console.log(`[Perps] pool=${JLP_POOL_ACCOUNT_PUBKEY.toString()}`);
  console.log(`[Perps] oraclePrice=${oraclePrice?.toString() || 'null'}`);
  console.log(`[Perps] sizeUsdDelta=${sizeUsdDelta.toString()}`);
  console.log(`[Perps] collateralTokenDelta=${collateralTokenDelta.toString()}`);
  console.log(`[Perps] priceSlippage=${priceSlippage.toString()}`);
  console.log(`[Perps] jupiterMinimumOut=0 (BN)`);
  console.log(`[Perps] counter=${counter.toString()}`);
  console.log(`[Perps] sideEnum=${JSON.stringify(sideEnum)}`);

  const increaseIx = await program.methods
    .createIncreasePositionMarketRequest({
      counter,
      collateralTokenDelta: collateralTokenDelta,
      jupiterMinimumOut: new BN(0),
      priceSlippage,
      side: sideEnum as any,
      sizeUsdDelta,
    })
    .accounts({
      custody: custody.publicKey,
      collateralCustody: collateralCustody.publicKey,
      fundingAccount,
      inputMint,
      owner,
      perpetuals: getPerpetualsPda(),
      pool: JLP_POOL_ACCOUNT_PUBKEY,
      position: positionPubkey,
      positionRequest,
      positionRequestAta,
      referral: null,
    })
    .instruction();

  console.log(`[Perps] increaseIx programId=${increaseIx.programId.toString()}`);
  console.log(`[Perps] increaseIx keys count=${increaseIx.keys.length}`);
  increaseIx.keys.forEach((k, i) => {
    console.log(`[Perps]   key[${i}]: ${k.pubkey.toString()} isSigner=${k.isSigner} isWritable=${k.isWritable}`);
  });
  console.log(`[Perps] increaseIx data (hex, first 32 bytes)=${Buffer.from(increaseIx.data).toString('hex').slice(0, 64)}`);

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
    ...preInstructions,
    increaseIx,
    ...postInstructions,
  ];

  const simulateTx = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: PublicKey.default,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message([]),
  );

  let computeUnits = 1_400_000;
  try {
    const simulation = await connection.simulateTransaction(simulateTx, {
      replaceRecentBlockhash: true,
      sigVerify: false,
    });
    if (simulation.value.logs) {
      console.log(`[Perps] Simulation logs:`);
      simulation.value.logs.forEach((log: string) => console.log(`[Perps]   ${log}`));
    }
    if (simulation.value.err) {
      console.warn(`[Perps] Simulation error:`, JSON.stringify(simulation.value.err));
    }
    if (simulation.value.unitsConsumed) {
      computeUnits = Math.ceil(simulation.value.unitsConsumed * 1.2);
    }
  } catch (simErr: any) {
    console.warn(`[Perps] Simulation failed, using default CU:`, simErr.message);
  }

  instructions.unshift(
    ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const txMessage = new TransactionMessage({
    payerKey: owner,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(txMessage);
  const serialized = Buffer.from(tx.serialize()).toString("base64");

  return { transaction: serialized, method: "onchain" };
}

export async function buildClosePositionTx({
  positionAddress,
  market,
  side,
  walletPubkey,
  closePercent = 100,
}: {
  positionAddress: string;
  market: string;
  side: string;
  walletPubkey: string;
  closePercent?: number;
}): Promise<OnChainPerpsResult> {
  const program = getPerpetualsProgram();
  const connection = getConnection();

  const positionPubkey = new PublicKey(positionAddress);
  const position = await program.account.position.fetch(positionPubkey);

  const desiredMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  const isSOL = desiredMint.equals(NATIVE_MINT);

  const { positionRequest, counter } = generatePositionRequestPda({
    positionPubkey,
    requestChange: "decrease",
  });

  const preInstructions: TransactionInstruction[] = [];
  const postInstructions: TransactionInstruction[] = [];

  const receivingAccount = getAssociatedTokenAddressSync(
    desiredMint,
    position.owner,
    true,
  );

  if (isSOL) {
    postInstructions.push(
      createCloseAccountInstruction(receivingAccount, position.owner, position.owner),
    );
  }

  const entirePosition = closePercent >= 100;
  let sizeUsdDelta = new BN(0);
  let collateralUsdDelta = new BN(0);

  if (!entirePosition) {
    const fraction = closePercent / 100;
    sizeUsdDelta = new BN(
      position.sizeUsd.muln(Math.floor(fraction * 10000)).divn(10000).toString(),
    );
  }

  const custodyAccount = await program.account.custody.fetch(position.custody);
  const closeSideStr = (position.side as any)?.long ? "long" : "short";
  const closeOraclePrice = (custodyAccount.oracle as any).price
    ? new BN((custodyAccount.oracle as any).price.toString())
    : null;
  let closePriceSlippage: BN;
  if (closeOraclePrice && !closeOraclePrice.isZero()) {
    if (closeSideStr === "long") {
      closePriceSlippage = closeOraclePrice.mul(new BN(85)).div(new BN(100));
    } else {
      closePriceSlippage = closeOraclePrice.mul(new BN(115)).div(new BN(100));
    }
  } else {
    closePriceSlippage = closeSideStr === "long" ? new BN(0) : new BN(Math.floor(1_000_000 * Math.pow(10, USDC_DECIMALS)));
  }

  const decreaseIx = await program.methods
    .createDecreasePositionMarketRequest({
      collateralUsdDelta,
      sizeUsdDelta,
      priceSlippage: closePriceSlippage,
      jupiterMinimumOut: new BN(0),
      counter,
      entirePosition,
    })
    .accounts({
      owner: position.owner,
      receivingAccount,
      perpetuals: getPerpetualsPda(),
      pool: JLP_POOL_ACCOUNT_PUBKEY,
      position: positionPubkey,
      positionRequest,
      positionRequestAta: getAssociatedTokenAddressSync(
        desiredMint,
        positionRequest,
        true,
      ),
      custody: position.custody,
      collateralCustody: position.collateralCustody,
      desiredMint,
      referral: null,
    })
    .instruction();

  const instructions: TransactionInstruction[] = [
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
    ...preInstructions,
    decreaseIx,
    ...postInstructions,
  ];

  const simulateTx = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: PublicKey.default,
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message([]),
  );

  let computeUnits = 1_400_000;
  try {
    const simulation = await connection.simulateTransaction(simulateTx, {
      replaceRecentBlockhash: true,
      sigVerify: false,
    });
    if (simulation.value.err) {
      console.warn(`[Perps] Close simulation warning:`, JSON.stringify(simulation.value.err));
    }
    if (simulation.value.unitsConsumed) {
      computeUnits = Math.ceil(simulation.value.unitsConsumed * 1.2);
    }
  } catch (simErr: any) {
    console.warn(`[Perps] Close simulation failed, using default CU:`, simErr.message);
  }

  instructions.unshift(
    ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const txMessage = new TransactionMessage({
    payerKey: position.owner,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(txMessage);
  const serialized = Buffer.from(tx.serialize()).toString("base64");

  return { transaction: serialized, method: "onchain" };
}

export async function fetchPositionsOnChain(walletAddress: string): Promise<{
  address: string;
  market: string;
  side: string;
  sizeUsd: number;
  collateralUsd: number;
  entryPrice: number;
  markPrice: number;
  pnlUsd: number;
  pnlPct: number;
  liquidationPrice: number;
  leverage: number;
}[]> {
  const program = getPerpetualsProgram();

  const gpaResult = await getConnection().getProgramAccounts(
    JUPITER_PERPETUALS_PROGRAM_ID,
    {
      commitment: "confirmed",
      filters: [
        {
          memcmp: {
            bytes: new PublicKey(walletAddress).toBase58(),
            offset: 8,
          },
        },
        {
          memcmp: program.coder.accounts.memcmp("position"),
        },
      ],
    },
  );

  const positions = gpaResult.map((item) => ({
    publicKey: item.pubkey,
    account: program.coder.accounts.decode(
      "position",
      item.account.data,
    ) as IdlAccounts<Perpetuals>["position"],
  }));

  const openPositions = positions.filter((p) => p.account.sizeUsd.gtn(0));

  return openPositions.map((p) => {
    const custodyStr = p.account.custody.toString();
    const custodyDetails = CUSTODY_DETAILS[custodyStr];
    const marketName = custodyDetails?.name || "UNKNOWN";

    const acct = p.account as any;
    const sizeUsd = acct.sizeUsd?.toNumber?.() / 1_000_000 || 0;
    const collateralUsd = acct.collateralUsd?.toNumber?.() / 1_000_000 || 0;
    const entryPrice = acct.entryPrice?.toNumber?.() / 1_000_000 || 0;
    const leverage = collateralUsd > 0 ? sizeUsd / collateralUsd : 1;

    const sideStr = acct.side && acct.side.long ? "long" : "short";

    return {
      address: p.publicKey.toString(),
      market: marketName,
      side: sideStr,
      sizeUsd,
      collateralUsd,
      entryPrice,
      markPrice: 0,
      pnlUsd: acct.unrealizedPnlUsd ? acct.unrealizedPnlUsd.toNumber() / 1_000_000 : 0,
      pnlPct: 0,
      liquidationPrice: acct.liquidationPrice ? acct.liquidationPrice.toNumber() / 1_000_000 : 0,
      leverage: Math.round(leverage * 10) / 10,
    };
  });
}

export async function fetchPoolData(): Promise<PoolData> {
  const program = getPerpetualsProgram();
  const pool = await program.account.pool.fetch(JLP_POOL_ACCOUNT_PUBKEY);

  return {
    name: pool.name || "JLP Pool",
    custodies: pool.custodies.map((c: PublicKey) => c.toString()),
    aumUsd: pool.aumUsd ? pool.aumUsd.toNumber() / 1_000_000 : 0,
    totalVolume: 0,
  };
}

export async function fetchCustodyData(market: string) {
  const program = getPerpetualsProgram();
  const marketConfig = MARKET_TO_CUSTODY[market.toUpperCase()];
  if (!marketConfig) throw new Error(`Unknown market: ${market}`);

  const custodyData = await program.account.custody.fetch(
    new PublicKey(marketConfig.custody),
  );

  return custodyData;
}

export async function getJlpSwapQuote(inputMint: string, amountLamports: number): Promise<{
  outputAmount: string;
  priceImpactPct: string;
  routePlan: any[];
}> {
  const axios = (await import("axios")).default;
  const JLP_MINT = "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4";
  const jupHeaders: Record<string, string> = {};
  if (process.env.JUPITER_API_KEY) jupHeaders["x-api-key"] = process.env.JUPITER_API_KEY;

  const res = await axios.get("https://api.jup.ag/swap/v1/quote", {
    params: {
      inputMint,
      outputMint: JLP_MINT,
      amount: amountLamports,
      slippageBps: 100,
    },
    headers: jupHeaders,
    timeout: 10000,
  });

  return {
    outputAmount: res.data.outAmount,
    priceImpactPct: res.data.priceImpactPct,
    routePlan: res.data.routePlan || [],
  };
}

export async function buildSwapToJlpTx({
  inputMint,
  amountLamports,
  walletPubkey,
}: {
  inputMint: string;
  amountLamports: number;
  walletPubkey: string;
}): Promise<{ transaction: string }> {
  const axios = (await import("axios")).default;
  const JLP_MINT = "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4";
  const jupHeaders: Record<string, string> = {};
  if (process.env.JUPITER_API_KEY) jupHeaders["x-api-key"] = process.env.JUPITER_API_KEY;

  const quoteRes = await axios.get("https://api.jup.ag/swap/v1/quote", {
    params: {
      inputMint,
      outputMint: JLP_MINT,
      amount: amountLamports,
      slippageBps: 100,
    },
    headers: jupHeaders,
    timeout: 10000,
  });

  const swapRes = await axios.post("https://api.jup.ag/swap/v1/swap", {
    quoteResponse: quoteRes.data,
    userPublicKey: walletPubkey,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: "auto",
  }, { headers: { ...jupHeaders, "Content-Type": "application/json" }, timeout: 15000 });

  return { transaction: swapRes.data.swapTransaction };
}
