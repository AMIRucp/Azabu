/**
 * Unified canvas primitive for all advanced drawing tools.
 */
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import type { Coordinate, IPrimitivePaneRenderer, IPrimitivePaneView } from "lightweight-charts";
import type { DrawingTool } from "@/lib/chart/drawingTypes";
import { PluginBase } from "./plugin-base";
import { positionsBox } from "./helpers/positions";
import { DRAWING_FILL, DRAWING_STROKE } from "./types";
import type { ChartPoint } from "./types";

interface ViewPoint {
  x: Coordinate | null;
  y: Coordinate | null;
}

const FIB_RET = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_EXT = [...FIB_RET, 1.272, 1.618, 2.618, 4.236];
const GANN_ANGLES = [
  { slope: 1 / 8 },
  { slope: 1 / 4 },
  { slope: 1 / 3 },
  { slope: 1 / 2 },
  { slope: 1 },
  { slope: 2 },
  { slope: 3 },
  { slope: 4 },
  { slope: 8 },
];

function toView(chart: PluginBase, pts: ChartPoint[]): ViewPoint[] {
  try {
    const ts = chart.chart.timeScale();
    const s = chart.series;
    return pts.map((p) => ({
      x: ts.timeToCoordinate(p.time),
      y: s.priceToCoordinate(p.price),
    }));
  } catch {
    return pts.map(() => ({ x: null, y: null }));
  }
}

function drawHLine(ctx: CanvasRenderingContext2D, y: number, x1: number, x2: number, label?: string) {
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  if (label) ctx.fillText(label, x2 + 4, y + 3);
}

function drawFibLevels(
  ctx: CanvasRenderingContext2D,
  left: number,
  right: number,
  top: number,
  bot: number,
  lo: number,
  hi: number,
  levels: number[]
) {
  for (const lvl of levels) {
    const y = bot - (bot - top) * lvl;
    const price = lo + (hi - lo) * (1 - lvl);
    drawHLine(ctx, y, left, right, `${(lvl * 100).toFixed(1)}% ${price.toFixed(2)}`);
  }
}

class UnifiedPaneRenderer implements IPrimitivePaneRenderer {
  constructor(
    private mode: DrawingTool,
    private pts: ViewPoint[],
    private prices: ChartPoint[],
    private label?: string,
    private dimmed = false
  ) {}

  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const hr = scope.horizontalPixelRatio;
      const vr = scope.verticalPixelRatio;
      ctx.globalAlpha = this.dimmed ? 0 : 1;
      ctx.lineWidth = 1;
      ctx.strokeStyle = DRAWING_STROKE;
      ctx.fillStyle = DRAWING_STROKE;
      ctx.font = `${9 * vr}px JetBrains Mono, monospace`;

      const valid = this.pts.filter((p) => p.x !== null && p.y !== null);
      if (valid.length === 0) return;

      const px = (p: ViewPoint) => ({
        x: (p.x as number) * hr,
        y: (p.y as number) * vr,
      });

