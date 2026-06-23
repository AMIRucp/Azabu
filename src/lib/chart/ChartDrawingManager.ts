/**
 * Chart drawing manager — TradingView-style orchestration with persistence & edit.
 */
import { CrosshairMode } from "lightweight-charts";
import type { IChartApi, IPriceLine, ISeriesApi, ISeriesPrimitive, MouseEventParams, Time } from "lightweight-charts";
import type { DrawingTool } from "@/lib/chart/drawingTypes";
import { getToolPointCount, isDragDrawTool, isDrawingTool } from "@/lib/chart/drawingCatalog";
import {
  applyPriceLineDef,
  buildDrawingFromData,
  entryToPersisted,
  syncPrimitivePoints,
  type BuiltDrawing,
} from "./drawingFactory";
import {
  hitTestDrawings,
  pixelDeltaToChartDelta,
  translatePoints,
} from "./drawingHitTest";
import { loadDrawings, newDrawingId, saveDrawings, type PersistedDrawing } from "./drawingPersistence";
import { snapToOhlc, snapToOhlcBar } from "./drawingSnap";
import { DRAWING_STROKE } from "./plugins/types";
import type { ChartPoint } from "./plugins/types";
import { TrendLinePrimitive, measureLabel } from "./plugins/trend-line";
import { VerticalLinePrimitive } from "./plugins/vertical-line";
import { RectanglePrimitive, FibRetracementPrimitive, LongShortPrimitive } from "./plugins/rectangle";
import { BrushPathPrimitive } from "./plugins/brush-text";
import { UnifiedDrawingPrimitive, createDrawingPrimitive } from "./plugins/unified-drawing";
import { SelectionHandlesPrimitive } from "./plugins/selection-handles";

const UNIFIED_MODES = new Set<DrawingTool>([
  "extended", "cross", "fib_extension", "fib_channel", "fib_timezone", "fib_fan",
  "fib_time", "fib_circles", "fib_spiral", "fib_arcs", "fib_wedge", "pitchfan",
  "gann_box", "gann_square_fixed", "gann_square", "gann_fan",
  "circle", "ellipse", "triangle", "arc", "parallel_channel", "disjoint_channel",
  "flat_top_bottom", "xabcd", "cypher", "abcd", "triangle_pattern",
  "forecast", "projection", "price_range", "date_range", "date_price_range",
  "anchored_text", "note", "callout", "price_label", "text", "short_position", "polyline",
]);

const DRAG_THRESHOLD_PX = 8;
const CLICK_THRESHOLD_PX = 10;

export interface ChartDrawingManagerOptions {
  barIntervalSec?: number;
  getBarAtTime?: (time: Time) => { open: number; high: number; low: number; close: number } | null;
  onActiveToolChange?: (tool: DrawingTool) => void;
  onStateChange?: (state: DrawingManagerState) => void;
}

export interface DrawingManagerState {
  magnet: boolean;
  stayDrawing: boolean;
  lockDrawings: boolean;
  hideDrawings: boolean;
}

interface DrawingEntry {
  id: string;
  tool: DrawingTool;
  points: ChartPoint[];
  text?: string;
  trendMode?: "segment" | "ray" | "measure";
  primitive: ISeriesPrimitive<Time> | null;
  priceLine: IPriceLine | null;
  companionPriceLine: IPriceLine | null;
}

type EditState =
  | { mode: "move"; entryId: string; origin: ChartPoint; originalPoints: ChartPoint[] }
  | { mode: "anchor"; entryId: string; pointIndex: number }
  | null;

type PreviewPrimitive =
  | TrendLinePrimitive
  | RectanglePrimitive
  | FibRetracementPrimitive
  | LongShortPrimitive
  | UnifiedDrawingPrimitive;

export class ChartDrawingManager {
  private chart: IChartApi;
  private series: ISeriesApi<"Candlestick">;
  private activeTool: DrawingTool = "crosshair";
  private barIntervalSec: number;
  private getBarAtTime?: ChartDrawingManagerOptions["getBarAtTime"];
  private onActiveToolChange?: (tool: DrawingTool) => void;
  private onStateChange?: (state: DrawingManagerState) => void;

