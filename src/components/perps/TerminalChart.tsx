'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, IPriceLine, CandlestickData, HistogramData, BarData, Time } from 'lightweight-charts';
import { fetchCandles } from '@/services/candleService';
import type { CandleData } from '@/services/candleService';
import { T, mono } from './terminalTheme';
import ChartToolsSidebar from './chart/ChartToolsSidebar';
import ChartCrosshairPlus from './chart/ChartCrosshairPlus';
import { ChartIndicatorManager, type IndicatorFlags } from './chart/ChartIndicatorManager';
import { DEFAULT_INDICATOR_FLAGS, loadIndicatorFlags, saveIndicatorFlags } from '@/lib/chart/indicatorPersistence';
import type { DrawingTool } from '@/lib/chart/drawingTypes';
import { isDrawingTool as isChartDrawingTool } from '@/lib/chart/drawingCatalog';
import type { OhlcBar } from '@/lib/chart/indicators';
import { ChartDrawingManager } from '@/lib/chart/ChartDrawingManager';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const;
type Timeframe = typeof TIMEFRAMES[number];

const TF_TO_SERVICE: Record<Timeframe, string> = {
  '1m': '1M', '5m': '5M', '15m': '15M', '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W',
};

const TF_BAR_SECONDS: Record<Timeframe, number> = {
  '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
};

const TF_POLL_INTERVAL: Record<Timeframe, number> = {
  '1m': 5000,
  '5m': 10000,
  '15m': 15000,
  '1h': 30000,
  '4h': 60000,
  '1d': 120000,
  '1w': 300000,
};

const UTILITY_TOOLS = new Set<DrawingTool>([
  'magnet', 'stay_drawing', 'lock_drawings', 'hide_drawings', 'zoom_in', 'zoom_out', 'clear_all',
]);

const DEFAULT_INDICATORS: IndicatorFlags = DEFAULT_INDICATOR_FLAGS;

function toChartCandles(candles: CandleData[]): CandlestickData<Time>[] {
  return candles.map(c => ({
    time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close,
  }));
}

function parseRawSymbol(symbol: string): string {
  const isAsterSym = symbol.toUpperCase().endsWith('USDT');
  return isAsterSym
    ? symbol.replace(/USDT$/i, '')
    : symbol.replace(/-USDC$/i, '').replace(/-USDT$/i, '').replace(/-PERP$/i, '').replace(/-USD$/i, '').replace(/^1M/i, '').split('-')[0].split('/')[0];
}

interface TerminalChartProps {
  symbol: string;
  currentPrice?: number;
  onTimeframeChange?: (tf: string) => void;
  chain?: string;
  tradeLayout?: boolean;
}

