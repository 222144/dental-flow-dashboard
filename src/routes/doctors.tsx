import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "إدارة الأطباء — عيادة الأسنان" },
      { name: "description", content: "إدارة الأطباء، التخصصات، والجداول الأسبوعية." },
    ],
  }),
  component: DoctorsPage,
});

const DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

type Break = { start: string; end: string; label?: string };

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  working_days: string[];
  start_time: string;
  end_time: string;
  breaks: Break[];
  notes: string;
  status: string;
};

type FormState = Omit<Doctor, "id">;

const emptyForm: FormState = {
  name: "",
  specialty: "",
  phone: "",
  email: "",
  working_days: [],
  start_time: "09:00",
  end_time: "17:00",
  breaks: [],
  notes: "",
  status: "نشط",
};

function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Doctor | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setDoctors((data ?? []) as unknown as Doctor[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      specialty: d.specialty,
      phone: d.phone,
      email: d.email,
      working_days: d.working_days ?? [],
      start_time: (d.start_time ?? "09:00").slice(0, 5),
      end_time: (d.end_time ?? "17:00").slice(0, 5),
      breaks: (d.breaks ?? []) as Break[],
      notes: d.notes,
      status: d.status,
    });
    setOpen(true);
  };

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      working_days: f.working_days.includes(day)
        ? f.working_days.filter((d) => d !== day)
        : [...f.working_days, day],
    }));
  };

  const addBreak = () =>
    setForm((f) => ({ ...f, breaks: [...f.breaks, { start: "13:00", end: "14:00", label: "غداء" }] }));

  const updateBreak = (i: number, patch: Partial<Break>) =>
    setForm((f) => ({
      ...f,
      breaks: f.breaks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    }));

  const removeBreak = (i: number) =>
    setForm((f) => ({ ...f, breaks: f.breaks.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("اسم الطبيب مطلوب");
      return;
    }
    if (form.start_time >= form.end_time) {
      toast.error("وقت البداية يجب أن يكون قبل وقت النهاية");
      return;
    }
    for (const b of form.breaks) {
      if (b.start >= b.end) {
        toast.error("فترة استراحة غير صحيحة");
        return;
      }
      if (b.start < form.start_time || b.end > form.end_time) {
        toast.error("الاستراحة يجب أن تكون داخل ساعات العمل");
        return;
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    const payload = { ...form, user_id: userData.user.id };

    if (editingId) {
      const { error } = await supabase.from("doctors").update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
      toast.success("تم تحديث الطبيب");
    } else {
      const { error } = await supabase.from("doctors").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("تمت إضافة الطبيب");
    }
    setOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("doctors").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else {
      toast.success("تم حذف الطبيب");
      load();
    }
    setDeleteId(null);
  };

  return (
    <AppShell>
      <section className="space-y-6" dir="rtl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">إدارة الأطباء</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ضبط ملفات الأطباء والتخصصات والجداول الأسبوعية وفترات الاستراحة.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-action)] px-5 py-3 text-sm font-semibold text-action-foreground shadow-md transition hover:brightness-105"
          >
            <Plus className="h-4 w-4" />
            إضافة طبيب
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 text-right text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
                  <th className="px-5 py-3">الاسم</th>
                  <th className="px-5 py-3">التخصص</th>
                  <th className="px-5 py-3">أيام العمل</th>
                  <th className="px-5 py-3">الساعات</th>
                  <th className="px-5 py-3">الاستراحات</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      جارٍ التحميل…
                    </td>
                  </tr>
                ) : doctors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      لا يوجد أطباء بعد. اضغط "إضافة طبيب" للبدء.
                    </td>
                  </tr>
                ) : (
                  doctors.map((d) => (
                    <tr key={d.id} className="border-t border-border transition hover:bg-accent/30">
                      <td className="px-5 py-4 font-medium">{d.name}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {d.specialty || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {d.working_days?.length ? d.working_days.join("، ") : "—"}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {d.start_time?.slice(0, 5)} - {d.end_time?.slice(0, 5)}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {d.breaks?.length
                          ? d.breaks
                              .map((b) => `${b.start}-${b.end}${b.label ? ` (${b.label})` : ""}`)
                              .join("، ")
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold">
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-left">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setViewing(d)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80"
                          >
                            <Eye className="h-3.5 w-3.5" /> عرض
                          </button>
                          <button
                            onClick={() => openEdit(d)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                          >
                            <Pencil className="h-3.5 w-3.5" /> تعديل
                          </button>
                          <button
                            onClick={() => setDeleteId(d.id)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-action px-3 py-1.5 text-xs font-semibold text-action-foreground hover:bg-action-hover"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>{editingId ? "تعديل طبيب" : "إضافة طبيب جديد"}</DialogTitle>
            <DialogDescription>
              أدخل بيانات الطبيب وحدد أيام العمل والساعات وفترات الاستراحة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم الطبيب *">
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="التخصص">
                <input
                  className={inputCls}
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                />
              </Field>
              <Field label="الهاتف">
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="البريد الإلكتروني">
                <input
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">أيام العمل</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const active = form.working_days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="بداية العمل">
                <input
                  type="time"
                  className={inputCls}
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </Field>
              <Field label="نهاية العمل">
                <input
                  type="time"
                  className={inputCls}
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">فترات الاستراحة</p>
                <button
                  type="button"
                  onClick={addBreak}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80"
                >
                  <Plus className="h-3.5 w-3.5" /> إضافة استراحة
                </button>
              </div>
              {form.breaks.length === 0 ? (
                <p className="text-xs text-muted-foreground">لا توجد فترات استراحة.</p>
              ) : (
                <div className="space-y-2">
                  {form.breaks.map((b, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2"
                    >
                      <input
                        type="time"
                        className={`${inputCls} w-28`}
                        value={b.start}
                        onChange={(e) => updateBreak(i, { start: e.target.value })}
                      />
                      <span className="text-xs text-muted-foreground">إلى</span>
                      <input
                        type="time"
                        className={`${inputCls} w-28`}
                        value={b.end}
                        onChange={(e) => updateBreak(i, { end: e.target.value })}
                      />
                      <input
                        placeholder="وصف (اختياري)"
                        className={`${inputCls} flex-1`}
                        value={b.label ?? ""}
                        onChange={(e) => updateBreak(i, { label: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => removeBreak(i)}
                        className="rounded-md p-1.5 text-action hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Field label="ملاحظات">
              <textarea
                rows={2}
                className={inputCls}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-[image:var(--gradient-action)] px-4 py-2 text-sm font-semibold text-action-foreground hover:brightness-105"
            >
              {editingId ? "حفظ التعديلات" : "إضافة الطبيب"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>{viewing?.specialty || "بدون تخصص"}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <Row label="الهاتف" value={viewing.phone || "—"} />
              <Row label="البريد" value={viewing.email || "—"} />
              <Row
                label="أيام العمل"
                value={viewing.working_days?.length ? viewing.working_days.join("، ") : "—"}
              />
              <Row
                label="ساعات العمل"
                value={`${viewing.start_time?.slice(0, 5)} - ${viewing.end_time?.slice(0, 5)}`}
              />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">الاستراحات</p>
                {viewing.breaks?.length ? (
                  <ul className="mt-1 space-y-1">
                    {viewing.breaks.map((b, i) => (
                      <li key={i} className="rounded-md bg-muted px-2 py-1 text-xs">
                        {b.start} - {b.end} {b.label ? `· ${b.label}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs">—</p>
                )}
              </div>
              <Row label="الحالة" value={viewing.status} />
              {viewing.notes && <Row label="ملاحظات" value={viewing.notes} />}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="text-right sm:max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>سيتم حذف هذا الطبيب نهائياً.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <button
              onClick={() => setDeleteId(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-action px-4 py-2 text-sm font-semibold text-action-foreground hover:bg-action-hover"
            >
              حذف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
