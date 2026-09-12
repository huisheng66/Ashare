import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">没有这个页面</h1>
      <p className="mt-2 text-muted">可能是链接写错了，或这条软件还没收录。</p>
      <div className="mt-6 flex gap-4">
        <Link href="/" className="font-semibold text-primary">
          回到首页
        </Link>
        <Link href="/submit" className="font-semibold text-ink">
          提交推荐
        </Link>
      </div>
    </div>
  );
}
