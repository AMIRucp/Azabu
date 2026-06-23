import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type { IPrimitivePaneRenderer, IPrimitivePaneView, ISeriesPrimitive, Time } from "lightweight-charts";
import type { ChartPoint } from "./types";
import { toPixel } from "../chartCoords";

class HandlesPaneRenderer implements IPrimitivePaneRenderer {
  constructor(private anchors: { x: number; y: number }[]) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const r = 5 * scope.horizontalPixelRatio;
      for (const a of this.anchors) {
        const x = a.x * scope.horizontalPixelRatio;
        const y = a.y * scope.verticalPixelRatio;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 122, 0, 0.9)";
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.5 * scope.horizontalPixelRatio;
        ctx.stroke();
      }
    });
  }
}

class HandlesPaneView implements IPrimitivePaneView {
  anchors: { x: number; y: number }[] = [];

  constructor(private source: SelectionHandlesPrimitive) {}

  update() {
    this.anchors = [];
    const pts = this.source.getPoints();
    if (!pts) return;
    for (const p of pts) {
      const px = toPixel(this.source.chart, this.source.series, p);
      if (px) this.anchors.push(px);
    }
  }

  renderer() {
    return new HandlesPaneRenderer(this.anchors);
  }
}

export class SelectionHandlesPrimitive implements ISeriesPrimitive<Time> {
  private _paneViews: HandlesPaneView[];

  constructor(
    readonly chart: Parameters<typeof toPixel>[0],
    readonly series: Parameters<typeof toPixel>[1],
    private getPointsFn: () => ChartPoint[] | null
  ) {
    this._paneViews = [new HandlesPaneView(this)];
  }

  getPoints(): ChartPoint[] | null {
    return this.getPointsFn();
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }
}
