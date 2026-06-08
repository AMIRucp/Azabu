"use client";

import { ReactNode, useState } from "react";
import useSettingsStore from "@/stores/useSettingsStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { RotateCcw, HelpCircle, ChevronRight } from "lucide-react";

const SANS = "'Inter', -apple-system, sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const CARD = "#16181D";
const BORDER = "#252830";
const TEXT = "#E6EDF3";
const DIM = "#6B7280";
const MUTED = "#3A4050";
const ORANGE = "#D4A574";

/* ─── Card container ─────────────────────────────────────── */
function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 14, padding: "12px 14px",
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

/* ─── Card title row ─────────────────────────────────────── */
function CardTitle({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {value && <span style={{ fontSize: 11, fontWeight: 600, color: ORANGE, fontFamily: MONO, flexShrink: 0 }}>{value}</span>}
    </div>
  );
}

/* ─── Pill button group ──────────────────────────────────── */
function PillGroup<T extends string | number>({
  options, value, onChange, testIdPrefix,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  testIdPrefix?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            data-testid={`${testIdPrefix ?? "pill"}-${String(o.value)}`}
            style={{
              flex: 1, minWidth: 48,
              padding: "8px 10px", borderRadius: 8, border: "none",
              background: active ? ORANGE : "rgba(255,255,255,0.05)",
              color: active ? "#fff" : DIM,
              fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: SANS,
              cursor: "pointer", transition: "all 0.15s",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Toggle row ─────────────────────────────────────────── */
function ToggleRow({
  label, desc, value, onChange, warning, testId,
}: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
  warning?: string; testId?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onChange(!value)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 0", cursor: "pointer",
        borderTop: `1px solid ${BORDER}`,
        gap: 8,
      }}
      data-testid={testId ?? `settings-toggle-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div style={{ flex: 1, paddingRight: 12, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: hov ? TEXT : "#C9D1D9", fontFamily: SANS, transition: "color 0.12s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
        {desc && <div style={{ fontSize: 10, color: DIM, fontFamily: SANS, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</div>}
        {warning && <div style={{ fontSize: 10, color: ORANGE, fontFamily: SANS, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{warning}</div>}
      </div>
      {/* Toggle switch */}
      <div
        style={{
          width: 40, height: 22, borderRadius: 11, flexShrink: 0,
          background: value ? ORANGE : "rgba(255,255,255,0.08)",
          position: "relative", transition: "background 0.2s",
          boxShadow: value ? `0 0 10px ${ORANGE}40` : "none",
        }}
        data-testid={`button-toggle-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          background: value ? "#fff" : "rgba(255,255,255,0.4)",
          position: "absolute", top: 2,
          left: value ? 20 : 2,
          transition: "left 0.2s, background 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }} />
      </div>
    </div>
  );
}

/* ─── Number input row ───────────────────────────────────── */
function NumberRow({
  label, value, onChange, suffix, min, max,
}: {
  label: string; value: number; onChange: (v: number) => void;
  suffix?: string; min?: number; max?: number;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderTop: `1px solid ${BORDER}`, padding: "10px 0", gap: 8,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#C9D1D9", fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <input
          type="number" value={value} min={min} max={max}
          onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
          style={{
            width: 56, background: "rgba(255,255,255,0.05)",
            border: `1px solid ${BORDER}`, borderRadius: 6,
            color: TEXT, fontSize: 13, fontWeight: 700, fontFamily: MONO,
            padding: "4px 8px", textAlign: "center", outline: "none",
          }}
        />
        {suffix && <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{suffix}</span>}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function SettingsPage() {
  const s = useSettingsStore();
  const isMobile = useIsMobile();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const handleReset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("afx-settings");
      window.location.reload();
    }
  };

  return (
    <div
      style={{ maxWidth: isMobile ? 390 : 928, margin: "0 auto", padding: isMobile ? "12px 12px 100px" : "90px 50px 80px", position: "relative", overflowX: isMobile ? "hidden" : "visible" }}
    >
      {/* ── Sidebar (desktop only) ──────────────────────── */}
      {!isMobile && (
        <div style={{
          position: "absolute",
          left: -245,
          top: 55,
          width: 268,
          height: 497,
          background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderRadius: 12,
          padding: "24px 30px",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}>

          {/* TRADING */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
              Trading
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Swap - active */}
              <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 36, borderRadius: 32, background: "linear-gradient(267.24deg, rgba(224,217,217,0.1) 6.86%, rgba(169,164,164,0.1) 36.79%, rgba(26,26,26,0.1) 62.44%)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "0px 4px 4px rgba(0,0,0,0.25)", cursor: "pointer", padding: "0 14px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M10 2l3 3-3 3M14 11H2M6 8l-3 3 3 3" stroke="#FF6B00" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#FFFFFF" }}>Swap</span>
              </button>

              {/* Trading Defaults */}
              <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 36, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", padding: "0 12px" }}>
                <div style={{ width: 16, height: 16, borderRadius: 9999, border: "1px solid #9CA3AF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 4, height: 4, borderRadius: 9999, background: "#9CA3AF" }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF" }}>Trading Defaults</span>
              </button>

              {/* Take Profit / Stop Loss */}
              <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 36, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", padding: "0 12px" }}>
                <div style={{ width: 16, height: 16, borderRadius: 9999, border: "1px solid #9CA3AF", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF" }}>Take Profit / Stop Loss</span>
              </button>
            </div>
          </div>

          {/* DISPLAY */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
              Display
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 36, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", padding: "0 12px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8z" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF" }}>Appearance</span>
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 36, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", padding: "0 12px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 0 0-4 4v3l-1 1.5h10L12 9V6a4 4 0 0 0-4-4z" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 12.5a1.5 1.5 0 0 0 3 0" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" /><line x1="8" y1="1" x2="8" y2="2.5" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" /><line x1="6" y1="13.5" x2="10" y2="13.5" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" /></svg>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF" }}>Notifications</span>
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 36, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", padding: "0 12px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12V4.5l7-1.5V11" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /><circle cx="4.5" cy="12" r="1.5" stroke="#9CA3AF" strokeWidth="1.33" /><circle cx="11.5" cy="11" r="1.5" stroke="#9CA3AF" strokeWidth="1.33" /></svg>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF" }}>Sound</span>
              </button>
            </div>
          </div>

          {/* ACCOUNT */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
              Account
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 36, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", padding: "0 12px" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 4v4c0 3 2.5 5.5 5 6 2.5-.5 5-3 5-6V4L8 2z" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /><path d="M5.5 8l1.5 1.5 3-3" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF" }}>Privacy</span>
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 36, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", padding: "0 12px" }}>
                <div style={{ width: 16, height: 16, borderRadius: 9999, border: "1.1px solid #9CA3AF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, lineHeight: "1" }}>?</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: SANS, color: "#9CA3AF" }}>Getting Started</span>
              </button>
            </div>
          </div>

        </div>
      )}
      {!isMobile ? (
        <div style={{
          position: "absolute",
          width: 449,
          height: 449,
          left: -320,
          top: 425,
          backgroundImage: "url('/icons/3D Gear Icon.png')",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
          zIndex: 0,
        }} />
      ) : (
        <div style={{
          position: "absolute",
          width: 216,
          height: 216,
          left: 265,
          top: 5,
          backgroundImage: "url('/icons/3D Gear Icon2.png')",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
          zIndex: 0,
        }} />
      )}
      {/* Background Gradient Glow */}
      {!isMobile ? (
        <div style={{
          position: "absolute",
          width: 505,
          height: 137,
          left: 410,
          top: -150,
          background: "radial-gradient(50% 50% at 23.33% 81.97%, rgba(242, 130, 2, 0.3) 0%, rgba(153, 38, 13, 0.3) 60.1%)",
          border: "1px solid #FFB70F",
          filter: "blur(60px)",
          borderRadius: 9999,
          pointerEvents: "none",
          zIndex: 0,
        }} />
      ) : (
        <div style={{
          position: "absolute",
          width: 400,
          height: 174.29,
          left: 200,
          top: -100,
          background: "radial-gradient(50% 50% at 14.87% 76.08%, rgba(242, 130, 2, 0.5) 0%, rgba(153, 38, 13, 0.5) 60.1%)",
          border: "1px solid #FFB70F",
          filter: "blur(60px)",
          borderRadius: 10005,
          pointerEvents: "none",
          zIndex: 0,
        }} />
      )}

      {/* Page header */}
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <h1 style={{
          fontSize: isMobile ? 28 : 36,
          fontWeight: 700,
          fontFamily: SANS,
          margin: "0 0 6px",
          letterSpacing: "-1px",
          lineHeight: isMobile ? "36px" : "38px",
          background: "linear-gradient(98.1deg, #FFFFFF 29.04%, #808080 64.68%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          display: "inline-block",
        }}>
          Settings
        </h1>
        <p style={{
          fontSize: isMobile ? 12 : 14,
          fontWeight: 400,
          color: "#9CA3AF",
          fontFamily: SANS,
          margin: 0,
          lineHeight: "24px",
        }}>
          Configure your trading preferences
        </p>
      </div>

      {/* ── Slippage Tolerance ──────────────────────────── */}
      <div style={{
        boxSizing: "border-box",
        background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(7px)",
        borderRadius: 16,
        padding: isMobile ? "18px 16px" : "21px 25px",
        marginBottom: isMobile ? 15 : 20,
      }}>
        {/* Title */}
        <div style={{
          fontSize: isMobile ? 16 : 18,
          fontWeight: 600,
          fontFamily: SANS,
          color: "#FFFFFF",
          lineHeight: "28px",
          marginBottom: isMobile ? 20 : 6,
        }}>
          Slippage Tolerance
        </div>

        {/* Subtitle */}
        {!isMobile && (
          <div style={{
            fontSize: 14,
            fontWeight: 400,
            fontFamily: SANS,
            color: "#9CA3AF",
            lineHeight: "20px",
            marginBottom: 24,
          }}>
            Maximum price movement allowed before a swap fails
          </div>
        )}

        {/* Pills */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { label: "0.1%", value: 0.1 },
            { label: "0.5%", value: 0.5 },
            { label: "1%", value: 1 },
            { label: "3%", value: 3 },
          ].map(o => {
            const active = (s.defaultSlPercent <= 0.1 ? 0.1 : s.defaultSlPercent <= 0.5 ? 0.5 : s.defaultSlPercent <= 1 ? 1 : 3) === o.value;
            return (
              <button
                key={o.label}
                data-testid={`slippage-${o.value}`}
                onClick={() => s.update({ defaultSlPercent: o.value })}
                style={{
                  width: 73,
                  height: 36,
                  borderRadius: 32,
                  border: active ? "1px solid #3E3E3E" : "1px solid #262626",
                  background: active
                    ? "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255, 111, 0, 0.8) 0%, rgba(255, 111, 0, 0.8) 39.48%, rgba(26, 26, 26, 0.8) 100%)"
                    : "radial-gradient(70.79% 49.1% at 86.63% 100%, rgba(224, 217, 217, 0.1) 0%, rgba(169, 164, 164, 0.1) 36.06%, rgba(26, 26, 26, 0.1) 100%)",
                  boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
                  color: active ? "#FFFFFF" : "#888888",
                  fontSize: 14,
                  fontWeight: 400,
                  fontFamily: SANS,
                  cursor: "pointer",
                  lineHeight: "16px",
                  textAlign: "center",
                  minHeight: "unset",
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Transaction Deadline + Gas + Routing + Expert Mode (desktop only) ── */}
      {!isMobile && (
        <div style={{
          boxSizing: "border-box",
          background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(7px)",
          borderRadius: 16,
          marginBottom: isMobile ? 15 : 20,
          padding: "25px",
        }}>

          {/* Title section with bottom border */}
          <div style={{ borderBottom: "1px solid #222222", paddingBottom: 32, marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", marginBottom: 8 }}>
              Transaction Deadline
            </div>
            <div style={{ fontSize: 14, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "20px" }}>
              Cancel transaction if not confirmed within this window
            </div>
          </div>

          {/* Deadline row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
                Deadline
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "16px" }}>
                Time before pending transaction expires
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 36, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "40px" }}>30</span>
              <span style={{ fontSize: 14, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "20px", position: "relative", bottom: 9 }}>minutes</span>
            </div>
          </div>

          {/* Gas Preference row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingTop: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
                Gas Preference
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "16px" }}>
                Balanced speed and cost
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { label: "Low", value: "low", width: 73 },
                { label: "Medium", value: "medium", width: 95 },
                { label: "High", value: "high", width: 73 },
              ].map(o => {
                const active = o.value === "medium";
                return (
                  <button
                    key={o.value}
                    data-testid={`gas-${o.value}`}
                    onClick={() => { }}
                    style={{
                      width: o.width,
                      height: 36,
                      borderRadius: 32,
                      border: active ? "1px solid #3E3E3E" : "1px solid #262626",
                      background: active
                        ? "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255, 111, 0, 0.8) 0%, rgba(255, 111, 0, 0.8) 39.48%, rgba(26, 26, 26, 0.8) 100%)"
                        : "radial-gradient(70.79% 49.1% at 86.63% 100%, rgba(224, 217, 217, 0.1) 0%, rgba(169, 164, 164, 0.1) 36.06%, rgba(26, 26, 26, 0.1) 100%)",
                      boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
                      color: active ? "#FFFFFF" : "#888888",
                      fontSize: 14,
                      fontWeight: 400,
                      fontFamily: SANS,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto Routing row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingTop: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
                Auto Routing
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "16px" }}>
                Find the best price across DEXs
              </div>
            </div>
            <div data-testid="settings-toggle-auto-routing" style={{ width: 43, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", background: "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)", border: "1px solid rgba(255, 255, 255, 0.2)", flexShrink: 0 }}>
              <div style={{ position: "absolute", width: 19, height: 19, borderRadius: 9999, top: 1, left: 20, background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)", border: "1px solid rgba(255, 255, 255, 0.2)" }} />
            </div>
          </div>

          {/* Expert Mode row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4, paddingTop: 16 }}>
                Expert Mode
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "16px", marginBottom: 4 }}>
                Allow high slippage and skip confirmation prompts
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#FF8383", lineHeight: "16px" }}>
                Use with caution — bypasses safety checks
              </div>
            </div>
            <div data-testid="settings-toggle-expert-mode" style={{ width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", background: "linear-gradient(180deg, #333333 0%, #999999 100%)", border: "1px solid rgba(255, 255, 255, 0.2)", filter: "blur(0.65px)", flexShrink: 0, marginLeft: 16, alignSelf: "flex-start", marginTop: 30 }}>
              <div style={{ position: "absolute", width: 19, height: 19, borderRadius: 9999, top: 1, left: 2, background: "linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(189, 189, 189, 0.9) 100%)", border: "1px solid rgba(255, 255, 255, 0.2)" }} />
            </div>
          </div>
        </div>
      )}
      {/* ── Trading Defaults ──────────────────────────── */}
      <div style={{
        boxSizing: "border-box",
        background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(7px)",
        borderRadius: 16,
        padding: isMobile ? "17px 20px" : "24px 25px",
        marginBottom: isMobile ? 15 : 20,
      }}>

        {/* Title */}
        <div style={{
          fontSize: isMobile ? 16 : 18,
          fontWeight: 600,
          fontFamily: SANS,
          color: "#FFFFFF",
          lineHeight: "28px",
          marginBottom: 25,
        }}>
          Trading Defaults
        </div>

        {/* Confirm before trade */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: -5 }}>
              Confirm before trade
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "20px" }}>
              {isMobile ? "Show confirmation before submitting orders" : "Show a confirmation dialog before submitting orders"}
            </div>
          </div>
          <div
            onClick={() => s.update({ confirmBeforeTrade: !s.confirmBeforeTrade })}
            data-testid="settings-toggle-confirm-before-trade"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.confirmBeforeTrade
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.confirmBeforeTrade ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.confirmBeforeTrade ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>

        {/* Leverage warnings */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingTop: 8 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: -5 }}>
              Leverage warnings
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "20px" }}>
              Visual warnings at high leverage levels
            </div>
          </div>
          <div
            onClick={() => s.update({ showLeverageWarnings: !s.showLeverageWarnings })}
            data-testid="settings-toggle-leverage-warnings"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.showLeverageWarnings
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.showLeverageWarnings ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.showLeverageWarnings ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>

        {/* Default leverage */}
        <div style={{ marginBottom: 20, paddingTop: 8 }}>
          <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
            Default leverage
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "2x", value: 2 },
              { label: "5x", value: 5 },
              { label: "10x", value: 10 },
              { label: "20x", value: 20 },
            ].map(o => {
              const active = ([2, 5, 10, 20].includes(s.defaultLeverage) ? s.defaultLeverage : 2) === o.value;
              return (
                <button
                  key={o.value}
                  data-testid={`default-lev-${o.value}`}
                  onClick={() => s.update({ defaultLeverage: o.value })}
                  style={{
                    width: isMobile ? 73 : 54,
                    height: isMobile ? 36 : 26,
                    borderRadius: 32,
                    border: active ? "1px solid #3E3E3E" : "1px solid rgba(255, 255, 255, 0.05)",
                    background: active
                      ? "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255, 111, 0, 0.8) 0%, rgba(255, 111, 0, 0.8) 39.48%, rgba(26, 26, 26, 0.8) 100%)"
                      : "radial-gradient(70.79% 49.1% at 86.63% 100%, rgba(224, 217, 217, 0.1) 0%, rgba(169, 164, 164, 0.1) 36.06%, rgba(26, 26, 26, 0.1) 100%)",
                    boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
                    color: active ? "#FFFFFF" : "#888888",
                    fontSize: isMobile ? 14 : 12,
                    fontWeight: 400,
                    fontFamily: SANS,
                    cursor: "pointer",
                    textAlign: "center",
                    lineHeight: "1",
                    padding: 0,
                    boxSizing: "border-box" as const,
                    minHeight: "unset",
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default chart timeframe - desktop only */}
        {!isMobile && (
          <div style={{ marginBottom: 8, paddingTop: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
              Default chart timeframe
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { label: "1m", value: "1m", width: 47 },
                { label: "5m", value: "5m", width: 47 },
                { label: "15m", value: "15m", width: 52 },
                { label: "1h", value: "1h", width: 44 },
                { label: "4h", value: "4h", width: 47 },
                { label: "1d", value: "1d", width: 47 },
              ].map(o => {
                const active = s.defaultChartTimeframe === o.value;
                return (
                  <button
                    key={o.value}
                    data-testid={`chart-tf-${o.value}`}
                    onClick={() => s.update({ defaultChartTimeframe: o.value })}
                    style={{
                      width: o.width,
                      height: 26,
                      borderRadius: 32,
                      border: active ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(255, 255, 255, 0.05)",
                      background: active
                        ? "radial-gradient(39.37% 105% at 48.35% 166.67%, rgba(255, 111, 0, 0.8) 0%, rgba(255, 111, 0, 0.8) 39.48%, rgba(26, 26, 26, 0.8) 100%)"
                        : "radial-gradient(70.79% 49.1% at 86.63% 100%, rgba(224, 217, 217, 0.1) 0%, rgba(169, 164, 164, 0.1) 36.06%, rgba(26, 26, 26, 0.1) 100%)",
                      boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
                      color: active ? "#FFFFFF" : "#888888",
                      fontSize: 12,
                      fontWeight: 400,
                      fontFamily: SANS,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Expert Mode - mobile only */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px" }}>
                Expert Mode
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "20px", marginBottom: 4 }}>
                Skip confirmation prompts
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, fontFamily: SANS, color: "#FF8383", lineHeight: "16px" }}>
                Use with caution — bypasses safety checks
              </div>
            </div>
            <div
              data-testid="settings-toggle-expert-mode"
              style={{
                width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16, marginTop: 4,
                background: "linear-gradient(180deg, #333333 0%, #999999 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                filter: "blur(0.65px)",
              }}
            >
              <div style={{
                position: "absolute", width: 20, height: 20, borderRadius: 9999,
                top: 2, left: 2,
                background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── TP / SL (desktop only) ───────────────────── */}
      {!isMobile && (
        <div style={{
          boxSizing: "border-box",
          background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(7px)",
          borderRadius: 16,
          padding: "0 0 32px 0",
          marginBottom: 20,
          overflow: "hidden",
        }}>

          {/* Heading */}
          <div style={{ padding: "24px 25px 0 25px", marginBottom: 0 }}>
            <div style={{
              fontSize: 18, fontWeight: 600, fontFamily: SANS,
              color: "#FFFFFF", lineHeight: "20px",
            }}>
              Take Profit / Stop Loss
            </div>
          </div>

          {/* Auto-set TP/SL row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 25px 0 25px",
          }}>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 600, fontFamily: SANS,
                color: "#FFFFFF", lineHeight: "20px", marginBottom: 4,
              }}>
                Auto-set TP/SL on new trades
              </div>
              <div style={{
                fontSize: 12, fontWeight: 400, fontFamily: SANS,
                color: "#9CA3AF", lineHeight: "16px",
              }}>
                Automatically add take-profit and stop-loss to every order
              </div>
            </div>
            <div
              onClick={() => s.update({ autoSetTpSl: !s.autoSetTpSl })}
              data-testid="settings-toggle-auto-set-tpsl"
              style={{
                width: 44, height: 24, borderRadius: 9999,
                position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
                background: s.autoSetTpSl
                  ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                  : "linear-gradient(180deg, #333333 0%, #999999 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                filter: s.autoSetTpSl ? "none" : "blur(0.65px)",
              }}
            >

              <div style={{
                position: "absolute", width: 19, height: 19, borderRadius: "50%",
                top: 1, left: s.autoSetTpSl ? 22 : 2,
                background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "left 0.2s",
              }} />
            </div>
          </div>

          {/* Conditional TP/SL inputs */}
          {s.autoSetTpSl && (
            <div style={{ padding: "0 25px" }}>
              {/* Divider */}
              <div style={{
                width: "100%",
                height: 1,
                borderTop: "1px solid #262626",
                marginBottom: 24,
                marginTop: 18,
              }} />
              {/* Default take profit row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: 24,
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 600, fontFamily: SANS,
                  color: "#FFFFFF", lineHeight: "20px",
                }}>
                  Default take profit
                </span>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    value={s.defaultTpPercent}
                    min={0.5} max={100}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) s.update({ defaultTpPercent: v }); }}
                    style={{
                      width: 92, height: 38,
                      background: "radial-gradient(25.32% 145.83% at 64.14% -50%, rgba(38,38,38,0.1) 0%, rgba(87,94,103,0.1) 53.86%, rgba(26,26,26,0.1) 98.98%)",
                      border: "1px solid #1A1A1A",
                      borderRadius: 32,
                      color: "#FFFFFF",
                      fontSize: 12, fontWeight: 700, fontFamily: MONO,
                      paddingLeft: 23, paddingRight: 16,
                      textAlign: "left", outline: "none",
                      boxSizing: "border-box",
                      MozAppearance: "textfield",
                      WebkitAppearance: "none",
                    }}
                  />
                  <span style={{
                    fontSize: 12, fontWeight: 900, fontFamily: SANS,
                    color: "#9CA3AF", pointerEvents: "none",
                    marginLeft: 6,
                  }}>%</span>
                </div>
              </div>

              {/* Default stop loss row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: 20,
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 600, fontFamily: SANS,
                  color: "#FFFFFF", lineHeight: "20px",
                }}>
                  Default stop loss
                </span>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    value={s.defaultTpPercent}
                    min={0.5} max={100}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) s.update({ defaultTpPercent: v }); }}
                    style={{
                      width: 92, height: 38,
                      background: "radial-gradient(25.32% 145.83% at 64.14% -50%, rgba(38,38,38,0.1) 0%, rgba(87,94,103,0.1) 53.86%, rgba(26,26,26,0.1) 98.98%)",
                      border: "1px solid #1A1A1A",
                      borderRadius: 32,
                      color: "#FFFFFF",
                      fontSize: 12, fontWeight: 700, fontFamily: MONO,
                      paddingLeft: 23, paddingRight: 16,
                      textAlign: "left", outline: "none",
                      boxSizing: "border-box",
                      MozAppearance: "textfield",
                      WebkitAppearance: "none",
                    }}
                  />
                  <span style={{
                    fontSize: 12, fontWeight: 900, fontFamily: SANS,
                    color: "#9CA3AF", pointerEvents: "none",
                    marginLeft: 6,
                  }}>%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ── TP / SL (mobile only) ────────────────────── */}
      {isMobile && (
        <div style={{
          boxSizing: "border-box",
          background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(7px)",
          borderRadius: 16,
          padding: "19px 20px 24px 20px",
          marginBottom: 15,
        }}>

          {/* Title */}
          <div style={{
            fontSize: 16, fontWeight: 600, fontFamily: SANS,
            color: "#FFFFFF", lineHeight: "20px", marginBottom: 24,
          }}>
            Take Profit / Stop Loss
          </div>

          {/* Auto-set TP/SL row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 24,
          }}>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 600, fontFamily: SANS,
                color: "#FFFFFF", lineHeight: "20px", marginBottom: 2,
              }}>
                Auto-set TP/SL on new trades
              </div>
              <div style={{
                fontSize: 12, fontWeight: 400, fontFamily: SANS,
                color: "#9CA3AF", lineHeight: "16px",
              }}>
                Automatically add take-profit and stop-loss to every order
              </div>
            </div>
            <div
              onClick={() => s.update({ autoSetTpSl: !s.autoSetTpSl })}
              data-testid="settings-toggle-auto-set-tpsl"
              style={{
                width: 44, height: 24, borderRadius: 9999,
                position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
                background: s.autoSetTpSl
                  ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                  : "linear-gradient(180deg, #333333 0%, #999999 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                filter: s.autoSetTpSl ? "none" : "blur(0.65px)",
              }}
            >
              <div style={{
                position: "absolute", width: 19, height: 19, borderRadius: "50%",
                top: 1, left: s.autoSetTpSl ? 22 : 2,
                background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "left 0.2s",
              }} />
            </div>
          </div>

          {/* Conditional TP/SL inputs */}
          {s.autoSetTpSl && (
            <>
              {/* Default take profit */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 16,
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 600, fontFamily: SANS,
                  color: "#FFFFFF", lineHeight: "20px",
                }}>
                  Default take profit
                </span>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    value={s.defaultTpPercent}
                    min={0.5} max={100}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) s.update({ defaultTpPercent: v }); }}
                    style={{
                      width: 92, height: 38,
                      background: "radial-gradient(25.32% 145.83% at 64.14% -50%, rgba(38,38,38,0.1) 0%, rgba(87,94,103,0.1) 53.86%, rgba(26,26,26,0.1) 98.98%)",
                      border: "1px solid #1A1A1A",
                      borderRadius: 32,
                      color: "#FFFFFF",
                      fontSize: 12, fontWeight: 700, fontFamily: MONO,
                      paddingLeft: 23, paddingRight: 16,
                      textAlign: "left", outline: "none",
                      boxSizing: "border-box",
                      MozAppearance: "textfield",
                      WebkitAppearance: "none",
                    }}
                  />
                  <span style={{
                    fontSize: 12, fontWeight: 900, fontFamily: SANS,
                    color: "#9CA3AF", pointerEvents: "none",
                    marginLeft: 6,
                  }}>%</span>
                </div>
              </div>

              {/* Default stop loss */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 600, fontFamily: SANS,
                  color: "#FFFFFF", lineHeight: "20px",
                }}>
                  Default stop loss
                </span>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    value={s.defaultTpPercent}
                    min={0.5} max={100}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) s.update({ defaultTpPercent: v }); }}
                    style={{
                      width: 92, height: 38,
                      background: "radial-gradient(25.32% 145.83% at 64.14% -50%, rgba(38,38,38,0.1) 0%, rgba(87,94,103,0.1) 53.86%, rgba(26,26,26,0.1) 98.98%)",
                      border: "1px solid #1A1A1A",
                      borderRadius: 32,
                      color: "#FFFFFF",
                      fontSize: 12, fontWeight: 700, fontFamily: MONO,
                      paddingLeft: 23, paddingRight: 16,
                      textAlign: "left", outline: "none",
                      boxSizing: "border-box",
                      MozAppearance: "textfield",
                      WebkitAppearance: "none",
                    }}
                  />
                  <span style={{
                    fontSize: 12, fontWeight: 900, fontFamily: SANS,
                    color: "#9CA3AF", pointerEvents: "none",
                    marginLeft: 6,
                  }}>%</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {/* ── Appearance ────────────────────────────────── */}
      <div style={{
        boxSizing: "border-box",
        background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(7px)",
        borderRadius: 16,
        padding: isMobile ? "19px 20px" : "30px 25px",
        marginBottom: isMobile ? 15 : 20,
      }}>

        {/* Title */}
        <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", marginBottom: 30 }}>
          Appearance
        </div>

        {/* Compact mode */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "5px", marginBottom: 4 }}>
              Compact mode
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "20px", }}>
              Tighter spacing for more data density
            </div>
          </div>
          <div
            onClick={() => s.update({ compactMode: !s.compactMode })}
            data-testid="settings-toggle-compact-mode"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.compactMode
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.compactMode ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.compactMode ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>

        {/* Glitch effects */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30, }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
              Glitch effects
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
              {isMobile ? "Screen animation on trade execution" : "Screen glitch animation on trade execution"}
            </div>
          </div>
          <div
            onClick={() => s.update({ showGlitchEffects: !s.showGlitchEffects })}
            data-testid="settings-toggle-glitch-effects"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.showGlitchEffects
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.showGlitchEffects ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.showGlitchEffects ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>

        {/* Scan lines */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
              Scan lines
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
              {isMobile ? "CRT-style overlay" : "CRT-style scan line overlay"}
            </div>
          </div>
          <div
            onClick={() => s.update({ showScanlines: !s.showScanlines })}
            data-testid="settings-toggle-scan-lines"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.showScanlines
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.showScanlines ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.showScanlines ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>
      </div>

      {/* ── Notifications ─────────────────────────────── */}
      <div style={{
        boxSizing: "border-box",
        background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(7px)",
        borderRadius: 16,
        padding: isMobile ? "20px 20px" : "30px 25px",
        marginBottom: isMobile ? 15 : 20,
      }}>

        {/* Title */}
        <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", marginBottom: 30 }}>
          Notifications
        </div>

        {/* Trade confirmations - desktop only */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
                Trade confirmations
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
                Show toasts when orders are placed
              </div>
            </div>
            <div
              onClick={() => s.update({ showTradeToasts: !s.showTradeToasts })}
              data-testid="settings-toggle-trade-confirmations"
              style={{
                width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
                background: s.showTradeToasts
                  ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                  : "linear-gradient(180deg, #333333 0%, #999999 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                filter: s.showTradeToasts ? "none" : "blur(0.65px)",
              }}
            >
              <div style={{
                position: "absolute", width: 19, height: 19, borderRadius: 9999,
                top: 1, left: s.showTradeToasts ? 22 : 2,
                background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "left 0.2s",
              }} />
            </div>
          </div>
        )}

        {/* XP notifications */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: isMobile ? "28px" : "20px", marginBottom: isMobile ? 0 : 4 }}>
              XP notifications
            </div>
            {!isMobile && (
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
                Show +XP floating text after actions
              </div>
            )}
          </div>
          <div
            onClick={() => s.update({ showXpNotifications: !s.showXpNotifications })}
            data-testid="settings-toggle-xp-notifications"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.showXpNotifications
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.showXpNotifications ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.showXpNotifications ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>

        {/* Achievement popups */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: isMobile ? "28px" : "20px", marginBottom: isMobile ? 0 : 4 }}>
              Achievement popups
            </div>
            {!isMobile && (
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
                Show unlock banners for completed achievements
              </div>
            )}
          </div>
          <div
            onClick={() => s.update({ showAchievements: !s.showAchievements })}
            data-testid="settings-toggle-achievement-popups"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.showAchievements
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.showAchievements ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.showAchievements ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>

        {/* Liquidation alerts */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: isMobile ? "28px" : "20px", marginBottom: isMobile ? 0 : 4 }}>
              Liquidation alerts
            </div>
            {!isMobile && (
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
                Warnings when positions approach liquidation
              </div>
            )}
          </div>
          <div
            onClick={() => s.update({ showLiquidationAlerts: !s.showLiquidationAlerts })}
            data-testid="settings-toggle-liquidation-alerts"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.showLiquidationAlerts
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.showLiquidationAlerts ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.showLiquidationAlerts ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>

        {/* Price alerts */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: isMobile ? "28px" : "20px", marginBottom: isMobile ? 0 : 4 }}>
              Price alerts
            </div>
            {!isMobile && (
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
                Notifications when price targets are hit
              </div>
            )}
          </div>
          <div
            onClick={() => s.update({ showPriceAlerts: !s.showPriceAlerts })}
            data-testid="settings-toggle-price-alerts"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.showPriceAlerts
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.showPriceAlerts ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.showPriceAlerts ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>
      </div>

      {/* ── Sound (desktop only) ──────────────────────── */}
      {!isMobile && (
        <div style={{
          boxSizing: "border-box",
          background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(7px)",
          borderRadius: 16,
          padding: "30px 25px",
          marginBottom: isMobile ? 15 : 20,
        }}>

          {/* Title */}
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", marginBottom: 30 }}>
            Sound
          </div>

          {/* Sound effects */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4 }}>
                Sound effects
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
                Audio feedback on trades and alerts
              </div>
            </div>
            <div
              onClick={() => s.update({ soundEnabled: !s.soundEnabled })}
              data-testid="settings-toggle-sound-effects"
              style={{
                width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
                background: s.soundEnabled
                  ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                  : "linear-gradient(180deg, #333333 0%, #999999 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                filter: s.soundEnabled ? "none" : "blur(0.65px)",
              }}
            >
              <div style={{
                position: "absolute", width: 19, height: 19, borderRadius: 9999,
                top: 1, left: s.soundEnabled ? 22 : 2,
                background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "left 0.2s",
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Privacy ───────────────────────────────────── */}
      <div style={{
        boxSizing: "border-box",
        background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(7px)",
        borderRadius: 16,
        padding: isMobile ? "20px 20px" : "30px 31px",
        marginBottom: isMobile ? 15 : 20,
      }}>

        {/* Title */}
        <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", marginBottom: 30 }}>
          Privacy
        </div>

        {/* Show PnL in browser tab */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: isMobile ? "28px" : "5px", marginBottom: isMobile ? 0 : 4 }}>
              Show PnL in browser tab
            </div>
            {!isMobile && (
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "20px" }}>
                Display unrealized PnL in the tab title
              </div>
            )}
          </div>
          <div
            onClick={() => s.update({ showPnlInTitle: !s.showPnlInTitle })}
            data-testid="settings-toggle-show-pnl"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.showPnlInTitle
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.showPnlInTitle ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.showPnlInTitle ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>

        {/* Hide balances */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: isMobile ? "28px" : "20px", marginBottom: isMobile ? 0 : 4 }}>
              Hide balances
            </div>
            {!isMobile && (
              <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
                Mask all balance and PnL numbers
              </div>
            )}
          </div>
          <div
            onClick={() => s.update({ hideBalances: !s.hideBalances })}
            data-testid="settings-toggle-hide-balances"
            style={{
              width: 44, height: 24, borderRadius: 9999, position: "relative", cursor: "pointer", flexShrink: 0, marginLeft: 16,
              background: s.hideBalances
                ? "linear-gradient(4.66deg, rgba(244, 163, 163, 0.8) -100.49%, rgba(255, 107, 0, 0.8) 117.7%)"
                : "linear-gradient(180deg, #333333 0%, #999999 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              filter: s.hideBalances ? "none" : "blur(0.65px)",
            }}
          >
            <div style={{
              position: "absolute", width: 19, height: 19, borderRadius: 9999,
              top: 1, left: s.hideBalances ? 22 : 2,
              background: "linear-gradient(180deg, #FFFFFF 0%, #BDBDBD 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "left 0.2s",
            }} />
          </div>
        </div>
      </div>

      {/* ── Support (desktop only) ────────────────────── */}
      {!isMobile && (
        <div style={{
          boxSizing: "border-box",
          background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(7px)",
          borderRadius: 16,
          padding: "20px 21px",
          marginBottom: 40,
        }}>
          <button
            data-testid="settings-help-btn"
            onClick={() => setShowGuideModal(true)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", background: "none", border: "none", cursor: "pointer",
              padding: 0, minHeight: "unset",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 39, borderRadius: 10, flexShrink: 0,
                background: "radial-gradient(70.79% 49.1% at 86.63% 100%, rgba(224, 217, 217, 0.1) 0%, rgba(169, 164, 164, 0.1) 36.06%, rgba(26, 26, 26, 0.1) 100%)",
                border: "1px solid #262626",
                boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 18, fontWeight: 400, color: "#FFFFFF", lineHeight: "28px" }}>?</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "20px", marginBottom: 4, marginLeft: -85 }}>
                  Getting Started Guide
                </div>
                <div style={{ fontSize: 12, fontWeight: 400, fontFamily: SANS, color: "#9CA3AF", lineHeight: "5px" }}>
                  Step-by-step walkthrough for new users
                </div>
              </div>
            </div>
            <ChevronRight size={14} color="#808080" style={{ flexShrink: 0 }} />
          </button>
        </div>
      )}

      {/* Quick Start Guide Modal */}
      {showGuideModal && (
        <div
          onClick={() => setShowGuideModal(false)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 60,
          }}
        >
          {/* DESKTOP MODAL */}
          {!isMobile && (
            <div
              className="settings-scrollbar"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 610,
                maxHeight: "90vh",
                overflowY: "auto",
                background: "linear-gradient(180deg, rgba(22, 22, 22, 0.8) 0%, rgba(10, 10, 10, 0.8) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(16.65px)",
                borderRadius: 16,
                position: "relative",
                flexShrink: 0,
                padding: "39px 32px 32px 32px",
                boxSizing: "border-box",
              }}
            >
              {/* Quick Start title */}
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", marginBottom: 4 }}>
                Quick Start
              </div>

              {/* 5 steps to trading */}
              <div style={{ fontSize: 14, fontWeight: 400, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", marginBottom: 24 }}>
                5 steps to trading
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowGuideModal(false)}
                style={{
                  position: "absolute",
                  right: 32, top: 39,
                  width: 31, height: 31,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 33,
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15" stroke="#9CA3AF" strokeWidth="1.66667" strokeLinecap="round" />
                  <path d="M5 5L15 15" stroke="#9CA3AF" strokeWidth="1.66667" strokeLinecap="round" />
                </svg>
              </button>

              {/* Step cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { step: "01", title: "Connect Wallet", desc: "Connect an EVM wallet (MetaMask, Rabby, Coinbase Wallet, or WalletConnect) from the top-right menu. One wallet covers both Arbitrum and Hyperliquid." },
                  { step: "02", title: "Fund Account", desc: "Deposit USDC (Hyperliquid) or USDT (Arbitrum) from your EVM wallet into exchange sub-accounts via the Portfolio page." },
                  { step: "03", title: "Trade Perpetuals", desc: "Pick a market, choose your chain — Arbitrum (Aster DEX) or Hyperliquid — set leverage, go Long or Short. Optional TP/SL across 450+ markets." },
                  { step: "04", title: "Swap Tokens", desc: "Swap any token on Arbitrum via 1inch with live quotes and best-route execution. Collateral is USDT on Arbitrum and USDC on Hyperliquid." },
                  { step: "05", title: "Manage Positions", desc: "Monitor PnL, adjust TP/SL, or close positions from the terminal or Portfolio page. All protocols, one unified view." },
                ].map((item) => (
                  <div
                    key={item.step}
                    style={{
                      width: "100%",
                      background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(7px)",
                      borderRadius: 16,
                      padding: "29px 25px",
                      boxSizing: "border-box",
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 700, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", flexShrink: 0, width: 32 }}>
                      {item.step}
                    </span>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px", marginBottom: 8 }}>
                        {item.title}
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 400, fontFamily: SANS, color: "#FFFFFF", lineHeight: "22px", margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Horizontal divider */}
              <div style={{
                width: "100%", height: 1,
                borderTop: "1px solid #262626",
                marginTop: 24, marginBottom: 24,
              }} />

              {/* Start Trading button */}
              <button
                onClick={() => setShowGuideModal(false)}
                style={{
                  width: "100%", height: 56,
                  background: "conic-gradient(from 180.78deg at 45.42% 119.23%, #FFDD54 0deg, #FF6B00 60.58deg, #FF6B00 188.65deg, #FFE270 263.08deg, #FFDD54 360deg)",
                  backdropFilter: "blur(2px)",
                  borderRadius: 50,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#FFFFFF",
                }}
              >
                Start Trading
              </button>
            </div>
          )}

          {/* MOBILE MODAL */}
          {isMobile && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 390,
                height: 989,
                background: "linear-gradient(180deg, #161616 0%, #0A0A0A 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(16.65px)",
                borderRadius: 16,
                position: "relative",
                flexShrink: 0,
              }}
            >
              {/* Drag indicator */}
              <div style={{
                position: "absolute",
                width: 40, height: 4,
                left: "calc(50% - 20px)",
                top: 106,
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: 9999,
              }} />

              {/* Quick Start title */}
              <div style={{ position: "absolute", left: 21, top: 27, fontSize: 16, fontWeight: 700, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px" }}>
                Quick Start
              </div>

              {/* 5 steps to trading */}
              <div style={{ position: "absolute", left: 21, top: 47, fontSize: 14, fontWeight: 400, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px" }}>
                5 steps to trading
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowGuideModal(false)}
                style={{
                  position: "absolute", left: 344, top: 31,
                  width: 31, height: 31,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: 33,
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15" stroke="#9CA3AF" strokeWidth="1.66667" strokeLinecap="round" />
                  <path d="M5 5L15 15" stroke="#9CA3AF" strokeWidth="1.66667" strokeLinecap="round" />
                </svg>
              </button>

              {/* Step cards */}
              {[
                { step: "01", title: "Connect Wallet", desc: "Connect an EVM wallet (MetaMask, Rabby, Coinbase Wallet, or WalletConnect) from the top-right menu. One wallet covers both Arbitrum and Hyperliquid.", top: 176 },
                { step: "02", title: "Fund Account", desc: "Deposit USDC (Hyperliquid) or USDT (Arbitrum) from your EVM wallet into exchange sub-accounts via the Portfolio page.", top: 339 },
                { step: "03", title: "Trade Perpetuals", desc: "Pick a market, choose your chain — Arbitrum (Aster DEX) or Hyperliquid — set leverage, go Long or Short. Optional TP/SL across 450+ markets.", top: 502 },
                { step: "04", title: "Swap Tokens", desc: "Swap any token on Arbitrum via 1inch with live quotes and best-route execution. Collateral is USDT on Arbitrum and USDC on Hyperliquid.", top: 665 },
                { step: "05", title: "Manage Positions", desc: "Monitor PnL, adjust TP/SL, or close positions from the terminal or Portfolio page. All protocols, one unified view.", top: 828 },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    position: "absolute",
                    width: 358, height: 146,
                    left: "calc(50% - 179px)",
                    top: item.top,
                    background: "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(7px)",
                    borderRadius: 16,
                  }}
                >
                  <span style={{ position: "absolute", left: 20, top: 17, fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px" }}>
                    {item.step}
                  </span>
                  <span style={{ position: "absolute", left: 57, top: 17, fontSize: 14, fontWeight: 600, fontFamily: SANS, color: "#FFFFFF", lineHeight: "28px" }}>
                    {item.title}
                  </span>
                  <p style={{ position: "absolute", left: 20, top: 54, width: 318, fontSize: 14, fontWeight: 400, fontFamily: SANS, color: "#FFFFFF", lineHeight: "18px", margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}

              {/* Start Trading button */}
              <button
                onClick={() => setShowGuideModal(false)}
                style={{
                  position: "absolute",
                  width: 287, height: 56,
                  left: "calc(50% - 143.5px)",
                  top: 915,
                  background: "conic-gradient(from 180.78deg at 45.42% 119.23%, #FFDD54 0deg, #FF6B00 60.58deg, #FF6B00 188.65deg, #FFE270 263.08deg, #FFDD54 360deg)",
                  backdropFilter: "blur(2px)",
                  borderRadius: 50,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#FFFFFF",
                }}
              >
                Start Trading
              </button>
            </div>
          )}
        </div>
      )}
      {/* ── Reset ─────────────────────────────────────── */}
      <div style={{ marginTop: 2, marginBottom: isMobile ? -20 : 80 }}>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            data-testid="button-reset-settings"
            style={{
              width: "100%",
              height: isMobile ? 47 : 54,
              borderRadius: 16,
              background: isMobile
                ? "linear-gradient(180deg, rgba(22, 22, 22, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)"
                : "transparent",
              border: isMobile ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid #222222",
              backdropFilter: isMobile ? "blur(7px)" : "none",
              color: "#888888",
              fontSize: 14,
              fontWeight: 400,
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: "unset",
            }}
          >
            <svg width="20" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8C2 4.686 4.686 2 8 2C10.21 2 12.134 3.195 13.197 5H11V6.333H14.667V2.667H13.333V4.332C11.986 2.581 9.619 1.333 8 1.333C4.318 1.333 1.333 4.318 1.333 8H2Z" fill="#888888" />
              <path d="M14 8C14 11.314 11.314 14 8 14C5.79 14 3.866 12.805 2.803 11H5V9.667H1.333V13.333H2.667V11.668C4.014 13.419 6.381 14.667 8 14.667C11.682 14.667 14.667 11.682 14.667 8H14Z" fill="#888888" />
            </svg>
            Reset all settings to defaults
          </button>
        ) : (
          <div style={{
            padding: "12px", borderRadius: 16,
            background: "rgba(212,165,116,0.07)", border: "1px solid rgba(212,165,116,0.2)",
          }}>
            <div style={{ fontSize: 12, color: TEXT, fontFamily: SANS, fontWeight: 600, marginBottom: 10 }}>
              Reset all settings to defaults?
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  background: ORANGE, border: "none",
                  color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: SANS, cursor: "pointer",
                  minHeight: "unset",
                }}
                data-testid="button-confirm-reset"
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                  color: DIM, fontSize: 11, fontFamily: SANS, cursor: "pointer",
                  minHeight: "unset",
                }}
                data-testid="button-cancel-reset"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}