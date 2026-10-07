import { Inbox, MessageSquare, ShieldBan } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { kindLabel } from "@/lib/items";
import { getBlocks, getFeedback, getSubmissions } from "@/lib/store";
import {
  convertSubmission,
  deleteFeedback,
  deleteSubmission,
  markFeedbackRead,
  requireAdmin,
  unblockIp,
} from "../actions";

export const metadata = {
  title: "投稿与反馈",
};

const feedbackTypes: Record<string, string> = {
  correction: "条目纠错",
  issue: "站内问题",
  other: "其他",
};

const timeFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTime(value: string | number) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : timeFormat.format(date);
}

function DeleteButton({
  action,
  hidden,
  label = "删除",
}: {
  action: (fd: FormData) => Promise<void>;
  hidden: Record<string, string>;
  label?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认{label}？</AlertDialogTitle>
          <AlertDialogDescription>该操作不可恢复。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form action={action}>
            {Object.entries(hidden).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <AlertDialogAction type="submit">{label}</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Panel({
  id,
  icon: Icon,
  title,
  meta,
  empty,
  children,
}: {
  id: string;
  icon: typeof Inbox;
  title: string;
  meta: React.ReactNode;
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg border border-border bg-card" aria-hidden="true">
          <Icon className="size-4" />
        </span>
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{meta}</span>
      </div>
      {children ? (
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">{children}</ul>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">
          {empty}
        </p>
      )}
    </section>
  );
}

export default async function InboxPage() {
  await requireAdmin();
  const [submissions, feedback, blocks] = await Promise.all([
    getSubmissions(),
    getFeedback(),
    getBlocks(),
  ]);
  const activeBlocks = Object.entries(blocks).filter(
    // eslint-disable-next-line react-hooks/purity -- Server Component，读当前时间是有意为之
    ([, until]) => until > Date.now(),
  );
  const unread = feedback.filter((f) => !f.read).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em]">投稿与反馈</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">投稿核对后可一键转为草稿条目；反馈处理完记得标记已读。</p>
      </div>

      <Panel id="submissions-title" icon={Inbox} title="投稿" meta={submissions.length} empty="暂无投稿。">
        {submissions.length
          ? submissions.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{kindLabel[s.kind]}</span>
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{s.url}</p>
                  <p className="mt-2 text-sm leading-relaxed">{s.need}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{formatTime(s.at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <form action={convertSubmission}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="outline" size="sm">
                      转为条目
                    </Button>
                  </form>
                  <DeleteButton action={deleteSubmission} hidden={{ id: s.id }} />
                </div>
              </li>
            ))
          : null}
      </Panel>

      <Panel
        id="feedback-title"
        icon={MessageSquare}
        title="反馈"
        meta={unread ? `${feedback.length} · 未读 ${unread}` : feedback.length}
        empty="暂无反馈。"
      >
        {feedback.length
          ? feedback.map((f) => (
              <li key={f.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
                    {f.read ? null : (
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
                        未读
                      </span>
                    )}
                    <span>{feedbackTypes[f.type] ?? f.type}</span>
                    {f.slug ? <span className="font-mono text-xs">{f.slug}</span> : null}
                    {f.contact ? <span className="break-all">· {f.contact}</span> : null}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{f.content}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{formatTime(f.at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!f.read ? (
                    <form action={markFeedbackRead}>
                      <input type="hidden" name="id" value={f.id} />
                      <Button type="submit" variant="outline" size="sm">
                        标记已读
                      </Button>
                    </form>
                  ) : null}
                  <DeleteButton action={deleteFeedback} hidden={{ id: f.id }} />
                </div>
              </li>
            ))
          : null}
      </Panel>

      <Panel id="blocks-title" icon={ShieldBan} title="IP 封禁" meta={activeBlocks.length} empty="当前没有生效的封禁。">
        {activeBlocks.length
          ? activeBlocks.map(([ip, until]) => (
              <li key={ip} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="flex-1 text-[13px]">
                  <span className="font-mono">{ip}</span>
                  <span className="ml-2 text-muted-foreground">至 {formatTime(until)}</span>
                </span>
                <form action={unblockIp}>
                  <input type="hidden" name="ip" value={ip} />
                  <Button type="submit" variant="ghost" size="sm">
                    解封
                  </Button>
                </form>
              </li>
            ))
          : null}
      </Panel>
    </div>
  );
}
