/**
 * SPDX 许可证 → 一句人话。
 *
 * 目的是让不懂许可证的人也能判断「我能不能用在商业项目里」，而不是只给一个
 * 编号。措辞只回答「能不能闭源分发」这一个最常被问的问题，不做法律建议。
 *
 * 判定依据是 SPDX 的三个关键属性：
 *   - 强 copyleft（GPL / AGPL / LGPL / MPL）：衍生或分发时要开源
 *   - 弱 copyleft（LGPL / MPL）：改动部分要开源，链接不受影响
 *   - 宽松（MIT / BSD / Apache / ISC / PSF）：可闭源分发
 */

export type LicenseInfo = {
  /** SPDX 标识原样 */
  spdx: string;
  /** 一句话说明，只讲「能不能闭源商用」 */
  summary: string;
  /** 分三档，供 UI 决定强调程度 */
  tier: "permissive" | "weak-copyleft" | "strong-copyleft";
  /** 是否允许完全闭源分发（不含任何开源义务） */
  allowsClosedSource: boolean;
};

const TABLE: Record<string, Omit<LicenseInfo, "spdx">> = {
  // 宽松：可直接闭源商用
  MIT: { summary: "允许商用闭源分发", tier: "permissive", allowsClosedSource: true },
  "BSD-3-Clause": { summary: "允许商用闭源分发", tier: "permissive", allowsClosedSource: true },
  "BSD-2-Clause": { summary: "允许商用闭源分发", tier: "permissive", allowsClosedSource: true },
  ISC: { summary: "允许商用闭源分发", tier: "permissive", allowsClosedSource: true },
  "Apache-2.0": { summary: "允许商用闭源分发，需保留声明", tier: "permissive", allowsClosedSource: true },
  "PSF-2.0": { summary: "允许商用闭源分发", tier: "permissive", allowsClosedSource: true },
  Unlicense: { summary: "公有领域，可闭源分发", tier: "permissive", allowsClosedSource: true },
  "CC0-1.0": { summary: "公有领域，可闭源分发", tier: "permissive", allowsClosedSource: true },
  Zlib: { summary: "允许商用闭源分发", tier: "permissive", allowsClosedSource: true },
  "BSL-1.0": { summary: "允许商用闭源分发", tier: "permissive", allowsClosedSource: true },
  "0BSD": { summary: "公有领域等价", tier: "permissive", allowsClosedSource: true },

  // 弱 copyleft：改动部分开源，整体可闭源
  "LGPL-2.1": { summary: "改动需开源，动态链接不传染", tier: "weak-copyleft", allowsClosedSource: true },
  "LGPL-2.1-only": { summary: "改动需开源，动态链接不传染", tier: "weak-copyleft", allowsClosedSource: true },
  "LGPL-2.1-or-later": { summary: "改动需开源，动态链接不传染", tier: "weak-copyleft", allowsClosedSource: true },
  "LGPL-3.0": { summary: "改动需开源，动态链接不传染", tier: "weak-copyleft", allowsClosedSource: true },
  "LGPL-3.0-only": { summary: "改动需开源，动态链接不传染", tier: "weak-copyleft", allowsClosedSource: true },
  "LGPL-3.0-or-later": { summary: "改动需开源，动态链接不传染", tier: "weak-copyleft", allowsClosedSource: true },
  "MPL-2.0": { summary: "改动的文件需开源，整体可闭源", tier: "weak-copyleft", allowsClosedSource: true },

  // 强 copyleft：分发即需开源
  "GPL-2.0-only": { summary: "分发衍生作品需同样开源", tier: "strong-copyleft", allowsClosedSource: false },
  "GPL-2.0-or-later": { summary: "分发衍生作品需同样开源", tier: "strong-copyleft", allowsClosedSource: false },
  "GPL-3.0-only": { summary: "分发衍生作品需同样开源", tier: "strong-copyleft", allowsClosedSource: false },
  "GPL-3.0-or-later": { summary: "分发衍生作品需同样开源", tier: "strong-copyleft", allowsClosedSource: false },
  "AGPL-3.0-only": { summary: "分发甚至联网服务都需开源", tier: "strong-copyleft", allowsClosedSource: false },
  "AGPL-3.0-or-later": { summary: "分发甚至联网服务都需开源", tier: "strong-copyleft", allowsClosedSource: false },
};

/**
 * 无 `-only` / `-or-later` 后缀的 GPL 简写。
 * SPDX 允许这么写，但含义不明确（不表态能否用后续版本），因此提示语要说清这一点。
 */
const GPL_BARE = new Set(["GPL-2.0", "GPL-3.0", "AGPL-3.0", "LGPL-2.1", "LGPL-3.0"]);

/**
 * 双许可（`A OR B`）：用户任选其一，取其中**对使用者最宽松**的那个。
 *
 * LibreOffice 就是这种（MPLv2 或 LGPLv3+），两条都属弱 copyleft，
 * 读者关心的是「整体能不能闭源」，答案是能。
 */
function combineDual(spdx: string, parts: string[]): LicenseInfo | undefined {
  const infos = parts.map((part) => describeLicense(part));
  // 有一个认不出就不能整体推断 —— 宁可不给结论。
  if (infos.some((info) => !info)) return undefined;
  const known = infos as LicenseInfo[];
  // 取限制最松的那个：allowsClosedSource 优先，其次 tier 更宽松的。
  const best = known.find((info) => info.allowsClosedSource) ?? known[0];
  return {
    spdx,
    summary: `或选其一：${known.map((info) => info.spdx).join(" / ")}`,
    tier: best.tier,
    allowsClosedSource: known.some((info) => info.allowsClosedSource),
  };
}

/**
 * 查一个 SPDX 标识的说明。未知标识返回 undefined —— 宁可页面不显示，
 * 也不要给出一个可能错误的判断。
 */
export function describeLicense(spdx: string | undefined): LicenseInfo | undefined {
  const key = spdx?.trim();
  if (!key) return undefined;

  // 表达式形式：双许可（A OR B）、例外（WITH）。
  if (/\s+(OR|AND|WITH)\s+/i.test(key)) {
    const [left, op, right] = key.split(/\s+(OR|AND|WITH)\s+/i);
    if (op.toUpperCase() === "OR") return combineDual(key, [left, right]);
    // AND（双许可同时适用）与 WITH（附加例外）的判定需要逐个读原文，
    // 一条通用提示语会给出错误的宽松/严格判断，因此不推断。
    return undefined;
  }

  const hit = TABLE[key];
  if (hit) return { spdx: key, ...hit };
  if (GPL_BARE.has(key)) {
    return {
      spdx: key,
      summary: "分发衍生作品需同样开源，版本选择看原文",
      tier: "strong-copyleft",
      allowsClosedSource: false,
    };
  }
  return undefined;
}
