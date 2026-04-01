"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, ArrowDown, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import {
  ERC20_APPROVE_ABI, HL_BRIDGE_CONTRACT, HL_BRIDGE_ABI, USDC_ARBITRUM,
  BRIDGE_SRC_CHAINS, BRIDGE_ARB_DST_TOKENS,
  type BridgeSrcToken, type BridgeSrcChain,
} from "@/config/bridgeConfig";

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Inter', system-ui, sans-serif";

type SrcChainKey = BridgeSrcChain["key"];
type BridgeStep = "idle" | "quoting" | "quoted" | "approving" | "bridging" | "polling" | "success" | "error";

function toAtomicUnits(amount: string, decimals: number): string {
  const [whole = "0", frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  return (whole + paddedFrac).replace(/^0+/, "") || "0";
}

function fromAtomicUnits(raw: string, decimals: number): string {
  const padded = raw.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals) || "0";
  const frac = padded.slice(padded.length - decimals);
  const trimmed = frac.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

interface BridgeContentProps {
  defaultAmount?: string;
  defaultDstToken?: "USDC" | "USDT";
  defaultArbDst?: "arbitrum" | "hyperliquid";
  preferredSrcChain?: string;
  onComplete?: () => void;
}

export function BridgeContent({ defaultAmount, defaultDstToken, defaultArbDst, preferredSrcChain, onComplete }: BridgeContentProps = {}) {
  const { evmAddress, isEvmConnected, evmChainId, connectEvm, switchToChainById, getEvmProvider } = useEvmWallet();

  const initialSrcChain = (preferredSrcChain
    ? BRIDGE_SRC_CHAINS.find(c => c.key === preferredSrcChain)?.key
    : undefined) ?? "ethereum";

  const [srcChainKey, setSrcChainKey] = useState<SrcChainKey>(initialSrcChain as SrcChainKey);
  const [srcToken, setSrcToken] = useState<BridgeSrcToken>(BRIDGE_SRC_CHAINS[0].tokens[0]);
  const [dstToken, setDstToken] = useState<BridgeSrcToken>(
    defaultDstToken
      ? (BRIDGE_ARB_DST_TOKENS.find(t => t.symbol === defaultDstToken) ?? BRIDGE_ARB_DST_TOKENS[0])
      : BRIDGE_ARB_DST_TOKENS[0]
  );
  const [arbDst, setArbDst] = useState<"arbitrum" | "hyperliquid">(defaultArbDst ?? "arbitrum");
  const [amount, setAmount] = useState(defaultAmount ?? "");
  const [step, setStep] = useState<BridgeStep>("idle");
  const [quoteData, setQuoteData] = useState<any>(null);
  const [estimatedOutput, setEstimatedOutput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [txHash, setTxHash] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialMountRef = useRef(true);

  const srcChain = BRIDGE_SRC_CHAINS.find(c => c.key === srcChainKey)!;
  const isArbSrc = srcChainKey === "arbitrum";
  const isHlRoute = isArbSrc && arbDst === "hyperliquid";
  const isArbSwap = isArbSrc && arbDst === "arbitrum";
  const dstLabel = isHlRoute ? "Hyperliquid" : "Arbitrum";
  const dstChainId = 42161;
  const bridgeProvider = isHlRoute ? "Hyperliquid Bridge" : isArbSwap ? "1inch" : "1inch";
  const estTime = isHlRoute ? "~10 sec" : isArbSwap ? "~30 sec" : "1–2 min";
  const isOnCorrectChain = evmChainId === srcChain.chainId;
  const arbSwapDstToken = isArbSwap
    ? (defaultDstToken
      ? (BRIDGE_ARB_DST_TOKENS.find(t => t.symbol === defaultDstToken) ?? BRIDGE_ARB_DST_TOKENS[0])
      : (srcToken.symbol === "USDC"
        ? BRIDGE_ARB_DST_TOKENS.find(t => t.symbol === "USDT")!
        : BRIDGE_ARB_DST_TOKENS.find(t => t.symbol === "USDC")!))
    : null;

  useEffect(() => {
    const chain = BRIDGE_SRC_CHAINS.find(c => c.key === srcChainKey)!;
    setSrcToken(chain.tokens[0]);
    if (initialMountRef.current) {
      initialMountRef.current = false;
    } else {
      setAmount("");
    }
    setStep("idle");
    setQuoteData(null);
    setEstimatedOutput("");
    setErrorMsg("");
  }, [srcChainKey]);

  useEffect(() => {
    if (preferredSrcChain) return;
    if (!evmChainId) return;
    const matched = BRIDGE_SRC_CHAINS.find(c => c.chainId === evmChainId);
    if (matched) setSrcChainKey(matched.key);
  }, [evmChainId, preferredSrcChain]);

  useEffect(() => {
    if (!preferredSrcChain) return;
    const matched = BRIDGE_SRC_CHAINS.find(c => c.key === preferredSrcChain);
    if (matched) setSrcChainKey(matched.key);
  }, [preferredSrcChain]);

  useEffect(() => {
    setStep("idle");
    setQuoteData(null);
    setEstimatedOutput("");
  }, [srcToken, dstToken]);

  const fetchBalance = useCallback(async () => {
    if (!evmAddress || !isEvmConnected) { setBalance(null); return; }
    try {
      const prov = await getEvmProvider();
      if (!prov) return;
      const { ethers } = await import("ethers");
      const bp = new ethers.BrowserProvider(prov as never);
      if (srcToken.native) {
        const bal = await bp.getBalance(evmAddress);
        setBalance(parseFloat(ethers.formatEther(bal)));
      } else {
        const contract = new ethers.Contract(srcToken.address, ["function balanceOf(address) view returns (uint256)"], bp);
        const raw = await contract.balanceOf(evmAddress);
        setBalance(parseFloat(ethers.formatUnits(raw, srcToken.decimals)));
      }
    } catch { setBalance(null); }
  }, [evmAddress, isEvmConnected, getEvmProvider, srcToken]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  useEffect(() => {
    if (step === "success" && onComplete) {
      const t = setTimeout(onComplete, 1800);
      return () => clearTimeout(t);
    }
  }, [step, onComplete]);

  const getQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0 || !evmAddress) return;

    if (isHlRoute) {
      setEstimatedOutput(amount);
      setStep("quoted");
      return;
    }

    if (isArbSwap && arbSwapDstToken) {
      setStep("quoting");
      setErrorMsg("");
      try {
        const atomicAmount = toAtomicUnits(amount, srcToken.decimals);
        const params = new URLSearchParams({
          src: srcToken.address,
          dst: arbSwapDstToken.address,
          amount: atomicAmount,
        });
        const res = await fetch(`/api/bridge/arb-swap?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Quote failed");
        const dstAmount = data.dstAmount || data.toTokenAmount;
        setEstimatedOutput(dstAmount ? fromAtomicUnits(String(dstAmount), arbSwapDstToken.decimals) : amount);
        setStep("quoted");
      } catch (err: any) {
        setEstimatedOutput(amount);
        setStep("quoted");
      }
      return;
    }

    setStep("quoting");
    setErrorMsg("");
    try {
      const atomicAmount = toAtomicUnits(amount, srcToken.decimals);
      const params = new URLSearchParams({
        srcChain: String(srcChain.chainId),
        dstChain: String(dstChainId),
        srcToken: srcToken.address,
        dstToken: dstToken.address,
        amount: atomicAmount,
        walletAddress: evmAddress,
      });
      const res = await fetch(`/api/bridge/quote?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Quote failed" }));
        throw new Error(body.error || "Quote failed");
      }
      const data = await res.json();
      setQuoteData(data);
      const dstAmount = data.dstTokenAmount || data.toTokenAmount || data.dstAmount;
      setEstimatedOutput(dstAmount ? fromAtomicUnits(String(dstAmount), dstToken.decimals) : amount);
      setStep("quoted");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to get bridge quote");
      setStep("error");
    }
  }, [amount, evmAddress, isHlRoute, isArbSwap, arbSwapDstToken, srcChain, srcToken, dstToken]);

  useEffect(() => {
    if (step !== "idle") return;
    const t = setTimeout(() => {
      if (amount && parseFloat(amount) > 0 && evmAddress && isOnCorrectChain) getQuote();
    }, 800);
    return () => clearTimeout(t);
  }, [amount, evmAddress, step, getQuote, isOnCorrectChain]);

  const executeBridge = async () => {
    if (!evmAddress || !isEvmConnected) return;
    setErrorMsg("");
    try {
      const prov = await getEvmProvider();
      if (!prov) throw new Error("No wallet provider");
      const { ethers } = await import("ethers");
      const bp = new ethers.BrowserProvider(prov as never);
      const signer = await bp.getSigner();

      if (isHlRoute) {
        if (evmChainId !== 42161) {
          setStatusMsg("Switching to Arbitrum...");
          await switchToChainById(42161);
        }
        const atomicAmount = BigInt(toAtomicUnits(amount, 6));
        setStep("approving");
        setStatusMsg("Approving USDC...");
        const usdcContract = new ethers.Contract(USDC_ARBITRUM, ERC20_APPROVE_ABI, signer);
        const allowance = await usdcContract.allowance(evmAddress, HL_BRIDGE_CONTRACT);
        if (BigInt(allowance) < atomicAmount) {
          const approveTx = await usdcContract.approve(HL_BRIDGE_CONTRACT, atomicAmount);
          await approveTx.wait();
        }
        setStep("bridging");
        setStatusMsg("Depositing USDC to Hyperliquid...");
        const bridge = new ethers.Contract(HL_BRIDGE_CONTRACT, HL_BRIDGE_ABI, signer);
        const depositTx = await bridge.sendUSDC(atomicAmount, evmAddress);
        const receipt = await depositTx.wait();
        setTxHash(receipt.hash);
        setStep("success");
        setStatusMsg("USDC deposited to Hyperliquid!");
        return;
      }

      if (isArbSwap && arbSwapDstToken) {
        if (evmChainId !== 42161) {
          setStatusMsg("Switching to Arbitrum...");
          await switchToChainById(42161);
        }
        const atomicAmount = toAtomicUnits(amount, srcToken.decimals);
        const ONEINCH_ROUTER = "0x111111125421cA6dc452d289314280a0f8842A65";
        setStep("approving");
        setStatusMsg(`Approving ${srcToken.symbol}...`);
        const tokenContract = new ethers.Contract(srcToken.address, ERC20_APPROVE_ABI, signer);
        const currentAllowance = await tokenContract.allowance(evmAddress, ONEINCH_ROUTER);
        if (BigInt(currentAllowance) < BigInt(atomicAmount)) {
          const approveTx = await tokenContract.approve(ONEINCH_ROUTER, ethers.MaxUint256);
          await approveTx.wait();
        }
        setStep("bridging");
        setStatusMsg(`Swapping ${srcToken.symbol} → ${arbSwapDstToken.symbol}...`);
        const swapRes = await fetch("/api/bridge/arb-swap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            src: srcToken.address,
            dst: arbSwapDstToken.address,
            amount: atomicAmount,
            from: evmAddress,
            slippage: 1,
          }),
        });
        const swapData = await swapRes.json();
        if (!swapRes.ok) throw new Error(swapData.error || "Swap failed");
        const tx = swapData.tx;
        const swapTx = await signer.sendTransaction({
          to: tx.to,
          data: tx.data,
          value: BigInt(tx.value || "0"),
          gasLimit: tx.gas ? BigInt(Math.ceil(Number(tx.gas) * 1.2)) : undefined,
        });
        const receipt = await swapTx.wait();
        setTxHash(receipt?.hash || "");
        setStep("success");
        setStatusMsg(`${srcToken.symbol} → ${arbSwapDstToken.symbol} swap complete!`);
        fetchBalance();
        return;
      }

      if (evmChainId !== srcChain.chainId) {
        setStatusMsg(`Switching to ${srcChain.label}...`);
        await switchToChainById(srcChain.chainId);
      }

      const atomicAmount = toAtomicUnits(amount, srcToken.decimals);
      if (!srcToken.native) {
        setStep("approving");
        setStatusMsg(`Approving ${srcToken.symbol}...`);
        const tokenContract = new ethers.Contract(srcToken.address, ERC20_APPROVE_ABI, signer);
        const ROUTER = "0x111111125421cA6dc452d289314280a0f8842A65";
        const currentAllowance = await tokenContract.allowance(evmAddress, ROUTER);
        if (BigInt(currentAllowance) < BigInt(atomicAmount)) {
          const tx = await tokenContract.approve(ROUTER, ethers.MaxUint256);
          await tx.wait();
        }
      }

      setStep("bridging");
      setStatusMsg("Submitting cross-chain transfer...");
      const orderRes = await fetch("/api/bridge/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          srcChainId: srcChain.chainId,
          dstChainId: dstChainId,
          srcToken: srcToken.address,
          dstToken: dstToken.address,
          amount: atomicAmount,
          walletAddress: evmAddress,
        }),
      });

      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        throw new Error(body.error || "Bridge execution failed");
      }

      const orderData = await orderRes.json();
      setTxHash(orderData.orderHash || orderData.txHash || "");

      if (orderData.orderHash) {
        setStep("polling");
        setStatusMsg("Processing transfer...");
        abortRef.current = new AbortController();
        let attempts = 0;
        while (attempts < 120) {
          if (abortRef.current?.signal.aborted) break;
          await new Promise(r => setTimeout(r, 5000));
          attempts++;
          try {
            const statusRes = await fetch(
              `/api/bridge/status?hash=${orderData.orderHash}&srcChain=${srcChain.chainId}`
            );
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === "executed" || statusData.status === "filled") {
                setStep("success");
                setStatusMsg("Cross-chain transfer complete!");
                fetchBalance();
                return;
              }
              if (statusData.status === "expired" || statusData.status === "refunded") {
                throw new Error(`Transfer ${statusData.status}. Funds have been refunded.`);
              }
              setStatusMsg(`Transfer in progress... (${attempts * 5}s)`);
            }
          } catch (e: any) {
            if (e.message.includes("refunded") || e.message.includes("expired")) throw e;
          }
        }
        setStep("success");
        setStatusMsg("Order submitted. Check your wallet for completion.");
      } else {
        setStep("success");
        setStatusMsg("Bridge transaction submitted!");
      }
    } catch (err: any) {
      console.error("[BRIDGE]", err);
      setErrorMsg(err.message || "Bridge failed");
      setStep("error");
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setStep("idle");
    setAmount("");
    setQuoteData(null);
    setEstimatedOutput("");
    setStatusMsg("");
    setErrorMsg("");
    setTxHash("");
    fetchBalance();
  };

  const amountNum = parseFloat(amount);
  const hasAmount = !!amount && amountNum > 0;
  const insufficientBalance = balance !== null && hasAmount && amountNum > balance;
  const busy = ["approving", "bridging", "polling", "quoting"].includes(step);

  const getButtonLabel = () => {
    if (!isEvmConnected) return "Connect Wallet";
    if (step === "quoting") return "Getting quote...";
    if (step === "approving") return "Approving...";
    if (step === "bridging") return isArbSwap ? "Swapping..." : "Bridging...";
    if (step === "polling") return "Processing...";
    if (step === "error") return "Try Again";
    if (step === "success") return "Start New Transfer";
    if (!hasAmount) return "Enter amount";
    if (insufficientBalance) return "Insufficient balance";
    if (!isOnCorrectChain) return `Switch to ${srcChain.label}`;
    if (step === "quoted") return isArbSwap ? "Swap" : "Bridge & Swap";
    return isArbSwap ? "Swap" : "Bridge & Swap";
  };

  return (
    <div data-testid="bridge-content">
      {/* Arbitrum destination toggle — shown only when ARB is the source */}
      {isArbSrc && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#4A5060", fontFamily: MONO, marginBottom: 6, letterSpacing: "0.06em" }}>
            DESTINATION
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {(["arbitrum", "hyperliquid"] as const).map(dst => {
              const active = arbDst === dst;
              const label = dst === "arbitrum" ? "Arbitrum" : "Hyperliquid";
              const logo = dst === "arbitrum" ? "/tokens/arb-chain.png" : "/tokens/hyperliquid.webp";
              const color = dst === "arbitrum" ? "#28A0F0" : "#33FF88";
              return (
                <button
                  key={dst}
                  data-testid={`button-arb-dst-${dst}`}
                  onClick={() => { setArbDst(dst); setStep("idle"); setEstimatedOutput(""); setErrorMsg(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    padding: "5px 12px", borderRadius: 8, border: "1px solid",
                    borderColor: active ? color + "55" : "#181A20",
                    background: active ? color + "18" : "transparent",
                    color: active ? "#E6EDF3" : "#6B7280",
                    fontSize: 11, fontWeight: 600, fontFamily: SANS,
                    cursor: "pointer", transition: "all 0.15s", outline: "none",
                  }}
                >
                  <img src={logo} alt={label}
                    style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Source chain selector — horizontal scroll row */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#4A5060", fontFamily: MONO, marginBottom: 6, letterSpacing: "0.06em" }}>
          FROM CHAIN
        </div>
        <div style={{
          display: "flex", gap: 5,
          overflowX: "auto", paddingBottom: 4,
          scrollbarWidth: "none",
        }}>
          {BRIDGE_SRC_CHAINS.map(c => {
            const active = srcChainKey === c.key;
            return (
              <button
                key={c.key}
                data-testid={`button-src-chain-${c.key}`}
                onClick={() => setSrcChainKey(c.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                  padding: "5px 10px", borderRadius: 8, border: "1px solid",
                  borderColor: active ? c.color + "55" : "#181A20",
                  background: active ? c.color + "18" : "transparent",
                  color: active ? "#E6EDF3" : "#6B7280",
                  fontSize: 11, fontWeight: 600, fontFamily: SANS,
                  cursor: "pointer", transition: "all 0.15s", outline: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <img
                  src={c.logo} alt={c.label}
                  style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {c.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source token selector (only when multiple tokens available) */}
      {srcChain.tokens.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#4A5060", fontFamily: MONO, marginBottom: 6, letterSpacing: "0.06em" }}>
            TOKEN
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {srcChain.tokens.map(t => {
              const active = srcToken.symbol === t.symbol;
              return (
                <button
                  key={t.symbol}
                  data-testid={`button-src-token-${t.symbol}`}
                  onClick={() => setSrcToken(t)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 8, border: "1px solid",
                    borderColor: active ? "#D4A57455" : "#181A20",
                    background: active ? "#D4A57418" : "transparent",
                    color: active ? "#E6EDF3" : "#6B7280",
                    fontSize: 11, fontWeight: 600, fontFamily: SANS,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <img src={t.logo} alt="" style={{ width: 14, height: 14, borderRadius: "50%" }} />
                  {t.symbol}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* From input box */}
      <div style={{
        borderRadius: 12, border: "1px solid #181A20",
        background: "#0C0E12", padding: "12px 14px", marginBottom: 2,
      }}>
        <div style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO, marginBottom: 8 }}>
          FROM · {srcChain.label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 90 }}>
            <img src={srcToken.logo} alt={srcToken.symbol} style={{ width: 28, height: 28, borderRadius: "50%" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>{srcToken.symbol}</div>
              {balance !== null && (
                <div style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO }}>
                  {balance.toFixed(srcToken.decimals > 8 ? 6 : Math.min(srcToken.decimals, 4))}
                </div>
              )}
            </div>
          </div>
          <input
            data-testid="input-bridge-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            disabled={busy}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              if (v.split(".").length <= 2) { setAmount(v); setStep("idle"); }
            }}
            style={{
              flex: 1, textAlign: "right", fontSize: 22, fontWeight: 300,
              fontFamily: MONO, color: "#E6EDF3", background: "transparent",
              border: "none", outline: "none", padding: 0,
              opacity: busy ? 0.5 : 1,
            }}
          />
        </div>
        {balance !== null && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
            {[25, 50, 100].map(pct => (
              <button
                key={pct}
                data-testid={`button-pct-${pct}`}
                onClick={() => {
                  const dec = srcToken.decimals > 8 ? 6 : srcToken.decimals;
                  setAmount((balance * pct / 100).toFixed(dec));
                  setStep("idle");
                }}
                style={{
                  padding: "2px 8px", borderRadius: 4, border: "1px solid #181A20",
                  background: "transparent", color: "#6B7280", fontSize: 10,
                  fontFamily: MONO, cursor: "pointer",
                }}
              >
                {pct === 100 ? "Max" : `${pct}%`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Arrow divider */}
      <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "#D4A574", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ArrowDown size={16} color="#fff" />
        </div>
      </div>

      {/* To box */}
      <div style={{
        borderRadius: 12, border: "1px solid #181A20",
        background: "#0C0E12", padding: "12px 14px", marginBottom: 12,
      }}>
        <div style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO, marginBottom: 8 }}>
          TO · {dstLabel}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            {isHlRoute ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src="/tokens/hyperliquid.webp" alt="HL"
                  style={{ width: 28, height: 28, borderRadius: "50%" }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>USDC</div>
              </div>
            ) : isArbSwap && arbSwapDstToken ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src={arbSwapDstToken.logo} alt={arbSwapDstToken.symbol}
                  style={{ width: 28, height: 28, borderRadius: "50%" }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS }}>{arbSwapDstToken.symbol}</div>
                <div style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO }}>on Arbitrum</div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 5 }}>
                {BRIDGE_ARB_DST_TOKENS.map(t => {
                  const active = dstToken.symbol === t.symbol;
                  return (
                    <button
                      key={t.symbol}
                      data-testid={`button-dst-token-${t.symbol}`}
                      onClick={() => { setDstToken(t); setStep("idle"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 7, border: "1px solid",
                        borderColor: active ? "#28A0F055" : "#181A20",
                        background: active ? "#28A0F018" : "transparent",
                        color: active ? "#E6EDF3" : "#6B7280",
                        fontSize: 11, fontWeight: 600, fontFamily: SANS,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      <img src={t.logo} alt="" style={{ width: 14, height: 14, borderRadius: "50%" }} />
                      {t.symbol}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{
            fontSize: 22, fontWeight: 300, fontFamily: MONO,
            color: estimatedOutput ? "#E6EDF3" : "#181A20",
          }}>
            {estimatedOutput || "0.00"}
          </div>
        </div>
      </div>

      {/* Quoting spinner */}
      {step === "quoting" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "4px 0 10px", color: "#6B7280", fontSize: 12, fontFamily: SANS }}>
          <Loader2 size={14} className="animate-spin" /> Getting best route...
        </div>
      )}

      {/* Quote info card */}
      {step === "quoted" && hasAmount && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, border: "1px solid #181A2055",
          background: "#0A0C1080", marginBottom: 12, fontSize: 11, fontFamily: MONO, color: "#6B7280",
        }}>
          <div style={{
            textAlign: "center", fontSize: 12, color: "#9BA4AE", fontFamily: SANS,
            padding: "4px 0 8px", fontWeight: 500,
          }} data-testid="text-bridge-summary">
            {isArbSwap
              ? `Swap ${amount} ${srcToken.symbol} → ${estimatedOutput || amount} ${arbSwapDstToken?.symbol || dstToken.symbol} on Arbitrum`
              : isHlRoute
                ? `Send ${amount} USDC to Hyperliquid`
                : `${amount} ${srcToken.symbol} on ${srcChain.label} → ${estimatedOutput || amount} ${dstToken.symbol} on ${dstLabel}`
            }
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span>Estimated time</span>
            <span style={{ color: "#E6EDF3" }}>{estTime}</span>
          </div>
          {isHlRoute && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span>Fee</span>
              <span style={{ color: "#33FF88" }}>Free</span>
            </div>
          )}
          <div style={{
            textAlign: "center", fontSize: 9, color: "#3A4050",
            fontFamily: MONO, letterSpacing: "0.04em", marginTop: 6,
          }} data-testid="text-bridge-route-attribution">
            Routed via {bridgeProvider}
          </div>
        </div>
      )}

      {/* In-progress status */}
      {(step === "approving" || step === "bridging" || step === "polling") && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
          borderRadius: 10, background: "#0A0C10", border: "1px solid #181A20",
          marginBottom: 12, color: "#E6EDF3", fontSize: 12, fontFamily: SANS,
        }}>
          <Loader2 size={16} className="animate-spin" style={{ color: "#D4A574" }} />
          {statusMsg}
        </div>
      )}

      {/* Success card */}
      {step === "success" && (
        <div style={{
          padding: "14px", borderRadius: 10, background: "#0B2818", border: "1px solid #33FF8830",
          marginBottom: 12, textAlign: "center",
        }}>
          <CheckCircle2 size={28} style={{ color: "#33FF88", margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: "#33FF88", fontFamily: SANS, marginBottom: 4 }}>
            {statusMsg}
          </div>
          {txHash && (
            <a
              href={`${srcChain.explorer}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-bridge-tx"
              style={{
                fontSize: 10, color: "#6B7280", fontFamily: MONO,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              View transaction <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      {/* Error card */}
      {step === "error" && errorMsg && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, background: "#1A0A0A", border: "1px solid #FF4C4C30",
          marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
        }}>
          <AlertCircle size={16} style={{ color: "#FF4C4C", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#FF4C4C", fontFamily: SANS }}>{errorMsg}</span>
        </div>
      )}

      {/* Bridge button */}
      <button
        data-testid="button-bridge-execute"
        onClick={() => {
          if (!isEvmConnected) { connectEvm(); return; }
          if (step === "success" || step === "error") { reset(); return; }
          if (step === "quoted") { executeBridge(); return; }
          if (!isOnCorrectChain && hasAmount) {
            switchToChainById(srcChain.chainId);
          }
        }}
        disabled={busy || (isEvmConnected && !hasAmount && step !== "success" && step !== "error")}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
          background: step === "success"
            ? "#0B2818"
            : insufficientBalance
              ? "#1A1A1A"
              : !hasAmount
                ? "#181A20"
                : "#D4A574",
          color: step === "success"
            ? "#33FF88"
            : insufficientBalance || !hasAmount
              ? "#4A5060"
              : "#fff",
          fontSize: 14, fontWeight: 700, fontFamily: SANS,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.7 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
        }}
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        {getButtonLabel()}
      </button>
    </div>
  );
}
