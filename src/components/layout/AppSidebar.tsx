import { Link, useLocation } from "@tanstack/react-router";
import { Users, UserCog, Stethoscope, ScanLine, LayoutDashboard, Activity, X } from "lucide-react";

const navGroups = [
  {
    label: "نظرة عامة",
    items: [{ to: "/", label: "لوحة التحكم", icon: LayoutDashboard }],
  },
  {
    label: "إدارة الموظفين",
    items: [
      { to: "/patients", label: "إدارة المرضى", icon: Users },
      { to: "/users", label: "إدارة المستخدمين", icon: UserCog },
      { to: "/doctors", label: "إدارة الأطباء", icon: Stethoscope },
    ],
  },
  {
    label: "التشخيص الذكي",
    items: [{ to: "/xray", label: "تحليل الأشعة", icon: ScanLine }],
  },
] as const;

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-elevated transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-3 border-b border-sidebar-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-md">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">عيادة الأسنان</p>
              <p className="text-xs text-sidebar-foreground/70">لوحة المسؤول</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent md:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onClose}
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
            <p className="text-xs font-medium">مسجل الدخول كـ</p>
            <p className="text-sm font-semibold">المسؤول العام</p>
          </div>
        </div>
      </aside>
    </>
  );
}
