"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useApiWithPolling } from "@/hooks/useApiWithPolling";
import { SecurityReport } from "@/components/SecurityReport";
import { ManagedServersSection } from "@/components/ManagedServersSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp?: string;
  database?: string;
  version?: string;
  error?: string;
}

interface PurgeResults {
  server_status_log: { deleted: number };
  security_audits: { deleted: number };
  user_sessions: { deleted: number };
  metric_snapshots: { deleted: number };
}

interface PurgeStatusResponse {
  lastRunAt: string | null;
  results: PurgeResults | null;
  message?: string;
}

export default function SystemHealthPage() {
  const { token, ready, isAdmin } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const purgeResult = useApi<PurgeStatusResponse>("/api/purge/status", {
    token,
    immediate: ready,
  });
  useApiWithPolling(purgeResult, 15000);
  const purgeStatus = purgeResult.data;

  useEffect(() => {
    let cancelled = false;
    async function fetchHealth() {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setHealth(data);
          setHealthError(res.ok ? null : data.error || `HTTP ${res.status}`);
        }
      } catch (e) {
        if (!cancelled) {
          setHealthError(e instanceof Error ? e.message : "Failed to reach API");
          setHealth(null);
        }
      } finally {
        if (!cancelled) setHealthLoading(false);
      }
    }
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const status = health?.status ?? "unhealthy";
  const isHealthy = status === "healthy";

  return (
    <main style={{ maxWidth: "48rem" }}>
      {/* Backend health */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
          System Health
        </h1>
        {healthLoading && !health ? (
          <p style={{ color: "var(--text-muted)" }}>Checking…</p>
        ) : healthError && !health ? (
          <p style={{ color: "var(--danger)" }}>{healthError}</p>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <span
                className="system-health-dot"
                data-status={isHealthy ? "healthy" : "unhealthy"}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontWeight: 600,
                  textTransform: "capitalize",
                  color: isHealthy ? "var(--success)" : "var(--danger)",
                }}
              >
                Backend: {status}
              </span>
            </div>
            <dl style={{ display: "grid", gap: "0.5rem", margin: 0 }}>
              {health?.timestamp && (
                <>
                  <dt style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Last checked</dt>
                  <dd style={{ margin: 0, fontSize: "0.875rem" }}>
                    {new Date(health.timestamp).toLocaleString()}
                  </dd>
                </>
              )}
              {health?.database !== undefined && (
                <>
                  <dt style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Database</dt>
                  <dd style={{ margin: 0, fontSize: "0.875rem", textTransform: "capitalize" }}>
                    {health.database}
                  </dd>
                </>
              )}
              {health?.version && (
                <>
                  <dt style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Backend version</dt>
                  <dd style={{ margin: 0, fontSize: "0.875rem" }}>{health.version}</dd>
                </>
              )}
              {health?.error && (
                <>
                  <dt style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Error</dt>
                  <dd style={{ margin: 0, fontSize: "0.875rem", color: "var(--danger)" }}>{health.error}</dd>
                </>
              )}
            </dl>
          </>
        )}
      </div>

      {/* Data purge — last run results */}
      {token && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Data purge
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Auto-purge keeps DB and storage bounded. Last run:
          </p>
          {purgeResult.loading && !purgeStatus ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading…</p>
          ) : !purgeStatus?.lastRunAt ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {purgeStatus?.message ?? "Purge has not run yet (runs on schedule after backend start)."}
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                <strong>{new Date(purgeStatus.lastRunAt).toLocaleString()}</strong>
              </p>
              {purgeStatus.results && (
                <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.25rem 1rem", margin: 0, fontSize: "0.8125rem" }}>
                  <dt style={{ color: "var(--text-muted)" }}>Status history</dt>
                  <dd style={{ margin: 0 }}>{purgeStatus.results.server_status_log?.deleted ?? 0} rows deleted</dd>
                  <dt style={{ color: "var(--text-muted)" }}>Security audits</dt>
                  <dd style={{ margin: 0 }}>{purgeStatus.results.security_audits?.deleted ?? 0} rows deleted</dd>
                  <dt style={{ color: "var(--text-muted)" }}>Sessions (expired/revoked)</dt>
                  <dd style={{ margin: 0 }}>{purgeStatus.results.user_sessions?.deleted ?? 0} rows deleted</dd>
                  <dt style={{ color: "var(--text-muted)" }}>Metric snapshots</dt>
                  <dd style={{ margin: 0 }}>{purgeStatus.results.metric_snapshots?.deleted ?? 0} rows deleted</dd>
                </dl>
              )}
            </>
          )}
        </div>
      )}

      <ManagedServersSection />

      {/* Security audit (admin only) — combined from Security tab */}
      {ready && isAdmin && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Security audit
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Security report and recommendations.
          </p>
          <SecurityReport token={token} />
        </div>
      )}
    </main>
  );
}
