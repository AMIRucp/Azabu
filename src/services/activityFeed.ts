import useActivityStore from '@/stores/useActivityStore';
import type { Liquidation } from '@/stores/useActivityStore';

let feedStarted = false;
let feedActive = true;
let asterLiqWs: WebSocket | null = null;

const FLUSH_INTERVAL_MS = 200;
const pendingLiqs: Liquidation[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function startFlushTimer() {
  if (flushTimer !== null) return;
  flushTimer = setInterval(() => {
    if (pendingLiqs.length === 0) return;
    const batch = pendingLiqs.splice(0, pendingLiqs.length);
    const store = useActivityStore.getState();
    for (const liq of batch) {
      store.addLiquidation(liq);
    }
  }, FLUSH_INTERVAL_MS);
}

function connectAsterFeed() {
  if (typeof window === 'undefined') return;
  let reconnectDelay = 2000;

  function connect() {
    try {
      asterLiqWs = new WebSocket('wss://fstream.asterdex.com/ws/!forceOrder@arr');

      asterLiqWs.onopen = () => {
        reconnectDelay = 2000;
        useActivityStore.getState().setConnected(true);
      };

      asterLiqWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as {
            e?: string;
            E?: number;
            o?: { s?: string; S?: string; q?: string; p?: string };
          };
          if (data.e === 'forceOrder' && data.o) {
            pendingLiqs.push({
              id: `aster-liq-${Date.now()}-${Math.random()}`,
              timestamp: data.E ?? Date.now(),
              symbol: (data.o.s ?? '').replace('USDT', ''),
              side: data.o.S === 'BUY' ? 'SHORT' : 'LONG',
              size: parseFloat(data.o.q ?? '0') * parseFloat(data.o.p ?? '0'),
              price: parseFloat(data.o.p ?? '0'),
              leverage: 0,
              chain: 'Solana',
              protocol: 'aster',
              user: 'Unknown',
            });
          }
        } catch {}
      };

      asterLiqWs.onclose = () => {
        asterLiqWs = null;
        useActivityStore.getState().setConnected(false);
        if (feedActive) {
          setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
        }
      };

      asterLiqWs.onerror = () => {
        asterLiqWs?.close();
      };
    } catch {}
  }

  connect();
}

export function startActivityFeeds(): void {
  if (feedStarted || typeof window === 'undefined') return;
  feedStarted = true;

  startFlushTimer();
  connectAsterFeed();
}

export function stopActivityFeeds(): void {
  feedActive = false;
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  asterLiqWs?.close();
  asterLiqWs = null;
}

export function getWsConnected(): boolean {
  return useActivityStore.getState().isConnected;
}
