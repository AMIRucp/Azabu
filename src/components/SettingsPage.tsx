"use client";

import { ReactNode, useState } from "react";
import useSettingsStore from "@/stores/useSettingsStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { RotateCcw, HelpCircle, ChevronRight } from "lucide-react";

const SANS  = "'Inter', -apple-system, sans-serif";
const MONO  = "'IBM Plex Mono', monospace";
const CARD  = "#16181D";
const BORDER = "#252830";
const TEXT  = "#E6EDF3";
const DIM   = "#6B7280";
const MUTED = "#3A4050";
const ORANGE = "#D4A574";

/* ─── Card container ─────────────────────────────────────── */
function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: "20px 22px",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

/* ─── Card title row ─────────────────────────────────────── */
function CardTitle({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <span style={{ fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SANS }}>{label}</span>
      {value && <span style={{ fontSize: 13, fontWeight: 600, color: ORANGE, fontFamily: MONO }}>{value}</span>}
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
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            data-testid={`${testIdPrefix ?? "pill"}-${String(o.value)}`}
            style={{
              flex: 1, minWidth: 56,
              padding: "10px 12px", borderRadius: 10, border: "none",
              background: active ? ORANGE : "rgba(255,255,255,0.05)",
              color: active ? "#fff" : DIM,
              fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: SANS,
              cursor: "pointer", transition: "all 0.15s",
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
        padding: "14px 0", cursor: "pointer",
        borderTop: `1px solid ${BORDER}`,
      }}
      data-testid={testId ?? `settings-toggle-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div style={{ flex: 1, paddingRight: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: hov ? TEXT : "#C9D1D9", fontFamily: SANS, transition: "color 0.12s" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: DIM, fontFamily: SANS, marginTop: 3 }}>{desc}</div>}
        {warning && <div style={{ fontSize: 11, color: ORANGE, fontFamily: SANS, marginTop: 3 }}>{warning}</div>}
      </div>
      {/* Toggle switch */}
      <div
        style={{
          width: 46, height: 26, borderRadius: 13, flexShrink: 0,
          background: value ? ORANGE : "rgba(255,255,255,0.08)",
          position: "relative", transition: "background 0.2s",
          boxShadow: value ? `0 0 10px ${ORANGE}40` : "none",
        }}
        data-testid={`button-toggle-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: value ? "#fff" : "rgba(255,255,255,0.4)",
          position: "absolute", top: 3,
          left: value ? 23 : 3,
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
      borderTop: `1px solid ${BORDER}`, padding: "14px 0",
    }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#C9D1D9", fontFamily: SANS }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number" value={value} min={min} max={max}
          onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }}
          style={{
            width: 64, background: "rgba(255,255,255,0.05)",
            border: `1px solid ${BORDER}`, borderRadius: 8,
            color: TEXT, fontSize: 16, fontWeight: 700, fontFamily: MONO,
            padding: "6px 10px", textAlign: "center", outline: "none",
          }}
        />
        {suffix && <span style={{ fontSize: 13, color: DIM, fontFamily: SANS }}>{suffix}</span>}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function SettingsPage() {
  const s = useSettingsStore();
  const isMobile = useIsMobile();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("afx-settings");
      window.location.reload();
    }
  };

  return (
    <div
      style={{ maxWidth: 600, margin: "0 auto", padding: isMobile ? "24px 16px 100px" : "36px 28px 80px" }}
      data-testid="page-settings"
    >
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: TEXT, fontFamily: SANS, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: DIM, fontFamily: SANS, margin: 0 }}>
          Configure your trading preferences
        </p>
      </div>

      {/* ── Slippage Tolerance ──────────────────────────── */}
      <Card>
        <CardTitle label="Slippage Tolerance" />
        <PillGroup
          testIdPrefix="slippage"
          options={[
            { label: "0.1%", value: 0.1 },
            { label: "0.5%", value: 0.5 },
            { label: "1%",   value: 1   },
            { label: "3%",   value: 3   },
          ]}
          value={s.defaultSlPercent <= 0.1 ? 0.1 : s.defaultSlPercent <= 0.5 ? 0.5 : s.defaultSlPercent <= 1 ? 1 : 3}
          onChange={(v) => s.update({ defaultSlPercent: v })}
        />
      </Card>

      {/* ── Transaction & Gas ────────────────────────────── */}
      <Card>
        <CardTitle label="Transaction Deadline" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: TEXT, fontFamily: MONO }}>30</span>
          <span style={{ fontSize: 14, color: DIM, fontFamily: SANS }}>minutes</span>
        </div>

        <div style={{ marginTop: 20 }}>
          <CardTitle label="Gas Preference" />
          <PillGroup
            testIdPrefix="gas"
            options={[
              { label: "Low",    value: "low"    },
              { label: "Medium", value: "medium" },
              { label: "High",   value: "high"   },
            ]}
            value={"medium" as string}
            onChange={() => {}}
          />
          <div style={{ fontSize: 12, color: DIM, fontFamily: SANS, marginTop: 10 }}>Balanced speed and cost</div>
        </div>
      </Card>

      {/* ── Routing & Expert Mode ──────────────────────── */}
      <Card>
        <div style={{ paddingBottom: 4 }}>
          <ToggleRow
            label="Auto Routing"
            desc="Find the best price across DEXs"
            value={true}
            onChange={() => {}}
            testId="settings-toggle-auto-routing"
          />
          <ToggleRow
            label="Expert Mode"
            desc="Allow high slippage and skip confirmation prompts"
            value={false}
            onChange={() => {}}
            warning="Use with caution — bypasses safety checks"
            testId="settings-toggle-expert-mode"
          />
        </div>
      </Card>

      {/* ── Trading Defaults ──────────────────────────── */}
      <Card>
        <CardTitle label="Trading Defaults" />
        <ToggleRow
          label="Confirm before trade"
          desc="Show a confirmation dialog before submitting orders"
          value={s.confirmBeforeTrade}
          onChange={v => s.update({ confirmBeforeTrade: v })}
        />
        <ToggleRow
          label="Leverage warnings"
          desc="Visual warnings at high leverage levels"
          value={s.showLeverageWarnings}
          onChange={v => s.update({ showLeverageWarnings: v })}
        />
        <div style={{ paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 13, color: DIM, fontFamily: SANS, marginBottom: 12 }}>Default leverage</div>
          <PillGroup
            testIdPrefix="default-lev"
            options={[
              { label: "2x",  value: 2  },
              { label: "5x",  value: 5  },
              { label: "10x", value: 10 },
              { label: "20x", value: 20 },
            ]}
            value={[2,5,10,20].includes(s.defaultLeverage) ? s.defaultLeverage : 2}
            onChange={v => s.update({ defaultLeverage: v })}
          />
        </div>
        <div style={{ paddingTop: 14, borderTop: `1px solid ${BORDER}`, marginTop: 14 }}>
          <div style={{ fontSize: 13, color: DIM, fontFamily: SANS, marginBottom: 12 }}>Default chart timeframe</div>
          <PillGroup
            testIdPrefix="chart-tf"
            options={[
              { label: "1m",  value: "1m"  },
              { label: "5m",  value: "5m"  },
              { label: "15m", value: "15m" },
              { label: "1h",  value: "1h"  },
              { label: "4h",  value: "4h"  },
              { label: "1d",  value: "1d"  },
            ]}
            value={s.defaultChartTimeframe}
            onChange={v => s.update({ defaultChartTimeframe: v })}
          />
        </div>
      </Card>

      {/* ── TP / SL ───────────────────────────────────── */}
      <Card>
        <CardTitle label="Take Profit / Stop Loss" />
        <ToggleRow
          label="Auto-set TP/SL on new trades"
          desc="Automatically add take-profit and stop-loss to every order"
          value={s.autoSetTpSl}
          onChange={v => s.update({ autoSetTpSl: v })}
        />
        {s.autoSetTpSl && (
          <>
            <NumberRow label="Default take profit" value={s.defaultTpPercent}
              onChange={v => s.update({ defaultTpPercent: v })} suffix="%" min={0.5} max={100} />
            <NumberRow label="Default stop loss" value={s.defaultSlPercent}
              onChange={v => s.update({ defaultSlPercent: v })} suffix="%" min={0.5} max={100} />
          </>
        )}
      </Card>

      {/* ── Appearance ────────────────────────────────── */}
      <Card>
        <CardTitle label="Appearance" />
        <ToggleRow
          label="Compact mode"
          desc="Tighter spacing for more data density"
          value={s.compactMode}
          onChange={v => s.update({ compactMode: v })}
        />
        <ToggleRow
          label="Glitch effects"
          desc="Screen glitch animation on trade execution"
          value={s.showGlitchEffects}
          onChange={v => s.update({ showGlitchEffects: v })}
        />
        <ToggleRow
          label="Scan lines"
          desc="CRT-style scan line overlay"
          value={s.showScanlines}
          onChange={v => s.update({ showScanlines: v })}
        />
      </Card>

      {/* ── Notifications ─────────────────────────────── */}
      <Card>
        <CardTitle label="Notifications" />
        <ToggleRow
          label="Trade confirmations"
          desc="Show toasts when orders are placed"
          value={s.showTradeToasts}
          onChange={v => s.update({ showTradeToasts: v })}
        />
        <ToggleRow
          label="XP notifications"
          desc="Show +XP floating text after actions"
          value={s.showXpNotifications}
          onChange={v => s.update({ showXpNotifications: v })}
        />
        <ToggleRow
          label="Achievement popups"
          desc="Show unlock banners for completed achievements"
          value={s.showAchievements}
          onChange={v => s.update({ showAchievements: v })}
        />
        <ToggleRow
          label="Liquidation alerts"
          desc="Warnings when positions approach liquidation"
          value={s.showLiquidationAlerts}
          onChange={v => s.update({ showLiquidationAlerts: v })}
        />
        <ToggleRow
          label="Price alerts"
          desc="Notifications when price targets are hit"
          value={s.showPriceAlerts}
          onChange={v => s.update({ showPriceAlerts: v })}
        />
      </Card>

      {/* ── Sound ─────────────────────────────────────── */}
      <Card>
        <CardTitle label="Sound" />
        <ToggleRow
          label="Sound effects"
          desc="Audio feedback on trades and alerts"
          value={s.soundEnabled}
          onChange={v => s.update({ soundEnabled: v })}
        />
      </Card>

      {/* ── Privacy ───────────────────────────────────── */}
      <Card>
        <CardTitle label="Privacy" />
        <ToggleRow
          label="Show PnL in browser tab"
          desc="Display unrealized PnL in the tab title"
          value={s.showPnlInTitle}
          onChange={v => s.update({ showPnlInTitle: v })}
        />
        <ToggleRow
          label="Hide balances"
          desc="Mask all balance and PnL numbers"
          value={s.hideBalances}
          onChange={v => s.update({ hideBalances: v })}
        />
      </Card>

      {/* ── Support ───────────────────────────────────── */}
      <Card>
        <button
          data-testid="settings-help-btn"
          onClick={() => window.dispatchEvent(new Event("afx-open-help"))}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <HelpCircle size={18} color={ORANGE} strokeWidth={1.8} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: SANS }}>Getting Started Guide</div>
              <div style={{ fontSize: 12, color: DIM, fontFamily: SANS, marginTop: 3 }}>Step-by-step walkthrough for new users</div>
            </div>
          </div>
          <ChevronRight size={16} color={MUTED} />
        </button>
      </Card>

      {/* ── Reset ─────────────────────────────────────── */}
      <div style={{ marginTop: 4, marginBottom: 32 }}>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: "100%", padding: "15px 18px", borderRadius: 16,
              background: "transparent", border: `1px solid ${BORDER}`,
              color: DIM, fontSize: 13, fontFamily: SANS,
              fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#3A4050"; e.currentTarget.style.color = TEXT; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = DIM; }}
            data-testid="button-reset-settings"
          >
            <RotateCcw size={14} />
            Reset all settings to defaults
          </button>
        ) : (
          <div style={{
            padding: "20px", borderRadius: 16,
            background: "rgba(212,165,116,0.07)", border: "1px solid rgba(212,165,116,0.2)",
          }}>
            <div style={{ fontSize: 14, color: TEXT, fontFamily: SANS, fontWeight: 600, marginBottom: 14 }}>
              Reset all settings to defaults?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10,
                  background: ORANGE, border: "none",
                  color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: SANS, cursor: "pointer",
                }}
                data-testid="button-confirm-reset"
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10,
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                  color: DIM, fontSize: 13, fontFamily: SANS, cursor: "pointer",
                }}
                data-testid="button-cancel-reset"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: MUTED, fontFamily: MONO, paddingBottom: 20 }}>
        Azabu v1.0 — Settings saved locally on this device
      </div>
    </div>
  );
}
