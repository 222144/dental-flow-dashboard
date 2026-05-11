import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, X, ChevronDown, ChevronUp } from "lucide-react";
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
type DaySchedule = { start: string; end: string; breaks: Break[] };
type Schedule = Record<string, DaySchedule>;

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  schedule: Schedule;
  notes: string;
  status: string;
};

type FormState = Omit<Doctor, "id">;

const defaultDay = (): DaySchedule => ({ start: "09:00", end: "17:00", breaks: [] });

const emptyForm: FormState = {
  name: "",
  specialty: "",
  phone: "",
  email: "",
  schedule: {},
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
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else {
      const mapped = (data ?? []).map((d: any) => ({
        ...d,
        schedule: normalizeSchedule(d),
      })) as Doctor[];
      setDoctors(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setExpandedDay(null);
    setOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      specialty: d.specialty,
      phone: d.phone,
      email: d.email,
      schedule: d.schedule ?? {},
      notes: d.notes,
      status: d.status,
    });
    setExpandedDay(null);
    setOpen(true);
  };

  const toggleDay = (day: string) => {
    setForm((f) => {
      const next = { ...f.schedule };
      if (next[day]) {
        delete next[day];
        if (expandedDay === day) setExpandedDay(null);
      } else {
        next[day] = defaultDay();
        setExpandedDay(day);
      }
      return { ...f, schedule: next };
    });
  };

  const updateDay = (day: string, patch: Partial<DaySchedule>) =>
    setForm((f) => ({
      ...f,
      schedule: { ...f.schedule, [day]: { ...f.schedule[day], ...patch } },
    }));

  const addBreak = (day: string) =>
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          breaks: [...(f.schedule[day].breaks ?? []), { start: "13:00", end: "14:00", label: "غداء" }],
        },
      },
    }));

  const updateBreak = (day: string, i: number, patch: Partial<Break>) =>
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          breaks: f.schedule[day].breaks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
        },
      },
    }));

  const removeBreak = (day: string, i: number) =>
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          breaks: f.schedule[day].breaks.filter((_, idx) => idx !== i),
        },
      },
    }));

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("اسم الطبيب مطلوب");
      return;
    }
    const days = Object.keys(form.schedule);
    if (days.length === 0) {
      toast.error("اختر يوم عمل واحد على الأقل");
      return;
    }
    for (const day of days) {
      const ds = form.schedule[day];
      if (ds.start >= ds.end) {
        toast.error(`وقت العمل ليوم ${day} غير صحيح`);
        return;
      }
      for (const b of ds.breaks) {
        if (b.start >= b.end) {
          toast.error(`فترة استراحة غير صحيحة في ${day}`);
          return;
        }
        if (b.start < ds.start || b.end > ds.end) {
          toast.error(`الاستراحة في ${day} يجب أن تكون داخل ساعات العمل`);
          return;
        }
      }
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    // Keep legacy columns in sync (for compatibility with any existing reads)
    const firstDay = form.schedule[days[0]];
    const payload: any = {
      name: form.name,
      specialty: form.specialty,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
      status: form.status,
      schedule: form.schedule,
      working_days: days,
      start_time: firstDay.start,
      end_time: firstDay.end,
      breaks: firstDay.breaks,
      user_id: userData.user.id,
    };

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
              ضبط ملفات الأطباء والتخصصات والجداول الأسبوعية وفترات الاستراحة لكل يوم.
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
                  <th className="px-5 py-3">الجدول الأسبوعي</th>
                  <th className="px-5 py-3">الحالة</th>
                  <th className="px-5 py-3 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      جارٍ التحميل…
                    </td>
                  </tr>
                ) : doctors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      لا يوجد أطباء بعد. اضغط "إضافة طبيب" للبدء.
                    </td>
                  </tr>
                ) : (
                  doctors.map((d) => {
                    const days = Object.keys(d.schedule ?? {});
                    return (
                      <tr key={d.id} className="border-t border-border transition hover:bg-accent/30 align-top">
                        <td className="px-5 py-4 font-medium">{d.name}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            {d.specialty || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {days.length === 0 ? (
                            "—"
                          ) : (
                            <ul className="space-y-1">
                              {days.map((day) => {
                                const s = d.schedule[day];
                                return (
                                  <li key={day}>
                                    <span className="font-semibold">{day}:</span> {s.start}-{s.end}
                                    {s.breaks?.length ? (
                                      <span className="text-muted-foreground">
                                        {" "}
                                        · استراحات:{" "}
                                        {s.breaks.map((b) => `${b.start}-${b.end}`).join("، ")}
                                      </span>
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
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
                    );
                  })
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
              فعّل أيام العمل، ولكل يوم حدّد ساعاته وفترات استراحته الخاصة.
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
              <p className="mb-2 text-sm font-semibold">الجدول الأسبوعي</p>
              <p className="mb-3 text-xs text-muted-foreground">
                اضغط على اليوم لتفعيله، ثم وسّعه لضبط ساعاته واستراحاته.
              </p>
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const active = Boolean(form.schedule[day]);
                  const isOpen = expandedDay === day;
                  const ds = form.schedule[day];
                  return (
                    <div
                      key={day}
                      className={`rounded-lg border ${
                        active ? "border-primary/40 bg-primary/5" : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/70"
                          }`}
                        >
                          {day}
                        </button>
                        {active && (
                          <div className="flex flex-1 items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              {ds.start} - {ds.end}
                              {ds.breaks?.length ? ` · ${ds.breaks.length} استراحة` : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedDay(isOpen ? null : day)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold hover:bg-muted"
                            >
                              {isOpen ? (
                                <>
                                  إخفاء <ChevronUp className="h-3.5 w-3.5" />
                                </>
                              ) : (
                                <>
                                  ضبط <ChevronDown className="h-3.5 w-3.5" />
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {active && isOpen && (
                        <div className="space-y-3 border-t border-border/60 p-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="بداية العمل">
                              <input
                                type="time"
                                className={inputCls}
                                value={ds.start}
                                onChange={(e) => updateDay(day, { start: e.target.value })}
                              />
                            </Field>
                            <Field label="نهاية العمل">
                              <input
                                type="time"
                                className={inputCls}
                                value={ds.end}
                                onChange={(e) => updateDay(day, { end: e.target.value })}
                              />
                            </Field>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-semibold">فترات الاستراحة</p>
                              <button
                                type="button"
                                onClick={() => addBreak(day)}
                                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold hover:bg-secondary/80"
                              >
                                <Plus className="h-3.5 w-3.5" /> إضافة استراحة
                              </button>
                            </div>
                            {ds.breaks.length === 0 ? (
                              <p className="text-xs text-muted-foreground">لا توجد استراحات.</p>
                            ) : (
                              <div className="space-y-2">
                                {ds.breaks.map((b, i) => (
                                  <div
                                    key={i}
                                    className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background p-2"
                                  >
                                    <input
                                      type="time"
                                      className={`${inputCls} w-28`}
                                      value={b.start}
                                      onChange={(e) =>
                                        updateBreak(day, i, { start: e.target.value })
                                      }
                                    />
                                    <span className="text-xs text-muted-foreground">إلى</span>
                                    <input
                                      type="time"
                                      className={`${inputCls} w-28`}
                                      value={b.end}
                                      onChange={(e) =>
                                        updateBreak(day, i, { end: e.target.value })
                                      }
                                    />
                                    <input
                                      placeholder="وصف (اختياري)"
                                      className={`${inputCls} flex-1`}
                                      value={b.label ?? ""}
                                      onChange={(e) =>
                                        updateBreak(day, i, { label: e.target.value })
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeBreak(day, i)}
                                      className="rounded-md p-1.5 text-action hover:bg-muted"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
              <div>
                <p className="text-xs font-semibold text-muted-foreground">الجدول الأسبوعي</p>
                {Object.keys(viewing.schedule ?? {}).length === 0 ? (
                  <p className="mt-1 text-xs">—</p>
                ) : (
                  <ul className="mt-1 space-y-2">
                    {Object.entries(viewing.schedule).map(([day, s]) => (
                      <li key={day} className="rounded-md bg-muted px-2 py-2 text-xs">
                        <div className="font-semibold">{day}</div>
                        <div>
                          العمل: {s.start} - {s.end}
                        </div>
                        {s.breaks?.length ? (
                          <div className="mt-1">
                            الاستراحات:{" "}
                            {s.breaks
                              .map((b) => `${b.start}-${b.end}${b.label ? ` (${b.label})` : ""}`)
                              .join("، ")}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
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

function normalizeSchedule(d: any): Schedule {
  const sch = d?.schedule;
  if (sch && typeof sch === "object" && Object.keys(sch).length > 0) {
    const out: Schedule = {};
    for (const [k, v] of Object.entries(sch as Record<string, any>)) {
      out[k] = {
        start: (v?.start ?? "09:00").slice(0, 5),
        end: (v?.end ?? "17:00").slice(0, 5),
        breaks: Array.isArray(v?.breaks) ? v.breaks : [],
      };
    }
    return out;
  }
  // Fallback: build schedule from legacy columns
  const days: string[] = Array.isArray(d?.working_days) ? d.working_days : [];
  const start = (d?.start_time ?? "09:00").slice(0, 5);
  const end = (d?.end_time ?? "17:00").slice(0, 5);
  const breaks: Break[] = Array.isArray(d?.breaks) ? d.breaks : [];
  const out: Schedule = {};
  for (const day of days) out[day] = { start, end, breaks };
  return out;
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
