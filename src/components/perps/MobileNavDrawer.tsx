"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { mono } from "./terminalTheme";
import { MarketsIcon, TradeIcon, SwapIcon, PortfolioIcon, LeaderboardIcon, SettingsIcon } from "../navIcons";

/* ─── Seigaiha canvas ─────────────────────────────────────────────────────────
   Classic Japanese overlapping wave-scale pattern at reduced opacity (~6%)
   for "quiet wealth" depth without distraction.
────────────────────────────────────────────────────────────────────────────── */
const R   = 28;
const CW  = R * 2;
const RH  = R * 0.80;

const C_BG     = '#020204';
const C_FACE   = '#060608';
const C_FACE2  = '#050507';
const C_BORDER = 'rgba(255,255,255,0.022)';
const C_CREST  = 'rgba(255,255,255,0.035)';

function drawSeigaiha(ctx: CanvasRenderingContext2D, W: number, H: number, oy: number) {
  ctx.fillStyle = C_BG;
  ctx.fillRect(0, 0, W, H);

  const offY     = oy % RH;
  const rowStart = -Math.ceil(R / RH) - 2;
  const rowEnd   = Math.ceil((H + R) / RH) + 3;

  for (let row = rowStart; row < rowEnd; row++) {
    const cy  = row * RH - offY;
    const odd = (row & 1) === 1;
    const xOff = odd ? R : 0;
    const colEnd = Math.ceil(W / CW) + 3;

    for (let col = -2; col < colEnd; col++) {
      const cx = xOff + col * CW;

      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.8, 0, Math.PI * 2);
      ctx.fillStyle = (row & 1) ? C_FACE : C_FACE2;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy - R * 0.15, R * 0.58, -Math.PI * 0.88, -Math.PI * 0.12);
      ctx.strokeStyle = C_CREST;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = C_BORDER;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
}

/* ─── Particles — monochrome dust ─────────────────────────────────────────── */
interface Particle {
  x: number; y: number;
  r: number; vy: number; vx: number;
  alpha: number; maxAlpha: number; phase: number;
}

function spawnParticle(W: number, H: number, randomY = false): Particle {
  const maxAlpha = 0.025 + Math.random() * 0.055;
  return {
    x: Math.random() * W,
    y: randomY ? Math.random() * H : H + 6,
    r: 0.6 + Math.random() * 1.2,
    vy: 0.12 + Math.random() * 0.24,
    vx: (Math.random() - 0.5) * 0.12,
    alpha: 0, maxAlpha,
    phase: Math.random() * Math.PI * 2,
  };
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], W: number, H: number, frame: number) {
  for (const p of particles) {
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.016 + p.phase);
    const a = p.maxAlpha * pulse;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.fill();

    p.y -= p.vy;
    p.x += p.vx;
    if (p.y < -10) Object.assign(p, spawnParticle(W, H));
  }
}

function AzabuBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number, frame = 0;
    let W = 320, H = 800;
    let particles: Particle[] = Array.from({ length: 14 }, () => spawnParticle(W, H, true));

    const resize = () => {
      const p = canvas.parentElement;
      W = p?.offsetWidth || 320;
      H = p?.offsetHeight || 800;
      canvas.width = W;
      canvas.height = H;
      particles = Array.from({ length: 14 }, () => spawnParticle(W, H, true));
    };

    const loop = () => {
      frame++;
      drawSeigaiha(ctx, W, H, frame * 0.03);
      drawParticles(ctx, particles, W, H, frame);
      raf = requestAnimationFrame(loop);
    };

    resize();
    loop();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
  );
}

const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

/* ─── NavItem — monochrome active state ──────────────────────────────────── */
function NavItem({ icon, label, onClick, active, badge }: {
  icon: ReactNode; label: string; onClick: () => void; active?: boolean; badge?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ padding: "2px 12px" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          width: "100%",
          padding: "11px 14px",
          cursor: "pointer",
          textAlign: "left",
          border: "none",
          borderRadius: 10,
          transition: "background 0.22s",
          outline: "none",
          background: active
            ? "rgba(255,255,255,0.06)"
            : hovered
              ? "rgba(255,255,255,0.03)"
              : "transparent",
          boxShadow: active
            ? "inset 0 0 0 1px rgba(255,255,255,0.08)"
            : "none",
        }}
      >
        {/* Icon */}
        <span style={{
          color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.32)",
          flexShrink: 0,
          display: "flex",
          transition: "color 0.2s",
        }}>
          {icon}
        </span>

        {/* Label */}
        <span style={{
          fontSize: 15,
          fontWeight: active ? 500 : 400,
          color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)",
          fontFamily: SANS,
          flex: 1,
          letterSpacing: active ? "0.2px" : "0.1px",
          transition: "color 0.2s",
        }}>
          {label}
        </span>

        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            background: "rgba(255,255,255,0.06)",
            borderRadius: 4, padding: "1px 6px",
            fontFamily: mono, letterSpacing: "0.05em",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {badge}
          </span>
        )}

        {/* Active dot */}
        {active && (
          <span style={{
            width: 4, height: 4, borderRadius: "50%",
            background: "rgba(255,255,255,0.4)",
            flexShrink: 0,
          }} />
        )}
      </button>
    </div>
  );
}

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  chain?: "arbitrum" | "hyperliquid";
  activePage?: string;
  marketCount?: number;
  onNavigateTrade?: () => void;
  onNavigateMarkets?: () => void;
  onOpenMarkets: () => void;
  onOpenPortfolio: () => void;
  onOpenSettings: () => void;
  onNavigateSwap: () => void;
  onNavigateLeaderboard?: () => void;
}

