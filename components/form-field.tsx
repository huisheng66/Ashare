import type { Ref } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

import { Label } from "@/components/ui/label";

/** 提示文字的 id，输入框用 aria-describedby 关联。 */
export const hintId = (htmlFor: string) => `${htmlFor}-hint`;

/** 表单字段：标签在上（14px/500），说明在标签下（12px 次要文字）。 */
export function Field({
  label,
  htmlFor,
  hint,
  optional = false,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {optional ? <span className="text-xs font-normal text-muted-foreground">选填</span> : null}
        </Label>
        {hint ? (
          <p id={hintId(htmlFor)} className="text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** 表单级错误：错误色 + 图标，读屏立即播报。 */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-[13px] font-medium text-destructive">
      <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

/** 提交成功：原位替换表单，焦点移到标题。 */
export function FormSuccess({
  headingRef,
  title,
  children,
  action,
}: {
  headingRef: Ref<HTMLHeadingElement>;
  title: string;
  children: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-2 py-10 text-center">
      <span
        className="grid size-12 place-items-center rounded-full bg-opensource/12 text-opensource"
        aria-hidden="true"
      >
        <CircleCheck className="size-6" />
      </span>
      <h2 ref={headingRef} tabIndex={-1} className="mt-5 text-lg font-semibold outline-none">
        {title}
      </h2>
      <p className="mt-2 max-w-[28em] text-sm leading-relaxed text-muted-foreground">{children}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>
    </div>
  );
}
