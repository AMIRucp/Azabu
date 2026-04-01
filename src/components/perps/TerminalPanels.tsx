"use client";
import { useState, useEffect, useRef, useCallback, memo } from "react";

const T = {
  bg: "#08080c",
  bgCard: "#0f0f14",
  bgEl: "#16161e",
  bgHover: "#1c1c28",
  bgInput: "#111118",
  border: "#1a1a24",
  borderSub: "#131318",
  text: "#e4e4ec",
  text2: "#7a7a90",
  text3: "#44445a",
  green: "#00d492",
  greenDim: "rgba(0,212,146,0.10)",
  greenFade: "rgba(0,212,146,0.12)",
  red: "#ef4461",
  redDim: "rgba(239,68,97,0.10)",
  redFade: "rgba(239,68,97,0.12)",
  orange: "#f97316",
  orangeDim: "rgba(249,115,22,0.10)",
  yellow: "#eab308",
};

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

interface BookLevel {
  p: number;
  s: number;
}

export interface BookData {
  bids: BookLevel[];
  asks: BookLevel[];
}

export interface TradeEntry {
  time: string;
  price: number;
  size: string;
  side: "buy" | "sell";
}

export interface DepthData {
  bids: { p: number; s: number }[];
  asks: { p: number; s: number }[];
}

interface MarketData {
  sym: string;
  price: number;
  [key: string]: any;
}

export const genBook = (mid = 2020.76): BookData => {
  const b: BookLevel[] = [];
  const a: BookLevel[] = [];
  for (let i = 0; i < 15; i++) {
    b.push({ p: mid - (i * 0.18 + Math.random() * 0.08), s: Math.random() * 14 + 0.3 });
    a.push({ p: mid + (i * 0.18 + Math.random() * 0.08), s: Math.random() * 14 + 0.3 });
  }
  return { bids: b, asks: a };
};

export const genTrades = (base = 2020.5): TradeEntry[] => {
  const t: TradeEntry[] = [];
  let p = base;
  const now = Date.now();
  for (let i = 0; i < 30; i++) {
    p += (Math.random() - 0.5) * 0.8;
    t.push({
      time: new Date(now - i * 1100).toLocaleTimeString("en-US", { hour12: false }),
      price: Math.max(p, base * 0.99),
      size: (Math.random() * 0.06 + 0.0001).toFixed(4),
      side: Math.random() > 0.45 ? "buy" : "sell",
    });
  }
  return t;
};

export const genDepth = (mid = 2020): DepthData => {
  const b: { p: number; s: number }[] = [];
  const a: { p: number; s: number }[] = [];
  let cb = 0;
  let ca = 0;
  for (let i = 0; i < 40; i++) {
    cb += Math.random() * 500 + 50;
    ca += Math.random() * 500 + 50;
    b.push({ p: mid - i * 5, s: cb });
    a.push({ p: mid + i * 5, s: ca });
  }
  return { bids: b.reverse(), asks: a };
};

const OrderBookRow = memo(function OrderBookRow({ data, side, mx }: { data: BookLevel; side: "bid" | "ask"; mx: number }) {
  const pct = (data.s / mx) * 100;
  const col = side === "bid" ? T.green : T.red;
  const bg = side === "bid" ? T.greenFade : T.redFade;
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={rowRef}
      data-testid={`terminal-orderbook-${side}-row`}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        padding: "2.5px 12px",
        position: "relative",
        cursor: "pointer",
      }}
      onMouseEnter={() => { if (rowRef.current) rowRef.current.style.background = T.bgHover; }}
      onMouseLeave={() => { if (rowRef.current) rowRef.current.style.background = "transparent"; }}
    >
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: bg,
        }}
      />
      <span style={{ fontSize: 11, color: col, fontFamily: mono, zIndex: 1, position: "relative" }}>
        {data.p.toFixed(2)}
      </span>
      <span style={{ fontSize: 11, color: T.text2, fontFamily: mono, textAlign: "center", zIndex: 1, position: "relative" }}>
        {data.s.toFixed(4)}
      </span>
      <span style={{ fontSize: 11, color: T.text2, fontFamily: mono, textAlign: "right", zIndex: 1, position: "relative" }}>
        {(data.p * data.s).toFixed(2)}
      </span>
    </div>
  );
});

interface OrderBookProps {
  book: BookData;
  market: MarketData;
  marketSymbol?: string;
  chain?: string;
}

