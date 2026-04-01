import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

function formatUsd(value: number): string {
  if (value === 0) return '0.00';
  if (Math.abs(value) >= 1) return value.toFixed(2);
  if (Math.abs(value) >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
}

interface PerpsConfirmCardProps {
  data: {
    type: 'open_confirm';
    market: string;
    side: string;
    leverage: number;
    collateralAmount: number;
    sizeInBase: number;
    estimatedSizeUsd: string;
    estimatedEntryPrice: string;
    freeCollateral?: string;
    requiredCollateral?: string;
    warnings: string[];
  };
}

function prefillChatInput(text: string) {
  window.dispatchEvent(new CustomEvent('afx-prefill-chat', { detail: text }));
}

export function PerpsConfirmCard({ data }: PerpsConfirmCardProps) {
  const [dismissed, setDismissed] = useState(false);

  const isLong = data.side === 'long';
  const isHighLeverage = data.leverage > 10;

  const entryPrice = parseFloat(data.estimatedEntryPrice);
  const notionalUsd = !isNaN(entryPrice) && entryPrice > 0
    ? data.sizeInBase * entryPrice
    : parseFloat(data.estimatedSizeUsd) || 0;
  const collateralUsd = notionalUsd > 0 && data.leverage > 0
    ? notionalUsd / data.leverage
    : data.collateralAmount;

  if (dismissed) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.6 }}
        className="rounded-xl p-3 text-center"
        style={{ background: '#111520', border: '1px solid #1B2030' }}
      >
        <p className="text-xs" style={{ color: '#6B7280' }}>Trade cancelled.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid="perps-confirm-card"
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid #1B2030' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: isLong ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}
        >
          {isLong
            ? <TrendingUp className="w-4 h-4" style={{ color: '#22C55E' }} />
            : <TrendingDown className="w-4 h-4" style={{ color: '#EF4444' }} />
          }
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: '#E6EDF3' }}>
            {isLong ? 'Long' : 'Short'} {data.market}-PERP
          </div>
          <div className="text-xs" style={{ color: '#9BA4AE' }}>{data.leverage}x leverage</div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#9BA4AE' }}>
          <div>
            <div>Size</div>
            <div style={{ color: '#E6EDF3' }}>{data.sizeInBase.toFixed(4)} {data.market}</div>
          </div>
          <div>
            <div>Notional</div>
            <div style={{ color: '#E6EDF3' }}>${formatUsd(notionalUsd)}</div>
          </div>
          <div>
            <div>Collateral</div>
            <div style={{ color: '#E6EDF3' }}>${formatUsd(collateralUsd)}</div>
          </div>
          <div>
            <div>Entry Price</div>
            <div style={{ color: '#E6EDF3' }}>${formatUsd(entryPrice)}</div>
          </div>
        </div>

        {isHighLeverage && (
          <div
            className="flex items-start gap-2 p-2 rounded-lg text-xs"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>High leverage ({data.leverage}x) carries significant liquidation risk.</span>
          </div>
        )}

        {data.warnings.length > 0 && data.warnings.map((w, i) => (
          <div
            key={i}
            className="flex items-start gap-2 p-2 rounded-lg text-xs"
            style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)', color: '#F97316' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{w}</span>
          </div>
        ))}

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 py-2 rounded-lg text-xs font-medium"
            style={{ background: '#1B2030', color: '#9BA4AE', border: '1px solid #252D3A' }}
            data-testid="perps-confirm-cancel"
          >
            Cancel
          </button>
          <button
            onClick={() => prefillChatInput(`open ${data.side} ${data.market} ${data.leverage}x`)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{
              background: isLong ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: isLong ? '#22C55E' : '#EF4444',
              border: `1px solid ${isLong ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}
            data-testid="perps-confirm-execute"
          >
            {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Open in Terminal
          </button>
        </div>
      </div>
    </motion.div>
  );
}
