import { Target, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface TpSlCardProps {
  data: {
    type: 'set_tp_sl';
    market: string;
    side: string;
    orderType: 'take_profit' | 'stop_loss';
    triggerPrice: number;
    currentPrice: number | null;
    clientSide: boolean;
  };
}

function prefillChatInput(text: string) {
  window.dispatchEvent(new CustomEvent('afx-prefill-chat', { detail: text }));
}

export function TpSlCard({ data }: TpSlCardProps) {
  const isTP = data.orderType === 'take_profit';
  const label = isTP ? 'Take Profit' : 'Stop Loss';
  const Icon = isTP ? Target : ShieldAlert;
  const accentColor = isTP ? '#22C55E' : '#EF4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid="tpsl-card"
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-sm font-medium" style={{ color: '#E6EDF3' }}>{label} Order</span>
        </div>

        <div className="space-y-2 text-sm" style={{ color: '#9BA4AE' }}>
          <div className="flex justify-between">
            <span>Market</span>
            <span style={{ color: '#E6EDF3' }}>{data.market}-PERP</span>
          </div>
          <div className="flex justify-between">
            <span>Direction</span>
            <span style={{ color: '#E6EDF3' }}>{data.side.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Trigger Price</span>
            <span style={{ color: accentColor }}>${data.triggerPrice.toLocaleString()}</span>
          </div>
          {data.currentPrice && (
            <div className="flex justify-between">
              <span>Current Price</span>
              <span style={{ color: '#E6EDF3' }}>${data.currentPrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => prefillChatInput(`set ${label.toLowerCase()} at $${data.triggerPrice} for my ${data.market} ${data.side} position`)}
          className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#1B2030', color: '#E6EDF3', border: '1px solid #252D3A' }}
          data-testid="button-place-tpsl"
        >
          Set via Trading Terminal
        </button>
      </div>
    </motion.div>
  );
}