function OrderBookInner({ book: fallbackBook, market, marketSymbol, chain }: OrderBookProps) {
  const [liveBook, setLiveBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!marketSymbol || chain === "arbitrum") {
      setLiveBook(null);
      return;
    }

    setLoading(true);
    const isAsterSym = marketSymbol.endsWith("USDT");

    const fetchBook = async () => {
      try {
        let res: Response;
        if (isAsterSym) {
          res = await fetch(`/api/aster/orderbook?symbol=${marketSymbol}&limit=20`);
        } else {
          const sym = marketSymbol.replace(/-PERP$/, "").replace(/-USD$/, "").replace(/^1M/, "");
          res = await fetch(`/api/drift/orderbook?market=${sym}&depth=15`);
        }
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.bids && data.asks) {
          const bids: BookLevel[] = data.bids.map((b: any) => ({ p: b.price, s: b.size }));
          const asks: BookLevel[] = data.asks.map((a: any) => ({ p: a.price, s: a.size }));
          setLiveBook({ bids, asks });
        }
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    fetchBook();
    const iv = setInterval(fetchBook, 4000);
    return () => clearInterval(iv);
  }, [chain, marketSymbol]);

  const book = liveBook || fallbackBook;
  const mx = Math.max(
    ...book.bids.map((b) => b.s),
    ...book.asks.map((a) => a.s),
    1
  );

  if (loading && !liveBook) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.text3, fontFamily: mono, fontSize: 12 }}>
        Loading orderbook...
      </div>
    );
  }

  return (
    <div data-testid="terminal-orderbook" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderBottom: `1px solid ${T.borderSub}` }}>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 10, color: T.text2, fontFamily: mono }}>USD</span>
          <span style={{ fontSize: 10, color: T.text2, fontFamily: mono }}>Total</span>
        </div>
        <span style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>Group by 0.10</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "4px 12px", borderBottom: `1px solid ${T.borderSub}` }}>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: mono }}>Price</span>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: mono, textAlign: "center" }}>Size</span>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: mono, textAlign: "right" }}>Total</span>
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {[...book.asks].reverse().slice(0, 8).map((a, i) => (
          <OrderBookRow key={`a${i}`} data={a} side="ask" mx={mx} />
        ))}
      </div>
      {(() => {
        const bestAsk = book.asks.length > 0 ? Math.min(...book.asks.map(a => a.p)) : 0;
        const bestBid = book.bids.length > 0 ? Math.max(...book.bids.map(b => b.p)) : 0;
        const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
        const spreadPct = bestAsk > 0 ? (spread / bestAsk) * 100 : 0;
        const displayPrice = market.price > 0 ? market.price : (bestAsk > 0 && bestBid > 0 ? (bestAsk + bestBid) / 2 : 0);
        return (
          <div
            data-testid="terminal-orderbook-spread"
            style={{
              padding: "5px 12px",
              borderTop: `1px solid ${T.border}`,
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: T.bgCard,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: T.green, fontFamily: mono }}>
              {displayPrice > 0 ? displayPrice.toFixed(2) : "--"}
            </span>
            <span style={{ fontSize: 10, color: T.text3, fontFamily: mono }}>
              Spread {spread > 0 ? `$${spread.toFixed(2)} (${spreadPct.toFixed(3)}%)` : "--"}
            </span>
          </div>
        );
      })()}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {book.bids.slice(0, 8).map((b, i) => (
          <OrderBookRow key={`b${i}`} data={b} side="bid" mx={mx} />
        ))}
      </div>
    </div>
  );
}

export const OrderBook = memo(OrderBookInner);

interface TradesProps {
  trades: TradeEntry[];
}

