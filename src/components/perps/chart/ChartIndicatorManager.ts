import { HistogramSeries, LineSeries } from "lightweight-charts";
import type { IChartApi, IPriceLine, ISeriesApi, Time } from "lightweight-charts";
import {
  calcBollinger,
  calcEMA,
  calcMACD,
  calcRSI,
  calcSMA,
  calcStochastic,
  calcVWAP,
  toHistSeries,
  toLineSeries,
  type OhlcBar,
} from "@/lib/chart/indicators";
import type { IndicatorFlags } from "@/lib/chart/indicatorPersistence";

export type { IndicatorFlags };

type ManagedSeries = ISeriesApi<"Line"> | ISeriesApi<"Histogram">;

const PANE_HEIGHT = {
  volume: 0.14,
  macd: 0.16,
  rsi: 0.14,
  stoch: 0.12,
} as const;

export class ChartIndicatorManager {
  private chart: IChartApi;
  private series = new Map<string, ManagedSeries>();
  private volumeSeries: ISeriesApi<"Histogram"> | null = null;
  private rsiRefLines: IPriceLine[] = [];
  private stochRefLines: IPriceLine[] = [];

  constructor(chart: IChartApi, volumeSeries: ISeriesApi<"Histogram">) {
    this.chart = chart;
    this.volumeSeries = volumeSeries;
  }

