"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div
      style={{
        background: "#000000",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <AlertTriangle style={{ width: 32, height: 32, color: "#EF4444" }} />
        <h2
          style={{
            color: "#E6EDF3",
            fontSize: "18px",
            fontWeight: 500,
            margin: 0,
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            color: "#9BA4AE",
            fontSize: "14px",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: "#111520",
            border: "1px solid #1B2030",
            borderRadius: "8px",
            color: "#E6EDF3",
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
          data-testid="button-error-retry"
        >
          <RotateCcw style={{ width: 14, height: 14 }} />
          Try again
        </button>
      </div>
    </div>
  );
}
