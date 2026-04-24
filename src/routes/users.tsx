import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable } from "@/components/data/DataTable";
import { users, type AppUser } from "@/data/mock";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "إدارة المستخدمين — عيادة الأسنان" },
      { name: "description", content: "إدارة حسابات الأطباء والسكرتارية والمحاسبين." },
    ],
  }),
  component: UsersPage,
});

const roleStyles: Record<AppUser["role"], string> = {
  "مسؤول": "bg-action/15 text-action",
  "طبيب": "bg-primary/15 text-primary",
  "سكرتيرة": "bg-secondary text-secondary-foreground",
  "محاسب": "bg-accent text-accent-foreground",
};

function UsersPage() {
  return (
    <AppShell>
      <DataTable<AppUser>
        title="إدارة المستخدمين"
        description="إدارة حسابات النظام وتعيين الصلاحيات: مسؤول، طبيب، سكرتيرة، محاسب."
        addLabel="إضافة مستخدم"
        data={users}
        searchKeys={["name", "email", "role"]}
        columns={[
          { key: "name", header: "الاسم" },
          { key: "email", header: "البريد الإلكتروني" },
          {
            key: "role",
            header: "الصلاحية",
            render: (r) => (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[r.role]}`}>
                {r.role}
              </span>
            ),
          },
          {
            key: "status",
            header: "الحالة",
            render: (r) => (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  r.status === "نشط" ? "text-success" : "text-action"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    r.status === "نشط" ? "bg-success" : "bg-action"
                  }`}
                />
                {r.status}
              </span>
            ),
          },
          { key: "createdAt", header: "تاريخ الإنشاء" },
        ]}
      />
    </AppShell>
  );
}
