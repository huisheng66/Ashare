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
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold">
          投稿（{submissions.length}）
        </h2>
        {submissions.length ? (
          <Card className="mt-3 gap-0 overflow-hidden py-0">
            <ul className="divide-y divide-border">
              {submissions.map((s) => (
                <li key={s.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      [{kindLabel[s.kind]}] {s.name}
                    </p>
                    <p className="break-all text-[13px] text-primary">{s.url}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {s.need}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(s.at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <form action={convertSubmission}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        转为条目
                      </Button>
                    </form>
                    <DeleteButton
                      action={deleteSubmission}
                      hidden={{ id: s.id }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <p className="mt-3 text-[13px] text-muted-foreground">暂无投稿。</p>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold">
          反馈（{feedback.length}，未读 {feedback.filter((f) => !f.read).length}）
        </h2>
        {feedback.length ? (
          <Card className="mt-3 gap-0 overflow-hidden py-0">
            <ul className="divide-y divide-border">
              {feedback.map((f) => (
                <li key={f.id} className="flex items-start gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-muted-foreground">
                      {feedbackTypes[f.type] ?? f.type}
                      {f.slug ? ` · ${f.slug}` : ""}
                      {f.contact ? ` · ${f.contact}` : ""}
                      {f.read ? "" : " · 未读"}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{f.content}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(f.at).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!f.read ? (
                      <form action={markFeedbackRead}>
                        <input type="hidden" name="id" value={f.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          标记已读
                        </Button>
                      </form>
                    ) : null}
                    <DeleteButton action={deleteFeedback} hidden={{ id: f.id }} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <p className="mt-3 text-[13px] text-muted-foreground">暂无反馈。</p>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold">
          IP 封禁（{activeBlocks.length}）
        </h2>
        {activeBlocks.length ? (
          <Card className="mt-3 gap-0 overflow-hidden py-0">
            <ul className="divide-y divide-border">
              {activeBlocks.map(([ip, until]) => (
                <li
                  key={ip}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <span className="flex-1 text-[13px]">
                    {ip}（至 {new Date(until).toLocaleString("zh-CN")}）
                  </span>
                  <form action={unblockIp}>
                    <input type="hidden" name="ip" value={ip} />
                    <Button type="submit" variant="ghost" size="sm">
                      解封
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <p className="mt-3 text-[13px] text-muted-foreground">
            当前没有生效的封禁。
          </p>
        )}
      </section>
    </div>
  );
}
