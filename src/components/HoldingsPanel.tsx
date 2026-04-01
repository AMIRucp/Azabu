import { Wallet, TrendingUp } from "lucide-react";
import { TokenLogo } from "./TokenLogo";

interface EnrichedHolding {
  mint: string;
  name: string;
  symbol: string;
  logoURI: string | null;
  balance: number;
  balanceRaw: string;
  decimals: number;
  usdValue: number | null;
  usdPrice: number | null;
  priceChange24h: number | null;
  isVerified: boolean;
  tags: string[];
  category?: 'crypto' | 'stock' | 'etf' | 'commodity';
  company?: string;
}

interface HoldingsPanelProps {
  holdings: {
    solBalance?: number;
    solUsdPrice?: number;
    solUsdValue?: number;
    totalUsdValue?: number;
    tokens?: EnrichedHolding[];
    sol_balance?: number;
  };
}

const CHART_COLORS = [
  '#60A5FA',
  '#22C55E',
  '#9BA4AE',
  '#EF4444',
  '#A78BFA',
  '#22C55E',
  '#FB923C',
  '#F472B6',
  '#3B82F6',
  '#818CF8',
];

function formatUsdCompact(value: number): string {
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K';
  return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPrice(price: number): string {
  if (price >= 1) return '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return '$' + price.toFixed(4);
  if (price >= 0.0001) return '$' + price.toFixed(6);
  return '$' + price.toFixed(8);
}

interface ChartSlice {
  symbol: string;
  value: number;
  pct: number;
  color: string;
}

function DonutChart({ slices, totalUsd }: { slices: ChartSlice[]; totalUsd: number }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 58;
  const innerR = 40;

  let cumAngle = -90;

  function arcPath(startAngle: number, endAngle: number, outer: number, inner: number) {
    const s1 = (startAngle * Math.PI) / 180;
    const e1 = (endAngle * Math.PI) / 180;
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const x1 = cx + outer * Math.cos(s1);
    const y1 = cy + outer * Math.sin(s1);
    const x2 = cx + outer * Math.cos(e1);
    const y2 = cy + outer * Math.sin(e1);
    const x3 = cx + inner * Math.cos(e1);
    const y3 = cy + inner * Math.sin(e1);
    const x4 = cx + inner * Math.cos(s1);
    const y4 = cy + inner * Math.sin(s1);
    return `M${x1},${y1} A${outer},${outer} 0 ${largeArc} 1 ${x2},${y2} L${x3},${y3} A${inner},${inner} 0 ${largeArc} 0 ${x4},${y4} Z`;
  }

  if (slices.length === 0) return null;

  if (slices.length === 1) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} data-testid="donut-chart">
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={slices[0].color} strokeWidth={outerR - innerR} strokeDasharray={`${2 * Math.PI * ((outerR + innerR) / 2)}`} opacity={0.85} />
        <circle cx={cx} cy={cy} r={innerR} fill="#111520" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#E6EDF3" fontSize="13" fontWeight="600" fontFamily="inherit">
          {formatUsdCompact(totalUsd)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="inherit">
          total
        </text>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} data-testid="donut-chart">
      {slices.map((slice, i) => {
        const sweepAngle = Math.max((slice.pct / 100) * 360, 1);
        const startAngle = cumAngle;
        const endAngle = cumAngle + sweepAngle;
        cumAngle = endAngle;
        const gap = slices.length > 1 ? 1.2 : 0;
        return (
          <path
            key={slice.symbol + i}
            d={arcPath(startAngle + gap / 2, endAngle - gap / 2, outerR, innerR)}
            fill={slice.color}
            opacity={0.85}
          >
            <title>{slice.symbol}: {slice.pct.toFixed(1)}%</title>
          </path>
        );
      })}
      <circle cx={cx} cy={cy} r={innerR} fill="#111520" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#E6EDF3" fontSize="13" fontWeight="600" fontFamily="inherit">
        {formatUsdCompact(totalUsd)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="inherit">
        total
      </text>
    </svg>
  );
}

