"use client";

import { useEffect, useRef, useState } from "react";

const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', monospace";

const CSS = `
@keyframes cwRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes cwPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.06); } }
@keyframes cwShimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
@keyframes cwFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
`;

interface ConnectWalletEmblemProps {
  onClick: () => void;
  variant?: "full" | "compact";
  label?: string;
}

function MonRing({ size, gap, dashLen, dashGap, color, speed, reverse }: {
  size: number; gap: number; dashLen: number; dashGap: number;
  color: string; speed: number; reverse?: boolean;
}) {
  const r = size / 2 - gap;
  const circ = Math.PI * 2 * r;
  return (
    <svg width={size} height={size} style={{
      position: "absolute", inset: 0, animation: `cwRotate ${speed}s linear infinite${reverse ? " reverse" : ""}`,
    }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color}
        strokeWidth="1"
        strokeDasharray={`${dashLen} ${dashGap}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CardinalDots({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  const c = size / 2;
  const r = size / 2 - 4;
  const positions = [
    { x: c, y: c - r },
    { x: c + r, y: c },
    { x: c, y: c + r },
    { x: c - r, y: c },
  ];
  return (
    <svg width={size} height={size} style={{ position: "absolute", inset: 0, opacity }}>
      {positions.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
      ))}
    </svg>
  );
}

export function ConnectWalletEmblem({ onClick, variant = "full", label }: ConnectWalletEmblemProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  if (variant === "compact") {
    const SZ = 32;
    return (
      <>
        <style>{CSS}</style>
        <button
          onClick={onClick}
          data-testid="button-connect-wallet-emblem-compact"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setPressed(false); }}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            transition: "opacity 0.15s",
            opacity: pressed ? 0.7 : 1,
          }}
        >
          <div style={{
            position: "relative", width: SZ, height: SZ, flexShrink: 0,
          }}>
            <MonRing size={SZ} gap={1} dashLen={3} dashGap={4} color="rgba(212,165,116,0.35)" speed={12} />
            <MonRing size={SZ} gap={5} dashLen={8} dashGap={3} color="rgba(212,165,116,0.20)" speed={20} reverse />
            <div style={{
              position: "absolute", inset: 7,
              borderRadius: "50%",
              background: hovered
                ? "radial-gradient(circle, rgba(212,165,116,0.18) 0%, rgba(212,165,116,0.04) 100%)"
                : "radial-gradient(circle, rgba(212,165,116,0.08) 0%, transparent 100%)",
              boxShadow: hovered ? "0 0 14px rgba(212,165,116,0.30)" : "0 0 8px rgba(212,165,116,0.15)",
              transition: "all 0.25s",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <img
                src="/brand-mark.png"
                alt="Azabu"
                style={{
                  width: "90%", height: "90%", objectFit: "contain",
                  filter: "sepia(1) saturate(1.6) hue-rotate(330deg) brightness(1.1)",
                  opacity: hovered ? 0.95 : 0.75,
                  transition: "opacity 0.2s",
                }}
              />
            </div>
            <CardinalDots size={SZ} color="#D4A574" opacity={hovered ? 0.6 : 0.3} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{
              fontSize: 12, fontWeight: 600, fontFamily: SANS,
              color: hovered ? "#D4A574" : "rgba(255,255,255,0.75)",
              letterSpacing: "0.02em",
              transition: "color 0.15s",
              whiteSpace: "nowrap",
            }}>
              {label || "Connect Wallet"}
            </span>
            <span style={{
              fontSize: 9, fontFamily: MONO, color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              EVM • Arbitrum
            </span>
          </div>
        </button>
      </>
    );
  }

  const SZ = 100;
  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, animation: "cwFadeIn 0.4s ease" }}>
        <button
          onClick={onClick}
          data-testid="button-connect-wallet-emblem"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setPressed(false); }}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
            background: "none", border: "none", cursor: "pointer", padding: 0,
            transform: pressed ? "scale(0.97)" : "scale(1)",
            transition: "transform 0.12s",
          }}
        >
          <div style={{ position: "relative", width: SZ, height: SZ }}>
            <MonRing size={SZ} gap={0} dashLen={4} dashGap={6} color="rgba(212,165,116,0.22)" speed={25} />
            <MonRing size={SZ} gap={6} dashLen={12} dashGap={4} color="rgba(212,165,116,0.30)" speed={14} reverse />
            <MonRing size={SZ} gap={13} dashLen={2} dashGap={3} color="rgba(212,165,116,0.18)" speed={35} />

            <div style={{
              position: "absolute", inset: 18,
              borderRadius: "50%",
              border: `1px solid rgba(212,165,116,${hovered ? 0.45 : 0.25})`,
              background: hovered
                ? "radial-gradient(circle at 50% 40%, rgba(212,165,116,0.18) 0%, rgba(212,165,116,0.05) 60%, transparent 100%)"
                : "radial-gradient(circle at 50% 40%, rgba(212,165,116,0.10) 0%, transparent 70%)",
              boxShadow: hovered
                ? "0 0 28px rgba(212,165,116,0.40), inset 0 0 18px rgba(212,165,116,0.10)"
                : "0 0 16px rgba(212,165,116,0.20)",
              transition: "all 0.3s",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <img
                src="/brand-mark.png"
                alt="Azabu"
                style={{
                  width: "86%", height: "86%", objectFit: "contain",
                  filter: "sepia(1) saturate(1.8) hue-rotate(330deg) brightness(1.15)",
                  opacity: hovered ? 1 : 0.8,
                  transition: "opacity 0.2s",
                }}
              />
              {hovered && (
                <div style={{
                  position: "absolute", top: 0, left: "-30%", width: "30%", height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(232,196,160,0.25), transparent)",
                  animation: "cwShimmer 0.7s ease forwards",
                }} />
              )}
            </div>

            <CardinalDots size={SZ} color="#D4A574" opacity={hovered ? 0.7 : 0.35} />

            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              animation: hovered ? "none" : "cwPulse 2.8s ease-in-out infinite",
              boxShadow: "0 0 22px rgba(212,165,116,0.18)",
              pointerEvents: "none",
            }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 24px",
              borderRadius: 12,
              background: hovered
                ? "linear-gradient(135deg, rgba(212,165,116,0.18) 0%, rgba(212,165,116,0.08) 100%)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid rgba(212,165,116,${hovered ? 0.50 : 0.20})`,
              boxShadow: hovered ? "0 0 20px rgba(212,165,116,0.15)" : "none",
              transition: "all 0.2s",
              overflow: "hidden",
              position: "relative",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="14" rx="3" stroke="#D4A574" strokeWidth="1.5" />
                <path d="M16 13a1 1 0 100-2 1 1 0 000 2z" fill="#D4A574" />
                <path d="M6 6V4a2 2 0 012-2h10" stroke="#D4A574" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{
                fontSize: 13, fontWeight: 700, fontFamily: SANS,
                color: hovered ? "#E8C4A0" : "#D4A574",
                letterSpacing: "0.06em", textTransform: "uppercase",
                transition: "color 0.15s",
              }}>
                {label || "Connect Wallet"}
              </span>
            </div>
            <span style={{
              fontSize: 10, fontFamily: MONO, color: "rgba(255,255,255,0.20)",
              letterSpacing: "0.14em", textTransform: "uppercase",
            }}>
              EVM · Arbitrum · Hyperliquid
            </span>
          </div>
        </button>
      </div>
    </>
  );
}
