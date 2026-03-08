"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { apiFetch } from "@/api/client";
import { useToast } from "@/components/Toast";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { SkeletonCard, SkeletonRow } from "@/components/Skeleton";

interface Server {
  id: string;
  name: string;
  host: string;
  port: number | null;
  type: string;
  status: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface HistoryEntry {
  id: string;
  server_id: string;
  status: string;
  latency_ms: number | null;
  details: Record<string, unknown> | null;
  checked_at: string;
}

export default function ServerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { user, token, ready, logout, isAdmin } = useAuth();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", host: "", port: "", type: "web" });
  const { data: serverData, loading: serverLoading, refetch: refetchServer } = useApi<{ server: Server }>(
    id ? `/api/servers/${id}` : "",
    { token, immediate: ready && !!id }
  );
  const { data: historyData, loading: historyLoading, refetch: refetchHistory } = useApi<{ history: HistoryEntry[] }>(
    id ? `/api/servers/${id}/history?limit=50` : "",
    { token, immediate: ready && !!id }
  );
  const [checking, setChecking] = useState(false);

  const server = serverData?.server ?? null;
  const history = historyData?.history ?? [];

  useEffect(() => {
    if (!id || !ready) return;
    const interval = setInterval(() => {
      refetchServer();
      refetchHistory();
    }, 60000);
    return () => clearInterval(interval);
  }, [id, ready, refetchServer, refetchHistory]);

  const handleCheckNow = useCallback(async () => {
    if (!token || !id) return;
    setChecking(true);
    try {
      await apiFetch<{ status: string; latency_ms: number | null }>(`/api/servers/${id}/check`, {
        method: "POST",
        token,
      });
      await refetchServer();
      await refetchHistory();
    } finally {
      setChecking(false);
    }
  }, [id, token, refetchServer, refetchHistory]);

  const openEdit = useCallback(() => {
    if (!server) return;
    setEditForm({
      name: server.name,
      host: server.host,
      port: server.port != null ? String(server.port) : "",
      type: server.type || "web",
    });
    setEditOpen(true);
  }, [server]);

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token || !id) return;
      setEditSubmitting(true);
      try {
        await apiFetch(`/api/servers/${id}`, {
          method: "PUT",
          token,
          body: JSON.stringify({
            name: editForm.name.trim(),
            host: editForm.host.trim(),
            port: editForm.port.trim() ? parseInt(editForm.port, 10) : null,
            type: editForm.type.trim() || "web",
          }),
        });
        toast("Server updated", "success");
        setEditOpen(false);
        await refetchServer();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to update server", "error");
      } finally {
        setEditSubmitting(false);
      }
    },
    [id, token, editForm, refetchServer, toast]
  );

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "1200px", padding: "0 1.5rem" }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!id) {
    router.replace("/dashboard");
    return null;
  }

  if (!serverLoading && !server) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <Header user={user} onLogout={logout} />
        <main className="container" style={{ padding: "2rem 1.5rem" }}>
          <p style={{ color: "var(--text-muted)" }}>Server not found.</p>
          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header user={user} onLogout={logout} />
      <main className="container" style={{ padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <button
            type="button"
            className="btn"
            onClick={() => router.push("/dashboard")}
            style={{
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {serverLoading || !server ? (
          <div className="card" style={{ padding: "2rem" }}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>{server.name}</h1>
                  <p style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {server.host}
                    {server.port != null ? `:${server.port}` : ""}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <StatusBadge status={server.status} />
                    <span className="badge badge-neutral">{server.type}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn"
                      onClick={openEdit}
                      style={{ fontSize: "0.875rem", border: "1px solid var(--border)" }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCheckNow}
                    disabled={checking}
                    style={{ fontSize: "0.875rem" }}
                  >
                    {checking ? "Checking…" : "Check now"}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Added {new Date(server.created_at).toLocaleString()} · Last updated {new Date(server.updated_at).toLocaleString()}
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Status history</h2>
              {historyLoading ? (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))}
                  </tbody>
                </table>
              ) : history.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No checks recorded yet. Use “Check now” or wait for the automatic poll.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Time</th>
                        <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                        <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "0.5rem 0.75rem", fontSize: "0.875rem" }}>{new Date(h.checked_at).toLocaleString()}</td>
                          <td style={{ padding: "0.5rem 0.75rem" }}>
                            <StatusBadge status={h.status} />
                          </td>
                          <td style={{ padding: "0.5rem 0.75rem", fontFamily: "monospace", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                            {h.latency_ms != null ? `${h.latency_ms} ms` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {editOpen && isAdmin && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-server-title"
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 100,
                  padding: "1rem",
                }}
                onClick={() => !editSubmitting && setEditOpen(false)}
              >
                <div
                  className="card"
                  style={{ maxWidth: "24rem", width: "100%", margin: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 id="edit-server-title" style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
                    Edit server
                  </h2>
                  <form onSubmit={handleEditSubmit}>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <label htmlFor="edit-name" style={{ display: "block", fontSize: "0.8125rem", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
                        Name
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <label htmlFor="edit-host" style={{ display: "block", fontSize: "0.8125rem", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
                        Host
                      </label>
                      <input
                        id="edit-host"
                        type="text"
                        required
                        value={editForm.host}
                        onChange={(e) => setEditForm((f) => ({ ...f, host: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <label htmlFor="edit-port" style={{ display: "block", fontSize: "0.8125rem", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
                        Port (optional)
                      </label>
                      <input
                        id="edit-port"
                        type="number"
                        min={1}
                        max={65535}
                        value={editForm.port}
                        onChange={(e) => setEditForm((f) => ({ ...f, port: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <label htmlFor="edit-type" style={{ display: "block", fontSize: "0.8125rem", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
                        Type
                      </label>
                      <input
                        id="edit-type"
                        type="text"
                        value={editForm.type}
                        onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                        style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => !editSubmitting && setEditOpen(false)}
                        disabled={editSubmitting}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                        {editSubmitting ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
