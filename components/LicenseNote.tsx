import { Scale } from "lucide-react";

import { describeLicense } from "@/lib/license-info";

/**
 * 许可证行：跟在渠道列表下方，**只要有可核验的 SPDX 就显示**。
 *
 * 为什么不按来源过滤：早期只给「开源」来源显示，理由是专有软件没有 SPDX 可写
 * （Obsidian、Figma、WPS），挂个「未知」比不显示更糟。但这条规则把两种情况混在一起了 ——
 * 「没有 SPDX」（不显示，正确）与「有 SPDX 但来源不是开源」（被吞掉，错误）：
 *   · DuckStation 是官方来源，许可 CC-BY-NC-ND-4.0（禁止商用、禁止改作），这行信息必须露出来；
 *   · SurrealDB / SpacetimeDB / EMQX 是 BSL 1.1（源码可见但非开源），
 *     把它们改判成官方之后，这条提示反而更该留着 —— 徽章不再说开源，许可行要说清限制。
 *
 * 为什么给一句人话：光有 `GPL-3.0` 这个编号，读者判断不了能不能用在自己
 * 的项目里。「允许商用闭源分发」才是他真正要的信息。
 *
 * 不加「许可证：」前缀：天平图标已经说明了这是什么，重复一遍是噪音。
 */
export function LicenseNote({ spdx }: { spdx?: string }) {
  const info = describeLicense(spdx);
  // 没有可核验的标识时不显示：留空说明「没核过」，写错说明「核错了」，
  // 两者都比一个编造的判断好。空状态由正文第 4 段承担（见 lib/semantics.ts）。
  if (!info) return null;

  return (
    <p className="mt-2 flex gap-2.5 rounded-xl bg-muted px-3 py-2.5 text-xs leading-relaxed">
      <Scale className="mt-px size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>
        {/* SPDX 编号用等宽：它是标识符不是正文，需要能逐字比对。 */}
        <span className="font-mono text-[11px] text-muted-foreground">{info.spdx}</span>
        <span className="text-muted-foreground"> · </span>
        <span className="text-foreground">{info.summary}</span>
      </span>
    </p>
  );
}
