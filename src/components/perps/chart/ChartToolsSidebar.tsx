"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Crosshair,
  TrendingUp,
  GitBranch,
  Paintbrush,
  Type,
  Shapes,
  ArrowUpRight,
  Plus,
  Magnet,
  Pencil,
  Lock,
  EyeOff,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { DrawingTool } from "@/lib/chart/drawingTypes";
import {
  DRAWING_CATALOG,
  type ToolCategory,
  findToolCategory,
} from "@/lib/chart/drawingCatalog";

const ICON = 24;
const UTIL_ICON = 22;

const CATEGORY_ICONS: Record<ToolCategory, ReactNode> = {
  cursor: <Crosshair size={ICON} strokeWidth={2} />,
  trend: <TrendingUp size={ICON} strokeWidth={2} />,
  fib_gann: <GitBranch size={ICON} strokeWidth={2} />,
  shapes: <Paintbrush size={ICON} strokeWidth={2} />,
  annotation: <Type size={ICON} strokeWidth={2} />,
  patterns: <Shapes size={ICON} strokeWidth={2} />,
  forecast: <ArrowUpRight size={ICON} strokeWidth={2} />,
  utility: <Plus size={ICON} strokeWidth={2} />,
};

const UTILITY_ICONS: Partial<Record<DrawingTool, ReactNode>> = {
  zoom_in: <ZoomIn size={UTIL_ICON} strokeWidth={2} />,
  zoom_out: <ZoomOut size={UTIL_ICON} strokeWidth={2} />,
  magnet: <Magnet size={UTIL_ICON} strokeWidth={2} />,
  stay_drawing: <Pencil size={UTIL_ICON} strokeWidth={2} />,
  lock_drawings: <Lock size={UTIL_ICON} strokeWidth={2} />,
  hide_drawings: <EyeOff size={UTIL_ICON} strokeWidth={2} />,
  clear_all: <Trash2 size={UTIL_ICON} strokeWidth={2} />,
};

const SIDEBAR_W = 56;
const BTN = 48;
const FLYOUT_W = 300;

interface ChartToolsSidebarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  managerState?: {
    magnet: boolean;
    stayDrawing: boolean;
    lockDrawings: boolean;
    hideDrawings: boolean;
  };
}

export default function ChartToolsSidebar({
  activeTool,
  onToolChange,
  managerState,
}: ChartToolsSidebarProps) {
  const [openCategory, setOpenCategory] = useState<ToolCategory | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const activeCategory = findToolCategory(activeTool);

  const closeFlyout = useCallback(() => setOpenCategory(null), []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        closeFlyout();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [closeFlyout]);

  const toggleCategory = (id: ToolCategory) => {
    setOpenCategory((prev) => (prev === id ? null : id));
  };

  const selectTool = (tool: DrawingTool) => {
    onToolChange(tool);
    if (
      tool !== "magnet" &&
      tool !== "stay_drawing" &&
      tool !== "lock_drawings" &&
      tool !== "hide_drawings"
    ) {
      closeFlyout();
    }
  };

  const isUtilityActive = (tool: DrawingTool) => {
    if (!managerState) return activeTool === tool;
    if (tool === "magnet") return managerState.magnet;
    if (tool === "stay_drawing") return managerState.stayDrawing;
    if (tool === "lock_drawings") return managerState.lockDrawings;
    if (tool === "hide_drawings") return managerState.hideDrawings;
    return activeTool === tool;
  };

  const mainCategories = DRAWING_CATALOG.filter((c) => c.id !== "utility");
  const utilityCategory = DRAWING_CATALOG.find((c) => c.id === "utility");

  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: BTN,
    height: BTN,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    background: active ? "rgba(212,165,116,0.18)" : "transparent",
    color: active ? "#F5D5A8" : "#9CA3AF",
    transition: "background 0.12s, color 0.12s",
  });

  return (
    <div
      ref={sidebarRef}
      data-testid="chart-tools-sidebar"
      style={{ position: "relative", display: "flex", flexShrink: 0, zIndex: 20 }}
    >
      <div
        style={{
          width: SIDEBAR_W,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          padding: "6px 0",
          borderRight: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(10,10,10,0.98)",
        }}
      >
        {mainCategories.map((cat) => {
          const isOpen = openCategory === cat.id;
          const isActive = activeCategory === cat.id;
          const active = isOpen || isActive;
          return (
            <button
              key={cat.id}
              data-testid={`chart-tool-category-${cat.id}`}
              title={cat.label}
              onClick={() => toggleCategory(cat.id)}
              style={btnStyle(active)}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "#E5E7EB";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "#9CA3AF";
              }}
            >
              {CATEGORY_ICONS[cat.id]}
            </button>
          );
        })}

        <div
          style={{
            width: 28,
            height: 1,
            margin: "6px 0",
            background: "rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        />

        {utilityCategory?.tools.map((tool) => {
          const active = isUtilityActive(tool.id);
          return (
            <button
              key={tool.id}
              data-testid={`chart-tool-${tool.id}`}
              title={tool.label}
              onClick={() => selectTool(tool.id)}
              style={{
                ...btnStyle(active),
                height: 40,
              }}
            >
              {UTILITY_ICONS[tool.id]}
            </button>
          );
        })}
      </div>

      {openCategory && (
        <div
          data-testid={`chart-tool-flyout-${openCategory}`}
          style={{
            position: "absolute",
            left: SIDEBAR_W,
            top: 0,
            bottom: 0,
            width: FLYOUT_W,
            background: "#FFFFFF",
            borderRight: "1px solid #E5E7EB",
            boxShadow: "6px 0 28px rgba(0,0,0,0.4)",
            overflowY: "auto",
            zIndex: 30,
          }}
        >
          {DRAWING_CATALOG.find((c) => c.id === openCategory)?.tools.map((tool, idx, arr) => {
            const prev = arr[idx - 1];
            const showSection = tool.section && tool.section !== prev?.section;
            const selected = activeTool === tool.id;
            return (
              <div key={tool.id}>
                {showSection && (
                  <div
                    style={{
                      padding: "12px 16px 6px",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#6B7280",
                      textTransform: "uppercase",
                    }}
                  >
                    {tool.section}
                  </div>
                )}
                <button
                  data-testid={`chart-tool-item-${tool.id}`}
                  onClick={() => selectTool(tool.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "12px 16px",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    background: selected ? "#1F2937" : "transparent",
                    color: selected ? "#FFFFFF" : "#111827",
                    fontSize: 14,
                    fontWeight: selected ? 500 : 400,
                    fontFamily: "'Inter', -apple-system, sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.background = "#F3F4F6";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>{tool.label}</span>
                  {tool.shortcut && (
                    <span style={{ fontSize: 12, color: selected ? "#9CA3AF" : "#9CA3AF" }}>
                      {tool.shortcut}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
