"use client";

import { useState, useEffect } from "react";

const FALLBACK_GRAFANA = process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3030";

export default function GrafanaPage() {
  const [grafanaBase, setGrafanaBase] = useState(FALLBACK_GRAFANA);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiBase}/api/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.grafanaUrl) setGrafanaBase(data.grafanaUrl);
      })
      .catch(() => {});
  }, []);

  const iframeSrc = `${grafanaBase.replace(/\/$/, "")}/?orgId=1&kiosk&theme=dark`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 8rem)", minHeight: "400px" }}>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
        Grafana. Log in here if the iframe prompts, or open in a new tab from the link below.
      </p>
      <iframe
        title="Grafana"
        src={iframeSrc}
        style={{
          flex: 1,
          width: "100%",
          border: "1px solid rgba(57, 255, 20, 0.35)",
          borderRadius: "var(--radius)",
          background: "var(--bg-primary)",
          boxShadow: "0 0 12px rgba(57, 255, 20, 0.25), 0 0 24px rgba(57, 255, 20, 0.12)",
        }}
        allowFullScreen
      />
    </div>
  );
}
