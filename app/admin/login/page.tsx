import { redirect } from "next/navigation";

import { Field, FormError } from "@/components/form-field";
import { SealMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hasValidSession } from "@/lib/auth";
import { login } from "../actions";

export const metadata = {
  title: "登录",
};

type Props = {
  searchParams: Promise<{ e?: string }>;
};

const ERRORS: Record<string, string> = {
  wrong: "账号或口令不对，再试一次。",
  rate: "尝试太频繁，请稍后再来。",
  blocked: "当前 IP 已被临时封禁，请稍后再来。",
};

export default async function LoginPage({ searchParams }: Props) {
  if (await hasValidSession()) redirect("/admin");
  const { e } = await searchParams;

  return (
    <div className="mx-auto max-w-sm py-8 sm:py-12">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
        <SealMark className="size-10" />
        <h1 className="mt-5 text-xl font-bold">登录管理后台</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">只对站点维护者开放。</p>
        <form action={login} className="mt-6 space-y-5">
          <Field label="账号" htmlFor="admin-username">
            <Input
              id="admin-username"
              name="username"
              autoComplete="username"
              required
              autoFocus
            />
          </Field>
          <Field label="口令" htmlFor="admin-password">
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <FormError message={e ? (ERRORS[e] ?? "登录失败，请再试一次。") : undefined} />
          <Button type="submit" size="lg" className="w-full">
            登录
          </Button>
        </form>
      </div>
    </div>
  );
}
