"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ethers, formatUnits } from "ethers";
import { ArrowDownUp, ChevronDown, Settings2 } from "lucide-react";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import {
  BRIDGE_EVM_CHAINS,
  NATIVE_EVM,
  type BridgeEvmChain,
  type BridgeToken,
} from "@/config/bridgeEvmChains";
import { ERC20_APPROVE_ABI, FUSION_PLUS_LOP_ROUTER } from "@/config/bridgeConfig";
import { fetchBridgeTokensForChain } from "@/lib/fetchBridgeTokens";
import {
  buildBridgeHashLock,
  buildBridgeSecretHashes,
  generateBridgeSecrets,
} from "@/lib/crossChainBridgeSecrets";
import { BridgePanel } from "./BridgePanel";
import TokenSelectorModal, { type TokenOption } from "./TokenSelectorModal";
import { SuccessView } from "./SwapShared";
import {
  CARD,
  BORDER,
  LABEL,
  BRIGHT,
  ORANGE,
  MONO,
  CARD_SHADOW,
  FUSION_PRESET_OPTIONS,
  FUSION_PRESET_DURATION_SEC,
  type FusionPreset,
} from "./swapConstants";
import { toUserFacingError } from "@/lib/userFacingErrors";

function toAtomic(amount: string, decimals: number): string {
  const cleaned = amount.replace(/,/g, "").trim();
  if (!cleaned || cleaned === ".") return "0";
  const [whole = "0", frac = ""] = cleaned.split(".");
  const padded = frac.padEnd(decimals, "0").slice(0, decimals);
  return (whole + padded).replace(/^0+/, "") || "0";
}

function pickTokenForChain(chain: BridgeEvmChain, prev: BridgeToken): BridgeToken {
  return (
    chain.fallbackTokens.find((t) => t.symbol === prev.symbol) ?? chain.fallbackTokens[0]
  );
}

