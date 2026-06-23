"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import type { DrawingTool } from "@/lib/chart/drawingTypes";
import { isDrawingTool as isChartDrawingTool } from "@/lib/chart/drawingCatalog";

interface ChartCrosshairPlusProps {
  chart: IChartApi | null;
  series: ISeriesApi<"Candlestick"> | null;
  activeTool: DrawingTool;
  onPlace: () => void;
}

export default function ChartCrosshairPlus({
  chart,
  series,
  activeTool,
  onPlace,
}: ChartCrosshairPlusProps) {
  const [pos, setPos] = useState<{ y: number } | null>(null);

  const show = isChartDrawingTool(activeTool) && activeTool !== "brush" && pos !== null;

  useEffect(() => {
    if (!chart || !series) {
      setPos(null);
      return;
    }

    const handler = (param: { point?: { x: number; y: number } }) => {
      if (!param.point || !isChartDrawingTool(activeTool)) {
        setPos(null);
        return;
      }
      setPos({ y: param.point.y });
    };

    chart.subscribeCrosshairMove(handler);
    return () => chart.unsubscribeCrosshairMove(handler);
  }, [chart, series, activeTool]);

  if (!show || !pos) return null;

  return (
    <button
      type="button"
      data-testid="chart-crosshair-plus"
      title="Place drawing at crosshair"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPlace();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        right: 6,
        top: pos.y - 14,
        zIndex: 8,
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: "1px solid rgba(212,165,116,0.45)",
        background: "rgba(28,32,40,0.92)",
        color: "#D4A574",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
        padding: 0,
      }}
    >
      <Plus size={18} strokeWidth={2.5} />
    </button>
  );
}
