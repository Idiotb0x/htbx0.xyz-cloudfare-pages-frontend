"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useApiWithPolling } from "@/hooks/useApiWithPolling";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/Skeleton";

interface WebsiteMonitoringSite {
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
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
  if (!iso) return "\u2014";
  const d = new Date(iso);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

export function WebsiteMonitoringCard() {
  const { token, ready } = useAuth();
  const { data, loading, error, refetch } = useApi<WebsiteMonitoringResponse>("/api/website-monitoring", { token, immediate: ready });
  useApiWithPolling({ data, loading, error, refetch });

  return (
    <section className="card dashboard-section" aria-label="Website monitoring">
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
        Website monitoring
      </h2>
      {loading && !data ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Skeleton width="120px" height="0.875rem" />
              <Skeleton width="40%" height="0.875rem" />
              <Skeleton width="60px" height="1.25rem" />
            </div>
          ))}
        </div>
      ) : data?.sites?.length ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Site", "URL", "Status", "Response", "Checked"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.sites.map((site) => (
                <tr key={site.url} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem", fontWeight: 500 }}>{site.name}</td>
                  <td style={{ padding: "0.75rem", fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }} title={site.url}>
                    <a href={site.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                      {site.url}
                    </a>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <StatusBadge status={site.status === "up" ? "healthy" : site.status === "degraded" ? "maintenance" : "offline"} />
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {site.response_time_ms != null ? site.response_time_ms + " ms" : (site.error || "\u2014")}
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>{formatRelativeTime(site.last_checked)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
          {data?.message || error || "No URLs configured. Edit backend/data/website-monitoring-urls.json or set WEBSITE_MONITORING_URLS."}
        </p>
      )}
    </section>
  );
}
