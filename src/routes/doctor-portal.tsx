import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Clock,
  Coffee,
  FileText,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/doctor-portal")({
  head: () => ({
    meta: [
      { title: "بوابة الطبيب — عيادة الأسنان" },
      { name: "description", content: "عرض المرضى وملفاتهم الطبية ورسم الأسنان." },
    ],
  }),
  component: DoctorPortal,
});

type Break = { start: string; end: string; label?: string };
type DaySchedule = { start: string; end: string; breaks: Break[] };
type Schedule = Record<string, DaySchedule>;

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  schedule?: Schedule | null;
  working_days?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  breaks?: Break[] | null;
};

const DAYS_ORDER = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fmtDuration(mins: number): string {
  if (mins <= 0) return "0 س";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} س ${m} د`;
  if (h) return `${h} س`;
  return `${m} د`;
}

function normalizeSchedule(doctor: Doctor | null): Schedule {
  if (!doctor) return {};
  if (doctor.schedule && typeof doctor.schedule === "object" && Object.keys(doctor.schedule).length) {
    return doctor.schedule as Schedule;
  }
  const days = doctor.working_days ?? [];
  const start = doctor.start_time ?? "09:00";
  const end = doctor.end_time ?? "17:00";
  const breaks = doctor.breaks ?? [];
  const s: Schedule = {};
  for (const d of days) s[d] = { start, end, breaks };
  return s;
}

type PatientLite = {
  id: string;
  patient_number: string;
  full_name: string;
  age: number | null;
  gender: string;
  phone: string;
  last_visit: string;
  status: string;
  chronic_diseases: string;
};

type Patient = PatientLite & {
  address: string;
  notes: string;
};

type Appointment = {
  id: string;
  doctor_name: string;
  doctor_specialty: string;
  scheduled_at: string;
  status: string;
  diagnosis: string;
  notes: string;
};

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  payment_status: string;
  payment_method: string;
  paid_at: string | null;
  due_date: string;
  description: string;
};

type ToothRecord = {
  id: string;
  patient_id: string;
  tooth_number: number;
  condition: string;
  notes: string;
};

// FDI numbering: upper 18-11 / 21-28, lower 48-41 / 31-38
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const CONDITIONS = ["سليم", "تسوس", "حشوة", "تاج", "خلع", "علاج عصب", "تقويم"];

function DoctorPortal() {
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadInit() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("doctor-portal", {
      body: { action: "init" },
    });
    if (error) {
      toast.error("تعذر تحميل البيانات");
      setLoading(false);
      return;
    }
    setDoctor(data?.doctor ?? null);
    setPatients((data?.patients ?? []) as PatientLite[]);
    setLoading(false);
  }

  useEffect(() => {
    loadInit();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.patient_number.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q),
    );
  }, [patients, search]);

  if (selectedId) {
    return (
      <PatientDetail
        patientId={selectedId}
        onBack={() => setSelectedId(null)}
        doctorName={doctor?.name ?? "الطبيب"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">بوابة الطبيب</p>
              <p className="text-xs text-muted-foreground">
                {doctor ? `د. ${doctor.name}${doctor.specialty ? ` — ${doctor.specialty}` : ""}` : "—"}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={loadInit} className="h-10 gap-2">
            <RefreshCw className="h-4 w-4" /> طبيب آخر
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <DoctorScheduleCard doctor={doctor} />
        </aside>

        <Card className="rounded-lg shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-lg">قائمة المرضى</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الملف أو الهاتف…"
                className="pr-9"
              />
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل…
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد مرضى.</p>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelectedId(p.id)}
                      className="flex w-full items-center justify-between gap-4 py-3 text-right transition hover:bg-secondary/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.patient_number} · {p.age ?? "—"} سنة · {p.gender}
                          </p>
                        </div>
                      </div>
                      <div className="text-left text-xs text-muted-foreground">
                        <p>{p.phone || "—"}</p>
                        <p>آخر زيارة: {p.last_visit}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function PatientDetail({
  patientId,
  onBack,
  doctorName,
}: {
  patientId: string;
  onBack: () => void;
  doctorName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [editCondition, setEditCondition] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("doctor-portal", {
      body: { action: "patient", patient_id: patientId },
    });
    if (error) {
      toast.error("تعذر تحميل ملف المريض");
      setLoading(false);
      return;
    }
    setPatient(data?.patient ?? null);
    setAppointments(data?.appointments ?? []);
    setInvoices(data?.invoices ?? []);
    setTeeth(data?.teeth ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  function openTooth(num: number) {
    const existing = teeth.find((t) => t.tooth_number === num);
    setActiveTooth(num);
    setEditCondition(existing?.condition ?? "");
    setEditNotes(existing?.notes ?? "");
  }

  async function saveTooth() {
    if (activeTooth == null) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("doctor-portal", {
      body: {
        action: "save_tooth",
        patient_id: patientId,
        tooth_number: activeTooth,
        condition: editCondition,
        notes: editNotes,
      },
    });
    setSaving(false);
    if (error || data?.error) {
      toast.error("تعذر حفظ بيانات السن");
      return;
    }
    toast.success(`تم حفظ السن ${activeTooth}`);
    setTeeth((prev) => {
      const filtered = prev.filter((t) => t.tooth_number !== activeTooth);
      return [...filtered, data.tooth as ToothRecord];
    });
    setActiveTooth(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowRight className="h-4 w-4" /> العودة للقائمة
          </Button>
          <p className="text-sm text-muted-foreground">د. {doctorName}</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل…
          </div>
        ) : !patient ? (
          <p className="py-20 text-center text-muted-foreground">المريض غير موجود.</p>
        ) : (
          <>
            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{patient.full_name}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Info label="رقم الملف" value={patient.patient_number} />
                <Info label="العمر" value={patient.age ? `${patient.age} سنة` : "—"} />
                <Info label="الجنس" value={patient.gender || "—"} />
                <Info label="الهاتف" value={patient.phone || "—"} />
                <Info label="العنوان" value={patient.address || "—"} />
                <Info label="آخر زيارة" value={patient.last_visit || "—"} />
                <Info
                  label="أمراض مزمنة"
                  value={patient.chronic_diseases || "لا يوجد"}
                  className="sm:col-span-3"
                />
                {patient.notes && (
                  <Info label="ملاحظات الملف" value={patient.notes} className="sm:col-span-3" />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-lg">رسم الأسنان (Odontogram)</CardTitle>
                <p className="text-xs text-muted-foreground">
                  اضغط على أي سن لتسجيل حالته وملاحظاته. الأسنان الملونة تحتوي على بيانات مسجلة.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ToothRow numbers={UPPER_RIGHT} teeth={teeth} onClick={openTooth} />
                  <ToothRow numbers={UPPER_LEFT} teeth={teeth} onClick={openTooth} />
                  <div className="my-2 h-px bg-border" />
                  <ToothRow numbers={LOWER_RIGHT} teeth={teeth} onClick={openTooth} />
                  <ToothRow numbers={LOWER_LEFT} teeth={teeth} onClick={openTooth} />
                </div>

                {activeTooth != null && (
                  <div className="mt-6 space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">السن رقم {activeTooth}</p>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTooth(null)}>
                        إغلاق
                      </Button>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">الحالة</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {CONDITIONS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditCondition(c)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              editCondition === c
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:bg-secondary"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={editCondition}
                        onChange={(e) => setEditCondition(e.target.value)}
                        placeholder="أو اكتب حالة مخصصة…"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">ملاحظات</label>
                      <Textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="ماذا يحتوي هذا السن؟ تفاصيل العلاج، التشخيص…"
                        className="mt-1 min-h-24"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setActiveTooth(null)} disabled={saving}>
                        إلغاء
                      </Button>
                      <Button onClick={saveTooth} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <CalendarClock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">المواعيد والتشخيصات</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد مواعيد مسجلة.</p>
                ) : (
                  <ul className="space-y-3">
                    {appointments.map((a) => (
                      <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{a.doctor_name || "طبيب"}</span>
                          <span className="text-muted-foreground">
                            {new Date(a.scheduled_at).toLocaleString("ar")}
                          </span>
                        </div>
                        {a.diagnosis && (
                          <p className="mt-2">
                            <span className="font-semibold">التشخيص: </span>
                            {a.diagnosis}
                          </p>
                        )}
                        {a.notes && <p className="mt-1 text-muted-foreground">{a.notes}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <Receipt className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">الفواتير</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد فواتير.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {invoices.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <span className="font-mono text-xs">{inv.invoice_number}</span>
                        <span>{inv.description}</span>
                        <span className="font-semibold">
                          {inv.amount} {inv.currency}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            inv.payment_status === "paid"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          }`}
                        >
                          {inv.payment_status === "paid" ? "مدفوعة" : "غير مدفوعة"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function ToothRow({
  numbers,
  teeth,
  onClick,
}: {
  numbers: number[];
  teeth: ToothRecord[];
  onClick: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {numbers.map((n) => {
        const rec = teeth.find((t) => t.tooth_number === n);
        const hasData = !!rec && (rec.condition || rec.notes);
        return (
          <button
            key={n}
            onClick={() => onClick(n)}
            title={rec?.condition || `السن ${n}`}
            className={`flex h-14 w-12 flex-col items-center justify-center rounded-lg border-2 text-xs font-semibold transition hover:scale-105 ${
              hasData
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            <FileText className="h-3 w-3 opacity-60" />
            <span className="mt-1">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

function Info({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-border p-3 ${className}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function DoctorScheduleCard({ doctor }: { doctor: Doctor | null }) {
  const schedule = normalizeSchedule(doctor);
  const days = DAYS_ORDER.filter((d) => schedule[d]);

  const perDay = days.map((d) => {
    const ds = schedule[d];
    const work = Math.max(0, toMinutes(ds.end) - toMinutes(ds.start));
    const breakMins = (ds.breaks ?? []).reduce(
      (s, b) => s + Math.max(0, toMinutes(b.end) - toMinutes(b.start)),
      0,
    );
    return { day: d, ds, work, breakMins, net: Math.max(0, work - breakMins) };
  });

  const totalNet = perDay.reduce((s, d) => s + d.net, 0);
  const totalBreaks = perDay.reduce((s, d) => s + d.breakMins, 0);

  return (
    <Card className="rounded-lg shadow-[var(--shadow-card)]">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <CalendarClock className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">جدول العمل الأسبوعي</CardTitle>
      </CardHeader>
      <CardContent>
        {days.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا يوجد جدول عمل مسجل لهذا الطبيب.
          </p>
        ) : (
          <>
            <div className="mb-4 grid gap-3 grid-cols-1">
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">أيام العمل</p>
                <p className="mt-1 text-lg font-bold">{days.length} أيام</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">إجمالي ساعات العمل الفعلية</p>
                <p className="mt-1 text-lg font-bold">{fmtDuration(totalNet)}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground">إجمالي فترات الراحة</p>
                <p className="mt-1 text-lg font-bold">{fmtDuration(totalBreaks)}</p>
              </div>
            </div>

            <ul className="space-y-3">
              {perDay.map(({ day, ds, work, breakMins, net }) => (
                <li
                  key={day}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{day}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {ds.start} — {ds.end}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      عمل: <b className="text-foreground">{fmtDuration(work)}</b>
                      {" · "}راحة: <b className="text-foreground">{fmtDuration(breakMins)}</b>
                      {" · "}صافي: <b className="text-primary">{fmtDuration(net)}</b>
                    </span>
                  </div>
                  {ds.breaks && ds.breaks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ds.breaks.map((b, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs"
                        >
                          <Coffee className="h-3 w-3 text-amber-600" />
                          {b.label ? `${b.label}: ` : ""}
                          {b.start} — {b.end}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
