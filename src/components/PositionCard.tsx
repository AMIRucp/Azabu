import { TrendingUp, TrendingDown, X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { TokenLogo } from "@/components/TokenLogo";

interface Position {
  market: string;
  marketIndex: number;
  side: string;
  sizeBase: number;
  sizeUsd: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
}

interface PositionCardProps {
  data: {
    type: 'positions' | 'close_confirm';
    positions?: Position[];
    market?: string;
    direction?: 'long' | 'short';
    sizeUsd?: number;
  };
}

function prefillChatInput(text: string) {
  window.dispatchEvent(new CustomEvent('afx-prefill-chat', { detail: text }));
}

export function PositionCard({ data }: PositionCardProps) {
  if (data.type === 'close_confirm' && data.market) {
    return <CloseConfirmView market={data.market} direction={data.direction || 'long'} sizeUsd={data.sizeUsd || 0} />;
  }
  if (data.type === 'positions' && data.positions) {
    return <PositionsListView positions={data.positions} />;
  }
  return null;
}

function PositionsListView({ positions }: { positions: Position[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
      data-testid="positions-list"
    >
      {positions.map((pos) => (
        <PositionRow key={`${pos.market}-${pos.side}`} position={pos} />
      ))}
    </motion.div>
  );
}

function PositionRow({ position: pos }: { position: Position }) {
  const isLong = pos.side === 'LONG';
  const isPnlPositive = pos.unrealizedPnl >= 0;

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid={`position-row-${pos.market}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TokenLogo symbol={pos.market} size={28} />
          <div>
            <span className="text-sm font-medium" style={{ color: '#E6EDF3' }}>{pos.market}-PERP</span>
            <span
              className="text-xs font-medium ml-2"
              style={{ color: isLong ? '#22C55E' : '#EF4444' }}
            >
              {pos.side}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-sm font-medium"
            style={{ color: isPnlPositive ? '#22C55E' : '#EF4444' }}
          >
            {isPnlPositive ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({isPnlPositive ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
          </div>
          <div className="text-xs" style={{ color: '#9BA4AE' }}>PnL</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: '#9BA4AE' }}>
        <div>
          <div>Size</div>
          <div style={{ color: '#E6EDF3' }}>${pos.sizeUsd.toFixed(2)}</div>
        </div>
        <div>
          <div>Entry</div>
          <div style={{ color: '#E6EDF3' }}>${pos.entryPrice.toFixed(2)}</div>
        </div>
        <div>
          <div>Current</div>
          <div style={{ color: '#E6EDF3' }}>${pos.currentPrice.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#9BA4AE' }}>
        <div>
          <div>Size (Base)</div>
          <div style={{ color: '#E6EDF3' }}>{pos.sizeBase.toFixed(4)} {pos.market}</div>
        </div>
      </div>

      <div className="flex gap-1.5 pt-1">
        <button
          onClick={() => prefillChatInput(`close my ${pos.market} ${pos.side.toLowerCase()}`)}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
          style={{ background: '#1C1C1F', color: '#E6EDF3', border: '1px solid #1B2030' }}
          data-testid={`close-position-${pos.market}`}
        >
          <X className="w-3 h-3" /> Close
        </button>
        <button
          onClick={() => prefillChatInput(`deposit USDC`)}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
          style={{ background: '#1C1C1F', color: '#E6EDF3', border: '1px solid #1B2030' }}
          data-testid={`add-collateral-${pos.market}`}
        >
          <Plus className="w-3 h-3" /> Deposit
        </button>
      </div>
    </div>
  );
}

function CloseConfirmView({ market, direction, sizeUsd }: { market: string; direction: "long" | "short"; sizeUsd: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid="perps-close-confirm"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#EF444420' }}>
          <X className="w-4 h-4" style={{ color: '#E6EDF3' }} />
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: '#E6EDF3' }}>Close {market}-PERP Position</div>
          <div className="text-xs" style={{ color: '#9BA4AE' }}>
            Close your {direction} position (${sizeUsd.toFixed(2)}) via the trading terminal.
          </div>
        </div>
      </div>
      <button
        onClick={() => prefillChatInput(`go to trade ${market}`)}
        className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        style={{ background: '#1B2030', color: '#E6EDF3', border: '1px solid #252D3A' }}
        data-testid="perps-close-confirm-btn"
      >
        {direction === 'long' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        Open Trading Terminal
      </button>
    </motion.div>
  );
}
