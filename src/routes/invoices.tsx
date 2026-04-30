import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, DollarSign, Loader2, Search, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type DbError = { message: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: DbError | null }>;
type DbQuery<T = unknown> = QueryResult<T> & {
  select: <TResult = unknown>(columns?: string) => DbQuery<TResult>;
  order: (column: string, options?: { ascending: boolean }) => DbQuery<T>;
};
type DbClient = { from: (table: string) => DbQuery };

const db = supabase as unknown as DbClient;

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "إدارة الفواتير — عيادة الأسنان" },
      { name: "description", content: "عرض وإدارة فواتير المرضى." },
    ],
  }),
  component: InvoicesPage,
});

type InvoiceRow = {
  id: string;
  patient_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  payment_status: "paid" | "pending";
  payment_method: "cash" | "card";
  paid_at: string | null;
  due_date: string;
};

type PatientLite = { id: string; full_name: string; patient_number: string };

function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: inv, error: invErr }, { data: pat, error: patErr }] = await Promise.all([
        db
          .from("patient_invoices")
          .select(
            "id, patient_id, invoice_number, amount, currency, payment_status, payment_method, paid_at, due_date",
          )
          .order("created_at", { ascending: false }),
        db.from("patients").select("id, full_name, patient_number"),
      ]);
      if (invErr || patErr) toast.error("تعذر تحميل الفواتير");
      setInvoices((inv ?? []) as InvoiceRow[]);
      setPatients((pat ?? []) as PatientLite[]);
      setLoading(false);
    })();
  }, []);

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.payment_status !== statusFilter) return false;
      if (!q) return true;
      const patient = patientMap.get(inv.patient_id);
      return [inv.invoice_number, patient?.full_name, patient?.patient_number]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [invoices, query, statusFilter, patientMap]);

  const totalPaid = invoices
    .filter((i) => i.payment_status === "paid")
    .reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = invoices
    .filter((i) => i.payment_status === "pending")
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">إدارة الفواتير</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            جميع فواتير المرضى مع حالة الدفع وطريقة الدفع.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg shadow-[var(--shadow-card)]">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الفواتير
              </CardTitle>
              <CreditCard className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{invoices.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-[var(--shadow-card)]">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">المدفوع</CardTitle>
              <DollarSign className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${totalPaid.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-[var(--shadow-card)]">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">المعلق</CardTitle>
              <WalletCards className="h-5 w-5 text-action" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${totalPending.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث برقم الفاتورة أو اسم المريض…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "paid" | "pending")}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="all">كل الحالات</option>
              <option value="paid">مدفوعة</option>
              <option value="pending">معلقة</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 text-right text-xs font-semibold uppercase text-secondary-foreground">
                  <th className="px-5 py-3">رقم الفاتورة</th>
                  <th className="px-5 py-3">المريض</th>
                  <th className="px-5 py-3">المبلغ</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3">الطريقة</th>
                  <th className="px-5 py-3">تاريخ الاستحقاق</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" /> جاري التحميل…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      لا توجد فواتير.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => {
                    const patient = patientMap.get(inv.patient_id);
                    return (
                      <tr key={inv.id} className="border-t border-border hover:bg-accent/30">
                        <td className="px-5 py-4 font-semibold">{inv.invoice_number}</td>
                        <td className="px-5 py-4">
                          {patient ? (
                            <Link
                              to="/patients/$patientId"
                              params={{ patientId: patient.id }}
                              className="text-primary hover:underline"
                            >
                              {patient.full_name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-4">${Number(inv.amount).toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inv.payment_status === "paid" ? "bg-success/15 text-success" : "bg-action/15 text-action"}`}
                          >
                            {inv.payment_status === "paid" ? "مدفوعة" : "معلقة"}
                          </span>
                        </td>
                        <td className="px-5 py-4">{inv.payment_method === "cash" ? "Cash" : "بطاقة"}</td>
                        <td className="px-5 py-4">{inv.due_date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
