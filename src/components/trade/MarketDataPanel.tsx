"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

interface OrderLevel { price: number; size: number; total: number; }
interface RecentTrade { price: number; size: number; side: "buy" | "sell"; time: string; }

interface MarketDataPanelProps {
  symbol: string;
  protocol: string;
  isMobile?: boolean;
  currentPrice?: number | null;
  fundingRate?: number | null;
  defaultTab?: "book" | "trades" | "funding";
}

function hlCoin(symbol: string, protocol: string): string {
  if (protocol === "aster") return symbol.replace(/USDT$/, "");
  return symbol.replace(/-PERP$/, "");
}

async function fetchOrderBook(coin: string): Promise<{ bids: OrderLevel[]; asks: OrderLevel[] }> {
  try {
    const res = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "l2Book", coin }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { bids: [], asks: [] };
    const data = await res.json();
    const levels = data.levels || [[], []];

    let bidTotal = 0;
    const bids: OrderLevel[] = (levels[0] || []).slice(0, 14).map((l: any) => {
      const size = parseFloat(l.sz);
      bidTotal += size;
      return { price: parseFloat(l.px), size, total: bidTotal };
    });
    let askTotal = 0;
    const asks: OrderLevel[] = (levels[1] || []).slice(0, 14).map((l: any) => {
      const size = parseFloat(l.sz);
      askTotal += size;
      return { price: parseFloat(l.px), size, total: askTotal };
    });
    return { bids, asks };
  } catch {
    return { bids: [], asks: [] };
  }
}

async function fetchRecentTrades(coin: string): Promise<RecentTrade[]> {
  try {
    const res = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "recentTrades", coin }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data as any[]).slice(0, 30).map((t: any) => ({
      price: parseFloat(t.px),
      size: parseFloat(t.sz),
      side: t.side === "B" ? "buy" as const : "sell" as const,
      time: t.time ? new Date(t.time).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "",
    }));
  } catch {
    return [];
  }
}

function PriceFormat({ value, digits }: { value: number; digits?: number }) {
  const d = digits ?? (value < 1 ? 6 : value < 10 ? 4 : value < 1000 ? 2 : 2);
  return <>{value.toFixed(d)}</>;
}

function SizeFormat({ value }: { value: number }) {
  if (value >= 1_000_000) return <>{(value / 1_000_000).toFixed(2)}M</>;
  if (value >= 1_000) return <>{(value / 1_000).toFixed(2)}K</>;
  return <>{value.toFixed(value < 1 ? 4 : 2)}</>;
}

