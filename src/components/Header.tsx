"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthUser } from "@/hooks/useAuth";
import { SystemHealthIcon } from "@/components/SystemHealthIcon";

interface HeaderProps {
  user: AuthUser | null;
  onLogout: () => void;
}

const navLinkStyle = {
  padding: "0.375rem 0.75rem",
  borderRadius: "var(--radius)",
  fontSize: "0.8125rem",
  fontWeight: 500,
  textDecoration: "none",
  transition: "all 0.15s ease",
} as const;

export function Header({ user, onLogout }: HeaderProps) {
  const pathname = usePathname();
  const isDashboardHome = pathname === "/dashboard";
  const navTabs = [{ href: "/dashboard/portainer", label: "Portainer" }];

  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      padding: "0.875rem 0",
      background: "var(--bg-secondary)",
    }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link
            href="/dashboard"
            style={{
              ...navLinkStyle,
              fontSize: "1.125rem",
              fontWeight: 700,
              color: isDashboardHome ? "var(--accent)" : "var(--text-primary)",
              background: isDashboardHome ? "var(--accent-muted)" : "transparent",
            }}
          >
            htbx.xyz
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} aria-label="Dashboard tabs">
            {navTabs.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...navLinkStyle,
                  color: pathname === item.href ? "var(--accent)" : "var(--text-secondary)",
                  background: pathname === item.href ? "var(--accent-muted)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <SystemHealthIcon active={pathname === "/dashboard/health"} />
      </div>
    </header>
  );
}
