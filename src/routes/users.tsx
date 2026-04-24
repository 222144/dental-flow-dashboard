import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable } from "@/components/data/DataTable";
import { users, type AppUser } from "@/data/mock";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User Management — DentalCare" },
      { name: "description", content: "Manage admins, doctors, and secretaries." },
    ],
  }),
  component: UsersPage,
});

const roleStyles: Record<AppUser["role"], string> = {
  Admin: "bg-action/15 text-action",
  Doctor: "bg-primary/15 text-primary",
  Secretary: "bg-secondary text-secondary-foreground",
};

function UsersPage() {
  return (
    <AppShell>
      <DataTable<AppUser>
        title="User Management"
        description="Manage system accounts and assign roles: Admin, Doctor, Secretary."
        addLabel="Add New User"
        data={users}
        searchKeys={["name", "email", "role"]}
        columns={[
          { key: "name", header: "Name" },
          { key: "email", header: "Email" },
          {
            key: "role",
            header: "Role",
            render: (r) => (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[r.role]}`}>
                {r.role}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  r.status === "Active" ? "text-success" : "text-action"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    r.status === "Active" ? "bg-success" : "bg-action"
                  }`}
                />
                {r.status}
              </span>
            ),
          },
          { key: "createdAt", header: "Created" },
        ]}
      />
    </AppShell>
  );
}
