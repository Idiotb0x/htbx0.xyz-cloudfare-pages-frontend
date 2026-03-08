"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { apiFetch } from "@/api/client";

interface UseApiOptions {
  token: string | null;
  immediate?: boolean;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  endpoint: string,
  options: UseApiOptions
): UseApiResult<T> {
  const { token, immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(async () => {
    if (!token || !endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<T>(endpoint, { token });
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [endpoint, token]);

  useEffect(() => {
    if (immediate && token) refetch();
  }, [immediate, token, refetch]);

  return { data, loading, error, refetch };
}
