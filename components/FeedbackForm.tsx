"use client";

import { CircleCheck } from "lucide-react";
import { useActionState } from "react";

import { submitFeedback, FeedbackState } from "@/app/feedback/actions";
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

const initial: FeedbackState = { ok: false };

const typeOptions = [
  { value: "correction", label: "条目纠错（链接失效、介绍不对等）" },
  { value: "issue", label: "站内问题（页面打不开、展示异常）" },
  { value: "other", label: "其他" },
];

export function FeedbackForm() {
  const [state, formAction, pending] = useActionState(submitFeedback, initial);

  if (state.ok) {
    return (
      <Card className="items-center gap-3 py-10 text-center">
        <CircleCheck className="size-10 text-opensource" />
        <h2 className="text-lg font-semibold">已收到</h2>
        <p className="max-w-[50ch] text-sm text-muted-foreground">
          反馈已进入站内队列，会尽快处理。留下联系方式的会得到回复。
        </p>
        <Button variant="secondary" onClick={() => location.reload()}>
          再发一条
        </Button>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Field label="类型" htmlFor="type">
        <Select name="type" defaultValue="correction">
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
      <Field label="关联条目（可选，填 slug 或名称）" htmlFor="slug">
        <Input id="slug" name="slug" placeholder="例如 vscode" />
      </Field>
      <Field
        label="联系方式（可选，邮箱或任意能找到你的方式）"
        htmlFor="contact"
      >
        <Input id="contact" name="contact" placeholder="选填" />
      </Field>
      <Field label="内容" htmlFor="content">
        <Textarea
          id="content"
          name="content"
          required
          minLength={8}
          maxLength={2000}
          rows={5}
          placeholder="说清楚遇到的问题或想改什么"
        />
      </Field>
      {state.message ? (
        <p role="alert" className="text-[13px] font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "提交中…" : "提交反馈"}
      </Button>
    </form>
  );
}
