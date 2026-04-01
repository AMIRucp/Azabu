import { Shield, ShieldAlert, TrendingUp, TrendingDown, CheckCircle, XCircle, Copy, ExternalLink } from "lucide-react";
import { TokenLogo } from './TokenLogo';
import { useState } from "react";

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        color: ok ? '#22C55E' : '#EF4444',
      }}
      data-testid={`badge-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  );
}

interface TokenInfoCardProps {
  data: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string | null;
    isVerified: boolean;
    tags: string[];
    dailyVolume: number | null;
    organicScore: number | null;
    freezeAuthority: string | null;
    mintAuthority: string | null;
    permanentDelegate: string | null;
    priceUsd: number | null;
    change24h: number | null;
    marketCap: number | null;
  };
}

export function TokenInfoCard({ data }: TokenInfoCardProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(data.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPositive = (data.change24h ?? 0) >= 0;
  const mintSafe = !data.mintAuthority;
  const freezeSafe = !data.freezeAuthority;
  const noPermanentDelegate = !data.permanentDelegate;

  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      data-testid="token-info-card"
    >
      <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#1C1C1F' }}>
        <Shield className="h-4 w-4" style={{ color: '#9BA4AE' }} />
        <span className="text-title3" style={{ color: '#E6EDF3' }}>Token Research</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <TokenLogo src={data.logoURI} symbol={data.symbol} size={40} />
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-body-emphasis" style={{ color: '#E6EDF3' }}>{data.name}</span>
              {data.isVerified && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
                  data-testid="badge-verified"
                >
                  Verified
                </span>
              )}
            </div>
            <span className="text-xs" style={{ color: '#6B7280' }}>{data.symbol}</span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer"
          style={{ background: '#1C1C1F' }}
          onClick={copyAddress}
          data-testid="button-copy-address"
        >
          <span className="text-xs font-mono truncate flex-1" style={{ color: '#9BA4AE' }}>
            {data.address}
          </span>
          <Copy className="h-3 w-3 shrink-0" style={{ color: copied ? '#22C55E' : '#6B7280' }} />
        </div>

        {data.priceUsd !== null && (
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Price</span>
              <span className="text-lg font-semibold" style={{ color: '#E6EDF3' }} data-testid="text-token-price">
                ${data.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </span>
            </div>
            {data.change24h !== null && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{
                  background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: isPositive ? '#22C55E' : '#EF4444',
                }}
                data-testid="text-token-change"
              >
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span className="text-xs font-medium">
                  {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {data.marketCap !== null && data.marketCap > 0 && (
            <div className="flex flex-col gap-0.5" data-testid="text-token-mcap">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Market Cap</span>
              <span className="text-xs font-medium" style={{ color: '#9BA4AE' }}>{formatLargeNumber(data.marketCap)}</span>
            </div>
          )}
          {data.dailyVolume !== null && data.dailyVolume > 0 && (
            <div className="flex flex-col gap-0.5" data-testid="text-token-volume">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Daily Volume</span>
              <span className="text-xs font-medium" style={{ color: '#9BA4AE' }}>{formatLargeNumber(data.dailyVolume)}</span>
            </div>
          )}
          {data.organicScore !== null && (
            <div className="flex flex-col gap-0.5" data-testid="text-organic-score">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Organic Score</span>
              <span className="text-xs font-medium" style={{ color: data.organicScore >= 50 ? '#22C55E' : data.organicScore >= 25 ? '#9BA4AE' : '#EF4444' }}>
                {data.organicScore}/100
              </span>
            </div>
          )}
          <div className="flex flex-col gap-0.5" data-testid="text-token-decimals">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Decimals</span>
            <span className="text-xs font-medium" style={{ color: '#9BA4AE' }}>{data.decimals}</span>
          </div>
        </div>

        <div className="pt-3 border-t space-y-2" style={{ borderColor: '#1C1C1F' }}>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Security</span>
          <div className="flex flex-wrap gap-2">
            <StatusBadge ok={mintSafe} label={mintSafe ? 'Mint Disabled' : 'Mint Active'} />
            <StatusBadge ok={freezeSafe} label={freezeSafe ? 'No Freeze' : 'Freeze Active'} />
            <StatusBadge ok={noPermanentDelegate} label={noPermanentDelegate ? 'No Delegate' : 'Has Delegate'} />
          </div>
        </div>

        {data.tags.length > 0 && (
          <div className="pt-3 border-t space-y-2" style={{ borderColor: '#1C1C1F' }}>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {data.tags.slice(0, 8).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: '#1C1C1F', color: '#9BA4AE', border: '1px solid #1B2030' }}
                  data-testid={`badge-tag-${tag}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <a
          href={`https://solscan.io/token/${data.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-md text-xs font-medium"
          style={{ background: '#1C1C1F', color: '#9BA4AE', border: '1px solid #1B2030' }}
          data-testid="link-solscan"
        >
          <ExternalLink className="h-3 w-3" />
          View on Solscan
        </a>
      </div>
    </div>
  );
}
