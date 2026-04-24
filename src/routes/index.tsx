import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import {
  TrendingUp,
  Wallet,
  Users,
  Activity,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { patients, doctors } from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — عيادة الأسنان" },
      { name: "description", content: "نظرة عامة على أداء العيادة والمؤشرات الرئيسية." },
    ],
  }),
  component: Dashboard,
});

type Kpi = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: typeof TrendingUp;
  accent: "primary" | "action";
};

const kpis: Kpi[] = [
  { label: "الربحية الشهرية", value: "248,500 ج.م", change: "+12.4%", trend: "up", icon: Wallet, accent: "primary" },
  { label: "كفاءة التحصيل", value: "92.6%", change: "+3.1%", trend: "up", icon: TrendingUp, accent: "primary" },
  { label: "نمو المرضى", value: "1,284", change: "+8.7%", trend: "up", icon: Users, accent: "action" },
  { label: "معدل الكفاءة", value: "88.4%", change: "-1.2%", trend: "down", icon: Activity, accent: "action" },
];

function Dashboard() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">مرحباً بعودتك، أيها المسؤول</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إليك ملخصاً لأداء العيادة اليوم.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            const isAction = k.accent === "action";
            const TrendIcon = k.trend === "up" ? ArrowUpRight : ArrowDownRight;
            return (
              <div
                key={k.label}
                className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isAction ? "bg-action/15 text-action" : "bg-primary/15 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight">{k.value}</p>
                <div
                  className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                    k.trend === "up" ? "text-success" : "text-action"
                  }`}
                >
                  <TrendIcon className="h-3.5 w-3.5" />
                  {k.change} مقارنة بالشهر الماضي
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">أداء الأطباء</h2>
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <ul className="space-y-4">
              {doctors.map((d) => {
                const pct = Math.min(100, (d.patients / 130) * 100);
                return (
                  <li key={d.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{d.name}</span>
                        <span className="mr-2 text-xs text-muted-foreground">· {d.specialty}</span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {d.patients} مريض · ⭐ {d.rating}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-[image:var(--gradient-primary)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">آخر المرضى</h2>
            <ul className="mt-4 divide-y divide-border">
              {patients.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.id} · زيارة {p.lastVisit}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
