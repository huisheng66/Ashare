import { redirect } from "next/navigation";

import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  wrong: "口令不对，再试一次。",
  rate: "尝试太频繁，请稍后再来。",
  blocked: "当前 IP 已被临时封禁，请稍后再来。",
};

export default async function LoginPage({ searchParams }: Props) {
  if (await hasValidSession()) redirect("/admin");
  const { e } = await searchParams;

  return (
    <Card className="max-w-sm p-6">
      <form action={login} className="space-y-4">
        <Field label="管理口令" htmlFor="admin-password">
          <Input
            id="admin-password"
            name="password"
            type="password"
            required
            autoFocus
          />
        </Field>
        {e ? (
          <p role="alert" className="text-[13px] text-destructive">
            {ERRORS[e] ?? e}
          </p>
        ) : null}
        <Button type="submit">登录</Button>
      </form>
    </Card>
  );
}
