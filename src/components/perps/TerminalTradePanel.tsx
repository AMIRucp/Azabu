"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import useSettingsStore from "@/stores/useSettingsStore";
import { useTradeExecution } from "@/hooks/useTradeExecution";
import { useCollateralBalance } from "@/hooks/useCollateralBalance";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import TradeOrderSummary from "./TradeOrderSummary";
import TradeSubmitArea from "./TradeSubmitArea";
import CollateralBanner from "./CollateralBanner";
import CollateralDrawer from "./CollateralDrawer";
import { DepositModal } from "@/components/DepositModal";
import { onTradeConfirmed } from "@/lib/tradeAnimations";
import TradeSuccessOverlay, { type CelebrationTrade } from "./TradeSuccessOverlay";

type DepositProtocol = "aster" | "hyperliquid";

const PROTOCOL_FEES: Record<string, number> = {
  aster: 0.0004, arbitrum: 0.0006, hyperliquid: 0.00035, lighter: 0.0003,
};

const SETTLE_TOKEN: Record<string, string> = {
  aster: "USDT", arbitrum: "USDC", hyperliquid: "USDC", lighter: "USDC",
};

const T = {
  bg: "#08080c", bgCard: "#0f0f14", bgEl: "#16161e", bgHover: "#1c1c28",
  bgInput: "#111118", border: "#1a1a24", borderSub: "#131318",
  text: "#e4e4ec", text2: "#7a7a90", text3: "#44445a",
  green: "#00d492", greenDim: "rgba(0,212,146,0.10)",
  red: "#ef4461", redDim: "rgba(239,68,97,0.10)",
  orange: "#f97316", orangeDim: "rgba(249,115,22,0.10)",
};

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

interface MarketData { sym: string; price: number; maxLev: number; marketName?: string; category?: string; }
interface TerminalTradePanelProps {
  market: MarketData;
  chain: "arbitrum" | "hyperliquid" | "lighter";
  asterUserId?: string;
  pairId?: number;
  initialSide?: "long" | "short";
  onTradeSuccess?: () => void;
  viewOnly?: boolean;
  isMobile?: boolean;
  isNarrow?: boolean;
  selectedProtocol?: string;
  fundingRate?: number;
  openInterest?: number;
  volume24h?: number;
}

