"use client";

import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <Header user={user} onLogout={logout} />
      <div className="container" style={{ padding: "2rem 1.5rem 2rem" }}>
        {children}
      </div>
    </div>
  );
}
