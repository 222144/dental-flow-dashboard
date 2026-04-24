import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable } from "@/components/data/DataTable";
import { doctors, type Doctor } from "@/data/mock";
import { Star } from "lucide-react";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "إدارة الأطباء — عيادة الأسنان" },
      { name: "description", content: "إدارة الأطباء، التخصصات، والجداول الأسبوعية." },
    ],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  return (
    <AppShell>
      <DataTable<Doctor>
        title="إدارة الأطباء"
        description="ضبط ملفات الأطباء والتخصصات والجداول الأسبوعية."
        addLabel="إضافة طبيب"
        data={doctors}
        searchKeys={["name", "specialty"]}
        columns={[
          { key: "name", header: "اسم الطبيب" },
          {
            key: "specialty",
            header: "التخصص",
            render: (r) => (
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {r.specialty}
              </span>
            ),
          },
          { key: "schedule", header: "الجدول" },
          { key: "patients", header: "عدد المرضى" },
          {
            key: "rating",
            header: "التقييم",
            render: (r) => (
              <span className="inline-flex items-center gap-1 font-medium">
                <Star className="h-3.5 w-3.5 fill-action text-action" />
                {r.rating}
              </span>
            ),
          },
        ]}
      />
    </AppShell>
  );
}
