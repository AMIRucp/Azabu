"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { MONO, SANS, SWAP_CHAINS, fetchTokenList, getFallbackTokens, preloadAllTokens, FUSION_PRESET_OPTIONS, type FusionPreset, type TokenState, type SwapChainKey, CARD, BORDER, LABEL, DIM, BRIGHT, ORANGE, CARD_SHADOW } from "./swapConstants";
import { fetchBridgeTokensForChain } from "@/lib/fetchBridgeTokens";
import { sanitizeTokenSymbol } from "@/lib/oneinchTokenList";
import {
  executeFusionPlusBridge,
  fetchFusionPlusQuote,
  formatBridgeReceiveAmount,
  type FusionPlusBridgeQuote,
} from "@/lib/fusionPlusBridgeClient";
import { SwapSuccessCard } from "./SwapSuccessCard";
import TokenSelectorModal from "./TokenSelectorModal";
import { Settings, SlidersHorizontal, Settings2, ChevronDown, ArrowDownUp, ArrowLeftRight } from "lucide-react";
import { toUserFacingError } from "@/lib/userFacingErrors";


const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

function toAtomicUnits(amount: string, decimals: number): string {
  const [whole = "0", frac = ""] = amount.split(".");
  const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
  const raw = (whole + paddedFrac).replace(/^0+/, "") || "0";
  return raw;
}

function normalizeTokenState(t: TokenState): TokenState {
  const symbol = sanitizeTokenSymbol(t.symbol);
  return {
    ...t,
    symbol,
    name: t.name?.replace(/\0/g, "").trim() || symbol,
  };
}

