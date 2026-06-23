import type { BarData, ISeriesApi, MouseEventParams, Time } from "lightweight-charts";
import type { ChartPoint } from "./plugins/types";

/** Snap price to nearest OHLC — TradingView magnet behavior */
export function snapToOhlcBar(
  bar: { open: number; high: number; low: number; close: number } | null | undefined,
  point: ChartPoint
): ChartPoint {
  if (!bar || bar.open === undefined) return point;

  const candidates = [bar.open, bar.high, bar.low, bar.close];
  let best = point.price;
  let bestDist = Infinity;
  for (const p of candidates) {
    const d = Math.abs(p - point.price);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return { time: point.time, price: best };
}

export function snapToOhlc(
  series: ISeriesApi<"Candlestick">,
  param: MouseEventParams | null,
  point: ChartPoint
): ChartPoint {
  if (!param) return point;
  const bar = param.seriesData.get(series) as BarData<Time> | undefined;
  return snapToOhlcBar(bar, point);
}
