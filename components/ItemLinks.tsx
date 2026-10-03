import type { ItemLinks as ItemLinksData } from "@/data/types";
import { isVerifiedMirror, linkChannels, otherChannels } from "@/lib/links";
import { MirrorNote, OutboundLink } from "./OutboundLink";

/** 旧路径的 host 工具，保留给页面里显示主域名。 */
export { hostOf } from "@/lib/links";

/** 除主渠道外还有几条可列的渠道。 */
export function otherLinkCount(links: ItemLinksData, primaryUrl: string): number {
  return otherChannels(links).filter((c) => c.url !== primaryUrl).length;
}

/**
 * 获取渠道：官网 → 产品主页 → GitHub → 已核验镜像。
 * 没有说明的镜像不展示 —— 无法核验的镜像与盗版网盘只有一线之隔。
 */
export function ItemLinks({ links, exclude, slug }: { links: ItemLinksData; exclude?: string; slug: string }) {
  const rows = linkChannels(links).filter((c) => c.url !== exclude && isVerifiedMirror(c));
  const mirror = rows.find((c) => c.role === "mirror");

  if (!rows.length) {
    return <p className="px-3 text-sm text-muted-foreground">暂未填写链接。</p>;
  }

  return (
    <div>
      <ul className="-mx-3 flex flex-col">
        {rows.map((channel) => (
          <li key={channel.id}>
            <OutboundLink channel={channel} slug={slug} />
          </li>
        ))}
      </ul>
      {mirror ? <MirrorNote note={mirror.note} /> : null}
    </div>
  );
}
