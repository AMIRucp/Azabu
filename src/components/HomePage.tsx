"use client";

import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getIconWithJupiter } from "@/config/tokenIcons";
import { useJupiterLogos } from "@/hooks/useJupiterLogos";
import { useHyperliquidPortfolio } from "@/hooks/useHyperliquidPortfolio";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { ChevronRight } from "lucide-react";

const MONO = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

function navigateToPage(page: string, market?: string) {
  window.dispatchEvent(new CustomEvent("afx-navigate", { detail: { page, market } }));
}

// Mock data for demonstration - will be replaced with real data
const OPEN_POSITIONS = [
  { symbol: "BTC", pair: "BTC-PERP", side: "LONG", leverage: "50x", entry: 91840, mark: 93420, pnl: 68.40, pnlPercent: 1.57, size: 4200, color: "#F7931A" },
  { symbol: "ETH", pair: "ETH-PERP", side: "LONG", leverage: "20x", entry: 1820, mark: 1780, pnl: -39.60, pnlPercent: -2.2, size: 1800, color: "#627EEA" },
  { symbol: "SOL", pair: "SOL-PERP", side: "SHORT", leverage: "10x", entry: 142.10, mark: 138.20, pnl: 27.40, pnlPercent: 2.74, size: 960, color: "#14F195" },
];

const TRENDING_PERPS = [
  { symbol: "BTC", pair: "BTC / USDT", name: "Bitcoin", tag: "CRYPTO", price: 93420, change: 2.84, vol: "1.2B", oi: "480M", leverage: "200X", color: "#F7931A" },
  { symbol: "SOL", pair: "SOL / USDT", name: "Solana", tag: "CRYPTO", price: 138.20, change: 4.10, vol: "310M", oi: "190M", leverage: "100X", color: "#14F195" },
  { symbol: "DOGE", pair: "DOGE / USDT", name: "Dogecoin", tag: "MEME", price: 0.1621, change: -3.40, vol: "88M", oi: "41M", leverage: "50X", color: "#C2A633" },
];

const TODAYS_MOVERS = [
  { symbol: "SOL", pair: "SOL-PERP", name: "Solana", leverage: "100x", price: 138.20, change: 4.10, color: "#14F195" },
  { symbol: "BTC", pair: "BTC-PERP", name: "Bitcoin", leverage: "200x", price: 93420, change: 2.84, color: "#F7931A" },
  { symbol: "LINK", pair: "LINK-PERP", name: "Chainlink", leverage: "75x", price: 13.84, change: 1.60, color: "#2A5ADA" },
  { symbol: "GOLD", pair: "GOLD-PERP", name: "Gold", leverage: "50x", price: 3314, change: 0.91, color: "#FFD700" },
  { symbol: "AMZN", pair: "AMZN-PERP", name: "Amazon", leverage: "10x", price: 186.30, change: 0.44, color: "#FF9900" },
];

const LEADERBOARD_PREVIEW = [
  { rank: 1, name: "MiyamotoX", avatar: "MX", xp: "320k", color: "#F7931A" },
  { rank: 2, name: "ShogunBull", avatar: "SB", xp: "180k", color: "#14F195" },
  { rank: 3, name: "NinjaVault", avatar: "NV", xp: "95k", color: "#627EEA" },
];

