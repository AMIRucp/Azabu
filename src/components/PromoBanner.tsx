"use client";

import { useState, useEffect, useCallback } from "react";

const CMC = (id: number) => `https://s2.coinmarketcap.com/static/img/coins/128x128/${id}.png`;

interface PromoSlide {
  symbol: string;
  name: string;
  leverage: string;
  color: string;
  icon: string;
  pair: string;
}

const SLIDES: PromoSlide[] = [
  { symbol: "BTC", name: "Bitcoin", leverage: "200x", color: "#F7931A", icon: CMC(1), pair: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", leverage: "200x", color: "#627EEA", icon: CMC(1027), pair: "ETHUSDT" },
  { symbol: "BNB", name: "BNB", leverage: "200x", color: "#F0B90B", icon: CMC(1839), pair: "BNBUSDT" },
  { symbol: "XRP", name: "XRP", leverage: "100x", color: "#23A3C9", icon: CMC(52), pair: "XRPUSDT" },
  { symbol: "SOL", name: "Solana", leverage: "125x", color: "#9945FF", icon: CMC(5426), pair: "SOLUSDT" },
  { symbol: "DOGE", name: "Dogecoin", leverage: "75x", color: "#C3A634", icon: CMC(74), pair: "DOGEUSDT" },
  { symbol: "NVDA", name: "Nvidia", leverage: "10x", color: "#76B900", icon: "/assets/nvidia-coin.png", pair: "NVDAUSDT" },
];

export default function PromoBanner({ onTradeClick }: { onTradeClick?: (pair: string) => void }) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const advance = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setIndex(i => (i + 1) % SLIDES.length);
      setFading(false);
    }, 300);
  }, []);

  useEffect(() => {
    const iv = setInterval(advance, 6000);
    return () => clearInterval(iv);
  }, [advance]);

  if (dismissed) return null;

  const slide = SLIDES[index];

  return (
    <div
      data-testid="promo-banner"
      style={{
        position: "relative",
        width: "100%",
        height: 56,
        background: "linear-gradient(135deg, #0C0C10 0%, #111118 40%, #0E0E14 100%)",
        borderBottom: "1px solid #1B2030",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => {
        if (onTradeClick) {
          localStorage.setItem("afx_preselect_market", slide.pair);
          onTradeClick(slide.pair);
        }
      }}
    >
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse 60% 120% at 85% 50%, ${slide.color}08 0%, transparent 70%)`,
        transition: "background 0.5s ease",
      }} />

      <div style={{
        position: "relative",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "0 48px 0 20px",
        maxWidth: 900,
        margin: "0 auto",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: `0 0 20px ${slide.color}30, 0 0 40px ${slide.color}15`,
          border: `1px solid ${slide.color}40`,
        }}>
          <img
            src={slide.icon}
            alt={slide.symbol}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: "#9BA4AE",
            letterSpacing: "0.01em",
          }}>
            Trade
          </span>
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "#E4E4E7",
            letterSpacing: "0.01em",
          }}>
            {slide.name}
          </span>
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: "#9BA4AE",
          }}>
            with up to
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 16,
            fontWeight: 700,
            color: slide.color,
            letterSpacing: "-0.02em",
            textShadow: `0 0 12px ${slide.color}50`,
          }}>
            {slide.leverage}
          </span>
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: "#9BA4AE",
          }}>
            Leverage
          </span>
        </div>

        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: "#6B7280",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
        }}>
          Only on AFX
        </span>
      </div>

      <div style={{
        position: "absolute",
        bottom: 4,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 4,
      }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            data-testid={`promo-dot-${i}`}
            onClick={e => { e.stopPropagation(); setIndex(i); }}
            style={{
              width: i === index ? 12 : 4,
              height: 3,
              borderRadius: 2,
              background: i === index ? slide.color : "#1B2030",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      <button
        data-testid="promo-dismiss"
        onClick={e => { e.stopPropagation(); setDismissed(true); }}
        style={{
          position: "absolute",
          top: "50%",
          right: 12,
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "#6B7280",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          lineHeight: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "#71717A"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#6B7280"; }}
      >
        &#x2715;
      </button>
    </div>
  );
}
