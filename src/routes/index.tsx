import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Users, Stethoscope, CalendarCheck, Activity } from "lucide-react";
import { patients, doctors } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DentalCare Clinic Suite" },
      { name: "description", content: "Overview of clinic activity, patients, and appointments." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Total Patients", value: "1,284", icon: Users, accent: "primary" },
  { label: "Active Doctors", value: "12", icon: Stethoscope, accent: "primary" },
  { label: "Today’s Appointments", value: "38", icon: CalendarCheck, accent: "action" },
  { label: "X-Rays Analyzed", value: "97", icon: Activity, accent: "action" },
];

function Dashboard() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, Dr. Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here’s what’s happening across the clinic today.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            const isAction = s.accent === "action";
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isAction
                        ? "bg-action/15 text-action"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight">{s.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Recent Patients</h2>
            <ul className="mt-4 divide-y divide-border">
              {patients.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.id} · last visit {p.lastVisit}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">On Duty Today</h2>
            <ul className="mt-4 divide-y divide-border">
              {doctors.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialty}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{d.schedule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
