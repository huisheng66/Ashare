import type { Metadata } from "next";

import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata: Metadata = {
  title: "反馈",
  description: "条目纠错、站内问题或其他建议。",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto w-full max-w-[980px] px-5 py-8 sm:px-8">
      <h1 className="text-[36px] font-bold tracking-tight">反馈</h1>
      <p className="mt-2 max-w-[55ch] text-[15px] text-muted-foreground">
        发现链接失效、介绍不对，或页面本身有问题，都可以在这里说。反馈只有管理员能看到。
      </p>
      <div className="mt-6 max-w-xl">
        <FeedbackForm />
      </div>
    </div>
  );
}
