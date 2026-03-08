"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useApiWithPolling } from "@/hooks/useApiWithPolling";
import { BackendHealthCard } from "./BackendHealthCard";

interface MetricsSummary {
  generated_at: string;
  servers: { online: number; offline: number; other: number; total: number };
  docker: {
    container_count: number;
    total_memory_mb: number;
    last_collected_at: string | null;
  } | null;
}

interface ProxmoxResponse {
  available: boolean;
  nodes?: number;
  cpu_percent?: number | null;
  memory_percent?: number | null;
  message?: string;
}

export function QuickStatsRow() {
  const { token, ready } = useAuth();
  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useApi<MetricsSummary>(
    "/api/metrics/summary",
    { token, immediate: ready }
  );
  useApiWithPolling({ data: summary, loading: summaryLoading, error: null, refetch: refetchSummary });

  const proxmoxResult = useApi<ProxmoxResponse>("/api/metrics/proxmox", { token, immediate: ready });
  const { data: proxmox } = proxmoxResult;
  useApiWithPolling(proxmoxResult);

  return (
    <div
      className="dashboard-quick-stats"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <BackendHealthCard />
      <div className="card quick-stat" style={{ minWidth: "140px" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Servers</div>
        {summaryLoading && !summary ? (
          <div style={{ height: "1.5rem", background: "var(--bg-hover)", borderRadius: "4px" }} />
        ) : summary ? (
          <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>
            <span style={{ color: "var(--success)" }}>{summary.servers.online}</span>
            <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.875rem" }}> / </span>
            <span style={{ color: summary.servers.offline > 0 ? "var(--warning)" : undefined }}>{summary.servers.offline}</span>
            <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.875rem" }}> / {summary.servers.total}</span>
          </div>
        ) : (
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>—</span>
        )}
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>online / offline / total</div>
      </div>
      <div className="card quick-stat" style={{ minWidth: "140px" }}>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Docker</div>
        {summaryLoading && !summary ? (
          <div style={{ height: "1.5rem", background: "var(--bg-hover)", borderRadius: "4px" }} />
        ) : summary?.docker != null ? (
          <>
            <div style={{ fontSize: "1.125rem", fontWeight: 700 }}>{summary.docker.container_count} <span style={{ fontWeight: 400, fontSize: "0.875rem", color: "var(--text-muted)" }}>containers</span></div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>{summary.docker.total_memory_mb} MB</div>
          </>
        ) : (
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No metrics</span>
        )}
      </div>
      {proxmox?.available && (
        <div className="card quick-stat" style={{ minWidth: "140px" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Proxmox</div>
          <div style={{ fontSize: "1rem", fontWeight: 600 }}>
            {proxmox.nodes != null ? `${proxmox.nodes} node(s)` : "—"}
            {(proxmox.cpu_percent != null || proxmox.memory_percent != null) && (
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 400 }}>
                {" "}
                {proxmox.cpu_percent != null && `CPU ${proxmox.cpu_percent}%`}
                {proxmox.cpu_percent != null && proxmox.memory_percent != null && " · "}
                {proxmox.memory_percent != null && `Mem ${proxmox.memory_percent}%`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
