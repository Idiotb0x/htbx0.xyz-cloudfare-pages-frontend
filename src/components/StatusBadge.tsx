"use client";

const STATUS_CLASSES: Record<string, string> = {
  online: "badge-success",
  healthy: "badge-success",
  offline: "badge-danger",
  error: "badge-danger",
  unknown: "badge-neutral",
  maintenance: "badge-warning",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = STATUS_CLASSES[status] || "badge-neutral";
  return <span className={`badge ${cls}`}>{status}</span>;
}