function formatBridgeDuration(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  return `~${min} min`;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function bridgeButtonLabel(stage: Stage, chainLabel: string): string {
  switch (stage) {
    case "switching":
      return `Switch to ${chainLabel}`;
    case "approving":
      return "Approve in wallet";
    case "signing":
      return "Confirm in wallet";
    case "submitting":
      return "Sending bridge";
    case "revealing":
      return "Bridging";
    default:
      return "Processing…";
  }
}

function bridgeStatusDetail(stage: Stage, chainLabel: string, detail?: string): string {
  const safe =
    detail && !/fusion|1inch|submit|order|secret|relayer|escrow/i.test(detail) ? detail : undefined;
  switch (stage) {
    case "switching":
      return `Switch to ${chainLabel} in your wallet`;
    case "approving":
      return safe || "Approve the token in your wallet";
    case "signing":
      return safe || "Confirm in your wallet";
    case "submitting":
      return "Sending your bridge";
    case "revealing":
      return "Transferring to the destination chain";
    default:
      return safe || "Please wait…";
  }
}

function formatReceiveAmount(raw: string, decimals: number): string {
  return parseFloat(formatUnits(raw, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

type BridgeQuote = {
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

type Stage =
  | "idle"
  | "quoting"
  | "switching"
  | "approving"
  | "signing"
  | "submitting"
  | "revealing"
  | "done"
  | "error";

export function EvmBridgeContent({ onComplete }: { onComplete?: () => void }) {
  const { evmAddress, isEvmConnected, evmChainId, connectEvm, switchToChainById, getEvmSigner } =
    useEvmWallet();

  const [srcChain, setSrcChain] = useState<BridgeEvmChain>(BRIDGE_EVM_CHAINS[0]);
  const [dstChain, setDstChain] = useState<BridgeEvmChain>(
    BRIDGE_EVM_CHAINS.find((c) => c.key === "arbitrum") ?? BRIDGE_EVM_CHAINS[1],
  );
  const [srcTokens, setSrcTokens] = useState<BridgeToken[]>(srcChain.fallbackTokens);
  const [dstTokens, setDstTokens] = useState<BridgeToken[]>(dstChain.fallbackTokens);
  const [srcToken, setSrcToken] = useState<BridgeToken>(srcChain.fallbackTokens[0]);
  const [dstToken, setDstToken] = useState<BridgeToken>(
    (BRIDGE_EVM_CHAINS.find((c) => c.key === "arbitrum") ?? dstChain).fallbackTokens[0],
  );
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [preset, setPreset] = useState<FusionPreset>("fast");
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selector, setSelector] = useState<"from" | "to" | null>(null);
  const [srcBal, setSrcBal] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [flipAnim, setFlipAnim] = useState(false);
  const [bridgeElapsedSec, setBridgeElapsedSec] = useState(0);
  const [autoResetSec, setAutoResetSec] = useState(0);
  const secretsRef = useRef<string[]>([]);

  const loadTokens = useCallback(async (chainId: number, side: "src" | "dst") => {
    const list = await fetchBridgeTokensForChain(chainId);
    if (side === "src") {
      setSrcTokens(list);
      setSrcToken((prev) => list.find((t) => t.address === prev.address) ?? list[0]);
    } else {
      setDstTokens(list);
      setDstToken((prev) => list.find((t) => t.address === prev.address) ?? list[0]);
    }
  }, []);

  useEffect(() => {
    void loadTokens(srcChain.chainId, "src");
  }, [srcChain.chainId, loadTokens]);

  useEffect(() => {
    void loadTokens(dstChain.chainId, "dst");
  }, [dstChain.chainId, loadTokens]);

  useEffect(() => {
    setError(null);
  }, [fromAmount, srcChain.chainId, dstChain.chainId, srcToken.address, dstToken.address]);

  useEffect(() => {
    const prefill = localStorage.getItem("afx_bridge_prefill");
    if (prefill && parseFloat(prefill) > 0) {
      setFromAmount(prefill);
      localStorage.removeItem("afx_bridge_prefill");
    }
  }, []);

  const fetchBalance = useCallback(
    async (chain: BridgeEvmChain, token: BridgeToken) => {
      if (!evmAddress) return null;
      try {
        const res = await fetch("/api/swap/oneinch/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenAddress: token.address,
            walletAddress: evmAddress,
            chainId: chain.chainId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) return null;
        return parseFloat(formatUnits(data.balance, token.decimals));
      } catch {
        return null;
      }
    },
    [evmAddress],
  );

  useEffect(() => {
    if (!evmAddress) {
      setSrcBal(null);
      return;
    }
    void fetchBalance(srcChain, srcToken).then(setSrcBal);
  }, [evmAddress, srcChain, srcToken, fetchBalance]);

  const resetBridgeForm = useCallback(() => {
    secretsRef.current = [];
    setStage("idle");
    setFromAmount("");
    setToAmount("");
    setQuote(null);
    setQuoteError(null);
    setError(null);
    setProgress("");
    setTxHash(null);
    setQuoting(false);
    setBridgeElapsedSec(0);
    setAutoResetSec(0);
    setShowPresetSelector(false);
    setSelector(null);
    if (evmAddress) void fetchBalance(srcChain, srcToken).then(setSrcBal);
  }, [evmAddress, srcChain, srcToken, fetchBalance]);

  useEffect(() => {
    if (stage !== "revealing") {
      setBridgeElapsedSec(0);
      return;
    }
    const started = Date.now();
    setBridgeElapsedSec(0);
    const tick = setInterval(() => {
      setBridgeElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [stage]);

  useEffect(() => {
    if (stage !== "done") return;
    const total = 6;
    setAutoResetSec(total);
    const interval = setInterval(() => {
      setAutoResetSec((s) => {
        if (s <= 1) {
          clearInterval(interval);
          resetBridgeForm();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, resetBridgeForm]);

  const dstTokenValid = useMemo(
    () => dstTokens.some((t) => t.address.toLowerCase() === dstToken.address.toLowerCase()),
    [dstTokens, dstToken.address],
  );
  const srcTokenValid = useMemo(
    () => srcTokens.some((t) => t.address.toLowerCase() === srcToken.address.toLowerCase()),
    [srcTokens, srcToken.address],
  );

  const fetchQuote = useCallback(async () => {
    if (
      !evmAddress ||
      !fromAmount ||
      parseFloat(fromAmount.replace(/,/g, "")) <= 0 ||
      srcChain.chainId === dstChain.chainId ||
      !srcTokenValid ||
      !dstTokenValid
    ) {
      setQuote(null);
      setToAmount("");
      return;
    }
    setQuoting(true);
    setQuoteError(null);
    try {
      const res = await fetch("/api/bridge/fusion-plus/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          srcChainId: srcChain.chainId,
          dstChainId: dstChain.chainId,
          srcTokenAddress: srcToken.address,
          dstTokenAddress: dstToken.address,
          amount: toAtomic(fromAmount, srcToken.decimals),
          walletAddress: evmAddress,
          preset,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Quote failed");
      setError(null);
      setQuote(data as BridgeQuote);
      setToAmount(formatReceiveAmount(data.receiveAmount, dstToken.decimals));
    } catch (e) {
      setQuote(null);
      setToAmount("");
      setQuoteError(toUserFacingError(e, "swap"));
    } finally {
      setQuoting(false);
    }
  }, [evmAddress, fromAmount, srcChain, dstChain, srcToken, dstToken, preset, srcTokenValid, dstTokenValid]);

  useEffect(() => {
    const t = setTimeout(() => void fetchQuote(), 400);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  const flipSides = () => {
    setFlipAnim(true);
    setTimeout(() => {
      const ns = dstChain;
      const nd = srcChain;
      const ntFrom = dstToken;
      const ntTo = srcToken;
      const na = toAmount.replace(/,/g, "");
      setSrcChain(ns);
      setDstChain(nd);
      setSrcToken(ntFrom);
      setDstToken(ntTo);
      setFromAmount(na);
      setToAmount("");
      setFlipAnim(false);
    }, 180);
  };

  const executeBridge = async () => {
    if (!quote || !evmAddress) return;
    setError(null);
    secretsRef.current = [];

    try {
      if (evmChainId !== srcChain.chainId) {
        setStage("switching");
        setProgress(`Switch to ${srcChain.label}`);
        await switchToChainById(srcChain.chainId);
      }

      const secrets = generateBridgeSecrets(quote.secretsCount);
      secretsRef.current = secrets;
      const secretHashes = buildBridgeSecretHashes(secrets);
      const hashLock = buildBridgeHashLock(secrets);

      const signer = await getEvmSigner();
      if (!signer) throw new Error("Wallet signer unavailable");

      const atomic = toAtomic(fromAmount, srcToken.decimals);
      const isNative = srcToken.address.toLowerCase() === NATIVE_EVM.toLowerCase();

      setStage("signing");
      setProgress("Updating quote…");
      const refreshRes = await fetch("/api/bridge/fusion-plus/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          srcChainId: srcChain.chainId,
          dstChainId: dstChain.chainId,
          srcTokenAddress: srcToken.address,
          dstTokenAddress: dstToken.address,
          amount: atomic,
          walletAddress: evmAddress,
          preset: quote.preset || preset,
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshRes.ok || !refreshData.success) {
        throw new Error(refreshData.error || "Quote refresh failed");
      }
      const freshQuote = refreshData as BridgeQuote;
      setQuote(freshQuote);

      if (!isNative) {
        setStage("approving");
        setProgress("Checking token approval…");
        const token = new ethers.Contract(srcToken.address, ERC20_APPROVE_ABI, signer);
        const allowance = await token.allowance(evmAddress, FUSION_PLUS_LOP_ROUTER);
        if (BigInt(allowance.toString()) < BigInt(atomic)) {
          setProgress("Confirm approval in wallet…");
          const tx = await token.approve(FUSION_PLUS_LOP_ROUTER, ethers.MaxUint256);
          await tx.wait();
        }
      }

      setStage("signing");
      setProgress("Preparing your bridge…");
      const prepRes = await fetch("/api/bridge/fusion-plus/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: freshQuote.quoteId,
          walletAddress: evmAddress,
          preset: freshQuote.preset || preset,
          hashLock,
          secretHashes,
        }),
      });
      const prep = await prepRes.json();
      if (!prepRes.ok || !prep.success) throw new Error(prep.error || "Create order failed");

      setProgress("Confirm in your wallet…");
      const { domain, types, message } = prep.typedData;
      const { EIP712Domain: _d, ...signingTypes } = types;
      const signature = await signer.signTypedData(domain, signingTypes, message);

      setStage("submitting");
      setProgress("Sending bridge…");
      const subRes = await fetch("/api/bridge/fusion-plus/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: prep.quoteId, signature }),
      });
      const sub = await subRes.json();
      if (!subRes.ok || !sub.success) throw new Error(sub.error || "Submit failed");

      const hash = sub.orderHash as string;
      setTxHash(hash);
      setStage("revealing");
      setProgress("Completing transfer…");

      let done = false;
      for (let i = 0; i < 180 && !done; i++) {
        await new Promise((r) => setTimeout(r, i < 10 ? 1000 : 2000));

        const readyRes = await fetch(
          `/api/bridge/fusion-plus/ready-secrets?orderHash=${encodeURIComponent(hash)}`,
        );
        const ready = await readyRes.json();
        if (ready.success && Array.isArray(ready.fills)) {
          for (const fill of ready.fills as { idx: number }[]) {
            const secret = secretsRef.current[fill.idx];
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

      secretsRef.current = [];
      setStage("done");
      onComplete?.();
    } catch (e) {
      secretsRef.current = [];
      setError(toUserFacingError(e, "swap"));
      setStage("idle");
      setProgress("");
      setQuoting(false);
    }
  };

  const busy = ["switching", "approving", "signing", "submitting", "revealing"].includes(stage);
  const isOnSrcChain = evmChainId === srcChain.chainId;
  const sameChain = srcChain.chainId === dstChain.chainId;
  const numFrom = parseFloat(fromAmount.replace(/,/g, "")) || 0;
  const insufficient = srcBal != null && numFrom > srcBal;
  const estDurationSec = quote?.auctionDurationSec ?? FUSION_PRESET_DURATION_SEC[preset];
  const receiveMeta = useMemo(() => {
    if (!quote || !toAmount) return null;
    const min =
      quote.minReceiveAmount != null
        ? formatReceiveAmount(quote.minReceiveAmount, dstToken.decimals)
        : null;
    const max =
      quote.maxReceiveAmount != null
        ? formatReceiveAmount(quote.maxReceiveAmount, dstToken.decimals)
        : null;
    const showRange = min && max && min !== toAmount.replace(/,/g, "");
    return {
      duration: formatBridgeDuration(estDurationSec),
      range: showRange ? `${min} – ${max} ${dstToken.symbol}` : null,
    };
  }, [quote, toAmount, estDurationSec, dstToken]);

  const canBridge =
    !!quote && isEvmConnected && numFrom > 0 && !busy && !sameChain && !insufficient;

  const ctaText = () => {
    if (!isEvmConnected) return "Connect Wallet";
    if (sameChain) return "Pick different chains";
    if (busy) return bridgeButtonLabel(stage, srcChain.label);
    if (!isOnSrcChain) return `Switch to ${srcChain.label}`;
    if (insufficient) return `Insufficient ${srcToken.symbol}`;
    if (!fromAmount || numFrom <= 0) return "Enter an amount";
    if (quoting) return "Finding route…";
    if (quoteError) return "No route found";
    if (!quote) return "No route found";
    return "Bridge";
  };

  if (stage === "done" && txHash) {
    return (
      <SuccessView
        title="Bridge complete"
        actionLabel="Bridge again"
        footerHint={
          autoResetSec > 0 ? `Form resets in ${autoResetSec}s…` : undefined
        }
        fromSymbol={`${srcToken.symbol} (${srcChain.shortLabel})`}
        toSymbol={`${dstToken.symbol} (${dstChain.shortLabel})`}
        fromAmt={fromAmount}
        toAmt={toAmount}
        txLink={`${srcChain.explorer}/tx/${txHash}`}
        onNew={resetBridgeForm}
      />
    );
  }

  const tokenOptions: TokenOption[] = (selector === "from" ? srcTokens : dstTokens).map((t) => ({
    symbol: t.symbol,
    name: t.name,
    address: t.address,
    decimals: t.decimals,
    logoURI: t.logoURI,
  }));

  return (
    <>
      <style>{`
        .swp-input { -moz-appearance: textfield; }
        .swp-input::-webkit-inner-spin-button,
        .swp-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .swp-input:focus { outline: none; }
        .swp-input::placeholder { color: #373D4A !important; }
        @keyframes bridgeSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes bridgePulse {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes bridgeBarIndeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 11, color: LABEL, fontFamily: "'Inter', system-ui, sans-serif" }}>
          1inch Fusion+ · Cross-chain
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: LABEL }}>
            Speed: <span style={{ color: ORANGE, fontWeight: 600, textTransform: "capitalize" }}>{preset}</span>
          </span>
          <button
            type="button"
            onClick={() => setShowPresetSelector((s) => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", color: LABEL, padding: 2 }}
          >
            <Settings2 size={13} />
          </button>
        </div>
      </div>

      {showPresetSelector && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginBottom: 12,
            padding: "10px 12px",
            background: CARD,
            borderRadius: 12,
            border: `1px solid ${BORDER}`,
          }}
        >
          {FUSION_PRESET_OPTIONS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                setPreset(p.key);
                setShowPresetSelector(false);
              }}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "none",
                background: preset === p.key ? "rgba(212,165,116,0.12)" : "rgba(255,255,255,0.04)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: preset === p.key ? ORANGE : BRIGHT }}>
                {p.label}
              </span>
              <span style={{ display: "block", fontSize: 10, color: LABEL, marginTop: 2 }}>{p.description}</span>
            </button>
          ))}
        </div>
      )}

      <BridgePanel
        label="You pay"
        chain={srcChain}
        chains={BRIDGE_EVM_CHAINS}
        onSelectChain={(c) => {
          if (c.chainId === dstChain.chainId) {
            const alt = BRIDGE_EVM_CHAINS.find((x) => x.chainId !== c.chainId);
            if (alt) {
              setDstChain(alt);
              setDstToken(pickTokenForChain(alt, dstToken));
            }
          }
          setSrcChain(c);
          setSrcToken(pickTokenForChain(c, srcToken));
          setQuote(null);
          setQuoteError(null);
        }}
        token={srcToken}
        amount={fromAmount}
        balance={srcBal}
        disabled={busy}
        onAmountChange={(v) => {
          if (v.split(".").length <= 2) setFromAmount(v);
        }}
        onSelectToken={() => setSelector("from")}
        onSetMax={() => {
          if (srcBal != null && srcBal > 0) {
            const isNative = srcToken.address.toLowerCase() === NATIVE_EVM.toLowerCase();
            setFromAmount(String(isNative ? Math.max(0, srcBal - 0.002) : srcBal * 0.995));
          }
        }}
        testIdPrefix="from"
      />

      <div style={{ display: "flex", justifyContent: "center", margin: "-10px 0", position: "relative", zIndex: 10 }}>
        <button
          type="button"
          onClick={flipSides}
          disabled={busy}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: ORANGE,
            border: "3px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: busy ? "not-allowed" : "pointer",
            transform: flipAnim ? "rotate(180deg)" : "none",
            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            opacity: busy ? 0.5 : 1,
          }}
        >
          <ArrowDownUp size={16} color="#fff" />
        </button>
      </div>

      <BridgePanel
        label="You receive"
        chain={dstChain}
        chains={BRIDGE_EVM_CHAINS}
        onSelectChain={(c) => {
          if (c.chainId === srcChain.chainId) {
            const alt = BRIDGE_EVM_CHAINS.find((x) => x.chainId !== c.chainId);
            if (alt) {
              setSrcChain(alt);
              setSrcToken(pickTokenForChain(alt, srcToken));
            }
          }
          setDstChain(c);
          setDstToken(pickTokenForChain(c, dstToken));
          setQuote(null);
          setQuoteError(null);
        }}
        token={dstToken}
        amount={toAmount}
        balance={null}
        readOnly
        loading={quoting}
        disabled={busy}
        onSelectToken={() => setSelector("to")}
        testIdPrefix="to"
      />

      {receiveMeta && !quoteError && (
        <div
          style={{
            fontSize: 10,
            color: LABEL,
            marginTop: -6,
            marginBottom: 10,
            textAlign: "right",
            lineHeight: 1.5,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          Est. {receiveMeta.duration} to complete
          {receiveMeta.range ? ` · Auction ${receiveMeta.range}` : null}
        </div>
      )}

      {(quoteError || error) && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: "#ef4461", lineHeight: 1.4 }}>{error || quoteError}</div>
          {error && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setQuote(null);
                void fetchQuote();
              }}
              style={{
                marginTop: 8,
                fontSize: 11,
                color: ORANGE,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}
      {busy && !error && (
        <div
          style={{
            marginTop: 12,
            padding: "14px 16px",
            borderRadius: 12,
            background: CARD,
            border: `1px solid ${BORDER}`,
            boxShadow: CARD_SHADOW,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "2px solid rgba(212,165,116,0.25)",
                borderTopColor: ORANGE,
                animation: "bridgeSpin 0.9s linear infinite",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: BRIGHT,
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {stage === "revealing" ? "Bridge in progress" : "Setting up bridge"}
              </div>
              <div style={{ fontSize: 11, color: LABEL, marginTop: 2, fontFamily: MONO }}>
                {bridgeStatusDetail(stage, srcChain.label, progress)}
              </div>
            </div>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {stage === "revealing" && estDurationSec > 0 ? (
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(95, Math.round((bridgeElapsedSec / estDurationSec) * 100))}%`,
                  background: `linear-gradient(90deg, ${ORANGE}, #e8c9a0)`,
                  borderRadius: 2,
                  transition: "width 1s ease-out",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: "0",
                  width: "40%",
                  background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)`,
                  animation: "bridgeBarIndeterminate 1.4s ease-in-out infinite",
                }}
              />
            )}
          </div>
          {stage === "revealing" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 10,
                color: LABEL,
                fontFamily: MONO,
              }}
            >
              <span>{formatElapsed(bridgeElapsedSec)} elapsed</span>
              <span>Est. {formatBridgeDuration(estDurationSec)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: ORANGE,
                  animation: `bridgePulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!isEvmConnected) {
            connectEvm();
            return;
          }
          if (!isOnSrcChain && !busy) {
            void switchToChainById(srcChain.chainId);
            return;
          }
          if (canBridge) void executeBridge();
        }}
        disabled={isEvmConnected && !canBridge && isOnSrcChain && !sameChain && numFrom > 0 && !busy}
        style={{
          width: "100%",
          marginTop: 16,
          padding: "13px 0",
          borderRadius: 10,
          border: "none",
          background: canBridge || !isEvmConnected || !isOnSrcChain ? ORANGE : "#1A1C22",
          color: canBridge || !isEvmConnected || !isOnSrcChain ? "#fff" : "#3A4050",
          fontSize: 13,
          fontWeight: 700,
          cursor: canBridge || !isEvmConnected || !isOnSrcChain ? "pointer" : "not-allowed",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {ctaText()}
      </button>

      {selector && (
        <TokenSelectorModal
          tokens={tokenOptions}
          excludeMint={selector === "from" ? dstToken.address : srcToken.address}
          onClose={() => setSelector(null)}
          onSelect={(t) => {
            const resolved: BridgeToken = {
              symbol: t.symbol,
              name: t.name || t.symbol,
              address: t.address,
              decimals: t.decimals ?? 18,
              logoURI: t.logoURI,
            };
            if (selector === "from") setSrcToken(resolved);
            else setDstToken(resolved);
          }}
        />
      )}
    </>
  );
}
