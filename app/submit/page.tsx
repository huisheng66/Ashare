import type { Metadata } from "next";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "提交推荐",
  description: "推荐一个官方或开源软件，说明它解决什么需求。",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">提交推荐</h1>
      <p className="mt-2 max-w-[55ch] text-muted">
        告诉我们软件名、官方页面，以及它解决什么需求。审核通过后才会进目录。不收录破解、修改版和捆绑包。
      </p>
      <div className="mt-8">
        <SubmitForm />
      </div>
    </div>
  );
}
