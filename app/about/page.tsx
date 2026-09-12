import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "收录标准",
};

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">收录标准</h1>
      <div className="mt-6 space-y-8 text-[0.9875rem] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">Ashare 做什么</h2>
          <p className="mt-2 text-pretty">
            帮你按需求找到软件：适不适合、去哪个官网、装的时候注意什么。对象是「现在需要用这个工具的人」，不按身份划分。
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">收什么</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>厂商官网提供的正式版</li>
            <li>开源项目的官方发行渠道</li>
            <li>厂商写明的免费档或优惠入口</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold">不收什么</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>破解、序列号、修改版、汉化包（非官方）</li>
            <li>捆绑推广、强制附加软件的第三方封装</li>
            <li>来源说不清的网盘分发</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold">怎么审核投稿</h2>
          <p className="mt-2 text-pretty">
            核对官方域名、许可和平台，并补上「适合 / 不适合」和安装要点。这一版提交先记在你的浏览器里，用于走通流程。
          </p>
        </section>
        <p>
          <Link href="/submit" className="font-semibold text-primary">
            去提交推荐
          </Link>
        </p>
      </div>
    </div>
  );
}
