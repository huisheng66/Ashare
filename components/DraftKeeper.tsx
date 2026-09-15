"use client";

import { useEffect } from "react";

type DraftValue = string | string[] | boolean;

/**
 * 后台表单草稿：input 时写入 localStorage；带 ?e=（校验失败跳回）时恢复，
 * 正常打开或保存成功后进入表单则清除。文件输入不暂存（浏览器安全限制）。
 */
export function DraftKeeper({
  formId,
  storageKey,
}: {
  formId: string;
  storageKey: string;
}) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const key = `ashare-draft:${storageKey}`;

    const collect = (): Record<string, DraftValue> => {
      const data: Record<string, DraftValue> = {};
      for (const el of form.elements) {
        const name = (el as HTMLInputElement).name;
        if (!name || el.id === "f-previews" || el.id === "f-iconImage") continue;
        if (el instanceof HTMLInputElement && el.type === "checkbox") {
          if (el.type === "checkbox" && form.elements.namedItem(name) instanceof RadioNodeList) {
            // 同名多选（场景/平台）
            const group = form.querySelectorAll<HTMLInputElement>(
              `input[name="${name}"]:checked`,
            );
            data[name] = [...group].map((c) => c.value);
          } else {
            data[name] = el.checked;
          }
        } else if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          data[name] = (el as HTMLInputElement).value;
        }
      }
      return data;
    };

    const restore = (data: Record<string, DraftValue>) => {
      for (const [name, value] of Object.entries(data)) {
        const first = form.elements.namedItem(name);
        if (first instanceof RadioNodeList || form.querySelectorAll(`input[name="${name}"]`).length > 1) {
          const values = Array.isArray(value) ? value : [];
          form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((c) => {
            c.checked = values.includes(c.value);
          });
        } else if (
          first instanceof HTMLInputElement &&
          first.type === "checkbox"
        ) {
          first.checked = Boolean(value);
        } else if (
          first instanceof HTMLInputElement ||
          first instanceof HTMLTextAreaElement ||
          first instanceof HTMLSelectElement
        ) {
          (first as HTMLInputElement).value = String(value);
        }
      }
    };

    const hasError = new URLSearchParams(window.location.search).has("e");
    if (hasError) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) restore(JSON.parse(raw) as Record<string, DraftValue>);
      } catch {
        // 草稿损坏则忽略
      }
    } else {
      localStorage.removeItem(key);
    }

    const save = () => {
      try {
        localStorage.setItem(key, JSON.stringify(collect()));
      } catch {
        // 存储满则放弃
      }
    };

    let timer: ReturnType<typeof setTimeout>;
    const onInput = () => {
      clearTimeout(timer);
      timer = setTimeout(save, 300);
    };
    // 提交前同步保存一次，覆盖防抖未落盘的快速填写
    const onSubmitCapture = () => {
      clearTimeout(timer);
      save();
    };
    form.addEventListener("input", onInput);
    form.addEventListener("submit", onSubmitCapture, true);
    return () => {
      clearTimeout(timer);
      form.removeEventListener("input", onInput);
      form.removeEventListener("submit", onSubmitCapture, true);
    };
  }, [formId, storageKey]);

  return null;
}