function TradesInner({ trades }: TradesProps) {
  return (
    <div data-testid="terminal-trades" style={{ height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderBottom: `1px solid ${T.borderSub}` }}>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 10, color: T.text, fontFamily: mono }}>All Trades</span>
        </div>
        <span style={{ fontSize: 10, color: T.text2, fontFamily: mono }}>Sort by All</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "4px 12px", borderBottom: `1px solid ${T.borderSub}` }}>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: mono }}>Time</span>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: mono, textAlign: "center" }}>Size</span>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: mono, textAlign: "right" }}>Price</span>
      </div>
      <div style={{ overflow: "auto", maxHeight: 350 }}>
        {trades.map((t, i) => (
          <div
            key={i}
            data-testid={`terminal-trade-row-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              padding: "3px 12px",
              borderBottom: i % 4 === 3 ? `1px solid ${T.borderSub}` : "none",
            }}
          >
            <span style={{ fontSize: 11, color: T.text2, fontFamily: mono }}>{t.time}</span>
            <span style={{ fontSize: 11, color: t.side === "buy" ? T.green : T.red, fontFamily: mono, textAlign: "center" }}>
              {t.size}
            </span>
            <span style={{ fontSize: 11, color: T.text2, fontFamily: mono, textAlign: "right" }}>
              {t.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Trades = memo(TradesInner);

interface DepthChartProps {
  depth: DepthData;
  market: MarketData;
}

function DepthChartInner({ depth, market }: DepthChartProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const r = cv.getBoundingClientRect();
    cv.width = r.width * dpr;
    cv.height = r.height * dpr;
    ctx.scale(dpr, dpr);
    const W = r.width;
    const H = r.height;
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    const pad = { l: 38, r: 38, t: 16, b: 26 };
    const cW = W - pad.l - pad.r;
    const cH = H - pad.t - pad.b;
    const allP = [...depth.bids.map((b) => b.p), ...depth.asks.map((a) => a.p)];
    const allS = [...depth.bids.map((b) => b.s), ...depth.asks.map((a) => a.s)];
    const minP = Math.min(...allP);
    const maxP = Math.max(...allP);
    const maxS = Math.max(...allS);
    const pX = (p: number) => pad.l + ((p - minP) / (maxP - minP)) * cW;
    const sY = (s: number) => pad.t + cH - (s / maxS) * cH;

    for (let i = 0; i <= 4; i++) {
      const s = (maxS / 4) * i;
      const y = sY(s);
      ctx.strokeStyle = T.borderSub;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = T.text3;
      ctx.font = `9px ${mono}`;
      ctx.textAlign = "left";
      ctx.fillText((s / 1000).toFixed(1) + "K", 2, y + 3);
      ctx.textAlign = "right";
      ctx.fillText((s / 1000).toFixed(1) + "K", W - 2, y + 3);
    }

    ctx.beginPath();
    ctx.moveTo(pX(depth.bids[0].p), sY(0));
    depth.bids.forEach((b) => ctx.lineTo(pX(b.p), sY(b.s)));
    ctx.lineTo(pX(depth.bids[depth.bids.length - 1].p), sY(0));
    ctx.closePath();
    const bg = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
    bg.addColorStop(0, "rgba(0,212,146,0.30)");
    bg.addColorStop(1, "rgba(0,212,146,0.03)");
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.beginPath();
    depth.bids.forEach((b, i) => {
      ctx[i ? "lineTo" : "moveTo"](pX(b.p), sY(b.s));
    });
    ctx.strokeStyle = T.green;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pX(depth.asks[0].p), sY(0));
    depth.asks.forEach((a) => ctx.lineTo(pX(a.p), sY(a.s)));
    ctx.lineTo(pX(depth.asks[depth.asks.length - 1].p), sY(0));
    ctx.closePath();
    const ag = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
    ag.addColorStop(0, "rgba(239,68,97,0.30)");
    ag.addColorStop(1, "rgba(239,68,97,0.03)");
    ctx.fillStyle = ag;
    ctx.fill();
    ctx.beginPath();
    depth.asks.forEach((a, i) => {
      ctx[i ? "lineTo" : "moveTo"](pX(a.p), sY(a.s));
    });
    ctx.strokeStyle = T.red;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = T.text3;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pX(market.price), pad.t);
    ctx.lineTo(pX(market.price), pad.t + cH);
    ctx.stroke();
    ctx.setLineDash([]);

    [minP, market.price, maxP].forEach((p) => {
      ctx.fillStyle = T.text3;
      ctx.font = `9px ${mono}`;
      ctx.textAlign = "center";
      ctx.fillText(p.toFixed(2), pX(p), H - 6);
    });
  }, [depth, market]);

  return (
    <canvas
      ref={ref}
      data-testid="terminal-depth-chart"
      style={{ width: "100%", height: "100%", display: "block", background: T.bg }}
    />
  );
}

export const DepthChart = memo(DepthChartInner);

function FundingInner() {
  const ref = useRef<HTMLCanvasElement>(null);
  const data = [
    { r: 0.0009 }, { r: 0.0008 }, { r: 0.0011 }, { r: -0.0002 }, { r: 0.0007 }, { r: 0.0005 },
    { r: -0.0015 }, { r: -0.0032 }, { r: -0.0041 }, { r: -0.0028 }, { r: 0.0003 }, { r: 0.0009 },
    { r: 0.0006 }, { r: -0.0008 }, { r: 0.001 }, { r: 0.0004 }, { r: -0.002 }, { r: -0.0035 },
  ];

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const r = cv.getBoundingClientRect();
    cv.width = r.width * dpr;
    cv.height = r.height * dpr;
    ctx.scale(dpr, dpr);
    const W = r.width;
    const H = r.height;
    ctx.fillStyle = T.bgCard;
    ctx.fillRect(0, 0, W, H);

    const pad = { l: 8, r: 52, t: 12, b: 22 };
    const rates = data.map((d) => d.r);
    const minR = Math.min(...rates, -0.004);
    const maxR = Math.max(...rates, 0.001);
    const rng = maxR - minR;
    const cW = W - pad.l - pad.r;
    const cH = H - pad.t - pad.b;
    const zY = pad.t + ((maxR - 0) / rng) * cH;

    ctx.strokeStyle = T.text3;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(pad.l, zY);
    ctx.lineTo(W - pad.r, zY);
    ctx.stroke();

    [maxR, 0, minR].forEach((rv) => {
      const y = pad.t + ((maxR - rv) / rng) * cH;
      ctx.fillStyle = T.text3;
      ctx.font = `9px ${mono}`;
      ctx.textAlign = "right";
      ctx.fillText((rv * 100).toFixed(3) + "%", W - 3, y + 3);
    });

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.l + (i / (data.length - 1)) * cW;
      const y = pad.t + ((maxR - d.r) / rng) * cH;
      ctx[i ? "lineTo" : "moveTo"](x, y);
    });
    ctx.strokeStyle = T.text;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ["3/2", "3/3", "3/5", "3/6", "3/7", "3/8"].forEach((l, i, a) => {
      ctx.fillStyle = T.text3;
      ctx.font = `9px ${mono}`;
      ctx.textAlign = "center";
      ctx.fillText(l, pad.l + (i / (a.length - 1)) * cW, H - 5);
    });
  }, []);

  return (
    <div data-testid="terminal-funding" style={{ height: "100%", overflow: "auto", background: T.bg }}>
      <div style={{ padding: 14 }}>
        {[
          { l: "Real-Time Funding Rate", v: "0.0009%", bold: true, col: T.green },
          { l: "Interval", v: "1h", bold: false, col: undefined },
          { l: "Next Funding Countdown", v: "25:09", bold: false, col: undefined },
        ].map((r) => (
          <div
            key={r.l}
            data-testid={`terminal-funding-${r.l.replace(/\s+/g, "-").toLowerCase()}`}
            style={{ display: "flex", justifyContent: "space-between", marginBottom: r.bold ? 12 : 5 }}
          >
            <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 400, color: r.bold ? T.text : T.text2, fontFamily: mono }}>
              {r.l}
            </span>
            <span style={{ fontSize: r.bold ? 13 : 11, fontWeight: r.bold ? 700 : 500, color: r.col || T.text, fontFamily: mono }}>
              {r.v}
            </span>
          </div>
        ))}
        <div style={{ height: 1, background: T.border, margin: "10px 0" }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: mono, marginBottom: 8 }}>
          Funding Rate Period
        </div>
        {[
          { l: "7 Days", v: "0.1512%" },
          { l: "30 Days", v: "0.6480%" },
          { l: "Annualized", v: "7.8840%" },
        ].map((r) => (
          <div
            key={r.l}
            data-testid={`terminal-funding-period-${r.l.replace(/\s+/g, "-").toLowerCase()}`}
            style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}
          >
            <span style={{ fontSize: 11, color: T.text2, fontFamily: mono }}>{r.l}</span>
            <span style={{ fontSize: 11, color: T.text, fontWeight: 600, fontFamily: mono }}>{r.v}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: mono, marginBottom: 6 }}>
          Funding Rate Chart
        </div>
        <div style={{ height: 160, background: T.bgCard, borderRadius: 6, overflow: "hidden" }}>
          <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
      </div>
    </div>
  );
}

export const Funding = memo(FundingInner);

export { T as TerminalTheme, mono as terminalMono };