export default function TerminalTradePanel({ market, chain, asterUserId, pairId, initialSide, onTradeSuccess, viewOnly, isMobile, isNarrow, selectedProtocol, fundingRate, openInterest, volume24h }: TerminalTradePanelProps) {
  const { isEvmConnected } = useEvmWallet();

  const settingsDefaults = useSettingsStore();
  const {
    txState, txMsg, txSig, execute, dismiss, retryTpSl, canRetryTpSl,
  } = useTradeExecution();

  const [side, setSide] = useState<"long" | "short">(initialSide || "long");

  useEffect(() => {
    if (initialSide) setSide(initialSide);
  }, [initialSide]);

  const [otype, setOtype] = useState<"market" | "limit" | "stop">(() => {
    try {
      const v = localStorage.getItem("afx_trade_otype");
      if (v === "limit" || v === "stop") return v;
    } catch {}
    return "market";
  });
  const [size, setSize] = useState("");
  const [sizeDenom, setSizeDenom] = useState<"asset" | "usd">(() => {
    try {
      const v = localStorage.getItem("afx_trade_sizedenom");
      if (v === "asset" || v === "usd") return v;
    } catch {}
    return settingsDefaults.defaultSizeMode === 'BASE' ? "asset" : "usd";
  });
  const [lev, setLev] = useState<number>(() => {
    try {
      const v = localStorage.getItem("afx_trade_lev");
      if (v) { const n = parseInt(v); if (n >= 1 && n <= 500) return n; }
    } catch {}
    return settingsDefaults.defaultLeverage;
  });

  useEffect(() => { try { localStorage.setItem("afx_trade_lev", String(lev)); } catch {} }, [lev]);
  useEffect(() => { try { localStorage.setItem("afx_trade_otype", otype); } catch {} }, [otype]);
  useEffect(() => { try { localStorage.setItem("afx_trade_sizedenom", sizeDenom); } catch {} }, [sizeDenom]);

  useEffect(() => {
    if (isMobile && sizeDenom !== "usd") {
      setSize("");
      setSizeDenom("usd");
    }
  }, [isMobile]);
  const [price, setPrice] = useState("");
  const [showTpSl, setShowTpSl] = useState(false);
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [hiddenOrder, setHiddenOrder] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const maxLev = market.maxLev || 20;

  useEffect(() => {
    if (lev > maxLev) setLev(maxLev);
  }, [maxLev]);

  const rawSize = parseFloat(size) || 0;
  const sizeNum = sizeDenom === "usd" && market.price > 0 ? rawSize / market.price : rawSize;
  const posValue = sizeNum * market.price;
  const collateral = lev > 0 ? posValue / lev : 0;

  const isAster = market.marketName?.endsWith("USDT") || market.sym?.endsWith("USDT");
  const isHL = chain === "hyperliquid";
  const isLighter = chain === "lighter" || (market as any).protocol === "lighter";
  const feeKey = isHL ? "hyperliquid" : isLighter ? "lighter" : isAster ? "aster" : chain;
  const feeRate = PROTOCOL_FEES[feeKey] ?? 0.0005;
  const quoteAsset = SETTLE_TOKEN[feeKey] ?? "USDC";
  const protocol = isHL ? "HYPERLIQUID" : isLighter ? "LIGHTER" : isAster ? "ASTER DEX" : "HYPERLIQUID";

  const { balance: collateralBalance, loading: balLoading, token: collateralToken, chainLabel: collateralChainLabel, deficit: collateralDeficit, refresh: refreshBalance, arbitrumBalance, hyperliquidBalance, bridgeNeeded, bridgeAmount, evmConnected, bestSrcChain } = useCollateralBalance(chain, collateral);
  const availableBalance = collateralBalance;
  const chainForSubs = (chain === "lighter" ? "hyperliquid" : chain) as "arbitrum" | "hyperliquid";

  const liqPrice = useMemo(() => market.price * (side === "long" ? (1 - 0.9 / lev) : (1 + 0.9 / lev)), [market.price, side, lev]);
  const liqDist = useMemo(() => market.price > 0 ? Math.abs(market.price - liqPrice) / market.price * 100 : 0, [market.price, liqPrice]);
  const fee = useMemo(() => posValue * feeRate, [posValue, feeRate]);
  const totalCost = useMemo(() => collateral + fee, [collateral, fee]);

  const tpPnl = useMemo(() => {
    const tpNum = parseFloat(tp);
    if (!tpNum || !sizeNum || !market.price) return 0;
    const diff = side === "long" ? tpNum - market.price : market.price - tpNum;
    return (diff / market.price) * posValue;
  }, [tp, side, sizeNum, market.price, posValue]);

  const slPnl = useMemo(() => {
    const slNum = parseFloat(sl);
    if (!slNum || !sizeNum || !market.price) return 0;
    const diff = side === "long" ? market.price - slNum : slNum - market.price;
    return (diff / market.price) * posValue;
  }, [sl, side, sizeNum, market.price, posValue]);

  const riskReward = tpPnl > 0 && slPnl > 0 ? tpPnl / slPnl : 0;
  const marketSymbol = market.marketName || `${market.sym}-PERP`;
  const walletConnected = isEvmConnected;

  const openWalletModal = useCallback(() => {
    window.dispatchEvent(new CustomEvent("afx-open-wallet-modal"));
  }, []);

  const tradePanelRef = useRef<HTMLDivElement>(null);

  const executeTradeInner = useCallback(() => {
    const currentSide = side;
    const currentPosValue = posValue;
    const currentLev = lev;
    const currentSym = market.sym;
    const currentEntryPrice = market.price;
    execute({
      chain, market, side, sizeNum, posValue, lev, otype, price, maxLev,
      marketSymbol, collateral, tp, sl, hiddenOrder, asterUserId, pairId,
      onTradeSuccess: () => {
        setSize("");
        onTradeSuccess?.();
        const settings = useSettingsStore.getState();
        const btn = tradePanelRef.current?.querySelector('[data-testid="trade-submit-button"]') as HTMLElement | null;
        onTradeConfirmed({
          side: currentSide,
          posValue: currentPosValue,
          leverage: currentLev,
          buttonEl: btn,
          soundEnabled: settings.soundEnabled,
          soundVolume: settings.soundVolume,
          showXp: settings.showXpNotifications,
        });
        setCelebrationTrade({
          side: currentSide,
          sym: currentSym,
          lev: currentLev,
          posValue: currentPosValue,
          entryPrice: currentEntryPrice,
        });
      },
    });
  }, [chain, market, side, sizeNum, posValue, lev, otype, price, maxLev, marketSymbol, collateral, tp, sl, hiddenOrder, asterUserId, pairId, onTradeSuccess, execute]);

  const handleSubmit = useCallback(() => {
    if (!sizeNum || sizeNum <= 0) return;
    if (lev > maxLev) return;
    if (useSettingsStore.getState().confirmBeforeTrade) {
      setPendingConfirm(true);
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      if (navigator.vibrate) navigator.vibrate(10);
      executeTradeInner();
    }
  }, [sizeNum, lev, maxLev, executeTradeInner]);

  const mInput: React.CSSProperties = { width: "100%", padding: "14px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", color: T.text, fontSize: 18, fontFamily: mono, outline: "none", boxSizing: "border-box" as const, WebkitAppearance: "none" as const, fontWeight: 600 };

  const [levPickerOpen, setLevPickerOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositDefaultProtocol, setDepositDefaultProtocol] = useState<DepositProtocol | null>(null);
  const [celebrationTrade, setCelebrationTrade] = useState<CelebrationTrade | null>(null);

  const depositProtocol: DepositProtocol = isHL ? "hyperliquid" : "aster";
  const depositProtocolName = isHL ? "Hyperliquid" : "Aster";

  const openDeposit = useCallback(() => {
    setDepositDefaultProtocol(depositProtocol);
    setDepositModalOpen(true);
  }, [depositProtocol]);

  if (isNarrow) {
    const pill = {
      background: "rgba(255,255,255,0.04)", borderRadius: 7,
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "7px 10px", display: "flex" as const, justifyContent: "space-between" as const, alignItems: "center" as const,
    };
    const chevron = <svg width="8" height="5" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#44445a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    return (
      <div ref={tradePanelRef} data-testid="terminal-trade-panel" style={{ padding: "10px 10px 16px", display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
        {celebrationTrade && <TradeSuccessOverlay trade={celebrationTrade} onDismiss={() => setCelebrationTrade(null)} />}

        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <button data-testid="trade-margin-mode" style={{ flex: 1, ...pill, justifyContent: "center", gap: 5, cursor: "default", fontSize: 10, fontFamily: mono, color: T.text2, fontWeight: 500 }}>
            <span>Cross</span>{chevron}
          </button>
          <button data-testid="trade-leverage-display" onClick={() => setLevPickerOpen(v => !v)} style={{ flex: 1, ...pill, justifyContent: "center", gap: 5, cursor: "pointer", fontSize: 11, fontFamily: mono, color: lev >= 100 ? T.red : lev >= 50 ? T.orange : T.text, fontWeight: 700 }}>
            <span>{lev}x</span>{chevron}
          </button>
        </div>

        {levPickerOpen && (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                {[1, ...[Math.round(maxLev * 0.1), Math.round(maxLev * 0.25), Math.round(maxLev * 0.5), Math.round(maxLev * 0.75)].filter(v => v > 1 && v < maxLev), maxLev].filter((v, i, a) => a.indexOf(v) === i).map(v => (
                  <button key={v} data-testid={`trade-quick-lev-${v}`} onClick={() => { setLev(v); setLevPickerOpen(false); }} style={{
                    padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontFamily: mono,
                    fontSize: 10, fontWeight: lev === v ? 700 : 400,
                    background: lev === v ? "rgba(212,165,116,0.12)" : "rgba(255,255,255,0.03)",
                    border: lev === v ? "1px solid rgba(212,165,116,0.25)" : "1px solid rgba(255,255,255,0.05)",
                    color: lev === v ? T.orange : T.text3,
                  }}>{v}x</button>
                ))}
              </div>
              <input data-no-drag data-testid="trade-leverage-slider" type="range" min={1} max={maxLev} value={Math.min(lev, maxLev)} onChange={e => setLev(parseInt(e.target.value))} style={{ width: "100%", accentColor: T.orange, height: 2, opacity: 0.5 }} />
            </div>
            <div onClick={() => setLevPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
          </>
        )}

        <div style={{ display: "flex", gap: 0, marginBottom: 8, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          {(["long", "short"] as const).map(s => {
            const isActive = side === s;
            const isL = s === "long";
            const tint = isL ? "#D4A574" : "#ef4461";
            const kanji = isL ? "買" : "売";
            return (
              <button key={s} data-testid={`trade-side-${s}`} onClick={() => setSide(s)} style={{
                flex: 1, padding: "9px 8px", border: "none", cursor: "pointer",
                background: isActive ? `${tint}1A` : "transparent",
                borderRight: isL ? "1px solid rgba(255,255,255,0.07)" : "none",
                position: "relative", overflow: "hidden", transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: tint, opacity: 0.7 }} />}
                <span style={{
                  fontSize: 10, fontWeight: 900, lineHeight: 1, fontFamily: "'Noto Serif JP', serif",
                  color: isActive ? tint : "rgba(255,255,255,0.2)",
                }}>{kanji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: mono, letterSpacing: "0.04em", color: isActive ? "#F0F0F0" : T.text3 }}>
                  {isL ? "Long" : "Short"}
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d={isL ? "M5 8V2M5 2L2.5 4.5M5 2L7.5 4.5" : "M5 2V8M5 8L2.5 5.5M5 8L7.5 5.5"}
                    stroke={isActive ? tint : "rgba(255,255,255,0.2)"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, color: T.text3, fontFamily: mono }}>Avbl:</span>
          <span style={{ fontSize: 9, color: T.text2, fontFamily: mono, fontWeight: 500 }}>{availableBalance !== null ? `${availableBalance.toFixed(2)} ${quoteAsset}` : "—"}</span>
        </div>

        <div style={{ ...pill, marginBottom: 6, cursor: "pointer" }}>
          <span style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>Order</span>
          <div style={{ display: "flex", gap: 2 }}>
            {(["market", "limit"] as const).map(t => (
              <button key={t} data-testid={`trade-otype-${t}`} onClick={() => setOtype(t)} style={{
                padding: "3px 8px", borderRadius: 4, border: "none", cursor: "pointer", fontFamily: mono,
                fontSize: 9, fontWeight: otype === t ? 700 : 400, textTransform: "capitalize",
                background: otype === t ? "rgba(255,255,255,0.08)" : "transparent",
                color: otype === t ? T.text : T.text3,
              }}>{t}</button>
            ))}
          </div>
        </div>

        {otype !== "market" && (
          <div style={{ ...pill, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>Price</span>
            <input data-no-drag data-testid="trade-price-input" type="text" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder={market.price > 0 ? market.price.toFixed(2) : "0.00"} style={{ background: "transparent", border: "none", outline: "none", textAlign: "right", fontSize: 11, fontFamily: mono, color: T.text, fontWeight: 600, width: "55%" }} />
          </div>
        )}

        <div style={{ ...pill, marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>Size</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input data-no-drag data-testid="trade-size-input" type="text" inputMode="decimal" value={size} onChange={e => setSize(e.target.value)} placeholder="0.00" style={{ background: "transparent", border: "none", outline: "none", textAlign: "right", fontSize: 13, fontFamily: mono, color: T.text, fontWeight: 700, width: 60 }} />
            <button data-testid="trade-size-denom-toggle" onClick={() => { setSize(""); setSizeDenom(d => d === "asset" ? "usd" : "asset"); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
              <svg width="12" height="10" viewBox="0 0 16 14" fill="none"><path d="M11 1l4 4-4 4M5 13l-4-4 4-4M1 9h14M1 5h14" stroke={T.orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div style={{ display: "flex", marginBottom: 10, borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          {[25, 50, 75, 100].map(pct => (
            <button key={pct} data-testid={`trade-size-pct-${pct}%`} onClick={() => {
              if (availableBalance !== null && availableBalance > 0) {
                const amt = availableBalance * (pct / 100);
                if (sizeDenom === "usd") setSize(amt.toFixed(2));
                else if (market.price > 0) setSize((amt / market.price).toFixed(market.price >= 100 ? 4 : 6));
              }
            }} style={{
              flex: 1, padding: "6px 0", background: "transparent", border: "none",
              color: T.text3, fontSize: 9, fontFamily: mono, cursor: "pointer", letterSpacing: "0.04em",
            }}>{pct === 100 ? "MAX" : `${pct}%`}</button>
          ))}
        </div>

        <CollateralBanner token={collateralToken} chainLabel={collateralChainLabel} deficit={collateralDeficit} balance={collateralBalance} loading={balLoading} onGetToken={() => setDrawerOpen(true)} onDeposit={openDeposit} protocolName={depositProtocolName} onConnectArbitrum={openWalletModal} arbitrumBalance={arbitrumBalance} hyperliquidBalance={hyperliquidBalance} bridgeNeeded={bridgeNeeded} bridgeAmount={bridgeAmount} isArbitrum={chain === "arbitrum"} isEvm={chain === "arbitrum" || chain === "hyperliquid"} evmConnected={evmConnected} />

        <TradeSubmitArea T={T} chain={chainForSubs} market={market} side={side} sizeNum={sizeNum} posValue={posValue} collateral={collateral} lev={lev} walletConnected={!!walletConnected} availableBalance={availableBalance} protocol={protocol} txState={txState} txMsg={txMsg} txSig={txSig} dismiss={dismiss} handleSubmit={handleSubmit} pendingConfirm={pendingConfirm} setPendingConfirm={setPendingConfirm} executeTradeInner={executeTradeInner} onGetToken={() => setDrawerOpen(true)} onDeposit={openDeposit} onConnectWallet={openWalletModal} viewOnly={viewOnly} retryTpSl={canRetryTpSl ? retryTpSl : undefined} evmConnected={evmConnected} isMobile />

        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { l: "Margin", v: collateral > 0 ? `$${collateral.toFixed(2)}` : "—", id: "margin" },
            { l: "Liq. Price", v: sizeNum > 0 ? `$${liqPrice.toFixed(2)}` : "None", color: liqDist < 3 ? T.red : undefined, id: "liq-price" },
            { l: "Fee", v: fee > 0 ? `$${fee.toFixed(2)}` : "—", id: "fee" },
          ].map(r => (
            <div key={r.id} data-testid={`trade-summary-${r.id}`} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9, color: T.text3, fontFamily: mono }}>{r.l}</span>
              <span style={{ fontSize: 9, color: r.color || T.text2, fontFamily: mono, fontWeight: 500 }}>{r.v}</span>
            </div>
          ))}
        </div>

        <CollateralDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); refreshBalance(); }} token={collateralToken} chainLabel={collateralChainLabel} amount={collateralDeficit} srcChain={bestSrcChain ?? undefined} />
        <DepositModal open={depositModalOpen} onClose={() => { setDepositModalOpen(false); refreshBalance(); }} defaultProtocol={depositDefaultProtocol || undefined} />
      </div>
    );
  }

  if (isMobile) {
    const card: React.CSSProperties = {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10,
    };

    const fmtCompact = (n: number) => {
      if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
      if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
      if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
      return `$${n.toFixed(0)}`;
    };

    const levPresets = [1, ...[Math.round(maxLev * 0.1), Math.round(maxLev * 0.25), Math.round(maxLev * 0.5), Math.round(maxLev * 0.75)].filter(v => v > 1 && v < maxLev), maxLev].filter((v, i, a) => a.indexOf(v) === i);

    return (
      <div ref={tradePanelRef} data-testid="terminal-trade-panel" style={{ padding: "12px 16px 24px", position: "relative" }}>
        {celebrationTrade && <TradeSuccessOverlay trade={celebrationTrade} onDismiss={() => setCelebrationTrade(null)} />}

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[
            { label: "Funding", value: fundingRate !== undefined ? `${(fundingRate * 100).toFixed(4)}%` : "—", color: fundingRate !== undefined && fundingRate > 0 ? T.green : fundingRate !== undefined && fundingRate < 0 ? T.red : T.text2 },
            { label: "Open Interest", value: openInterest !== undefined ? fmtCompact(openInterest) : "—", color: T.text },
            { label: "24h Vol", value: volume24h !== undefined ? fmtCompact(volume24h) : "—", color: T.text2 },
          ].map(stat => (
            <div key={stat.label} data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`} style={{
              flex: 1, ...card, padding: "10px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: T.text3, fontFamily: mono, letterSpacing: "0.06em", marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 12, color: stat.color, fontFamily: mono, fontWeight: 700 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 0, marginBottom: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          {(["long", "short"] as const).map(s => {
            const isActive = side === s;
            const isL = s === "long";
            const tint = isL ? "#D4A574" : "#ef4461";
            const kanji = isL ? "買" : "売";
            return (
              <button key={s} data-testid={`trade-side-${s}`} onClick={() => setSide(s)} style={{
                flex: 1, padding: "13px 12px", border: "none", cursor: "pointer",
                background: isActive ? `${tint}1A` : "transparent",
                borderRight: isL ? "1px solid rgba(255,255,255,0.07)" : "none",
                position: "relative", overflow: "hidden", transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}>
                {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: tint, opacity: 0.7 }} />}
                {/* Small SVG chart watermark */}
                <svg width="50" height="28" viewBox="0 0 50 28" fill="none" aria-hidden="true"
                  style={{ position: "absolute", right: 0, top: 0, opacity: isActive ? 0.14 : 0.05, transition: "opacity 0.2s", pointerEvents: "none" }}>
                  {isL
                    ? <polyline points="0,26 10,20 20,22 32,12 42,8 50,2" stroke={tint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    : <polyline points="0,2 10,8 20,6 32,16 42,20 50,26" stroke={tint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  }
                </svg>
                <span style={{ fontSize: 13, fontWeight: 900, lineHeight: 1, fontFamily: "'Noto Serif JP', serif", color: isActive ? tint : "rgba(255,255,255,0.18)" }}>{kanji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: mono, letterSpacing: "0.05em", textTransform: "uppercase", color: isActive ? "#F0F0F0" : T.text3 }}>
                  {isL ? "Long" : "Short"}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d={isL ? "M6 10V2M6 2L3 5M6 2L9 5" : "M6 2V10M6 10L3 7M6 10L9 7"}
                    stroke={isActive ? tint : "rgba(255,255,255,0.18)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: T.text2, fontFamily: mono, fontWeight: 500 }}>
              Margin ({quoteAsset})
            </span>
            <span style={{ fontSize: 11, color: T.text3, fontFamily: mono }}>
              Balance: {availableBalance !== null ? `$${availableBalance.toFixed(2)}` : "—"}
            </span>
          </div>

          <div style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, flex: 1 }}>
              <span style={{ fontSize: 14, color: T.text3, fontFamily: mono, fontWeight: 500 }}>$</span>
              <input data-no-drag data-testid="trade-size-input" type="text" inputMode="decimal" value={size} onChange={e => setSize(e.target.value)} placeholder="0.00" style={{
                background: "transparent", border: "none", outline: "none",
                fontSize: 24, fontFamily: mono, color: T.text, fontWeight: 700,
                width: "100%", padding: 0,
                WebkitAppearance: "none" as const,
              }} />
            </div>
            {availableBalance !== null && availableBalance > 0 && (
              <button data-testid="trade-size-pct-100%" onClick={() => {
                if (availableBalance > 0) setSize(availableBalance.toFixed(2));
              }} style={{
                padding: "4px 10px", borderRadius: 5, border: `1px solid ${T.orange}40`,
                background: `${T.orange}14`, color: T.orange,
                fontSize: 10, fontWeight: 700, fontFamily: mono, cursor: "pointer",
                letterSpacing: "0.04em",
              }}>MAX</button>
            )}
          </div>
          {rawSize > 0 && sizeDenom === "usd" && (
            <div style={{ fontSize: 10, color: T.text3, fontFamily: mono, marginBottom: 6 }}>
              {sizeNum.toFixed(sizeNum < 1 ? 4 : 2)} {market.sym}
            </div>
          )}

          <div style={{ display: "flex", gap: 6 }}>
            {[100, 500, 1000, 5000].map(amt => (
              <button key={amt} data-testid={`trade-quick-size-${amt}`} onClick={() => setSize(String(amt))} style={{
                flex: 1, padding: "8px 0", borderRadius: 7,
                ...card,
                fontSize: 11, fontWeight: 600, fontFamily: mono, cursor: "pointer",
                color: size === String(amt) ? T.orange : T.text3,
                background: size === String(amt) ? `${T.orange}10` : "rgba(255,255,255,0.03)",
                borderColor: size === String(amt) ? `${T.orange}30` : "rgba(255,255,255,0.06)",
                textAlign: "center" as const,
              }}>${amt >= 1000 ? `${amt / 1000}K` : amt}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: T.text2, fontFamily: mono, fontWeight: 500 }}>Leverage</span>
            <span data-testid="trade-leverage-display" style={{
              fontSize: 14, fontWeight: 700, fontFamily: mono,
              color: lev >= 100 ? T.red : lev >= 50 ? T.orange : T.text2,
            }}>{lev}x</span>
          </div>

          <div style={{ position: "relative", marginBottom: 6, padding: "0 2px" }}>
            <input data-no-drag data-testid="trade-leverage-slider" type="range" min={1} max={maxLev}
              value={Math.min(lev, maxLev)} onChange={e => setLev(parseInt(e.target.value))}
              style={{
                width: "100%", height: 2, borderRadius: 1,
                WebkitAppearance: "none" as const,
                background: `linear-gradient(to right, ${lev >= 100 ? T.red : T.orange}60 ${(lev / maxLev) * 100}%, rgba(255,255,255,0.04) ${(lev / maxLev) * 100}%)`,
                outline: "none", cursor: "pointer",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 8, fontFamily: mono, color: T.text3 }}>
            {[1, ...[Math.round(maxLev * 0.25), Math.round(maxLev * 0.5)].filter(v => v > 1 && v < maxLev), maxLev].filter((v, i, a) => a.indexOf(v) === i).map(v => (
              <button key={v} data-testid={`trade-quick-lev-${v}`} onClick={() => setLev(v)} style={{
                padding: "3px 6px", border: "none", background: "transparent", cursor: "pointer",
                fontFamily: mono, fontSize: 8, fontWeight: lev === v ? 600 : 400,
                color: lev === v ? T.text2 : T.text3, transition: "color 0.12s",
              }}>{v}x</button>
            ))}
          </div>

          {settingsDefaults.showLeverageWarnings && lev >= 50 && (
            <div data-testid="leverage-warning-inline" style={{ marginTop: 8, fontSize: 10, fontFamily: mono, color: lev >= 100 ? T.red : T.orange, display: 'flex', alignItems: 'center', gap: 5, opacity: 0.7 }}>
              <AlertTriangle style={{ width: 10, height: 10, flexShrink: 0 }} />
              <span>{lev >= 100 ? 'Liquidation within 1%' : 'High leverage'}</span>
            </div>
          )}
        </div>

        <div style={{ ...card, display: "flex", padding: 3, marginBottom: 12 }}>
          {(["market", "limit"] as const).map(t => (
            <button key={t} data-testid={`trade-otype-${t}`} onClick={() => setOtype(t)} style={{
              flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
              fontFamily: mono, fontSize: 11, fontWeight: otype === t ? 700 : 400,
              textTransform: "capitalize" as const,
              background: otype === t ? "rgba(255,255,255,0.06)" : "transparent",
              color: otype === t ? T.text : T.text3,
              transition: "all 0.12s",
            }}>{t}</button>
          ))}
        </div>

        {otype !== "market" && (
          <div style={{ ...card, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>Price</span>
            <input data-no-drag data-testid="trade-price-input" type="text" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder={market.price > 0 ? market.price.toFixed(2) : "0.00"} style={{ background: "transparent", border: "none", outline: "none", textAlign: "right", fontSize: 16, fontFamily: mono, color: T.text, fontWeight: 700, width: "60%" }} />
          </div>
        )}

        <div data-testid="trade-tpsl-toggle" onClick={() => setShowTpSl(!showTpSl)} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
          padding: "8px 0", marginBottom: showTpSl ? 4 : 10,
        }}>
          <span style={{ fontSize: 10, color: T.text3, fontFamily: mono, fontWeight: 400, letterSpacing: "0.06em" }}>TP / SL</span>
          <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ transform: showTpSl ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M1 1L5 5L9 1" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        {showTpSl && (
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, color: T.green, fontFamily: mono, marginBottom: 3, display: "block", fontWeight: 500, letterSpacing: "0.06em" }}>TP</label>
              <input data-no-drag data-testid="trade-tp-input" type="text" inputMode="decimal" value={tp} onChange={e => setTp(e.target.value)} placeholder={market.price > 0 ? (side === "long" ? (market.price * 1.05).toFixed(2) : (market.price * 0.95).toFixed(2)) : "Price"} style={{ ...mInput, fontSize: 13, padding: "8px 0" }} />
              {tpPnl !== 0 && <div style={{ fontSize: 10, color: tpPnl > 0 ? T.green : T.red, fontFamily: mono, marginTop: 3, fontWeight: 600 }}>{tpPnl > 0 ? "+" : ""}{`$${tpPnl.toFixed(2)}`}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, color: T.red, fontFamily: mono, marginBottom: 3, display: "block", fontWeight: 500, letterSpacing: "0.06em" }}>SL</label>
              <input data-no-drag data-testid="trade-sl-input" type="text" inputMode="decimal" value={sl} onChange={e => setSl(e.target.value)} placeholder={market.price > 0 ? (side === "long" ? (market.price * 0.95).toFixed(2) : (market.price * 1.05).toFixed(2)) : "Price"} style={{ ...mInput, fontSize: 13, padding: "8px 0" }} />
              {slPnl !== 0 && <div style={{ fontSize: 10, color: T.red, fontFamily: mono, marginTop: 3, fontWeight: 600 }}>{`-$${slPnl.toFixed(2)}`}</div>}
            </div>
          </div>
        )}

        {isAster && otype === "limit" && (
          <div data-testid="trade-hidden-order-toggle" onClick={() => setHiddenOrder(h => !h)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", marginBottom: 12, cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={hiddenOrder ? "#8b5cf6" : T.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {hiddenOrder ? (<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>)}
              </svg>
              <span style={{ fontSize: 10, fontFamily: mono, color: hiddenOrder ? "#8b5cf6" : T.text3, fontWeight: hiddenOrder ? 600 : 400 }}>Dark Pool</span>
            </div>
            <div style={{ width: 30, height: 16, borderRadius: 8, padding: 1.5, background: hiddenOrder ? "#8b5cf6" : "rgba(255,255,255,0.06)", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: hiddenOrder ? "flex-end" : "flex-start" }}>
              <div style={{ width: 13, height: 13, borderRadius: "50%", background: hiddenOrder ? "#fff" : T.text3, transition: "all 0.2s" }} />
            </div>
          </div>
        )}

        {(isEvmConnected || (chain !== "arbitrum" && chain !== "hyperliquid")) && (
          <CollateralBanner token={collateralToken} chainLabel={collateralChainLabel} deficit={collateralDeficit} balance={collateralBalance} loading={balLoading} onGetToken={() => setDrawerOpen(true)} onDeposit={openDeposit} protocolName={depositProtocolName} onNavigateToBridge={(amt) => { localStorage.setItem("afx_bridge_prefill", amt.toFixed(2)); window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "swap" } })); }} onConnectArbitrum={openWalletModal} arbitrumBalance={arbitrumBalance} hyperliquidBalance={hyperliquidBalance} bridgeNeeded={bridgeNeeded} bridgeAmount={bridgeAmount} isArbitrum={chain === "arbitrum"} isEvm={chain === "arbitrum" || chain === "hyperliquid"} evmConnected={evmConnected} />
        )}

        <div style={{ marginTop: 6 }}>
          <TradeSubmitArea T={T} chain={chainForSubs} market={market} side={side} sizeNum={sizeNum} posValue={posValue} collateral={collateral} lev={lev} walletConnected={!!walletConnected} availableBalance={availableBalance} protocol={protocol} txState={txState} txMsg={txMsg} txSig={txSig} dismiss={dismiss} handleSubmit={handleSubmit} pendingConfirm={pendingConfirm} setPendingConfirm={setPendingConfirm} executeTradeInner={executeTradeInner} onGetToken={() => setDrawerOpen(true)} onDeposit={openDeposit} onConnectWallet={openWalletModal} viewOnly={viewOnly} retryTpSl={canRetryTpSl ? retryTpSl : undefined} evmConnected={evmConnected} isMobile />
        </div>

        {sizeNum > 0 && (
          <div style={{ padding: "10px 0", marginTop: 8 }}>
            {[
              { l: "Margin", v: `$${collateral.toFixed(2)}`, id: "margin" },
              { l: "Position", v: `$${posValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: T.text, id: "position" },
              { l: "Liq. Price", v: `$${liqPrice.toFixed(2)} (${liqDist.toFixed(1)}%)`, color: liqDist < 3 ? T.red : T.text2, id: "liq-price" },
              { l: "Fee", v: `$${fee.toFixed(2)}`, id: "fee" },
            ].map(r => (
              <div key={r.id} data-testid={`trade-summary-${r.id}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: T.text3, fontFamily: mono, fontWeight: 400 }}>{r.l}</span>
                <span style={{ fontSize: 10, color: r.color || T.text2, fontFamily: mono, fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}

        <CollateralDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); refreshBalance(); }} token={collateralToken} chainLabel={collateralChainLabel} amount={collateralDeficit} srcChain={bestSrcChain ?? undefined} />
        <DepositModal open={depositModalOpen} onClose={() => { setDepositModalOpen(false); refreshBalance(); }} defaultProtocol={depositDefaultProtocol || undefined} />
      </div>
    );
  }

  return (
    <div ref={tradePanelRef} data-testid="terminal-trade-panel" style={{ background: T.bgCard, padding: 14, height: "100%", borderLeft: `1px solid ${T.border}`, overflow: "auto", position: "relative" }}>
      {celebrationTrade && <TradeSuccessOverlay trade={celebrationTrade} onDismiss={() => setCelebrationTrade(null)} />}
      <div data-testid="trade-margin-mode" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 2, background: T.bg, borderRadius: 5, padding: 2 }}>
          {(["cross", "isolated"] as const).map(m => (
            <button key={m} data-testid={`trade-margin-${m}`} onClick={() => setMarginMode(m)} style={{
              padding: "4px 10px", fontSize: 10, fontWeight: 500, textTransform: "capitalize", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: mono,
              background: marginMode === m ? "rgba(255,255,255,0.06)" : "transparent", color: marginMode === m ? T.text : T.text3, transition: "all 0.12s",
            }}>{m}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: mono, color: lev >= 100 ? T.red : lev >= 50 ? T.orange : T.text2 }}>{lev}x</span>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 14, borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
        {(["long", "short"] as const).map(s => {
          const isActive = side === s;
          const isL = s === "long";
          const tint = isL ? "#D4A574" : "#ef4461";
          const kanji = isL ? "買" : "売";
          return (
            <button key={s} data-testid={`trade-side-${s}`} onClick={() => setSide(s)} style={{
              flex: 1, padding: "9px 8px", border: "none", cursor: "pointer",
              background: isActive ? `${tint}1A` : "transparent",
              borderRight: isL ? "1px solid rgba(255,255,255,0.07)" : "none",
              position: "relative", overflow: "hidden", transition: "background 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: tint, opacity: 0.7 }} />}
              <span style={{ fontSize: 10, fontWeight: 900, lineHeight: 1, fontFamily: "'Noto Serif JP', serif", color: isActive ? tint : "rgba(255,255,255,0.2)" }}>{kanji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: mono, letterSpacing: "0.04em", textTransform: "uppercase", color: isActive ? "#F0F0F0" : T.text3 }}>
                {isL ? "Long" : "Short"}
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d={isL ? "M5 8V2M5 2L2.5 4.5M5 2L7.5 4.5" : "M5 2V8M5 8L2.5 5.5M5 8L7.5 5.5"}
                  stroke={isActive ? tint : "rgba(255,255,255,0.2)"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 14, padding: 2 }}>
        {(["market", "limit", "stop"] as const).map(t => (
          <button key={t} data-testid={`trade-otype-${t}`} onClick={() => setOtype(t)} style={{
            flex: 1, padding: "5px 0", borderRadius: 4, border: "none", cursor: "pointer", fontSize: 10, fontWeight: otype === t ? 600 : 400, fontFamily: mono, textTransform: "capitalize",
            background: otype === t ? "rgba(255,255,255,0.05)" : "transparent", color: otype === t ? T.text2 : T.text3, transition: "all 0.12s",
          }}>{t}</button>
        ))}
      </div>

      {(chain === "arbitrum" || chain === "hyperliquid") && (
        <div
          data-testid="trade-chain-context"
          style={{
            padding: "6px 10px",
            borderRadius: 5,
            marginBottom: 10,
            background: isHL ? "rgba(51,255,136,0.06)" : isLighter ? "rgba(99,102,241,0.06)" : isAster ? "rgba(40,160,240,0.06)" : "rgba(233,185,49,0.06)",
            border: `1px solid ${isHL ? "rgba(51,255,136,0.12)" : isLighter ? "rgba(99,102,241,0.12)" : isAster ? "rgba(40,160,240,0.12)" : "rgba(233,185,49,0.12)"}`,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 9,
            fontFamily: mono,
            color: T.text2,
            lineHeight: 1.4,
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            background: isHL ? "#33FF88" : isLighter ? "#6366F1" : isAster ? "#28A0F0" : "#E8B931",
            display: "inline-block",
          }} />
          <span>{isHL
            ? (isEvmConnected ? "Trading via Hyperliquid" : "This market trades on Hyperliquid -- connect an EVM wallet")
            : isLighter
            ? "Trading via Lighter"
            : (isEvmConnected ? "Trading on Arbitrum via Aster DEX" : "This market trades on Arbitrum via Aster DEX -- connect an EVM wallet")
          }</span>
        </div>
      )}

      <div data-testid="trade-avbl" style={{ fontSize: 10, color: T.text3, marginBottom: 8 }}>
        {chain === "arbitrum" && arbitrumBalance !== null ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E8B931", display: "inline-block" }} />
              Arbitrum
            </span>
            <span style={{ color: T.text2, fontFamily: mono }}>{arbitrumBalance.toFixed(2)} {quoteAsset}</span>
          </div>
        ) : chain === "hyperliquid" && hyperliquidBalance !== null ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <img src="/tokens/hyperliquid.webp" alt="HL" style={{ width: 10, height: 10, borderRadius: "50%" }} />
              Hyperliquid
            </span>
            <span style={{ color: T.text2, fontFamily: mono }}>{hyperliquidBalance.toFixed(2)} {quoteAsset}</span>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Avbl</span>
            <span style={{ color: T.text2, fontFamily: mono }}>{availableBalance !== null ? `${availableBalance.toFixed(2)} ${quoteAsset}` : "\u2014"}</span>
          </div>
        )}
      </div>

      {otype !== "market" && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 9, color: T.text3, fontFamily: mono, marginBottom: 3, display: "block", letterSpacing: "0.06em" }}>PRICE (USD)</label>
          <input data-testid="trade-price-input" type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder={market.price > 0 ? market.price.toFixed(2) : "0.00"} style={{ width: "100%", padding: "10px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", color: T.text, fontSize: 14, fontFamily: mono, outline: "none", boxSizing: "border-box", fontWeight: 600 }} />
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <label style={{ fontSize: 9, color: T.text3, fontFamily: mono, letterSpacing: "0.06em" }}>SIZE ({sizeDenom === "asset" ? market.sym : quoteAsset})</label>
          <button data-testid="trade-size-denom-toggle" onClick={() => { setSize(""); setSizeDenom(d => d === "asset" ? "usd" : "asset"); }} style={{ padding: "1px 6px", borderRadius: 3, border: "none", background: "transparent", color: T.text3, fontSize: 8, fontFamily: mono, cursor: "pointer", transition: "all 0.12s" }}>
            {sizeDenom === "asset" ? `\u21C4 ${quoteAsset}` : `\u21C4 ${market.sym}`}
          </button>
        </div>
        <input data-testid="trade-size-input" type="text" value={size} onChange={e => setSize(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "10px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", color: T.text, fontSize: 18, fontFamily: mono, outline: "none", boxSizing: "border-box", fontWeight: 700 }} />
        {rawSize > 0 && (
          <div style={{ fontSize: 9, color: T.text3, fontFamily: mono, marginTop: 4, textAlign: "right" }}>
            {sizeDenom === "usd" ? `= ${sizeNum.toFixed(sizeNum < 1 ? 4 : 2)} ${market.sym}` : `= $${posValue.toFixed(2)}`}
          </div>
        )}
        <div style={{ display: "flex", gap: 0, marginTop: 6 }}>
          {["25%", "50%", "75%", "100%"].map(p => (
            <button key={p} data-testid={`trade-size-pct-${p}`} onClick={() => {
              if (availableBalance !== null && availableBalance > 0) {
                const pctVal = parseInt(p) / 100;
                const amt = availableBalance * pctVal;
                if (sizeDenom === "usd") setSize(amt.toFixed(2));
                else if (market.price > 0) setSize((amt / market.price).toFixed(market.price >= 100 ? 4 : 6));
              }
            }} style={{ flex: 1, padding: "5px 0", borderRadius: 0, border: "none", background: "transparent", color: T.text3, fontSize: 9, fontFamily: mono, cursor: "pointer", fontWeight: 400, transition: "color 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.color = T.text2}
            onMouseLeave={e => e.currentTarget.style.color = T.text3}
            >{p}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 9, color: T.text3, fontFamily: mono, letterSpacing: "0.06em" }}>LEVERAGE</label>
          <span data-testid="trade-leverage-display" style={{ fontSize: 12, color: lev >= 100 ? T.red : lev >= 50 ? T.orange : T.text2, fontWeight: 700, fontFamily: mono }}>{lev}x</span>
        </div>
        <div style={{ position: "relative", padding: "0 2px" }}>
          <input data-testid="trade-leverage-slider" type="range" min={1} max={maxLev} value={Math.min(lev, maxLev)} onChange={e => setLev(parseInt(e.target.value))} style={{
            width: "100%", height: 2, borderRadius: 1,
            WebkitAppearance: "none" as const, outline: "none", cursor: "pointer",
            background: `linear-gradient(to right, ${lev >= 100 ? T.red : T.orange}60 ${(lev / maxLev) * 100}%, rgba(255,255,255,0.04) ${(lev / maxLev) * 100}%)`,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {[1, 2, 5, 10, 25, 50, 75, 100, 125, 150, 175, 200].filter(v => v <= maxLev).concat([maxLev]).filter((v, i, a) => a.indexOf(v) === i).slice(-5).map(v => (
            <button key={v} data-testid={`trade-quick-lev-${v}`} onClick={() => setLev(v)} style={{
              padding: "3px 6px", border: "none", background: "transparent", cursor: "pointer",
              fontFamily: mono, fontSize: 8, fontWeight: lev === v ? 600 : 400,
              color: lev === v ? T.text2 : T.text3, transition: "color 0.12s",
            }}>{v}x</button>
          ))}
        </div>
        {settingsDefaults.showLeverageWarnings && lev >= 50 && (
          <div data-testid="leverage-warning-inline" style={{ marginTop: 6, fontSize: 9, fontFamily: mono, color: lev >= 100 ? T.red : T.orange, display: 'flex', alignItems: 'center', gap: 5, opacity: 0.7 }}>
            <AlertTriangle style={{ width: 10, height: 10, flexShrink: 0 }} />
            <span>{lev >= 100 ? 'Liquidation within 1%' : 'High leverage'}</span>
          </div>
        )}
      </div>


      <div data-testid="trade-tpsl-toggle" onClick={() => setShowTpSl(!showTpSl)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showTpSl ? 6 : 10, cursor: "pointer", padding: "6px 0" }}>
        <span style={{ fontSize: 10, color: T.text3, fontFamily: mono, fontWeight: 400 }}>TP / SL</span>
        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ transform: showTpSl ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M1 1L5 5L9 1" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>

      {showTpSl && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 8, color: T.green, fontFamily: mono, marginBottom: 2, display: "block", letterSpacing: "0.06em", fontWeight: 500 }}>TP</label>
              <input data-testid="trade-tp-input" type="text" value={tp} onChange={e => setTp(e.target.value)} placeholder={market.price > 0 ? (side === "long" ? (market.price * 1.05).toFixed(2) : (market.price * 0.95).toFixed(2)) : "Price"} style={{ width: "100%", padding: "8px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", color: T.text, fontSize: 12, fontFamily: mono, outline: "none", boxSizing: "border-box", fontWeight: 600 }} />
              {tpPnl !== 0 && <div style={{ fontSize: 9, color: tpPnl > 0 ? T.green : T.red, fontFamily: mono, marginTop: 2, textAlign: "right", fontWeight: 600 }}>{tpPnl > 0 ? "+" : ""}{`$${tpPnl.toFixed(2)}`}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 8, color: T.red, fontFamily: mono, marginBottom: 2, display: "block", letterSpacing: "0.06em", fontWeight: 500 }}>SL</label>
              <input data-testid="trade-sl-input" type="text" value={sl} onChange={e => setSl(e.target.value)} placeholder={market.price > 0 ? (side === "long" ? (market.price * 0.95).toFixed(2) : (market.price * 1.05).toFixed(2)) : "Price"} style={{ width: "100%", padding: "8px 0", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", color: T.text, fontSize: 12, fontFamily: mono, outline: "none", boxSizing: "border-box", fontWeight: 600 }} />
              {slPnl !== 0 && <div style={{ fontSize: 9, color: T.red, fontFamily: mono, marginTop: 2, textAlign: "right", fontWeight: 600 }}>{`-$${slPnl.toFixed(2)}`}</div>}
            </div>
          </div>
          {riskReward > 0 && <div style={{ fontSize: 9, color: T.text3, fontFamily: mono, textAlign: "right" }}>R:R <span style={{ color: riskReward >= 2 ? T.green : riskReward >= 1 ? T.orange : T.red, fontWeight: 700 }}>1:{riskReward.toFixed(1)}</span></div>}
        </div>
      )}

      {isAster && otype === "limit" && (
        <div data-testid="trade-hidden-order-toggle" onClick={() => setHiddenOrder(h => !h)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", marginBottom: 12, cursor: "pointer", background: hiddenOrder ? "rgba(139,92,246,0.08)" : T.bg, border: `1px solid ${hiddenOrder ? "rgba(139,92,246,0.25)" : T.border}`, borderRadius: 6, transition: "all 0.15s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={hiddenOrder ? "#8b5cf6" : T.text3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {hiddenOrder ? (<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>)}
            </svg>
            <span style={{ fontSize: 10, fontFamily: mono, color: hiddenOrder ? "#8b5cf6" : T.text2, fontWeight: hiddenOrder ? 600 : 400 }}>Dark Pool</span>
          </div>
          <div style={{ width: 28, height: 14, borderRadius: 7, padding: 1, background: hiddenOrder ? "#8b5cf6" : T.bgEl, transition: "background 0.15s", display: "flex", alignItems: "center", justifyContent: hiddenOrder ? "flex-end" : "flex-start" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: hiddenOrder ? "#fff" : T.text3, transition: "all 0.15s" }} />
          </div>
        </div>
      )}

      <TradeOrderSummary T={T} sizeNum={sizeNum} posValue={posValue} collateral={collateral} lev={lev} liqPrice={liqPrice} liqDist={liqDist} fee={fee} feeRate={feeRate} totalCost={totalCost} market={market} showLeverageWarnings={settingsDefaults.showLeverageWarnings} />

      <CollateralBanner
        token={collateralToken}
        chainLabel={collateralChainLabel}
        deficit={collateralDeficit}
        balance={collateralBalance}
        loading={balLoading}
        onGetToken={() => setDrawerOpen(true)}
        onDeposit={openDeposit}
        protocolName={depositProtocolName}
        onNavigateToBridge={(amt) => {
          localStorage.setItem("afx_bridge_prefill", amt.toFixed(2));
          window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page: "swap" } }));
        }}
        onConnectArbitrum={openWalletModal}
        arbitrumBalance={arbitrumBalance}
        hyperliquidBalance={hyperliquidBalance}
        bridgeNeeded={bridgeNeeded}
        bridgeAmount={bridgeAmount}
        isArbitrum={chain === "arbitrum"}
        isEvm={chain === "arbitrum" || chain === "hyperliquid"}
        evmConnected={evmConnected}
      />

      <TradeSubmitArea T={T} chain={chainForSubs} market={market} side={side} sizeNum={sizeNum} posValue={posValue} collateral={collateral} lev={lev} walletConnected={!!walletConnected} availableBalance={availableBalance} protocol={protocol} txState={txState} txMsg={txMsg} txSig={txSig} dismiss={dismiss} handleSubmit={handleSubmit} pendingConfirm={pendingConfirm} setPendingConfirm={setPendingConfirm} executeTradeInner={executeTradeInner} onGetToken={() => setDrawerOpen(true)} onDeposit={openDeposit} onConnectWallet={openWalletModal} viewOnly={viewOnly} retryTpSl={canRetryTpSl ? retryTpSl : undefined} evmConnected={evmConnected} />

      <CollateralDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); refreshBalance(); }}
        token={collateralToken}
        chainLabel={collateralChainLabel}
        amount={collateralDeficit}
        srcChain={bestSrcChain ?? undefined}
      />

      <DepositModal open={depositModalOpen} onClose={() => { setDepositModalOpen(false); refreshBalance(); }} defaultProtocol={depositDefaultProtocol || undefined} />
    </div>
  );
}
