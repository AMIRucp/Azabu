import type { DrawingTool } from "./drawingTypes";

export type ToolCategory =
  | "cursor"
  | "trend"
  | "fib_gann"
  | "shapes"
  | "annotation"
  | "patterns"
  | "forecast"
  | "utility";

export interface CatalogTool {
  id: DrawingTool;
  label: string;
  shortcut?: string;
  section?: string;
}

export interface ToolCategoryDef {
  id: ToolCategory;
  label: string;
  tools: CatalogTool[];
}

export const DRAWING_CATALOG: ToolCategoryDef[] = [
  {
    id: "cursor",
    label: "Cursor",
    tools: [
      { id: "crosshair", label: "Crosshair" },
      { id: "cursor", label: "Pointer" },
    ],
  },
  {
    id: "trend",
    label: "Trend Line Tools",
    tools: [
      { id: "trendline", label: "Trend Line", shortcut: "⌥ T" },
      { id: "ray", label: "Ray" },
      { id: "extended", label: "Extended Line" },
      { id: "hline", label: "Horizontal Line", shortcut: "⌥ H" },
      { id: "vline", label: "Vertical Line", shortcut: "⌥ V" },
      { id: "cross", label: "Cross Line" },
      { id: "parallel_channel", label: "Parallel Channel" },
      { id: "flat_top_bottom", label: "Flat Top/Bottom" },
      { id: "disjoint_channel", label: "Disjoint Channel" },
    ],
  },
  {
    id: "fib_gann",
    label: "Fibonacci & Gann",
    tools: [
      { id: "fib", label: "Fib Retracement", shortcut: "⌥ F", section: "FIBONACCI" },
      { id: "fib_extension", label: "Trend-Based Fib Extension", section: "FIBONACCI" },
      { id: "fib_channel", label: "Fib Channel", section: "FIBONACCI" },
      { id: "fib_timezone", label: "Fib Time Zone", section: "FIBONACCI" },
      { id: "fib_fan", label: "Fib Speed Resistance Fan", section: "FIBONACCI" },
      { id: "fib_time", label: "Trend-Based Fib Time", section: "FIBONACCI" },
      { id: "fib_circles", label: "Fib Circles", section: "FIBONACCI" },
      { id: "fib_spiral", label: "Fib Spiral", section: "FIBONACCI" },
      { id: "fib_arcs", label: "Fib Speed Resistance Arcs", section: "FIBONACCI" },
      { id: "fib_wedge", label: "Fib Wedge", section: "FIBONACCI" },
      { id: "pitchfan", label: "Pitchfan", section: "FIBONACCI" },
      { id: "gann_box", label: "Gann Box", section: "GANN" },
      { id: "gann_square_fixed", label: "Gann Square Fixed", section: "GANN" },
      { id: "gann_square", label: "Gann Square", section: "GANN" },
      { id: "gann_fan", label: "Gann Fan", section: "GANN" },
    ],
  },
  {
    id: "shapes",
    label: "Geometric Shapes",
    tools: [
      { id: "brush", label: "Brush" },
      { id: "rectangle", label: "Rectangle" },
      { id: "circle", label: "Circle" },
      { id: "ellipse", label: "Ellipse" },
      { id: "triangle", label: "Triangle" },
      { id: "arc", label: "Arc" },
      { id: "polyline", label: "Polyline" },
    ],
  },
  {
    id: "annotation",
    label: "Annotation Tools",
    tools: [
      { id: "text", label: "Text" },
      { id: "anchored_text", label: "Anchored Text" },
      { id: "note", label: "Note" },
      { id: "callout", label: "Callout" },
      { id: "price_label", label: "Price Label" },
    ],
  },
  {
    id: "patterns",
    label: "Patterns",
    tools: [
      { id: "xabcd", label: "XABCD Pattern" },
      { id: "cypher", label: "Cypher Pattern" },
      { id: "abcd", label: "ABCD Pattern" },
      { id: "triangle_pattern", label: "Triangle Pattern" },
    ],
  },
  {
    id: "forecast",
    label: "Forecast & Measurement",
    tools: [
      { id: "longshort", label: "Long Position" },
      { id: "short_position", label: "Short Position" },
      { id: "forecast", label: "Forecast" },
      { id: "projection", label: "Projection" },
      { id: "price_range", label: "Price Range" },
      { id: "date_range", label: "Date Range" },
      { id: "date_price_range", label: "Date and Price Range" },
      { id: "measure", label: "Measure" },
    ],
  },
  {
    id: "utility",
    label: "Utilities",
    tools: [
      { id: "zoom_in", label: "Zoom In" },
      { id: "zoom_out", label: "Zoom Out" },
      { id: "magnet", label: "Magnet Mode" },
      { id: "stay_drawing", label: "Stay in Drawing Mode" },
      { id: "lock_drawings", label: "Lock All Drawings" },
      { id: "hide_drawings", label: "Hide All Drawings" },
      { id: "clear_all", label: "Remove All Drawings" },
    ],
  },
];

