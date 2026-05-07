"use client";

import { useEffect, useCallback, useRef } from "react";
import usePositionStore from "@/stores/usePositionStore";
import { fetchAllPositions } from "@/services/positionFetcher";
import { useEvmWallet } from "./useEvmWallet";

const FRESHNESS_GUARD_MS = 5000;

export function usePositionRefresh(intervalMs = 30000) {
  const { evmAddress } = useEvmWallet();
  const setPositions = usePositionStore((s) => s.setPositions);
  const setLoading = usePositionStore((s) => s.setLoading);
  const setError = usePositionStore((s) => s.setError);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (!evmAddress) return;
    if (fetchingRef.current) return;

    const lastUpdated = usePositionStore.getState().lastUpdated;
    if (!force && lastUpdated > 0 && Date.now() - lastUpdated < FRESHNESS_GUARD_MS) return;

    fetchingRef.current = true;
    setLoading(true);
    try {
      const positions = await fetchAllPositions(undefined, evmAddress);
      setPositions(positions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load positions");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [evmAddress, setPositions, setLoading, setError]);

  const refreshToken = usePositionStore((s) => s.refreshToken);

  useEffect(() => {
    refresh(true);
    const iv = setInterval(() => refresh(), intervalMs);
    return () => clearInterval(iv);
  }, [refresh, intervalMs]);

  useEffect(() => {
    if (refreshToken > 0) refresh(true);
  }, [refreshToken, refresh]);

  return { refresh: () => refresh(true) };
}
