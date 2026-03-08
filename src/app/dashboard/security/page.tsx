"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Security tab moved into System Health. Redirect so old links and bookmarks still work.
 */
export default function DashboardSecurityPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/health");
  }, [router]);
  return (
    <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Redirecting to System Health…</p>
    </div>
  );
}
