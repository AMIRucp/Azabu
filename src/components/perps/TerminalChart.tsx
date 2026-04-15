'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, IPriceLine, CandlestickData, HistogramData, Time } from 'lightweight-charts';
import { fetchCandles } from '@/services/candleService';
import type { CandleData } from '@/services/candleService';
import { T, mono } from './terminalTheme';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const;
type Timeframe = typeof TIMEFRAMES[number];

const TF_TO_SERVICE: Record<Timeframe, string> = {
  '1m': '1M', '5m': '5M', '15m': '15M', '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W',
};

// How often to poll for the latest candle (ms)
const TF_POLL_INTERVAL: Record<Timeframe, number> = {
  '1m': 5000,
  '5m': 10000,
  '15m': 15000,
  '1h': 30000,
  '4h': 60000,
  '1d': 120000,
  '1w': 300000,
};

function toChartCandles(candles: CandleData[]): CandlestickData<Time>[] {
  return candles.map(c => ({
    time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close,
  }));
}

interface TerminalChartProps {
  symbol: string;
  currentPrice?: number;
  onTimeframeChange?: (tf: string) => void;
  chain?: string;
}

function TerminalChartInner({ symbol, currentPrice, onTimeframeChange, chain }: TerminalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const chartReadyRef = useRef(false);
  const dataSourceRef = useRef<string>('');
  const [tf, setTf] = useState<Timeframe>('1h');
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    let cancelled = false;
    chartReadyRef.current = false;
    priceLineRef.current = null;
    setLoading(true);

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: T.bg },
        textColor: '#4A5060',
        fontSize: 10,
        fontFamily: mono,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.025)' },
        horzLines: { color: 'rgba(255,255,255,0.025)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(212,165,116,0.12)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1C2028',
        },
        horzLine: {
          color: 'rgba(212,165,116,0.12)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1C2028',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.04)',
        scaleMargins: { top: 0.06, bottom: 0.18 },
        entireTextOnly: true,
        minimumWidth: 60,
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.04)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
        barSpacing: 8,
        minBarSpacing: 3,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderUpColor: '#0ECB81',
      borderDownColor: '#F6465D',
      wickUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const isAsterSym = symbol.toUpperCase().endsWith('USDT');
    const rawSymbol = isAsterSym
      ? symbol.replace(/USDT$/i, '')
      : symbol.replace(/-PERP$/i, '').replace(/-USD$/i, '').replace(/^1M/i, '');

    fetchCandles(rawSymbol, TF_TO_SERVICE[tf], chain).then(result => {
      if (cancelled) return;

      if (!result) {
        setLoading(false);
        setDataSource('');
        setIsLive(false);
        return;
      }

      const chartCandles = toChartCandles(result.candles);
      const volumes: HistogramData<Time>[] = result.candles.map(c => ({
        time: c.time as Time,
        value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(14,203,129,0.25)' : 'rgba(246,70,93,0.25)',
      }));

      candleSeries.setData(chartCandles);
      volumeSeries.setData(volumes);
      dataSourceRef.current = result.source;
      setDataSource(result.source);
      setIsLive(true);
      setLoading(false);
      chartReadyRef.current = true;

      chart.timeScale().fitContent();
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
      setDataSource('');
      setIsLive(false);
    });

    const resizeObserver = new ResizeObserver(entries => {
      if (cancelled) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(container);

    return () => {
      cancelled = true;
      chartReadyRef.current = false;
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      priceLineRef.current = null;
    };
  }, [symbol, tf, chain]);

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !chartReadyRef.current) return;

    if (priceLineRef.current) {
      series.removePriceLine(priceLineRef.current);
      priceLineRef.current = null;
    }
    const p = currentPrice && currentPrice > 0 ? currentPrice : 0;
    if (p > 0) {
      priceLineRef.current = series.createPriceLine({
        price: p,
        color: T.orange,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '',
      });
    }
  }, [currentPrice, loading]);

  // Live polling — fetch latest candle and update the last bar
  useEffect(() => {
    if (!isLive) return;
    const isAsterSym = symbol.toUpperCase().endsWith('USDT');
    const rawSymbol = isAsterSym
      ? symbol.replace(/USDT$/i, '')
      : symbol.replace(/-PERP$/i, '').replace(/-USD$/i, '').replace(/^1M/i, '');

    const poll = async () => {
      if (!chartReadyRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return;
      try {
        const result = await fetchCandles(rawSymbol, TF_TO_SERVICE[tf], chain);
        if (!result || result.candles.length === 0) return;
        // Only update the last candle to avoid re-rendering the whole chart
        const last = result.candles[result.candles.length - 1];
        candleSeriesRef.current.update({
          time: last.time as Time,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        });
        volumeSeriesRef.current.update({
          time: last.time as Time,
          value: last.volume || 0,
          color: last.close >= last.open ? 'rgba(14,203,129,0.25)' : 'rgba(246,70,93,0.25)',
        });
      } catch { /* silent */ }
    };

    const interval = setInterval(poll, TF_POLL_INTERVAL[tf]);
    return () => clearInterval(interval);
  }, [isLive, symbol, tf, chain]);

  const handleTfChange = (t: Timeframe) => {
    setTf(t);
    onTimeframeChange?.(t);
  };

  return (
    <div
      data-testid="terminal-chart-container"
      style={{ background: T.bg, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexWrap: 'wrap',
        gap: 4,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 1 }}>
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              data-testid={`terminal-chart-tf-${t}`}
              onClick={() => handleTfChange(t)}
              style={{
                padding: '3px 7px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: tf === t ? 600 : 400,
                fontFamily: mono,
                background: tf === t ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: tf === t ? '#E0E4EA' : '#4A5060',
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {['MA', 'BOLL'].map(ind => (
            <span
              key={ind}
              style={{ fontSize: 10, color: '#3A3F4C', cursor: 'pointer', fontFamily: mono, transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = '#6F7785'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = '#3A3F4C'; }}
            >
              {ind}
            </span>
          ))}
          <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.06)' }} />
          {['VOLUME', 'MACD', 'RSI'].map(ind => (
            <span
              key={ind}
              style={{
                fontSize: 10,
                color: ind === 'VOLUME' ? '#6F7785' : '#3A3F4C',
                fontWeight: ind === 'VOLUME' ? 500 : 400,
                cursor: 'pointer',
                fontFamily: mono,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (ind !== 'VOLUME') (e.target as HTMLElement).style.color = '#6F7785'; }}
              onMouseLeave={e => { if (ind !== 'VOLUME') (e.target as HTMLElement).style.color = '#3A3F4C'; }}
            >
              {ind}
            </span>
          ))}
          {dataSource && (
            <span
              data-testid="terminal-chart-source"
              style={{
                fontSize: 9, color: '#2A2F3A', fontFamily: mono, marginLeft: 4,
                padding: '1px 5px', borderRadius: 3,
                background: 'rgba(255,255,255,0.03)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {isLive && (
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#0ECB81',
                  boxShadow: '0 0 4px #0ECB81',
                  display: 'inline-block',
                  animation: 'livePulse 2s ease-in-out infinite',
                }} />
              )}
              {dataSource === 'coingecko' ? 'CoinGecko' : dataSource === 'aster' ? 'Aster' : dataSource === 'hyperliquid' ? 'Hyperliquid' : 'Sim'}
            </span>
          )}
        </div>
      </div>

      <div
        ref={chartContainerRef}
        style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 200, position: 'relative' }}
      >
        {loading && (
          <div
            data-testid="terminal-chart-loading"
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4A5060', fontFamily: mono, fontSize: 11,
              zIndex: 2, background: T.bg,
            }}
          >
            Loading chart...
          </div>
        )}
        {!loading && !dataSource && (
          <div
            data-testid="terminal-chart-no-data"
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: '#4A5060', fontFamily: mono, fontSize: 11,
              zIndex: 2, background: T.bg, gap: 6,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2F3A" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 3l18 18M9 9v6m6-6v6M3 17V7a2 2 0 012-2h4m4 0h4a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            <span>No chart data available</span>
          </div>
        )}
      </div>
    </div>
  );
}

const TerminalChart = memo(TerminalChartInner, (prev, next) => {
  return prev.symbol === next.symbol && prev.currentPrice === next.currentPrice && prev.chain === next.chain;
});

export default TerminalChart;
