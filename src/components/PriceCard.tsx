import { TrendingUp, TrendingDown } from "lucide-react";
import { ActionGraphic } from './ActionGraphic';
import { TokenLogo } from './TokenLogo';

function ChangePill({ value, label }: { value: number | null; label: string }) {
  if (value === null || value === undefined) return null;
  const isPositive = value >= 0;
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        color: isPositive ? '#22C55E' : '#EF4444',
      }}
      data-testid={`text-price-change-${label}`}
    >
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{value.toFixed(2)}%
      <span style={{ color: isPositive ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)' }}>{label}</span>
    </div>
  );
}

function ChainBadge({ chain }: { chain: string }) {
  const labels: Record<string, string> = {
    solana: 'Solana',
    ethereum: 'Ethereum',
    bitcoin: 'Bitcoin',
    'multi-chain': 'Multi-chain',
  };
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: '#1C1C1F', color: '#9BA4AE', border: '1px solid #1B2030' }}
      data-testid="badge-chain"
    >
      {labels[chain] || chain}
    </span>
  );
}

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

interface PriceCardProps {
  data: {
    symbol: string;
    name?: string;
    priceUsd: number;
    usdPrice?: number;
    change1h?: number | null;
    change24h?: number | null;
    priceChange24h?: number | null;
    change7d?: number | null;
    marketCap?: number | null;
    volume24h?: number | null;
    rank?: number | null;
    source?: string;
    logoURI?: string | null;
    chain?: string;
  };
}

export function PriceCard({ data }: PriceCardProps) {
  const price = data.priceUsd ?? data.usdPrice ?? 0;
  const change24h = data.change24h ?? data.priceChange24h ?? null;
  const isPositive24h = (change24h ?? 0) >= 0;

  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden p-5"
      style={{ background: '#111520', border: '1px solid #1B2030', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      data-testid="price-card"
    >
      <ActionGraphic action="price" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TokenLogo src={data.logoURI || null} symbol={data.symbol} size={40} />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-body-emphasis" style={{ color: '#E6EDF3' }}>{data.symbol}</span>
              {data.chain && <ChainBadge chain={data.chain} />}
            </div>
            {data.name && (
              <span className="text-xs" style={{ color: '#6B7280' }}>{data.name}</span>
            )}
          </div>
        </div>

        {data.rank && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ background: '#1C1C1F', color: '#9BA4AE' }}
            data-testid="text-rank"
          >
            #{data.rank}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-caption" style={{ color: '#6B7280' }}>Current price</span>
          <span className="token-amount" data-testid="text-price-value" style={{ color: '#E6EDF3' }}>
            ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
          </span>
        </div>
        {change24h !== null && (
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{
              background: isPositive24h ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: isPositive24h ? '#22C55E' : '#EF4444',
            }}
            data-testid="text-price-change"
          >
            {isPositive24h ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {isPositive24h ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {(data.change1h !== null && data.change1h !== undefined) || (data.change7d !== null && data.change7d !== undefined) ? (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <ChangePill value={data.change1h ?? null} label="1h" />
          <ChangePill value={data.change7d ?? null} label="7d" />
        </div>
      ) : null}

      {(data.marketCap || data.volume24h) && (
        <div className="mt-3 pt-3 flex items-center gap-4" style={{ borderTop: '1px solid #1B2030' }}>
          {data.marketCap && (
            <div className="flex flex-col" data-testid="text-market-cap">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Market Cap</span>
              <span className="text-xs font-medium" style={{ color: '#9BA4AE' }}>{formatLargeNumber(data.marketCap)}</span>
            </div>
          )}
          {data.volume24h && (
            <div className="flex flex-col" data-testid="text-volume">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Volume 24h</span>
              <span className="text-xs font-medium" style={{ color: '#9BA4AE' }}>{formatLargeNumber(data.volume24h)}</span>
            </div>
          )}
        </div>
      )}

      {data.source && (
        <div className="mt-3 flex justify-end">
          <span className="text-[10px] italic" style={{ color: '#6B7280' }}>
            Source: {data.source === 'jupiter' ? 'Jupiter Price API' : data.source === 'coingecko' ? 'CoinGecko API' : 'CoinMarketCap API'}
          </span>
        </div>
      )}
    </div>
  );
}
