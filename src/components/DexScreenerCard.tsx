import { useState, useEffect } from "react";
import { ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DexPair {
  pairAddress: string;
  baseToken: { address?: string; name?: string; symbol?: string };
  quoteToken: { address?: string; name?: string; symbol?: string };
  dexId: string;
  priceUsd: number | null;
  priceChange: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  volume: { h24: number | null; h6: number | null; h1: number | null };
  liquidity: { usd: number | null };
  fdv: number | null;
  marketCap: number | null;
  txns: { h24: { buys: number; sells: number } | null };
  url: string;
  pairCreatedAt: number | null;
}

interface LaunchProfile {
  tokenAddress: string;
  icon: string | null;
  description: string | null;
  url: string;
  name: string;
  pair: DexPair | null;
}

interface DexScreenerCardProps {
  data: {
    type: 'token' | 'launches';
    pair?: DexPair;
    launches?: LaunchProfile[];
  };
  onSendMessage?: (msg: string) => void;
}

function fmtNum(n: number | null | undefined, prefix = "$"): string {
  if (n == null || isNaN(n)) return "--";
  if (n >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

function fmtPrice(p: number | null | undefined): string {
  if (p == null || isNaN(p)) return "--";
  if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toExponential(4)}`;
}

function ChangeText({ value }: { value: number | null }) {
  if (value == null) return null;
  const color = value >= 0 ? '#22C55E' : '#EF4444';
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5" style={{ color }}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-semibold">{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span>
    </span>
  );
}

function TokenPairView({ pair }: { pair: DexPair }) {
  const { baseToken, quoteToken, priceUsd, priceChange, volume, liquidity, marketCap, fdv, dexId, txns, url, pairCreatedAt } = pair;
  const change24h = priceChange?.h24;

  const ageStr = pairCreatedAt
    ? (() => {
        const ts = pairCreatedAt < 1e12 ? pairCreatedAt * 1000 : pairCreatedAt;
        const diffMs = Date.now() - ts;
        if (diffMs < 0) return null;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay > 0) return `${diffDay}d`;
        if (diffHr > 0) return `${diffHr}h`;
        return `${diffMin}m`;
      })()
    : null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid="dex-screener-token-card"
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1C1C1F' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: '#E6EDF3' }}>
            {baseToken.symbol}
            <span className="text-xs font-normal ml-1" style={{ color: '#6B7280' }}>/ {quoteToken.symbol}</span>
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(52,211,153,0.1)', color: '#22C55E', letterSpacing: '0.04em' }}>
            DEXSCREENER
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase" style={{ color: '#6B7280' }}>{dexId}</span>
          {ageStr && <span className="text-[10px]" style={{ color: '#3A3A38' }}>{ageStr} old</span>}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold" style={{ color: '#E6EDF3' }} data-testid="dex-price">{fmtPrice(priceUsd)}</div>
            {baseToken.name && <div className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{baseToken.name}</div>}
          </div>
          <div className="text-right">
            <ChangeText value={change24h} />
            <div className="text-[9px] mt-0.5" style={{ color: '#3A3A38' }}>24h</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {([
            ['Volume 24h', fmtNum(volume?.h24)],
            ['Liquidity', fmtNum(liquidity?.usd)],
            ['Market Cap', fmtNum(marketCap || fdv)],
            ['Txns 24h', txns?.h24 ? `${(txns.h24.buys + txns.h24.sells).toLocaleString()}` : '--'],
          ] as [string, string][]).map(([label, val]) => (
            <div key={label} className="rounded-lg px-2 py-2" style={{ background: '#0F1320', border: '1px solid #1C1C1F' }}>
              <div className="text-[8px] uppercase mb-1" style={{ color: '#6B7280', letterSpacing: '0.06em' }}>{label}</div>
              <div className="text-[11px] font-semibold" style={{ color: '#C4C4C0' }}>{val}</div>
            </div>
          ))}
        </div>

        {(priceChange?.m5 != null || priceChange?.h1 != null || priceChange?.h6 != null) && (
          <div className="flex gap-4 px-2 py-2 rounded-lg" style={{ background: '#0F1320' }}>
            {([['5m', priceChange?.m5], ['1h', priceChange?.h1], ['6h', priceChange?.h6]] as [string, number | null][]).map(([label, val]) => (
              val != null && (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-[9px]" style={{ color: '#6B7280' }}>{label}</span>
                  <span className="text-[10px] font-semibold" style={{ color: val >= 0 ? '#22C55E' : '#EF4444' }}>
                    {val >= 0 ? '+' : ''}{val.toFixed(2)}%
                  </span>
                </div>
              )
            ))}
          </div>
        )}

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: 'rgba(52,211,153,0.08)', color: '#22C55E', border: '1px solid rgba(52,211,153,0.2)' }}
          data-testid="link-dexscreener-chart"
        >
          View chart on DexScreener
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function LaunchesView({ launches }: { launches: LaunchProfile[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? launches : launches.slice(0, 4);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030' }}
      data-testid="dex-screener-launches-card"
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1C1C1F' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: '#E6EDF3' }}>New Launches</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(52,211,153,0.1)', color: '#22C55E', letterSpacing: '0.04em' }}>
            SOLANA
          </span>
        </div>
        <div className="flex items-center gap-3">
          {launches.length > 4 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-[10px] font-medium"
              style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}
              data-testid="button-toggle-launches"
            >
              {expanded ? 'Show less' : `+${launches.length - 4} more`}
            </button>
          )}
          <a
            href="https://dexscreener.com/new-pairs/solana"
            target="_blank"
            rel="noreferrer"
            className="text-[10px]"
            style={{ color: '#6B7280', textDecoration: 'none' }}
            data-testid="link-dexscreener-all"
          >
            View all
          </a>
        </div>
      </div>

      <div>
        {shown.map((launch, i) => {
          const p = launch.pair;
          const symbol = p?.baseToken?.symbol || launch.tokenAddress.slice(0, 6).toUpperCase();
          const name = p?.baseToken?.name || launch.name || "Unknown";
          const price = p?.priceUsd ? fmtPrice(p.priceUsd) : null;
          const change = p?.priceChange?.h24;
          const vol = p?.volume?.h24 ? fmtNum(p.volume.h24) : null;
          const liq = p?.liquidity?.usd ? fmtNum(p.liquidity.usd) : null;
          const href = p?.url || launch.url;

          return (
            <a
              key={launch.tokenAddress}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-2.5 transition-colors"
              style={{
                textDecoration: 'none',
                borderBottom: i < shown.length - 1 ? '1px solid #1C1C1F' : 'none',
              }}
              data-testid={`launch-row-${i}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {launch.icon ? (
                  <img
                    src={launch.icon}
                    alt={symbol}
                    className="w-6 h-6 rounded-full shrink-0"
                    style={{ background: '#0F1320' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#22C55E' }}
                  >
                    {symbol.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold truncate max-w-[120px]" style={{ color: '#E6EDF3' }}>{symbol}</div>
                  <div className="text-[9px] truncate max-w-[120px]" style={{ color: '#6B7280' }}>{name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {vol && (
                  <div className="text-right">
                    <div className="text-[8px]" style={{ color: '#3A3A38' }}>vol</div>
                    <div className="text-[9px] font-semibold" style={{ color: '#9BA4AE' }}>{vol}</div>
                  </div>
                )}
                {liq && (
                  <div className="text-right">
                    <div className="text-[8px]" style={{ color: '#3A3A38' }}>liq</div>
                    <div className="text-[9px] font-semibold" style={{ color: '#9BA4AE' }}>{liq}</div>
                  </div>
                )}
                <div className="text-right min-w-[55px]">
                  {price && <div className="text-[11px] font-bold" style={{ color: '#E6EDF3' }}>{price}</div>}
                  {change != null ? (
                    <div className="text-[10px] font-semibold" style={{ color: change >= 0 ? '#22C55E' : '#EF4444' }}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </div>
                  ) : !price ? (
                    <div className="text-[9px]" style={{ color: '#6B7280' }}>new</div>
                  ) : null}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="px-4 py-2 text-center text-[9px]" style={{ color: '#3A3A38', borderTop: '1px solid #1C1C1F' }}>
        Live data via DexScreener Token Profiles API
      </div>
    </div>
  );
}

export function DexScreenerCard({ data, onSendMessage }: DexScreenerCardProps) {
  if (!data) return null;

  if (data.type === 'token' && data.pair) {
    return <TokenPairView pair={data.pair} />;
  }

  if (data.type === 'launches' && data.launches?.length) {
    return <LaunchesView launches={data.launches} />;
  }

  return null;
}