      switch (this.mode) {
        case "extended": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const scale = (Math.max(scope.bitmapSize.width, scope.bitmapSize.height) * 2) / len;
          ctx.beginPath();
          ctx.moveTo(a.x - dx * scale, a.y - dy * scale);
          ctx.lineTo(b.x + dx * scale, b.y + dy * scale);
          ctx.stroke();
          break;
        }
        case "cross": {
          const p = px(valid[0]);
          ctx.beginPath();
          ctx.moveTo(0, p.y);
          ctx.lineTo(scope.bitmapSize.width, p.y);
          ctx.moveTo(p.x, 0);
          ctx.lineTo(p.x, scope.bitmapSize.height);
          ctx.stroke();
          break;
        }
        case "fib":
        case "fib_extension":
        case "fib_channel": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const left = Math.min(a.x, b.x);
          const right = Math.max(a.x, b.x);
          const top = Math.min(a.y, b.y);
          const bot = Math.max(a.y, b.y);
          const lo = Math.min(this.prices[0].price, this.prices[1].price);
          const hi = Math.max(this.prices[0].price, this.prices[1].price);
          const levels = this.mode === "fib_extension" ? FIB_EXT : FIB_RET;
          drawFibLevels(ctx, left, right, top, bot, lo, hi, levels);
          break;
        }
        case "fib_timezone":
        case "fib_time": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const left = Math.min(a.x, b.x);
          const right = Math.max(a.x, b.x);
          const w = right - left;
          for (const lvl of FIB_RET) {
            const x = left + w * lvl;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, scope.bitmapSize.height);
            ctx.stroke();
            ctx.fillText(`${(lvl * 100).toFixed(1)}%`, x + 2, 12 * vr);
          }
          break;
        }
        case "fib_fan":
        case "gann_fan":
        case "pitchfan": {
          if (valid.length < 2) return;
          const origin = px(valid[0]);
          const anchor = px(valid[1]);
          const w = scope.bitmapSize.width;
          if (this.mode === "gann_fan") {
            for (const ang of GANN_ANGLES) {
              const endX = origin.x + w;
              const endY = origin.y - (endX - origin.x) * ang.slope * (vr / hr);
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(endX, endY);
              ctx.stroke();
            }
          } else {
            const top = Math.min(origin.y, anchor.y);
            const bot = Math.max(origin.y, anchor.y);
            const range = bot - top;
            for (const lvl of FIB_RET) {
              const y = bot - range * lvl;
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(w, y);
              ctx.stroke();
            }
            if (this.mode === "pitchfan" && valid.length >= 3) {
              const c = px(valid[2]);
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(c.x, c.y);
              ctx.stroke();
            }
          }
          break;
        }
        case "fib_circles":
        case "circle":
        case "ellipse": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2;
          const rx = Math.abs(b.x - a.x) / 2;
          const ry = Math.abs(b.y - a.y) / 2;
          if (this.mode === "fib_circles") {
            for (const lvl of FIB_RET) {
              ctx.beginPath();
              ctx.ellipse(cx, cy, rx * lvl, ry * lvl, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          } else if (this.mode === "circle") {
            const r = Math.min(rx, ry);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = DRAWING_FILL;
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = DRAWING_FILL;
            ctx.fill();
            ctx.stroke();
          }
          break;
        }
        case "fib_spiral": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2;
          const maxR = Math.hypot(b.x - a.x, b.y - a.y);
          ctx.beginPath();
          for (let t = 0; t < Math.PI * 6; t += 0.05) {
            const r = maxR * 0.08 * Math.pow(1.12, t);
            const x = cx + r * Math.cos(t);
            const y = cy + r * Math.sin(t);
            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          break;
        }
        case "fib_arcs": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const radius = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
          for (const lvl of FIB_RET) {
            ctx.beginPath();
            ctx.arc(a.x, a.y, radius * lvl, 0, Math.PI / 2);
            ctx.stroke();
          }
          break;
        }
        case "fib_wedge": {
          if (valid.length < 2) return;
          const o = px(valid[0]);
          const e = px(valid[1]);
          const dx = e.x - o.x;
          const dy = e.y - o.y;
          ctx.beginPath();
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(e.x, e.y);
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(o.x + dx * 0.618, o.y + dy * 1.382);
          ctx.stroke();
          break;
        }
        case "gann_box":
        case "gann_square":
        case "gann_square_fixed": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const left = Math.min(a.x, b.x);
          const top = Math.min(a.y, b.y);
          const w = Math.abs(b.x - a.x);
          const h = Math.abs(b.y - a.y);
          const divisions = 8;
          ctx.strokeRect(left, top, w, h);
          for (let i = 1; i < divisions; i++) {
            const x = left + (w * i) / divisions;
            const y = top + (h * i) / divisions;
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, top + h);
            ctx.moveTo(left, y);
            ctx.lineTo(left + w, y);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(left, top);
          ctx.lineTo(left + w, top + h);
          ctx.moveTo(left + w, top);
          ctx.lineTo(left, top + h);
          ctx.stroke();
          break;
        }
        case "parallel_channel":
        case "disjoint_channel":
        case "flat_top_bottom": {
          if (valid.length < 2) return;
          const drawLine = (p1: ViewPoint, p2: ViewPoint) => {
            const pa = px(p1);
            const pb = px(p2);
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          };
          drawLine(valid[0], valid[1]);
          if (valid.length >= 3) {
            const dy = (valid[1].y as number) - (valid[0].y as number);
            const p3 = valid[2];
            const p4: ViewPoint = {
              x: (valid[1].x as number) as Coordinate,
              y: ((p3.y as number) + dy) as Coordinate,
            };
            drawLine(p3, p4);
          }
          break;
        }
        case "triangle":
        case "triangle_pattern": {
          if (valid.length < 3) return;
          const pts = valid.slice(0, 3).map(px);
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.closePath();
          ctx.fillStyle = DRAWING_FILL;
          ctx.fill();
          ctx.stroke();
          break;
        }
        case "arc": {
          if (valid.length < 3) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const c = px(valid[2]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(b.x, b.y, c.x, c.y);
          ctx.stroke();
          break;
        }
        case "xabcd":
        case "cypher":
        case "abcd": {
          const n = this.mode === "abcd" ? 4 : 5;
          const seg = valid.slice(0, n);
          if (seg.length < 2) return;
          ctx.beginPath();
          const first = px(seg[0]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < seg.length; i++) {
            const p = px(seg[i]);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          const labels = this.mode === "abcd" ? ["A", "B", "C", "D"] : ["X", "A", "B", "C", "D"];
          seg.forEach((_, i) => {
            const p = px(seg[i]);
            ctx.fillText(labels[i] ?? "", p.x + 4, p.y - 4);
          });
          break;
        }
        case "forecast":
        case "projection": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          ctx.setLineDash([4 * hr, 4 * hr]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          ctx.lineTo(b.x + dx * 0.618, b.y + dy * 0.618);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        }
        case "price_range":
        case "date_range":
        case "date_price_range": {
          if (valid.length < 2) return;
          const h = positionsBox(valid[0].x!, valid[1].x!, hr);
          const v = positionsBox(valid[0].y!, valid[1].y!, vr);
          ctx.fillStyle = DRAWING_FILL;
          if (this.mode !== "date_range") {
            ctx.fillRect(h.position, v.position, h.length, v.length);
          }
          ctx.strokeRect(h.position, v.position, h.length, v.length);
          break;
        }
        case "short_position": {
          if (valid.length < 2) return;
          const a = px(valid[0]);
          const b = px(valid[1]);
          const h = positionsBox(valid[0].x!, valid[1].x!, hr);
          const v = positionsBox(valid[0].y!, valid[1].y!, vr);
          const color = "#FF4D4D";
          ctx.fillStyle = "rgba(255,77,77,0.12)";
          ctx.fillRect(h.position, v.position, h.length, v.length);
          ctx.strokeStyle = color;
          ctx.strokeRect(h.position, v.position, h.length, v.length);
          ctx.fillStyle = color;
          ctx.font = `bold ${10 * vr}px Inter, sans-serif`;
          ctx.fillText("SHORT", h.position + 6, v.position + 12 * vr);
          break;
        }
        case "polyline": {
          if (valid.length < 2) return;
          ctx.beginPath();
          const first = px(valid[0]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < valid.length; i++) {
            const p = px(valid[i]);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          break;
        }
        case "anchored_text":
        case "note":
        case "callout":
        case "price_label":
        case "text": {
          const p = px(valid[0]);
          const txt = this.label ?? "Note";
          ctx.font = `${12 * vr}px Inter, sans-serif`;
          if (this.mode === "callout" || this.mode === "note") {
            const tw = ctx.measureText(txt).width;
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.fillRect(p.x, p.y - 14 * vr, tw + 12, 18 * vr);
          }
          ctx.fillStyle = DRAWING_STROKE;
          ctx.fillText(txt, p.x + 4, p.y);
          if (this.mode === "price_label") {
            ctx.fillText(this.prices[0].price.toFixed(2), p.x + 4, p.y + 14 * vr);
          }
          break;
        }
        default:
          break;
      }
      ctx.globalAlpha = 1;
    });
  }
}

