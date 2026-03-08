"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { SkeletonCard } from "@/components/Skeleton";

interface ContainerRow {
  id: string;
  name: string;
  state: string;
  status: string;
  image: string;
}

interface ContainersResponse {
  containers: ContainerRow[];
  error?: string;
}

function stateToBadgeStatus(state: string): string {
  const s = (state || "").toLowerCase();
  if (s === "running") return "healthy";
  if (s === "exited" || s === "dead") return "offline";
  if (s === "paused" || s === "restarting" || s === "created") return "maintenance";
  return "unknown";
}

const STATE_BADGE_CLASSES: Record<string, string> = {
  healthy: "badge-success",
  offline: "badge-danger",
  maintenance: "badge-warning",
  unknown: "badge-neutral",
};

function ContainerStateBadge({ state }: { state: string }) {
  const status = stateToBadgeStatus(state);
  const cls = STATE_BADGE_CLASSES[status] || "badge-neutral";
  const display = (state || "unknown").toLowerCase();
  return <span className={`badge ${cls}`}>{display}</span>;
}

interface ContainersCardProps {
  /** When set, fetches containers for this Docker server (tab routing) */
  serverId?: string | null;
}

export function ContainersCard({ serverId }: ContainersCardProps) {
  const { token, ready } = useAuth();
  const endpoint = serverId
    ? `/api/containers?server=${encodeURIComponent(serverId)}`
    : "/api/containers";
  const { data, loading, error, refetch } = useApi<ContainersResponse>(endpoint, {
    token,
    immediate: ready,
  });

  const containers = data?.containers ?? [];
  const apiError = data?.error || error;

  if (loading && containers.length === 0) {
    return (
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Containers</h2>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Containers</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => refetch()}
          style={{ fontSize: "0.8125rem" }}
        >
          Refresh
        </button>
      </div>

      {apiError && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {apiError}
        </p>
      )}

      {containers.length === 0 && !apiError ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No containers found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {containers.map((c) => (
            <li
              key={c.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: "1rem",
                alignItems: "center",
                padding: "0.625rem 0",
                borderBottom: "1px solid var(--border)",
                fontSize: "0.875rem",
              }}
            >
              <span style={{ fontWeight: 500 }}>{c.name}</span>
              <ContainerStateBadge state={c.state} />
              <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }} title={c.status}>
                {c.image}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
