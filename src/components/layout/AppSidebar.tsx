import { Link, useLocation } from "@tanstack/react-router";
import {
  Users,
  UserCog,
  Stethoscope,
  ScanLine,
  LayoutDashboard,
  Activity,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People Management",
    items: [
      { to: "/patients", label: "Patient Management", icon: Users },
      { to: "/users", label: "User Management", icon: UserCog },
      { to: "/doctors", label: "Doctor Management", icon: Stethoscope },
    ],
  },
  {
    label: "Diagnostics",
    items: [{ to: "/xray", label: "AI X-Ray Analysis", icon: ScanLine }],
  },
] as const;

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground shadow-elevated lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-md">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">DentalCare</p>
          <p className="text-xs text-sidebar-foreground/70">Clinic Suite</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.to === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="text-xs font-medium">Logged in as</p>
          <p className="text-sm font-semibold">Dr. Admin</p>
        </div>
      </div>
    </aside>
  );
}