export const TWO_POINT_TOOLS = new Set<DrawingTool>([
  "trendline", "ray", "extended", "rectangle", "fib", "fib_extension", "fib_channel",
  "fib_timezone", "fib_fan", "fib_time", "fib_circles", "fib_spiral", "fib_arcs",
  "fib_wedge", "gann_box", "gann_square_fixed", "gann_square", "gann_fan",
  "circle", "ellipse", "measure", "longshort", "short_position", "forecast",
  "projection", "price_range", "date_range", "date_price_range", "flat_top_bottom",
]);

const THREE_POINT = new Set<DrawingTool>([
  "parallel_channel", "disjoint_channel", "pitchfan", "triangle", "arc", "triangle_pattern",
]);

const FOUR_POINT = new Set<DrawingTool>(["abcd"]);
const FIVE_POINT = new Set<DrawingTool>(["xabcd", "cypher"]);

const ONE_POINT = new Set<DrawingTool>([
  "hline", "vline", "cross", "text", "anchored_text", "note", "callout", "price_label",
]);

const DRAG_TOOLS = new Set<DrawingTool>(["brush"]);
const POLYLINE_TOOLS = new Set<DrawingTool>(["polyline"]);

const UTILITY_TOOLS = new Set<DrawingTool>([
  "crosshair", "cursor", "zoom_in", "zoom_out", "magnet", "stay_drawing", "lock_drawings",
  "hide_drawings", "clear_all",
]);

export function getToolPointCount(tool: DrawingTool): number | "drag" | "polyline" | 0 {
  if (UTILITY_TOOLS.has(tool)) return 0;
  if (DRAG_TOOLS.has(tool)) return "drag";
  if (POLYLINE_TOOLS.has(tool)) return "polyline";
  if (ONE_POINT.has(tool)) return 1;
  if (THREE_POINT.has(tool)) return 3;
  if (FOUR_POINT.has(tool)) return 4;
  if (FIVE_POINT.has(tool)) return 5;
  if (TWO_POINT_TOOLS.has(tool)) return 2;
  return 2;
}

export function isDrawingTool(tool: DrawingTool): boolean {
  return getToolPointCount(tool) !== 0;
}

export function isDragDrawTool(tool: DrawingTool): boolean {
  return TWO_POINT_TOOLS.has(tool);
}

export function findToolCategory(tool: DrawingTool): ToolCategory | null {
  for (const cat of DRAWING_CATALOG) {
    if (cat.tools.some((t) => t.id === tool)) return cat.id;
  }
  return null;
}

export function getCategoryForTool(tool: DrawingTool): CatalogTool | undefined {
  for (const cat of DRAWING_CATALOG) {
    const found = cat.tools.find((t) => t.id === tool);
    if (found) return found;
  }
  return undefined;
}
