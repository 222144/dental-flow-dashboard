import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, CalendarClock, FileText, LogOut, Receipt, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "ملفي الطبي — عيادة الأسنان" },
      { name: "description", content: "ملفك الطبي ومواعيدك وفواتيرك في مكان واحد." },
    ],
  }),
  component: PortalPage,
});

type Patient = {
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

type Appointment = {
  id: string;
  doctor_name: string;
  doctor_specialty: string;
  scheduled_at: string;
  status: string;
  diagnosis: string;
  notes: string;
};

function PortalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/login" });
        return;
      }
      setEmail(sess.session.user.email ?? "");

      const { data: p } = await supabase
        .from("patients")
        .select("*")
        .eq("account_user_id", sess.session.user.id)
        .maybeSingle();

      if (!p) {
        setLoading(false);
        return;
      }
      setPatient(p as Patient);

      const [{ data: inv }, { data: appts }] = await Promise.all([
        supabase
          .from("patient_invoices")
          .select("*")
          .eq("patient_id", (p as Patient).id)
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", (p as Patient).id)
          .order("scheduled_at", { ascending: true }),
      ]);
      setInvoices((inv ?? []) as Invoice[]);
      setAppointments((appts ?? []) as Appointment[]);
      setLoading(false);
    })();
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/login" });
  }

  const upcoming = appointments.filter((a) => new Date(a.scheduled_at) >= new Date());
  const past = appointments.filter((a) => new Date(a.scheduled_at) < new Date());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">بوابة المريض</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="h-10">
            <LogOut className="h-4 w-4" /> خروج
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {loading ? (
          <p className="text-center text-muted-foreground">جاري التحميل…</p>
        ) : !patient ? (
          <Card className="p-8 text-center">
            <p className="font-semibold">لم يتم ربط حسابك بملف طبي بعد.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              يرجى التواصل مع العيادة لربط ملفك بهذا الحساب.
            </p>
            <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </Card>
        ) : (
          <>
            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">بياناتي الشخصية</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Info label="الاسم" value={patient.full_name} />
                <Info label="رقم الملف" value={patient.patient_number} />
                <Info label="العمر" value={patient.age ? `${patient.age} سنة` : "—"} />
                <Info label="الجنس" value={patient.gender || "—"} />
                <Info label="الهاتف" value={patient.phone || "—"} />
                <Info label="العنوان" value={patient.address || "—"} />
                <Info label="أمراض مزمنة" value={patient.chronic_diseases || "لا يوجد"} />
                <Info label="آخر زيارة" value={patient.last_visit || "—"} />
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <CalendarClock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">المواعيد القادمة</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد مواعيد قادمة.</p>
                ) : (
                  <ul className="space-y-3">
                    {upcoming.map((a) => (
                      <li key={a.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-semibold">
                            <Stethoscope className="h-4 w-4 text-primary" />
                            {a.doctor_name || "طبيب"}{" "}
                            {a.doctor_specialty && (
                              <span className="text-xs text-muted-foreground">— {a.doctor_specialty}</span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(a.scheduled_at).toLocaleString("ar")}
                          </span>
                        </div>
                        {a.notes && <p className="mt-2 text-sm text-muted-foreground">{a.notes}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">السجل الطبي والتشخيصات</CardTitle>
              </CardHeader>
              <CardContent>
                {patient.notes && (
                  <div className="mb-4 rounded-lg bg-secondary/40 p-3 text-sm">
                    <p className="mb-1 font-semibold">ملاحظات الطبيب على الملف</p>
                    <p className="text-muted-foreground">{patient.notes}</p>
                  </div>
                )}
                {past.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد زيارات سابقة مسجلة.</p>
                ) : (
                  <ul className="space-y-3">
                    {past.map((a) => (
                      <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{a.doctor_name || "طبيب"}</span>
                          <span className="text-muted-foreground">
                            {new Date(a.scheduled_at).toLocaleDateString("ar")}
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
                <CardTitle className="text-lg">فواتيري</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد فواتير.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/60 text-right text-xs font-semibold uppercase text-secondary-foreground">
                          <th className="px-3 py-2">رقم الفاتورة</th>
                          <th className="px-3 py-2">المبلغ</th>
                          <th className="px-3 py-2">الحالة</th>
                          <th className="px-3 py-2">طريقة الدفع</th>
                          <th className="px-3 py-2">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="border-t border-border">
                            <td className="px-3 py-2 font-mono">{inv.invoice_number}</td>
                            <td className="px-3 py-2">
                              {inv.amount} {inv.currency}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                                  inv.payment_status === "paid"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {inv.payment_status === "paid" ? "مدفوعة" : "غير مدفوعة"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {inv.payment_status === "paid"
                                ? inv.payment_method === "cash"
                                  ? "Cash"
                                  : "بطاقة"
                                : "—"}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {inv.paid_at
                                ? new Date(inv.paid_at).toLocaleDateString("ar")
                                : new Date(inv.due_date).toLocaleDateString("ar")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
