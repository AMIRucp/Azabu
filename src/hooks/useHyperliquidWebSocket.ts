import { useEffect, useRef, useState } from "react";
import { SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

interface UseHyperliquidWebSocketOptions {
  address?: string;
  enabled?: boolean;
}

interface WebSocketData {
  positions: any[];
  openOrders: any[];
  prices: Record<string, number>;
  lastUpdate: number;
}

export function useHyperliquidWebSocket({
  address,
  enabled = true,
}: UseHyperliquidWebSocketOptions = {}) {
  const [data, setData] = useState<WebSocketData>({
    positions: [],
    openOrders: [],
    prices: {},
    lastUpdate: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<SubscriptionClient | null>(null);
  const transportRef = useRef<WebSocketTransport | null>(null);

  useEffect(() => {
    if (!enabled || !address) {
      setData({ positions: [], openOrders: [], prices: {}, lastUpdate: 0 });
      setIsConnected(false);
      setError(null);
      return;
    }

    setData({ positions: [], openOrders: [], prices: {}, lastUpdate: 0 });
    setIsConnected(false);
    setError(null);

    let mounted = true;

    const connect = async () => {
      try {
        const transport = new WebSocketTransport();
        const client = new SubscriptionClient({ transport });

        transportRef.current = transport;
        clientRef.current = client;

        await client.allMids((priceData) => {
          if (!mounted) return;
          const prices: Record<string, number> = {};
          if (priceData && typeof priceData === 'object') {
            Object.entries(priceData).forEach(([symbol, price]) => {
              if (typeof price === 'string' || typeof price === 'number') {
                prices[symbol] = parseFloat(price.toString());
              }
            });
          }
          setData(prev => ({
            ...prev,
            prices,
            lastUpdate: Date.now(),
          }));
        });

        await client.userFills({ user: address }, (fillData) => {
          if (!mounted) return;
          setData(prev => ({
            ...prev,
            lastUpdate: Date.now(),
          }));
        });

        await client.openOrders({ user: address }, (orderData) => {
          if (!mounted) return;
          setData(prev => ({
            ...prev,
            openOrders: Array.isArray(orderData) ? orderData : [],
            lastUpdate: Date.now(),
          }));
        });

        setIsConnected(true);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "WebSocket connection failed");
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      mounted = false;
      clientRef.current = null;
      transportRef.current = null;
      setIsConnected(false);
      setData({ positions: [], openOrders: [], prices: {}, lastUpdate: 0 });
    };
  }, [address, enabled]);

  return {
    data,
    isConnected,
    error,
    prices: data.prices,
    openOrders: data.openOrders,
    lastUpdate: data.lastUpdate,
  };
}
