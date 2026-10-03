import Link from "next/link";
import { BarChart3, ExternalLink, MousePointerClick } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { Eyebrow, SectionHeading } from "@/components/SectionHeading";
import { SourceBadge } from "@/components/SourceBadge";
import { Button } from "@/components/ui/button";
import { allPublished } from "@/lib/catalog";
import { channelTotals, dailySeries, itemClickRows, shortDay, type ItemClickRow } from "@/lib/click-analytics";
import { scanClicks } from "@/lib/click-store";
import { kindLabel } from "@/lib/items";
import { requireAdmin } from "../actions";

export const metadata = {
  title: "点击数据",
};

const TREND_DAYS = 14;

/** 百分比一律用 tabular-nums 等宽渲染，避免数字跳动。 */
function Percent({ value }: { value: number }) {
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      {(value * 100).toFixed(value >= 0.1 ? 0 : 1)}%
    </span>
  );
}

function Metric({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Trend({ data }: { data: { day: string; count: number }[] }) {
  const peak = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <div className="flex h-28 items-end gap-1" role="img" aria-label={`最近 ${data.length} 天每日点击数`}>
        {data.map((point) => (
          <div key={point.day} className="group relative flex-1">
            <div
              className="rounded-t-md bg-brand/70 transition-colors group-hover:bg-brand"
              style={{ height: `${Math.max((point.count / peak) * 100, point.count > 0 ? 4 : 1)}%` }}
            />
            <span className="sr-only">
              {shortDay(point.day)}：{point.count} 次
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{shortDay(data[0].day)}</span>
        <span>峰值 {peak} 次/天</span>
        <span>今天</span>
      </div>
    </div>
  );
}

function ChannelBar({ row, max }: { row: ItemClickRow; max: number }) {
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
      {row.breakdown.map((part, index) => (
        <span
          key={part.channel}
          className={index === 0 ? "bg-foreground" : "bg-muted-foreground/45"}
          style={{ width: `${(part.count / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default async function ClicksPage() {
  await requireAdmin();
  const [scan, published] = await Promise.all([scanClicks(), allPublished()]);
  const rows = itemClickRows(scan.byChannel.values(), published);
  const totals = channelTotals(rows);
  const trend = dailySeries(scan.byDay, TREND_DAYS);
  const peakRow = rows[0]?.total ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <Eyebrow>后台</Eyebrow>
        <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.01em]">点击数据</h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          用户点了「前往官网」或渠道行的次数。只记录条目与渠道，不存 IP，也不存访客身份。
        </p>
      </div>

      {scan.total === 0 ? (
        <EmptyState
          icon={MousePointerClick}
          title="还没有点击记录"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">回到条目</Link>
            </Button>
          }
        >
          统计从用户点击详情页的外链开始累计。数据写入
          <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">data/store/clicks.jsonl</code>
          ，首次点击后刷新本页即可看到。
        </EmptyState>
      ) : (
        <>
          <section aria-labelledby="click-metrics" className="space-y-4">
            <h2 id="click-metrics" className="sr-only">
              总体指标
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="总点击" value={scan.total} hint="全部渠道累计" />
              <Metric label="被点击条目" value={rows.length} hint={`共 ${published.length} 条在架`} />
              <Metric label="最常走" value={totals[0]?.label ?? "—"} hint={totals[0] ? `${totals[0].count} 次` : undefined} />
              <Metric
                label="最近 14 天"
                value={trend.reduce((sum, d) => sum + d.count, 0)}
                hint={`峰值 ${Math.max(...trend.map((d) => d.count), 0)} 次/天`}
              />
            </div>
            {/* 超出扫描上限时如实说明，不把部分数据说成全量。 */}
            {scan.skipped > 0 ? (
              <p className="text-[12px] text-muted-foreground">
                已跳过 {scan.skipped} 条无法解析或超出扫描上限的记录，下方为最近一段的统计。
              </p>
            ) : null}
          </section>

          <section aria-labelledby="click-trend">
            <SectionHeading
              id="click-trend"
              title="每日趋势"
              description="按北京时间分天；没有点击的日期补零，不跳过。"
            />
            <div className="mt-4 rounded-2xl border border-border bg-card px-4 py-5">
              <Trend data={trend} />
            </div>
          </section>

          {totals.length > 1 ? (
            <section aria-labelledby="click-channels">
              <SectionHeading
                id="click-channels"
                title="渠道构成"
                description="用户更常直接去官网，还是绕到仓库或镜像。"
              />
              <ul className="mt-4 space-y-2.5">
                {totals.map((item) => (
                  <li key={item.channel} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-[13px]">{item.label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground"
                        style={{ width: `${(item.count / totals[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums">
                      {item.count}
                    </span>
                    <span className="w-12 shrink-0 text-right">
                      <Percent value={item.count / scan.total} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="click-items">
            <SectionHeading
              id="click-items"
              title="条目明细"
              description="条目的点击总量与渠道拆分。标为「已删除」的 slug 说明条目不在目录里了。"
            />
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-border bg-muted/50 text-[12px] text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">条目</th>
                    <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">渠道拆分</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">点击</th>
                    <th scope="col" className="hidden px-4 py-2.5 text-right font-medium md:table-cell">占比</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.slug} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.name ? (
                            <Link
                              href={`/software/${row.slug}`}
                              className="font-medium underline-offset-2 hover:underline"
                            >
                              {row.name}
                            </Link>
                          ) : (
                            <span className="font-medium text-muted-foreground">已删除条目</span>
                          )}
                          {row.source ? <SourceBadge kind={row.source} /> : null}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[11px] text-muted-foreground">
                          <span>{row.slug}</span>
                          {row.kind ? <span>· {kindLabel[row.kind]}</span> : null}
                          {row.scenes?.length ? <span>· {row.scenes.join(" / ")}</span> : null}
                        </p>
                        {/* 窄屏没有渠道列，把拆分折到条目下方。 */}
                        <p className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground sm:hidden">
                          {row.breakdown.map((part) => (
                            <span key={part.channel}>
                              {part.label} {part.count}
                            </span>
                          ))}
                        </p>
                      </td>
                      <td className="hidden w-40 px-4 py-3 sm:table-cell">
                        <ChannelBar row={row} max={peakRow} />
                        <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                          {row.breakdown
                            .map((part) => `${part.label} ${part.count}`)
                            .join(" · ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">{row.total}</td>
                      <td className="hidden px-4 py-3 text-right md:table-cell">
                        <Percent value={row.share} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <BarChart3 className="size-3.5" aria-hidden="true" />
              按点击总量降序，列出所有有记录的条目。
              <Link href="/admin" className="underline underline-offset-2">
                <span className="inline-flex items-center gap-0.5">
                  管理条目
                  <ExternalLink className="size-3" aria-hidden="true" />
                </span>
              </Link>
            </p>
          </section>
        </>
      )}
    </div>
  );
}
