"use client";

import { useMemo, useState, useEffect } from "react";

const FALLBACK_LOCAL = "http://localhost:9000";

export default function PortainerPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    const o = window.location.origin;
    const id = setTimeout(() => setOrigin(o), 0);
    return () => clearTimeout(id);
  }, []);

  const iframeSrc = useMemo(() => {
    const envUrl = process.env.NEXT_PUBLIC_PORTAINER_URL?.trim();
    if (envUrl) return envUrl.endsWith("/") ? envUrl : `${envUrl}/`;
    const isLocal = typeof window !== "undefined" && /^localhost|127\.0\.0\.1$/.test(window.location.hostname);
    return isLocal ? FALLBACK_LOCAL : origin ? `${origin}/portainer/` : "";
  }, [origin]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 8rem)", minHeight: "400px" }}>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
        Docker management via Portainer. Create an admin user when prompted if first time.
        {iframeSrc && (
          <>
            {" "}
            <a href={iframeSrc} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 500 }}>
              Open in new tab
            </a>{" "}
            if the iframe does not load.
          </>
        )}
      </p>
      {iframeSrc && (
        <iframe
          key={iframeSrc}
          title="Portainer"
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
      )}
    </div>
  );
}
