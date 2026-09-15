import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "收录标准",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[980px] px-5 py-8 sm:px-8">
      <h1 className="text-[36px] font-bold tracking-tight">收录标准</h1>
      <div className="mt-6 max-w-2xl divide-y divide-border rounded-2xl bg-muted px-5 [&>section]:py-5 sm:px-6">
        <section>
          <h2 className="text-[17px] font-semibold">Ashare 做什么</h2>
          <p className="mt-2 text-pretty text-[15px] leading-relaxed">
            帮你按需求找到软件：适不适合、去哪个官网、装的时候注意什么。对象是「现在需要用这个工具的人」，不按身份划分。
          </p>
        </section>
        <section>
          <h2 className="text-[17px] font-semibold">收什么</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
            <li>应用：厂商官网提供的正式版、免费档或写明的优惠入口</li>
            <li>脚本：可复现的脚本、命令行小工具</li>
            <li>开源项目：官方发行渠道（GitHub Releases 或项目官网）</li>
            <li>网盘链接仅限作者或项目方提供的合法镜像，且必须有官网或 GitHub 兜底</li>
          </ul>
        </section>
        <section>
          <h2 className="text-[17px] font-semibold">不收什么</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
            <li>破解、序列号、修改版、汉化包（非官方）、商业软件盗版分发</li>
            <li>捆绑推广、强制附加软件的第三方封装</li>
            <li>来源说不清的网盘分发</li>
          </ul>
        </section>
        <section>
          <h2 className="text-[17px] font-semibold">怎么审核投稿</h2>
          <p className="mt-2 text-pretty text-[15px] leading-relaxed">
            核对来源域名、许可和平台，补上「适合 / 不适合」与使用要点，通过后在后台发布。提交会进入站内审核队列，不会直接公开。
          </p>
        </section>
        <section>
          <p>
            <Link href="/submit" className="text-[15px] font-medium text-primary">
              去提交推荐<span aria-hidden className="ml-0.5">›</span>
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
