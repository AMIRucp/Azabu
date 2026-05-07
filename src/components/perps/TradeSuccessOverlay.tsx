"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

export interface CelebrationTrade {
  side: "long" | "short";
  sym: string;
  lev: number;
  posValue: number;
  entryPrice: number;
}

interface TradeSuccessOverlayProps {
  trade: CelebrationTrade;
  onDismiss: () => void;
}

function canvasRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function generateShareCard(trade: CelebrationTrade): string {
  const W = 800;
  const H = 420;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const isLong = trade.side === "long";
  const accent = isLong ? "#00d492" : "#ef4461";
  const accentDim = isLong ? "rgba(0,212,146,0.12)" : "rgba(239,68,97,0.12)";

  const grd = ctx.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, "#08080c");
  grd.addColorStop(0.6, "#0f0f14");
  grd.addColorStop(1, "#111118");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  const aGrd = ctx.createRadialGradient(
    isLong ? W * 0.8 : W * 0.2, 0, 0,
    isLong ? W * 0.8 : W * 0.2, 0, H * 0.8,
  );
  aGrd.addColorStop(0, isLong ? "rgba(0,212,146,0.07)" : "rgba(239,68,97,0.07)");
  aGrd.addColorStop(1, "transparent");
  ctx.fillStyle = aGrd;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  ctx.font = `bold 11px ${mono}`;
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText("AZABU", 40, 46);

  const badgeX = 40;
  const badgeY = 74;
  const badgeW = 116;
  const badgeH = 36;
  canvasRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
  ctx.fillStyle = accentDim;
  ctx.fill();
  ctx.strokeStyle = accent + "44";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = `bold 14px ${mono}`;
  ctx.fillStyle = accent;
  ctx.fillText(isLong ? "LONG" : "SHORT", badgeX + 18, badgeY + 23);

  ctx.font = `bold 72px ${mono}`;
  ctx.fillStyle = "#e4e4ec";
  ctx.fillText(trade.sym, 40, 204);

  ctx.font = `600 22px ${mono}`;
  ctx.fillStyle = accent;
  ctx.fillText(`${trade.lev}x Leverage`, 40, 248);

  ctx.font = `500 15px ${mono}`;
  ctx.fillStyle = "#7a7a90";
  ctx.fillText(`Size  $${trade.posValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, 40, 306);
  ctx.fillText(`Entry  $${trade.entryPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, 40, 334);

  ctx.font = `500 12px ${mono}`;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillText("azabu.io  ·  Multi-Protocol Perps", 40, H - 26);

  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(W - 40 - i * 18, H - 30, 5 - i * 0.5, 0, Math.PI * 2);
    const opacity = (40 - i * 8).toString(16).padStart(2, "0");
    ctx.fillStyle = accent + opacity;
    ctx.fill();
  }

  return canvas.toDataURL("image/png");
}

export default function TradeSuccessOverlay({ trade, onDismiss }: TradeSuccessOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setAnimIn(true), 20);
    timerRef.current = setTimeout(() => handleDismiss(), 5000);
    return () => {
      clearTimeout(t1);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnimIn(false);
    setTimeout(onDismiss, 280);
  };

  const handleShare = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const dataUrl = generateShareCard(trade);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `azabu-${trade.sym}-${trade.side}.png`;
    a.click();
  };

  const isLong = trade.side === "long";
  const accent = isLong ? "#00d492" : "#ef4461";
  const accentDim = isLong ? "rgba(0,212,146,0.08)" : "rgba(239,68,97,0.08)";
  const accentBorder = isLong ? "rgba(0,212,146,0.2)" : "rgba(239,68,97,0.2)";

  if (!mounted || typeof document === "undefined") return null;

  const overlay = (
    <div
      data-testid="trade-success-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(8,8,12,0.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transition: "opacity 0.28s ease",
        opacity: animIn ? 1 : 0,
      }}
      onClick={handleDismiss}
    >
      <style>{`
        @keyframes celebScale {
          0% { transform: scale(0.82); opacity: 0; }
          60% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes celebPulse {
          0% { box-shadow: 0 0 0 0 ${accent}30; }
          50% { box-shadow: 0 0 0 24px ${accent}00; }
          100% { box-shadow: 0 0 0 0 ${accent}00; }
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(360px, 90vw)",
          background: "#0d0d14",
          border: `1px solid ${accentBorder}`,
          borderRadius: 20,
          padding: "32px 28px 24px",
          position: "relative",
          overflow: "hidden",
          animation: animIn
            ? "celebScale 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards, celebPulse 1.2s ease-out 0.35s"
            : "none",
        }}
      >
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at ${isLong ? "80% 20%" : "20% 20%"}, ${accentDim} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            borderRadius: 8,
            background: accentDim,
            border: `1px solid ${accentBorder}`,
            marginBottom: 20,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: accent,
              fontFamily: mono,
              letterSpacing: "0.1em",
            }}>
              {isLong ? "▲ LONG" : "▼ SHORT"}
            </span>
          </div>

          <div style={{
            fontSize: 44,
            fontWeight: 800,
            color: "#e4e4ec",
            fontFamily: mono,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 6,
          }} data-testid="celebration-market">
            {trade.sym}
          </div>

          <div style={{
            fontSize: 22,
            fontWeight: 700,
            color: accent,
            fontFamily: mono,
            letterSpacing: "0.02em",
            marginBottom: 24,
          }} data-testid="celebration-leverage">
            {trade.lev}x
          </div>

          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            marginBottom: 28,
          }}>
            {[
              { label: "Size", value: `$${trade.posValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, testId: "celebration-size" },
              { label: "Entry", value: `$${trade.entryPrice.toLocaleString("en-US", { maximumFractionDigits: trade.entryPrice >= 100 ? 2 : 4 })}`, testId: "celebration-entry" },
            ].map(({ label, value, testId }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#7a7a90", fontFamily: mono, letterSpacing: "0.06em", marginBottom: 4, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4ec", fontFamily: mono }} data-testid={testId}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              data-testid="celebration-share-btn"
              onClick={handleShare}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 10,
                border: `1px solid ${accentBorder}`,
                background: accentDim,
                color: accent,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: mono,
                cursor: "pointer",
                letterSpacing: "0.04em",
                transition: "opacity 0.12s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              Share Trade
            </button>
            <button
              data-testid="celebration-dismiss-btn"
              onClick={handleDismiss}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "#7a7a90",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: mono,
                cursor: "pointer",
                letterSpacing: "0.04em",
                transition: "opacity 0.12s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
