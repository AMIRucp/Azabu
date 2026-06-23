import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type { IPrimitivePaneRenderer, IPrimitivePaneView, Time } from "lightweight-charts";
import { PluginBase } from "./plugin-base";
import { DRAWING_STROKE } from "./types";
import type { ChartPoint } from "./types";

class BrushPaneRenderer implements IPrimitivePaneRenderer {
  constructor(private points: { x: number | null; y: number | null }[]) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      const valid = this.points.filter((p) => p.x !== null && p.y !== null);
      if (valid.length < 2) return;
      const ctx = scope.context;
      ctx.lineWidth = 2;
      ctx.strokeStyle = DRAWING_STROKE;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      valid.forEach((p, i) => {
        const x = (p.x as number) * scope.horizontalPixelRatio;
        const y = (p.y as number) * scope.verticalPixelRatio;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }
}

class BrushPaneView implements IPrimitivePaneView {
  points: { x: number | null; y: number | null }[] = [];

  constructor(private source: BrushPathPrimitive) {}

  update() {
    const ts = this.source.chart.timeScale();
    const s = this.source.series;
    this.points = this.source.pts.map((p) => ({
      x: ts.timeToCoordinate(p.time),
      y: s.priceToCoordinate(p.price),
    }));
  }

  renderer() {
    return new BrushPaneRenderer(this.points);
  }
}

export class BrushPathPrimitive extends PluginBase {
  private _paneViews: BrushPaneView[];

  constructor(readonly pts: ChartPoint[]) {
    super();
    this._paneViews = [new BrushPaneView(this)];
  }

  addPoint(p: ChartPoint) {
    this.pts.push(p);
    this.requestUpdate();
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }
}

class ChartTextPaneRenderer implements IPrimitivePaneRenderer {
  constructor(private x: number | null, private y: number | null, private text: string) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this.x === null || this.y === null) return;
      const ctx = scope.context;
      const x = this.x * scope.horizontalPixelRatio;
      const y = this.y * scope.verticalPixelRatio;
      ctx.font = `${12 * scope.verticalPixelRatio}px Inter, sans-serif`;
      ctx.fillStyle = DRAWING_STROKE;
      ctx.fillText(this.text, x, y);
    });
  }
}

class ChartTextPaneView implements IPrimitivePaneView {
  x: number | null = null;
  y: number | null = null;

  constructor(private source: ChartTextPrimitive) {}

  update() {
    const ts = this.source.chart.timeScale();
    const s = this.source.series;
    this.x = ts.timeToCoordinate(this.source.pt.time);
    this.y = s.priceToCoordinate(this.source.pt.price);
  }

  renderer() {
    return new ChartTextPaneRenderer(this.x, this.y, this.source.text);
  }
}

export class ChartTextPrimitive extends PluginBase {
  private _paneViews: ChartTextPaneView[];

  constructor(readonly pt: ChartPoint, readonly text: string) {
    super();
    this._paneViews = [new ChartTextPaneView(this)];
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }
}