function TerminalChartInner({ symbol, currentPrice, onTimeframeChange, chain, tradeLayout }: TerminalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const indicatorMgrRef = useRef<ChartIndicatorManager | null>(null);
  const drawingMgrRef = useRef<ChartDrawingManager | null>(null);
  const candlesRef = useRef<OhlcBar[]>([]);
  const indicatorsRef = useRef<IndicatorFlags>(DEFAULT_INDICATORS);
  const dataSourceRef = useRef<string>('');

  const [tf, setTf] = useState<Timeframe>('1h');
  const [chartReady, setChartReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorFlags>(() => loadIndicatorFlags());
  const [activeTool, setActiveTool] = useState<DrawingTool>('crosshair');
  const [managerState, setManagerState] = useState({
    magnet: false,
    stayDrawing: false,
    lockDrawings: false,
    hideDrawings: false,
  });
  const [ohlcLegend, setOhlcLegend] = useState<string | null>(null);

  const activeToolRef = useRef<DrawingTool>('crosshair');
  activeToolRef.current = activeTool;

  const handleToolChange = useCallback((tool: DrawingTool) => {
    if (!UTILITY_TOOLS.has(tool)) {
      setActiveTool(tool);
      activeToolRef.current = tool;
    }
    drawingMgrRef.current?.setActiveTool(tool);
    const state = drawingMgrRef.current?.getState();
    if (state) setManagerState(state);
  }, []);

  indicatorsRef.current = indicators;

  const syncIndicators = useCallback((flags: IndicatorFlags) => {
    if (!chartReady || candlesRef.current.length === 0) return;
    try {
      indicatorMgrRef.current?.sync(candlesRef.current, flags);
    } catch (err) {
      console.warn('[TerminalChart] indicator sync failed', err);
    }
  }, [chartReady]);

  const toggleIndicator = useCallback((key: keyof IndicatorFlags) => {
    setIndicators((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveIndicatorFlags(next);
      return next;
    });
  }, []);

  useEffect(() => {
    syncIndicators(indicators);
  }, [indicators, syncIndicators]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    let cancelled = false;
    priceLineRef.current = null;
    setChartReady(false);
    drawingMgrRef.current?.dispose();
    drawingMgrRef.current = null;
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
      priceScaleId: '',
      visible: indicatorsRef.current.volume,
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    indicatorMgrRef.current = new ChartIndicatorManager(chart, volumeSeries);
    drawingMgrRef.current = new ChartDrawingManager(chart, candleSeries, {
      barIntervalSec: TF_BAR_SECONDS[tf],
      getBarAtTime: (time) => {
        const bar = candlesRef.current.find((c) => c.time === time);
        return bar ? { open: bar.open, high: bar.high, low: bar.low, close: bar.close } : null;
      },
      onActiveToolChange: (tool) => {
        setActiveTool(tool);
        activeToolRef.current = tool;
      },
      onStateChange: (state) => setManagerState(state),
    });
    drawingMgrRef.current.setActiveTool(activeToolRef.current);
    drawingMgrRef.current.setStorageContext(parseRawSymbol(symbol), tf);
    setChartReady(true);

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time) {
        setOhlcLegend(null);
        return;
      }
      const bar = param.seriesData.get(candleSeries) as BarData<Time> | undefined;
      if (!bar || bar.open === undefined) return;
      const ch = bar.close - bar.open;
      const chPct = bar.open !== 0 ? (ch / bar.open) * 100 : 0;
      const sign = ch >= 0 ? '+' : '';
      setOhlcLegend(
        `O${bar.open.toFixed(2)} H${bar.high.toFixed(2)} L${bar.low.toFixed(2)} C${bar.close.toFixed(2)} ${sign}${ch.toFixed(2)} (${sign}${chPct.toFixed(2)}%)`
      );
    });

    const rawSymbol = parseRawSymbol(symbol);

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
      candlesRef.current = result.candles;
      dataSourceRef.current = result.source;
      setDataSource(result.source);
      setIsLive(true);
      setLoading(false);
      chart.timeScale().fitContent();
      try {
        indicatorMgrRef.current?.sync(result.candles, indicatorsRef.current);
      } catch (err) {
        console.warn('[TerminalChart] initial indicator sync failed', err);
      }
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
      setChartReady(false);
      drawingMgrRef.current?.dispose();
      drawingMgrRef.current = null;
      resizeObserver.disconnect();
      indicatorMgrRef.current?.dispose();
      indicatorMgrRef.current = null;
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      priceLineRef.current = null;
    };
  }, [symbol, tf, chain]);

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series || !chartReady) return;

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
  }, [currentPrice, loading, chartReady]);

  useEffect(() => {
    if (!isLive) return;
    const rawSymbol = parseRawSymbol(symbol);

    const poll = async () => {
      if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;
      try {
        const result = await fetchCandles(rawSymbol, TF_TO_SERVICE[tf], chain);
        if (!result || result.candles.length === 0) return;

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
        candlesRef.current = result.candles;
        try {
          indicatorMgrRef.current?.sync(result.candles, indicatorsRef.current);
        } catch { /* noop */ }
      } catch { /* noop */ }
    };

    const interval = setInterval(poll, TF_POLL_INTERVAL[tf]);
    return () => clearInterval(interval);
  }, [isLive, symbol, tf, chain, chartReady]);

  useEffect(() => {
    drawingMgrRef.current?.setBarIntervalSec(TF_BAR_SECONDS[tf]);
    drawingMgrRef.current?.setStorageContext(parseRawSymbol(symbol), tf);
  }, [tf, symbol, chartReady]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        drawingMgrRef.current?.cancelDrawing();
        if (!drawingMgrRef.current?.getState().stayDrawing) {
          handleToolChange('crosshair');
        }
        return;
      }

      if (e.altKey) {
        const shortcuts: Record<string, DrawingTool> = {
          t: 'trendline',
          h: 'hline',
          v: 'vline',
          f: 'fib',
        };
        const tool = shortcuts[e.key.toLowerCase()];
        if (tool) {
          e.preventDefault();
          handleToolChange(tool);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleToolChange]);

  const drawingModeActive = isChartDrawingTool(activeTool);

  useEffect(() => {
    chartRef.current?.applyOptions({
      crosshair: { mode: managerState.magnet ? CrosshairMode.Magnet : CrosshairMode.Normal },
      handleScroll: {
        mouseWheel: !drawingModeActive,
        pressedMouseMove: !drawingModeActive,
        horzTouchDrag: !drawingModeActive,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: !drawingModeActive,
        mouseWheel: !drawingModeActive,
        pinch: !drawingModeActive,
      },
    });
  }, [activeTool, drawingModeActive, chartReady, managerState.magnet]);

  const handleTfChange = (t: Timeframe) => {
    setTf(t);
    onTimeframeChange?.(t);
  };

  const sourceLabel =
    dataSource === 'coingecko' ? 'CoinGecko'
    : dataSource === 'aster' ? 'Aster'
    : dataSource === 'hyperliquid' ? 'Hyperliquid'
    : dataSource ? 'Sim' : '';

  const indStyle = (active: boolean, trade: boolean) => ({
    fontSize: trade ? 11 : 10,
    color: active ? (trade ? '#FFFFFF' : '#6F7785') : (trade ? '#888888' : '#3A3F4C'),
    fontWeight: active ? 500 : 400,
    cursor: 'pointer' as const,
    fontFamily: trade ? "'Inter', -apple-system, sans-serif" : mono,
    border: 'none',
    background: 'transparent',
    padding: 0,
  });

  const indicatorRow = (trade: boolean) => (
    <>
      {(['ma', 'ema', 'boll', 'vwap'] as const).map((key) => (
        <button
          key={key}
          type="button"
          data-testid={`terminal-chart-ind-${key}`}
          onClick={() => toggleIndicator(key)}
          style={indStyle(indicators[key], trade)}
        >
          {key === 'ma' ? 'MA' : key === 'ema' ? 'EMA' : key === 'boll' ? 'BOLL' : 'VWAP'}
        </button>
      ))}
      <span style={{ color: trade ? '#333333' : undefined, fontSize: 11, userSelect: 'none' }}>
        {trade ? '|' : ''}
      </span>
      {!trade && <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.06)' }} />}
      {(['volume', 'macd', 'rsi', 'stoch'] as const).map((key) => (
        <button
          key={key}
          type="button"
          data-testid={`terminal-chart-ind-${key}`}
          onClick={() => toggleIndicator(key)}
          style={indStyle(indicators[key], trade)}
        >
          {key.toUpperCase()}
        </button>
      ))}
    </>
  );

  const toolbar = tradeLayout ? (
    <div
      data-testid="terminal-chart-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0 10px',
        borderBottom: '1px solid #1E1E1E',
        flexShrink: 0,
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {TIMEFRAMES.map(t => {
          const active = tf === t;
          return (
            <button
              key={t}
              data-testid={`terminal-chart-tf-${t}`}
              onClick={() => handleTfChange(t)}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: active ? 500 : 400,
                fontFamily: "'Inter', -apple-system, sans-serif",
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: active ? '#FFFFFF' : '#888888',
                transition: 'all 0.12s',
              }}
            >
              {t}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
        {indicatorRow(true)}
        {sourceLabel && (
          <button
            data-testid="terminal-chart-source"
            title={sourceLabel}
            style={{
              marginLeft: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              padding: 0,
              borderRadius: '50%',
              background: '#121212',
              border: '1px solid rgba(255,255,255,0.10)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {isLive && (
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#00C087',
                boxShadow: '0 0 6px rgba(0,192,135,0.5)',
                flexShrink: 0,
              }} />
            )}
          </button>
        )}
      </div>
    </div>
  ) : (
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
        {indicatorRow(false)}
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
            {sourceLabel}
          </span>
        )}
      </div>
    </div>
  );

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
      {toolbar}

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <ChartToolsSidebar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          managerState={managerState}
        />

        <div
          style={{ flex: 1, minWidth: 0, position: 'relative' }}
          data-drawing-active={drawingModeActive ? 'true' : 'false'}
        >
          <div
            ref={chartContainerRef}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              cursor: drawingModeActive ? 'crosshair' : undefined,
            }}
          />

          <ChartCrosshairPlus
            chart={chartReady ? chartRef.current : null}
            series={chartReady ? candleSeriesRef.current : null}
            activeTool={activeTool}
            onPlace={() => drawingMgrRef.current?.placeAtCrosshair()}
          />

          {ohlcLegend && (
            <div
              data-testid="terminal-chart-ohlc-legend"
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 6,
                fontSize: 11,
                fontFamily: mono,
                color: '#9CA3AF',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {ohlcLegend}
            </div>
          )}

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
    </div>
  );
}

const TerminalChart = memo(TerminalChartInner, (prev, next) => {
  return prev.symbol === next.symbol && prev.currentPrice === next.currentPrice && prev.chain === next.chain && prev.tradeLayout === next.tradeLayout;
});

export default TerminalChart;
