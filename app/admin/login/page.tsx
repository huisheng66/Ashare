import { redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { SealMark } from "@/components/Logo";
import { hasValidSession } from "@/lib/auth";
import { turnstileSiteKey } from "@/lib/turnstile";

export const metadata = {
  title: "登录",
};

type Props = {
  searchParams: Promise<{ e?: string }>;
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
        {/* 刻意不吃首访通行证：通行证只证明「最近有真人访问过本站」，
            而这里是凭据入口，不该被一枚 cookie 换掉现场验证。 */}
        <LoginForm siteKey={turnstileSiteKey()} initialError={e} />
      </div>
    </div>
  );
}
