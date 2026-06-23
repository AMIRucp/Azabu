/**
 * Adapted from TradingView lightweight-charts plugin-examples/rectangle-drawing-tool
 */
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type {
  Coordinate,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
} from "lightweight-charts";
import { PluginBase } from "./plugin-base";
import { positionsBox } from "./helpers/positions";
import { DRAWING_FILL, DRAWING_STROKE } from "./types";
import type { ChartPoint } from "./types";

interface ViewPoint {
  x: Coordinate | null;
  y: Coordinate | null;
}

export interface RectOptions {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

const defaultRectOpts: RectOptions = {
  fillColor: DRAWING_FILL,
  strokeColor: DRAWING_STROKE,
  strokeWidth: 1,
};

class RectPaneRenderer implements IPrimitivePaneRenderer {
  constructor(private p1: ViewPoint, private p2: ViewPoint, private opts: RectOptions) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this.p1.x === null || this.p1.y === null || this.p2.x === null || this.p2.y === null) return;
      const ctx = scope.context;
      const h = positionsBox(this.p1.x, this.p2.x, scope.horizontalPixelRatio);
      const v = positionsBox(this.p1.y, this.p2.y, scope.verticalPixelRatio);
      ctx.fillStyle = this.opts.fillColor;
      ctx.fillRect(h.position, v.position, h.length, v.length);
      ctx.strokeStyle = this.opts.strokeColor;
      ctx.lineWidth = this.opts.strokeWidth;
      ctx.strokeRect(h.position, v.position, h.length, v.length);
    });
  }
}

class RectPaneView implements IPrimitivePaneView {
  p1: ViewPoint = { x: null, y: null };
  p2: ViewPoint = { x: null, y: null };

  constructor(private source: RectanglePrimitive) {}

  update() {
    const ts = this.source.chart.timeScale();
    const s = this.source.series;
    this.p1 = { x: ts.timeToCoordinate(this.source.p1.time), y: s.priceToCoordinate(this.source.p1.price) };
    this.p2 = { x: ts.timeToCoordinate(this.source.p2.time), y: s.priceToCoordinate(this.source.p2.price) };
  }

  renderer() {
    return new RectPaneRenderer(this.p1, this.p2, this.source.opts);
  }
}

export class RectanglePrimitive extends PluginBase {
  private _paneViews: RectPaneView[];
  readonly opts: RectOptions;

  constructor(
    readonly p1: ChartPoint,
    readonly p2: ChartPoint,
    opts: Partial<RectOptions> = {},
    private preview = false
  ) {
    super();
    this.opts = { ...defaultRectOpts, ...opts };
    if (preview) this.opts.fillColor = this.opts.fillColor.replace(/[\d.]+\)$/, "0.06)");
    this._paneViews = [new RectPaneView(this)];
  }

  updateEndPoint(p: ChartPoint) {
    (this as { p2: ChartPoint }).p2 = p;
    this._paneViews[0].update();
    this.requestUpdate();
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }
}

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

class FibPaneRenderer implements IPrimitivePaneRenderer {
  constructor(
    private p1: ViewPoint,
    private p2: ViewPoint,
    private price1: number,
    private price2: number
  ) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this.p1.x === null || this.p1.y === null || this.p2.x === null || this.p2.y === null) return;
      const ctx = scope.context;
      const left = Math.min(this.p1.x, this.p2.x) * scope.horizontalPixelRatio;
      const right = Math.max(this.p1.x, this.p2.x) * scope.horizontalPixelRatio;
      const top = Math.min(this.p1.y, this.p2.y) * scope.verticalPixelRatio;
      const bot = Math.max(this.p1.y, this.p2.y) * scope.verticalPixelRatio;
      const hi = Math.max(this.price1, this.price2);
      const lo = Math.min(this.price1, this.price2);

      ctx.lineWidth = 1;
      ctx.strokeStyle = DRAWING_STROKE;
      ctx.font = `${9 * scope.verticalPixelRatio}px JetBrains Mono, monospace`;
      ctx.fillStyle = DRAWING_STROKE;

      for (const lvl of FIB_LEVELS) {
        const y = bot - (bot - top) * lvl;
        const price = lo + (hi - lo) * (1 - lvl);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();
        ctx.fillText(`${(lvl * 100).toFixed(1)}% ${price.toFixed(2)}`, right + 4, y + 3);
      }
    });
  }
}

