import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[980px] px-5 py-20 sm:px-8">
      <h1 className="text-[28px] font-bold tracking-tight">没有这个页面</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        可能是链接写错了，或这条软件还没收录。
      </p>
      <div className="mt-6 flex gap-6">
        <Link href="/" className="text-[15px] font-medium text-primary">
          回到探索<span aria-hidden className="ml-0.5">›</span>
        </Link>
        <Link href="/submit" className="text-[15px] font-medium text-foreground">
          提交推荐<span aria-hidden className="ml-0.5">›</span>
        </Link>
      </div>
    </div>
  );
}
