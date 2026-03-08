"use client";

import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

interface DockerServer {
  id: string;
  name: string;
  apiUrl?: string | null;
}

interface DockerServersResponse {
  dockerServers: DockerServer[];
}

interface DockerServerTabsProps {
  /** Current server id from URL; used to highlight active tab */
  serverId: string | null;
  /** Called when user selects a tab so parent can sync URL */
  onServerChange?: (id: string) => void;
}

export function DockerServerTabs({ serverId, onServerChange }: DockerServerTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, ready } = useAuth();
  const { data, loading } = useApi<DockerServersResponse>("/api/docker-servers", {
    token,
    immediate: ready,
  });

  const servers = useMemo(() => data?.dockerServers ?? [], [data?.dockerServers]);
  const activeId = serverId ?? (servers[0]?.id ?? "default");

  useEffect(() => {
    if (servers.length > 1 && !serverId && servers[0]?.id) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("server", servers[0].id);
      router.replace(`/dashboard?${next.toString()}`, { scroll: false });
    }
  }, [servers, serverId, searchParams, router]);

  const setServer = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("server", id);
      router.replace(`/dashboard?${next.toString()}`, { scroll: false });
      onServerChange?.(id);
    },
    [router, searchParams, onServerChange]
  );

  if (loading || servers.length === 0) {
    return null;
  }

  if (servers.length === 1) {
    return (
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
        Docker: {servers[0].name}
      </p>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Docker servers"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.25rem",
        marginBottom: "1rem",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "0.75rem",
      }}
    >
      {servers.map((s) => {
        const isActive = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls="containers-panel"
            id={`tab-${s.id}`}
            onClick={() => setServer(s.id)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              background: isActive ? "var(--accent-muted)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
