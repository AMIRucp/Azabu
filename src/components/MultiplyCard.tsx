import { useState } from "react";
import { ExternalLink, AlertTriangle, ArrowUpRight } from "lucide-react";

interface MultiplyVault {
  id: string;
  collateralSymbol: string;
  collateralName: string;
  debtSymbol: string;
  maxMultiplier: number;
  netApyPercent: number;
  marketSizeUsd: number;
  category: string;
  isPegged: boolean;
  hasRewards: boolean;
  logoUrl?: string;
}

interface MultiplyConfirmData {
  vault: MultiplyVault;
  collateralAmount: number;
  targetMultiplier: number;
  totalExposure: number;
  debtAmount: number;
  netApyAtTarget: number;
  estAnnualYield: number;
  monthlyInterestCost: number;
  isNearMaxLeverage: boolean;
  deepLink: string;
}

interface MultiplyData {
  type: 'multiply_list' | 'multiply_confirm';
  vaults?: MultiplyVault[];
  confirm?: MultiplyConfirmData;
  categoryFilter?: string;
}

interface MultiplyCardProps {
  data: MultiplyData;
  onSendMessage?: (msg: string) => void;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function TokenIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35, background: '#1A1A1A', color: '#888' }}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

function Chip({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      data-testid={`chip-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className="px-3 py-1.5 rounded-full text-xs transition-colors"
      style={{ background: 'rgba(161,161,170,0.08)', color: '#9BA4AE', border: '1px solid rgba(161,161,170,0.15)' }}
    >
      {label}
    </button>
  );
}

export function MultiplyCard({ data, onSendMessage }: MultiplyCardProps) {
  if (data.type === 'multiply_list') return <MultiplyListCard vaults={data.vaults || []} onSendMessage={onSendMessage} categoryFilter={data.categoryFilter} />;
  if (data.type === 'multiply_confirm' && data.confirm) return <MultiplyConfirmCard confirm={data.confirm} />;
  return null;
}

function MultiplyListCard({ vaults, onSendMessage, categoryFilter }: { vaults: MultiplyVault[]; onSendMessage?: (msg: string) => void; categoryFilter?: string }) {
  if (vaults.length === 0) {
    return (
      <div data-testid="card-multiply-empty" className="py-4 px-3">
        <p className="text-sm" style={{ color: '#888' }}>
          No multiply vaults available{categoryFilter ? ` for ${categoryFilter}` : ''}. Try again later.
        </p>
      </div>
    );
  }

  const top3 = vaults.slice(0, 3);
  const rest = vaults.slice(3);

  return (
    <div data-testid="card-multiply-list" className="space-y-4">
      <div className="space-y-1">
        {top3.map((v) => (
          <div
            key={v.id}
            data-testid={`card-loop-${v.collateralSymbol}`}
            className="flex items-center gap-3 py-3 px-3 rounded-lg"
            style={{ background: 'rgba(161,161,170,0.03)' }}
          >
            <TokenIcon symbol={v.collateralSymbol} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-medium" style={{ color: '#E0E0E0' }}>{v.collateralName}</span>
                  <span className="text-[11px] ml-1.5" style={{ color: '#666' }}>{v.collateralSymbol}</span>
                </div>
                <div className="text-right">
                  <span className="text-[13px] font-semibold tabular-nums" style={{ color: '#9BA4AE', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {v.maxMultiplier}x
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px]" style={{ color: '#666' }}>
                  {formatUsd(v.marketSizeUsd)} {v.isPegged ? ' · Pegged' : ''}
                </span>
                <span className="text-[11px] font-medium tabular-nums" style={{
                  color: v.netApyPercent > 0 ? '#22C55E' : v.netApyPercent === 0 ? '#666' : '#F87171',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {v.netApyPercent > 0 ? '+' : ''}{v.netApyPercent.toFixed(1)}% net
                </span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: '#555' }}>
                Debt: {v.debtSymbol}
                {v.netApyPercent === 0 && ' · Price exposure only'}
              </div>
            </div>
            {onSendMessage && (
              <button
                data-testid={`button-loop-${v.collateralSymbol}`}
                onClick={() => onSendMessage(`multiply 100 ${v.collateralSymbol} ${Math.min(3, v.maxMultiplier).toFixed(0)}x`)}
                className="px-3 py-1 rounded-full text-[11px] transition-colors flex-shrink-0"
                style={{ background: 'rgba(161,161,170,0.1)', color: '#9BA4AE', border: '1px solid rgba(161,161,170,0.2)' }}
              >
                Loop
              </button>
            )}
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="space-y-0.5">
          {rest.map((v) => (
            <div
              key={v.id}
              data-testid={`card-loop-${v.collateralSymbol}`}
              className="flex items-center gap-3 py-2 px-3 rounded-lg transition-colors"
              style={{ background: 'transparent' }}
            >
              <TokenIcon symbol={v.collateralSymbol} size={22} />
              <span className="text-[12px] font-medium flex-1 min-w-0" style={{ color: '#BBB' }}>
                {v.collateralSymbol}
              </span>
              <span className="text-[11px] tabular-nums" style={{ color: '#9BA4AE', fontFamily: "'IBM Plex Mono', monospace" }}>
                {v.maxMultiplier}x
              </span>
              <span className="text-[11px] tabular-nums w-16 text-right" style={{
                color: v.netApyPercent > 0 ? '#22C55E' : '#666',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                {v.netApyPercent > 0 ? `+${v.netApyPercent.toFixed(1)}%` : '0%'}
              </span>
              <span className="text-[11px] w-14 text-right" style={{ color: '#555' }}>
                {formatUsd(v.marketSizeUsd)}
              </span>
              {onSendMessage && (
                <button
                  data-testid={`button-loop-${v.collateralSymbol}`}
                  onClick={() => onSendMessage(`multiply 100 ${v.collateralSymbol} ${Math.min(3, v.maxMultiplier).toFixed(0)}x`)}
                  className="px-2.5 py-0.5 rounded-full text-[10px] transition-colors flex-shrink-0"
                  style={{ background: 'rgba(161,161,170,0.08)', color: '#9BA4AE' }}
                >
                  Loop
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] leading-relaxed px-1" style={{ color: '#555' }}>
        Higher multiplier = higher liquidation risk. Flash loans are free; ongoing borrow interest applies.
      </div>

      {onSendMessage && (
        <div className="flex gap-2 flex-wrap">
          <Chip label="SOL loops" onClick={() => onSendMessage('show sol loops')} />
          <Chip label="BTC loops" onClick={() => onSendMessage('show btc loops')} />
          <Chip label="Earn rates" onClick={() => onSendMessage('earn rates')} />
        </div>
      )}

      <div className="flex justify-end px-1">
        <span className="text-[10px] italic" style={{ color: '#6B7280' }}>Data from Jupiter Multiply</span>
      </div>
    </div>
  );
}

function MultiplyConfirmCard({ confirm }: { confirm: MultiplyConfirmData }) {
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const c = confirm;

  return (
    <div
      data-testid="card-multiply-confirm"
      className="space-y-4 rounded-lg p-4"
      style={{
        background: 'rgba(161,161,170,0.04)',
        borderLeft: '3px solid #9BA4AE',
      }}
    >
      <div className="flex items-center gap-3">
        <TokenIcon symbol={c.vault.collateralSymbol} size={36} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: '#9BA4AE', fontFamily: "'IBM Plex Mono', monospace" }}>
              {c.targetMultiplier}x
            </span>
            <span className="text-sm font-medium" style={{ color: '#E0E0E0' }}>
              {c.vault.collateralName}
            </span>
          </div>
          <div className="text-[11px]" style={{ color: '#666' }}>
            Jupiter Multiply · Max {c.vault.maxMultiplier}x
          </div>
        </div>
      </div>

      <div className="space-y-2 pl-1">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: '#555' }}>You deposit</div>
            <div className="text-sm font-medium mt-0.5" style={{ color: '#E0E0E0', fontFamily: "'IBM Plex Mono', monospace" }}>
              {c.collateralAmount.toLocaleString()} {c.vault.collateralSymbol}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: '#555' }}>Total exposure</div>
            <div className="text-sm font-medium mt-0.5" style={{ color: '#E0E0E0', fontFamily: "'IBM Plex Mono', monospace" }}>
              ~{c.totalExposure.toLocaleString()} {c.vault.collateralSymbol}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: '#555' }}>Debt taken</div>
            <div className="text-sm font-medium mt-0.5" style={{ color: '#F87171', fontFamily: "'IBM Plex Mono', monospace" }}>
              ~{c.debtAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {c.vault.debtSymbol}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: '#555' }}>Net APY</div>
            <div className="text-sm font-semibold mt-0.5" style={{
              color: c.netApyAtTarget > 0 ? '#22C55E' : c.netApyAtTarget === 0 ? '#888' : '#F87171',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              {c.netApyAtTarget > 0 ? '+' : ''}{c.netApyAtTarget.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-1">
          <div className="text-[11px]" style={{ color: '#666' }}>
            Est. annual yield: <span style={{ color: c.estAnnualYield > 0 ? '#22C55E' : '#F87171', fontFamily: "'IBM Plex Mono', monospace" }}>${c.estAnnualYield.toFixed(2)}</span>
          </div>
          <div className="text-[11px]" style={{ color: '#666' }}>
            Monthly interest: <span style={{ color: '#F87171', fontFamily: "'IBM Plex Mono', monospace" }}>~${c.monthlyInterestCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {c.isNearMaxLeverage && (
        <div className="flex items-start gap-2 px-2 py-2 rounded-md" style={{ background: 'rgba(248,113,113,0.08)' }}>
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#F87171' }} />
          <span className="text-[11px]" style={{ color: '#F87171' }}>
            Near max leverage. Small price moves could liquidate you.
          </span>
        </div>
      )}

      <div className="text-[11px] leading-relaxed pl-1" style={{ color: '#8B7500' }}>
        This is a leveraged position built with flash loans. All steps happen atomically in one transaction.
        If {c.vault.collateralSymbol} {c.vault.isPegged ? 'de-pegs from ' + c.vault.debtSymbol : 'drops significantly'}, your position may be liquidated. Debt accrues interest continuously.
      </div>

      <label className="flex items-center gap-2 cursor-pointer pl-1" data-testid="checkbox-multiply-risk">
        <input
          type="checkbox"
          checked={riskAcknowledged}
          onChange={(e) => setRiskAcknowledged(e.target.checked)}
          className="w-3.5 h-3.5 rounded"
          style={{ accentColor: '#9BA4AE' }}
        />
        <span className="text-xs" style={{ color: '#777' }}>I understand the leverage and liquidation risks</span>
      </label>

      <div className="flex items-center gap-2">
        <a
          href={c.deepLink}
          target="_blank"
          rel="noreferrer"
          data-testid="button-confirm-multiply"
          className="px-5 py-2 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-all"
          style={{
            background: riskAcknowledged ? '#9BA4AE' : 'rgba(161,161,170,0.15)',
            color: riskAcknowledged ? '#0B0F14' : '#666',
            pointerEvents: riskAcknowledged ? 'auto' : 'none',
            opacity: riskAcknowledged ? 1 : 0.5,
          }}
        >
          Loop on Jupiter <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
        <button className="px-4 py-2 rounded-full text-sm" style={{ color: '#666' }} data-testid="button-cancel-multiply">
          Cancel
        </button>
      </div>
    </div>
  );
}
