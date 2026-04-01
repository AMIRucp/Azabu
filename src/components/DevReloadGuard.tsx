"use client";
import { useEffect } from "react";

const BUILD_KEY = "azabu_build_v2";

export function DevReloadGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    try {
      if (sessionStorage.getItem(BUILD_KEY) !== "1") {
        sessionStorage.setItem(BUILD_KEY, "1");
        window.location.reload();
      }
    } catch {
    }
  }, []);
  return null;
}
