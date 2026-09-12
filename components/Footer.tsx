import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-[0.8125rem] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Ashare 只跳转官方、开源和厂商优惠渠道，不托管安装包。</p>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-ink">
            收录标准
          </Link>
          <Link href="/submit" className="hover:text-ink">
            提交推荐
          </Link>
        </div>
      </div>
    </footer>
  );
}
