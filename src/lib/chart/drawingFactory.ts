import type { IChartApi, IPriceLine, ISeriesApi, ISeriesPrimitive, LineStyle, Time } from "lightweight-charts";
import type { DrawingTool } from "./drawingTypes";
import type { PersistedDrawing } from "./drawingPersistence";
import { DRAWING_STROKE } from "./plugins/types";
import type { ChartPoint } from "./plugins/types";
import { TrendLinePrimitive, measureLabel } from "./plugins/trend-line";
import { VerticalLinePrimitive } from "./plugins/vertical-line";
import { RectanglePrimitive, FibRetracementPrimitive, LongShortPrimitive } from "./plugins/rectangle";
import { BrushPathPrimitive } from "./plugins/brush-text";
import { UnifiedDrawingPrimitive, createDrawingPrimitive } from "./plugins/unified-drawing";

export interface PriceLineDef {
  price: number;
  color: string;
  lineWidth: 1 | 2 | 3 | 4;
  lineStyle: LineStyle;
  axisLabelVisible: boolean;
  title: string;
}

export interface BuiltDrawing {
  primitive: ISeriesPrimitive<Time> | null;
  priceLineDef: PriceLineDef | null;
  companionPriceLineDef: PriceLineDef | null;
}

const UNIFIED_MODES = new Set<DrawingTool>([
  "extended", "cross", "fib_extension", "fib_channel", "fib_timezone", "fib_fan",
  "fib_time", "fib_circles", "fib_spiral", "fib_arcs", "fib_wedge", "pitchfan",
  "gann_box", "gann_square_fixed", "gann_square", "gann_fan",
  "circle", "ellipse", "triangle", "arc", "parallel_channel", "disjoint_channel",
  "flat_top_bottom", "xabcd", "cypher", "abcd", "triangle_pattern",
  "forecast", "projection", "price_range", "date_range", "date_price_range",
  "anchored_text", "note", "callout", "price_label", "text", "short_position", "polyline",
]);

export function buildDrawingFromData(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  data: PersistedDrawing,
  barIntervalSec: number
): BuiltDrawing {
  const { tool, points, text, trendMode } = data;

  if (tool === "hline" && points.length >= 1) {
    return {
      primitive: null,
      priceLineDef: {
        price: points[0].price,
        color: DRAWING_STROKE,
        lineWidth: 1,
        lineStyle: 0,
        axisLabelVisible: true,
        title: "",
      },
      companionPriceLineDef: null,
    };
  }

  if (tool === "vline" && points.length >= 1) {
    return {
      primitive: new VerticalLinePrimitive(chart, series, points[0].time as Time),
      priceLineDef: null,
      companionPriceLineDef: null,
    };
  }

  if (tool === "cross" && points.length >= 1) {
    return {
      primitive: createDrawingPrimitive("cross", points),
      priceLineDef: null,
      companionPriceLineDef: {
        price: points[0].price,
        color: DRAWING_STROKE,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: false,
        title: "",
      },
    };
  }

  if (tool === "brush") {
    return {
      primitive: new BrushPathPrimitive([...points]),
      priceLineDef: null,
      companionPriceLineDef: null,
    };
  }

  if (points.length >= 2) {
    switch (tool) {
      case "trendline":
        return { primitive: new TrendLinePrimitive(chart, series, points[0], points[1], "segment"), priceLineDef: null, companionPriceLineDef: null };
      case "ray":
        return { primitive: new TrendLinePrimitive(chart, series, points[0], points[1], "ray"), priceLineDef: null, companionPriceLineDef: null };
      case "measure":
        return {
          primitive: new TrendLinePrimitive(
            chart, series, points[0], points[1], "measure",
            { lineColor: DRAWING_STROKE, width: 2, dashed: true },
            measureLabel(points[0], points[1], barIntervalSec)
          ),
          priceLineDef: null,
          companionPriceLineDef: null,
        };
      case "rectangle":
        return { primitive: new RectanglePrimitive(points[0], points[1]), priceLineDef: null, companionPriceLineDef: null };
      case "fib":
        return { primitive: new FibRetracementPrimitive(points[0], points[1]), priceLineDef: null, companionPriceLineDef: null };
      case "longshort":
        return { primitive: new LongShortPrimitive(points[0], points[1]), priceLineDef: null, companionPriceLineDef: null };
      default:
        if (UNIFIED_MODES.has(tool)) {
          return {
            primitive: createDrawingPrimitive(tool, points, text ?? defaultLabel(tool)),
            priceLineDef: null,
            companionPriceLineDef: null,
          };
        }
    }
  }

  if (points.length === 1 && UNIFIED_MODES.has(tool)) {
    return {
      primitive: createDrawingPrimitive(tool, points, text ?? defaultLabel(tool)),
      priceLineDef: null,
      companionPriceLineDef: null,
    };
  }

  if (trendMode && points.length >= 2) {
    return {
      primitive: new TrendLinePrimitive(chart, series, points[0], points[1], trendMode),
      priceLineDef: null,
      companionPriceLineDef: null,
    };
  }

  return { primitive: null, priceLineDef: null, companionPriceLineDef: null };
}