export default function MobileNavDrawer({
  open, onClose, activePage, onNavigateTrade, onNavigateMarkets,
  onOpenMarkets, onOpenPortfolio, onOpenSettings, onNavigateSwap, onNavigateLeaderboard,
}: MobileNavDrawerProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isTrade       = activePage === "trade" || !activePage;
  const isMarkets     = activePage === "perps";
  const isPortfolio   = activePage === "portfolio";
  const isSwap        = activePage === "swap";
  const isSettings    = activePage === "settings";
  const isLeaderboard = activePage === "leaderboard";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.65)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.22s ease",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 201,
          width: "80vw", maxWidth: 300,
          background: C_BG,
          borderRight: "1px solid rgba(255,255,255,0.05)",
          display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          opacity: open ? 1 : 0,
          transition: "transform 0.26s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.20s ease",
          willChange: "transform, opacity",
          boxShadow: "16px 0 80px rgba(0,0,0,0.97)",
          overflow: "hidden",
        }}
      >
        {/* ── Background layers ────────────────────────────────────────────── */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <AzabuBackground />

          {/* Edge darkening gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(0,0,0,0.55) 100%)",
          }} />
        </div>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "22px 18px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          position: "relative", zIndex: 1,
        }}>
          <button
            onClick={() => { onOpenMarkets(); onClose(); }}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <img
              src="/azabu-logo.png"
              alt="Azabu"
              style={{
                width: 30, height: 30, objectFit: "contain", flexShrink: 0,
                filter: "grayscale(1) brightness(1.5)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{
                fontSize: 19, fontWeight: 700, color: "#FFFFFF",
                fontFamily: "'Space Grotesk', 'DM Sans', -apple-system, sans-serif",
                letterSpacing: "-0.05em", lineHeight: 1.1,
                textTransform: "uppercase",
              }}>
                Azabu
              </span>
              <span style={{
                fontSize: 9.5, color: "rgba(255,255,255,0.25)", fontFamily: mono,
                letterSpacing: "0.07em", lineHeight: 1,
              }}>
                PERPETUALS
              </span>
            </div>
          </button>

          <button
            data-testid="mobile-drawer-close"
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.30)",
              flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Nav items ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 12, paddingBottom: 8, position: "relative", zIndex: 1 }}>

          <NavItem
            active={isTrade}
            onClick={() => { onNavigateTrade?.(); onClose(); }}
            label="Trade"
            icon={<TradeIcon active={isTrade} size={17} />}
          />

          <NavItem
            active={isMarkets}
            onClick={() => { onNavigateMarkets?.(); onClose(); }}
            label="Markets"
            icon={<MarketsIcon active={isMarkets} size={17} />}
          />

          <NavItem
            active={isPortfolio}
            onClick={() => { onOpenPortfolio(); onClose(); }}
            label="Portfolio"
            icon={<PortfolioIcon active={isPortfolio} size={17} />}
          />

          <NavItem
            active={isSwap}
            onClick={() => { onNavigateSwap(); onClose(); }}
            label="Swap"
            icon={<SwapIcon active={isSwap} size={17} />}
          />

          {/* Divider */}
          <div style={{ margin: "9px 26px", height: 1, background: "rgba(255,255,255,0.05)" }} />

          <NavItem
            active={isLeaderboard}
            onClick={() => { onNavigateLeaderboard?.(); onClose(); }}
            label="Leaderboard"
            icon={<LeaderboardIcon active={isLeaderboard} size={17} />}
          />

          <NavItem
            active={isSettings}
            onClick={() => { onOpenSettings(); onClose(); }}
            label="Settings"
            icon={<SettingsIcon active={isSettings} size={17} />}
          />

        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0, position: "relative", zIndex: 1 }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

          <div style={{
            padding: "12px 20px",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src="/azabu-logo.png" alt="" style={{ width: 13, height: 13, opacity: 0.15, objectFit: "contain", filter: "grayscale(1)" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontFamily: mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Azabu
              </span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <a
                href="https://x.com/azabufi"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", textDecoration: "none", fontFamily: mono, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 3 }}
              >
                Twitter
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <a
                href="#"
                onClick={e => { e.preventDefault(); onClose(); }}
                style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", textDecoration: "none", fontFamily: mono, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 3 }}
              >
                Support
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
