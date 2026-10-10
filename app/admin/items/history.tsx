
import { CircleAlert, CircleCheck } from "lucide-react";

import { HistoryPanel, type RevisionRow } from "@/components/HistoryPanel";
import { currentUser } from "@/lib/auth";
import { getRevisionAt, listRevisions } from "@/lib/store";
import { can } from "@/lib/users";

/**
 * 条目改动历史（服务端容器）。
 *
 * 查历史需要在服务端做：还原每一版要把整条链重放一遍，客户端做不了也没必要
 * （历史最多 20 版，一次算完传下去，展开交互才不用往返）。
 *
 * **回滚用编辑权限之外的publish 权限**：回滚会覆盖当前内容，
 * 编辑可以改内容、但不该决定「回到哪个版本」—— 那更接近发布决策。
 */
export async function ItemHistory({
  slug,
  currentVersion,
  restored,
  error,
}: {
  slug: string;
  currentVersion?: number;
  /** 刚回滚到的版本号，用于成功提示。 */
  restored?: string;
  /** 回滚失败的错误码。 */
  error?: string;
}) {
  const [revisions, actor] = await Promise.all([listRevisions(slug), currentUser()]);
  const canRollback = actor ? can(actor.role, "publish") : false;

  // 每一版都要重放出完整内容供「查看这一版」使用。
  const rows: RevisionRow[] = [];
  for (const revision of revisions) {
    const item = await getRevisionAt(slug, revision.rowVersion);
    if (!item) continue;
    rows.push({
      rowVersion: revision.rowVersion,
      action: revision.action,
      summary: revision.summary,
      actor: revision.actor,
      at: revision.at,
      fields: revision.fields,
      item: {
        name: item.name,
        summary: item.summary,
        status: item.status,
        tags: item.tags,
        scenes: item.scenes,
        platforms: item.platforms,
        whoFor: item.whoFor,
        whoNot: item.whoNot,
        body: item.body,
      },
    });
  }

  return (
    <>
      {restored ? (
        <p
          role="status"
          className="mt-6 flex items-center gap-2 rounded-xl bg-opensource/10 px-3 py-2.5 text-[13px] font-medium text-opensource"
        >
          <CircleCheck className="size-4" aria-hidden="true" />
          已回滚到第 {restored} 版。中间那些版本仍在历史里。
        </p>
      ) : null}
      {error === "no-history" ? (
        <p
          role="alert"
          className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-[13px] font-medium text-destructive"
        >
          <CircleAlert className="size-4" aria-hidden="true" />
          找不到那个版本，它可能已被保留策略清理。
        </p>
      ) : null}
      {error === "conflict" ? (
        <p
          role="alert"
          className="mt-6 flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-[13px] font-medium text-destructive"
        >
          <CircleAlert className="size-4" aria-hidden="true" />
          回滚失败：这条刚被别人改过，请刷新后再试。
        </p>
      ) : null}

      <HistoryPanel
        slug={slug}
        revisions={rows}
        canRollback={canRollback}
        currentVersion={currentVersion}
      />
    </>
  );
}