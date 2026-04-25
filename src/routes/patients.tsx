import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable } from "@/components/data/DataTable";
import { patients, type Patient } from "@/data/mock";

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [
      { title: "إدارة المرضى — عيادة الأسنان" },
      { name: "description", content: "إدارة بيانات المرضى والوصول إلى السجلات الطبية وخطط العلاج." },
    ],
  }),
  component: PatientsPage,
});

function StatusBadge({ status }: { status: Patient["status"] }) {
  const map: Record<Patient["status"], string> = {
    "نشط": "bg-primary/10 text-primary",
    "قيد المتابعة": "bg-action/15 text-action",
    "مغلق": "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

function PatientsPage() {
  return (
    <AppShell>
      <DataTable<Patient>
        title="إدارة المرضى"
        description="استعرض بيانات المرضى وخطط العلاج والسجلات الطبية."
        addLabel="إضافة مريض"
        data={patients}
        searchKeys={["name", "id", "phone"]}
        rowLink={(p) => `/patients/${p.id}`}
        columns={[
          { key: "name", header: "اسم المريض" },
          { key: "id", header: "الرقم" },
          { key: "age", header: "العمر" },
          { key: "gender", header: "النوع" },
          { key: "phone", header: "الهاتف" },
          { key: "lastVisit", header: "آخر زيارة" },
          { key: "status", header: "الحالة", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </AppShell>
  );
}