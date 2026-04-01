"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { MONO, SANS, ETH_TOKENS, ARB_TOKENS, BASE_TOKENS, SLIPPAGE_PRESETS, SWAP_CHAINS, type TokenState, type SwapChainKey } from "./swapConstants";
import { SuccessView } from "./SwapShared";
import TokenSelectorModal from "./TokenSelectorModal";
import { Settings2, ChevronDown, ArrowDownUp } from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────── */
const CARD   = "#0E1014";
const BORDER = "#1A1D24";
const LABEL  = "#555B6A";
const DIM    = "#373D4A";
const BRIGHT = "#E6EDF3";
const ORANGE = "#D4A574";
const CARD_SHADOW = "0 4px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.025)";

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ERC20_BALANCE_ABI = ["function balanceOf(address) view returns (uint256)"];

const CHAIN_RPC: Record<number, string> = {
  1:     "https://eth.llamarpc.com",
  42161: "https://arb1.arbitrum.io/rpc",
  8453:  "https://mainnet.base.org",
};

function toAtomicUnits(amount: string, decimals: number): string {
  const [whole = "0", frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  const raw = (whole + paddedFrac).replace(/^0+/, "") || "0";
  return raw;
}

async function fetchEvmBalances(
  address: string, tokens: TokenState[], chainId: number,
): Promise<Record<string, number>> {
  const rpcUrl = CHAIN_RPC[chainId];
  if (!rpcUrl) return {};
  try {
    const { ethers } = await import("ethers");
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const balances: Record<string, number> = {};
    const ethBal = await provider.getBalance(address);
    balances[NATIVE_ETH] = parseFloat(ethers.formatEther(ethBal));
    await Promise.allSettled(
      tokens
        .filter((t) => t.address.toLowerCase() !== NATIVE_ETH.toLowerCase())
        .map(async (t) => {
          try {
            const contract = new ethers.Contract(t.address, ERC20_BALANCE_ABI, provider);
            const raw = await contract.balanceOf(address);
            balances[t.address] = parseFloat(ethers.formatUnits(raw, t.decimals));
          } catch { balances[t.address] = 0; }
        })
    );
    return balances;
  } catch { return {}; }
}

async function getQuote(src: string, dst: string, amount: string, chainId: number) {
  const params = new URLSearchParams({ src, dst, amount, chainId: chainId.toString() });
  const res = await fetch(`/api/swap/oneinch/quote?${params}`);
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Quote failed"); }
  return res.json();
}

async function getSwapData(src: string, dst: string, amount: string, from: string, slippage: string, chainId: number) {
  const params = new URLSearchParams({ src, dst, amount, from, slippage, chainId: chainId.toString() });
  const res = await fetch(`/api/swap/oneinch/swap-data?${params}`);
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Swap data failed"); }
  return res.json();
}

/* ─── Token panel ────────────────────────────────────────── */
function TokenPanel({
  label, token, amount, balance, loading, readOnly, disabled,
  onAmountChange, onSelectToken, onSetMax, testIdPrefix,
}: {
  label: string; token: TokenState; amount: string;
  balance: number | null; loading?: boolean; readOnly?: boolean; disabled?: boolean;
  onAmountChange?: (v: string) => void; onSelectToken: () => void;
  onSetMax?: () => void; testIdPrefix: string;
}) {
  const balNum = balance != null
    ? balance.toLocaleString(undefined, { maximumFractionDigits: 6 })
    : null;
  const hasAmount = parseFloat(amount) > 0;

  return (
    <div style={{
      borderRadius: 16,
      background: CARD,
      border: `1px solid ${BORDER}`,
      boxShadow: CARD_SHADOW,
      padding: "16px 18px 14px",
    }}>
      {/* "You pay" / "You receive" */}
      <div style={{ fontSize: 12, color: LABEL, fontFamily: SANS, marginBottom: 12 }}>{label}</div>

      {/* Token selector + Amount */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          data-testid={`button-select-${testIdPrefix}-token`}
          onClick={onSelectToken}
          style={{
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            background: "rgba(255,255,255,0.05)",
            border: "none",
            borderRadius: 50, padding: "7px 12px 7px 8px",
            cursor: "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          {token.logoURI ? (
            <img src={token.logoURI} alt={token.symbol}
              style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: DIM, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, color: LABEL, fontFamily: MONO }}>{token.symbol.slice(0, 2)}</span>
            </div>
          )}
          <span style={{ fontSize: 15, fontWeight: 700, color: BRIGHT, fontFamily: SANS }}>{token.symbol}</span>
          <ChevronDown size={13} color={LABEL} />
        </button>

        {/* Amount */}
        <div style={{ flex: 1, textAlign: "right" }}>
          {readOnly || loading ? (
            <span style={{
              fontSize: 32, fontWeight: 300, fontFamily: MONO, letterSpacing: "-0.03em",
              color: hasAmount ? "#9BA4AE" : DIM,
            }}>
              {loading ? "···" : (hasAmount ? amount : "0.00")}
            </span>
          ) : (
            <input
              data-testid={`input-${testIdPrefix}-amount`}
              type="text" inputMode="decimal" autoComplete="off"
              placeholder="0.00" disabled={disabled}
              value={amount}
              onChange={e => onAmountChange?.(e.target.value.replace(/[^0-9.]/g, ""))}
              style={{
                width: "100%", textAlign: "right",
                fontSize: 32, fontWeight: 300,
                fontFamily: MONO, letterSpacing: "-0.03em",
                color: hasAmount ? BRIGHT : DIM,
                background: "transparent", border: "none", outline: "none", padding: 0,
                opacity: disabled ? 0.5 : 1,
              }}
            />
          )}
        </div>
      </div>

      {/* Balance row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ fontSize: 11, color: DIM, fontFamily: MONO }}>
          {/* USD value placeholder */}
          {hasAmount ? "" : ""}
        </span>
        {balNum != null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: LABEL, fontFamily: MONO }}>
              Balance: {balNum}
            </span>
            {onSetMax && parseFloat(balNum.replace(/,/g, "")) > 0 && (
              <button
                data-testid={`button-max-${testIdPrefix}`}
                onClick={onSetMax}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 700, color: ORANGE, fontFamily: SANS,
                  padding: 0,
                }}
              >
                Max
              </button>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: DIM, fontFamily: MONO }}>Balance: —</span>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export function EvmSwapContent({ onComplete }: { onComplete?: () => void }) {
  const { evmAddress, isEvmConnected, evmChainId, connectEvm, switchToChainById, getEvmProvider } = useEvmWallet();

  const [swapChain, setSwapChain] = useState<SwapChainKey>("arbitrum");
  const chainConfig = SWAP_CHAINS.find(c => c.key === swapChain)!;
  const tokenList = swapChain === "ethereum" ? ETH_TOKENS : swapChain === "base" ? BASE_TOKENS : ARB_TOKENS;

  const [fromToken, setFromToken] = useState<TokenState>(tokenList[0]);
  const [toToken, setToToken] = useState<TokenState>(tokenList[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteTimer = useRef<NodeJS.Timeout | null>(null);

  const [slippage, setSlippage] = useState(0.5);
  const [showSlippage, setShowSlippage] = useState(false);
  const [showChainDrop, setShowChainDrop] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBal, setLoadingBal] = useState(false);
  const [stage, setStage] = useState<"idle" | "switching" | "signing" | "done" | "error" | "approving">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState<"from" | "to" | null>(null);
  const [flipAnim, setFlipAnim] = useState(false);
  const [panelAnim, setPanelAnim] = useState<"idle" | "out" | "in">("idle");
  const switchingRef = useRef(false);

  const loadBalances = useCallback(async (tokens: TokenState[], chainId: number) => {
    if (!evmAddress || !isEvmConnected) return;
    setLoadingBal(true);
    const bals = await fetchEvmBalances(evmAddress, tokens, chainId);
    if (Object.keys(bals).length > 0) setBalances(bals);
    setLoadingBal(false);
  }, [evmAddress, isEvmConnected]);

  useEffect(() => {
    if (isEvmConnected && evmAddress && !switchingRef.current) {
      loadBalances(tokenList, chainConfig.chainId);
    }
  }, [isEvmConnected, evmAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  async function switchChain(key: SwapChainKey) {
    const newList = key === "ethereum" ? ETH_TOKENS : key === "base" ? BASE_TOKENS : ARB_TOKENS;
    const newCfg = SWAP_CHAINS.find(c => c.key === key)!;
    switchingRef.current = true;
    setSwapChain(key);
    setFromToken(newList[0]);
    setToToken(newList[1]);
    setFromAmount(""); setToAmount(""); setQuote(null); setQuoteError(null);
    setSwapError(null); setStage("idle"); setBalances({});
    setShowChainDrop(false);
    if (isEvmConnected && evmAddress) {
      try {
        await switchToChainById(newCfg.chainId);
        switchingRef.current = false;
        await loadBalances(newList, newCfg.chainId);
      } catch { switchingRef.current = false; }
    } else { switchingRef.current = false; }
  }

  function getTokenBalance(token: TokenState): number | null {
    if (!isEvmConnected || !evmAddress) return null;
    return balances[token.address] ?? null;
  }

  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setQuote(null); setToAmount(""); setQuoteError(null); return;
    }
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(doFetchQuote, 600);
    return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current); };
  }, [fromAmount, fromToken, toToken, swapChain]);

  async function doFetchQuote() {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    setQuoting(true); setQuoteError(null);
    try {
      const amountIn = toAtomicUnits(fromAmount, fromToken.decimals);
      const q = await getQuote(fromToken.address, toToken.address, amountIn, chainConfig.chainId);
      setQuote(q);
      const outAmount = q.dstAmount || q.toAmount || "0";
      const outNum = parseFloat(outAmount) / 10 ** toToken.decimals;
      setToAmount(outNum > 0 ? outNum.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "");
    } catch (e: unknown) {
      setQuoteError(e instanceof Error ? e.message : "Quote failed");
      setToAmount(""); setQuote(null);
    } finally { setQuoting(false); }
  }

  function flipTokens() {
    setFlipAnim(true); setPanelAnim("out");
    setTimeout(() => {
      setFromToken(toToken); setToToken(fromToken);
      setFromAmount(toAmount.replace(/,/g, "")); setToAmount(""); setQuote(null);
      setPanelAnim("in");
    }, 180);
    setTimeout(() => { setFlipAnim(false); setPanelAnim("idle"); }, 400);
  }

  function setMax() {
    const bal = getTokenBalance(fromToken);
    if (bal == null) return;
    const isNative = fromToken.address.toLowerCase() === NATIVE_ETH.toLowerCase();
    const effective = isNative ? Math.max(0, bal - 0.002) : bal;
    setFromAmount(effective > 0 ? effective.toString() : "");
  }

  function handleSelectToken(token: { symbol: string; address?: string; decimals?: number; logoURI?: string; name?: string }) {
    const resolved: TokenState = {
      symbol: token.symbol, name: token.name || token.symbol,
      address: token.address || "", decimals: token.decimals ?? 18, logoURI: token.logoURI,
    };
    if (showSelector === "from") {
      if (resolved.address === toToken.address) setToToken(fromToken);
      setFromToken(resolved);
    } else {
      if (resolved.address === fromToken.address) setFromToken(toToken);
      setToToken(resolved);
    }
    setShowSelector(null); setQuote(null); setToAmount("");
  }

  async function executeSwap() {
    if (!quote || !evmAddress || !isEvmConnected) return;
    setSwapError(null);
    const isOnCorrectChain = evmChainId === chainConfig.chainId;
    if (!isOnCorrectChain) {
      setStage("switching");
      try { await switchToChainById(chainConfig.chainId); }
      catch { setSwapError(`Please switch to ${chainConfig.label} in your wallet.`); setStage("error"); return; }
    }
    setStage("signing");
    try {
      const amountIn = toAtomicUnits(fromAmount, fromToken.decimals);
      const swapData = await getSwapData(fromToken.address, toToken.address, amountIn, evmAddress, slippage.toString(), chainConfig.chainId);
      const provider = await getEvmProvider();
      if (!provider) throw new Error("No wallet provider found");
      const { ethers } = await import("ethers");
      const browserProvider = new ethers.BrowserProvider(provider as never);
      const signer = await browserProvider.getSigner();
      const isNative = fromToken.address.toLowerCase() === NATIVE_ETH.toLowerCase();
      if (!isNative) {
        setStage("approving");
        const erc20 = new ethers.Contract(fromToken.address, [
          "function allowance(address,address) view returns (uint256)",
          "function approve(address,uint256) returns (bool)",
        ], signer);
        const allowance = await erc20.allowance(evmAddress, swapData.tx.to);
        if (BigInt(allowance.toString()) < BigInt(amountIn)) {
          const approveTx = await erc20.approve(swapData.tx.to, ethers.MaxUint256);
          await approveTx.wait();
        }
      }
      setStage("signing");
      const tx = await signer.sendTransaction({
        to: swapData.tx.to, data: swapData.tx.data,
        value: swapData.tx.value || "0",
        ...(swapData.tx.gas ? { gasLimit: BigInt(swapData.tx.gas) } : {}),
      });
      const receipt = await tx.wait();
      if (receipt && receipt.status === 1) {
        setTxHash(tx.hash); setStage("done"); onComplete?.();
      } else { throw new Error("Transaction reverted"); }
      loadBalances(tokenList, chainConfig.chainId);
      setTimeout(() => loadBalances(tokenList, chainConfig.chainId), 4000);
      setTimeout(() => loadBalances(tokenList, chainConfig.chainId), 10000);
      setTimeout(() => loadBalances(tokenList, chainConfig.chainId), 20000);
    } catch (e: unknown) {
      let msg = e instanceof Error ? e.message : "Swap failed";
      if (msg.includes("user rejected") || msg.includes("User rejected") || msg.includes("denied")) msg = "Transaction was rejected.";
      else if (msg.includes("insufficient")) msg = "Insufficient funds for gas.";
      setSwapError(msg); setStage("error");
    }
  }

  const numFrom = parseFloat(fromAmount) || 0;
  const toAmountNum = parseFloat(toAmount.replace(/,/g, "")) || 0;
  const fromBal = getTokenBalance(fromToken);
  const insufficientBal = fromBal != null && numFrom > 0 && numFrom > fromBal;
  const isOnCorrectChain = evmChainId === chainConfig.chainId;
  const canSwap = !!quote && isEvmConnected && !insufficientBal && stage === "idle";
  const isBusy = ["switching", "signing", "approving"].includes(stage);
  const rate = numFrom > 0 && toAmountNum > 0
    ? (toAmountNum / numFrom).toLocaleString(undefined, { maximumFractionDigits: 6 }) : null;

  function ctaText(): string {
    if (!isEvmConnected) return "Connect Wallet";
    if (stage === "switching") return `Switching to ${chainConfig.label}...`;
    if (stage === "approving") return "Approving token...";
    if (stage === "signing") return "Confirm in wallet...";
    if (!isOnCorrectChain) return `Switch to ${chainConfig.label}`;
    if (insufficientBal) return `Insufficient ${fromToken.symbol}`;
    if (!fromAmount || numFrom <= 0) return "Enter an amount";
    if (quoting) return "Finding best route...";
    if (!quote) return "No route found";
    return "Swap";
  }

  function handleMainAction() {
    if (!isEvmConnected) { connectEvm(); return; }
    if (!isOnCorrectChain) { switchToChainById(chainConfig.chainId); return; }
    if (isBusy) return;
    executeSwap();
  }

  if (stage === "done" && txHash) {
    return (
      <SuccessView
        fromSymbol={fromToken.symbol} toSymbol={toToken.symbol}
        fromAmt={fromAmount} toAmt={toAmount}
        txLink={`${chainConfig.explorer}/tx/${txHash}`}
        onNew={() => {
          setStage("idle"); setTxHash(null); setFromAmount(""); setToAmount(""); setQuote(null); setSwapError(null);
          loadBalances(tokenList, chainConfig.chainId);
        }}
      />
    );
  }

  const ctaActive = canSwap || !isEvmConnected || !isOnCorrectChain;
  const ctaBg    = ctaActive ? ORANGE : "#1A1C22";
  const ctaColor = ctaActive ? "#fff"  : "#3A4050";

  return (
    <>
      <style>{`
        .swp-input { -moz-appearance: textfield; }
        .swp-input::-webkit-inner-spin-button,
        .swp-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .swp-input:focus { outline: none; }
        .swp-input::placeholder { color: #373D4A !important; }
      `}</style>

      {/* ── Chain + Slippage — single compact row ───────────── */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {/* Chain pill */}
        <button
          data-testid="button-chain-dropdown"
          onClick={() => setShowChainDrop(v => !v)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "6px 12px 6px 8px", borderRadius: 10,
            background: CARD, border: `1px solid ${BORDER}`,
            cursor: "pointer", transition: "border-color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#353840"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
        >
          <img src={chainConfig.logo} alt={chainConfig.label}
            style={{ width: 16, height: 16, borderRadius: "50%" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: BRIGHT, fontFamily: SANS }}>{chainConfig.label}</span>
          <ChevronDown size={13} color={LABEL}
            style={{ transform: showChainDrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          />
        </button>

        {/* Slippage pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: LABEL, fontFamily: SANS }}>
            Slippage: <span style={{ color: ORANGE, fontWeight: 600 }}>{slippage}%</span>
          </span>
          <button data-testid="button-slippage-toggle" onClick={() => setShowSlippage(s => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: LABEL, padding: 2 }}>
            <Settings2 size={13} />
          </button>
        </div>

        {/* Chain dropdown */}
        {showChainDrop && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50, minWidth: 160,
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
            overflow: "hidden",
          }}>
            {SWAP_CHAINS.map(c => {
              const active = swapChain === c.key;
              return (
                <button
                  key={c.key}
                  data-testid={`button-chain-${c.key}`}
                  onClick={() => switchChain(c.key)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", border: "none",
                    background: active ? "rgba(212,165,116,0.08)" : "transparent",
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src={c.logo} alt={c.label} style={{ width: 16, height: 16, borderRadius: "50%" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? ORANGE : BRIGHT, fontFamily: SANS }}>{c.label}</span>
                  </div>
                  {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: ORANGE }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showSlippage && (
        <div style={{ display: "flex", gap: 5, marginBottom: 12, padding: "10px 12px", background: CARD, borderRadius: 12, border: `1px solid ${BORDER}` }}>
          {SLIPPAGE_PRESETS.map(p => (
            <button key={p} data-testid={`button-slippage-${p}`} onClick={() => setSlippage(p)}
              style={{
                flex: 1, padding: "6px 0", borderRadius: 8, border: "none",
                background: slippage === p ? ORANGE : "rgba(255,255,255,0.04)",
                color: slippage === p ? "#fff" : LABEL,
                fontSize: 11, fontWeight: 600, fontFamily: MONO, cursor: "pointer",
              }}>
              {p}%
            </button>
          ))}
        </div>
      )}

      {/* ── FROM panel ────────────────────────────────────── */}
      <div style={{
        transform: panelAnim === "out" ? "translateY(10px) scale(0.98)" : panelAnim === "in" ? "translateY(-5px)" : "translateY(0)",
        opacity: panelAnim === "out" ? 0.35 : 1,
        transition: panelAnim === "out" ? "transform 0.18s ease-in, opacity 0.18s ease-in" : "transform 0.22s ease-out, opacity 0.22s ease-out",
      }}>
        <TokenPanel
          label="You pay"
          token={fromToken} amount={fromAmount}
          balance={fromBal} loading={loadingBal} disabled={isBusy}
          onAmountChange={(v) => { if (v.split(".").length <= 2) setFromAmount(v); }}
          onSelectToken={() => setShowSelector("from")}
          onSetMax={setMax}
          testIdPrefix="from"
        />
      </div>

      {/* ── Flip button (overlapping) ─────────────────────── */}
      <div style={{ display: "flex", justifyContent: "center", margin: "-10px 0", position: "relative", zIndex: 10 }}>
        <button
          data-testid="button-flip-tokens"
          onClick={flipTokens} disabled={isBusy}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: ORANGE, border: `3px solid #000`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            transform: flipAnim ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            outline: "none", boxShadow: "0 2px 12px rgba(212,165,116,0.4)",
          }}
        >
          <ArrowDownUp size={16} color="#fff" />
        </button>
      </div>

      {/* ── TO panel ─────────────────────────────────────── */}
      <div style={{
        transform: panelAnim === "out" ? "translateY(-10px) scale(0.98)" : panelAnim === "in" ? "translateY(5px)" : "translateY(0)",
        opacity: panelAnim === "out" ? 0.35 : 1,
        transition: panelAnim === "out" ? "transform 0.18s ease-in, opacity 0.18s ease-in" : "transform 0.22s ease-out, opacity 0.22s ease-out",
      }}>
        <TokenPanel
          label="You receive"
          token={toToken} amount={toAmount}
          balance={getTokenBalance(toToken)} loading={quoting}
          readOnly disabled
          onSelectToken={() => setShowSelector("to")}
          testIdPrefix="to"
        />
      </div>

      {/* ── Rate row ─────────────────────────────────────── */}
      {rate && !quoteError && (
        <div style={{ margin: "10px 0 0", padding: "8px 14px", borderRadius: 10, background: CARD, border: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: LABEL, fontFamily: MONO }}>
            1 {fromToken.symbol} = {rate} {toToken.symbol}
          </span>
          <span style={{ fontSize: 10, color: "#33FF8870", fontFamily: MONO }}>{chainConfig.label} · 1inch</span>
        </div>
      )}
      {quoteError && (
        <div style={{ fontSize: 11, color: "#FF6B6B", fontFamily: MONO, marginTop: 10, padding: "8px 12px", background: "rgba(255,107,107,0.06)", borderRadius: 10, border: "1px solid rgba(255,107,107,0.12)" }}>
          {quoteError}
        </div>
      )}
      {swapError && (
        <div style={{ fontSize: 11, color: "#FF6B6B", fontFamily: MONO, marginTop: 8, padding: "8px 12px", background: "rgba(255,107,107,0.06)", borderRadius: 10, border: "1px solid rgba(255,107,107,0.12)" }}>
          {swapError}
        </div>
      )}

      {/* ── CTA ──────────────────────────────────────────── */}
      <button
        data-testid="button-swap-cta"
        onClick={handleMainAction}
        disabled={isBusy || (isEvmConnected && isOnCorrectChain && !canSwap && !insufficientBal)}
        style={{
          width: "100%", padding: "16px", marginTop: 12, borderRadius: 16,
          background: ctaBg, border: "none", color: ctaColor,
          fontSize: 15, fontWeight: 700, fontFamily: SANS,
          cursor: ctaActive ? "pointer" : "default",
          transition: "background 0.2s, opacity 0.2s",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={e => { if (ctaActive) e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        {ctaText()}
      </button>

      {showSelector !== null && (
        <TokenSelectorModal
          isEvm
          tokens={tokenList}
          excludeMint={showSelector === "from" ? toToken.address : fromToken.address}
          onSelect={handleSelectToken}
          onClose={() => setShowSelector(null)}
        />
      )}
    </>
  );
}
