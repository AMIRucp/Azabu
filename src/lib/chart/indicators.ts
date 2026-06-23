/** TradingView-compatible technical indicator calculations */

export interface OhlcBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface LinePoint {
  time: number;
  value: number;
}

function smaAt(values: number[], period: number, i: number): number | null {
  if (i < period - 1) return null;
  let sum = 0;
  for (let j = i - period + 1; j <= i; j++) sum += values[j];
  return sum / period;
}

/** TradingView ta.sma */
export function calcSMA(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => smaAt(values, period, i));
}

/** TradingView ta.ema — seeds with SMA at first valid bar */
export function calcEMA(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let ema: number | null = null;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (ema === null) {
      ema = smaAt(values, period, i)!;
    } else {
      ema = values[i] * k + ema * (1 - k);
    }
    out.push(ema);
  }
  return out;
}

/** TradingView ta.bb */
export function calcBollinger(
  closes: number[],
  period = 20,
  mult = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calcSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = closes[j] - middle[i]!;
      sumSq += d * d;
    }
    const std = Math.sqrt(sumSq / period);
    upper.push(middle[i]! + mult * std);
    lower.push(middle[i]! - mult * std);
  }
  return { upper, middle, lower };
}

/** TradingView ta.rsi — Wilder smoothing */
export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = closes.map(() => null);
  if (closes.length < period + 1) return out;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = closes[i] - closes[i - 1];
    avgGain += ch > 0 ? ch : 0;
    avgLoss += ch < 0 ? -ch : 0;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    const gain = ch > 0 ? ch : 0;
    const loss = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

/** TradingView ta.macd */
export function calcMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const emaFast = calcEMA(closes, fastPeriod);
  const emaSlow = calcEMA(closes, slowPeriod);

  const macd: (number | null)[] = closes.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i]! - emaSlow[i]! : null
  );

  const signal: (number | null)[] = closes.map(() => null);
  const k = 2 / (signalPeriod + 1);
  let sigEma: number | null = null;
  let seedSum = 0;
  let seedCount = 0;

  for (let i = 0; i < macd.length; i++) {
    if (macd[i] === null) continue;
    if (sigEma === null) {
      seedSum += macd[i]!;
      seedCount++;
      if (seedCount === signalPeriod) {
        sigEma = seedSum / signalPeriod;
        signal[i] = sigEma;
      }
    } else {
      sigEma = macd[i]! * k + sigEma * (1 - k);
      signal[i] = sigEma;
    }
  }

  const histogram = macd.map((v, i) =>
    v !== null && signal[i] !== null ? v - signal[i]! : null
  );

  return { macd, signal, histogram };
}

/** TradingView ta.vwap — cumulative typical price × volume / volume */
export function calcVWAP(bars: OhlcBar[]): (number | null)[] {
  let cumVol = 0;
  let cumTpv = 0;
  return bars.map((bar) => {
    const vol = bar.volume ?? 0;
    const tp = (bar.high + bar.low + bar.close) / 3;
    cumVol += vol;
    cumTpv += tp * vol;
    return cumVol > 0 ? cumTpv / cumVol : null;
  });
}

/** TradingView ta.stoch — %K with SMA smoothing, %D as SMA of %K */
export function calcStochastic(
  bars: OhlcBar[],
  kPeriod = 14,
  kSmooth = 3,
  dPeriod = 3
): { k: (number | null)[]; d: (number | null)[] } {
  const rawK: (number | null)[] = bars.map(() => null);

  for (let i = kPeriod - 1; i < bars.length; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      highest = Math.max(highest, bars[j].high);
      lowest = Math.min(lowest, bars[j].low);
    }
    const range = highest - lowest;
    rawK[i] = range === 0 ? 50 : ((bars[i].close - lowest) / range) * 100;
  }

  const k = smoothSeries(rawK, kSmooth);
  const d = smoothSeries(k, dPeriod);
  return { k, d };
}

function smoothSeries(values: (number | null)[], period: number): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (values[j] !== null) {
        sum += values[j]!;
        count++;
      }
    }
    out[i] = count === period ? sum / period : null;
  }
  return out;
}

export function toLineSeries(bars: OhlcBar[], values: (number | null)[]): LinePoint[] {
  const pts: LinePoint[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (values[i] !== null && Number.isFinite(values[i])) {
      pts.push({ time: bars[i].time, value: values[i]! });
    }
  }
  return pts;
}

export function toHistSeries(
  bars: OhlcBar[],
  values: (number | null)[],
  upColor: string,
  downColor: string
): { time: number; value: number; color: string }[] {
  const pts: { time: number; value: number; color: string }[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (values[i] !== null && Number.isFinite(values[i])) {
      pts.push({
        time: bars[i].time,
        value: values[i]!,
        color: values[i]! >= 0 ? upColor : downColor,
      });
    }
  }
  return pts;
}
