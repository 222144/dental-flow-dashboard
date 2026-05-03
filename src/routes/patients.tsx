import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  FilePlus2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
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
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type DbError = { message: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: DbError | null }>;
type DbQuery<T = unknown> = QueryResult<T> & {
  select: <TResult = unknown>(columns?: string) => DbQuery<TResult>;
  insert: (values: Record<string, unknown>) => DbQuery<T>;
  update: (values: Record<string, unknown>) => DbQuery<T>;
  delete: () => DbQuery<T>;
  eq: (column: string, value: string) => DbQuery<T>;
  order: (column: string, options?: { ascending: boolean }) => DbQuery<T>;
  single: () => DbQuery<T extends Array<infer Row> ? Row : T>;
};
type DbClient = { from: (table: string) => DbQuery };

const db = supabase as unknown as DbClient;

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [
      { title: "إدارة المرضى — عيادة الأسنان" },
      { name: "description", content: "إضافة المرضى وفتح ملفاتهم الطبية وإدارة فواتير فتح الملف." },
    ],
  }),
  component: PatientsPage,
});

type PatientRow = {
  id: string;
  patient_number: string;
  full_name: string;
  age: number | null;
  gender: string;
  phone: string;
  chronic_diseases: string;
  notes: string;
  status: string;
  last_visit: string;
};

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

type PatientForm = {
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  chronicDiseases: string;
  notes: string;
  payNow: "paid" | "pending";
  paymentMethod: "cash" | "card";
};

const emptyForm: PatientForm = {
  fullName: "",
  age: "",
  gender: "ذكر",
  phone: "",
  address: "",
  chronicDiseases: "",
  notes: "",
  payNow: "paid",
  paymentMethod: "cash",
};

function paymentStatusLabel(status: InvoiceRow["payment_status"]) {
  return status === "paid" ? "مدفوعة" : "لاحقًا";
}

function paymentMethodLabel(method: InvoiceRow["payment_method"]) {
  return method === "cash" ? "Cash" : "بطاقة";
}

