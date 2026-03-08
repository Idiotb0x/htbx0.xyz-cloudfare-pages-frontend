"use client";

import { useState, useEffect } from "react";

const MO_SERVER_DASHBOARD_UID = "01";
const FALLBACK_GRAFANA = process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3030";

export default function DashboardPage() {
  const [grafanaBase, setGrafanaBase] = useState(FALLBACK_GRAFANA);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiBase}/api/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.grafanaUrl) setGrafanaBase(data.grafanaUrl);
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, []);

  const iframeSrc = `${grafanaBase.replace(/\/$/, "")}/d/${MO_SERVER_DASHBOARD_UID}?orgId=1&kiosk&theme=dark`;
  const isLocalhostGrafana =
    configLoaded &&
    (grafanaBase.startsWith("http://localhost") || grafanaBase.startsWith("http://127.0.0.1"));
  const isProduction = typeof window !== "undefined" && !window.location.hostname.match(/^localhost|127\.0\.0\.1$/);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 120px)", margin: "0 -1.5rem -2rem", padding: 0 }}>
      {isProduction && isLocalhostGrafana && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border)",
            fontSize: "14px",
          }}
        >
          Mo dashboard not loading: server is still using default Grafana URL. On the server run:{" "}
          <code style={{ fontSize: "13px" }}>cd ~/htbx-xyz && ./scripts/setup-grafana-htbx0.sh</code>{" "}
          (adds GRAFANA_PUBLIC_URL to .env and recreates backend so the iframe points here).
        </div>
      )}
      <div
        style={{
          flex: 1,
          minHeight: "calc(100vh - 120px)",
          borderRadius: "var(--radius-lg, 12px)",
          overflow: "hidden",
          background: "rgba(22, 16, 31, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(57, 255, 20, 0.35)",
          boxShadow: "0 0 12px rgba(57, 255, 20, 0.25), 0 0 24px rgba(57, 255, 20, 0.12), 0 8px 32px rgba(0,0,0,0.24)",
        }}
      >
        <iframe
          title="Mo Server dashboard (Grafana)"
          src={iframeSrc}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "calc(100vh - 120px)",
            border: "none",
            background: "transparent",
            display: "block",
          }}
          allowFullScreen
        />
      </div>
    </div>
  );
}