  private entries: DrawingEntry[] = [];
  private selectedId: string | null = null;
  private editState: EditState = null;
  private editPointerOrigin: { x: number; y: number } | null = null;
  private storageSymbol = "";
  private storageTf = "";
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  private points: ChartPoint[] = [];
  private preview: PreviewPrimitive | null = null;
  private brushPrimitive: BrushPathPrimitive | null = null;
  private polylinePrimitive: UnifiedDrawingPrimitive | null = null;
  private brushing = false;
  private pointerAnchor: { x: number; y: number; pt: ChartPoint } | null = null;
  private dragStartPt: ChartPoint | null = null;
  private isDragging = false;
  private lastCrosshairParam: MouseEventParams | null = null;
  private crosshairPoint: ChartPoint | null = null;
  private handles: SelectionHandlesPrimitive;

  state: DrawingManagerState = {
    magnet: false,
    stayDrawing: false,
    lockDrawings: false,
    hideDrawings: false,
  };

  private moveHandler = (p: MouseEventParams) => {
    this.lastCrosshairParam = p;
    this.crosshairPoint = this.applyMagnet(this.pointFromParam(p));
    this.onMove(p);
  };

  private pointerDownHandler: (e: PointerEvent) => void;
  private pointerMoveHandler: (e: PointerEvent) => void;
  private pointerUpHandler: (e: PointerEvent) => void;
  private dblClickHandler: (e: MouseEvent) => void;
  private keyDownHandler: (e: KeyboardEvent) => void;

  constructor(
    chart: IChartApi,
    series: ISeriesApi<"Candlestick">,
    options: ChartDrawingManagerOptions = {}
  ) {
    this.chart = chart;
    this.series = series;
    this.barIntervalSec = options.barIntervalSec ?? 3600;
    this.getBarAtTime = options.getBarAtTime;
    this.onActiveToolChange = options.onActiveToolChange;
    this.onStateChange = options.onStateChange;

    this.handles = new SelectionHandlesPrimitive(chart, series, () => {
      const entry = this.entries.find((e) => e.id === this.selectedId);
      return entry?.points ?? null;
    });
    series.attachPrimitive(this.handles);

    chart.subscribeCrosshairMove(this.moveHandler);

    const el = chart.chartElement();
    this.pointerDownHandler = (e) => this.onPointerDown(e);
    this.pointerMoveHandler = (e) => this.onPointerMove(e);
    this.pointerUpHandler = (e) => this.onPointerUp(e);
    this.dblClickHandler = (e) => this.onDoubleClick(e);
    this.keyDownHandler = (e) => this.onKeyDown(e);

    el.addEventListener("pointerdown", this.pointerDownHandler, { capture: true });
    el.addEventListener("pointermove", this.pointerMoveHandler, { capture: true });
    el.addEventListener("pointerup", this.pointerUpHandler, { capture: true });
    el.addEventListener("pointercancel", this.pointerUpHandler, { capture: true });
    el.addEventListener("dblclick", this.dblClickHandler, { capture: true });
    el.addEventListener("keydown", this.keyDownHandler);
    el.tabIndex = 0;
  }

  setStorageContext(symbol: string, timeframe: string) {
    const sym = symbol.toUpperCase();
    if (this.storageSymbol === sym && this.storageTf === timeframe) return;
    this.persistNow();
    this.clearAllInternal(false);
    this.storageSymbol = sym;
    this.storageTf = timeframe;
    for (const data of loadDrawings(sym, timeframe)) {
      this.restoreEntry(data);
    }
    this.updateHandles();
  }

  setBarIntervalSec(sec: number) {
    this.barIntervalSec = sec;
  }

  getState(): DrawingManagerState {
    return { ...this.state };
  }

  getActiveTool(): DrawingTool {
    return this.activeTool;
  }

  placeAtCrosshair(): boolean {
    if (!this.crosshairPoint || !this.isInteractiveTool()) return false;
    this.handleDrawPoint(this.crosshairPoint);
    return true;
  }

  cancelDrawing() {
    this.cancelInProgress();
  }

