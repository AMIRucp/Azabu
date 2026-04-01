'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, IPriceLine, CandlestickData, HistogramData, BarData, Time } from 'lightweight-charts';
import { fetchCandles } from '@/services/candleService';
import type { CandleData } from '@/services/candleService';

interface PerpChartProps {
  symbol: string;
  currentPrice: number;
  entryPrice?: number;
  liquidationPrice?: number;
  side?: 'long' | 'short';
  onCrosshairMove?: (price: number | null) => void;
}

const TIMEFRAMES = ['1M', '5M', '15M', '1H', '4H', '1D', '1W'] as const;
type Timeframe = typeof TIMEFRAMES[number];

function toChartCandles(candles: CandleData[]): CandlestickData<Time>[] {
  return candles.map(c => ({
    time: c.time as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}

function PerpChartInner({ symbol, currentPrice, entryPrice, liquidationPrice, side, onCrosshairMove }: PerpChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<{ current: IPriceLine | null; entry: IPriceLine | null; liq: IPriceLine | null }>({ current: null, entry: null, liq: null });
  const chartReadyRef = useRef(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1H');
  const [dataSource, setDataSource] = useState<string>('');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let cancelled = false;
    chartReadyRef.current = false;
    priceLinesRef.current = { current: null, entry: null, liq: null };

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 360,
      layout: {
        background: { type: ColorType.Solid, color: '#111520' },
        textColor: '#6B7280',
        fontSize: 11,
        fontFamily: 'IBM Plex Mono, monospace',
      },
      grid: {
        vertLines: { color: '#1C1C1F' },
        horzLines: { color: '#1C1C1F' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(59,130,246,0.12)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#3B82F6',
        },
        horzLine: {
          color: 'rgba(59,130,246,0.12)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#3B82F6',
        },
      },
      rightPriceScale: {
        borderColor: '#1B2030',
        scaleMargins: { top: 0.1, bottom: 0.25 },
        minimumWidth: 60,
      },
      timeScale: {
        borderColor: '#1B2030',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: 'rgba(34,197,94,0.5)',
      wickDownColor: 'rgba(239,68,68,0.5)',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    fetchCandles(symbol, timeframe).then(result => {
      if (cancelled) return;

      const candles = toChartCandles(result.candles);
      const volumes: HistogramData<Time>[] = result.candles.map(c => ({
        time: c.time as Time,
        value: c.volume || Math.random() * 1000000 + 100000,
        color: c.close >= c.open ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      }));

      candleSeries.setData(candles);
      volumeSeries.setData(volumes);

      setDataSource(result.source);
      chartReadyRef.current = true;

      chart.timeScale().fitContent();
    }).catch(() => {
      if (cancelled) return;
      setDataSource('generated');
    });

    if (onCrosshairMove) {
      chart.subscribeCrosshairMove(param => {
        if (param.point) {
          const data = param.seriesData.get(candleSeries) as BarData<Time> | undefined;
          onCrosshairMove(data ? data.close : null);
        } else {
          onCrosshairMove(null);
        }
      });
    }

    const resizeObserver = new ResizeObserver(entries => {
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
    };
  }, [symbol, timeframe]);

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !chartReadyRef.current) return;

    if (priceLinesRef.current.current) {
      series.removePriceLine(priceLinesRef.current.current);
      priceLinesRef.current.current = null;
    }
    if (currentPrice > 0) {
      priceLinesRef.current.current = series.createPriceLine({
        price: currentPrice,
        color: '#3B82F6',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Current',
      });
    }

    if (priceLinesRef.current.entry) {
      series.removePriceLine(priceLinesRef.current.entry);
      priceLinesRef.current.entry = null;
    }
    if (entryPrice && entryPrice > 0) {
      priceLinesRef.current.entry = series.createPriceLine({
        price: entryPrice,
        color: '#A855F7',
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'Entry',
      });
    }

    if (priceLinesRef.current.liq) {
      series.removePriceLine(priceLinesRef.current.liq);
      priceLinesRef.current.liq = null;
    }
    if (liquidationPrice && liquidationPrice > 0) {
      priceLinesRef.current.liq = series.createPriceLine({
        price: liquidationPrice,
        color: '#EF4444',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: 'Liq',
      });
    }
  }, [currentPrice, entryPrice, liquidationPrice]);

  return (
    <div data-testid="perp-chart-container">
      <div style={{
        display: 'flex', gap: 2, padding: '8px 0',
        borderBottom: '1px solid #1C1C1F',
        alignItems: 'center',
      }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            data-testid={`chart-tf-${tf}`}
            onClick={() => setTimeframe(tf)}
            style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 11,
              fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: timeframe === tf ? '#111520' : 'transparent',
              color: timeframe === tf ? '#E6EDF3' : '#6B7280',
            }}
          >
            {tf}
          </button>
        ))}
        {dataSource && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 9,
            color: '#6B7280',
            fontFamily: 'IBM Plex Mono, monospace',
          }} data-testid="chart-data-source">
            {dataSource === 'coingecko' ? 'CoinGecko' : 'Simulated'}
          </span>
        )}
      </div>
      {(entryPrice || liquidationPrice) && (
        <div style={{
          display: 'flex', gap: 12, padding: '4px 8px',
          fontSize: 10,
          fontFamily: 'IBM Plex Mono, monospace',
        }}>
          {entryPrice && entryPrice > 0 && (
            <span style={{ color: '#A855F7' }} data-testid="chart-entry-price">
              Entry: ${entryPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          )}
          {liquidationPrice && liquidationPrice > 0 && (
            <span style={{ color: '#EF4444' }} data-testid="chart-liq-price">
              Liq: ${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          )}
          {side && (
            <span style={{ color: side === 'long' ? '#22C55E' : '#EF4444' }} data-testid="chart-side">
              {side.toUpperCase()}
            </span>
          )}
        </div>
      )}
      <div
        ref={chartContainerRef}
        style={{ width: '100%', height: '100%', minHeight: 200 }}
      />
    </div>
  );
}

const PerpChart = memo(PerpChartInner, (prev, next) => {
  return prev.symbol === next.symbol
    && prev.currentPrice === next.currentPrice
    && prev.entryPrice === next.entryPrice
    && prev.liquidationPrice === next.liquidationPrice
    && prev.side === next.side;
});

export default PerpChart;
