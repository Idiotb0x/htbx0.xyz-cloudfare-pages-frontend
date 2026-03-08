"use client";

import { useMemo, useState, useEffect } from "react";

export default function InfluxDBPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const isLocal =
    typeof window !== "undefined" &&
    /^localhost|127\.0\.0\.1$/.test(window.location.hostname);
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  const iframeSrc = useMemo(() => {
    if (process.env.NEXT_PUBLIC_INFLUXDB_URL) {
      return process.env.NEXT_PUBLIC_INFLUXDB_URL.replace(/\/$/, "");
    }
    return isLocal ? "http://localhost:8087" : `http://${hostname}:8087`;
  }, [isLocal, hostname]);

  // Browsers block mixed content: HTTPS page cannot embed HTTP iframe → white page.
  const cannotEmbed = mounted && isHttps && iframeSrc.startsWith("http:");

  if (!mounted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 8rem)", color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (cannotEmbed) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 8rem)",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: "1rem", maxWidth: "28rem" }}>
          InfluxDB runs over HTTP on port 8087. This page is over HTTPS, so the browser blocks embedding it here (mixed content).
        </p>
        <a
          href={iframeSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Open InfluxDB in new tab
        </a>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "1rem" }}>
          Log in with your InfluxDB admin user (see .env: INFLUXDB_USER, INFLUXDB_PASSWORD).
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem", maxWidth: "28rem" }}>
          To embed here: set <code style={{ fontSize: "0.7rem" }}>NEXT_PUBLIC_INFLUXDB_URL=https://influxdb.htbx0.xyz</code> in .env on the server, then run <code style={{ fontSize: "0.7rem" }}>docker compose up -d --build frontend</code> (runbook § InfluxDB over HTTPS).
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 8rem)", minHeight: "400px" }}>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
        InfluxDB 2 UI. Log in with your InfluxDB admin user (see .env).{" "}
        {isHttps ? null : (
          <>
            If the iframe is blocked, open{" "}
            <a href={iframeSrc} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
              InfluxDB in a new tab
            </a>.
          </>
        )}
      </p>
      <iframe
        title="InfluxDB"
        src={iframeSrc}
        style={{
          flex: 1,
          width: "100%",
          border: "1px solid rgba(57, 255, 20, 0.35)",
          borderRadius: "var(--radius)",
          background: "var(--bg-primary)",
          boxShadow: "0 0 12px rgba(57, 255, 20, 0.25), 0 0 24px rgba(57, 255, 20, 0.12)",
        }}
      />
    </div>
  );
}
