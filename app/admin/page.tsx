import Link from "next/link";
import { ChevronLeft, ChevronRight, CircleCheck, CircleAlert, Plus } from "lucide-react";

import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, kindLabel } from "@/lib/items";
import { getCatalogAll } from "@/lib/store";
import { deleteItem, requireAdmin, setItemStatus } from "./actions";

export const metadata = {
  title: "条目",
};

const PAGE_SIZE = 20;

function StatusDot({ published }: { published: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <span
        className={`size-2 rounded-full ${published ? "bg-opensource" : "border border-muted-foreground"}`}
        aria-hidden="true"
      />
      {published ? "已发布" : "草稿"}
    </span>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; page?: string; e?: string }>;
}) {
  await requireAdmin();
  const { saved, page: pageParam, e } = await searchParams;
  const items = await getCatalogAll();
  const published = items.filter((i) => i.status === "published").length;
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), pageCount);
  const rows = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em]">条目</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            共 <span className="font-mono text-foreground tabular-nums">{items.length}</span> 条，已发布{" "}
            <span className="font-mono text-foreground tabular-nums">{published}</span> 条，草稿{" "}
            <span className="font-mono text-foreground tabular-nums">{items.length - published}</span> 条
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/items/new">
            <Plus />
            新建条目
          </Link>
        </Button>
      </div>

      {saved ? (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-opensource/10 px-3 py-2.5 text-[13px] font-medium text-opensource">
          <CircleCheck className="size-4" aria-hidden="true" />
          已保存，前台已更新。
        </p>
      ) : null}
      {e === "invalid" ? (
        <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-[13px] font-medium text-destructive">
          <CircleAlert className="size-4" aria-hidden="true" />
          参数无效，没有改动任何条目。
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <Table className="md:min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">名称</TableHead>
              <TableHead className="hidden md:table-cell">类型</TableHead>
              <TableHead className="hidden md:table-cell">来源</TableHead>
              <TableHead className="hidden sm:table-cell">状态</TableHead>
              <TableHead className="hidden md:table-cell">更新</TableHead>
              <TableHead className="pr-4 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.slug}>
                <TableCell className="whitespace-normal pl-4 md:whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <SoftwareIcon item={{ name: item.name, icon: item.icon, iconImage: item.iconImage }} size={32} />
                    <div className="min-w-0">
                      <Link href={`/admin/items/${item.slug}`} className="block font-medium hover:underline">
                        {item.name}
                      </Link>
                      <span className="block break-all font-mono text-xs text-muted-foreground">{item.slug}</span>
                      <span className="mt-1 block sm:hidden">
                        <StatusDot published={item.status === "published"} />
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{kindLabel[item.kind]}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <SourceBadge kind={item.source} plain />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <StatusDot published={item.status === "published"} />
                </TableCell>
                <TableCell className="hidden text-[13px] text-muted-foreground md:table-cell">{formatDate(item.updatedAt) || "—"}</TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/items/${item.slug}`}>编辑</Link>
                    </Button>
                    <form action={setItemStatus}>
                      <input type="hidden" name="slug" value={item.slug} />
                      <input
                        type="hidden"
                        name="status"
                        value={item.status === "published" ? "draft" : "published"}
                      />
                      <Button type="submit" variant="ghost" size="sm">
                        {item.status === "published" ? "下架" : "发布"}
                      </Button>
                    </form>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>删除「{item.name}」？</AlertDialogTitle>
                          <AlertDialogDescription>删除后不可恢复，前台会立即消失。只想暂时隐藏的话，用「下架」。</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <form action={deleteItem}>
                            <input type="hidden" name="slug" value={item.slug} />
                            <AlertDialogAction type="submit">删除</AlertDialogAction>
                          </form>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 ? (
        <nav aria-label="分页" className="mt-4 flex items-center justify-between text-[13px]">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin?page=${page - 1}`}>
                <ChevronLeft />
                上一页
              </Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="font-mono text-muted-foreground tabular-nums">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin?page=${page + 1}`}>
                下一页
                <ChevronRight />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