function TokenPanel({
  label, token, amount, balance, loading, readOnly, disabled,
  onAmountChange, onSelectToken, onSetMax, testIdPrefix, isMobile,
}: {
  label: string; token: TokenState; amount: string;
  balance: number | null; loading?: boolean; readOnly?: boolean; disabled?: boolean;
  onAmountChange?: (v: string) => void; onSelectToken: () => void;
  onSetMax?: () => void; testIdPrefix: string; isMobile: boolean;
}) {
  const balNum = balance != null
    ? balance.toLocaleString(undefined, { maximumFractionDigits: 6 })
    : null;
  const hasAmount = parseFloat(amount) > 0;

  return (
    <div className="token-panel" style={{ padding: "8px 18px 6px" }}>
      {/* "Sell" / "Buy" */}
      <div className="token-panel-label" style={{ fontSize: 14, fontWeight: 600, lineHeight: "14px", color: "#9CA3AF", fontFamily: SANS, marginBottom: 0, marginTop: 38 }}>{label}</div>

      {/* Token selector + Amount */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "0" }}>
        {/* Amount */}
        <div style={{ flex: 1, textAlign: "left", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 16 }}>
          {readOnly || loading ? (
            loading ? (
              <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out 0.2s infinite" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ORANGE, animation: "pulse 1.5s ease-in-out 0.4s infinite" }} />
              </div>
            ) : (
              <span style={{ fontSize: 28, fontWeight: 500, fontFamily: SANS, letterSpacing: "-0.03em", color: "#FFFFFF", lineHeight: "28px", display: "block" }}>
                {hasAmount ? amount : "0.00"}
              </span>
            )
          ) : (
            <input className="swp-input token-amount-input"
              data-testid={`input-${testIdPrefix}-amount`}
              type="text" inputMode="decimal" autoComplete="off"
              placeholder="0.00" disabled={disabled}
              value={amount}
              onChange={e => onAmountChange?.(e.target.value.replace(/[^0-9.]/g, ""))}
              style={{
                width: "100%", textAlign: "left",
                fontSize: 28, fontWeight: 500,
                fontFamily: SANS, letterSpacing: "-0.03em",
                color: "#FFFFFF", lineHeight: "28px",
                background: "transparent", border: "none", outline: "none", padding: 0,
                opacity: disabled ? 0.5 : 1,
              }}
            />
          )}
        </div>

        <button className="token-selector-btn"
          data-testid={`button-select-${testIdPrefix}-token`}
          onClick={onSelectToken}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            borderTopLeftRadius: 33,
            borderTopRightRadius: 33,
            borderBottomLeftRadius: 33,
            borderBottomRightRadius: 33,
            padding: "8px 12px",
            cursor: "pointer", transition: "background 0.15s",
            width: 60,
            height: 110,
            overflow: "hidden",
            justifyContent: "center",
            alignSelf: "center",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          {token.logoURI ? (
            <img src={token.logoURI} alt={token.symbol}
              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: DIM, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: LABEL, fontFamily: MONO }}>{token.symbol.slice(0, 2)}</span>
            </div>
          )}
          <span style={{ fontSize: 10, fontWeight: 400, color: BRIGHT, fontFamily: SANS, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", display: "block", textAlign: "center" }}>{token.symbol}</span>
          <ChevronDown size={12} color={LABEL} />
        </button>
      </div>

      {/* Balance row */}
      <div style={{ marginTop: -42 }}>
        <span className="balance-text" style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF", fontFamily: SANS, lineHeight: "16px" }}>
          Balance: {balNum ?? ""}
        </span>
        {onSetMax && (
          <div style={{ display: "flex", gap: 4, marginTop: 0 }}>
            {[25, 50, 75].map(pct => (
              <button className="pct-btn"
                key={pct}
                onClick={() => {
                  const bal = parseFloat(balNum?.replace(/,/g, "") ?? "0");
                  const val = (bal * pct) / 100;
                  onAmountChange?.(val > 0 ? val.toString() : "");
                }}
                style={{
                  padding: isMobile ? "0 5px" : "3px 10px", borderRadius: isMobile ? 5 : 36,
                  background: "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255,111,0,0.8) 0%, rgba(255,111,0,0.8) 39.48%, rgba(26,26,26,0.8) 100%)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
                  color: "#FFFFFF", fontSize: isMobile ? 7 : 12, fontWeight: 400,
                  lineHeight: isMobile ? "12px" : undefined,
                  fontFamily: SANS, cursor: "pointer",
                  minHeight: "unset",

                }}
              >
                {pct}%
              </button>
            ))}
            <button
              className="max-btn"
              data-testid={`button-max-${testIdPrefix}`}
              onClick={onSetMax}
              style={{
                padding: isMobile ? "0 5px" : "3px 10px",
                minHeight: "unset",
                height: isMobile ? 14 : undefined,
                minWidth: isMobile ? 28 : undefined,

                borderRadius: isMobile ? 5 : 20,

                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",

                color: ORANGE,
                fontSize: isMobile ? 7 : 11,
                fontWeight: 600,
                lineHeight: isMobile ? "12px" : undefined,

                fontFamily: SANS,
                cursor: "pointer",
              }}
            >
              MAX
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function EvmSwapContent({ onComplete }: { onComplete?: () => void }) {
  const { evmAddress, isEvmConnected, evmChainId, connectEvm, switchToChainById, getEvmSigner } = useEvmWallet();

  const [fromChainKey, setFromChainKey] = useState<SwapChainKey>("arbitrum");
  const [toChainKey, setToChainKey] = useState<SwapChainKey>("ethereum");
  const fromChainConfig = SWAP_CHAINS.find((c) => c.key === fromChainKey)!;
  const toChainConfig = SWAP_CHAINS.find((c) => c.key === toChainKey)!;
  const sameChain = fromChainConfig.chainId === toChainConfig.chainId;
  const [fromTokenList, setFromTokenList] = useState<TokenState[]>([]);
  const [toTokenList, setToTokenList] = useState<TokenState[]>([]);
  const [modalTokenList, setModalTokenList] = useState<TokenState[]>([]);
  const [modalTokensLoading, setModalTokensLoading] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const tokensByChainRef = useRef<Map<number, TokenState[]>>(new Map());

  const [fromToken, setFromToken] = useState<TokenState | null>(null);
  const [toToken, setToToken] = useState<TokenState | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [bridgeQuote, setBridgeQuote] = useState<FusionPlusBridgeQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteTimer = useRef<NodeJS.Timeout | null>(null);

  const [preset, setPreset] = useState<FusionPreset>("fast");
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadingBal] = useState(false);
  const [stage, setStage] = useState<
    "idle" | "switching" | "signing" | "done" | "error" | "approving" | "approving-wallet" | "submitting" | "revealing"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState<"from" | "to" | null>(null);
  const [flipAnim, setFlipAnim] = useState(false);
  const [panelAnim, setPanelAnim] = useState<"idle" | "out" | "in">("idle");
  const switchingRef = useRef(false);
  const balanceFetchCache = useRef<Map<string, Promise<number | null>>>(new Map());
  const [swapProgress, setSwapProgress] = useState<string>("");
  const swapStartedAtRef = useRef<number | null>(null);
  const [swapDurationSec, setSwapDurationSec] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(512);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (stage === "done") return;

    let observer: ResizeObserver | null = null;
    let cancelled = false;

    const attachObserver = () => {
      const node = cardRef.current;
      if (!node || cancelled) return;

      observer?.disconnect();
      observer = new ResizeObserver((entries) => {
        const height = entries[0]?.contentRect.height ?? 0;
        if (height > 0) setCardHeight(height);
      });
      observer.observe(node);
    };

    attachObserver();
    if (!cardRef.current) {
      requestAnimationFrame(attachObserver);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [stage, fromToken, toToken, fromAmount, toAmount, quoteError, swapError, quoting, isMobile]);

  useEffect(() => {
    preloadAllTokens();
  }, []);

  const loadBalances = useCallback(async () => {
    if (!evmAddress || !isEvmConnected) return;
  }, [evmAddress, isEvmConnected]);

  const fetchTokenBalance = useCallback(async (token: TokenState, chainId: number) => {
    if (!evmAddress || !isEvmConnected) return null;

    const cacheKey = `${chainId}:${token.address}:${evmAddress}`;

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
            chainId,
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
  }, [evmAddress, isEvmConnected]);

  useEffect(() => {
    if (isEvmConnected && evmAddress && !switchingRef.current) {
      loadBalances();
    }
  }, [isEvmConnected, evmAddress, fromChainConfig.chainId, loadBalances]);

  useEffect(() => {
    if (fromToken && isEvmConnected && evmAddress) {
      fetchTokenBalance(fromToken, fromChainConfig.chainId);
    }
  }, [fromToken, isEvmConnected, evmAddress, fromChainConfig.chainId, fetchTokenBalance]);


  const bridgeTokensToState = (list: Awaited<ReturnType<typeof fetchBridgeTokensForChain>>): TokenState[] =>
    list.map((t) => ({
      symbol: sanitizeTokenSymbol(t.symbol),
      name: t.name?.replace(/\0/g, "").trim() || sanitizeTokenSymbol(t.symbol),
      address: t.address,
      decimals: t.decimals,
      logoURI: t.logoURI,
    }));

  const mergeTokenLists = (...lists: TokenState[][]): TokenState[] => {
    const byAddr = new Map<string, TokenState>();
    for (const list of lists) {
      for (const t of list) {
        const key = t.address.toLowerCase();
        if (!byAddr.has(key)) byAddr.set(key, t);
      }
    }
    return [...byAddr.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
  };

  const loadTokensForChain = useCallback(async (chainId: number): Promise<TokenState[]> => {
    const fallback = getFallbackTokens(chainId);
    const cached = tokensByChainRef.current.get(chainId);
    if (cached && cached.length > fallback.length) {
      return cached.map(normalizeTokenState);
    }

    try {
      const [bridgeList, apiList] = await Promise.all([
        fetchBridgeTokensForChain(chainId).then(bridgeTokensToState).catch(() => [] as TokenState[]),
        fetchTokenList(chainId).catch(() => [] as TokenState[]),
      ]);
      const merged = mergeTokenLists(bridgeList, apiList, fallback).map(normalizeTokenState);
      if (merged.length > fallback.length) {
        tokensByChainRef.current.set(chainId, merged);
      }
      return merged.length > 0 ? merged : fallback.map(normalizeTokenState);
    } catch {
      return fallback.map(normalizeTokenState);
    }
  }, []);

  useEffect(() => {
    for (const chain of SWAP_CHAINS) {
      void loadTokensForChain(chain.chainId);
    }
  }, [loadTokensForChain]);

  useEffect(() => {
    let cancelled = false;
    async function syncSideLists() {
      setLoadingTokens(true);
      const fromFallback = getFallbackTokens(fromChainConfig.chainId);
      const toFallback = getFallbackTokens(toChainConfig.chainId);
      setFromTokenList(tokensByChainRef.current.get(fromChainConfig.chainId) ?? fromFallback);
      setToTokenList(tokensByChainRef.current.get(toChainConfig.chainId) ?? toFallback);

      const [fromTokens, toTokens] = await Promise.all([
        loadTokensForChain(fromChainConfig.chainId),
        loadTokensForChain(toChainConfig.chainId),
      ]);
      if (cancelled) return;

      setFromTokenList(fromTokens);
      setToTokenList(toTokens);
      setFromToken((prev) => {
        if (!prev) return fromTokens[0] ?? null;
        return fromTokens.find((t) => t.address.toLowerCase() === prev.address.toLowerCase()) ?? fromTokens[0] ?? null;
      });
      setToToken((prev) => {
        if (!prev) return toTokens[1] ?? toTokens[0] ?? null;
        return toTokens.find((t) => t.address.toLowerCase() === prev.address.toLowerCase()) ?? toTokens[1] ?? toTokens[0] ?? null;
      });
      setLoadingTokens(false);
    }

    void syncSideLists();
    return () => { cancelled = true; };
  }, [fromChainConfig.chainId, toChainConfig.chainId, loadTokensForChain]);

  useEffect(() => {
    if (!showSelector) return;

    const side = showSelector;
    const chainId = side === "from" ? fromChainConfig.chainId : toChainConfig.chainId;
    const fallback = getFallbackTokens(chainId);
    setModalTokenList(tokensByChainRef.current.get(chainId) ?? fallback);
    setModalTokensLoading(true);

    let cancelled = false;
    void loadTokensForChain(chainId).then((tokens) => {
      if (cancelled) return;
      setModalTokenList(tokens);
      if (side === "from") setFromTokenList(tokens);
      else setToTokenList(tokens);
      setModalTokensLoading(false);
    });

    return () => { cancelled = true; };
  }, [showSelector, fromChainKey, toChainKey, fromChainConfig.chainId, toChainConfig.chainId, loadTokensForChain]);

  function applyFromChain(key: SwapChainKey) {
    if (key === fromChainKey) return;
    setFromChainKey(key);
    setFromToken(null);
    setFromAmount("");
    setToAmount("");
    setBridgeQuote(null);
    setQuoteError(null);
    setStage("idle");
  }

  function applyToChain(key: SwapChainKey) {
    if (key === toChainKey) return;
    setToChainKey(key);
    setToToken(null);
    setFromAmount("");
    setToAmount("");
    setBridgeQuote(null);
    setQuoteError(null);
    setStage("idle");
  }

  function getTokenBalance(token: TokenState | null): number | null {
    if (!isEvmConnected || !evmAddress || !token) return null;
    return balances[token.address.toLowerCase()] ?? null;
  }

  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken) {
      setBridgeQuote(null);
      setToAmount("");
      setQuoteError(null);
      return;
    }
    setSwapError(null);
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(doFetchQuote, 300);
    return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current); };
  }, [fromAmount, fromToken, toToken, fromChainKey, toChainKey, preset, sameChain]);

  async function doFetchQuote() {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !evmAddress) return;

    if (sameChain) {
      setQuoteError(null);
      setToAmount("");
      setBridgeQuote(null);
      return;
    }

    setQuoting(true);
    setQuoteError(null);

    try {
      const data = await fetchFusionPlusQuote({
        srcChainId: fromChainConfig.chainId,
        dstChainId: toChainConfig.chainId,
        srcTokenAddress: fromToken.address,
        dstTokenAddress: toToken.address,
        amount: toAtomicUnits(fromAmount, fromToken.decimals),
        walletAddress: evmAddress,
        preset,
      });
      setBridgeQuote(data);
      setToAmount(formatBridgeReceiveAmount(data.receiveAmount, toToken.decimals));
    } catch (e: unknown) {
      setQuoteError(toUserFacingError(e, "swap"));
      setToAmount("");
      setBridgeQuote(null);
    } finally {
      setQuoting(false);
    }
  }

  function flipTokens() {
    if (!fromToken || !toToken) return;
    setFlipAnim(true);
    setPanelAnim("out");
    setTimeout(() => {
      const prevFromChain = fromChainKey;
      const prevToChain = toChainKey;
      setFromChainKey(prevToChain);
      setToChainKey(prevFromChain);
      setFromToken(toToken);
      setToToken(fromToken);
      setFromAmount(toAmount.replace(/,/g, ""));
      setToAmount("");
      setBridgeQuote(null);
      setPanelAnim("in");
    }, 180);
    setTimeout(() => {
      setFlipAnim(false);
      setPanelAnim("idle");
    }, 400);
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
    const symbol = sanitizeTokenSymbol(token.symbol);
    const resolved: TokenState = {
      symbol,
      name: token.name?.replace(/\0/g, "").trim() || symbol,
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
    if (!evmAddress || !isEvmConnected || !fromToken || !toToken || !bridgeQuote || sameChain) return;

    const isOnCorrectChain = evmChainId === fromChainConfig.chainId;
    if (!isOnCorrectChain) {
      setStage("switching");
      try {
        await switchToChainById(fromChainConfig.chainId);
      } catch {
        setStage("error");
        return;
      }
    }

    setStage("approving");
    setSwapProgress("Checking token approval…");
    swapStartedAtRef.current = Date.now();
    try {
      const signer = await getEvmSigner();
      if (!signer) throw new Error("Wallet signer unavailable");

      const hash = await executeFusionPlusBridge({
        quote: bridgeQuote,
        fromAmount,
        srcTokenAddress: fromToken.address,
        srcTokenDecimals: fromToken.decimals,
        dstTokenAddress: toToken.address,
        walletAddress: evmAddress,
        preset,
        signer,
        onProgress: setSwapProgress,
      });

      setTxHash(hash);
      setSwapDurationSec(
        swapStartedAtRef.current != null
          ? Math.max(1, Math.round((Date.now() - swapStartedAtRef.current) / 1000))
          : null,
      );
      setStage("done");
      setSwapProgress("");
      onComplete?.();
      void fetchTokenBalance(fromToken, fromChainConfig.chainId);
    } catch (e: unknown) {
      setSwapError(toUserFacingError(e, "swap"));
      setStage("idle");
      setSwapProgress("");
    }
  }

  const numFrom = parseFloat(fromAmount) || 0;
  const toAmountNum = parseFloat(toAmount.replace(/,/g, "")) || 0;
  const fromBal = getTokenBalance(fromToken);
  const insufficientBal = fromBal != null && numFrom > 0 && numFrom > fromBal;
  const isOnCorrectChain = evmChainId === fromChainConfig.chainId;
  const hasQuote = !!bridgeQuote;
  const canSwap = hasQuote && !sameChain && isEvmConnected && !insufficientBal && stage === "idle" && fromToken && toToken;
  const isBusy = ["switching", "signing", "approving", "approving-wallet", "submitting", "revealing"].includes(stage);
  const swapInfo = useMemo(() => {
    const dash = "—";
    const routeLabel =
      fromToken && toToken
        ? sameChain
          ? dash
          : `${fromChainConfig.shortLabel} → ${toChainConfig.shortLabel}`
        : dash;

    if (quoting) {
      return { priceImpact: "…", minReceived: "…", estGas: "…", route: routeLabel, priceImpactNum: null as number | null };
    }

    if (!fromToken || !toToken || numFrom <= 0) {
      return { priceImpact: dash, minReceived: dash, estGas: dash, route: routeLabel, priceImpactNum: null };
    }

    const pctFromAmounts = (startRaw?: string, endRaw?: string): number | null => {
      if (!startRaw || !endRaw) return null;
      try {
        const start = BigInt(startRaw);
        const end = BigInt(endRaw);
        if (start <= 0n) return null;
        return Number(((start - end) * 10000n) / start) / 100;
      } catch {
        return null;
      }
    };

    let priceImpactNum: number | null = null;
    let minReceived = dash;

    if (bridgeQuote) {
      priceImpactNum = pctFromAmounts(bridgeQuote.maxReceiveAmount, bridgeQuote.minReceiveAmount);
      if (bridgeQuote.minReceiveAmount) {
        minReceived = `${formatBridgeReceiveAmount(bridgeQuote.minReceiveAmount, toToken.decimals)} ${toToken.symbol}`;
      }
    } else if (toAmountNum > 0 && !sameChain) {
      minReceived = `${(toAmountNum * 0.995).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken.symbol}`;
    }

    const priceImpact =
      priceImpactNum != null
        ? priceImpactNum < 0.01
          ? "<0.01%"
          : `${priceImpactNum.toFixed(2)}%`
        : dash;

    const estGasUsd =
      hasQuote && !sameChain && numFrom > 0
        ? Math.max(1.5, Math.min(15, numFrom * 0.014))
        : null;
    const estGas =
      estGasUsd != null ? `$${estGasUsd.toFixed(2)}` : dash;

    return { priceImpact, minReceived, estGas, route: routeLabel, priceImpactNum };
  }, [
    quoting,
    fromToken,
    toToken,
    numFrom,
    toAmountNum,
    sameChain,
    bridgeQuote,
    hasQuote,
    fromChainConfig,
    toChainConfig,
  ]);

  const priceImpactColor =
    swapInfo.priceImpactNum == null
      ? "#9CA3AF"
      : swapInfo.priceImpactNum > 3
        ? "#EF4444"
        : swapInfo.priceImpactNum > 1
          ? "#D4A574"
          : "#9CA3AF";

  function ctaText(): string {
    if (!isEvmConnected) return "Connect Wallet";
    if (stage === "switching") return `Switching to ${fromChainConfig.label}...`;
    if (stage === "approving") return "Preparing swap...";
    if (stage === "approving-wallet") return "Approve in wallet...";
    if (stage === "signing") return "Sign in wallet...";
    if (loadingTokens) return "Loading tokens...";
    if (!fromToken || !toToken) return "Select tokens";
    if (!isOnCorrectChain) return `Switch to ${fromChainConfig.label}`;
    if (insufficientBal && fromToken) return `Insufficient ${fromToken.symbol}`;
    if (!fromAmount || numFrom <= 0) return "Enter an amount";
    if (sameChain) return "Pick different chains";
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
    if (!hasQuote) return "No route found";
    return "Swap";
  }

  function handleMainAction() {
    if (!isEvmConnected) { connectEvm(); return; }
    if (!isOnCorrectChain) { switchToChainById(fromChainConfig.chainId); return; }
    if (isBusy) return;

    if (insufficientBal && fromToken) {
      setSwapError(`Insufficient ${fromToken.symbol} balance`);
      return;
    }

    if (canSwap) {
      void handleSwapExecution();
      return;
    }
  }

  if (stage === "done" && txHash && fromToken && toToken) {
    return (
      <div className="swap-outer">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          <img src="/icons/Coin2.png" alt="coin" className="bg-coin" style={{
            position: "absolute",
            width: 275,
            height: 267,
            left: -195,
            bottom: isMobile ? 150 : 110,
            zIndex: 0,
            pointerEvents: "none",
          }} />
          <img src="/icons/Flash.png" alt="flash" className="bg-flash" style={{
            position: "absolute",
            width: 440,
            height: 440,
            right: -265,
            top: 60,
            zIndex: 0,
            pointerEvents: "none",
            transform: "rotate(-5.55deg)",
          }} />
          <style>{`
            .swap-outer {
              min-height: 0;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding-top: 10px;
              padding-bottom: 0px;
            }
            @media (max-width: 640px) {
              .swap-outer { padding-bottom: 20px; }
              .bg-coin { width: min(275px, 40vw) !important; height: auto !important; left: -20vw !important; }
              .bg-flash { width: min(440px, 60vw) !important; height: auto !important; right: -25vw !important; }
            }
          `}</style>
          <div style={{ position: "relative", zIndex: 1, marginTop: isMobile ? 24 : 40 }}>
            <SwapSuccessCard
              fromToken={fromToken}
              toToken={toToken}
              fromAmt={fromAmount}
              toAmt={toAmount}
              txLink={`${fromChainConfig.explorer}/tx/${txHash}`}
              txHash={txHash}
              priceImpact={swapInfo.priceImpact}
              estGas={swapInfo.estGas}
              durationSec={swapDurationSec ?? undefined}
              isMobile={isMobile}
              onNew={() => {
                setStage("idle");
                setFromAmount("");
                setToAmount("");
                setTxHash(null);
                setSwapDurationSec(null);
                swapStartedAtRef.current = null;
                setBridgeQuote(null);
                setQuoteError(null);
                setSwapError(null);
                setCardHeight(512);
                loadBalances();
              }}
            />
          </div>
          <div style={{ marginTop: 40, textAlign: "center", position: "relative", zIndex: 1 }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400,
              fontSize: 12,
              lineHeight: "16px",
              color: "#888888",
              display: "inline-block",
            }}>
              © 2026 Azabu. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const ctaActive = canSwap || !isEvmConnected || !isOnCorrectChain;
  const ctaBg = ctaActive ? ORANGE : "#1A1C22";
  const ctaColor = ctaActive ? "#fff" : "#3A4050";

  return (
    <div className="swap-outer">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        <img src="/icons/Coin2.png" alt="coin" className="bg-coin" style={{
          position: "absolute",
          width: 275,
          height: 267,
          left: -195,
          bottom: isMobile ? 150 : 110,
          zIndex: 0,
          pointerEvents: "none",
        }} />
        <img src="/icons/Flash.png" alt="flash" className="bg-flash" style={{
          position: "absolute",
          width: 440,
          height: 440,
          right: -265,
          top: 60,
          zIndex: 0,
          pointerEvents: "none",
          transform: "rotate(-5.55deg)",
        }} />
        <style>{`
  .swp-input { -moz-appearance: textfield; }
  .swp-input::-webkit-inner-spin-button,
  .swp-input::-webkit-outer-spin-button { -webkit-appearance: none; }
  .swp-input:focus { outline: none; }
  .swp-input::placeholder { color: rgba(255,255,255,0.3) !important; }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }
    .swap-outer {
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10px;
  padding-bottom: 0px;
}
  @media (max-width: 640px) {
    .swap-outer {
      padding-bottom: 20px;
    }
  }
  .swap-info-text {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
  }
  /* RESPONSIVE ADDITIONS */
  @media (max-width: 640px) {
    .swap-header { width: 100% !important; padding: 0 4px 0 0; display: flex !important; justify-content: space-between !important; }
    .swap-header h2 { font-size: 28px !important; line-height: 28px !important; }
    .swap-header button { font-size: 12px !important; gap: 4px !important; }
    .swap-card { width: calc(100vw - 32px) !important; max-width: 520px; padding: 12px 12px 20px !important; }
    .token-panel { padding: 8px 12px 4px !important; }
    .token-panel-label { font-size: 12px !important; margin-top: 20px !important; }
    .token-amount-input { font-size: 22px !important; line-height: 22px !important; }
    .token-selector-btn { width: 50px !important; height: 80px !important; padding: 6px 8px !important; gap: 2px !important; }
    .token-selector-btn img { width: 24px !important; height: 24px !important; }
    .token-selector-btn span { font-size: 11px !important; }
    .balance-text { font-size: 10px !important; }

    .flip-btn { width: 40px !important; height: 40px !important; }
    .flip-btn svg { width: 18px !important; height: 14px !important; }
    .cta-button { width: 200px !important; height: 36px !important; font-size: 13px !important; margin: 4px auto 16px !important; }
    .info-table { width: calc(100% - 24px) !important; margin-left: auto !important; margin-right: auto !important; gap: 8px !important; }
    .info-row span { font-size: 12px !important; }
    .swap-info-text { font-family: 'Inter', system-ui, sans-serif !important; font-size: 14px !important; font-weight: 600 !important; }
    .bg-glow { width: 100% !important; height: 120px !important; }
    .bg-coin { width: min(275px, 40vw) !important; height: auto !important; left: -20vw !important; }
    .bg-flash { width: min(440px, 60vw) !important; height: auto !important; right: -25vw !important; }
  }
`}</style>

        {/* Header outside card */}
        <div className="swap-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "relative", width: 520 }}>
          <h2 style={{
            fontSize: 36, fontWeight: 600, fontFamily: SANS, letterSpacing: "-1px", margin: 0,
            lineHeight: "34px",
            background: "linear-gradient(98.1deg, #FFFFFF 29.04%, #808080 64.68%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Swap
          </h2>
          <button
            onClick={() => setShowPresetSelector(s => !s)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 14, fontWeight: 600, fontFamily: SANS }}>
            Settings
            <Settings size={16} color="#888888" />
          </button>
        </div>
        <div style={{ position: "relative", overflow: "visible", }}>
          {/* Background glow */}
          <div className="bg-glow"
            style={{
              position: "absolute",
              width: "550px",
              height: "160px",
              left: "50%",
              top: "45%",
              transform: "translate(-50%, -90%)", // THIS centers it perfectly
              background: "rgba(255, 107, 0, 0.5)",
              filter: "blur(60px)",
              borderRadius: "9999px",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          {showPresetSelector && (
            <div
              className="preset-popup"
              style={{
                position: "absolute",
                width: isMobile ? 205 : 293,
                height: isMobile ? 110 : 190,
                top: isMobile ? -15 : -15,
                right: isMobile ? 10 : -15,
                zIndex: 100,

                background:
                  "linear-gradient(180deg, rgba(22,22,22,0.95) 0%, rgba(10,10,10,0.95) 100%)",

                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(33.33px)",
                borderRadius: 16,
              }}
            >
              {/* Title */}
              <div style={{ position: "absolute", left: isMobile ? 14 : 24, top: isMobile ? 12 : 24, fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#FFFFFF", fontFamily: SANS, lineHeight: isMobile ? "16px" : "28px", }}>
                Transaction Speed
              </div>

              {/* Low button */}
              <button
                onClick={() => { setPreset("slow"); setShowPresetSelector(false); }}
                style={{
                  position: "absolute", left: isMobile ? 18 : 24,
                  top: isMobile ? 35 : 76,
                  width: isMobile ? 40 : 50,
                  height: isMobile ? 18 : 26,
                  minHeight: 0,
                  padding: 0,
                  background: preset === "slow" ? "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255,111,0,0.8) 0%, rgba(255,111,0,0.8) 39.48%, rgba(26,26,26,0.8) 100%)" : "radial-gradient(70.79% 49.1% at 86.63% 100%, rgba(224,217,217,0.1) 0%, rgba(169,164,164,0.1) 36.06%, rgba(26,26,26,0.1) 100%)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
                  borderRadius: 32, cursor: "pointer",
                  fontSize: isMobile ? 9.69 : 12, fontWeight: 400, color: preset === "slow" ? "#FFFFFF" : "#888888", fontFamily: SANS,
                }}
              >
                Low
              </button>

              {/* Med button */}
              <button
                onClick={() => { setPreset("fast"); setShowPresetSelector(false); }}
                style={{
                  position: "absolute", left: isMobile ? 68 : 92,
                  top: isMobile ? 35 : 76,
                  width: isMobile ? 40 : 50,
                  height: isMobile ? 18 : 26,
                  minHeight: 0,
                  background: preset === "fast" ? "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255,111,0,0.8) 0%, rgba(255,111,0,0.8) 39.48%, rgba(26,26,26,0.8) 100%)" : "radial-gradient(70.79% 49.1% at 86.63% 100%, rgba(224,217,217,0.1) 0%, rgba(169,164,164,0.1) 36.06%, rgba(26,26,26,0.1) 100%)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
                  borderRadius: 32, cursor: "pointer",
                  fontSize: isMobile ? 9.69 : 12, fontWeight: 400, color: preset === "fast" ? "#FFFFFF" : "#888888", fontFamily: SANS,
                }}
              >
                Med
              </button>

              {/* High button */}
              <button
                onClick={() => { setPreset("medium"); setShowPresetSelector(false); }}
                style={{
                  position: "absolute", left: isMobile ? 120 : 160,
                  top: isMobile ? 35 : 76,
                  width: isMobile ? 40 : 50,
                  height: isMobile ? 18 : 26,
                  minHeight: 0,
                  background: preset === "medium" ? "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255,111,0,0.8) 0%, rgba(255,111,0,0.8) 39.48%, rgba(26,26,26,0.8) 100%)" : "radial-gradient(70.79% 49.1% at 86.63% 100%, rgba(224,217,217,0.1) 0%, rgba(169,164,164,0.1) 36.06%, rgba(26,26,26,0.1) 100%)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
                  borderRadius: 32, cursor: "pointer",
                  fontSize: isMobile ? 9.69 : 12, fontWeight: 400, color: preset === "medium" ? "#FFFFFF" : "#888888", fontFamily: SANS,
                }}
              >
                High
              </button>

              {/* Price info */}
              <div style={{
                position: "absolute", left: isMobile ? 25 : 34,
                top: isMobile ? 60 : 122,
                fontSize: isMobile ? 8 : 10, color: "#888888", fontFamily: "Space Grotesk", textAlign: "center", lineHeight: isMobile ? "15px" : "15px"
              }}>
                ~$0.40<br />~30s
              </div>
              <div style={{
                position: "absolute", left: isMobile ? 75 : 98,
                top: isMobile ? 60 : 122,
                fontSize: isMobile ? 8 : 10, color: "#888888", fontFamily: "Space Grotesk", textAlign: "center", lineHeight: isMobile ? "15px" : "15px",
              }}>
                ~$1.20<br />~10s
              </div>
              <div style={{
                position: "absolute", left: isMobile ? 127 : 166,
                top: isMobile ? 60 : 122,
                fontSize: isMobile ? 8 : 10, color: "#888888", fontFamily: "Space Grotesk", textAlign: "center", lineHeight: isMobile ? "15px" : "15px",
              }}>
                ~$2.80<br />~3s
              </div>
            </div>
          )}
          {/* Main card */}
          <div ref={cardRef} className="swap-card"
            style={{
              position: "relative",
              zIndex: 1,
              width: 520,
              padding: "18px 18px 28px",
              background: "linear-gradient(180deg, rgba(22,22,22,0.6) 0%, rgba(10,10,10,0.6) 100%)",
              backdropFilter: "blur(16.65px)",
              border: "none",
              clipPath: `path('M 24 0 Q 0 0 0 24 L 0 ${cardHeight * 0.36} A 44 44 0 0 1 0 ${cardHeight * 0.36 + 80} L 0 ${cardHeight - 24} Q 0 ${cardHeight} 24 ${cardHeight} L ${(cardRef.current?.clientWidth || 520) - 24} ${cardHeight} Q ${cardRef.current?.clientWidth || 520} ${cardHeight} ${cardRef.current?.clientWidth || 520} ${cardHeight - 24} L ${cardRef.current?.clientWidth || 520} ${cardHeight * 0.36 + 80} A 44 44 0 0 1 ${cardRef.current?.clientWidth || 520} ${cardHeight * 0.36} L ${cardRef.current?.clientWidth || 520} 24 Q ${cardRef.current?.clientWidth || 520} 0 ${(cardRef.current?.clientWidth || 520) - 24} 0 Z')`,
              WebkitClipPath: `path('M 24 0 Q 0 0 0 24 L 0 ${cardHeight * 0.36} A 44 44 0 0 1 0 ${cardHeight * 0.36 + 80} L 0 ${cardHeight - 24} Q 0 ${cardHeight} 24 ${cardHeight} L ${(cardRef.current?.clientWidth || 520) - 24} ${cardHeight} Q ${cardRef.current?.clientWidth || 520} ${cardHeight} ${cardRef.current?.clientWidth || 520} ${cardHeight - 24} L ${cardRef.current?.clientWidth || 520} ${cardHeight * 0.36 + 80} A 44 44 0 0 1 ${cardRef.current?.clientWidth || 520} ${cardHeight * 0.36} L ${cardRef.current?.clientWidth || 520} 24 Q ${cardRef.current?.clientWidth || 520} 0 ${(cardRef.current?.clientWidth || 520) - 24} 0 Z')`,
              borderRadius: undefined,
              overflow: "hidden",
            }}
          >
            {/* SVG border */}
            <svg
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: "100%",
                height: cardHeight,
                pointerEvents: "none",
                zIndex: 7,
                overflow: "visible",
              }}
              viewBox={`0 0 520 ${cardHeight}`}
              preserveAspectRatio="none"
            >
              <path
                d={`M 24 0 Q 0 0 0 24 L 0 ${cardHeight * 0.36} A 44 44 0 0 1 0 ${cardHeight * 0.36 + 80} L 0 ${cardHeight - 24} Q 0 ${cardHeight} 24 ${cardHeight} L 496 ${cardHeight} Q 520 ${cardHeight} 520 ${cardHeight - 24} L 520 ${cardHeight * 0.36 + 80} A 44 44 0 0 1 520 ${cardHeight * 0.36} L 520 24 Q 520 0 496 0 Z`}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
            </svg>
            <div style={{
              transform: panelAnim === "out" ? "translateY(10px) scale(0.98)" : panelAnim === "in" ? "translateY(-5px)" : "translateY(0)",
              opacity: panelAnim === "out" ? 0.35 : 1,
              transition: panelAnim === "out" ? "transform 0.18s ease-in, opacity 0.18s ease-in" : "transform 0.22s ease-out, opacity 0.22s ease-out",
            }}>
              {fromToken && (
                <TokenPanel
                  label="Sell"
                  token={fromToken} amount={fromAmount}
                  balance={fromBal} loading={loadingBal} disabled={isBusy}
                  onAmountChange={(v) => { if (v.split(".").length <= 2) setFromAmount(v); }}
                  onSelectToken={() => setShowSelector("from")}
                  onSetMax={setMax}
                  testIdPrefix="from"
                  isMobile={isMobile}
                />
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "center", margin: "6px 0", position: "relative", zIndex: 10 }}>

              <button className="flip-btn" data-testid="button-flip-tokens"
                onClick={flipTokens} disabled={isBusy || !fromToken || !toToken}
                style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: "conic-gradient(from 180.78deg at 45.42% 119.23%, #FFE270 -96.92deg, #FFDD54 27.69deg, #FF6B00 60.58deg, #FF6B00 188.65deg, #FFE270 263.08deg, #FFDD54 387.69deg)", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transform: flipAnim ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                  outline: "none", boxShadow: "none",
                  opacity: (!fromToken || !toToken) ? 0.5 : 1,
                }}
              >
                <svg width="22" height="18" viewBox="0 0 28 20" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 5h18a3 3 0 0 1 0 5" />
                  <path d="M5 5l3-3M5 5l3 3" />
                  <path d="M23 15H5a3 3 0 0 1 0-5" />
                  <path d="M23 15l-3-3m3 3l-3 3" />
                </svg>
              </button>
            </div>

            <div style={{
              transform: panelAnim === "out" ? "translateY(-10px) scale(0.98)" : panelAnim === "in" ? "translateY(5px)" : "translateY(0)",
              opacity: panelAnim === "out" ? 0.35 : 1,
              transition: panelAnim === "out" ? "transform 0.18s ease-in, opacity 0.18s ease-in" : "transform 0.22s ease-out, opacity 0.22s ease-out",
            }}>
              {toToken && (
                <TokenPanel
                  label="Buy"
                  token={toToken} amount={toAmount}
                  balance={getTokenBalance(toToken)} loading={quoting}
                  readOnly disabled
                  onSelectToken={() => setShowSelector("to")}
                  testIdPrefix="to"
                  isMobile={isMobile}
                />
              )}
            </div>

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

            <button className="cta-button"
              data-testid="button-swap-cta"
              onClick={handleMainAction}
              disabled={isBusy || (isEvmConnected && isOnCorrectChain && !canSwap && !insufficientBal && !!fromAmount && parseFloat(fromAmount) > 0)}
              style={{
                width: 240, height: 39, borderRadius: 50,
                background: ctaActive ? "conic-gradient(from 180.78deg at 45.42% 119.23%, #FFDD54 0deg, #FF6B00 62.31deg, #FF6B00 218.08deg, #FFE270 263.08deg, #FFDD54 360deg)" : "#1A1C22",
                border: "1px solid rgba(255,107,0,0.3)",
                color: ctaActive ? "#fff" : "#3A4050",
                fontSize: 14, fontWeight: 400, fontFamily: '"Inter", sans-serif',
                cursor: (ctaActive || insufficientBal) ? "pointer" : "default",
                transition: "background 0.2s, opacity 0.2s",
                letterSpacing: "0.01em",
                position: "relative",
                zIndex: 10,
                backdropFilter: "blur(10px)",
                display: "block",
                margin: "6px auto 20px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                padding: "0 12px",
              }}
              onMouseEnter={e => { if (ctaActive || insufficientBal) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {ctaText()}
            </button>
            <div style={{ height: 15 }} />
          </div>
          {/* Info table */}
          <div className="info-table" style={{ width: 427, marginTop: isMobile ? 10 : -20, marginLeft: "auto", marginRight: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: isMobile ? 14 : 0, paddingRight: isMobile ? 14 : 0 }}>
              <span className="swap-info-text" style={{ color: "#9CA3AF" }}>Price Impact</span>
              <span className="swap-info-text" style={{ color: priceImpactColor }}>{swapInfo.priceImpact}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: isMobile ? 14 : 0, paddingRight: isMobile ? 14 : 0 }}>
              <span className="swap-info-text" style={{ color: "#9CA3AF" }}>Min. received</span>
              <span className="swap-info-text" style={{ color: "#9CA3AF" }}>{swapInfo.minReceived}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: isMobile ? 14 : 0, paddingRight: isMobile ? 14 : 0 }}>
              <span className="swap-info-text" style={{ color: "#9CA3AF" }}>Est. gas</span>
              <span className="swap-info-text" style={{ color: "#9CA3AF" }}>{swapInfo.estGas}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: isMobile ? 14 : 0, paddingRight: isMobile ? 14 : 0 }}>
              <span className="swap-info-text" style={{ color: "#9CA3AF" }}>Route</span>
              <span className="swap-info-text" style={{ color: "#9CA3AF" }}>{swapInfo.route}</span>
            </div>
          </div>
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 400,
                fontSize: 12,
                lineHeight: "16px",
                color: "#888888",
                display: "inline-block",
              }}
            >
              © 2026 Azabu. All rights reserved.
            </span>
          </div>
        </div>

        {showSelector !== null && (
          <TokenSelectorModal
            title={showSelector === "from" ? "Select token to sell" : "Select token to buy"}
            tokens={modalTokenList}
            loadingTokens={modalTokensLoading}
            chains={SWAP_CHAINS.map((chain) => ({
              key: chain.key,
              label: chain.label,
              logo: chain.logo,
            }))}
            selectedChainKey={showSelector === "from" ? fromChainKey : toChainKey}
            onSelectChain={(chainKey) => {
              if (showSelector === "from") {
                applyFromChain(chainKey as SwapChainKey);
              } else {
                applyToChain(chainKey as SwapChainKey);
              }
            }}
            excludeMint={showSelector === "from" ? toToken?.address : fromToken?.address}
            onSelect={handleSelectToken}
            onClose={() => setShowSelector(null)}
          />
        )}

      </div>
    </div >
  );
}