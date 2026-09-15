import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "提交推荐",
  description: "推荐一个官方或开源软件，说明它解决什么需求。",
};

export default function SubmitPage() {
  return (
    <div className="w-full px-5 py-8 sm:px-8">
      <h1 className="text-[36px] font-bold tracking-tight">提交推荐</h1>
      <p className="mt-2 max-w-[55ch] text-[15px] text-muted-foreground">
        告诉我们条目类型、名称、主链接，以及它解决什么需求。审核通过后才会进目录。不收录破解、修改版和捆绑包。
      </p>
      <div className="mt-6 max-w-xl">
        <SubmitForm />
      </div>
    </div>
  );
}
