import { useState, useEffect, useCallback, useRef } from "react";

export interface PriceAlert {
  id: string;
  token: string;
  targetPrice: number;
  condition: "above" | "below";
  createdAt: number;
  triggered: boolean;
  currentPrice?: number;
  thresholdType: "absolute" | "percentage";
  percentageChange?: number;
  referencePrice?: number;
}

const STORAGE_KEY = "afx_price_alerts";
const POLL_INTERVAL = 30000;

function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((a: any) => ({
      ...a,
      thresholdType: a.thresholdType || "absolute",
    }));
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {}
}

async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function sendBrowserNotification(alert: PriceAlert) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const dirLabel = alert.condition === "above" ? "hit" : "dropped to";
  const priceStr = alert.currentPrice
    ? `$${alert.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}`
    : `$${alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;

  let body: string;
  if (alert.thresholdType === "percentage" && alert.percentageChange) {
    body = `${alert.token} moved ${alert.percentageChange > 0 ? "+" : ""}${alert.percentageChange.toFixed(1)}% - now at ${priceStr}`;
  } else {
    body = `${alert.token} ${dirLabel} ${priceStr} (target: $${alert.targetPrice.toLocaleString()})`;
  }

  try {
    new Notification("AFX Price Alert", {
      body,
      icon: "/favicon.ico",
      tag: `alert-${alert.id}`,
      requireInteraction: false,
    });
  } catch {}
}

async function fetchBatchPrices(tokens: string[]): Promise<Record<string, { price: number; change24h: number | null }>> {
  try {
    const res = await fetch("/api/price/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.prices || {};
  } catch {
    return {};
  }
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsDenied, setNotificationsDenied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
      setNotificationsDenied(Notification.permission === "denied");
    }
  }, []);

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  const enableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (!granted && typeof window !== "undefined" && "Notification" in window) {
      setNotificationsDenied(Notification.permission === "denied");
    }
    return granted;
  }, []);

  const addAlert = useCallback((
    token: string,
    targetPrice: number,
    condition: "above" | "below",
    thresholdType: "absolute" | "percentage" = "absolute",
    percentageChange?: number,
    referencePrice?: number
  ) => {
    const newAlert: PriceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      token: token.toUpperCase(),
      targetPrice,
      condition,
      createdAt: Date.now(),
      triggered: false,
      thresholdType,
      percentageChange,
      referencePrice,
    };
    setAlerts(prev => [...prev, newAlert]);

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      requestNotificationPermission().then(granted => {
        setNotificationsEnabled(granted);
        if (!granted) setNotificationsDenied(Notification.permission === "denied");
      });
    }

    return newAlert;
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    notifiedIdsRef.current.delete(id);
  }, []);

  const removeAllAlerts = useCallback(() => {
    setAlerts([]);
    notifiedIdsRef.current.clear();
  }, []);

  const dismissTriggered = useCallback((id: string) => {
    setTriggeredAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const checkAlerts = useCallback(async () => {
    const active = alerts.filter(a => !a.triggered);
    if (active.length === 0) return;

    const tokens = Array.from(new Set(active.map(a => a.token)));
    const prices = await fetchBatchPrices(tokens);

    const newlyTriggered: PriceAlert[] = [];
    const updatedAlerts = alerts.map(a => {
      if (a.triggered) return a;
      const priceInfo = prices[a.token];
      if (!priceInfo) return a;

      const currentPrice = priceInfo.price;
      let met = false;

      if (a.thresholdType === "percentage" && a.referencePrice && a.percentageChange) {
        const actualChange = ((currentPrice - a.referencePrice) / a.referencePrice) * 100;
        if (a.condition === "above") {
          met = actualChange >= a.percentageChange;
        } else {
          met = actualChange <= -Math.abs(a.percentageChange);
        }
      } else {
        met =
          (a.condition === "above" && currentPrice >= a.targetPrice) ||
          (a.condition === "below" && currentPrice <= a.targetPrice);
      }

      if (met) {
        const triggered = { ...a, triggered: true, currentPrice };
        if (!notifiedIdsRef.current.has(a.id)) {
          notifiedIdsRef.current.add(a.id);
          newlyTriggered.push(triggered);
        }
        return triggered;
      }
      return { ...a, currentPrice };
    });

    setAlerts(updatedAlerts);
    if (newlyTriggered.length > 0) {
      setTriggeredAlerts(prev => [...prev, ...newlyTriggered]);
      newlyTriggered.forEach(sendBrowserNotification);
    }
  }, [alerts]);

  useEffect(() => {
    const active = alerts.filter(a => !a.triggered);
    if (active.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    checkAlerts();

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(checkAlerts, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [alerts.filter(a => !a.triggered).length, checkAlerts]);

  return {
    alerts,
    triggeredAlerts,
    activeAlerts: alerts.filter(a => !a.triggered),
    addAlert,
    removeAlert,
    removeAllAlerts,
    dismissTriggered,
    notificationsEnabled,
    notificationsDenied,
    enableNotifications,
  };
}
