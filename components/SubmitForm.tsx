"use client";

import { FormEvent, useMemo, useState } from "react";
import { scenes } from "@/data/scenes";

const STORAGE_KEY = "ashare-submissions";

type Draft = {
  name: string;
  url: string;
  scene: string;
  need: string;
};

const empty: Draft = { name: "", url: "", scene: "code", need: "" };

export function SubmitForm() {
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const sceneName = useMemo(
    () => scenes.find((s) => s.id === draft.scene)?.name ?? "",
    [draft.scene],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const name = draft.name.trim();
    const url = draft.url.trim();
    const need = draft.need.trim();
    if (!name) {
      setError("请填写软件名。");
      return;
    }
    if (!isOfficialUrl(url)) {
      setError("请填写以 http:// 或 https:// 开头的官方页面地址。");
      return;
    }
    if (need.length < 8) {
      setError("请用一句话说明它解决什么需求，至少 8 个字。");
      return;
    }

    const entry = {
      ...draft,
      name,
      url,
      need,
      at: new Date().toISOString(),
    };
    const prev = readStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...prev]));
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl bg-surface px-5 py-8">
        <h2 className="text-xl font-extrabold tracking-tight">已经记下</h2>
        <p className="mt-2 max-w-[50ch] text-muted">
          {draft.name}（{sceneName}）会进入审核。通过后才会出现在目录里。这一版先存在你这台浏览器里，方便演示流程。
        </p>
        <button
          type="button"
          className="mt-6 h-11 rounded-lg bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover"
          onClick={() => {
            setDraft(empty);
            setDone(false);
          }}
        >
          再提交一个
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5" noValidate>
      <Field label="软件名" htmlFor="name">
        <input
          id="name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className={inputClass}
          placeholder="例如 JASP"
        />
      </Field>
      <Field label="官方页面" htmlFor="url">
        <input
          id="url"
          type="url"
          value={draft.url}
          onChange={(e) => setDraft({ ...draft, url: e.target.value })}
          className={inputClass}
          placeholder="https://"
        />
      </Field>
      <Field label="场景" htmlFor="scene">
        <select
          id="scene"
          value={draft.scene}
          onChange={(e) => setDraft({ ...draft, scene: e.target.value })}
          className={inputClass}
        >
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="它解决什么需求" htmlFor="need">
        <textarea
          id="need"
          value={draft.need}
          onChange={(e) => setDraft({ ...draft, need: e.target.value })}
          className={`${inputClass} h-auto min-h-28 py-3`}
          placeholder="例如：需要点选做 t 检验，不想先学 R"
        />
      </Field>
      {error ? (
        <p role="alert" className="text-[0.875rem] font-medium text-accent">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="h-11 rounded-lg bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover"
      >
        提交审核
      </button>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-line bg-bg px-3.5 text-ink placeholder:text-muted";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.875rem] font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function isOfficialUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as unknown[]) : [];
  } catch {
    return [];
  }
}
