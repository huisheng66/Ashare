"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { submitFeedback, FeedbackState } from "@/app/feedback/actions";
import { Field, FormError, FormSuccess, hintId } from "@/components/form-field";
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

const initial: FeedbackState = { ok: false };

const typeOptions = [
  { value: "correction", label: "条目纠错（链接失效、介绍不对等）" },
  { value: "issue", label: "站内问题（页面打不开、展示异常）" },
  { value: "other", label: "其他" },
];

type Prefill = { slug: string; name: string };

/** prefill 来自详情页「信息有误？反馈」，预填关联条目。 */
export function FeedbackForm({ prefill }: { prefill?: Prefill }) {
  const [version, setVersion] = useState(0);
  return <FeedbackFields key={version} prefill={version ? undefined : prefill} onReset={() => setVersion((value) => value + 1)} />;
}

function FeedbackFields({ prefill, onReset }: { prefill?: Prefill; onReset: () => void }) {
  const [values, setValues] = useState({ type: "correction", slug: prefill?.slug ?? "", contact: "", content: "" });
  const statusRef = useRef<HTMLHeadingElement>(null);
  const [state, formAction, pending] = useActionState(submitFeedback, initial);

  useEffect(() => {
    if (state.ok) statusRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    return (
      <FormSuccess
        headingRef={statusRef}
        title="已收到，谢谢"
        action={
          <>
            <Button variant="secondary" onClick={onReset}>
              再发一条
            </Button>
            {prefill ? (
              <Button asChild variant="ghost">
                <Link href={`/software/${encodeURIComponent(prefill.slug)}`}>回到 {prefill.name}</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost">
                <Link href="/">回到探索</Link>
              </Button>
            )}
          </>
        }
      >
        反馈已进入站内队列，会尽快核对处理。留了联系方式的，我们会回复你。
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
        <legend className="sr-only">发送反馈</legend>
        <Field label="类型" htmlFor="type">
          <Select name="type" value={values.type} onValueChange={(value) => setValues((previous) => ({ ...previous, type: value }))} disabled={pending}>
            <SelectTrigger id="type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="关联条目"
          htmlFor="slug"
          optional
          hint={prefill ? `已从「${prefill.name}」详情页带过来。` : "填条目名称或网址里的 slug，比如 vscode。"}
        >
          <Input id="slug" maxLength={100} name="slug" aria-describedby={hintId("slug")} value={values.slug} onChange={(event) => setValues((previous) => ({ ...previous, slug: event.target.value }))} placeholder="例如 vscode" />
        </Field>
        <Field label="联系方式" htmlFor="contact" optional hint="邮箱或任何能找到你的方式，只有管理员能看到。">
          <Input id="contact" maxLength={200} name="contact" aria-describedby={hintId("contact")} value={values.contact} onChange={(event) => setValues((previous) => ({ ...previous, contact: event.target.value }))} />
        </Field>
        <Field label="内容" htmlFor="content" hint="说清楚遇到的问题或想改什么，至少 8 个字。">
          <Textarea
            id="content"
            name="content"
            aria-describedby={hintId("content")}
            value={values.content}
            onChange={(event) => setValues((previous) => ({ ...previous, content: event.target.value }))}
            required
            minLength={8}
            maxLength={2000}
            rows={6}
            placeholder="例如：官网链接已经换成新域名了"
          />
        </Field>
        <FormError message={state.message} />
        <div className="border-t border-border pt-6">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "提交中…" : "提交反馈"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
