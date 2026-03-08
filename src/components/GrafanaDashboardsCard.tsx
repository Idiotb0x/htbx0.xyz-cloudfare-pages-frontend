"use client";

/**
 * Renders the provisioned Grafana dashboard (Proxmox from InfluxDB)
 * as a link and embedded iframe on the app dashboard. Uses NEXT_PUBLIC_GRAFANA_URL
 * (default http://localhost:3030; production may set NEXT_PUBLIC_GRAFANA_URL to public URL e.g. https://htbx0.xyz/grafana)
 */

const GRAFANA_BASE = process.env.NEXT_PUBLIC_GRAFANA_URL || "http://localhost:3030";

const DASHBOARDS = [
  {
    uid: "proxmox-influxdb",
    title: "Proxmox (InfluxDB)",
    description: "Proxmox metrics from your InfluxDB server. Configure the InfluxDB datasource in Grafana to point to your Proxmox metrics server.",
  },
] as const;

function dashboardUrl(d: (typeof DASHBOARDS)[number], embed = false) {
  const base = `${GRAFANA_BASE}/d/${d.uid}?orgId=1`;
  return embed ? `${base}&kiosk=tv&theme=dark` : base;
}

export function GrafanaDashboardsCard() {
  return (
    <section
      aria-label="Grafana dashboards"
      className="card"
      data-neon-card="grafana"
      style={{
        marginBottom: "1.5rem",
        padding: "1.5rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        minHeight: "200px",
      }}
    >
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
        Grafana dashboards
      </h2>
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
        Proxmox metrics from InfluxDB. Open in Grafana or view embedded below (log in to Grafana first if needed). Set the InfluxDB datasource URL to your Proxmox metrics server.
      </p>

      {DASHBOARDS.map((d) => (
        <div
          key={d.uid}
          style={{
            marginBottom: "1.5rem",
            border: "1px solid rgba(57, 255, 20, 0.35)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            background: "var(--bg-page)",
            boxShadow: "0 0 12px rgba(57, 255, 20, 0.25), 0 0 24px rgba(57, 255, 20, 0.12)",
          }}
        >
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--text-primary)" }}>
                {d.title}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.description}</p>
            </div>
            <a
              href={dashboardUrl(d, false)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--accent)",
                textDecoration: "none",
                padding: "0.375rem 0.75rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            >
              Open in Grafana →
            </a>
          </div>
          <iframe
            title={d.title}
            src={dashboardUrl(d, true)}
            style={{
              width: "100%",
              height: "360px",
              border: "none",
              display: "block",
            }}
          />
        </div>
      ))}
    </section>
  );
}
