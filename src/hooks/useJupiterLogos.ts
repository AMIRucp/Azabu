import { useState, useEffect } from "react";

let globalCache: Record<string, string> | null = null;
let fetchPromise: Promise<Record<string, string>> | null = null;

async function fetchLogos(): Promise<Record<string, string>> {
  if (globalCache) return globalCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("https://token.jup.ag/strict")
    .then((r) => (r.ok ? r.json() : []))
    .then((tokens: { symbol: string; logoURI?: string }[]) => {
      const map: Record<string, string> = {};
      for (const t of tokens) {
        if (t.logoURI) {
          const sym = t.symbol.toUpperCase();
          if (!map[sym]) map[sym] = t.logoURI;
        }
      }
      globalCache = map;
      try {
        sessionStorage.setItem("jup-logos", JSON.stringify(map));
      } catch {}
      return map;
    })
    .catch(() => {
      fetchPromise = null;
      return {};
    });

  return fetchPromise;
}

export function useJupiterLogos(): Record<string, string> {
  const [logos, setLogos] = useState<Record<string, string>>(() => {
    if (globalCache) return globalCache;
    if (typeof window === "undefined") return {};
    try {
      const cached = sessionStorage.getItem("jup-logos");
      if (cached) {
        const parsed = JSON.parse(cached);
        globalCache = parsed;
        return parsed;
      }
    } catch {}
    return {};
  });

  useEffect(() => {
    if (globalCache && Object.keys(globalCache).length > 0) {
      setLogos(globalCache);
      return;
    }
    fetchLogos().then((data) => {
      if (Object.keys(data).length > 0) setLogos(data);
    });
  }, []);

  return logos;
}
