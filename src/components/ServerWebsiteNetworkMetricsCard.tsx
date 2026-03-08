"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/Skeleton";

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

interface WebsiteMonitoringSite {
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  status_code: number | null;
  response_time_ms: number | null;
  last_checked: string;
  error?: string;
}

interface WebsiteMonitoringResponse {
  generated_at: string;
  sites: WebsiteMonitoringSite[];
  message?: string;
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

export function ServerWebsiteNetworkMetricsCard() {
  const { token, ready } = useAuth();
  const { data: metricsData, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useApi<MetricsSummary>("/api/metrics/summary", { token, immediate: ready });
  const { data: websiteMonitoringData, loading: websiteMonitoringLoading } = useApi<WebsiteMonitoringResponse>("/api/website-monitoring", { token, immediate: ready });

  const metrics = metricsData;
  const serverHealthStatus =
    metrics && metrics.servers.total > 0
      ? metrics.servers.offline === 0
        ? "healthy"
        : metrics.servers.online === 0
          ? "offline"
          : "maintenance"
      : "unknown";

  return (
    <section
      id="server-website-network-metrics"
      aria-label="Server, Website and Network Metrics"
      className="card"
      data-neon-card="metrics"
      style={{
        marginBottom: "1.5rem",
        padding: "1.5rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        minHeight: "180px",
      }}
    >
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
        Server, Website &amp; Network Metrics
      </h2>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--text-secondary)" }}>Server &amp; network</h3>
        {metricsLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton width="60%" height="0.625rem" style={{ marginBottom: "0.5rem" }} />
                <Skeleton width="80%" height="1.25rem" />
              </div>
            ))}
          </div>
        ) : metrics ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1.25rem" }}>
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Server health</p>
              <StatusBadge status={serverHealthStatus} />
            </div>
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Reachable</p>
              <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                {metrics.servers.online}<span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.875rem" }}> / {metrics.servers.total}</span>
              </p>
            </div>
            {metrics.docker !== null ? (
              <>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Containers</p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>{metrics.docker.container_count}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Memory</p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>{metrics.docker.total_memory_mb}<span style={{ fontWeight: 400, fontSize: "0.75rem", color: "var(--text-muted)" }}> MB</span></p>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Network RX</p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>{metrics.docker.net_rx_mb != null ? `${metrics.docker.net_rx_mb}` : "—"}<span style={{ fontWeight: 400, fontSize: "0.75rem", color: "var(--text-muted)" }}> MB</span></p>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Network TX</p>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700 }}>{metrics.docker.net_tx_mb != null ? `${metrics.docker.net_tx_mb}` : "—"}<span style={{ fontWeight: 400, fontSize: "0.75rem", color: "var(--text-muted)" }}> MB</span></p>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Last collected</p>
                  <p style={{ fontSize: "0.875rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>{formatRelativeTime(metrics.docker.last_collected_at)}</p>
                </div>
              </>
            ) : (
              <div>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Docker</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }} title="Mount Docker socket and ensure backend can access it. Set DOCKER_METRICS_ENABLED=false to disable.">No Docker metrics</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
              {metricsError
                ? "Metrics unavailable. Backend may be stopped or unreachable."
                : "Metrics unavailable."}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}
              onClick={() => refetchMetrics()}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-secondary)" }}>
          Website monitoring
        </h3>
        {websiteMonitoringLoading ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Skeleton width="120px" height="0.875rem" />
                <Skeleton width="40%" height="0.875rem" />
                <Skeleton width="60px" height="1.25rem" />
              </div>
            ))}
          </div>
        ) : websiteMonitoringData?.sites && websiteMonitoringData.sites.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Site", "URL", "Status", "Response", "Checked"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {websiteMonitoringData.sites.map((site) => (
                  <tr key={site.url} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 500 }}>{site.name}</td>
                    <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }} title={site.url}>
                      <a href={site.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>{site.url}</a>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <StatusBadge status={site.status === "up" ? "healthy" : site.status === "degraded" ? "maintenance" : "offline"} />
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {site.response_time_ms != null ? `${site.response_time_ms} ms` : site.error || "—"}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {formatRelativeTime(site.last_checked)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
            {websiteMonitoringData?.message || "No URLs configured. Edit backend/data/website-monitoring-urls.json or set WEBSITE_MONITORING_URLS."}
          </p>
        )}
      </div>
    </section>
  );
}
