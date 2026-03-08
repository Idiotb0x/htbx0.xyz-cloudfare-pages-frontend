"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useApiWithPolling } from "@/hooks/useApiWithPolling";

interface ProxmoxResponse {
  available: boolean;
  nodes?: number;
  cpu_percent?: number | null;
  memory_percent?: number | null;
  message?: string;
}

export function ProxmoxMetricsCard() {
  const { token, ready } = useAuth();
  const { data, loading, error, refetch } = useApi<ProxmoxResponse>("/api/metrics/proxmox", { token, immediate: ready });
  useApiWithPolling({ data, loading, error, refetch });

  return (
    <section className="card dashboard-section" aria-label="Proxmox metrics">
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
        Proxmox
      </h2>
      {loading && !data ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "3rem", background: "var(--bg-hover)", borderRadius: "var(--radius)" }} />
          ))}
        </div>
      ) : data?.available ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Nodes</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{data.nodes ?? "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>CPU</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{data.cpu_percent != null ? `${data.cpu_percent}%` : "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.375rem" }}>Memory</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{data.memory_percent != null ? `${data.memory_percent}%` : "—"}</div>
          </div>
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
          {data?.message || error || "Proxmox metrics not configured. Set PROMETHEUS_URL and ensure Proxmox exporter is scraped."}
        </p>
      )}
    </section>
  );
}
