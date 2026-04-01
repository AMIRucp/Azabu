"use client";

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { TrendingUp, TrendingDown, Loader2, BarChart3, LineChart } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { TokenLogo } from "./TokenLogo";

const PerpChart = lazy(() => import("./PerpChart"));

interface ChartPoint {
  timestamp: number;
  price: number;
}

interface ChartData {
  symbol: string;
  name?: string;
  prices: ChartPoint[];
  currentPrice: number;
  changePeriod: number | null;
  high: number;
  low: number;
  days: number;
  logoURI?: string | null;
  chain?: string;
}

interface ChartCardProps {
  data: ChartData;
  onSendMessage?: (msg: string) => void;
}

const TIMEFRAMES = [
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(8)}`;
}

function formatAxisPrice(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (n >= 1) return n.toFixed(0);
  if (n >= 0.01) return n.toFixed(2);
  return n.toFixed(4);
}

function formatDate(ts: number, days: number): string {
  const d = new Date(ts);
  if (days <= 1) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (days <= 30) return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
}

function CustomTooltip({ active, payload, label, days }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: "#1A1A1A",
        border: "1px solid #333",
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 11,
        fontFamily: "monospace",
      }}
    >
      <div style={{ color: "#9BA4AE", marginBottom: 2 }}>{formatDate(p.timestamp, days)}</div>
      <div style={{ color: "#E6EDF3", fontWeight: 700 }}>{formatPrice(p.price)}</div>
    </div>
  );
}

export function ChartCard({ data, onSendMessage }: ChartCardProps) {
  const [activeTf, setActiveTf] = useState(data.days);
  const [chartData, setChartData] = useState<ChartPoint[]>(data.prices);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(data.currentPrice);
  const [change, setChange] = useState(data.changePeriod);
  const [high, setHigh] = useState(data.high);
  const [low, setLow] = useState(data.low);
  const [viewMode, setViewMode] = useState<'area' | 'candle'>('area');

  const isPositive = (change ?? 0) >= 0;
  const gradientColor = isPositive ? "#22C55E" : "#EF4444";

  const tfLabel = activeTf === 1 ? "24h" : activeTf <= 7 ? `${activeTf}d` : activeTf <= 90 ? `${activeTf}d` : `${Math.round(activeTf / 30)}mo`;

  useEffect(() => {
    if (activeTf === data.days) return;
    setLoading(true);
    setFetchError(false);
    fetch(`/api/chart?symbol=${data.symbol}&days=${activeTf}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d.prices) {
          setChartData(d.prices);
          setCurrentPrice(d.currentPrice);
          setChange(d.changePeriod);
          setHigh(d.high);
          setLow(d.low);
          setFetchError(false);
        } else {
          setFetchError(true);
        }
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [activeTf, data.symbol, data.days]);

  const sampledData = useMemo(() => {
    if (chartData.length <= 200) return chartData;
    const step = Math.ceil(chartData.length / 200);
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1);
  }, [chartData]);

  return (
    <div
      className="w-full max-w-sm rounded-xl overflow-hidden"
      style={{ background: "#111520", border: "1px solid #1B2030", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
      data-testid="chart-card"
    >
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <TokenLogo symbol={data.symbol} src={data.logoURI} size={24} />
          <div>
            <span className="text-sm font-semibold" style={{ color: "#E6EDF3" }}>{data.symbol}</span>
            {data.name && (
              <span className="text-xs ml-1.5" style={{ color: "#6B7280" }}>{data.name}</span>
            )}
          </div>
          {data.chain && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "#1C1C1F", color: "#9BA4AE", border: "1px solid #1B2030" }}>
              {data.chain}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl font-bold tabular-nums" style={{ color: "#E6EDF3", fontFamily: "monospace" }} data-testid="chart-current-price">
            {formatPrice(currentPrice)}
          </span>
          {change != null && (
            <span
              className="flex items-center gap-0.5 text-xs font-semibold"
              style={{ color: isPositive ? "#22C55E" : "#EF4444" }}
              data-testid="chart-change"
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}{change.toFixed(2)}%
              <span style={{ color: "#6B7280", fontWeight: 400, marginLeft: 2 }}>{tfLabel}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-0.5 px-4 mb-1 items-center">
        {viewMode === 'area' && TIMEFRAMES.map(tf => (
          <button
            key={tf.days}
            onClick={() => setActiveTf(tf.days)}
            data-testid={`chart-tf-${tf.label}`}
            className="text-[10px] font-semibold px-2 py-1 rounded transition-colors"
            style={{
              background: activeTf === tf.days ? "rgba(255,255,255,0.08)" : "transparent",
              color: activeTf === tf.days ? "#E6EDF3" : "#6B7280",
              border: "none",
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            {tf.label}
          </button>
        ))}
        <button
          onClick={() => setViewMode(viewMode === 'area' ? 'candle' : 'area')}
          data-testid="chart-toggle-view"
          className="ml-auto p-1 rounded transition-colors"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "#9BA4AE",
            border: "none",
            cursor: "pointer",
          }}
          title={viewMode === 'area' ? 'Switch to candlestick' : 'Switch to area chart'}
        >
          {viewMode === 'area' ? <BarChart3 className="w-3.5 h-3.5" /> : <LineChart className="w-3.5 h-3.5" />}
        </button>
      </div>

      {viewMode === 'candle' ? (
        <div className="px-1" style={{ minHeight: 180 }}>
          <Suspense fallback={
            <div className="flex items-center justify-center" style={{ height: 360 }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#6B7280" }} />
            </div>
          }>
            <PerpChart symbol={data.symbol} currentPrice={currentPrice} />
          </Suspense>
        </div>
      ) : (
        <div className="px-2" style={{ height: 180 }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#6B7280" }} />
            </div>
          ) : fetchError ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs" style={{ color: "#6B7280" }}>Failed to load chart data for this timeframe</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sampledData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`chartGrad-${data.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={gradientColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 9, fill: "#6B7280", fontFamily: "monospace" }}
                  tickFormatter={(ts) => formatDate(ts, activeTf)}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={50}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 9, fill: "#6B7280", fontFamily: "monospace" }}
                  tickFormatter={formatAxisPrice}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip content={<CustomTooltip days={activeTf} />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={gradientColor}
                  strokeWidth={1.5}
                  fill={`url(#chartGrad-${data.symbol})`}
                  dot={false}
                  animationDuration={600}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      <div className="px-4 pb-3 pt-1">
        <div className="flex justify-between text-[10px] mb-3" style={{ fontFamily: "monospace" }}>
          <span style={{ color: "#6B7280" }}>
            H: <span style={{ color: "#22C55E" }}>{formatPrice(high)}</span>
          </span>
          <span style={{ color: "#6B7280" }}>
            L: <span style={{ color: "#F87171" }}>{formatPrice(low)}</span>
          </span>
          <span style={{ color: "#6B7280" }}>CoinGecko</span>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onSendMessage?.(`buy ${data.symbol}`)}
            className="flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-colors"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer" }}
            data-testid="chart-buy-btn"
          >
            Buy {data.symbol}
          </button>
          <button
            onClick={() => onSendMessage?.(`is ${data.symbol} safe?`)}
            className="text-[11px] font-semibold py-1.5 px-3 rounded-md transition-colors"
            style={{ background: "#1C1C1F", color: "#9BA4AE", border: "1px solid #1B2030", cursor: "pointer" }}
            data-testid="chart-safety-btn"
          >
            Safety
          </button>
        </div>
      </div>
    </div>
  );
}