function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPatient, setViewPatient] = useState<PatientRow | null>(null);
  const [showMedicalFile, setShowMedicalFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return patients;

    return patients.filter((patient) =>
      [patient.full_name, patient.patient_number, patient.phone, patient.chronic_diseases]
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery),
    );
  }, [patients, query]);

  const paidInvoices = invoices.filter((invoice) => invoice.payment_status === "paid");
  const pendingInvoices = invoices.filter((invoice) => invoice.payment_status === "pending");
  const totalPaid = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const invoiceByPatient = new Map(invoices.map((invoice) => [invoice.patient_id, invoice]));

  async function loadPatients() {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData.session?.user.id;

    if (!currentUserId) {
      setUserId(null);
      setPatients([]);
      setInvoices([]);
      setLoading(false);
      return;
    }

    setUserId(currentUserId);

    const [
      { data: patientsData, error: patientsError },
      { data: invoicesData, error: invoicesError },
    ] = await Promise.all([
      db
        .from("patients")
        .select(
          "id, patient_number, full_name, age, gender, phone, chronic_diseases, notes, status, last_visit",
        )
        .order("created_at", { ascending: false }),
      db
        .from("patient_invoices")
        .select(
          "id, patient_id, invoice_number, amount, currency, payment_status, payment_method, paid_at, due_date",
        )
        .order("created_at", { ascending: false }),
    ]);

    if (patientsError || invoicesError) {
      toast.error("تعذر تحميل بيانات المرضى والفواتير");
      setLoading(false);
      return;
    }

    setPatients((patientsData ?? []) as PatientRow[]);
    setInvoices((invoicesData ?? []) as InvoiceRow[]);
    setLoading(false);
  }

  async function handleAddPatient() {
    if (!userId) {
      toast.error("يرجى تسجيل الدخول أولًا");
      return;
    }

    const fullName = form.fullName.trim();
    const phone = form.phone.trim();
    const age = form.age.trim() ? Number(form.age) : null;

    if (!fullName) {
      toast.error("اسم المريض مطلوب");
      return;
    }

    if (
      fullName.length > 120 ||
      phone.length > 40 ||
      form.notes.length > 1000 ||
      form.chronicDiseases.length > 1000
    ) {
      toast.error("بعض البيانات أطول من المسموح");
      return;
    }

    if (age !== null && (!Number.isInteger(age) || age < 0 || age > 130)) {
      toast.error("العمر غير صحيح");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error: updateError } = await db
        .from("patients")
        .update({
          full_name: fullName,
          age,
          gender: form.gender,
          phone,
          address: form.address.trim(),
          chronic_diseases: form.chronicDiseases.trim(),
          notes: form.notes.trim(),
        })
        .eq("id", editingId);

      setSaving(false);

      if (updateError) {
        toast.error("تعذر تعديل بيانات المريض");
        return;
      }

      toast.success("تم تعديل بيانات المريض");
      setForm(emptyForm);
      setEditingId(null);
      setOpen(false);
      await loadPatients();
      return;
    }

    const patientNumber = `P-${Date.now().toString().slice(-6)}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const { data: patient, error: patientError } = await db
      .from("patients")
      .insert({
        user_id: userId,
        patient_number: patientNumber,
        full_name: fullName,
        age,
        gender: form.gender,
        phone,
        address: form.address.trim(),
        chronic_diseases: form.chronicDiseases.trim(),
        notes: form.notes.trim(),
        status: "نشط",
        last_visit: new Date().toISOString().slice(0, 10),
      })
      .select<{ id: string }>("id")
      .single();

    if (patientError || !patient) {
      setSaving(false);
      toast.error("تعذر إضافة المريض");
      return;
    }

    const { error: invoiceError } = await db.from("patient_invoices").insert({
      user_id: userId,
      patient_id: patient.id,
      invoice_number: invoiceNumber,
      amount: 10,
      currency: "USD",
      payment_status: form.payNow,
      payment_method: form.paymentMethod,
      paid_at: form.payNow === "paid" ? new Date().toISOString() : null,
      notes: form.payNow === "paid" ? "تم دفع رسوم فتح الملف" : "الدفع مؤجل",
    });

    setSaving(false);

    if (invoiceError) {
      toast.error("تمت إضافة المريض لكن تعذر إنشاء الفاتورة");
      await loadPatients();
      return;
    }

    toast.success("تمت إضافة المريض وفتح ملفه الطبي");
    setForm(emptyForm);
    setOpen(false);
    await loadPatients();
  }

  function handleEdit(patient: PatientRow) {
    setEditingId(patient.id);
    setForm({
      fullName: patient.full_name,
      age: patient.age?.toString() ?? "",
      gender: patient.gender,
      phone: patient.phone,
      address: "",
      chronicDiseases: patient.chronic_diseases,
      notes: patient.notes,
      payNow: "paid",
      paymentMethod: "cash",
    });
    setOpen(true);
  }

  function handleView(patient: PatientRow) {
    setViewPatient(patient);
    setShowMedicalFile(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSaving(true);
    const { error } = await db.from("patients").delete().eq("id", deleteId);
    setSaving(false);
    if (error) {
      toast.error("تعذر حذف المريض");
      return;
    }
    toast.success("تم حذف المريض");
    setDeleteId(null);
    await loadPatients();
  }

  async function handleSeedSamples() {
    if (!userId) {
      toast.error("يرجى تسجيل الدخول أولًا");
      return;
    }
    setSaving(true);

    const samples = [
      { full_name: "محمد علي حسن", age: 34, gender: "ذكر", phone: "0599123456", address: "غزة - الرمال", chronic_diseases: "ضغط الدم", notes: "حساسية من البنسلين", payNow: "paid", paymentMethod: "cash" },
      { full_name: "سارة أحمد خليل", age: 28, gender: "أنثى", phone: "0598765432", address: "رام الله", chronic_diseases: "لا يوجد", notes: "زيارة أولى", payNow: "paid", paymentMethod: "card" },
      { full_name: "خالد يوسف ناصر", age: 45, gender: "ذكر", phone: "0597111222", address: "نابلس", chronic_diseases: "سكري من النوع الثاني", notes: "يحتاج متابعة", payNow: "pending", paymentMethod: "cash" },
      { full_name: "ليلى سامي درويش", age: 22, gender: "أنثى", phone: "0596333444", address: "الخليل", chronic_diseases: "لا يوجد", notes: "تقويم أسنان", payNow: "paid", paymentMethod: "card" },
      { full_name: "أحمد عبد الله", age: 60, gender: "ذكر", phone: "0595555666", address: "القدس", chronic_diseases: "قلب، ضغط", notes: "حذر مع المخدر", payNow: "pending", paymentMethod: "cash" },
      { full_name: "نور حسام أبو زيد", age: 30, gender: "أنثى", phone: "0594777888", address: "بيت لحم", chronic_diseases: "حساسية موسمية", notes: "تنظيف دوري", payNow: "paid", paymentMethod: "cash" },
    ];

    let success = 0;
    for (const s of samples) {
      const stamp = Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
      const { data: patient, error: pErr } = await db
        .from("patients")
        .insert({
          user_id: userId,
          patient_number: `P-${stamp}`,
          full_name: s.full_name,
          age: s.age,
          gender: s.gender,
          phone: s.phone,
          address: s.address,
          chronic_diseases: s.chronic_diseases,
          notes: s.notes,
          status: "نشط",
          last_visit: new Date().toISOString().slice(0, 10),
        })
        .select<{ id: string }>("id")
        .single();
      if (pErr || !patient) continue;
      await db.from("patient_invoices").insert({
        user_id: userId,
        patient_id: patient.id,
        invoice_number: `INV-${stamp}`,
        amount: 10,
        currency: "USD",
        payment_status: s.payNow,
        payment_method: s.paymentMethod,
        paid_at: s.payNow === "paid" ? new Date().toISOString() : null,
        notes: s.payNow === "paid" ? "تم دفع رسوم فتح الملف" : "الدفع مؤجل",
      });
      success++;
    }

    setSaving(false);
    toast.success(`تمت إضافة ${success} مريض وهمي`);
    await loadPatients();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">إدارة المرضى</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              أضف المريض، افتح ملفه الطبي، وسجل فاتورة فتح الملف بقيمة 10 دولار.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleSeedSamples}
              disabled={saving}
              className="h-11"
            >
              <Sparkles className="h-4 w-4" /> إضافة مرضى وهميين
            </Button>
            <Button
              onClick={() => setOpen(true)}
              className="h-11 bg-[image:var(--gradient-action)] text-action-foreground hover:brightness-105"
            >
              <Plus className="h-4 w-4" /> إضافة مريض
            </Button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-1">
          <Card className="rounded-lg shadow-[var(--shadow-card)]">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                إجمالي المرضى
              </CardTitle>
              <FilePlus2 className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{patients.length}</p>
            </CardContent>
          </Card>
        </div>

        {!userId && !loading ? (
          <Card className="rounded-lg p-8 text-center shadow-[var(--shadow-card)]">
            <p className="font-semibold">يجب تسجيل الدخول لإدارة المرضى.</p>
            <Link
              to="/login"
              className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              الذهاب لتسجيل الدخول
            </Link>
          </Card>
        ) : (
          <Card className="rounded-lg shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث بالاسم أو الهاتف أو المرض المزمن…"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/60 text-right text-xs font-semibold uppercase text-secondary-foreground">
                    <th className="px-5 py-3">اسم المريض</th>
                    <th className="px-5 py-3">الرقم</th>
                    <th className="px-5 py-3">الهاتف</th>
                    <th className="px-5 py-3">أمراض مزمنة</th>
                    <th className="px-5 py-3">فاتورة 10$</th>
                    <th className="px-5 py-3">طريقة الدفع</th>
                    <th className="px-5 py-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" /> جاري التحميل…
                      </td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                        لا توجد سجلات مرضى.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => {
                      const invoice = invoiceByPatient.get(patient.id);
                      return (
                        <tr
                          key={patient.id}
                          className="border-t border-border transition hover:bg-accent/30"
                        >
                          <td className="px-5 py-4 font-semibold text-primary">
                            {patient.full_name}
                          </td>
                          <td className="px-5 py-4">{patient.patient_number}</td>
                          <td className="px-5 py-4">{patient.phone || "—"}</td>
                          <td className="max-w-[240px] px-5 py-4 text-muted-foreground">
                            <span className="line-clamp-2">
                              {patient.chronic_diseases || "لا يوجد"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${invoice?.payment_status === "paid" ? "bg-success/15 text-success" : "bg-action/15 text-action"}`}
                            >
                              {invoice ? paymentStatusLabel(invoice.payment_status) : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {invoice ? paymentMethodLabel(invoice.payment_method) : "—"}
                          </td>
                          <td className="px-5 py-4 text-left">
                            <div className="flex justify-end gap-2">
                              <Button variant="secondary" size="sm" onClick={() => handleView(patient)}>
                                <Eye className="h-4 w-4" /> عرض
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(patient)}>
                                <Pencil className="h-4 w-4" /> تعديل
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => setDeleteId(patient.id)}>
                                <Trash2 className="h-4 w-4" /> حذف
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto text-right sm:max-w-3xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>إضافة مريض جديد</DialogTitle>
            <DialogDescription>
              سيتم فتح ملف طبي للمريض وإنشاء فاتورة أولية بقيمة 10 دولار.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full-name">اسم المريض</Label>
              <Input
                id="full-name"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">الهاتف</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">العمر</Label>
              <Input
                id="age"
                type="number"
                min={0}
                max={130}
                value={form.age}
                onChange={(event) => setForm({ ...form, age: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select
                value={form.gender}
                onValueChange={(value) => setForm({ ...form, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ذكر">ذكر</SelectItem>
                  <SelectItem value="أنثى">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                maxLength={180}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="diseases">الأمراض المزمنة</Label>
              <Textarea
                id="diseases"
                value={form.chronicDiseases}
                onChange={(event) => setForm({ ...form, chronicDiseases: event.target.value })}
                placeholder="مثال: سكري، ضغط، حساسية من البنسلين…"
                maxLength={1000}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                maxLength={1000}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="mb-4 font-semibold">فاتورة فتح الملف: 10 دولار</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>هل سيدفع الآن؟</Label>
                <Select
                  value={form.payNow}
                  onValueChange={(value: "paid" | "pending") => setForm({ ...form, payNow: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">يدفع الآن</SelectItem>
                    <SelectItem value="pending">في وقت لاحق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(value: "cash" | "card") =>
                    setForm({ ...form, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">بطاقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start sm:space-x-0">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddPatient}
              disabled={saving}
              className="bg-[image:var(--gradient-action)] text-action-foreground hover:brightness-105"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} تمت الإضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
