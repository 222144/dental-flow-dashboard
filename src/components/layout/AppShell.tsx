import { ReactNode, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppSidebar } from "./AppSidebar";
import { Bell, Menu, Search } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pr-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 lg:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input placeholder="بحث سريع…" className="w-64 bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-action" />
            </button>
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-full p-1 pl-3 transition-colors hover:bg-muted"
              aria-label="الملف الشخصي"
            >
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-foreground">Dr. Rana Salem</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-xs font-bold text-primary-foreground">
                DR
              </div>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
