export type DrawingTool =
  | "cursor"
  | "crosshair"
  | "trendline"
  | "ray"
  | "extended"
  | "hline"
  | "vline"
  | "cross"
  | "parallel_channel"
  | "flat_top_bottom"
  | "disjoint_channel"
  | "rectangle"
  | "fib"
  | "fib_extension"
  | "fib_channel"
  | "fib_timezone"
  | "fib_fan"
  | "fib_time"
  | "fib_circles"
  | "fib_spiral"
  | "fib_arcs"
  | "fib_wedge"
  | "pitchfan"
  | "gann_box"
  | "gann_square_fixed"
  | "gann_square"
  | "gann_fan"
  | "brush"
  | "circle"
  | "ellipse"
  | "triangle"
  | "arc"
  | "polyline"
  | "text"
  | "anchored_text"
  | "note"
  | "callout"
  | "price_label"
  | "xabcd"
  | "cypher"
  | "abcd"
  | "triangle_pattern"
  | "longshort"
  | "short_position"
  | "forecast"
  | "projection"
  | "price_range"
  | "date_range"
  | "date_price_range"
  | "measure"
  | "zoom_in"
  | "zoom_out"
  | "magnet"
  | "stay_drawing"
  | "lock_drawings"
  | "hide_drawings"
  | "clear_all";

export interface ChartPoint {
  time: number;
  price: number;
}

export interface ChartDrawing {
  id: string;
  tool: DrawingTool;
  points: ChartPoint[];
  text?: string;
  color?: string;
}
