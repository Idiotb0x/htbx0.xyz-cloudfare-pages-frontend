"use client";

import { CSSProperties } from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: CSSProperties;
}

const shimmer: CSSProperties = {
  background: "linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
};

export function Skeleton({ width = "100%", height = "1rem", borderRadius = "var(--radius)", style }: SkeletonProps) {
  return <div style={{ width, height, borderRadius, ...shimmer, ...style }} />;
}

export function SkeletonCard() {
  return (
    <div className="card">
      <Skeleton width="40%" height="0.625rem" style={{ marginBottom: "0.75rem" }} />
      <Skeleton width="60%" height="1.25rem" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={{ padding: "0.75rem 1rem" }}>
          <Skeleton width={i === 0 ? "80%" : "60%"} />
        </td>
      ))}
    </tr>
  );
}