function defaultLabel(tool: DrawingTool): string {
  switch (tool) {
    case "note": return "Note";
    case "callout": return "Callout";
    case "anchored_text": return "Text";
    case "price_label": return "Price";
    default: return "Note";
  }
}

export function applyPriceLineDef(
  series: ISeriesApi<"Candlestick">,
  def: PriceLineDef
): IPriceLine {
  return series.createPriceLine(def);
}

export function entryToPersisted(entry: {
  id: string;
  tool: DrawingTool;
  points: ChartPoint[];
  text?: string;
  trendMode?: "segment" | "ray" | "measure";
}): PersistedDrawing {
  return {
    id: entry.id,
    tool: entry.tool,
    points: entry.points.map((p) => ({ time: p.time, price: p.price })),
    text: entry.text,
    trendMode: entry.trendMode,
  };
}

export function updateUnifiedPoints(prim: UnifiedDrawingPrimitive, points: ChartPoint[]) {
  prim.points.length = 0;
  prim.points.push(...points);
  prim.updateAllViews();
}

export function syncPrimitivePoints(
  tool: DrawingTool,
  primitive: ISeriesPrimitive<Time>,
  points: ChartPoint[],
  barIntervalSec: number
): void {
  if (primitive instanceof BrushPathPrimitive) {
    primitive.pts.length = 0;
    primitive.pts.push(...points);
    primitive.updateAllViews();
    return;
  }
  if (primitive instanceof TrendLinePrimitive && points.length >= 2) {
    (primitive as { p1: ChartPoint }).p1 = points[0];
    (primitive as { p2: ChartPoint }).p2 = points[1];
    if (primitive.mode === "measure") {
      (primitive as { label?: string }).label = measureLabel(points[0], points[1], barIntervalSec);
    }
    primitive.updateAllViews();
    return;
  }
  if (primitive instanceof RectanglePrimitive && points.length >= 2) {
    (primitive as { p1: ChartPoint }).p1 = points[0];
    (primitive as { p2: ChartPoint }).p2 = points[1];
    primitive.updateAllViews();
    return;
  }
  if (primitive instanceof FibRetracementPrimitive && points.length >= 2) {
    (primitive as { p1: ChartPoint }).p1 = points[0];
    (primitive as { p2: ChartPoint }).p2 = points[1];
    primitive.updateAllViews();
    return;
  }
  if (primitive instanceof LongShortPrimitive && points.length >= 2) {
    (primitive as { p1: ChartPoint }).p1 = points[0];
    (primitive as { p2: ChartPoint }).p2 = points[1];
    primitive.updateAllViews();
    return;
  }
  if (primitive instanceof VerticalLinePrimitive && points.length >= 1) {
    (primitive as { time: Time }).time = points[0].time as Time;
    primitive.updateAllViews();
    return;
  }
  if (primitive instanceof UnifiedDrawingPrimitive) {
    updateUnifiedPoints(primitive, points);
  }
}
