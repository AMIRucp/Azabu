import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export interface OCOPair {
  id: string;
  token: string;
  slOrderId: string;
  tpOrderId: string;
  slPrice: number;
  tpPrice: number;
  createdAt: number;
  resolved: boolean;
  resolvedSide?: "sl" | "tp";
}

const STORAGE_KEY_PREFIX = "afx_oco_pairs_";
const POLL_INTERVAL = 30000;

function getStorageKey(wallet: string) {
  return `${STORAGE_KEY_PREFIX}${wallet}`;
}

function loadPairs(wallet: string): OCOPair[] {
  try {
    const raw = localStorage.getItem(getStorageKey(wallet));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePairs(wallet: string, pairs: OCOPair[]) {
  try {
    localStorage.setItem(getStorageKey(wallet), JSON.stringify(pairs));
  } catch {}
}

export function useOCOMonitor(walletAddress: string | null) {
  const [pairs, setPairs] = useState<OCOPair[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();
  const walletRef = useRef(walletAddress);

  useEffect(() => {
    walletRef.current = walletAddress;
    if (walletAddress) {
      setPairs(loadPairs(walletAddress));
    } else {
      setPairs([]);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      savePairs(walletAddress, pairs);
    }
  }, [pairs, walletAddress]);

  const addOCOPair = useCallback((pair: Omit<OCOPair, "id" | "createdAt" | "resolved">) => {
    const newPair: OCOPair = {
      ...pair,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      resolved: false,
    };
    setPairs(prev => [...prev, newPair]);
    return newPair;
  }, []);

  const removePair = useCallback((id: string) => {
    setPairs(prev => prev.filter(p => p.id !== id));
  }, []);

  const checkPairs = useCallback(async () => {
    const wallet = walletRef.current;
    if (!wallet) return;

    const active = pairs.filter(p => !p.resolved);
    if (active.length === 0) return;

    try {
      const res = await fetch(`/api/trigger/orders/${wallet}`);
      if (!res.ok) return;
      const data = await res.json();
      const orders = data?.orders || [];
      const activeOrderIds = new Set(orders.map((o: any) => o.account || o.publicKey));

      for (const pair of active) {
        const slActive = activeOrderIds.has(pair.slOrderId);
        const tpActive = activeOrderIds.has(pair.tpOrderId);

        if (!slActive && !tpActive) {
          setPairs(prev => prev.map(p =>
            p.id === pair.id ? { ...p, resolved: true } : p
          ));
          continue;
        }

        if (!slActive && tpActive) {
          try {
            await fetch(`/api/trigger/cancel`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletAddress: wallet, orderAccount: pair.tpOrderId }),
            });
          } catch {}

          setPairs(prev => prev.map(p =>
            p.id === pair.id ? { ...p, resolved: true, resolvedSide: "sl" } : p
          ));

          toast({
            title: "OCO: Stop Loss triggered",
            description: `${pair.token} stop loss at $${pair.slPrice.toLocaleString()} filled. Take profit order cancelled.`,
          });
        } else if (slActive && !tpActive) {
          try {
            await fetch(`/api/trigger/cancel`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletAddress: wallet, orderAccount: pair.slOrderId }),
            });
          } catch {}

          setPairs(prev => prev.map(p =>
            p.id === pair.id ? { ...p, resolved: true, resolvedSide: "tp" } : p
          ));

          toast({
            title: "OCO: Take Profit triggered",
            description: `${pair.token} take profit at $${pair.tpPrice.toLocaleString()} filled. Stop loss order cancelled.`,
          });
        }
      }
    } catch {}
  }, [pairs, toast]);

  useEffect(() => {
    const active = pairs.filter(p => !p.resolved);
    if (active.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    checkPairs();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(checkPairs, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pairs.filter(p => !p.resolved).length, checkPairs]);

  return {
    ocoPairs: pairs,
    activePairs: pairs.filter(p => !p.resolved),
    addOCOPair,
    removePair,
  };
}
