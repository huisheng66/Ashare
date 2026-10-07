import { Scale } from "lucide-react";

import { describeLicense } from "@/lib/license-info";

/**
 * 许可证行：跟在渠道列表下方，只给开源项目显示。
 *
 * 为什么只给开源项目：专有软件没有 SPDX 标识可写（Obsidian、Figma、WPS），
 * 非商业免费的 GeoGebra 是自家许可、SPDX 里没有对应项。给它们挂一个
 * 「未知」比不显示更糟——读者会以为是核验过但漏了。
 *
 * 为什么给一句人话：光有 `GPL-3.0` 这个编号，读者判断不了能不能用在自己
 * 的项目里。「允许商用闭源分发」才是他真正要的信息。
 *
 * 不加「许可证：」前缀：天平图标已经说明了这是什么，重复一遍是噪音。
 */
export function LicenseNote({ spdx, source }: { spdx?: string; source: string }) {
  // 只有开源项目才显示。source 是数据里的事实字段，不靠 license 是否存在来判断。
  if (source !== "opensource") return null;

  const info = describeLicense(spdx);
  // 有开源来源但许可证查不到时也不显示：留空说明「没核过」，写错说明「核错了」，
  // 两者都比一个编造的判断好。空状态由正文第 4 段承担。
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
