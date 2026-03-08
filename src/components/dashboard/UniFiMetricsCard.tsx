"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useApiWithPolling } from "@/hooks/useApiWithPolling";

interface UniFiResponse {
  available: boolean;
  devices?: number | null;
  clients?: number | null;
  message?: string;
}

export function UniFiMetricsCard() {
  const { token, ready } = useAuth();
  const { data, loading, error, refetch } = useApi<UniFiResponse>("/api/metrics/unifi", { token, immediate: ready });
  useApiWithPolling({ data, loading, error, refetch });

  return (
    <section className="card dashboard-section" aria-label="UniFi metrics">
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
        UniFi / UDM Pro
      </h2>
      {loading && !data ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          <div style={{ height: "3rem", background: "var(--bg-hover)", borderRadius: "var(--radius)" }} />
          <div style={{ height: "3rem", background: "var(--bg-hover)", borderRadius: "var(--radius)" }} />
        </div>
      ) : data?.available ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Devices</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{data.devices != null ? data.devices : "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Clients</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{data.clients != null ? data.clients : "—"}</div>
          </div>
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
          {data?.message || error || "UniFi metrics not configured. Set PROMETHEUS_URL and run unifi-poller (docker compose --profile unifi)."}
        </p>
      )}
    </section>
  );
}
