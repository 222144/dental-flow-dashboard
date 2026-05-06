import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  DollarSign,
  Eye,
  Loader2,
  Receipt,
  Search,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DbError = { message: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: DbError | null }>;
type DbQuery<T = unknown> = QueryResult<T> & {
  select: <TResult = unknown>(columns?: string) => DbQuery<TResult>;
  insert: (values: Record<string, unknown> | Record<string, unknown>[]) => DbQuery<T>;
  update: (values: Record<string, unknown>) => DbQuery<T>;
  eq: (column: string, value: unknown) => DbQuery<T>;
  order: (column: string, options?: { ascending: boolean }) => DbQuery<T>;
};
type DbClient = { from: (table: string) => DbQuery };
const db = supabase as unknown as DbClient;

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "إدارة الفواتير — عيادة الأسنان" },
      { name: "description", content: "عرض جميع فواتير المرضى وحالات الدفع وطرق السداد." },
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
  description: string;
  created_at: string;
};

type PatientRow = {
  id: string;
  full_name: string;
  patient_number: string;
  phone: string;
};

type StatusFilter = "all" | "paid" | "pending";
type MethodFilter = "all" | "cash" | "card";

const sampleSeed: Array<{
  full_name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  chronic_diseases: string;
  notes: string;
  status: "paid" | "pending";
  method: "cash" | "card";
  amount: number;
  description: string;
}> = [
  {
    full_name: "أحمد محمد العلي",
    age: 32,
    gender: "ذكر",
    phone: "0599123456",
    address: "رام الله",
    chronic_diseases: "لا يوجد",
    notes: "حساسية من البنسلين",
    status: "paid",
    method: "cash",
    amount: 10,
    description: "رسوم فتح ملف مريض",
  },
  {
    full_name: "ليلى خالد سمير",
    age: 27,
    gender: "أنثى",
    phone: "0598765432",
    address: "نابلس",
    chronic_diseases: "لا يوجد",
    notes: "",
    status: "paid",
    method: "card",
    amount: 10,
    description: "رسوم فتح ملف مريض",
  },
  {
    full_name: "محمود يوسف",
    age: 45,
    gender: "ذكر",
    phone: "0597111222",
    address: "الخليل",
    chronic_diseases: "ضغط الدم",
    notes: "يأخذ أدوية يومية",
    status: "pending",
    method: "cash",
    amount: 10,
    description: "رسوم فتح ملف مريض",
  },
  {
    full_name: "سارة عبد الله",
    age: 19,
    gender: "أنثى",
    phone: "0596333444",
    address: "بيت لحم",
    chronic_diseases: "لا يوجد",
    notes: "",
    status: "paid",
    method: "card",
    amount: 10,
    description: "رسوم فتح ملف مريض",
  },
  {
    full_name: "خالد إبراهيم",
    age: 54,
    gender: "ذكر",
    phone: "0595555666",
    address: "جنين",
    chronic_diseases: "السكري",
    notes: "متابعة دورية",
    status: "pending",
    method: "card",
    amount: 10,
    description: "رسوم فتح ملف مريض",
  },
  {
    full_name: "نور حسن",
    age: 22,
    gender: "أنثى",
    phone: "0594777888",
    address: "طولكرم",
    chronic_diseases: "لا يوجد",
    notes: "",
    status: "paid",
    method: "cash",
    amount: 10,
    description: "رسوم فتح ملف مريض",
  },
];

