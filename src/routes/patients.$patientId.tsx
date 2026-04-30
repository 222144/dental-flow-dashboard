import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CreditCard, FileText, HeartPulse, Loader2, Stethoscope, UserRound } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type DbError = { message: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: DbError | null }>;
type DbQuery<T = unknown> = QueryResult<T> & {
  select: <TResult = unknown>(columns?: string) => DbQuery<TResult>;
  eq: (column: string, value: string) => DbQuery<T>;
  order: (column: string, options?: { ascending: boolean }) => DbQuery<T>;
  maybeSingle: () => DbQuery<T extends Array<infer Row> ? Row : T>;
};
type DbClient = { from: (table: string) => DbQuery };

const db = supabase as unknown as DbClient;

export const Route = createFileRoute("/patients/$patientId")({
  head: () => ({
    meta: [
      { title: "الملف الطبي — عيادة الأسنان" },
      { name: "description", content: "عرض ملف المريض الطبي والأمراض المزمنة والفواتير." },
    ],
  }),
  component: PatientDetail,
});

type PatientRow = {
  id: string;
  patient_number: string;
  full_name: string;
  age: number | null;
  gender: string;
  phone: string;
  address: string;
  chronic_diseases: string;
  notes: string;
  status: string;
  last_visit: string;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  currency: string;
  payment_status: "paid" | "pending";
  payment_method: "cash" | "card";
  paid_at: string | null;
  due_date: string;
};

function paymentStatusLabel(status: InvoiceRow["payment_status"]) {
  return status === "paid" ? "مدفوعة" : "غير مدفوعة بعد";
}

function paymentMethodLabel(method: InvoiceRow["payment_method"]) {
  return method === "cash" ? "Cash" : "بطاقة";
}

function PatientDetail() {
  const { patientId } = Route.useParams();
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMedicalFile, setShowMedicalFile] = useState(false);

  useEffect(() => {
    async function loadPatient() {
      setLoading(true);
      const [
        { data: patientData, error: patientError },
        { data: invoiceData, error: invoiceError },
      ] = await Promise.all([
        db
          .from("patients")
          .select(
            "id, patient_number, full_name, age, gender, phone, address, chronic_diseases, notes, status, last_visit",
          )
          .eq("id", patientId)
          .maybeSingle(),
        db
          .from("patient_invoices")
          .select(
            "id, invoice_number, description, amount, currency, payment_status, payment_method, paid_at, due_date",
          )
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ]);

      if (patientError || invoiceError) {
        toast.error("تعذر تحميل الملف الطبي");
        setLoading(false);
        return;
      }

      setPatient((patientData ?? null) as PatientRow | null);
      setInvoices((invoiceData ?? []) as InvoiceRow[]);
      setLoading(false);
    }

    loadPatient();
  }, [patientId]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" /> العودة إلى المرضى
        </Link>

        {loading ? (
          <Card className="rounded-lg p-10 text-center shadow-[var(--shadow-card)]">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جاري تحميل الملف الطبي…</p>
          </Card>
        ) : !patient ? (
          <Card className="rounded-lg p-10 text-center shadow-[var(--shadow-card)]">
            <h1 className="text-xl font-semibold">المريض غير موجود</h1>
            <Button asChild className="mt-4">
              <Link to="/patients">العودة إلى قائمة المرضى</Link>
            </Button>
          </Card>
        ) : (
          <>
            <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-2xl font-bold text-primary-foreground">
                  {patient.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-action">ملف طبي</p>
                  <h1 className="text-2xl font-semibold tracking-tight">{patient.full_name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {patient.patient_number} · {patient.age ?? "—"} سنة · {patient.gender} ·{" "}
                    {patient.phone || "بدون هاتف"}
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                {patient.status}
              </span>
            </section>

            <Button
              size="lg"
              onClick={() => setShowMedicalFile((v) => !v)}
              className="h-16 w-full bg-[image:var(--gradient-action)] text-lg font-bold text-action-foreground shadow-lg hover:brightness-105"
            >
              <Stethoscope className="h-6 w-6" />
              {showMedicalFile ? "إخفاء الملف الطبي" : "عرض الملف الطبي للمريض"}
            </Button>

            {showMedicalFile && (
              <>
                <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                  <Card className="rounded-lg shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <UserRound className="h-5 w-5 text-primary" /> معلومات المريض
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <InfoItem label="الاسم الكامل" value={patient.full_name} />
                      <InfoItem label="رقم الملف" value={patient.patient_number} />
                      <InfoItem label="العمر" value={patient.age ? `${patient.age} سنة` : "—"} />
                      <InfoItem label="النوع" value={patient.gender} />
                      <InfoItem label="الهاتف" value={patient.phone || "—"} />
                      <InfoItem label="آخر زيارة" value={patient.last_visit} />
                      <InfoItem
                        label="العنوان"
                        value={patient.address || "—"}
                        className="sm:col-span-2"
                      />
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg shadow-[var(--shadow-card)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <HeartPulse className="h-5 w-5 text-action" /> الأمراض المزمنة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="min-h-24 rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-7">
                        {patient.chronic_diseases || "لا توجد أمراض مزمنة مسجلة."}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-lg shadow-[var(--shadow-card)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary" /> ملاحظات الملف الطبي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="rounded-lg border border-border bg-background p-4 text-sm leading-7 text-muted-foreground">
                      {patient.notes || "لا توجد ملاحظات إضافية."}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-action" /> فواتير المريض
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-right text-xs font-semibold text-muted-foreground">
                      <th className="px-3 py-2">رقم الفاتورة</th>
                      <th className="px-3 py-2">الوصف</th>
                      <th className="px-3 py-2">المبلغ</th>
                      <th className="px-3 py-2">الحالة</th>
                      <th className="px-3 py-2">طريقة الدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                          لا توجد فواتير لهذا المريض.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b border-border/70">
                          <td className="px-3 py-3 font-medium">{invoice.invoice_number}</td>
                          <td className="px-3 py-3">{invoice.description}</td>
                          <td className="px-3 py-3">${Number(invoice.amount).toFixed(2)}</td>
                          <td className="px-3 py-3">
                            {paymentStatusLabel(invoice.payment_status)}
                          </td>
                          <td className="px-3 py-3">
                            {paymentMethodLabel(invoice.payment_method)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function InfoItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-secondary/30 p-4 ${className}`}>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}
