import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="w-full px-5 py-6 sm:px-8" aria-busy="true">
      <p role="status" className="text-[20px] font-bold tracking-tight">正在查找软件…</p>
      <div aria-hidden="true" className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
            <Skeleton className="aspect-[16/10] w-full rounded-none motion-reduce:animate-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-3 w-1/3 motion-reduce:animate-none" />
              <Skeleton className="h-5 w-2/3 motion-reduce:animate-none" />
              <Skeleton className="h-8 w-full motion-reduce:animate-none" />
              <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
              <Skeleton className="h-8 w-full motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
