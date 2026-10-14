"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { submitSubmission, SubmissionState } from "@/app/submit/actions";
import { Field, FormError, FormSuccess, hintId } from "@/components/form-field";
import { Turnstile } from "@/components/Turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initial: SubmissionState = { ok: false };

const kindOptions = [
  { value: "app", label: "应用（厂商正式版 / 免费档 / 优惠入口）" },
  { value: "script", label: "脚本 / 命令行小工具" },
  { value: "opensource", label: "开源项目" },
];

/** siteKey 来自服务端，未配置 Turnstile 时整个验证不出现。 */
export function SubmitForm({ siteKey }: { siteKey?: string }) {
  const [version, setVersion] = useState(0);
  return <SubmissionFields key={version} siteKey={siteKey} onReset={() => setVersion((value) => value + 1)} />;
}

function SubmissionFields({ siteKey, onReset }: { siteKey?: string; onReset: () => void }) {
  const [values, setValues] = useState({ kind: "app", name: "", url: "", need: "" });
  const statusRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    submitSubmission,
    initial,
  );

  useEffect(() => {
    if (state.ok) statusRef.current?.focus();
  }, [state.ok]);

  // 通行证可能刚好在填表期间过期：这一页没有验证框，用户会看到「人机验证未通过」
  // 却无从下手。刷新一次让服务端重新判断，验证框就会出现（已填内容由本组件状态保留）。
  useEffect(() => {
    if (state.code === "captcha" && !siteKey) router.refresh();
  }, [state, siteKey, router]);

  if (state.ok) {
    return (
      <FormSuccess
        headingRef={statusRef}
        title="已提交，谢谢推荐"
        action={
          <>
            <Button variant="secondary" onClick={onReset}>
              再推荐一个
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">回到探索</Link>
            </Button>
          </>
        }
      >
        会先进入审核队列：核对来源、许可和平台，补上适合与不适合，通过后才出现在目录里。
      </FormSuccess>
    );
  }

  return (
    <form
      action={formAction}
      aria-busy={pending}
      onResetCapture={(event) => {
        // React resets successful action returns, including validation errors.
        // Stop Radix's native reset listener; successful submissions remount above.
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <fieldset disabled={pending} className="space-y-6">
        <legend className="sr-only">推荐一款工具</legend>
        <Field label="类型" htmlFor="kind">
          <Select name="kind" value={values.kind} onValueChange={(value) => setValues((previous) => ({ ...previous, kind: value }))} disabled={pending}>
            <SelectTrigger id="kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kindOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="名称" htmlFor="name">
          <Input id="name" maxLength={100} autoComplete="off" name="name" value={values.name} onChange={(event) => setValues((previous) => ({ ...previous, name: event.target.value }))} required placeholder="例如 JASP" />
        </Field>
        <Field label="主链接" htmlFor="url" hint="官网或 GitHub 仓库地址，不要填网盘或下载站。">
          <Input id="url" maxLength={2048} autoComplete="url" name="url" aria-describedby={hintId("url")} value={values.url} onChange={(event) => setValues((previous) => ({ ...previous, url: event.target.value }))} type="url" required placeholder="https://" />
        </Field>
        <Field label="它解决什么需求" htmlFor="need" hint="写你用它做什么、为什么选它，至少 8 个字。">
          <Textarea
            id="need"
            name="need"
            aria-describedby={hintId("need")}
            value={values.need}
            onChange={(event) => setValues((previous) => ({ ...previous, need: event.target.value }))}
            required
            minLength={8}
            maxLength={1000}
            rows={5}
            placeholder="例如：需要点选做 t 检验，不想先学 R"
          />
        </Field>
        {siteKey ? <Turnstile siteKey={siteKey} action="submit" resetKey={!state.ok && state.message ? state : undefined} /> : null}
        <FormError message={state.message} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-6">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "提交中…" : "提交审核"}
          </Button>
          <p className="text-xs text-muted-foreground">提交后不会直接公开。</p>
        </div>
      </fieldset>
    </form>
  );
}