export function HoldingsPanel({ holdings }: HoldingsPanelProps) {
  const solBalance = holdings?.solBalance ?? (holdings?.sol_balance ? holdings.sol_balance / 1e9 : null);
  const tokens: EnrichedHolding[] = holdings?.tokens || [];
  const totalUsd = holdings?.totalUsdValue;
  const solUsdPrice = holdings?.solUsdPrice ?? null;
  const solUsdValue = holdings?.solUsdValue ?? null;

  const stockCategories = new Set(['stock', 'etf', 'commodity']);
  const cryptoTokens = tokens.filter(t => !t.category || !stockCategories.has(t.category));
  const stockTokens = tokens.filter(t => t.category && stockCategories.has(t.category));

  if (solBalance === null && tokens.length === 0) {
    return (
      <div
        className="w-full max-w-sm rounded-xl p-5 text-center text-footnote"
        style={{ background: '#111520', border: '1px solid #1B2030' }}
        data-testid="holdings-empty-card"
      >
        No holdings found.
      </div>
    );
  }

  const assetCount = tokens.length + (solBalance !== null && solBalance > 0 ? 1 : 0);

  const chartSlices: ChartSlice[] = [];
  if (totalUsd && totalUsd > 0) {
    if (solUsdValue && solUsdValue > 0) {
      chartSlices.push({ symbol: 'SOL', value: solUsdValue, pct: (solUsdValue / totalUsd) * 100, color: CHART_COLORS[0] });
    }
    tokens.forEach((t, i) => {
      if (t.usdValue && t.usdValue > 0) {
        chartSlices.push({ symbol: t.symbol, value: t.usdValue, pct: (t.usdValue / totalUsd) * 100, color: CHART_COLORS[(i + 1) % CHART_COLORS.length] });
      }
    });
    chartSlices.sort((a, b) => b.value - a.value);
  }

  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden"
      style={{ background: '#111520', border: '1px solid #1B2030', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
      data-testid="holdings-card"
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: '#1B2030' }}>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" style={{ color: '#E6EDF3' }} />
            <span className="text-title3">Portfolio</span>
          </div>
          <span className="text-footnote">
            {assetCount} asset{assetCount !== 1 ? 's' : ''}
          </span>
        </div>

        {totalUsd !== undefined && totalUsd > 0 && chartSlices.length > 0 && (
          <div className="flex items-center gap-5">
            <DonutChart slices={chartSlices} totalUsd={totalUsd} />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              {chartSlices.slice(0, 5).map((slice, i) => (
                <div key={slice.symbol + i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: slice.color }} />
                  <span className="text-footnote truncate" style={{ color: '#E6EDF3' }}>{slice.symbol}</span>
                  <span className="text-footnote ml-auto shrink-0" style={{ color: '#9BA4AE' }}>{slice.pct.toFixed(1)}%</span>
                </div>
              ))}
              {chartSlices.length > 5 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#6B7280' }} />
                  <span className="text-footnote" style={{ color: '#6B7280' }}>+{chartSlices.length - 5} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {totalUsd !== undefined && totalUsd > 0 && chartSlices.length === 0 && (
          <p className="text-display financial-value" data-testid="text-total-usd">
            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div>
        {(solBalance !== null || cryptoTokens.length > 0) && (
          <>
            {stockTokens.length > 0 && (
              <div className="px-5 py-2 text-caption uppercase tracking-wide" style={{ color: '#9BA4AE', background: '#0F1320' }} data-testid="section-crypto">
                Crypto
              </div>
            )}
            {solBalance !== null && solBalance > 0 && (
              <HoldingRow
                index={0}
                symbol="SOL"
                name="Solana"
                logoURI="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                balance={solBalance}
                usdValue={solUsdValue}
                usdPrice={solUsdPrice}
                priceChange24h={null}
                isVerified={true}
                color={chartSlices.find(s => s.symbol === 'SOL')?.color || null}
              />
            )}
            {cryptoTokens.map((token, i) => (
              <HoldingRow
                key={token.mint}
                index={i + 1}
                symbol={token.symbol}
                name={token.name}
                logoURI={token.logoURI}
                balance={token.balance}
                usdValue={token.usdValue}
                usdPrice={token.usdPrice}
                priceChange24h={token.priceChange24h}
                isVerified={token.isVerified}
                color={chartSlices.find(s => s.symbol === token.symbol)?.color || null}
              />
            ))}
          </>
        )}

        {stockTokens.length > 0 && (
          <>
            <div className="px-5 py-2 flex items-center gap-1.5 text-caption uppercase tracking-wide" style={{ color: '#22C55E', background: '#0F1320' }} data-testid="section-stocks">
              <TrendingUp className="h-3 w-3" />
              Stocks & RWAs
            </div>
            {stockTokens.map((token, i) => (
              <HoldingRow
                key={token.mint}
                index={cryptoTokens.length + i + 1}
                symbol={token.symbol}
                name={token.company || token.name}
                logoURI={token.logoURI}
                balance={token.balance}
                usdValue={token.usdValue}
                usdPrice={token.usdPrice}
                priceChange24h={token.priceChange24h}
                isVerified={token.isVerified}
                isStock={true}
                color={chartSlices.find(s => s.symbol === token.symbol)?.color || null}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function HoldingRow({ index, symbol, name, logoURI, balance, usdValue, usdPrice, priceChange24h, isVerified, isStock, color }: {
  index: number;
  symbol: string;
  name: string;
  logoURI: string | null;
  balance: number;
  usdValue: number | null;
  usdPrice: number | null;
  priceChange24h: number | null;
  isVerified: boolean;
  isStock?: boolean;
  color: string | null;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 px-5 py-3 sm:py-3.5 border-b transition-colors flex-wrap"
      style={{ borderColor: '#1B2030' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1C1C1F')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      data-testid={`row-holding-${index}`}
    >
      <div className="flex items-center gap-3">
        {color && (
          <div className="w-1 h-8 rounded-full shrink-0" style={{ background: color, opacity: 0.7 }} />
        )}
        <TokenLogo src={logoURI} symbol={symbol} size={32} />
        <div className="flex flex-col">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-body-emphasis">{symbol}</span>
            {isStock && (
              <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                stock
              </span>
            )}
            {!isVerified && !isStock && (
              <span className="text-[9px] px-1 rounded" style={{ background: 'rgba(161,161,170,0.15)', color: '#9BA4AE' }}>
                unverified
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-footnote">{name}</span>
            {usdPrice !== null && usdPrice > 0 && (
              <span className="text-[10px]" style={{ color: '#6B7280' }} data-testid={`text-price-${index}`}>
                {formatPrice(usdPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="token-amount-sm">
          {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}
        </span>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {usdValue !== null && usdValue > 0 && (
            <span className="usd-value" data-testid={`text-usd-value-${index}`}>
              {formatUsdCompact(usdValue)}
            </span>
          )}
          {priceChange24h !== null && priceChange24h !== undefined && (
            <span className={`price-change ${priceChange24h >= 0 ? 'positive' : 'negative'}`}>
              {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
