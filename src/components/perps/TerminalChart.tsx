'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, IPriceLine, CandlestickData, HistogramData, Time } from 'lightweight-charts';
import { fetchCandles } from '@/services/candleService';
import type { CandleData } from '@/services/candleService';
import { T, mono } from './terminalTheme';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
type Timeframe = typeof TIMEFRAMES[number];

const TF_TO_SERVICE: Record<Timeframe, string> = {
  '1m': '1M', '5m': '5M', '15m': '15M', '1h': '1H', '4h': '4H', '1d': '1D',
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
  const [tf, setTf] = useState<Timeframe>('1h');
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('');

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
      handleScroll: { vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true },
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

      const chartCandles = toChartCandles(result.candles);
      const volumes: HistogramData<Time>[] = result.candles.map(c => ({
        time: c.time as Time,
        value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(14,203,129,0.25)' : 'rgba(246,70,93,0.25)',
      }));

      candleSeries.setData(chartCandles);
      volumeSeries.setData(volumes);
      setDataSource(result.source);
      setLoading(false);
      chartReadyRef.current = true;

      chart.timeScale().fitContent();
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
      setDataSource('generated');
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

  const handleTfChange = (t: Timeframe) => {
    setTf(t);
    onTimeframeChange?.(t);
  };

  return (
    <div
      data-testid="terminal-chart-container"
      style={{ background: T.bg, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
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
              }}
            >
              {dataSource === 'coingecko' ? 'CoinGecko' : dataSource === 'aster' ? 'Aster' : 'Sim'}
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
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4A5060',
              fontFamily: mono,
              fontSize: 11,
              zIndex: 2,
              background: T.bg,
            }}
          >
            Loading chart...
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
