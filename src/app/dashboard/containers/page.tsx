"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonCard } from "@/components/Skeleton";
import { DockerServerTabs } from "@/components/DockerServerTabs";
import { ContainersCard } from "@/components/ContainersCard";

function ContainersContent() {
  const searchParams = useSearchParams();
  const serverId = searchParams.get("server");
  return (
    <>
      <DockerServerTabs serverId={serverId} />
      <div style={{ marginTop: "1rem" }} id="containers-panel">
        <ContainersCard serverId={serverId} />
      </div>
    </>
  );
}

export default function DashboardContainersPage() {
  const { ready } = useAuth();

  if (!ready) {
    return (
      <div style={{ minHeight: "40vh" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
        Containers
      </h1>
      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Manage Docker containers across servers.
      </p>
      <Suspense fallback={<div style={{ minHeight: "120px" }}><SkeletonCard /></div>}>
        <ContainersContent />
      </Suspense>
    </>
  );
}
