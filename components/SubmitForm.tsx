"use client";

import { CircleCheck } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { submitSubmission, SubmissionState } from "@/app/submit/actions";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export function SubmitForm() {
  const [version, setVersion] = useState(0);
  return <SubmissionFields key={version} onReset={() => setVersion((value) => value + 1)} />;
}

function SubmissionFields({ onReset }: { onReset: () => void }) {
  const [values, setValues] = useState({ kind: "app", name: "", url: "", need: "" });
  const statusRef = useRef<HTMLHeadingElement>(null);
  const [state, formAction, pending] = useActionState(
    submitSubmission,
    initial,
  );

  useEffect(() => {
    if (state.ok) statusRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    return (
      <Card className="items-center gap-3 py-10 text-center">
        <CircleCheck className="size-10 text-opensource" />
        <h2 ref={statusRef} tabIndex={-1} className="text-lg font-semibold">已提交</h2>
        <p className="max-w-[50ch] text-sm text-muted-foreground">
          会进入站内审核队列，通过后才会出现在目录里。感谢推荐。
        </p>
        <Button variant="secondary" onClick={onReset}>
          再提交一个
        </Button>
      </Card>
    );
  }

  return (
    <form
      action={formAction}
      aria-busy={pending}
      className="space-y-5"
      onResetCapture={(event) => {
        // React resets successful action returns, including validation errors.
        // Stop Radix's native reset listener; successful submissions remount above.
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <fieldset disabled={pending} className="space-y-5">
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
        <Field label="主链接（官网 / GitHub）" htmlFor="url">
          <Input id="url" maxLength={2048} autoComplete="url" name="url" value={values.url} onChange={(event) => setValues((previous) => ({ ...previous, url: event.target.value }))} type="url" required placeholder="https://" />
        </Field>
        <Field label="它解决什么需求" htmlFor="need">
          <Textarea
            id="need"
            name="need" value={values.need} onChange={(event) => setValues((previous) => ({ ...previous, need: event.target.value }))}
            required
            minLength={8}
            maxLength={1000}
            rows={5}
            placeholder="例如：需要点选做 t 检验，不想先学 R"
          />
        </Field>
        {state.message ? (
          <p role="alert" className="text-[13px] font-medium text-destructive">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "提交中…" : "提交审核"}
        </Button>
      </fieldset>
    </form>
  );
}