function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmInvoice, setConfirmInvoice] = useState<InvoiceRow | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData.session?.user.id ?? null;
    setUserId(currentUserId);

    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const [{ data: invoicesData, error: invErr }, { data: patientsData, error: patErr }] =
      await Promise.all([
        db
          .from("patient_invoices")
          .select(
            "id, patient_id, invoice_number, amount, currency, payment_status, payment_method, paid_at, due_date, description, created_at",
          )
          .order("created_at", { ascending: false }),
        db.from("patients").select("id, full_name, patient_number, phone"),
      ]);

    if (invErr || patErr) {
      toast.error("تعذر تحميل الفواتير");
      setLoading(false);
      return;
    }

    setInvoices((invoicesData ?? []) as InvoiceRow[]);
    setPatients((patientsData ?? []) as PatientRow[]);
    setLoading(false);
  }

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.payment_status !== statusFilter) return false;
      if (methodFilter !== "all" && inv.payment_method !== methodFilter) return false;
      if (!q) return true;
      const patient = patientMap.get(inv.patient_id);
      return [inv.invoice_number, patient?.full_name, patient?.patient_number, patient?.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [invoices, query, statusFilter, methodFilter, patientMap]);

  const totalAmount = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidAmount = invoices
    .filter((i) => i.payment_status === "paid")
    .reduce((s, i) => s + Number(i.amount), 0);
  const pendingAmount = totalAmount - paidAmount;

  async function handleSeed() {
    if (!userId) {
      toast.error("يرجى تسجيل الدخول أولًا");
      return;
    }
    setSeeding(true);

    try {
      const baseNumber = Date.now();
      for (let i = 0; i < sampleSeed.length; i++) {
        const s = sampleSeed[i];
        const patientNumber = `P-${baseNumber}-${i + 1}`;
        const { data: inserted, error: pErr } = await (db
          .from("patients")
          .insert({
            user_id: userId,
            patient_number: patientNumber,
            full_name: s.full_name,
            age: s.age,
            gender: s.gender,
            phone: s.phone,
            address: s.address,
            chronic_diseases: s.chronic_diseases,
            notes: s.notes,
          })
          .select("id")
          .order("created_at", { ascending: false }) as unknown as PromiseLike<{
          data: { id: string }[] | null;
          error: DbError | null;
        }>);

        if (pErr || !inserted || !inserted[0]) continue;
        const patientId = inserted[0].id;

        await db.from("patient_invoices").insert({
          user_id: userId,
          patient_id: patientId,
          invoice_number: `INV-${baseNumber}-${i + 1}`,
          amount: s.amount,
          currency: "USD",
          payment_status: s.status,
          payment_method: s.method,
          paid_at: s.status === "paid" ? new Date().toISOString() : null,
          description: s.description,
        });
      }

      toast.success("تمت إضافة فواتير وهمية بنجاح");
      await loadData();
    } catch {
      toast.error("تعذر إنشاء الفواتير الوهمية");
    } finally {
      setSeeding(false);
    }
  }

  async function markAsPaid(invoice: InvoiceRow) {
    setUpdatingId(invoice.id);
    const { error } = await db
      .from("patient_invoices")
      .update({ payment_status: "paid", paid_at: new Date().toISOString() })
      .eq("id", invoice.id);
    setUpdatingId(null);

    if (error) {
      toast.error("تعذر تحديث الفاتورة");
      return;
    }

    toast.success("تم تحديد الفاتورة كمدفوعة");
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoice.id
          ? { ...i, payment_status: "paid", paid_at: new Date().toISOString() }
          : i,
      ),
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-md">
              <Receipt className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">إدارة الفواتير</h1>
              <p className="text-sm text-muted-foreground">
                عرض وإدارة جميع فواتير المرضى وحالات الدفع
              </p>
            </div>
          </div>
          <Button onClick={handleSeed} disabled={seeding || !userId} variant="outline">
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            إضافة فواتير وهمية
          </Button>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي الفواتير
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{invoices.length} فاتورة</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">المدفوع</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">${paidAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {invoices.filter((i) => i.payment_status === "paid").length} فاتورة مدفوعة
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">معلقة</CardTitle>
              <WalletCards className="h-4 w-4 text-action" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-action">${pendingAmount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                {invoices.filter((i) => i.payment_status === "pending").length} فاتورة معلقة
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>قائمة الفواتير</CardTitle>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث برقم الفاتورة أو اسم المريض…"
                    className="h-10 w-full pr-10 md:w-72"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="h-10 w-full md:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="paid">مدفوعة</SelectItem>
                    <SelectItem value="pending">معلقة</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as MethodFilter)}>
                  <SelectTrigger className="h-10 w-full md:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الطرق</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">بطاقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !userId ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                يرجى تسجيل الدخول لعرض الفواتير.
              </p>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">لا توجد فواتير لعرضها</p>
                <Button onClick={handleSeed} disabled={seeding} size="sm" variant="outline">
                  <Sparkles className="h-4 w-4" />
                  إضافة فواتير وهمية
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium">رقم الفاتورة</th>
                      <th className="px-3 py-3 font-medium">المريض</th>
                      <th className="px-3 py-3 font-medium">المبلغ</th>
                      <th className="px-3 py-3 font-medium">طريقة الدفع</th>
                      <th className="px-3 py-3 font-medium">الحالة</th>
                      <th className="px-3 py-3 font-medium">التاريخ</th>
                      <th className="px-3 py-3 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => {
                      const patient = patientMap.get(inv.patient_id);
                      return (
                        <tr key={inv.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-3 font-mono text-xs">{inv.invoice_number}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium">{patient?.full_name ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">
                              {patient?.patient_number ?? ""}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-semibold">
                            ${Number(inv.amount).toFixed(2)}
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 text-xs">
                              <CreditCard className="h-3 w-3" />
                              {inv.payment_method === "cash" ? "Cash" : "بطاقة"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                                inv.payment_status === "paid"
                                  ? "bg-success/15 text-success"
                                  : "bg-action/15 text-action"
                              }`}
                            >
                              {inv.payment_status === "paid" ? "مدفوعة" : "معلقة"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {new Date(inv.created_at).toLocaleDateString("ar-EG")}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {inv.payment_status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingId === inv.id}
                                  onClick={() => setConfirmInvoice(inv)}
                                >
                                  {updatingId === inv.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}
                                  تحديد كمدفوعة
                                </Button>
                              )}
                              {patient && (
                                <Button asChild size="sm" variant="ghost">
                                  <Link
                                    to="/patients/$patientId"
                                    params={{ patientId: patient.id }}
                                  >
                                    <Eye className="h-3 w-3" />
                                    عرض
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog
        open={Boolean(confirmInvoice)}
        onOpenChange={(open) => !open && setConfirmInvoice(null)}
      >
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد دفع الفاتورة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تحديد الفاتورة{" "}
              <span className="font-mono font-semibold">
                {confirmInvoice?.invoice_number}
              </span>{" "}
              بمبلغ{" "}
              <span className="font-semibold">
                ${Number(confirmInvoice?.amount ?? 0).toFixed(2)}
              </span>{" "}
              كمدفوعة؟ لا يمكن التراجع عن هذا الإجراء بسهولة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start sm:space-x-0">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmInvoice) {
                  const inv = confirmInvoice;
                  setConfirmInvoice(null);
                  void markAsPaid(inv);
                }
              }}
            >
              تأكيد الدفع
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
