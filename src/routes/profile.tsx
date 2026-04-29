import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Mail, Save, ShieldCheck, UserCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي — عيادة الأسنان" },
      { name: "description", content: "تحديث اسم المستخدم والبريد الإلكتروني وكلمة المرور." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!active) return;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();

      if (active) {
        setUsername(profile?.username ?? user.user_metadata?.username ?? "");
        setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveProfile() {
    const cleanUsername = username.trim();

    if (!userId) {
      toast.error("يرجى تسجيل الدخول أولًا");
      return;
    }

    if (!cleanUsername) {
      toast.error("اسم المستخدم مطلوب");
      return;
    }

    if (cleanUsername.length > 80) {
      toast.error("اسم المستخدم طويل جدًا");
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, username: cleanUsername }, { onConflict: "user_id" });

    setSavingProfile(false);

    if (error) {
      toast.error("تعذر حفظ اسم المستخدم");
      return;
    }

    toast.success("تم حفظ اسم المستخدم");
  }

  async function handleSaveSecurity() {
    const cleanEmail = email.trim();
    const updates: { email?: string; password?: string } = {};

    if (!userId) {
      toast.error("يرجى تسجيل الدخول أولًا");
      return;
    }

    if (!cleanEmail) {
      toast.error("البريد الإلكتروني مطلوب");
      return;
    }

    if (password || confirmPassword) {
      if (password.length < 8) {
        toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("كلمتا المرور غير متطابقتين");
        return;
      }

      updates.password = password;
    }

    updates.email = cleanEmail;

    setSavingSecurity(true);
    const { error } = await supabase.auth.updateUser(updates);
    setSavingSecurity(false);

    if (error) {
      toast.error("تعذر تحديث بيانات الدخول");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    toast.success("تم تحديث بيانات الدخول");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-md">
              <UserCircle className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">الملف الشخصي</h1>
              <p className="text-sm text-muted-foreground">إدارة اسم المستخدم وبيانات الدخول الخاصة بك</p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
            <ShieldCheck className="h-4 w-4" />
            حساب آمن
          </div>
        </section>

        {!userId && !loading ? (
          <Card className="rounded-lg">
            <CardContent className="p-8 text-center">
              <p className="font-semibold">يجب تسجيل الدخول لعرض الملف الشخصي.</p>
              <p className="mt-2 text-sm text-muted-foreground">انتقل إلى صفحة تسجيل الدخول ثم عُد إلى هذه الصفحة.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <UserCircle className="h-6 w-6" />
                </div>
                <CardTitle>معلومات المستخدم</CardTitle>
                <CardDescription>تغيير الاسم الظاهر داخل لوحة التحكم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="اكتب اسم المستخدم"
                    className="h-11"
                    disabled={loading}
                    maxLength={80}
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={loading || savingProfile} className="h-11 w-full">
                  <Save className="h-4 w-4" />
                  حفظ اسم المستخدم
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-[var(--shadow-card)]">
              <CardHeader>
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-action/10 text-action">
                  <KeyRound className="h-6 w-6" />
                </div>
                <CardTitle>بيانات الدخول</CardTitle>
                <CardDescription>تحديث البريد الإلكتروني أو تعيين كلمة مرور جديدة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="profile-email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@clinic.com"
                      className="h-11 pr-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">كلمة مرور جديدة</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="••••••••"
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                  <p>عند تغيير البريد الإلكتروني قد تحتاج إلى تأكيده من رسالة التحقق.</p>
                </div>

                <Button onClick={handleSaveSecurity} disabled={loading || savingSecurity} className="h-11 w-full">
                  <KeyRound className="h-4 w-4" />
                  تحديث بيانات الدخول
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
