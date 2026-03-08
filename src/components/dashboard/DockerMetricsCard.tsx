"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useApiWithPolling } from "@/hooks/useApiWithPolling";

interface MetricsSummary {
  generated_at: string;
  servers: { online: number; offline: number; other: number; total: number };
  docker: {
    container_count: number;
    total_memory_mb: number;
    last_collected_at: string | null;
    net_rx_mb?: number | null;
    net_tx_mb?: number | null;
  } | null;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

export function DockerMetricsCard() {
  const { token, ready } = useAuth();
  const { data, loading, error, refetch } = useApi<MetricsSummary>("/api/metrics/summary", { token, immediate: ready });
  useApiWithPolling({ data, loading, error, refetch });

  const docker = data?.docker;

  return (
    <section className="card dashboard-section" aria-label="Docker metrics">
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
        Docker
      </h2>
      {loading && !data ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: "3rem", background: "var(--bg-hover)", borderRadius: "var(--radius)" }} />
          ))}
        </div>
      ) : error ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>{error}</p>
      ) : docker != null ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Containers</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{docker.container_count}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Memory</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{docker.total_memory_mb} <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text-muted)" }}>MB</span></div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Network RX</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{docker.net_rx_mb != null ? `${docker.net_rx_mb} MB` : "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Network TX</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>{docker.net_tx_mb != null ? `${docker.net_tx_mb} MB` : "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Last collected</div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{formatRelativeTime(docker.last_collected_at)}</div>
          </div>
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
          No Docker metrics. Enable Docker metrics (socket mount and DOCKER_METRICS_ENABLED) or manage containers on the Containers page.
        </p>
      )}
    </section>
  );
}
