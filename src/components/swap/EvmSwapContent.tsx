"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ethers, formatUnits } from "ethers";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { MONO, SANS, SWAP_CHAINS, fetchTokenList, getFallbackTokens, preloadAllTokens, FUSION_PRESET_OPTIONS, type FusionPreset, type TokenState, type SwapChainKey, CARD, BORDER, LABEL, DIM, BRIGHT, ORANGE, CARD_SHADOW } from "./swapConstants";
import { SuccessView } from "./SwapShared";
import TokenSelectorModal from "./TokenSelectorModal";
import { SwapPreviewModal } from "./SwapPreviewModal";
import { Settings2, ChevronDown, ArrowDownUp } from "lucide-react";



const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

function toAtomicUnits(amount: string, decimals: number): string {
  const [whole = "0", frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  const raw = (whole + paddedFrac).replace(/^0+/, "") || "0";
  return raw;
}

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
            loading ? (
              <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: ORANGE,
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: ORANGE,
                  animation: "pulse 1.5s ease-in-out 0.2s infinite",
                }} />
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: ORANGE,
                  animation: "pulse 1.5s ease-in-out 0.4s infinite",
                }} />
              </div>
            ) : (
              <span style={{
                fontSize: 32, fontWeight: 300, fontFamily: MONO, letterSpacing: "-0.03em",
                color: hasAmount ? "#9BA4AE" : DIM,
              }}>
                {hasAmount ? amount : "0.00"}
              </span>
            )
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

