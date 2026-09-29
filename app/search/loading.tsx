import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="shell pb-20 pt-10 sm:pt-14" aria-busy="true">
      <p role="status" className="sr-only">
        正在查找工具…
      </p>
      <div aria-hidden="true">
        <div className="max-w-2xl">
          <Skeleton className="h-4 w-16 motion-reduce:animate-none" />
          <Skeleton className="mt-4 h-10 w-2/3 motion-reduce:animate-none" />
          <Skeleton className="mt-6 h-12 w-full rounded-xl motion-reduce:animate-none" />
        </div>
        <Skeleton className="mt-10 h-4 w-40 motion-reduce:animate-none" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3.5">
                <Skeleton className="size-12 rounded-[14px] motion-reduce:animate-none" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
                  <Skeleton className="h-3 w-1/3 motion-reduce:animate-none" />
                </div>
              </div>
              <Skeleton className="mt-5 h-3.5 w-full motion-reduce:animate-none" />
              <Skeleton className="mt-2 h-3.5 w-4/5 motion-reduce:animate-none" />
              <div className="mt-5 flex items-center gap-2.5 border-t border-border pt-4">
                <Skeleton className="h-6 w-14 rounded-full motion-reduce:animate-none" />
                <Skeleton className="h-3 w-20 motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
