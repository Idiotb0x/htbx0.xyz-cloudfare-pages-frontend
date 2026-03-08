"use client";

import { useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/api/client";
import { SkeletonCard } from "@/components/Skeleton";

interface AuditResult {
  id: string;
  category: string;
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  details?: string | null;
  remediation?: string | null;
}

interface Audit {
  id: string;
  status: string;
  total_checks: number;
  passed: number;
  warnings: number;
  failed: number;
  score: number;
  results: AuditResult[];
  duration_ms: number | null;
  triggered_by: string;
  created_at: string;
}

interface AuditResponse {
  audit: Audit | null;
  message?: string;
}

function statusIcon(status: string) {
  if (status === "pass") return "✓";
  if (status === "warn") return "⚠";
  return "✕";
}

function statusColor(status: string) {
  if (status === "pass") return "var(--success)";
  if (status === "warn") return "var(--warning, #eab308)";
  return "var(--danger)";
}

function scoreColor(score: number) {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--warning, #eab308)";
  return "var(--danger)";
}

function formatTimeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

interface SecurityReportProps {
  token: string | null;
}

export function SecurityReport({ token }: SecurityReportProps) {
  const { toast } = useToast();
  const { data, loading, refetch } = useApi<AuditResponse>("/api/security/audit", {
    token,
    immediate: !!token,
  });
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);

  const runNow = useCallback(async () => {
    if (!token) return;
    setRunning(true);
    try {
      await apiFetch<{ audit: Audit }>("/api/security/audit/run", {
        method: "POST",
        token,
      });
      toast("Security audit started", "success");
      refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to run audit", "error");
    } finally {
      setRunning(false);
    }
  }, [token, refetch, toast]);

  const audit = data?.audit;

  if (loading && !audit) {
    return (
      <div className="card" style={{ marginBottom: "2rem" }}>
        <SkeletonCard />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Security Audit</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={runNow}
            disabled={running}
            style={{ fontSize: "0.8125rem" }}
          >
            {running ? "Running…" : "Run first audit"}
          </button>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {data?.message || "No completed audit yet."}
        </p>
      </div>
    );
  }

  const results = audit.results || [];
  const byCategory = results.reduce<Record<string, AuditResult[]>>((acc, r) => {
    const cat = r.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});
  const sortedCategories = Object.keys(byCategory).sort((a, b) => {
    const hasFail = (c: string) => byCategory[c].some((r) => r.status === "fail");
    const hasWarn = (c: string) => byCategory[c].some((r) => r.status === "warn");
    if (hasFail(a) && !hasFail(b)) return -1;
    if (!hasFail(a) && hasFail(b)) return 1;
    if (hasWarn(a) && !hasWarn(b)) return -1;
    if (!hasWarn(a) && hasWarn(b)) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setExpanded(!expanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Security Audit</h2>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: scoreColor(audit.score),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {audit.score}
          </span>
          <span style={{ fontSize: "0.875rem" }}>
            <span style={{ color: "var(--success)", fontWeight: 500 }}>{audit.passed} passed</span>
            <span style={{ color: "var(--text-muted)", margin: "0 0.35rem" }}>·</span>
            <span style={{ color: "var(--warning)", fontWeight: 500 }}>{audit.warnings} warnings</span>
            <span style={{ color: "var(--text-muted)", margin: "0 0.35rem" }}>·</span>
            <span style={{ color: "var(--danger)", fontWeight: 500 }}>{audit.failed} failed</span>
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Last checked: {formatTimeAgo(audit.created_at)}
          </span>
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          {expanded ? "▼ Collapse" : "▶ Expand"}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={(e) => { e.stopPropagation(); runNow(); }}
              disabled={running}
              style={{ fontSize: "0.8125rem" }}
            >
              {running ? "Running…" : "Run audit now"}
            </button>
          </div>
          {sortedCategories.map((cat) => (
            <div key={cat} style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                {cat}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {byCategory[cat]
                  .sort((a, b) => {
                    const order = { fail: 0, warn: 1, pass: 2 };
                    return (order[a.status as keyof typeof order] ?? 2) - (order[b.status as keyof typeof order] ?? 2);
                  })
                  .map((r) => (
                    <li
                      key={r.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--border)",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <span style={{ color: statusColor(r.status), flexShrink: 0 }}>{statusIcon(r.status)}</span>
                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                        <span style={{ color: "var(--text-muted)" }}>— {r.message}</span>
                      </div>
                      {r.remediation && (r.status === "fail" || r.status === "warn") && (
                        <div style={{ paddingLeft: "1.25rem", fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                          Fix: {r.remediation}
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
