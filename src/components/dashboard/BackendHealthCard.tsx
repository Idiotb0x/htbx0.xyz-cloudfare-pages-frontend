"use client";

import { useState, useCallback, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
  version?: string;
}

export function BackendHealthCard() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      const json = await res.json();
      if (res.ok) setData(json);
      else setError(json.error || res.statusText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const t = setInterval(fetchHealth, 45000);
    return () => clearInterval(t);
  }, [fetchHealth]);

  if (loading && !data) {
    return (
      <div className="card quick-stat" style={{ minWidth: "140px" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Backend</div>
        <div style={{ height: "1.5rem", background: "var(--bg-hover)", borderRadius: "4px" }} />
      </div>
    );
  }

  const healthy = data?.status === "healthy" && data?.database === "connected";
  return (
    <div className="card quick-stat" style={{ minWidth: "140px" }}>
      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Backend</div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: error ? "var(--danger)" : healthy ? "var(--success)" : "var(--warning)",
          }}
          aria-hidden
        />
        <span style={{ fontSize: "1rem", fontWeight: 600 }}>
          {error ? "Unavailable" : healthy ? "Healthy" : "Degraded"}
        </span>
      </div>
      {data?.version && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>v{data.version}</div>
      )}
    </div>
  );
}
