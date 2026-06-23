/**
 * Adapted from TradingView lightweight-charts plugin-examples/trend-line
 * https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples/src/plugins/trend-line
 */
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type {
  AutoscaleInfo,
  Coordinate,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  Logical,
  SeriesOptionsMap,
  SeriesType,
  Time,
} from "lightweight-charts";
import { DRAWING_STROKE } from "./types";
import type { ChartPoint } from "./types";

interface ViewPoint {
  x: Coordinate | null;
  y: Coordinate | null;
}

export interface LineStyleOptions {
  lineColor: string;
  width: number;
  dashed?: boolean;
}

const defaultOpts: LineStyleOptions = {
  lineColor: DRAWING_STROKE,
  width: 2,
  dashed: false,
};

class LinePaneRenderer implements IPrimitivePaneRenderer {
  constructor(
    private p1: ViewPoint,
    private p2: ViewPoint,
    private opts: LineStyleOptions,
    private extendRay = false,
    private label?: string
  ) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this.p1.x === null || this.p1.y === null || this.p2.x === null || this.p2.y === null) return;
      const ctx = scope.context;
      let x1 = Math.round(this.p1.x * scope.horizontalPixelRatio);
      let y1 = Math.round(this.p1.y * scope.verticalPixelRatio);
      let x2 = Math.round(this.p2.x * scope.horizontalPixelRatio);
      let y2 = Math.round(this.p2.y * scope.verticalPixelRatio);

      if (this.extendRay) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const scale = (Math.max(scope.bitmapSize.width, scope.bitmapSize.height) * 2) / len;
        x2 = x1 + dx * scale;
        y2 = y1 + dy * scale;
      }

      ctx.lineWidth = this.opts.width;
      ctx.strokeStyle = this.opts.lineColor;
      if (this.opts.dashed) ctx.setLineDash([6 * scope.horizontalPixelRatio, 4 * scope.horizontalPixelRatio]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (this.label) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        ctx.font = `${11 * scope.verticalPixelRatio}px JetBrains Mono, monospace`;
        const tw = ctx.measureText(this.label).width;
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(mx - tw / 2 - 4, my - 20 * scope.verticalPixelRatio, tw + 8, 14 * scope.verticalPixelRatio);
        ctx.fillStyle = this.opts.lineColor;
        ctx.fillText(this.label, mx - tw / 2, my - 9 * scope.verticalPixelRatio);
      }
    });
  }
}

class LinePaneView implements IPrimitivePaneView {
  p1: ViewPoint = { x: null, y: null };
  p2: ViewPoint = { x: null, y: null };

  constructor(private source: TrendLinePrimitive) {}

  update() {
    const series = this.source.series;
    const ts = this.source.chart.timeScale();
    this.p1 = {
      x: ts.timeToCoordinate(this.source.p1.time),
      y: series.priceToCoordinate(this.source.p1.price),
    };
    this.p2 = {
      x: ts.timeToCoordinate(this.source.p2.time),
      y: series.priceToCoordinate(this.source.p2.price),
    };
  }

  renderer() {
    return new LinePaneRenderer(
      this.p1,
      this.p2,
      this.source.opts,
      this.source.mode === "ray",
      this.source.label
    );
  }
}

export type LinePrimitiveMode = "segment" | "ray" | "measure";

export class TrendLinePrimitive implements ISeriesPrimitive<Time> {
  private _paneViews: LinePaneView[];
  private minPrice: number;
  private maxPrice: number;

  constructor(
    private chartRef: IChartApi,
    private seriesRef: ISeriesApi<SeriesType>,
    readonly p1: ChartPoint,
    readonly p2: ChartPoint,
    readonly mode: LinePrimitiveMode = "segment",
    readonly opts: LineStyleOptions = defaultOpts,
    readonly label?: string
  ) {
    this.minPrice = Math.min(p1.price, p2.price);
    this.maxPrice = Math.max(p1.price, p2.price);
    this._paneViews = [new LinePaneView(this)];
  }

  get chart() {
    return this.chartRef;
  }
  get series() {
    return this.seriesRef;
  }

  autoscaleInfo(start: Logical, end: Logical): AutoscaleInfo | null {
    const i1 = this.pointIndex(this.p1);
    const i2 = this.pointIndex(this.p2);
    if (i1 === null || i2 === null) return null;
    if (end < i1 || start > i2) return null;
    return { priceRange: { minValue: this.minPrice, maxValue: this.maxPrice } };
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }

  private pointIndex(p: ChartPoint): number | null {
    const coord = this.chartRef.timeScale().timeToCoordinate(p.time);
    if (coord === null) return null;
    return this.chartRef.timeScale().coordinateToLogical(coord);
  }
}

export function measureLabel(p1: ChartPoint, p2: ChartPoint, barSec: number): string {
  const dp = p2.price - p1.price;
  const pct = p1.price !== 0 ? (dp / p1.price) * 100 : 0;
  const sign = dp >= 0 ? "+" : "";
  const t1 = typeof p1.time === "number" ? p1.time : 0;
  const t2 = typeof p2.time === "number" ? p2.time : 0;
  const bars = barSec > 0 && t1 && t2 ? Math.round(Math.abs(t2 - t1) / barSec) : 0;
  return bars > 0
    ? `${sign}${dp.toFixed(2)} (${sign}${pct.toFixed(2)}%) · ${bars} bars`
    : `${sign}${dp.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}