function OrderBookView({ symbol, protocol }: { symbol: string; protocol: string }) {
  const [book, setBook] = useState<{ bids: OrderLevel[]; asks: OrderLevel[] }>({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const coin = hlCoin(symbol, protocol);

  const load = useCallback(async () => {
    const data = await fetchOrderBook(coin);
    setBook(data);
    setLoading(false);
  }, [coin]);

  useEffect(() => {
    setLoading(true);
    load();
    intervalRef.current = setInterval(load, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  if (loading && book.bids.length === 0) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: SANS }}>Loading order book...</div>;
  }

  const maxTotal = Math.max(
    book.bids.length ? book.bids[book.bids.length - 1].total : 0,
    book.asks.length ? book.asks[book.asks.length - 1].total : 0,
    1
  );

  const headerStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.30)",
    fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.06em",
    padding: "0 0 6px",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "1px 0", fontSize: 11, fontFamily: MONO, position: "relative",
    height: 20, lineHeight: "20px",
  };

  return (
    <div style={{ display: "flex", gap: 2, height: "100%", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...headerStyle }}>
          <span>Price</span><span>Size</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {book.bids.slice(0, 12).map((b, i) => (
            <div key={i} style={rowStyle}>
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0,
                width: `${(b.total / maxTotal) * 100}%`,
                background: "rgba(34,197,94,0.08)",
                borderRadius: 2,
              }} />
              <span style={{ color: "#22C55E", position: "relative", zIndex: 1 }}><PriceFormat value={b.price} /></span>
              <span style={{ color: "rgba(255,255,255,0.50)", position: "relative", zIndex: 1 }}><SizeFormat value={b.size} /></span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 1, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", ...headerStyle }}>
          <span>Price</span><span>Size</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {book.asks.slice(0, 12).map((a, i) => (
            <div key={i} style={rowStyle}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${(a.total / maxTotal) * 100}%`,
                background: "rgba(239,68,68,0.08)",
                borderRadius: 2,
              }} />
              <span style={{ color: "#EF4444", position: "relative", zIndex: 1 }}><PriceFormat value={a.price} /></span>
              <span style={{ color: "rgba(255,255,255,0.50)", position: "relative", zIndex: 1 }}><SizeFormat value={a.size} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentTradesView({ symbol, protocol }: { symbol: string; protocol: string }) {
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const coin = hlCoin(symbol, protocol);

  const load = useCallback(async () => {
    const data = await fetchRecentTrades(coin);
    setTrades(data);
    setLoading(false);
  }, [coin]);

  useEffect(() => {
    setLoading(true);
    load();
    intervalRef.current = setInterval(load, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  if (loading && trades.length === 0) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: SANS }}>Loading trades...</div>;
  }

  return (
    <div style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 0 6px", fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.30)", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        <span>Price</span><span>Size</span><span>Time</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {trades.slice(0, 20).map((t, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5px 0", fontSize: 11, fontFamily: MONO, height: 19, lineHeight: "19px" }}>
            <span style={{ color: t.side === "buy" ? "#22C55E" : "#EF4444", flex: 1 }}><PriceFormat value={t.price} /></span>
            <span style={{ color: "rgba(255,255,255,0.50)", flex: 1, textAlign: "center" }}><SizeFormat value={t.size} /></span>
            <span style={{ color: "rgba(255,255,255,0.25)", flex: 0, minWidth: 55, textAlign: "right", fontSize: 10 }}>{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FundingView({ fundingRate, currentPrice }: { fundingRate?: number | null; currentPrice?: number | null }) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const hour = 3600000;
      const next = Math.ceil(now / hour) * hour;
      const diff = next - now;
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${m}m ${s.toString().padStart(2, "0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const rate = fundingRate ?? 0;
  const annualized = rate * 3 * 365;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>Current Rate</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: rate >= 0 ? "#22C55E" : "#EF4444", fontFamily: MONO }}>
          {rate >= 0 ? "+" : ""}{rate.toFixed(4)}%
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>Annualized</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: annualized >= 0 ? "#22C55E" : "#EF4444", fontFamily: MONO }}>
          {annualized >= 0 ? "+" : ""}{annualized.toFixed(2)}%
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>Next Funding</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#D4A574", fontFamily: MONO }}>{countdown}</span>
      </div>
      {currentPrice && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>Mark Price</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#E6EDF3", fontFamily: MONO }}>
            ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: currentPrice < 10 ? 4 : 2 })}
          </span>
        </div>
      )}
      <div style={{ marginTop: 4, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", fontFamily: SANS, lineHeight: 1.5 }}>
          Funding is exchanged between long and short holders every hour. Positive rate means longs pay shorts.
        </span>
      </div>
    </div>
  );
}

type DataTab = "book" | "trades" | "funding";

export default function MarketDataPanel({ symbol, protocol, isMobile, currentPrice, fundingRate, defaultTab = "book" }: MarketDataPanelProps) {
  const [tab, setTab] = useState<DataTab>(defaultTab);

  const tabs: { key: DataTab; label: string }[] = [
    { key: "book", label: "Book" },
    { key: "trades", label: "Trades" },
    { key: "funding", label: "Funding" },
  ];

  return (
    <div
      data-testid="market-data-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: isMobile ? "#000" : "transparent",
        overflow: "hidden",
      }}
    >
      <div style={{
        display: "flex",
        gap: 0,
        padding: isMobile ? "8px 12px 0" : "0 0 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        {tabs.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              data-testid={`data-tab-${t.key}`}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderBottom: active ? "2px solid #D4A574" : "2px solid transparent",
                background: "transparent",
                color: active ? "#E6EDF3" : "rgba(255,255,255,0.32)",
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                fontFamily: SANS,
                cursor: "pointer",
                transition: "color 0.12s, border-color 0.12s",
                letterSpacing: "-0.01em",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{
        flex: 1,
        minHeight: 0,
        overflow: isMobile ? "auto" : "hidden",
        padding: isMobile ? "12px" : "10px 8px",
      }}>
        {tab === "book" && <OrderBookView symbol={symbol} protocol={protocol} />}
        {tab === "trades" && <RecentTradesView symbol={symbol} protocol={protocol} />}
        {tab === "funding" && <FundingView fundingRate={fundingRate} currentPrice={currentPrice} />}
      </div>
    </div>
  );
}
