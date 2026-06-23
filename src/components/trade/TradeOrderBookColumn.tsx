"use client";

import { useEffect, useState, memo } from "react";
import { genBook, type BookData } from "@/components/perps/TerminalPanels";
import { tradePageTokens as T } from "./tradePageTokens";

interface BookLevel { p: number; s: number; }

const ASK_COLOR = "#E88B8B";
const ASK_BAR = "rgba(255, 77, 77, 0.16)";
const BID_BAR = "rgba(0, 192, 135, 0.14)";

function fmtBookPrice(p: number): string {
  if (p >= 1000) return p.toFixed(2);
  if (p >= 1) return p.toFixed(3);
  return p.toFixed(4);
}

function fmtBookSize(s: number): string {
  return s.toFixed(2);
}

function BookRow({ price, size, side, maxSize }: { price: number; size: number; side: "ask" | "bid"; maxSize: number }) {
  const pct = maxSize > 0 ? (size / maxSize) * 100 : 0;
  const priceColor = side === "bid" ? T.green : ASK_COLOR;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        padding: "1px 12px",
        position: "relative",
        fontFamily: T.mono,
        fontSize: 11,
        lineHeight: "18px",
        height: 18,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: side === "bid" ? BID_BAR : ASK_BAR,
        }}
      />
      <span style={{ color: priceColor, zIndex: 1, position: "relative", fontVariantNumeric: "tabular-nums" }}>
        {fmtBookPrice(price)}
      </span>
      <span
        style={{
          color: T.white,
          textAlign: "right",
          zIndex: 1,
          position: "relative",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtBookSize(size)}
      </span>
    </div>
  );
}

interface TradeOrderBookColumnProps {
  symbol: string;
  chain: string;
  currentPrice: number;
}

function TradeOrderBookColumnInner({ symbol, chain, currentPrice }: TradeOrderBookColumnProps) {
  const [book, setBook] = useState<BookData | null>(null);

  useEffect(() => {
    const mid = currentPrice > 0 ? currentPrice : 100;
    setBook(genBook(mid));
  }, [symbol, currentPrice]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;

    const fetchBook = async () => {
      try {
        const coin = symbol.replace(/-PERP$/i, "").replace(/USDT$/i, "");
        const res = await fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "l2Book", coin }),
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return;
        const data = await res.json();
        const levels = data.levels || [[], []];
        const bids: BookLevel[] = (levels[0] || []).slice(0, 14).map((l: { px: string; sz: string }) => ({ p: parseFloat(l.px), s: parseFloat(l.sz) }));
        const asks: BookLevel[] = (levels[1] || []).slice(0, 14).map((l: { px: string; sz: string }) => ({ p: parseFloat(l.px), s: parseFloat(l.sz) }));
        if (!cancelled && bids.length && asks.length) setBook({ bids, asks });
      } catch { /* keep fallback */ }
    };

    fetchBook();
    const iv = setInterval(fetchBook, 4000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [symbol, chain]);

  const data = book ?? genBook(currentPrice || 100);
  const maxSize = Math.max(...data.bids.map((b) => b.s), ...data.asks.map((a) => a.s), 1);
  const bestAsk = data.asks.length ? Math.min(...data.asks.map((a) => a.p)) : 0;
  const bestBid = data.bids.length ? Math.max(...data.bids.map((b) => b.p)) : 0;
  const mid = currentPrice > 0 ? currentPrice : bestAsk && bestBid ? (bestAsk + bestBid) / 2 : 0;
  const spreadPct = bestAsk > 0 && bestBid > 0 ? ((bestAsk - bestBid) / bestAsk) * 100 : 0;

  const asks = [...data.asks].reverse().slice(0, 14);
  const bids = data.bids.slice(0, 14);

  return (
    <div
      data-testid="trade-orderbook-column"
      style={{
        width: T.orderBookWidth,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: T.bg,
        borderRight: `1px solid ${T.stroke}`,
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "10px 12px 6px",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: T.white,
          fontFamily: T.sans,
          textTransform: "uppercase",
        }}
      >
        Order Book
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "2px 12px 6px" }}>
        <span style={{ fontSize: 9, fontWeight: 500, color: T.label, fontFamily: T.sans, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Price
        </span>
        <span style={{ fontSize: 9, fontWeight: 500, color: T.label, fontFamily: T.sans, letterSpacing: "0.08em", textAlign: "right", textTransform: "uppercase" }}>
          Size
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {asks.map((a, i) => (
            <BookRow key={`a${i}`} price={a.p} size={a.s} side="ask" maxSize={maxSize} />
          ))}
        </div>

        <div
          data-testid="trade-orderbook-spread"
          style={{
            padding: "7px 12px",
            borderTop: `1px solid ${T.stroke}`,
            borderBottom: `1px solid ${T.stroke}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: T.mono, fontVariantNumeric: "tabular-nums" }}>
            ${mid > 0 ? mid.toFixed(4) : "—"}
          </span>
          <span style={{ fontSize: 9, color: T.label, fontFamily: T.mono, fontVariantNumeric: "tabular-nums" }}>
            {spreadPct > 0 ? `${spreadPct.toFixed(2)}%` : "0.00%"}
          </span>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {bids.map((b, i) => (
            <BookRow key={`b${i}`} price={b.p} size={b.s} side="bid" maxSize={maxSize} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(TradeOrderBookColumnInner);
