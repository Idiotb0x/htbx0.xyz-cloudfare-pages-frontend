"use client";

import { useEffect, useRef } from "react";
import { UseApiResult } from "./useApi";

const DEFAULT_POLL_INTERVAL_MS = 45000;

/**
 * Refetches data at a fixed interval. Use with useApi.
 */
export function useApiWithPolling<T>(
  result: UseApiResult<T>,
  intervalMs: number = DEFAULT_POLL_INTERVAL_MS
): void {
  const { refetch } = result;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalMs <= 0) return;
    intervalRef.current = setInterval(() => {
      refetch();
    }, intervalMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refetch, intervalMs]);
}
