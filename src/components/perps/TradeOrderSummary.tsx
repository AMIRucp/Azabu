"use client";

import { AlertTriangle } from "lucide-react";

interface Theme {
  bg: string; bgCard: string; bgEl: string; bgHover: string; bgInput: string;
  border: string; borderSub: string; text: string; text2: string; text3: string;
  green: string; greenDim: string; red: string; redDim: string; orange: string; orangeDim: string;
}

const mono = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";

export interface OrderSummaryProps {
  T: Theme;
  sizeNum: number;
  posValue: number;
  collateral: number;
  lev: number;
  liqPrice: number;
  liqDist: number;
  fee: number;
  feeRate: number;
  totalCost: number;
  market: { sym: string; price: number };
  showLeverageWarnings: boolean;
  effectiveLev?: number;
}

export default function TradeOrderSummary({
  T, sizeNum, posValue, collateral, lev, liqPrice, liqDist, fee, feeRate, totalCost, market, showLeverageWarnings, effectiveLev,
}: OrderSummaryProps) {
  const displayLev = effectiveLev ?? lev;
  return (
    <>
      {sizeNum > 0 && (
        <div data-testid="trade-leverage-explainer" style={{
          background: T.bg, borderRadius: 5, padding: "7px 10px", marginBottom: 8,
          fontSize: 9, color: T.text3, fontFamily: mono, lineHeight: 1.6,
          border: `1px solid ${T.borderSub}`,
        }}>
          <span style={{ color: T.text }}>${collateral.toFixed(2)}</span> margin controls a{" "}
          <span style={{ color: T.orange }}>${posValue.toFixed(2)}</span> position.{" "}
          <span style={{ color: T.orange }}>Leverage multiplies it {effectiveLev ? `${lev}x (${effectiveLev}x effective)` : `${lev}x`}.</span>
        </div>
      )}

      <div style={{ background: T.bg, borderRadius: 6, padding: 10, marginBottom: 12 }}>
        {sizeNum > 0 && (
          <div data-testid="trade-summary-position-size" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${T.borderSub}` }}>
            <span style={{ fontSize: 9, color: T.text3, fontFamily: mono }}>Position Size</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: mono }}>${posValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 8, color: T.text3, fontFamily: mono }}>{sizeNum.toFixed(sizeNum < 1 ? 4 : 2)} {market.sym}</div>
            </div>
          </div>
        )}
        {[
          { l: "Margin (collateral)", v: sizeNum ? `$${collateral.toFixed(2)}` : "\u2014", id: "margin" },
          { l: "Leverage effect", v: sizeNum ? `$${collateral.toFixed(2)} -> $${posValue.toFixed(2)} (${effectiveLev ? `${displayLev}x eff.` : `${lev}x`})` : "\u2014", id: "leverage-effect", color: T.orange },
          { l: "Liq. Price (est.)", v: sizeNum ? `$${liqPrice.toFixed(2)} (${liqDist.toFixed(1)}% away)` : "\u2014", id: "liq-price", color: liqDist < 2 ? T.red : liqDist < 5 ? T.orange : T.text },
          { l: `Entry Fee (${(feeRate * 100).toFixed(3)}%)`, v: sizeNum ? `$${fee.toFixed(2)}` : "\u2014", id: "fee" },
        ].map(r => (
          <div key={r.id} data-testid={`trade-summary-${r.id}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: T.text3, fontFamily: mono }}>{r.l}</span>
            <span style={{ fontSize: 10, color: r.color || T.text, fontFamily: mono }}>{r.v}</span>
          </div>
        ))}
        {sizeNum > 0 && (
          <div data-testid="trade-summary-total-cost" style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.borderSub}` }}>
            <span style={{ fontSize: 9, color: T.text3, fontFamily: mono, fontWeight: 600 }}>Total Cost to Enter</span>
            <span style={{ fontSize: 11, color: T.text, fontFamily: mono, fontWeight: 800 }}>${totalCost.toFixed(2)}</span>
          </div>
        )}
      </div>

      {showLeverageWarnings && displayLev >= 100 && sizeNum > 0 && (
        <div data-testid="trade-extreme-leverage-warning" style={{
          padding: "7px 10px", borderRadius: 5, marginBottom: 10,
          background: T.redDim, border: "1px solid rgba(239,68,97,0.15)",
          fontSize: 9, color: T.red, fontFamily: mono, lineHeight: 1.5,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span>Extreme leverage -- a ${Math.abs(market.price - liqPrice).toFixed(2)} price move ({liqDist.toFixed(1)}%) wipes your entire ${collateral.toFixed(2)} margin</span>
        </div>
      )}

      {showLeverageWarnings && displayLev >= 50 && displayLev < 100 && sizeNum > 0 && (
        <div data-testid="trade-high-leverage-warning" style={{
          padding: "7px 10px", borderRadius: 5, marginBottom: 10,
          background: T.orangeDim, border: "1px solid rgba(249,115,22,0.15)",
          fontSize: 9, color: T.orange, fontFamily: mono, lineHeight: 1.4,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0 }} />
          <span>High leverage -- liquidation is {liqDist.toFixed(1)}% from entry</span>
        </div>
      )}
    </>
  );
}
