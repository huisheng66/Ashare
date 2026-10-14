"use client";

import { useActionState } from "react";

import { login, type LoginError, type LoginState } from "@/app/admin/actions";
import { Field, FormError } from "@/components/form-field";
import { Turnstile } from "@/components/Turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ERRORS: Record<LoginError, string> = {
  wrong: "账号或口令不对，再试一次。",
  rate: "尝试太频繁，请稍后再来。",
  blocked: "当前 IP 已被临时封禁，请稍后再来。",
  captcha: "人机验证未通过，请等验证框刷新后再试。",
};

const initial: LoginState = {};

/**
 * 登录表单。失败经 useActionState 原地展示（不再走 ?e= 重定向往返），
 * 令牌单次有效，每次失败后重置 Turnstile 换新令牌。
 * initialError 是例外：requireAdmin 从别的页面带来的封禁提示（?e=blocked）。
 */
export function LoginForm({ siteKey, initialError }: { siteKey?: string; initialError?: string }) {
  const [state, formAction, pending] = useActionState(login, initial);
  const error: LoginError | undefined =
    state.error ?? (initialError && initialError in ERRORS ? (initialError as LoginError) : undefined);

  return (
    <form action={formAction} aria-busy={pending} className="mt-6 space-y-5">
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">登录管理后台</legend>
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
        {siteKey ? <Turnstile siteKey={siteKey} action="login" resetKey={state.error ? state : undefined} /> : null}
        <FormError message={error ? ERRORS[error] : undefined} />
        <Button type="submit" size="lg" className="w-full">
          {pending ? "登录中…" : "登录"}
        </Button>
      </fieldset>
    </form>
  );
}