class UnifiedPaneView implements IPrimitivePaneView {
  pts: ViewPoint[] = [];

  constructor(private source: UnifiedDrawingPrimitive) {}

  update() {
    this.pts = toView(this.source, this.source.points);
  }

  renderer() {
    return new UnifiedPaneRenderer(
      this.source.mode,
      this.pts,
      this.source.points,
      this.source.label,
      this.source.hidden
    );
  }
}

export class UnifiedDrawingPrimitive extends PluginBase {
  private _paneViews: UnifiedPaneView[];
  hidden = false;

  constructor(
    readonly mode: DrawingTool,
    readonly points: ChartPoint[],
    readonly label?: string
  ) {
    super();
    this._paneViews = [new UnifiedPaneView(this)];
  }

  updateEndPoint(p: ChartPoint) {
    if (this.points.length === 0) this.points.push(p);
    else this.points[this.points.length - 1] = p;
    this._paneViews[0].update();
    this.requestUpdate();
  }

  addPoint(p: ChartPoint) {
    this.points.push(p);
    this.requestUpdate();
  }

  setHidden(h: boolean) {
    this.hidden = h;
    this.requestUpdate();
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }
}

export function createDrawingPrimitive(
  mode: DrawingTool,
  points: ChartPoint[],
  label?: string
): UnifiedDrawingPrimitive {
  return new UnifiedDrawingPrimitive(mode, [...points], label);
}
