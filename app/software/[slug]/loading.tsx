import { Skeleton } from "@/components/ui/skeleton";

/**
 * 详情页加载占位。
 *
 * 从目录点进详情是站内最高频的跳转，而详情页要等数据库返回条目、替代项、
 * 再渲染正文与教程 —— 没有占位时这段时间是**完全空白的屏幕**，比加载慢更让人不安：
 * 空白读起来像「点了没反应」，而骨架至少说明了「正在打开哪一类东西」。
 *
 * 形状对齐详情页的上半部分：面包屑 → 标题区 → 卡片。
 */
export default function SoftwareLoading() {
  return (
    <div className="shell-wide pb-20 pt-6 sm:pt-8" aria-busy="true">
      <p role="status" className="sr-only">
        正在打开工具详情…
      </p>
      <div aria-hidden="true">
        <Skeleton className="h-4 w-56 motion-reduce:animate-none" />

        <div className="mt-8 flex items-start gap-4">
          <Skeleton className="size-20 shrink-0 rounded-[26%] motion-reduce:animate-none" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-8 w-1/2 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-1/3 motion-reduce:animate-none" />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full motion-reduce:animate-none" />
          <Skeleton className="h-4 w-11/12 motion-reduce:animate-none" />
          <Skeleton className="h-4 w-4/5 motion-reduce:animate-none" />
          <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3.5">
                <Skeleton className="size-11 shrink-0 rounded-[26%] motion-reduce:animate-none" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
                  <Skeleton className="h-3 w-3/4 motion-reduce:animate-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}