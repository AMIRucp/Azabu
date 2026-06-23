const STORAGE_KEY = "chart-indicator-flags:v1";

export interface IndicatorFlags {
  ma: boolean;
  ema: boolean;
  boll: boolean;
  volume: boolean;
  macd: boolean;
  rsi: boolean;
  vwap: boolean;
  stoch: boolean;
}

export const DEFAULT_INDICATOR_FLAGS: IndicatorFlags = {
  ma: false,
  ema: false,
  boll: false,
  volume: true,
  macd: false,
  rsi: false,
  vwap: false,
  stoch: false,
};

export function loadIndicatorFlags(): IndicatorFlags {
  if (typeof window === "undefined") return { ...DEFAULT_INDICATOR_FLAGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_INDICATOR_FLAGS };
    return { ...DEFAULT_INDICATOR_FLAGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_INDICATOR_FLAGS };
  }
}

export function saveIndicatorFlags(flags: IndicatorFlags): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    /* quota */
  }
}
