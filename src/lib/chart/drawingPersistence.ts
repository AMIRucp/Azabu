import type { DrawingTool } from "./drawingTypes";
import type { ChartPoint } from "./plugins/types";

export interface PersistedDrawing {
  id: string;
  tool: DrawingTool;
  points: ChartPoint[];
  text?: string;
  trendMode?: "segment" | "ray" | "measure";
}

const STORAGE_PREFIX = "chart-drawings:v1";

export function drawingStorageKey(symbol: string, timeframe: string): string {
  return `${STORAGE_PREFIX}:${symbol.toUpperCase()}:${timeframe}`;
}

export function loadDrawings(symbol: string, timeframe: string): PersistedDrawing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(drawingStorageKey(symbol, timeframe));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedDrawing[];
    return Array.isArray(parsed) ? parsed.filter(isValidDrawing) : [];
  } catch {
    return [];
  }
}

export function saveDrawings(symbol: string, timeframe: string, drawings: PersistedDrawing[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(drawingStorageKey(symbol, timeframe), JSON.stringify(drawings));
  } catch {
    /* quota */
  }
}

function isValidDrawing(d: PersistedDrawing): boolean {
  return Boolean(d?.id && d?.tool && Array.isArray(d.points) && d.points.length > 0);
}

export function newDrawingId(): string {
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
