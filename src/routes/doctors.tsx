import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable } from "@/components/data/DataTable";
import { doctors, type Doctor } from "@/data/mock";
import { Star } from "lucide-react";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Doctor Management — DentalCare" },
      { name: "description", content: "Manage doctors, schedules, and specialties." },
    ],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  return (
    <AppShell>
      <DataTable<Doctor>
        title="Doctor Management"
        description="Configure doctor profiles, specialties, and weekly schedules."
        addLabel="Add New Doctor"
        data={doctors}
        searchKeys={["name", "specialty"]}
        columns={[
          { key: "name", header: "Doctor" },
          {
            key: "specialty",
            header: "Specialty",
            render: (r) => (
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {r.specialty}
              </span>
            ),
          },
          { key: "schedule", header: "Schedule" },
          { key: "patients", header: "Patients" },
          {
            key: "rating",
            header: "Rating",
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
