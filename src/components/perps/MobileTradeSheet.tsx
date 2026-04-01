"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { T, mono } from "./terminalTheme";

interface MobileTradeSheetProps {
  open: boolean;
  initialSide: "long" | "short";
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileTradeSheet({ open, initialSide, onClose, children }: MobileTradeSheetProps) {
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setDragY(0);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("input, select, button, [data-no-drag]")) return;
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    if (dragY > 120) {
      onClose();
    }
    setDragY(0);
  }, [dragY, onClose]);

  if (!open) return null;

  const translateY = dragY > 0 ? dragY : 0;

  return (
    <div
      data-testid="mobile-trade-sheet-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: `rgba(0,0,0,${Math.max(0.1, 0.6 - translateY / 600)})`,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        transition: dragging ? "none" : "background 0.3s",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={sheetRef}
        data-testid="mobile-trade-sheet"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "88vh",
          background: T.bgCard,
          borderRadius: "14px 14px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: `translateY(${translateY}px)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          animation: !dragging && translateY === 0 ? "mobileSheetUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)" : undefined,
          boxShadow: "0 -12px 48px rgba(0,0,0,0.5)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <style>{`
          @keyframes mobileSheetUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px 0 4px",
          flexShrink: 0,
          cursor: "grab",
        }}>
          <div style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: T.border,
          }} />
        </div>

        <div style={{
          flex: 1,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileTradeButtonProps {
  onTapLong: () => void;
  onTapShort: () => void;
}

export function MobileTradeButton({ onTapLong, onTapShort }: MobileTradeButtonProps) {
  return (
    <div
      data-testid="mobile-trade-cta"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: "8px 12px",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
        background: "linear-gradient(to top, rgba(8,8,12,0.98) 60%, rgba(8,8,12,0) 100%)",
        display: "flex",
        gap: 8,
      }}
    >
      <button
        data-testid="mobile-btn-long"
        onClick={onTapLong}
        style={{
          flex: 1,
          padding: "14px 0",
          borderRadius: 8,
          border: "none",
          background: T.orange,
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          fontFamily: mono,
          letterSpacing: "0.05em",
          cursor: "pointer",
        }}
      >
        LONG
      </button>
      <button
        data-testid="mobile-btn-short"
        onClick={onTapShort}
        style={{
          flex: 1,
          padding: "14px 0",
          borderRadius: 8,
          border: "none",
          background: T.red,
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          fontFamily: mono,
          letterSpacing: "0.05em",
          cursor: "pointer",
        }}
      >
        SHORT
      </button>
    </div>
  );
}
