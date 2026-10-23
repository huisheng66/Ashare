"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Clock, CornerDownLeft, Loader2, Search, TrendingUp } from "lucide-react";

import { SoftwareIcon } from "@/components/SoftwareIcon";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { CatalogItem } from "@/data/types";
import { taskSuggestions } from "@/lib/navigation";

/**
 * ⌘K 即时搜索面板。
 *
 * 与 SiteHeader 里的 HeaderSearch / SearchPanel 的分工：那些是**服务端表单**，没有 JS 也能
 * 提交到 /search（无 JS 降级路径）；本组件是**有 JS 时的增强**，负责输入即出建议、键盘直达。
 * 两者并存，谁都不会因为对方而失效。
 */

/** 与 /api/suggest 的窄投影同形状。用 Pick 绑定 CatalogItem，接口一改这里同时报错。 */
type SuggestionItem = Pick<CatalogItem, "slug" | "name" | "nameZh" | "icon">;
type SuggestionResponse = { items: SuggestionItem[]; total: number; fuzzy: boolean; corrected?: string };

/**
 * 取数状态带上「它是为哪个查询词取的」。
 *
 * 为什么不简单地用 results/loading 两个 state：那样在查询词变化、新请求还在防抖窗口内时，
 * 画面会拿旧结果或空结果冒充新结果。把查询词编进状态后，渲染层只在 `state.query === 当前词`
 * 时才采用它，天然杜绝串台 —— 也让下面那个 effect 无需再「同步 setState 清空」。
 */
type FetchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "done"; query: string; items: SuggestionItem[]; total: number; corrected?: string };

const DEBOUNCE_MS = 200;
const SUGGEST_LIMIT = 6;

/* ------------------------------ 搜索历史 store ------------------------------ */

/**
 * 用 useSyncExternalStore 而不是 useState + useEffect 读 localStorage。
 *
 * 取舍：localStorage 是「组件外的可变源」，用 useEffect 同步会先渲染一帧空数据、
 * 再补一帧真实数据（对 hydration 尤其危险）。useSyncExternalStore 明确分成
 * getServerSnapshot（SSR/注水期恒为 []）与 getSnapshot（客户端读真实值），
 * React 会在注水完成后自行决定是否重渲染，避免了两端首帧不一致。
 *
 * 关键约束：getSnapshot 必须返回**稳定引用**，否则每次渲染都算「变了」会导致无限循环。
 * 所以用模块级 cache，只在真正写入时换新数组引用（只读数组）。
 */
const HISTORY_KEY = "ashare:search-history";
const HISTORY_MAX = 8;
const EMPTY_HISTORY: readonly string[] = [];

let historyCache: readonly string[] = EMPTY_HISTORY;
let historyLoaded = false;
const historyListeners = new Set<() => void>();

function readHistory(): readonly string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return EMPTY_HISTORY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_HISTORY;
    return parsed
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .slice(0, HISTORY_MAX);
  } catch {
    // 存储被禁用或内容损坏：当成没有历史，不影响搜索本身。
    return EMPTY_HISTORY;
  }
}

function subscribeHistory(listener: () => void): () => void {
  historyListeners.add(listener);
  // 跨标签页同步。注意必须在这里让缓存失效并重读：getSnapshot 平时只回模块级 cache，
  // 别的标签页写入后若不重读，本页会一直拿到旧快照（storage 事件不会替我们改 cache）。
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== HISTORY_KEY) return;
    historyCache = readHistory();
    historyLoaded = true;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    historyListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getHistorySnapshot(): readonly string[] {
  if (!historyLoaded) {
    historyCache = readHistory();
    historyLoaded = true;
  }
  return historyCache;
}

/** SSR 与注水期必须返回同一个稳定值：空历史。首屏不读 window。 */
function getHistoryServerSnapshot(): readonly string[] {
  return EMPTY_HISTORY;
}

function writeHistory(next: readonly string[]): void {
  historyCache = next;
  historyLoaded = true;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // 存储满/被禁用：内存里的 cache 仍然更新，本次会话够用。
  }
  for (const listener of historyListeners) listener();
}

/** 去重、最新的在前、最多 8 条。 */
function rememberSearch(term: string): void {
  const value = term.trim();
  if (!value) return;
  const current = getHistorySnapshot();
  writeHistory([value, ...current.filter((item) => item !== value)].slice(0, HISTORY_MAX));
}

/* -------------------------------- 组件 -------------------------------- */

