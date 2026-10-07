import type { Metadata } from "next";
import { EyeOff, Link2Off, MessageSquareText } from "lucide-react";

import { FeedbackForm } from "@/components/FeedbackForm";
import { FormPage } from "@/components/FormPage";
import { getSoftware } from "@/lib/catalog";
import { firstSearchParam, type PageSearchParams } from "@/lib/catalog-query";

export const metadata: Metadata = {
  title: "反馈",
  description: "条目纠错、站内问题或其他建议。",
};

type Props = {
  searchParams: Promise<PageSearchParams>;
};

const points = [
  { icon: Link2Off, title: "链接失效、介绍不对", text: "告诉我们是哪一款、哪里不对，最好附上正确的地址。" },
  { icon: MessageSquareText, title: "页面本身的问题", text: "打不开、显示错位、读屏读不出来，都算。" },
  { icon: EyeOff, title: "只有管理员能看到", text: "反馈不会公开，联系方式只用来回复你。" },
];

export default async function FeedbackPage({ searchParams }: Props) {
  const slug = firstSearchParam((await searchParams).item).trim().slice(0, 100);
  const item = slug ? await getSoftware(slug) : undefined;

  return (
    <FormPage
      eyebrow="反馈"
      title={item ? `反馈：${item.name}` : "发现问题，告诉我们"}
      lead="目录靠大家一起校对。发现链接失效、介绍不准，或者页面本身有问题，都可以在这里说。"
      points={points}
    >
      <FeedbackForm prefill={item ? { slug: item.slug, name: item.name } : undefined} />
    </FormPage>
  );
}
