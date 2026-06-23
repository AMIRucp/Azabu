import type { IChartApi, ISeriesApi } from "lightweight-charts";
import type { DrawingTool } from "./drawingTypes";
import type { ChartPoint } from "./plugins/types";
import { normalizeTime } from "./chartCoords";

const HANDLE_RADIUS = 10;
const LINE_THRESHOLD = 8;
const HLINE_THRESHOLD = 8;

export type HitResult =
  | { kind: "anchor"; entryIndex: number; pointIndex: number }
  | { kind: "body"; entryIndex: number };

export interface HitTestEntry {
  tool: DrawingTool;
  points: ChartPoint[];
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return dist(px, py, ax + t * dx, ay + t * dy);
}

function toPixel(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  pt: ChartPoint
): { x: number; y: number } | null {
  const x = chart.timeScale().timeToCoordinate(pt.time as never);
  const y = series.priceToCoordinate(pt.price);
  if (x === null || y === null) return null;
  return { x, y };
}

function hitAnchors(
  entries: HitTestEntry[],
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  x: number,
  y: number,
  entryIndex: number
): HitResult | null {
  const entry = entries[entryIndex];
  for (let i = 0; i < entry.points.length; i++) {
    const px = toPixel(chart, series, entry.points[i]);
    if (px && dist(x, y, px.x, px.y) <= HANDLE_RADIUS) {
      return { kind: "anchor", entryIndex, pointIndex: i };
    }
  }
  return null;
}

function hitBody(
  entry: HitTestEntry,
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  x: number,
  y: number
): boolean {
  const { tool, points } = entry;

  if (tool === "hline" && points.length >= 1) {
    const px = toPixel(chart, series, points[0]);
    return px !== null && Math.abs(y - px.y) <= HLINE_THRESHOLD;
  }

  if (tool === "vline" && points.length >= 1) {
    const px = toPixel(chart, series, points[0]);
    return px !== null && Math.abs(x - px.x) <= LINE_THRESHOLD;
  }

  if (tool === "brush" && points.length >= 2) {
    for (let i = 1; i < points.length; i++) {
      const a = toPixel(chart, series, points[i - 1]);
      const b = toPixel(chart, series, points[i]);
      if (a && b && distToSegment(x, y, a.x, a.y, b.x, b.y) <= LINE_THRESHOLD) return true;
    }
    return false;
  }

  if (points.length >= 2) {
    const a = toPixel(chart, series, points[0]);
    const b = toPixel(chart, series, points[1]);
    if (!a || !b) return false;

    if (tool === "rectangle" || tool === "fib" || tool === "longshort" || tool === "short_position") {
      const left = Math.min(a.x, b.x);
      const right = Math.max(a.x, b.x);
      const top = Math.min(a.y, b.y);
      const bottom = Math.max(a.y, b.y);
      return x >= left - LINE_THRESHOLD && x <= right + LINE_THRESHOLD &&
        y >= top - LINE_THRESHOLD && y <= bottom + LINE_THRESHOLD;
    }

    return distToSegment(x, y, a.x, a.y, b.x, b.y) <= LINE_THRESHOLD;
  }

  if (points.length === 1) {
    const px = toPixel(chart, series, points[0]);
    return px !== null && dist(x, y, px.x, px.y) <= HANDLE_RADIUS + 4;
  }

  return false;
}

export function hitTestDrawings(
  entries: HitTestEntry[],
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  x: number,
  y: number,
  selectedIndex: number | null
): HitResult | null {
  if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < entries.length) {
    const anchor = hitAnchors(entries, chart, series, x, y, selectedIndex);
    if (anchor) return anchor;
  }

  for (let i = entries.length - 1; i >= 0; i--) {
    if (hitBody(entries[i], chart, series, x, y)) {
      return { kind: "body", entryIndex: i };
    }
  }
  return null;
}

export function pixelDeltaToChartDelta(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  origin: ChartPoint,
  dx: number,
  dy: number
): { dt: number; dp: number } {
  const x0 = chart.timeScale().timeToCoordinate(origin.time as never);
  const y0 = series.priceToCoordinate(origin.price);
  if (x0 === null || y0 === null) return { dt: 0, dp: 0 };

  const t1 = chart.timeScale().coordinateToTime(x0 + dx);
  const p1 = series.coordinateToPrice(y0 + dy);
  const t0 = normalizeTime(origin.time as never);
  const t1n = t1 ? normalizeTime(t1) : t0;
  return { dt: t1n - t0, dp: (p1 ?? origin.price) - origin.price };
}

export function translatePoints(
  points: ChartPoint[],
  dt: number,
  dp: number,
  tool: DrawingTool
): ChartPoint[] {
  if (tool === "hline") {
    return points.map((p) => ({ ...p, price: p.price + dp }));
  }
  if (tool === "vline") {
    return points.map((p) => ({
      time: (normalizeTime(p.time as never) + dt) as ChartPoint["time"],
      price: p.price,
    }));
  }
  return points.map((p) => ({
    time: (normalizeTime(p.time as never) + dt) as ChartPoint["time"],
    price: p.price + dp,
  }));
}
