"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServersRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/health");
  }, [router]);
  return (
    <main style={{ maxWidth: "48rem" }}>
      <div className="card">
        <p style={{ color: "var(--text-muted)" }}>Redirecting to System Health…</p>
      </div>
    </main>
  );
}
