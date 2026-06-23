/**
 * Adapted from TradingView lightweight-charts plugin-examples/vertical-line
 */
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type {
  Coordinate,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  ISeriesPrimitiveAxisView,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  SeriesOptionsMap,
  SeriesType,
  Time,
} from "lightweight-charts";
import { positionsLine } from "./helpers/positions";
import { DRAWING_STROKE } from "./types";

interface VertLineOptions {
  color: string;
  width: number;
  showLabel: boolean;
  labelText: string;
  labelBackgroundColor: string;
  labelTextColor: string;
}

const defaultOpts: VertLineOptions = {
  color: DRAWING_STROKE,
  width: 1,
  showLabel: false,
  labelText: "",
  labelBackgroundColor: "#1C2028",
  labelTextColor: DRAWING_STROKE,
};

class VertLinePaneRenderer implements IPrimitivePaneRenderer {
  constructor(private x: Coordinate | null, private opts: VertLineOptions) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this.x === null) return;
      const ctx = scope.context;
      const pos = positionsLine(this.x, scope.horizontalPixelRatio, this.opts.width);
      ctx.fillStyle = this.opts.color;
      ctx.fillRect(pos.position, 0, pos.length, scope.bitmapSize.height);
    });
  }
}

class VertLinePaneView implements IPrimitivePaneView {
  x: Coordinate | null = null;
  constructor(private source: VerticalLinePrimitive, private opts: VertLineOptions) {}
  update() {
    this.x = this.source.chart.timeScale().timeToCoordinate(this.source.time);
  }
  renderer() {
    return new VertLinePaneRenderer(this.x, this.opts);
  }
}

class VertLineTimeAxisView implements ISeriesPrimitiveAxisView {
  x: Coordinate | null = null;
  constructor(private source: VerticalLinePrimitive, private opts: VertLineOptions) {}
  update() {
    this.x = this.source.chart.timeScale().timeToCoordinate(this.source.time);
  }
  visible() {
    return this.opts.showLabel;
  }
  tickVisible() {
    return this.opts.showLabel;
  }
  coordinate() {
    return this.x ?? 0;
  }
  text() {
    return this.opts.labelText;
  }
  textColor() {
    return this.opts.labelTextColor;
  }
  backColor() {
    return this.opts.labelBackgroundColor;
  }
}

export class VerticalLinePrimitive implements ISeriesPrimitive<Time> {
  private _paneViews: VertLinePaneView[];
  private _timeAxisViews: VertLineTimeAxisView[];

  constructor(
    private chartRef: IChartApi,
    private seriesRef: ISeriesApi<SeriesType>,
    readonly time: Time,
    opts: Partial<VertLineOptions> = {}
  ) {
    const o = { ...defaultOpts, ...opts };
    this._paneViews = [new VertLinePaneView(this, o)];
    this._timeAxisViews = [new VertLineTimeAxisView(this, o)];
  }

  get chart() {
    return this.chartRef;
  }
  get series() {
    return this.seriesRef;
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
    this._timeAxisViews.forEach((v) => v.update());
  }
  timeAxisViews() {
    return this._timeAxisViews;
  }
  paneViews() {
    return this._paneViews;
  }
}