  private getOrCreateLine(key: string, opts: { color: string; lineWidth?: number; priceScaleId?: string }) {
    if (this.series.has(key)) return this.series.get(key) as ISeriesApi<"Line">;
    const s = this.chart.addSeries(LineSeries, {
      color: opts.color,
      lineWidth: (opts.lineWidth ?? 1) as 1 | 2 | 3 | 4,
      priceScaleId: opts.priceScaleId ?? "right",
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    this.series.set(key, s);
    return s;
  }

  private getOrCreateHist(key: string, priceScaleId: string) {
    if (this.series.has(key)) return this.series.get(key) as ISeriesApi<"Histogram">;
    const s = this.chart.addSeries(HistogramSeries, {
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
      priceScaleId,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    this.series.set(key, s);
    return s;
  }

  private remove(key: string) {
    const s = this.series.get(key);
    if (s) {
      this.chart.removeSeries(s);
      this.series.delete(key);
    }
  }

  private setLineData(key: string, color: string, bars: OhlcBar[], values: (number | null)[], priceScaleId?: string) {
    const s = this.getOrCreateLine(key, { color, priceScaleId });
    s.setData(toLineSeries(bars, values).map((p) => ({ time: p.time as Time, value: p.value })));
  }

  private safeScaleOptions(series: ManagedSeries | null | undefined, options: object) {
    if (!series) return;
    try {
      series.priceScale().applyOptions(options);
    } catch {
      /* scale not ready */
    }
  }

  private removeRsiRefLines() {
    const rsi = this.series.get("rsi14") as ISeriesApi<"Line"> | undefined;
    if (rsi) {
      for (const line of this.rsiRefLines) rsi.removePriceLine(line);
    }
    this.rsiRefLines = [];
  }

  private removeStochRefLines() {
    const stoch = this.series.get("stoch-k") as ISeriesApi<"Line"> | undefined;
    if (stoch) {
      for (const line of this.stochRefLines) stoch.removePriceLine(line);
    }
    this.stochRefLines = [];
  }

  private ensureRsiRefLines(rsi: ISeriesApi<"Line">) {
    if (this.rsiRefLines.length > 0) return;
    this.rsiRefLines = [
      rsi.createPriceLine({ price: 70, color: "rgba(171,71,188,0.35)", lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" }),
      rsi.createPriceLine({ price: 30, color: "rgba(171,71,188,0.35)", lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" }),
    ];
  }

  private ensureStochRefLines(stoch: ISeriesApi<"Line">) {
    if (this.stochRefLines.length > 0) return;
    this.stochRefLines = [
      stoch.createPriceLine({ price: 80, color: "rgba(255,183,77,0.35)", lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" }),
      stoch.createPriceLine({ price: 20, color: "rgba(255,183,77,0.35)", lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" }),
    ];
  }

  /** Apply stacked overlay layout only after series exist for each active flag. */
  private applyPaneLayout(flags: IndicatorFlags) {
    let bottom = 0.02;

    if (flags.stoch && this.series.has("stoch-k")) {
      const h = PANE_HEIGHT.stoch;
      this.safeScaleOptions(this.series.get("stoch-k"), {
        scaleMargins: { top: 1 - bottom - h, bottom },
        borderVisible: false,
      });
      bottom += h;
    }

    if (flags.rsi && this.series.has("rsi14")) {
      const h = PANE_HEIGHT.rsi;
      this.safeScaleOptions(this.series.get("rsi14"), {
        scaleMargins: { top: 1 - bottom - h, bottom },
        borderVisible: false,
      });
      bottom += h;
    }

    if (flags.macd && this.series.has("macd-line")) {
      const h = PANE_HEIGHT.macd;
      this.safeScaleOptions(this.series.get("macd-line"), {
        scaleMargins: { top: 1 - bottom - h, bottom },
        borderVisible: false,
      });
      bottom += h;
    }

    if (flags.volume && this.volumeSeries) {
      const h = PANE_HEIGHT.volume;
      this.safeScaleOptions(this.volumeSeries, {
        scaleMargins: { top: 1 - bottom - h, bottom },
        borderVisible: false,
      });
      bottom += h;
    }

    try {
      this.chart.priceScale("right", 0).applyOptions({
        scaleMargins: { top: 0.04, bottom: bottom + 0.02 },
        borderVisible: true,
      });
    } catch {
      /* main scale not ready */
    }
  }

  sync(bars: OhlcBar[], flags: IndicatorFlags) {
    if (bars.length === 0) return;

    const closes = bars.map((b) => b.close);

    if (flags.ma) {
      this.setLineData("ma9", "#FBBF24", bars, calcSMA(closes, 9));
      this.setLineData("ma21", "#60A5FA", bars, calcSMA(closes, 21));
    } else {
      this.remove("ma9");
      this.remove("ma21");
    }

    if (flags.ema) {
      this.setLineData("ema9", "#FCD34D", bars, calcEMA(closes, 9));
      this.setLineData("ema21", "#38BDF8", bars, calcEMA(closes, 21));
    } else {
      this.remove("ema9");
      this.remove("ema21");
    }

    if (flags.vwap) {
      this.setLineData("vwap", "#FF9800", bars, calcVWAP(bars));
    } else {
      this.remove("vwap");
    }

    if (flags.boll) {
      const b = calcBollinger(closes, 20, 2);
      this.setLineData("boll-up", "#A855F7", bars, b.upper);
      this.setLineData("boll-mid", "rgba(168,85,247,0.45)", bars, b.middle);
      this.setLineData("boll-low", "#A855F7", bars, b.lower);
    } else {
      this.remove("boll-up");
      this.remove("boll-mid");
      this.remove("boll-low");
    }

    if (flags.macd) {
      const { macd, signal, histogram } = calcMACD(closes);
      this.setLineData("macd-line", "#26C6DA", bars, macd, "macd");
      this.setLineData("macd-sig", "#EC407A", bars, signal, "macd");
      const hist = this.getOrCreateHist("macd-hist", "macd");
      hist.setData(
        toHistSeries(bars, histogram, "rgba(38,198,218,0.55)", "rgba(236,64,122,0.55)").map((p) => ({
          time: p.time as Time,
          value: p.value,
          color: p.color,
        })),
      );
    } else {
      this.remove("macd-line");
      this.remove("macd-sig");
      this.remove("macd-hist");
    }

    if (flags.rsi) {
      this.setLineData("rsi14", "#AB47BC", bars, calcRSI(closes, 14), "rsi");
      const rsiSeries = this.series.get("rsi14") as ISeriesApi<"Line">;
      rsiSeries.applyOptions({
        autoscaleInfoProvider: () => ({
          priceRange: { minValue: 0, maxValue: 100 },
        }),
      });
      this.ensureRsiRefLines(rsiSeries);
    } else {
      this.removeRsiRefLines();
      this.remove("rsi14");
    }

    if (flags.stoch) {
      const { k, d } = calcStochastic(bars);
      this.setLineData("stoch-k", "#FFB74D", bars, k, "stoch");
      this.setLineData("stoch-d", "#4FC3F7", bars, d, "stoch");
      const stochSeries = this.series.get("stoch-k") as ISeriesApi<"Line">;
      stochSeries.applyOptions({
        autoscaleInfoProvider: () => ({
          priceRange: { minValue: 0, maxValue: 100 },
        }),
      });
      this.ensureStochRefLines(stochSeries);
    } else {
      this.removeStochRefLines();
      this.remove("stoch-k");
      this.remove("stoch-d");
    }

    this.volumeSeries?.applyOptions({ visible: flags.volume });
    this.applyPaneLayout(flags);
  }

  dispose() {
    this.removeRsiRefLines();
    this.removeStochRefLines();
    for (const key of [...this.series.keys()]) this.remove(key);
    this.volumeSeries = null;
  }
}