export function EvmSwapContent({ onComplete }: { onComplete?: () => void }) {
  const { evmAddress, isEvmConnected, evmChainId, connectEvm, switchToChainById, getEvmSigner } = useEvmWallet();

  const [swapChain, setSwapChain] = useState<SwapChainKey>("arbitrum");
  const chainConfig = SWAP_CHAINS.find(c => c.key === swapChain)!;
  const [tokenList, setTokenList] = useState<TokenState[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  const [fromToken, setFromToken] = useState<TokenState | null>(null);
  const [toToken, setToToken] = useState<TokenState | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteTimer = useRef<NodeJS.Timeout | null>(null);

  const [preset, setPreset] = useState<FusionPreset>("fast");
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [showChainDrop, setShowChainDrop] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBal] = useState(false);
  const [stage, setStage] = useState<"idle" | "switching" | "signing" | "done" | "error" | "approving" | "approving-wallet">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState<"from" | "to" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [flipAnim, setFlipAnim] = useState(false);
  const [panelAnim, setPanelAnim] = useState<"idle" | "out" | "in">("idle");
  const switchingRef = useRef(false);
  const balanceFetchCache = useRef<Map<string, Promise<number | null>>>(new Map());
  const [swapProgress, setSwapProgress] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    preloadAllTokens();
  }, []);

  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  const loadBalances = useCallback(async () => {
    if (!evmAddress || !isEvmConnected) return;
  }, [evmAddress, isEvmConnected]);

  const fetchTokenBalance = useCallback(async (token: TokenState) => {
    if (!evmAddress || !isEvmConnected) return null;

    const cacheKey = `${chainConfig.chainId}:${token.address}:${evmAddress}`;
    
    if (balanceFetchCache.current.has(cacheKey)) {
      return balanceFetchCache.current.get(cacheKey)!;
    }

    const fetchPromise = (async () => {
      try {
        const response = await fetch('/api/swap/oneinch/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAddress: token.address,
            walletAddress: evmAddress,
            chainId: chainConfig.chainId,
          })
        });

        if (!response.ok) {
          throw new Error(`Balance API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Balance fetch failed');
        }

        const rawBalance = data.balance;
        const balance = parseFloat(ethers.formatUnits(rawBalance, token.decimals));
        setBalances(prev => ({ ...prev, [token.address.toLowerCase()]: balance }));
        return balance;
      } catch (e) {
        setBalances(prev => ({ ...prev, [token.address.toLowerCase()]: 0 }));
        return null;
      } finally {
        balanceFetchCache.current.delete(cacheKey);
      }
    })();

    balanceFetchCache.current.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, [evmAddress, isEvmConnected, chainConfig.chainId]);

  useEffect(() => {
    if (isEvmConnected && evmAddress && !switchingRef.current) {
      loadBalances();
    }
  }, [isEvmConnected, evmAddress, chainConfig.chainId, loadBalances]);

  useEffect(() => {
    if (fromToken && isEvmConnected && evmAddress) {
      fetchTokenBalance(fromToken);
    }
  }, [fromToken, isEvmConnected, evmAddress, fetchTokenBalance]);

  useEffect(() => {
    if (toToken && isEvmConnected && evmAddress) {
      fetchTokenBalance(toToken);
    }
  }, [toToken, isEvmConnected, evmAddress, fetchTokenBalance]);

  useEffect(() => {
    async function loadTokens() {
      setLoadingTokens(true);
      
      const fallback = getFallbackTokens(chainConfig.chainId);
      setTokenList(fallback);
      setFromToken(prev => prev || fallback[0]);
      setToToken(prev => prev || fallback[1]);
      setLoadingTokens(false);
      
      try {
        const tokens = await fetchTokenList(chainConfig.chainId);
        
        if (tokens && tokens.length > 0) {
          setTokenList(tokens);
          
          if (fromToken) {
            const updatedFrom = tokens.find(t => t.address.toLowerCase() === fromToken.address.toLowerCase());
            if (updatedFrom) setFromToken(updatedFrom);
          }
          if (toToken) {
            const updatedTo = tokens.find(t => t.address.toLowerCase() === toToken.address.toLowerCase());
            if (updatedTo) setToToken(updatedTo);
          }
        }
      } catch (error) {
      }
    }
    
    loadTokens();
  }, [chainConfig.chainId]);

  async function switchChain(key: SwapChainKey) {
    const newCfg = SWAP_CHAINS.find(c => c.key === key)!;
    switchingRef.current = true;
    setSwapChain(key);
    setFromToken(null);
    setToToken(null);
    setFromAmount(""); setToAmount(""); setQuoteError(null);
    setStage("idle"); setBalances({});
    setShowChainDrop(false);
    if (isEvmConnected && evmAddress) {
      try {
        await switchToChainById(newCfg.chainId);
        switchingRef.current = false;
      } catch { switchingRef.current = false; }
    } else { switchingRef.current = false; }
  }

  function getTokenBalance(token: TokenState | null): number | null {
    if (!isEvmConnected || !evmAddress || !token) return null;
    return balances[token.address.toLowerCase()] ?? null;
  }

  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken) {
      setQuote(null); setToAmount(""); setQuoteError(null); return;
    }
    setSwapError(null);
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(doFetchQuote, 300);
    return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current); };
  }, [fromAmount, fromToken, toToken, swapChain, preset]);

  async function doFetchQuote() {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !evmAddress) return;
    
    if (fromToken.address.toLowerCase() === toToken.address.toLowerCase()) {
      setQuoteError("Cannot swap same token");
      setToAmount(""); 
      setQuote(null);
      return;
    }
    
    setQuoting(true); setQuoteError(null);
    
    try {
      const response = await fetch('/api/swap/oneinch/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          amount: toAtomicUnits(fromAmount, fromToken.decimals),
          walletAddress: evmAddress,
          chainId: chainConfig.chainId,
          preset: preset,
        })
      });

      const quoteData = await response.json();
      
      if (!response.ok || !quoteData.success) {
        const errorMsg = quoteData.error || quoteData.details || 'Unable to get quote';
        throw new Error(errorMsg);
      }

      setQuote(quoteData);
      const outputAmount = formatUnits(quoteData.auctionEndAmount, toToken.decimals);
      setToAmount(parseFloat(outputAmount).toLocaleString(undefined, { maximumFractionDigits: 6 }));
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Quote failed";
      setQuoteError(errMsg);
      setToAmount(""); setQuote(null);
    } finally { setQuoting(false); }
  }

  function flipTokens() {
    if (!fromToken || !toToken) return;
    setFlipAnim(true); setPanelAnim("out");
    setTimeout(() => {
      setFromToken(toToken); setToToken(fromToken);
      setFromAmount(toAmount.replace(/,/g, "")); setToAmount("");
      setPanelAnim("in");
    }, 180);
    setTimeout(() => { setFlipAnim(false); setPanelAnim("idle"); }, 400);
  }

  function setMax() {
    if (!fromToken) return;
    const bal = getTokenBalance(fromToken);
    if (bal == null) return;
    const isNative = fromToken.address.toLowerCase() === NATIVE_ETH.toLowerCase();
    const effective = isNative ? Math.max(0, bal - 0.002) : bal * 0.995;
    setFromAmount(effective > 0 ? effective.toString() : "");
  }

  function handleSelectToken(token: { symbol: string; address?: string; decimals?: number; logoURI?: string; name?: string }) {
    const resolved: TokenState = {
      symbol: token.symbol, name: token.name || token.symbol,
      address: token.address || "", decimals: token.decimals ?? 18, logoURI: token.logoURI,
    };
    
    if (showSelector === "from") {
      if (resolved.address.toLowerCase() === toToken?.address.toLowerCase()) {
        setToToken(fromToken);
      }
      setFromToken(resolved);
    } else {
      if (resolved.address.toLowerCase() === fromToken?.address.toLowerCase()) {
        setFromToken(toToken);
      }
      setToToken(resolved);
    }
    setShowSelector(null); setToAmount("");
  }

  async function handleSwapExecution() {
    if (!quote || !evmAddress || !isEvmConnected || !fromToken || !toToken) return;
    
    const isOnCorrectChain = evmChainId === chainConfig.chainId;
    if (!isOnCorrectChain) {
      setStage("switching");
      try { 
        await switchToChainById(chainConfig.chainId); 
      } catch { 
        setStage("error"); 
        return; 
      }
    }

    setStage("approving");
    setSwapProgress("Checking token approval...");
    
    try {
      const signer = await getEvmSigner();
      if (!signer) throw new Error("Signer not available");

      const atomicAmount = toAtomicUnits(fromAmount, fromToken.decimals);
      const ALLOWANCE_ABI = ["function allowance(address owner, address spender) view returns (uint256)"];
      const APPROVE_ABI   = ["function approve(address spender, uint256 amount) returns (bool)"];
      const ROUTER_ADDR   = "0x111111125421ca6dc452d289314280a0f8842a65";
      const MAX_UINT256   = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

      setSwapProgress("Preparing order...");
      const orderCreationPromise = fetch('/api/swap/oneinch/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromTokenAddress: fromToken.address,
          toTokenAddress: toToken.address,
          amount: atomicAmount,
          walletAddress: evmAddress,
          chainId: chainConfig.chainId,
          preset: preset,
        })
      });

      const tokenRead = new ethers.Contract(fromToken.address, ALLOWANCE_ABI, signer.provider);
      const currentAllowance = await tokenRead.allowance(evmAddress, ROUTER_ADDR);
      const needsApproval = BigInt(currentAllowance.toString()) < BigInt(atomicAmount);

      let approvalTxPromise: Promise<any> | null = null;

      if (needsApproval) {
        setStage("approving-wallet");
        setSwapProgress("Approve token in your wallet...");
        const tokenContract = new ethers.Contract(fromToken.address, APPROVE_ABI, signer);
        const tx = await tokenContract.approve(ROUTER_ADDR, MAX_UINT256);
        
        approvalTxPromise = tx.wait();
        setSwapProgress("Approval mining...");
      }

      setStage("signing");
      setSwapProgress("Finalizing order...");
      const createOrderResponse = await orderCreationPromise;
      
      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.error || 'Create order failed');
      }
      const preparedOrder = await createOrderResponse.json();
      if (!preparedOrder.success) throw new Error(preparedOrder.error || 'Create order failed');

      if (approvalTxPromise) {
        setSwapProgress("Waiting for approval confirmation...");
        await approvalTxPromise;
      }

      setSwapProgress("Sign order in your wallet...");

      const { domain, types, message } = preparedOrder.typedData;
      const { EIP712Domain: _eip712, ...signingTypes } = types;
      
      const signature = await signer.signTypedData(domain, signingTypes, message);

      setSwapProgress("Submitting order...");
      const submitResponse = await fetch('/api/swap/oneinch/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: preparedOrder.quoteId,
          signature,
        })
      });

      if (!submitResponse.ok) {
        throw new Error(`Submit order failed: ${submitResponse.status}`);
      }
      
      const submitData = await submitResponse.json();
      if (!submitData.success) throw new Error(submitData.error || 'Submit order failed');

      setTxHash(submitData.orderHash);
      setSwapProgress("Waiting for order to be filled...");

      setCountdown(0);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => prev + 1);
      }, 1000);

      let isCompleted = false;
      const maxAttempts = 120;
      let attempts = 0;

      while (!isCompleted && attempts < maxAttempts) {
        const delay = attempts < 10 ? 1000 : attempts < 30 ? 2000 : 3000;
        await new Promise(r => setTimeout(r, delay));
        
        const statusResponse = await fetch(`/api/swap/oneinch/order-status?orderHash=${submitData.orderHash}&chainId=${chainConfig.chainId}`);
        const statusData = await statusResponse.json();

        if (statusData.success) {
          if (statusData.isCompleted) {
            isCompleted = true;
            if (statusData.fills && statusData.fills.length > 0) {
              const actualTxHash = statusData.fills[0].txHash;
              setTxHash(actualTxHash);
            }
            setStage("done");
          } else if (statusData.isExpired || statusData.isCancelled) {
            throw new Error(`Order ${statusData.isExpired ? 'expired' : 'cancelled'}`);
          }
        }
        
        attempts++;
      }

      if (!isCompleted) {
        throw new Error("Order timeout - taking longer than expected");
      }

      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      setCountdown(0);
      setSwapProgress("");
      onComplete?.();
      loadBalances();
    } catch (e: unknown) {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      setCountdown(0);
      setSwapProgress("");
      let msg = e instanceof Error ? e.message : "Swap failed";
      if (msg.includes("user rejected") || msg.includes("User rejected") || msg.includes("denied")) {
        msg = "Transaction was rejected";
      } else if (msg.includes("insufficient funds") || msg.includes("insufficient gas")) {
        msg = "Insufficient funds for gas";
      }
      setSwapError(msg);
      setStage("idle");
      setShowPreview(false);
    }
  }

  const numFrom = parseFloat(fromAmount) || 0;
  const toAmountNum = parseFloat(toAmount.replace(/,/g, "")) || 0;
  const fromBal = getTokenBalance(fromToken);
  const insufficientBal = fromBal != null && numFrom > 0 && numFrom > fromBal;
  const isOnCorrectChain = evmChainId === chainConfig.chainId;
  const canSwap = !!quote && isEvmConnected && !insufficientBal && stage === "idle" && fromToken && toToken;
  const isBusy = ["switching", "signing", "approving", "approving-wallet"].includes(stage);
  const rate = numFrom > 0 && toAmountNum > 0 && fromToken && toToken
    ? (toAmountNum / numFrom).toLocaleString(undefined, { maximumFractionDigits: 6 }) : null;

  function ctaText(): string {
    if (!isEvmConnected) return "Connect Wallet";
    if (stage === "switching") return `Switching to ${chainConfig.label}...`;
    if (stage === "approving") return "Preparing swap...";
    if (stage === "approving-wallet") return "Approve in wallet...";
    if (stage === "signing") return "Sign in wallet...";
    if (loadingTokens) return "Loading tokens...";
    if (!fromToken || !toToken) return "Select tokens";
    if (!isOnCorrectChain) return `Switch to ${chainConfig.label}`;
    if (insufficientBal && fromToken) return `Insufficient ${fromToken.symbol}`;
    if (!fromAmount || numFrom <= 0) return "Enter an amount";
    if (quoting) return "Finding best route...";
    if (quoteError) {
      if (quoteError.toLowerCase().includes("amount too small") || quoteError.toLowerCase().includes("insufficient amount")) {
        return "Amount too small";
      }
      if (quoteError.toLowerCase().includes("liquidity")) {
        return "Insufficient liquidity";
      }
      return "No route found";
    }
    if (!quote) return "No route found";
    return "Review";
  }

  function handleMainAction() {
    if (!isEvmConnected) { connectEvm(); return; }
    if (!isOnCorrectChain) { switchToChainById(chainConfig.chainId); return; }
    if (isBusy) return;
    
    if (insufficientBal && fromToken) {
      setSwapError(`Insufficient ${fromToken.symbol} balance`);
      return;
    }
    
    if (canSwap) { setShowPreview(true); return; }
    handleSwapExecution();
  }

  if (stage === "done" && txHash && fromToken && toToken) {
    return (
      <SuccessView
        fromSymbol={fromToken.symbol} toSymbol={toToken.symbol}
        fromAmt={fromAmount} toAmt={toAmount}
        txLink={`${chainConfig.explorer}/tx/${txHash}`}
        onNew={() => {
          setStage("idle"); setFromAmount(""); setToAmount("");
          loadBalances();
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
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: LABEL, fontFamily: SANS }}>
            Speed: <span style={{ color: ORANGE, fontWeight: 600, textTransform: "capitalize" }}>{preset}</span>
          </span>
          <button data-testid="button-preset-toggle" onClick={() => setShowPresetSelector(s => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: LABEL, padding: 2 }}>
            <Settings2 size={13} />
          </button>
        </div>

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

      {showPresetSelector && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, padding: "10px 12px", background: CARD, borderRadius: 12, border: `1px solid ${BORDER}` }}>
          {FUSION_PRESET_OPTIONS.map(p => (
            <button 
              key={p.key} 
              data-testid={`button-preset-${p.key}`} 
              onClick={() => { setPreset(p.key); setShowPresetSelector(false); }}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px", 
                borderRadius: 8, 
                border: "none",
                background: preset === p.key ? "rgba(212,165,116,0.12)" : "rgba(255,255,255,0.04)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (preset !== p.key) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { if (preset !== p.key) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: preset === p.key ? ORANGE : BRIGHT, fontFamily: SANS }}>
                  {p.label}
                </span>
                <span style={{ fontSize: 10, color: LABEL, fontFamily: MONO }}>
                  {p.description}
                </span>
              </div>
              {preset === p.key && (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ORANGE }} />
              )}
            </button>
          ))}
        </div>
      )}

      <div style={{
        transform: panelAnim === "out" ? "translateY(10px) scale(0.98)" : panelAnim === "in" ? "translateY(-5px)" : "translateY(0)",
        opacity: panelAnim === "out" ? 0.35 : 1,
        transition: panelAnim === "out" ? "transform 0.18s ease-in, opacity 0.18s ease-in" : "transform 0.22s ease-out, opacity 0.22s ease-out",
      }}>
        {fromToken && (
          <TokenPanel
            label="You pay"
            token={fromToken} amount={fromAmount}
            balance={fromBal} loading={loadingBal} disabled={isBusy}
            onAmountChange={(v) => { if (v.split(".").length <= 2) setFromAmount(v); }}
            onSelectToken={() => setShowSelector("from")}
            onSetMax={setMax}
            testIdPrefix="from"
          />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "-10px 0", position: "relative", zIndex: 10 }}>
        <button
          data-testid="button-flip-tokens"
          onClick={flipTokens} disabled={isBusy || !fromToken || !toToken}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: ORANGE, border: `3px solid #000`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            transform: flipAnim ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            outline: "none", boxShadow: "0 2px 12px rgba(212,165,116,0.4)",
            opacity: (!fromToken || !toToken) ? 0.5 : 1,
          }}
        >
          <ArrowDownUp size={16} color="#fff" />
        </button>
      </div>

      <div style={{
        transform: panelAnim === "out" ? "translateY(-10px) scale(0.98)" : panelAnim === "in" ? "translateY(5px)" : "translateY(0)",
        opacity: panelAnim === "out" ? 0.35 : 1,
        transition: panelAnim === "out" ? "transform 0.18s ease-in, opacity 0.18s ease-in" : "transform 0.22s ease-out, opacity 0.22s ease-out",
      }}>
        {toToken && (
          <TokenPanel
            label="You receive"
            token={toToken} amount={toAmount}
            balance={getTokenBalance(toToken)} loading={quoting}
            readOnly disabled
            onSelectToken={() => setShowSelector("to")}
            testIdPrefix="to"
          />
        )}
      </div>

      {quoting && !quoteError && fromToken && toToken && (
        <div style={{ margin: "10px 0 0", padding: "8px 14px", borderRadius: 10, background: CARD, border: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: LABEL, fontFamily: MONO }}>
            Finding best route...
          </span>
          <div style={{ display: "flex", gap: 3 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out 0.2s infinite" }} />
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out 0.4s infinite" }} />
          </div>
        </div>
      )}
      {rate && !quoteError && !quoting && fromToken && toToken && (
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
      
      {/* Progress indicator during swap */}
      {swapProgress && isBusy && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: ORANGE, fontFamily: MONO, padding: "8px 12px", background: "rgba(212,165,116,0.06)", borderRadius: 10, border: "1px solid rgba(212,165,116,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 3 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out 0.2s infinite" }} />
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out 0.4s infinite" }} />
              </div>
              <span>{swapProgress}</span>
            </div>
            {countdown > 0 && (
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                color: ORANGE, 
                fontFamily: MONO,
                minWidth: 40,
                textAlign: "right"
              }}>
                {countdown}s
              </div>
            )}
          </div>
          {/* Progress bar for countdown */}
          {countdown > 0 && (
            <div style={{ 
              marginTop: 6, 
              height: 3, 
              background: "rgba(212,165,116,0.1)", 
              borderRadius: 2, 
              overflow: "hidden" 
            }}>
              <div style={{ 
                height: "100%", 
                background: ORANGE,
                width: `${Math.min((countdown / 30) * 100, 100)}%`,
                transition: "width 1s linear",
                borderRadius: 2
              }} />
            </div>
          )}
        </div>
      )}
      
      <button
        data-testid="button-swap-cta"
        onClick={handleMainAction}
        disabled={isBusy || (isEvmConnected && isOnCorrectChain && !canSwap && !insufficientBal && !!fromAmount && parseFloat(fromAmount) > 0)}
        style={{
          width: "100%", padding: "16px", marginTop: 12, borderRadius: 16,
          background: ctaBg, border: "none", color: ctaColor,
          fontSize: 15, fontWeight: 700, fontFamily: SANS,
          cursor: (ctaActive || insufficientBal) ? "pointer" : "default",
          transition: "background 0.2s, opacity 0.2s",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={e => { if (ctaActive || insufficientBal) e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
      >
        {ctaText()}
      </button>

      {showSelector !== null && (
        <TokenSelectorModal
          tokens={tokenList}
          excludeMint={showSelector === "from" ? toToken?.address : fromToken?.address}
          onSelect={handleSelectToken}
          onClose={() => setShowSelector(null)}
        />
      )}

      {showPreview && fromToken && toToken && rate && (
        <SwapPreviewModal
          fromToken={fromToken}
          toToken={toToken}
          fromAmount={fromAmount}
          toAmount={toAmount}
          rate={rate}
          preset={preset}
          onConfirm={() => { setShowPreview(false); handleSwapExecution(); }}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
