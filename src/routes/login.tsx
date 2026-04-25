import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Tooth } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل دخول العيادة" },
      { name: "description", content: "واجهة تسجيل دخول نظام إدارة عيادة الأسنان" },
      { property: "og:title", content: "تسجيل دخول العيادة" },
      { property: "og:description", content: "واجهة دخول لوحة تحكم العيادة" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 bg-[image:var(--gradient-primary)] opacity-90" />
        <div className="absolute inset-0 bg-background/20" />
        <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
          <div className="inline-flex w-fit items-center gap-3 rounded-md bg-primary-foreground/15 px-4 py-3 backdrop-blur">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-foreground/20">
              <Tooth className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">نظام العيادة</p>
              <h1 className="text-xl font-bold">لوحة تحكم الأسنان</h1>
            </div>
          </div>

          <div className="max-w-xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary-foreground/15 px-3 py-2 text-sm font-medium backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              دخول آمن لإدارة بيانات العيادة
            </div>
            <p className="text-4xl font-bold leading-tight xl:text-5xl">
              كل ما تحتاجه لإدارة المرضى والمواعيد في مكان واحد.
            </p>
            <p className="max-w-lg text-base leading-8 opacity-85">
              واجهة مخصصة لفريق العيادة للوصول السريع إلى السجلات، الأطباء، والمراجعات اليومية.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-primary-foreground/15 p-4 backdrop-blur">
              <p className="text-2xl font-bold">24</p>
              <p className="text-xs opacity-80">موعد اليوم</p>
            </div>
            <div className="rounded-md bg-primary-foreground/15 p-4 backdrop-blur">
              <p className="text-2xl font-bold">128</p>
              <p className="text-xs opacity-80">مريض نشط</p>
            </div>
            <div className="rounded-md bg-primary-foreground/15 p-4 backdrop-blur">
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs opacity-80">أطباء</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Tooth className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">لوحة تحكم الأسنان</h1>
          </div>

          <Card className="rounded-lg shadow-lg">
            <CardHeader className="space-y-3 text-center">
              <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
              <CardDescription>أدخل بياناتك للوصول إلى لوحة إدارة العيادة</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" placeholder="name@clinic.com" className="h-11" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <button type="button" className="text-sm font-medium text-primary hover:underline">
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <Input id="password" type="password" placeholder="••••••••" className="h-11" />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-3">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" className="h-4 w-4 accent-primary" />
                    تذكرني
                  </label>
                  <span className="text-xs text-muted-foreground">للموظفين المصرح لهم فقط</span>
                </div>

                <Button type="button" className="h-11 w-full text-base">
                  دخول
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
