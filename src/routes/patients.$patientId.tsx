import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { patients, medicalRecords, type MedicalRecord } from "@/data/mock";
import { ArrowRight, FileText, Plus } from "lucide-react";

export const Route = createFileRoute("/patients/$patientId")({
  loader: ({ params }) => {
    const patient = patients.find((p) => p.id === params.patientId);
    if (!patient) throw notFound();
    const records: MedicalRecord[] = medicalRecords[patient.id] ?? [];
    return { patient, records };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.patient.name ?? "مريض"} — السجل الطبي` },
      { name: "description", content: "السجل الطبي للمريض، التشخيصات وخطط العلاج." },
    ],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h2 className="text-xl font-semibold">المريض غير موجود</h2>
        <Link to="/patients" className="mt-4 inline-block text-primary hover:underline">
          العودة إلى قائمة المرضى
        </Link>
      </div>
    </AppShell>
  ),
  component: PatientDetail,
});

function PatientDetail() {
  const { patient, records } = Route.useLoaderData();

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" /> العودة إلى المرضى
        </Link>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-2xl font-bold text-primary-foreground">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{patient.name}</h1>
              <p className="text-sm text-muted-foreground">
                {patient.id} · {patient.age} سنة · {patient.gender} · {patient.phone}
              </p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-action)] px-5 py-3 text-sm font-semibold text-action-foreground shadow-md hover:brightness-105">
            <Plus className="h-4 w-4" /> إضافة سجل
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">السجل الطبي وخطط العلاج</h2>
          </div>
          {records.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              لا توجد سجلات طبية لهذا المريض حتى الآن.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {records.map((r) => (
                <li key={r.id} className="grid gap-2 px-6 py-5 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">التاريخ</p>
                    <p className="text-sm font-medium">{r.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">التشخيص</p>
                    <p className="text-sm font-medium">{r.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">العلاج</p>
                    <p className="text-sm">{r.treatment}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">الطبيب</p>
                    <p className="text-sm">{r.doctor}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
