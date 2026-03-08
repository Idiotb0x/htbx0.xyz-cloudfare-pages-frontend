"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type HealthStatus = "healthy" | "unhealthy" | "loading";

interface SystemHealthIconProps {
  active?: boolean;
}

export function SystemHealthIcon({ active }: SystemHealthIconProps) {
  const [status, setStatus] = useState<HealthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setStatus(data.status === "healthy" ? "healthy" : "unhealthy");
        }
      } catch {
        if (!cancelled) setStatus("unhealthy");
      }
    }
    check();
    const interval = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const title =
    status === "healthy"
      ? "System Health: healthy"
      : status === "unhealthy"
        ? "System Health: unhealthy"
        : "System Health: checking…";

  return (
    <Link
      href="/dashboard/health"
      title={title}
      aria-label={title}
      className="system-health-icon-link"
      data-status={status}
      data-active={active ? "true" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.375rem 0.5rem",
        borderRadius: "var(--radius)",
        textDecoration: "none",
        fontSize: "0.8125rem",
        fontWeight: 500,
        transition: "color 0.2s ease, background 0.2s ease, text-shadow 0.2s ease",
      }}
    >
      System Health
    </Link>
  );
}
