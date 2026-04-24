import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable } from "@/components/data/DataTable";
import { patients, type Patient } from "@/data/mock";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Patient Management — DentalCare" },
      { name: "description", content: "Manage patient profiles and access medical records." },
    ],
  }),
  component: PatientsPage,
});

function StatusBadge({ status }: { status: Patient["status"] }) {
  const map: Record<Patient["status"], string> = {
    Active: "bg-primary/10 text-primary",
    Pending: "bg-action/15 text-action",
    Discharged: "bg-muted text-muted-foreground",
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
        title="Patient Management"
        description="Browse, edit, and access medical records for every patient."
        addLabel="Add New Patient"
        data={patients}
        searchKeys={["name", "id", "phone"]}
        rowLink={(p) => `/patients/${p.id}`}
        columns={[
          { key: "name", header: "Patient" },
          { key: "id", header: "ID" },
          { key: "age", header: "Age" },
          { key: "gender", header: "Gender" },
          { key: "phone", header: "Phone" },
          { key: "lastVisit", header: "Last Visit" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </AppShell>
  );
}