function MiniSparkline({ color, seed, trend }: { color: string; seed: number; trend: "up" | "down" }) {
  const points = useMemo(() => {
    const pts: string[] = [];
    let y = 16;
    for (let i = 0; i < 30; i++) {
      const trendBias = trend === "up" ? -0.3 : 0.3;
      const noise = (Math.sin(i * 0.8 + seed * 2) + Math.random() * 0.5) * 2;
      y = Math.max(4, Math.min(28, y + trendBias + noise));
      pts.push(`${(i / 29) * 100},${y}`);
    }
    return pts.join(" ");
  }, [seed, trend]);

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`grad-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,32 ${points} 100,32`}
        fill={`url(#grad-${seed})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({ label, value, subValue, variant }: { 
  label: string; 
  value: string; 
  subValue?: string;
  variant?: "pnl-orange" | "pnl-purple" | "default" | "healthy";
}) {
  let background = "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))";
  let borderColor = "rgba(255,255,255,0.06)";
  let valueColor = "#E6EDF3";
  let subValueColor = "#6B7280";
  
  if (variant === "pnl-orange") {
    background = "linear-gradient(135deg, rgba(234,88,12,0.25) 0%, rgba(194,65,12,0.15) 50%, rgba(124,45,18,0.1) 100%)";
    borderColor = "rgba(234,88,12,0.2)";
    valueColor = "#22C55E";
  } else if (variant === "pnl-purple") {
    background = "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.1) 50%, rgba(76,29,149,0.08) 100%)";
    borderColor = "rgba(139,92,246,0.15)";
    valueColor = "#22C55E";
  } else if (variant === "healthy") {
    valueColor = "#E6EDF3";
    subValueColor = "#22C55E";
  }
  
  return (
    <div style={{
      padding: "16px 20px",
      borderRadius: 12,
      background,
      border: `1px solid ${borderColor}`,
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 500,
        color: "#6B7280",
        fontFamily: SANS,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22,
        fontWeight: 600,
        color: valueColor,
        fontFamily: MONO,
        letterSpacing: "-0.02em",
      }}>
        {value}
      </div>
      {subValue && (
        <div style={{
          fontSize: 11,
          color: subValueColor,
          fontFamily: MONO,
          marginTop: 4,
        }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

function PositionCard({ position }: { position: typeof OPEN_POSITIONS[0] }) {
  const jupLogos = useJupiterLogos();
  const icon = getIconWithJupiter(position.symbol, jupLogos);
  const isPositive = position.pnl >= 0;
  const isLong = position.side === "LONG";

  return (
    <div 
      onClick={() => navigateToPage("trade", `${position.symbol}USDT`)}
      style={{
        padding: "16px 18px",
        borderRadius: 12,
        background: "linear-gradient(145deg, rgba(20,25,35,0.9), rgba(10,14,19,0.95))",
        border: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "border-color 0.15s",
        minWidth: 220,
        flexShrink: 0,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon.type === "img" ? (
            <img src={icon.value} alt={position.symbol} style={{ width: 28, height: 28, borderRadius: "50%" }} />
          ) : (
            <div style={{ 
              width: 28, 
              height: 28, 
              borderRadius: "50%", 
              background: position.color, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: 11, 
              fontWeight: 700, 
              color: "#000" 
            }}>
              {icon.value}
            </div>
          )}
          <span style={{ fontSize: 14, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS }}>{position.pair}</span>
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: "4px 10px",
          borderRadius: 6,
          background: isLong ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
          color: isLong ? "#22C55E" : "#EF4444",
          fontFamily: MONO,
        }}>
          {position.side} {position.leverage}
        </span>
      </div>
      
      <div style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO, marginBottom: 12 }}>
        Entry ${position.entry.toLocaleString()} · Mark ${position.mark.toLocaleString()}
      </div>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: isPositive ? "#22C55E" : "#EF4444",
          fontFamily: MONO,
        }}>
          {isPositive ? "+" : ""}${Math.abs(position.pnl).toFixed(2)}
        </span>
        <span style={{ fontSize: 11, color: "#6B7280", fontFamily: MONO }}>
          ${position.size.toLocaleString()} size
        </span>
      </div>
    </div>
  );
}

function TrendingPerpCard({ perp }: { perp: typeof TRENDING_PERPS[0] }) {
  const jupLogos = useJupiterLogos();
  const icon = getIconWithJupiter(perp.symbol, jupLogos);
  const isPositive = perp.change >= 0;
  const chartColor = isPositive ? "#22C55E" : "#EF4444";

  return (
    <div 
      onClick={() => navigateToPage("trade", `${perp.symbol}USDT`)}
      style={{
        padding: "18px 20px",
        borderRadius: 14,
        background: "linear-gradient(145deg, rgba(20,25,35,0.9), rgba(10,14,19,0.95))",
        border: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s",
        minWidth: 200,
        flex: 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: "#6B7280", fontFamily: MONO, letterSpacing: "0.02em" }}>{perp.pair}</div>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: isPositive ? "#22C55E" : "#EF4444",
          fontFamily: MONO,
        }}>
          {isPositive ? "+" : ""}{perp.change.toFixed(2)}%
        </span>
      </div>
      
      <div style={{ fontSize: 18, fontWeight: 700, color: "#E6EDF3", fontFamily: SANS, marginBottom: 6 }}>
        {perp.name}
      </div>
      
      <span style={{
        display: "inline-block",
        fontSize: 9,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 4,
        background: perp.tag === "MEME" ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.12)",
        color: "#22C55E",
        fontFamily: MONO,
        marginBottom: 12,
      }}>
        {perp.tag}
      </span>
      
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: "#E6EDF3",
        fontFamily: MONO,
        letterSpacing: "-0.02em",
        marginBottom: 4,
      }}>
        ${typeof perp.price === "number" && perp.price < 1 ? perp.price.toFixed(4) : perp.price.toLocaleString()}
      </div>
      
      <div style={{ fontSize: 9, color: "#6B7280", fontFamily: MONO, textTransform: "uppercase", marginBottom: 12 }}>
        UP TO {perp.leverage} LEVERAGE
      </div>
      
      <div style={{ height: 40, marginBottom: 16 }}>
        <MiniSparkline color={chartColor} seed={perp.symbol.length} trend={isPositive ? "up" : "down"} />
      </div>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: "#4A5060", fontFamily: MONO, marginBottom: 2 }}>VOL</div>
            <div style={{ fontSize: 12, color: "#9BA4AE", fontFamily: MONO }}>${perp.vol}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: "#4A5060", fontFamily: MONO, marginBottom: 2 }}>OI</div>
            <div style={{ fontSize: 12, color: "#9BA4AE", fontFamily: MONO }}>${perp.oi}</div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); navigateToPage("trade", `${perp.symbol}USDT`); }}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "none",
            color: "#E6EDF3",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: SANS,
            cursor: "pointer",
            transition: "background 0.15s",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
        >
          Trade <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

function MoversRow({ mover, index }: { mover: typeof TODAYS_MOVERS[0]; index: number }) {
  const jupLogos = useJupiterLogos();
  const icon = getIconWithJupiter(mover.symbol, jupLogos);
  const isPositive = mover.change >= 0;

  return (
    <div 
      onClick={() => navigateToPage("trade", `${mover.symbol}USDT`)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "14px 16px",
        background: "transparent",
        cursor: "pointer",
        transition: "background 0.15s",
        borderBottom: index < TODAYS_MOVERS.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        {icon.type === "img" ? (
          <img src={icon.value} alt={mover.symbol} style={{ width: 36, height: 36, borderRadius: "50%" }} />
        ) : (
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: "50%", 
            background: mover.color, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: 12, 
            fontWeight: 700, 
            color: "#000" 
          }}>
            {icon.value}
          </div>
        )}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS }}>{mover.pair}</div>
          <div style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS }}>{mover.name} · {mover.leverage}</div>
        </div>
      </div>
      
      <div style={{ width: 120, textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#E6EDF3", fontFamily: MONO }}>
          ${typeof mover.price === "number" && mover.price < 100 ? mover.price.toFixed(2) : mover.price.toLocaleString()}
        </div>
      </div>
      
      <div style={{ width: 80, textAlign: "left" }}>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: isPositive ? "#22C55E" : "#EF4444",
          fontFamily: MONO,
        }}>
          {isPositive ? "+" : ""}{mover.change.toFixed(2)}%
        </span>
      </div>
      
      <button
        onClick={(e) => { e.stopPropagation(); navigateToPage("trade", `${mover.symbol}USDT`); }}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          border: "none",
          color: "#E6EDF3",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: SANS,
          cursor: "pointer",
          transition: "background 0.15s",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
      >
        Trade <ChevronRight style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

function AccountSidebar() {
  const { evmAddress } = useEvmWallet();
  const truncatedAddress = evmAddress ? `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}` : "Not connected";
  
  return (
    <div style={{
      width: 260,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Account Card */}
      <div style={{
        padding: "20px",
        borderRadius: 14,
        background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", fontFamily: MONO, letterSpacing: "0.08em", marginBottom: 16 }}>
          ACCOUNT
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#9BA4AE", fontFamily: SANS }}>Portfolio value</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#E6EDF3", fontFamily: MONO }}>$24,840</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#9BA4AE", fontFamily: SANS }}>Available margin</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#E6EDF3", fontFamily: MONO }}>$18,240</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#9BA4AE", fontFamily: SANS }}>{"Today's"}<br />PnL</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#22C55E", fontFamily: MONO }}>+$384.20</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#9BA4AE", fontFamily: SANS }}>Margin ratio</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#F97316", fontFamily: MONO }}>26.6%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#9BA4AE", fontFamily: SANS }}>Network</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#9BA4AE", fontFamily: SANS }}>Arbitrum</span>
          </div>
        </div>
      </div>
      
      {/* Rank Card */}
      <div style={{
        padding: "20px",
        borderRadius: 14,
        background: "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", fontFamily: MONO, letterSpacing: "0.08em", marginBottom: 16 }}>
          MY RANK
        </div>
        
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS, marginBottom: 4 }}>THIS WEEK</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: "#E6EDF3", fontFamily: MONO, letterSpacing: "-0.02em", lineHeight: 1 }}>#14</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#F97316", fontFamily: MONO }}>3,240 XP</span>
            <div style={{ fontSize: 10, color: "#6B7280", fontFamily: SANS }}>2,180 to Pro</div>
          </div>
        </div>
        
        <div style={{ fontSize: 11, color: "#6B7280", fontFamily: SANS, marginBottom: 16 }}>
          YourHandle · L18 Trader
        </div>
        
        {/* XP Progress Bar */}
        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 20 }}>
          <div style={{ height: "100%", width: "60%", background: "linear-gradient(90deg, #F97316, #FB923C)", borderRadius: 2 }} />
        </div>
        
        {/* Top 3 Leaderboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LEADERBOARD_PREVIEW.map(user => (
            <div key={user.rank} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontFamily: MONO, width: 16 }}>{user.rank}</span>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: user.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                color: "#000",
                fontFamily: MONO,
              }}>
                {user.avatar}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: "#E6EDF3", fontFamily: SANS }}>{user.name}</span>
              <span style={{ fontSize: 12, color: "#9BA4AE", fontFamily: MONO }}>{user.xp}</span>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => navigateToPage("leaderboard")}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "12px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #F97316, #EA580C)",
            border: "none",
            color: "#FFF",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: SANS,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          View Leaderboard
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const isMobile = useIsMobile();
  const [moversTab, setMoversTab] = useState<"gainers" | "losers" | "active" | "all">("gainers");

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
    }}>
      {/* Orange glow effect at top */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 1000,
        height: 400,
        background: "radial-gradient(ellipse at center top, rgba(234,88,12,0.15) 0%, rgba(234,88,12,0.05) 30%, transparent 70%)",
        pointerEvents: "none",
      }} />
      
      <div style={{
        position: "relative",
        padding: isMobile ? "16px" : "24px 32px",
        maxWidth: 1400,
        margin: "0 auto",
      }}>
        <div style={{ display: "flex", gap: 32 }}>
          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Portfolio Overview Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{
                  fontSize: isMobile ? 28 : 36,
                  fontWeight: 600,
                  color: "#E6EDF3",
                  fontFamily: SANS,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  marginBottom: 4,
                }}>
                  Portfolio<br />Overview
                </h1>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: isMobile ? 32 : 42,
                  fontWeight: 600,
                  color: "#E6EDF3",
                  fontFamily: MONO,
                  letterSpacing: "-0.02em",
                }}>
                  $24,840.00
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
                  <span style={{ fontSize: 14, color: "#22C55E", fontFamily: MONO }}>+$384.20 today</span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#22C55E",
                    fontFamily: MONO,
                  }}>
                    +1.57%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Stat Cards Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 36,
            }}>
              <StatCard label="TODAY'S PNL" value="+$384.20" subValue="+1.57%" variant="pnl-orange" />
              <StatCard label="UNREALISED PNL" value="+$56.20" subValue="3 open positions" variant="pnl-purple" />
              <StatCard label="AVAILABLE MARGIN" value="$18,240" subValue="73.4% free" variant="default" />
              <StatCard label="MARGIN RATIO" value="26.6%" subValue="Healthy" variant="healthy" />
            </div>
            
            {/* Open Positions */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS }}>Open Positions</h2>
                <button
                  onClick={() => navigateToPage("portfolio")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9BA4AE",
                    fontSize: 12,
                    fontFamily: SANS,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  View all in Portfolio <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
              
              <div style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 8,
                marginRight: -16,
                paddingRight: 16,
              }}
              className="no-scrollbar"
              >
                {OPEN_POSITIONS.map(position => (
                  <PositionCard key={position.symbol} position={position} />
                ))}
              </div>
            </div>
            
            {/* Trending Perpetuals */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS }}>Trending Perpetuals</h2>
                <button
                  onClick={() => navigateToPage("perps")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#9BA4AE",
                    fontSize: 12,
                    fontFamily: SANS,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  See all <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
              
              <div style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 8,
              }}
              className="no-scrollbar"
              >
                {TRENDING_PERPS.map(perp => (
                  <TrendingPerpCard key={perp.symbol} perp={perp} />
                ))}
              </div>
            </div>
            
            {/* Today's Movers */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#E6EDF3", fontFamily: SANS }}>{"Today's Movers"}</h2>
                
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { id: "gainers", label: "Top Gainers" },
                    { id: "losers", label: "Top Losers" },
                    { id: "active", label: "Most Active" },
                    { id: "all", label: "Full markets" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMoversTab(tab.id as typeof moversTab)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: moversTab === tab.id ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                        background: moversTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent",
                        color: moversTab === tab.id ? "#E6EDF3" : "#6B7280",
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: SANS,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {tab.label} {tab.id === "all" && <ChevronRight style={{ width: 12, height: 12 }} />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{
                borderRadius: 14,
                background: "linear-gradient(145deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.04)",
                overflow: "hidden",
              }}>
                {/* Table Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "#6B7280", fontFamily: MONO, textTransform: "uppercase" }}>Market</div>
                  <div style={{ width: 120, fontSize: 11, fontWeight: 600, color: "#6B7280", fontFamily: MONO, textTransform: "uppercase", textAlign: "left" }}>Price</div>
                  <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: "#6B7280", fontFamily: MONO, textTransform: "uppercase", textAlign: "left" }}>24H %</div>
                  <div style={{ width: 90 }} />
                </div>
                
                {/* Table Rows */}
                {TODAYS_MOVERS.map((mover, index) => (
                  <MoversRow key={mover.symbol} mover={mover} index={index} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Sidebar - Hidden on Mobile */}
          {!isMobile && <AccountSidebar />}
        </div>
      </div>
    </div>
  );
}
