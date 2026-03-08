"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useApiWithPolling } from "@/hooks/useApiWithPolling";
import { apiFetch } from "@/api/client";
import { useToast } from "@/components/Toast";

interface ServerRow {
  id: string;
  name: string;
  host: string;
  port: number | null;
  type: string;
  status: string;
  latest_latency_ms?: number | null;
}

interface DockerServer {
  id: string;
  name: string;
  apiUrl: string | null;
}

function projectServerToManaged(ds: DockerServer): { name: string; host: string; port: number; type: string } {
  const name = ds.name || ds.id || "Server";
  if (!ds.apiUrl || ds.apiUrl.trim() === "") {
    return { name, host: "localhost", port: 8000, type: "web" };
  }
  try {
    const u = new URL(ds.apiUrl.startsWith("http") ? ds.apiUrl : `https://${ds.apiUrl}`);
    const port = u.port ? parseInt(u.port, 10) : (u.protocol === "https:" ? 443 : 80);
    return { name, host: u.hostname, port, type: "web" };
  } catch {
    return { name, host: "localhost", port: 8000, type: "web" };
  }
}

function statusClass(status: string): string {
  const s = (status || "unknown").toLowerCase();
  if (s === "online" || s === "healthy") return "system-health-status-online";
  if (s === "offline" || s === "error") return "system-health-status-offline";
  return "system-health-status-unknown";
}

export function ManagedServersSection() {
  const { token, ready, isAdmin } = useAuth();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", host: "", port: "", type: "web" });

  const serversResult = useApi<{ servers: ServerRow[] }>("/api/servers", {
    token,
    immediate: ready,
  });
  useApiWithPolling(serversResult, 15000);
  const servers = useMemo(() => serversResult.data?.servers ?? [], [serversResult.data?.servers]);
  const refetch = serversResult.refetch;

  const dockerResult = useApi<{ dockerServers: DockerServer[] }>("/api/docker-servers", {
    token,
    immediate: ready,
  });
  const projectServers = useMemo(() => dockerResult.data?.dockerServers ?? [], [dockerResult.data?.dockerServers]);

  const projectNotYetManaged = useMemo(() => {
    return projectServers.filter((ds) => {
      const { host, port } = projectServerToManaged(ds);
      return !servers.some((s) => s.host === host && (s.port ?? 0) === port);
    });
  }, [projectServers, servers]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) return;
      setSubmitting(true);
      try {
        await apiFetch("/api/servers", {
          method: "POST",
          token,
          body: JSON.stringify({
            name: form.name.trim(),
            host: form.host.trim(),
            port: form.port.trim() ? parseInt(form.port, 10) : undefined,
            type: form.type.trim() || "web",
          }),
        });
        toast("Server added", "success");
        setModalOpen(false);
        setForm({ name: "", host: "", port: "", type: "web" });
        await refetch();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to add server", "error");
      } finally {
        setSubmitting(false);
      }
    },
    [token, form, refetch, toast]
  );

  const openAddFromProject = useCallback((ds: DockerServer) => {
    const { name, host, port, type } = projectServerToManaged(ds);
    setForm({ name, host, port: String(port), type });
    setModalOpen(true);
  }, []);

  const handleAddAllProject = useCallback(async () => {
    if (!token || projectNotYetManaged.length === 0) return;
    setSubmitting(true);
    let added = 0;
    try {
      for (const ds of projectNotYetManaged) {
        const { name, host, port, type } = projectServerToManaged(ds);
        try {
          await apiFetch("/api/servers", {
            method: "POST",
            token,
            body: JSON.stringify({ name, host, port, type }),
          });
          added++;
        } catch {
          // skip duplicates or errors
        }
      }
      await refetch();
      if (added > 0) toast(`Added ${added} server(s) to managed`, "success");
      if (added < projectNotYetManaged.length) toast("Some servers were already added or failed", "info");
    } finally {
      setSubmitting(false);
    }
  }, [token, projectNotYetManaged, refetch, toast]);

  if (!ready) return null;

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Systems</h2>
          {isAdmin && (
            <button
              type="button"
              className="button primary"
              onClick={() => setModalOpen(true)}
              style={{ fontSize: "0.875rem" }}
            >
              Add server
            </button>
          )}
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Managed servers; names reflect live status. Click a server for details.
        </p>
        {!token ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Sign in to see systems.</p>
        ) : servers.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {isAdmin ? "No servers yet. Click “Add server” to add one." : "No servers assigned to your account."}
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {servers.map((s) => (
              <li
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Link
                  href={`/dashboard/servers/${s.id}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span className={statusClass(s.status)}>{s.name}</span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {s.host}
                    {s.port != null ? `:${s.port}` : ""}
                  </span>
                  {s.latest_latency_ms != null && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.latest_latency_ms} ms</span>
                  )}
                </Link>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                  {s.status || "unknown"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {projectServers.length > 0 && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Servers from project config
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Docker / API hosts from <code style={{ fontSize: "0.75rem" }}>DOCKER_SERVERS</code>. Add them to managed
            servers to see status above.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {projectServers.map((ds) => {
              const parsed = projectServerToManaged(ds);
              const alreadyManaged = servers.some((s) => s.host === parsed.host && (s.port ?? 0) === parsed.port);
              return (
                <li
                  key={ds.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{ds.name}</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                      {ds.apiUrl || "This server (local)"}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                      → {parsed.host}:{parsed.port}
                    </span>
                  </div>
                  {isAdmin &&
                    (alreadyManaged ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Already in managed</span>
                    ) : (
                      <button
                        type="button"
                        className="button primary"
                        style={{ fontSize: "0.8125rem" }}
                        onClick={() => openAddFromProject(ds)}
                        disabled={submitting}
                      >
                        Add to managed
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
          {isAdmin && projectNotYetManaged.length > 1 && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                className="button"
                style={{ fontSize: "0.875rem" }}
                onClick={handleAddAllProject}
                disabled={submitting}
              >
                {submitting ? "Adding…" : `Add all ${projectNotYetManaged.length} to managed`}
              </button>
            </div>
          )}
        </div>
      )}

      {modalOpen && isAdmin && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-server-title"
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
          onClick={() => !submitting && setModalOpen(false)}
        >
          <div
            className="card"
            style={{ maxWidth: "24rem", width: "100%", margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="add-server-title" style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem" }}>
              Add server
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label
                  htmlFor="server-name"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    marginBottom: "0.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Name
                </label>
                <input
                  id="server-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Web Server"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label
                  htmlFor="server-host"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    marginBottom: "0.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Host
                </label>
                <input
                  id="server-host"
                  type="text"
                  required
                  value={form.host}
                  onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))}
                  placeholder="192.168.1.10 or hostname"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label
                  htmlFor="server-port"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    marginBottom: "0.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Port (optional)
                </label>
                <input
                  id="server-port"
                  type="number"
                  min={1}
                  max={65535}
                  value={form.port}
                  onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                  placeholder="e.g. 8080"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="server-type"
                  style={{
                    display: "block",
                    fontSize: "0.8125rem",
                    marginBottom: "0.25rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Type
                </label>
                <input
                  id="server-type"
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  placeholder="web"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="button"
                  onClick={() => !submitting && setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="button primary" disabled={submitting}>
                  {submitting ? "Adding…" : "Add server"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