class FibPaneView implements IPrimitivePaneView {
  p1: ViewPoint = { x: null, y: null };
  p2: ViewPoint = { x: null, y: null };

  constructor(private source: FibRetracementPrimitive) {}

  update() {
    const ts = this.source.chart.timeScale();
    const s = this.source.series;
    this.p1 = { x: ts.timeToCoordinate(this.source.p1.time), y: s.priceToCoordinate(this.source.p1.price) };
    this.p2 = { x: ts.timeToCoordinate(this.source.p2.time), y: s.priceToCoordinate(this.source.p2.price) };
  }

  renderer() {
    return new FibPaneRenderer(this.p1, this.p2, this.source.p1.price, this.source.p2.price);
  }
}

export class FibRetracementPrimitive extends PluginBase {
  private _paneViews: FibPaneView[];

  constructor(readonly p1: ChartPoint, readonly p2: ChartPoint) {
    super();
    this._paneViews = [new FibPaneView(this)];
  }

  updateEndPoint(p: ChartPoint) {
    (this as { p2: ChartPoint }).p2 = p;
    this._paneViews[0].update();
    this.requestUpdate();
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }
}

class LongShortPaneRenderer implements IPrimitivePaneRenderer {
  constructor(private p1: ViewPoint, private p2: ViewPoint, private isLong: boolean) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this.p1.x === null || this.p1.y === null || this.p2.x === null || this.p2.y === null) return;
      const ctx = scope.context;
      const h = positionsBox(this.p1.x, this.p2.x, scope.horizontalPixelRatio);
      const v = positionsBox(this.p1.y, this.p2.y, scope.verticalPixelRatio);
      const color = this.isLong ? "#00C087" : "#FF4D4D";
      ctx.fillStyle = this.isLong ? "rgba(0,192,135,0.12)" : "rgba(255,77,77,0.12)";
      ctx.fillRect(h.position, v.position, h.length, v.length);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(h.position, v.position, h.length, v.length);
      ctx.fillStyle = color;
      ctx.font = `bold ${10 * scope.verticalPixelRatio}px Inter, sans-serif`;
      ctx.fillText(this.isLong ? "LONG" : "SHORT", h.position + 6, v.position + 12 * scope.verticalPixelRatio);
    });
  }
}

class LongShortPaneView implements IPrimitivePaneView {
  p1: ViewPoint = { x: null, y: null };
  p2: ViewPoint = { x: null, y: null };

  constructor(private source: LongShortPrimitive) {}

  update() {
    const ts = this.source.chart.timeScale();
    const s = this.source.series;
    this.p1 = { x: ts.timeToCoordinate(this.source.p1.time), y: s.priceToCoordinate(this.source.p1.price) };
    this.p2 = { x: ts.timeToCoordinate(this.source.p2.time), y: s.priceToCoordinate(this.source.p2.price) };
  }

  renderer() {
    const isLong = this.source.p2.price > this.source.p1.price;
    return new LongShortPaneRenderer(this.p1, this.p2, isLong);
  }
}

export class LongShortPrimitive extends PluginBase {
  private _paneViews: LongShortPaneView[];

  constructor(readonly p1: ChartPoint, readonly p2: ChartPoint) {
    super();
    this._paneViews = [new LongShortPaneView(this)];
  }

  updateEndPoint(p: ChartPoint) {
    (this as { p2: ChartPoint }).p2 = p;
    this._paneViews[0].update();
    this.requestUpdate();
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }
}
