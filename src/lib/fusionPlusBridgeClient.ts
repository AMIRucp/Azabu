import { ethers, formatUnits } from "ethers";
import { ERC20_APPROVE_ABI, FUSION_PLUS_LOP_ROUTER } from "@/config/bridgeConfig";
import {
  buildBridgeHashLock,
  buildBridgeSecretHashes,
  generateBridgeSecrets,
} from "@/lib/crossChainBridgeSecrets";
import type { FusionPreset } from "@/components/swap/swapConstants";

const NATIVE_EVM = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export type FusionPlusBridgeQuote = {
  quoteId: string;
  srcChainId: number;
  dstChainId: number;
  secretsCount: number;
  srcEscrowFactory: string;
  receiveAmount: string;
  minReceiveAmount?: string;
  maxReceiveAmount?: string;
  auctionDurationSec?: number;
  preset: string;
};

function toAtomicUnits(amount: string, decimals: number): string {
  const [whole = "0", frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return (whole + paddedFrac).replace(/^0+/, "") || "0";
}

export function formatBridgeReceiveAmount(raw: string, decimals: number): string {
  return parseFloat(formatUnits(raw, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

export async function fetchFusionPlusQuote(params: {
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
  preset: FusionPreset;
}): Promise<FusionPlusBridgeQuote> {
  const res = await fetch("/api/bridge/fusion-plus/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Quote failed");
  }
  return data as FusionPlusBridgeQuote;
}

export async function executeFusionPlusBridge(params: {
  quote: FusionPlusBridgeQuote;
  fromAmount: string;
  srcTokenAddress: string;
  srcTokenDecimals: number;
  dstTokenAddress: string;
  walletAddress: string;
  preset: FusionPreset;
  signer: ethers.JsonRpcSigner;
  onProgress: (message: string) => void;
}): Promise<string> {
  const {
    quote,
    fromAmount,
    srcTokenAddress,
    srcTokenDecimals,
    dstTokenAddress,
    walletAddress,
    preset,
    signer,
    onProgress,
  } = params;

  const secrets = generateBridgeSecrets(quote.secretsCount);
  const secretHashes = buildBridgeSecretHashes(secrets);
  const hashLock = buildBridgeHashLock(secrets);
  const atomic = toAtomicUnits(fromAmount, srcTokenDecimals);
  const isNative = srcTokenAddress.toLowerCase() === NATIVE_EVM.toLowerCase();

  onProgress("Updating quote…");
  const freshQuote = await fetchFusionPlusQuote({
    srcChainId: quote.srcChainId,
    dstChainId: quote.dstChainId,
    srcTokenAddress,
    dstTokenAddress,
    amount: atomic,
    walletAddress,
    preset: quotePreset(quote, preset),
  });

  if (!isNative) {
    onProgress("Checking token approval…");
    const token = new ethers.Contract(srcTokenAddress, ERC20_APPROVE_ABI, signer);
    const allowance = await token.allowance(walletAddress, FUSION_PLUS_LOP_ROUTER);
    if (BigInt(allowance.toString()) < BigInt(atomic)) {
      onProgress("Confirm approval in wallet…");
      const tx = await token.approve(FUSION_PLUS_LOP_ROUTER, ethers.MaxUint256);
      await tx.wait();
    }
  }

  onProgress("Preparing your bridge…");
  const prepRes = await fetch("/api/bridge/fusion-plus/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteId: freshQuote.quoteId,
      walletAddress,
      preset: freshQuote.preset || preset,
      hashLock,
      secretHashes,
    }),
  });
  const prep = await prepRes.json();
  if (!prepRes.ok || !prep.success) throw new Error(prep.error || "Create order failed");

  onProgress("Confirm in your wallet…");
  const { domain, types, message } = prep.typedData;
  const { EIP712Domain: _d, ...signingTypes } = types;
  const signature = await signer.signTypedData(domain, signingTypes, message);

  onProgress("Sending bridge…");
  const subRes = await fetch("/api/bridge/fusion-plus/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quoteId: prep.quoteId, signature }),
  });
  const sub = await subRes.json();
  if (!subRes.ok || !sub.success) throw new Error(sub.error || "Submit failed");

  const hash = sub.orderHash as string;
  onProgress("Completing transfer…");

  let done = false;
  for (let i = 0; i < 180 && !done; i++) {
    await new Promise((r) => setTimeout(r, i < 10 ? 1000 : 2000));

    const readyRes = await fetch(
      `/api/bridge/fusion-plus/ready-secrets?orderHash=${encodeURIComponent(hash)}`,
    );
    const ready = await readyRes.json();
    if (ready.success && Array.isArray(ready.fills)) {
      for (const fill of ready.fills as { idx: number }[]) {
        const secret = secrets[fill.idx];
        if (!secret) continue;
        await fetch("/api/bridge/fusion-plus/submit-secret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderHash: hash, secret }),
        });
      }
    }

    const stRes = await fetch(
      `/api/bridge/fusion-plus/order-status?orderHash=${encodeURIComponent(hash)}`,
    );
    const st = await stRes.json();
    if (st.success && st.isTerminal) {
      if (!st.isCompleted && !st.isRefunded) {
        throw new Error(st.isExpired ? "Bridge order expired" : "Bridge order failed");
      }
      done = true;
    }
  }

  if (!done) throw new Error("Bridge is taking longer than expected.");
  return hash;
}

function quotePreset(quote: FusionPlusBridgeQuote, preset: FusionPreset): FusionPreset {
  const p = quote.preset;
  if (p === "fast" || p === "medium" || p === "slow") return p;
  return preset;
}
