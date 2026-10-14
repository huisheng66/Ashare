"use client";

import { useEffect, useRef } from "react";

/** Cloudflare Turnstile 前端 API 的最小描述，官方脚本加载后注入 window.turnstile。 */
type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      theme?: "light" | "dark" | "auto";
      /** interaction-only：真人不必交互时控件完全不可见，需要交互才显形。 */
      appearance?: "always" | "execute" | "interaction-only";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** 模块级缓存：脚本每页只加载一次；失败后清空，下次挂载可以重试。 */
let scriptPromise: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile 脚本已加载但未注入 API"));
    });
    script.addEventListener("error", () => {
      scriptPromise = undefined;
      reject(new Error("Turnstile 脚本加载失败"));
    });
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Turnstile 人机验证控件：显式渲染官方窗口。令牌由**控件自己**注入的同名隐藏字段
 * cf-turnstile-response 承载（这是官方在表单内渲染时的既定行为，Next.js 的官方参考
 * 实现同样只读这个字段），所以这里不再额外放一个自己的隐藏字段——两个同名字段会让
 * 「服务端拿到哪一个」取决于 DOM 顺序，纯属自找歧义。组件因此也不需要任何 React
 * state，重置不会触发额外渲染。
 *
 * resetKey 每次换成新对象时重置控件：令牌单次有效，服务端拒绝后必须换新令牌再试；
 * 传 undefined（初始态或提交成功）则不动。action 是稳定的调用面标识，服务端会比对
 * siteverify 回传的 action，挡住把 A 表单的令牌重放到 B 表单。组件也不挡提交按钮：
 * 脚本加载失败时（如网络受限）按钮仍可点，由服务端给出统一的「人机验证未通过」提示，
 * 而不是把人锁死在禁用按钮上。
 */
export function Turnstile({
  siteKey,
  action,
  resetKey,
  appearance,
  onToken,
}: {
  siteKey: string;
  action: string;
  resetKey?: object;
  appearance?: "always" | "execute" | "interaction-only";
  /** 需要拿到令牌本身时用（如首访静默检测）；放在表单里则不必传，控件会自己写字段。 */
  onToken?: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  // 控件只渲染一次，回调却每次渲染都是新函数：用 ref 存最新那个，
  // 既避免把回调写进 effect 依赖导致控件反复重建，也不会拿到过期闭包。
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  });

  /** 控件注入的令牌字段；过期或出错时清空，避免提交一个已被 Cloudflare 作废的令牌。 */
  const clearToken = () => {
    const input = containerRef.current?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
    if (input) input.value = "";
    onTokenRef.current?.("");
  };

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        // 跟随站点的 class 策略暗色模式，避免验证窗口在暗色页面里发白块。
        const theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme,
          ...(appearance ? { appearance } : {}),
          callback: (value) => onTokenRef.current?.(value),
          "expired-callback": clearToken,
          "error-callback": clearToken,
        });
      })
      .catch(() => {
        // 脚本没加载出来：令牌保持为空，交给服务端提示。
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current !== undefined) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = undefined;
    };
  }, [siteKey, action, appearance]);

  useEffect(() => {
    if (resetKey === undefined) return;
    clearToken();
    if (widgetIdRef.current !== undefined) window.turnstile?.reset(widgetIdRef.current);
  }, [resetKey]);

  return <div ref={containerRef} />;
}