export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggest, setSuggest] = useState<FetchState>({ status: "idle" });

  const history = useSyncExternalStore(subscribeHistory, getHistorySnapshot, getHistoryServerSnapshot);

  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  /**
   * 关闭时清空输入与取数状态，下次打开即从空白开始。
   *
   * 放在「关闭」而不是「打开」的时机：⌘K 由 SiteHeader 直接把 open 置真，不经过本组件，
   * 所以「打开时重置」这个钩子会漏掉快捷键路径；而关闭（Esc / 遮罩 / 选中后 close）一定
   * 会走 onOpenChange(false)，是覆盖所有路径的那个收口点。
   */
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setQuery("");
        setSuggest({ status: "idle" });
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  // 防抖 + 取消：输入停止 200ms 才发请求；下一次输入立刻 abort 掉在途请求，
  // 组件卸载同理（cleanup 会在卸载时 abort）。这样不会出现「慢的旧响应覆盖新结果」。
  // 注意：所有 setState 都在 setTimeout / promise 回调里，不在 effect 体内同步调用。
  useEffect(() => {
    if (!open || !trimmed) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSuggest({ status: "loading", query: trimmed });
      fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}&limit=${SUGGEST_LIMIT}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json() as Promise<SuggestionResponse>;
        })
        .then((data) => {
          if (controller.signal.aborted) return;
          setSuggest({
            status: "done",
            query: trimmed,
            items: Array.isArray(data.items) ? data.items : [],
            total: Number.isFinite(data.total) ? data.total : 0,
            corrected: typeof data.corrected === "string" ? data.corrected : undefined,
          });
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          if (controller.signal.aborted) return;
          // 请求失败按「无结果」处理：不弹错、不空白，用户仍可回车走完整搜索页。
          setSuggest({ status: "done", query: trimmed, items: [], total: 0 });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  /** 提交到搜索结果页：写历史 + 关闭 + 跳转。 */
  const runSearch = useCallback(
    (term: string) => {
      const value = term.trim();
      if (!value) return;
      rememberSearch(value);
      close();
      router.push(`/search?q=${encodeURIComponent(value)}`);
    },
    [close, router],
  );

  /** 直接打开某个软件：历史里存下这次意图（有查询词用查询词，否则用软件名）。 */
  const openItem = useCallback(
    (item: SuggestionItem) => {
      rememberSearch(trimmed || item.name);
      close();
      router.push(`/software/${item.slug}`);
    },
    [close, router, trimmed],
  );

  // 只采用「为当前查询词」取回的结果，避免防抖窗口里拿旧结果冒充新结果。
  const fresh = suggest.status !== "idle" && suggest.query === trimmed ? suggest : null;
  const results = fresh?.status === "done" ? fresh.items : [];
  const corrected = fresh?.status === "done" ? fresh.corrected : undefined;
  // 只在「还有更多」时展示总数：6 条以内全都列出来了，再写「共 4 条」是废话。
  const totalCount = fresh?.status === "done" ? fresh.total : 0;
  // 尚未取到当前词的结果（无 state / 正在加载）都算挂起，显示加载态而不是「无结果」。
  const pending = searching && (fresh === null || fresh.status === "loading");

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="站内搜索"
      description="搜索软件名称、别名或用途"
      className="sm:max-w-xl"
    >
      {/*
        shouldFilter={false} 是关键：cmdk 自带的 command-score 过滤对中文与拼音会二次过滤，
        我们的建议来自服务端全文检索（已含 name_zh / 别名 / 拼音召回），再被前端按字面匹配一遍
        会把「拼音命中但字面不匹配」的结果整片吞掉。关掉它，渲染什么完全由我们决定。
      */}
      <Command shouldFilter={false} label="站内搜索">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="搜索软件名称、别名或用途"
          aria-label="搜索软件名称、别名或用途"
        />
        <CommandList aria-label={searching ? "搜索建议" : "最近与热门搜索"}>
          {searching ? (
            <>
              {/* 首项固定是「搜索全部结果」：刚输入完直接回车也能落到 /search，符合直觉。 */}
              <CommandGroup heading="搜索">
                <CommandItem
                  value={`__search__:${trimmed}`}
                  onSelect={() => runSearch(trimmed)}
                  className="gap-2.5 text-muted-foreground data-selected:text-foreground"
                >
                  <Search className="size-4" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    在站内搜索「<span className="font-medium text-foreground">{trimmed}</span>」
                    {totalCount > results.length ? (
                      <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">共 {totalCount} 条</span>
                    ) : null}
                  </span>
                  <CornerDownLeft className="size-3.5 opacity-60" aria-hidden="true" />
                </CommandItem>
              </CommandGroup>

              {corrected && results.length > 0 ? (
                // 纠正提示必须显式：面板里一按回车就跳转，用户会以为自己搜的是原词。
                <div className="px-3 pb-1.5 text-xs text-muted-foreground" role="status">
                  没有「{trimmed}」的结果，已按「<span className="font-medium text-foreground">{corrected}</span>」搜索
                </div>
              ) : null}

              {results.length > 0 ? (
                <CommandGroup heading="软件">
                  {results.map((item) => (
                    <CommandItem
                      key={item.slug}
                      value={`item:${item.slug}`}
                      onSelect={() => openItem(item)}
                      className="gap-2.5"
                    >
                      <SoftwareIcon item={item} size={28} />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{item.name}</span>
                        {item.nameZh ? (
                          <span className="ml-1.5 text-muted-foreground">{item.nameZh}</span>
                        ) : null}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : pending ? (
                // 用自定义提示而不是 CommandEmpty：shouldFilter=false 下 cmdk 的 empty
                // 判定看的是「渲染出的 item 数」，而上面那个搜索项始终存在，永远不为空。
                <div
                  className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
                  role="status"
                >
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  正在查找…
                </div>
              ) : (
                <div
                  className="px-3 py-6 text-center text-sm leading-relaxed text-muted-foreground"
                  role="status"
                >
                  没找到「{trimmed}」。换个说法，或直接回车看完整搜索结果。
                </div>
              )}
            </>
          ) : (
            <>
              {history.length > 0 ? (
                <CommandGroup heading="最近搜索">
                  {history.map((term) => (
                    <CommandItem
                      key={`history:${term}`}
                      value={`history:${term}`}
                      onSelect={() => runSearch(term)}
                      className="gap-2.5 text-muted-foreground data-selected:text-foreground"
                    >
                      <Clock className="size-4" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{term}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}

              <CommandGroup heading="热门">
                {taskSuggestions.map((term) => (
                  <CommandItem
                    key={`hot:${term}`}
                    value={`hot:${term}`}
                    onSelect={() => runSearch(term)}
                    className="gap-2.5 text-muted-foreground data-selected:text-foreground"
                  >
                    <TrendingUp className="size-4" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{term}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