  setActiveTool(tool: DrawingTool) {
    this.commitPolylineIfNeeded();
    if (tool === "clear_all") {
      this.clearAll();
      return;
    }
    if (tool === "zoom_in" || tool === "zoom_out") {
      const r = this.chart.timeScale().getVisibleLogicalRange();
      if (r) {
        const mid = (r.from + r.to) / 2;
        const factor = tool === "zoom_in" ? 0.7 : 1 / 0.7;
        const span = (r.to - r.from) * factor;
        this.chart.timeScale().setVisibleLogicalRange({ from: mid - span / 2, to: mid + span / 2 });
      }
      return;
    }
    if (tool === "magnet") {
      this.state.magnet = !this.state.magnet;
      this.chart.applyOptions({
        crosshair: { mode: this.state.magnet ? CrosshairMode.Magnet : CrosshairMode.Normal },
      });
      this.emitState();
      return;
    }
    if (tool === "stay_drawing") {
      this.state.stayDrawing = !this.state.stayDrawing;
      this.emitState();
      return;
    }
    if (tool === "lock_drawings") {
      this.state.lockDrawings = !this.state.lockDrawings;
      this.emitState();
      return;
    }
    if (tool === "hide_drawings") {
      this.state.hideDrawings = !this.state.hideDrawings;
      this.syncDrawingVisibility();
      this.emitState();
      return;
    }

    if (tool === this.activeTool) return;
    this.cancelInProgress();
    this.selectTool(tool);
  }

  clearAll() {
    this.clearAllInternal(true);
  }

  dispose() {
    this.persistNow();
    this.clearAllInternal(false);
    this.series.detachPrimitive(this.handles);
    this.chart.unsubscribeCrosshairMove(this.moveHandler);
    const el = this.chart.chartElement();
    el.removeEventListener("pointerdown", this.pointerDownHandler, { capture: true });
    el.removeEventListener("pointermove", this.pointerMoveHandler, { capture: true });
    el.removeEventListener("pointerup", this.pointerUpHandler, { capture: true });
    el.removeEventListener("pointercancel", this.pointerUpHandler, { capture: true });
    el.removeEventListener("dblclick", this.dblClickHandler, { capture: true });
    el.removeEventListener("keydown", this.keyDownHandler);
  }

  private emitState() {
    this.onStateChange?.(this.getState());
  }

  private selectTool(tool: DrawingTool) {
    this.activeTool = tool;
    this.onActiveToolChange?.(tool);
  }

  private isSelectMode(): boolean {
    return (this.activeTool === "cursor" || this.activeTool === "crosshair") && !this.state.lockDrawings;
  }

  private isInteractiveTool(): boolean {
    return isDrawingTool(this.activeTool) && !this.state.lockDrawings;
  }

  private requiredPoints(): number | "drag" | "polyline" | 0 {
    return getToolPointCount(this.activeTool);
  }

