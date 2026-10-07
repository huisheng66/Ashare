import type { Metadata } from "next";
import Link from "next/link";
import { Ban, ListChecks, Link2 } from "lucide-react";

import { FormPage } from "@/components/FormPage";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "推荐工具",
  description: "推荐一个官方或开源软件，说明它解决什么需求。",
};

const points = [
  { icon: Link2, title: "只要来源方链接", text: "官网、GitHub 仓库，或作者授权的镜像。" },
  { icon: Ban, title: "不收破解与修改版", text: "序列号、绿色版、捆绑推广的封装都不收。" },
  { icon: ListChecks, title: "提交后会怎样", text: "我们核对来源、许可和平台，补上适合与不适合，通过后才会进目录。" },
];

export default function SubmitPage() {
  return (
    <FormPage
      eyebrow="推荐"
      title="推荐一款工具"
      lead="你在用、觉得值得长期用的软件，告诉我们它是什么、在哪下、解决什么问题。"
      points={points}
      footnote={
        <>
          不确定收不收？先看
          <Link href="/about" className="ml-1 font-medium text-foreground ink-link">
            收录标准
          </Link>
          。
        </>
      }
    >
      <SubmitForm />
    </FormPage>
  );
}
