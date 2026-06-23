import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";
import type { ChartPoint } from "./plugins/types";

export function normalizeTime(t: Time): number {
  if (typeof t === "number") return t;
  if (typeof t === "string") return Math.floor(new Date(t).getTime() / 1000);
  return Math.floor(Date.UTC(t.year, t.month - 1, t.day) / 1000);
}

export function toPixel(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  pt: ChartPoint
): { x: number; y: number } | null {
  const x = chart.timeScale().timeToCoordinate(pt.time as Time);
  const y = series.priceToCoordinate(pt.price);
  if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export function fromPixel(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  x: number,
  y: number
): ChartPoint | null {
  const time = chart.timeScale().coordinateToTime(x);
  const price = series.coordinateToPrice(y);
  if (time === null || price === null || !Number.isFinite(price)) return null;
  return { time: time as Time, price };
}
