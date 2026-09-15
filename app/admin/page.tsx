import Link from "next/link";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { kindLabel, sourceLabel } from "@/lib/items";
import { getCatalogAll } from "@/lib/store";
import { deleteItem, requireAdmin, setItemStatus } from "./actions";

export const metadata = {
  title: "条目",
};

const PAGE_SIZE = 20;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; page?: string }>;
}) {
  await requireAdmin();
  const { saved, page: pageParam } = await searchParams;
  const items = await getCatalogAll();
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), pageCount);
  const rows = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {saved ? (
        <p className="mb-4 rounded-lg bg-opensource/10 px-3 py-2 text-[13px] text-opensource">
          已保存，前台已更新。
        </p>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          共 {items.length} 条，其中已发布{" "}
          {items.filter((i) => i.status === "published").length} 条
          {pageCount > 1 ? `（第 ${page} / ${pageCount} 页）` : ""}
        </p>
        <Button asChild size="sm">
          <Link href="/admin/items/new">新建条目</Link>
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.slug}>
                <TableCell>
                  <Link
                    href={`/admin/items/${item.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {item.name}
                  </Link>
                  <span className="ml-2 text-muted-foreground">
                    /{item.slug}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {kindLabel[item.kind]}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sourceLabel[item.source]}
                </TableCell>
                <TableCell>
                  {item.status === "published" ? (
                    <Badge className="border-transparent bg-opensource/10 text-opensource">
                      已发布
                    </Badge>
                  ) : (
                    <Badge variant="secondary">草稿</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/items/${item.slug}`}>编辑</Link>
                    </Button>
                    <form action={setItemStatus}>
                      <input type="hidden" name="slug" value={item.slug} />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          item.status === "published" ? "draft" : "published"
                        }
                      />
                      <Button type="submit" variant="ghost" size="sm">
                        {item.status === "published" ? "下架" : "发布"}
                      </Button>
                    </form>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            删除「{item.name}」？
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            删除后不可恢复，前台会立即消失。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <form action={deleteItem}>
                            <input
                              type="hidden"
                              name="slug"
                              value={item.slug}
                            />
                            <AlertDialogAction type="submit">
                              删除
                            </AlertDialogAction>
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
        <div className="mt-4 flex items-center justify-between text-[13px]">
          {page > 1 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin?page=${page - 1}`}>‹ 上一页</Link>
            </Button>
          ) : (
            <span className="px-3 text-muted-foreground opacity-40">
              ‹ 上一页
            </span>
          )}
          <span className="text-muted-foreground">
            第 {page} / {pageCount} 页
          </span>
          {page < pageCount ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin?page=${page + 1}`}>下一页 ›</Link>
            </Button>
          ) : (
            <span className="px-3 text-muted-foreground opacity-40">
              下一页 ›
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