  private schedulePersist() {
    if (!this.storageSymbol || !this.storageTf) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persistNow(), 300);
  }

  private persistNow() {
    if (!this.storageSymbol || !this.storageTf) return;
    saveDrawings(
      this.storageSymbol,
      this.storageTf,
      this.entries.map((e) => entryToPersisted(e))
    );
  }

  private clearAllInternal(persist: boolean) {
    this.cancelInProgress();
    this.selectEntry(null);
    for (const entry of this.entries) {
      this.detachEntryGraphics(entry);
    }
    this.entries = [];
    if (persist) this.schedulePersist();
  }

  private restoreEntry(data: PersistedDrawing) {
    const entry: DrawingEntry = {
      id: data.id,
      tool: data.tool,
      points: data.points.map((p) => ({ ...p })),
      text: data.text,
      trendMode: data.trendMode,
      primitive: null,
      priceLine: null,
      companionPriceLine: null,
    };
    const built = buildDrawingFromData(this.chart, this.series, data, this.barIntervalSec);
    this.mountBuilt(entry, built);
    this.entries.push(entry);
  }

  private mountBuilt(entry: DrawingEntry, built: BuiltDrawing) {
    if (built.primitive) {
      entry.primitive = built.primitive;
      if (!this.state.hideDrawings) {
        this.series.attachPrimitive(built.primitive);
        built.primitive.updateAllViews?.();
      }
    }
    if (built.priceLineDef && !this.state.hideDrawings) {
      entry.priceLine = applyPriceLineDef(this.series, built.priceLineDef);
    }
    if (built.companionPriceLineDef && !this.state.hideDrawings) {
      entry.companionPriceLine = applyPriceLineDef(this.series, built.companionPriceLineDef);
    }
  }

  private detachEntryGraphics(entry: DrawingEntry) {
    if (entry.primitive) {
      this.series.detachPrimitive(entry.primitive);
      entry.primitive = null;
    }
    if (entry.priceLine) {
      this.series.removePriceLine(entry.priceLine);
      entry.priceLine = null;
    }
    if (entry.companionPriceLine) {
      this.series.removePriceLine(entry.companionPriceLine);
      entry.companionPriceLine = null;
    }
  }

  private addEntry(
    tool: DrawingTool,
    points: ChartPoint[],
    opts?: { text?: string; trendMode?: "segment" | "ray" | "measure"; primitive?: ISeriesPrimitive<Time> }
  ) {
    const id = newDrawingId();
    const entry: DrawingEntry = {
      id,
      tool,
      points: points.map((p) => ({ ...p })),
      text: opts?.text,
      trendMode: opts?.trendMode,
      primitive: null,
      priceLine: null,
      companionPriceLine: null,
    };

    if (opts?.primitive) {
      entry.primitive = opts.primitive;
      opts.primitive.updateAllViews?.();
    } else {
      const built = buildDrawingFromData(
        this.chart,
        this.series,
        entryToPersisted(entry),
        this.barIntervalSec
      );
      this.mountBuilt(entry, built);
    }

    this.entries.push(entry);
    this.schedulePersist();
    return entry;
  }

  private selectEntry(id: string | null) {
    this.selectedId = id;
    this.updateHandles();
  }

  private updateHandles() {
    this.handles.updateAllViews();
  }

  private getSelectedIndex(): number | null {
    if (!this.selectedId) return null;
    const i = this.entries.findIndex((e) => e.id === this.selectedId);
    return i >= 0 ? i : null;
  }

  private deleteSelected() {
    const i = this.getSelectedIndex();
    if (i === null) return;
    this.detachEntryGraphics(this.entries[i]);
    this.entries.splice(i, 1);
    this.selectEntry(null);
    this.schedulePersist();
  }

  private syncEntryGraphics(entry: DrawingEntry) {
    this.detachEntryGraphics(entry);
    const built = buildDrawingFromData(
      this.chart,
      this.series,
      entryToPersisted(entry),
      this.barIntervalSec
    );
    this.mountBuilt(entry, built);
  }

  private applyMagnet(point: ChartPoint | null): ChartPoint | null {
    if (!point || !this.state.magnet) return point;
    const crosshairTime = this.lastCrosshairParam?.time;
    if (this.lastCrosshairParam && crosshairTime === point.time) {
      return snapToOhlc(this.series, this.lastCrosshairParam, point);
    }
    const bar = this.getBarAtTime?.(point.time as Time);
    return snapToOhlcBar(bar, point);
  }

  private pointFromParam(param: MouseEventParams): ChartPoint | null {
    if (!param.point) return null;
    return this.pointFromCoords(param.point.x, param.point.y, param.time);
  }

  private pointFromCoords(x: number, y: number, timeHint?: Time | null): ChartPoint | null {
    const price = this.series.coordinateToPrice(y);
    if (price === null) return null;
    let time: Time | null | undefined = timeHint;
    if (time === undefined || time === null) {
      time = this.chart.timeScale().coordinateToTime(x) as Time | null;
    }
    if (time === undefined || time === null) return null;
    return this.applyMagnet({ time: time as Time, price });
  }

  private pointFromPointer(e: PointerEvent): ChartPoint | null {
    const rect = this.chart.chartElement().getBoundingClientRect();
    return this.pointFromCoords(e.clientX - rect.left, e.clientY - rect.top);
  }

  private pointerXY(e: PointerEvent) {
    const rect = this.chart.chartElement().getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private tryStartSelection(e: PointerEvent, pt: ChartPoint): boolean {
    if (!this.isSelectMode()) return false;
    const { x, y } = this.pointerXY(e);
    const hit = hitTestDrawings(
      this.entries,
      this.chart,
      this.series,
      x,
      y,
      this.getSelectedIndex()
    );

    if (hit) {
      const entry = this.entries[hit.entryIndex];
      this.selectEntry(entry.id);
      if (hit.kind === "anchor") {
        this.editState = { mode: "anchor", entryId: entry.id, pointIndex: hit.pointIndex };
      } else {
        this.editState = {
          mode: "move",
          entryId: entry.id,
          origin: pt,
          originalPoints: entry.points.map((p) => ({ ...p })),
        };
      }
      this.editPointerOrigin = this.pointerXY(e);
      e.preventDefault();
      this.chart.chartElement().setPointerCapture(e.pointerId);
      return true;
    }

    this.selectEntry(null);
    return true;
  }

  private handleDrawPoint(pt: ChartPoint) {
    const need = this.requiredPoints();
    if (!this.isInteractiveTool() || need === "drag" || need === 0) return;

    if (need === "polyline") {
      if (!this.polylinePrimitive) {
        this.polylinePrimitive = createDrawingPrimitive("polyline", [pt]);
        if (!this.state.hideDrawings) {
          this.series.attachPrimitive(this.polylinePrimitive);
        }
      } else {
        this.polylinePrimitive.addPoint(pt);
      }
      return;
    }

    if (need === 1) {
      this.placeOnePointTool(pt);
      return;
    }

    this.points.push(pt);
    const required = need as number;
    if (this.points.length === 1) {
      this.startPreview(this.points[0]);
    } else if (this.points.length >= required) {
      this.commitDrawing([...this.points.slice(0, required)]);
      this.finishDrawingSession();
    } else if (this.preview instanceof UnifiedDrawingPrimitive) {
      this.preview.addPoint(pt);
    }
  }

  private onMove(param: MouseEventParams) {
    if (this.editState) return;

    if (!this.isInteractiveTool()) return;

    if (this.isDragging && this.preview && this.points.length >= 1) {
      const pt = this.applyMagnet(this.pointFromParam(param));
      if (pt) this.updatePreview(pt);
      return;
    }

    if (this.points.length < 1) return;
    const pt = this.applyMagnet(this.pointFromParam(param));
    if (!pt || !this.preview) return;
    this.updatePreview(pt);
  }

  private onPointerDown(e: PointerEvent) {
    if (e.button !== 0 || this.state.lockDrawings) return;
    const pt = this.pointFromPointer(e);
    if (!pt) return;

    if (this.tryStartSelection(e, pt)) return;

    if (this.activeTool === "brush" && this.isInteractiveTool()) {
      e.preventDefault();
      e.stopPropagation();
      this.brushing = true;
      this.brushPrimitive = new BrushPathPrimitive([pt]);
      if (!this.state.hideDrawings) {
        this.series.attachPrimitive(this.brushPrimitive);
      }
      this.chart.chartElement().setPointerCapture(e.pointerId);
      return;
    }

    if (!this.isInteractiveTool()) return;
    e.preventDefault();
    this.pointerAnchor = { x: e.clientX, y: e.clientY, pt };
    if (isDragDrawTool(this.activeTool) && this.points.length === 0) {
      this.dragStartPt = pt;
      this.isDragging = false;
    }
  }

  private onPointerMove(e: PointerEvent) {
    if (this.editState) {
      const pt = this.pointFromPointer(e);
      if (!pt) return;
      const entry = this.entries.find((en) => en.id === this.editState!.entryId);
      if (!entry) return;

      if (this.editState.mode === "move") {
        const { x, y } = this.pointerXY(e);
        const originX = this.chart.timeScale().timeToCoordinate(this.editState.origin.time as Time);
        const originY = this.series.priceToCoordinate(this.editState.origin.price);
        if (originX === null || originY === null || !this.editPointerOrigin) return;
        const delta = pixelDeltaToChartDelta(
          this.chart,
          this.series,
          this.editState.origin,
          x - originX,
          y - originY
        );
        entry.points = translatePoints(this.editState.originalPoints, delta.dt, delta.dp, entry.tool);
      } else {
        entry.points[this.editState.pointIndex] = { ...pt };
      }

      if (entry.tool === "hline" || entry.tool === "cross") {
        this.syncEntryGraphics(entry);
      } else if (entry.primitive) {
        syncPrimitivePoints(entry.tool, entry.primitive, entry.points, this.barIntervalSec);
      }
      this.updateHandles();
      return;
    }

    if (this.brushing && this.brushPrimitive) {
      const pt = this.pointFromPointer(e);
      if (pt) this.brushPrimitive.addPoint(pt);
      return;
    }

    if (this.dragStartPt && isDragDrawTool(this.activeTool) && this.points.length === 0 && this.pointerAnchor) {
      const moved = Math.hypot(e.clientX - this.pointerAnchor.x, e.clientY - this.pointerAnchor.y);
      if (moved >= DRAG_THRESHOLD_PX) {
        this.isDragging = true;
        this.points = [this.dragStartPt];
        this.startPreview(this.dragStartPt);
      }
    }

    if (this.isDragging && this.preview) {
      const pt = this.pointFromPointer(e);
      if (pt) this.updatePreview(pt);
      return;
    }

    if (!this.pointerAnchor || !this.isInteractiveTool() || this.points.length < 1) return;
    const pt = this.pointFromPointer(e);
    if (!pt || !this.preview) return;
    this.updatePreview(pt);
  }

  private onPointerUp(e: PointerEvent) {
    if (this.editState) {
      try {
        this.chart.chartElement().releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      this.editState = null;
      this.editPointerOrigin = null;
      this.pointerAnchor = null;
      this.schedulePersist();
      return;
    }

    if (this.brushing) {
      this.brushing = false;
      try {
        this.chart.chartElement().releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      if (this.brushPrimitive && this.brushPrimitive.pts.length > 1) {
        this.addEntry("brush", [...this.brushPrimitive.pts], { primitive: this.brushPrimitive });
        this.brushPrimitive = null;
      } else if (this.brushPrimitive) {
        this.series.detachPrimitive(this.brushPrimitive);
        this.brushPrimitive = null;
      }
      if (!this.state.stayDrawing) this.resetToCrosshair();
      return;
    }

    if (this.isDragging && isDragDrawTool(this.activeTool) && this.points.length === 1) {
      const pt = this.pointFromPointer(e) ?? this.points[0];
      this.commitDrawing([this.points[0], pt]);
      this.finishDrawingSession();
      this.dragStartPt = null;
      this.isDragging = false;
      this.pointerAnchor = null;
      return;
    }

    this.dragStartPt = null;
    this.isDragging = false;

    if (!this.pointerAnchor || !this.isInteractiveTool()) {
      this.pointerAnchor = null;
      return;
    }

    const moved = Math.hypot(e.clientX - this.pointerAnchor.x, e.clientY - this.pointerAnchor.y);
    const anchor = this.pointerAnchor;
    this.pointerAnchor = null;

    if (moved > CLICK_THRESHOLD_PX) return;

    const pt = this.pointFromPointer(e) ?? anchor.pt;
    this.handleDrawPoint(pt);
  }

  private onDoubleClick(e: MouseEvent) {
    if (!this.isInteractiveTool() || this.activeTool !== "polyline") return;
    e.preventDefault();
    e.stopPropagation();
    this.commitPolylineIfNeeded();
    this.finishDrawingSession();
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      this.cancelInProgress();
      this.editState = null;
      if (!this.state.stayDrawing) this.resetToCrosshair();
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && this.selectedId) {
      e.preventDefault();
      this.deleteSelected();
    }
  }

  private resetToCrosshair() {
    if (this.activeTool === "crosshair") return;
    this.selectTool("crosshair");
  }

  private placeOnePointTool(pt: ChartPoint) {
    if (this.activeTool === "hline") {
      this.addEntry("hline", [pt]);
    } else if (this.activeTool === "vline") {
      this.addEntry("vline", [pt]);
    } else if (this.activeTool === "cross") {
      this.addEntry("cross", [pt]);
    } else if (UNIFIED_MODES.has(this.activeTool)) {
      this.addEntry(this.activeTool, [pt], { text: this.defaultLabel() });
    }
    this.finishDrawingSession();
  }

  private syncDrawingVisibility() {
    for (const entry of this.entries) {
      this.detachEntryGraphics(entry);
      const built = buildDrawingFromData(
        this.chart,
        this.series,
        entryToPersisted(entry),
        this.barIntervalSec
      );
      if (!this.state.hideDrawings) {
        this.mountBuilt(entry, built);
      } else {
        entry.primitive = built.primitive;
      }
    }

    if (this.state.hideDrawings) {
      if (this.preview) this.series.detachPrimitive(this.preview);
      if (this.polylinePrimitive) this.series.detachPrimitive(this.polylinePrimitive);
      if (this.brushPrimitive) this.series.detachPrimitive(this.brushPrimitive);
      this.series.detachPrimitive(this.handles);
    } else {
      if (this.preview) this.series.attachPrimitive(this.preview);
      if (this.polylinePrimitive) this.series.attachPrimitive(this.polylinePrimitive);
      if (this.brushPrimitive) this.series.attachPrimitive(this.brushPrimitive);
      this.series.attachPrimitive(this.handles);
      this.updateHandles();
    }
  }

  private defaultLabel(): string {
    switch (this.activeTool) {
      case "note": return "Note";
      case "callout": return "Callout";
      case "anchored_text": return "Text";
      case "price_label": return "Price";
      default: return "Note";
    }
  }

  private startPreview(p1: ChartPoint) {
    const p2 = p1;
    switch (this.activeTool) {
      case "trendline":
        this.preview = new TrendLinePrimitive(this.chart, this.series, p1, p2, "segment");
        break;
      case "ray":
        this.preview = new TrendLinePrimitive(this.chart, this.series, p1, p2, "ray");
        break;
      case "extended":
        this.preview = createDrawingPrimitive("extended", [p1, p2]);
        break;
      case "measure":
        this.preview = new TrendLinePrimitive(this.chart, this.series, p1, p2, "measure", {
          lineColor: DRAWING_STROKE, width: 2, dashed: true,
        });
        break;
      case "rectangle":
        this.preview = new RectanglePrimitive(p1, p2, {}, true);
        break;
      case "fib":
        this.preview = new FibRetracementPrimitive(p1, p2);
        break;
      case "longshort":
        this.preview = new LongShortPrimitive(p1, p2);
        break;
      case "short_position":
        this.preview = createDrawingPrimitive("short_position", [p1, p2]);
        break;
      default:
        if (UNIFIED_MODES.has(this.activeTool)) {
          this.preview = createDrawingPrimitive(this.activeTool, [p1, p2]);
        } else {
          return;
        }
    }
    if (this.preview && !this.state.hideDrawings) {
      this.series.attachPrimitive(this.preview);
      this.preview.updateAllViews?.();
    }
  }

  private updatePreview(p2: ChartPoint) {
    if (!this.preview || this.points.length < 1) return;
    const p1 = this.points[0];

    if (this.preview instanceof TrendLinePrimitive) {
      if (!this.state.hideDrawings) this.series.detachPrimitive(this.preview);
      const mode =
        this.activeTool === "ray" ? "ray" :
        this.activeTool === "measure" ? "measure" : "segment";
      const label = mode === "measure" ? measureLabel(p1, p2, this.barIntervalSec) : undefined;
      this.preview = new TrendLinePrimitive(
        this.chart, this.series, p1, p2, mode,
        { lineColor: DRAWING_STROKE, width: 2, dashed: mode === "measure" },
        label
      );
      if (!this.state.hideDrawings) {
        this.series.attachPrimitive(this.preview);
      }
    } else if (
      this.preview instanceof RectanglePrimitive ||
      this.preview instanceof FibRetracementPrimitive ||
      this.preview instanceof LongShortPrimitive
    ) {
      this.preview.updateEndPoint(p2);
    } else if (this.preview instanceof UnifiedDrawingPrimitive) {
      this.preview.updateEndPoint(p2);
    }
  }

  private commitDrawing(pts: ChartPoint[]) {
    this.removePreview();
    const trendMode =
      this.activeTool === "ray" ? "ray" :
      this.activeTool === "measure" ? "measure" :
      this.activeTool === "trendline" ? "segment" : undefined;

    this.addEntry(this.activeTool, pts, {
      text: UNIFIED_MODES.has(this.activeTool) ? this.defaultLabel() : undefined,
      trendMode,
    });
  }

  private removePreview() {
    if (this.preview) {
      this.series.detachPrimitive(this.preview);
      this.preview = null;
    }
  }

  private finishDrawingSession() {
    this.points = [];
    this.dragStartPt = null;
    this.isDragging = false;
    this.removePreview();
    this.commitPolylineIfNeeded();
    this.brushing = false;
    if (!this.state.stayDrawing) this.resetToCrosshair();
  }

  private commitPolylineIfNeeded() {
    if (this.polylinePrimitive && this.polylinePrimitive.points.length > 1) {
      this.addEntry("polyline", [...this.polylinePrimitive.points], {
        primitive: this.polylinePrimitive,
      });
      this.polylinePrimitive = null;
    } else if (this.polylinePrimitive) {
      this.series.detachPrimitive(this.polylinePrimitive);
      this.polylinePrimitive = null;
    }
  }

  private cancelInProgress() {
    this.commitPolylineIfNeeded();
    this.points = [];
    this.dragStartPt = null;
    this.isDragging = false;
    this.removePreview();
    if (this.brushPrimitive) {
      this.series.detachPrimitive(this.brushPrimitive);
      this.brushPrimitive = null;
    }
    this.brushing = false;
  }
}
