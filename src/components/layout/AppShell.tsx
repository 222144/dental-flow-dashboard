import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 md:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Quick search…"
                className="w-64 bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-action" />
            </button>
            <div className="h-9 w-9 rounded-full bg-[image:var(--gradient-primary)]" />
          </div>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
