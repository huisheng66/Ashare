import { CircleAlert, CircleCheck, KeyRound, Plus, ShieldCheck, Trash2, UserRound, X } from "lucide-react";

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
import { formatDate } from "@/lib/items";
import { listUsers } from "@/lib/store";
import { permissionsOf, ROLE_LABEL, ROLES, type Permission, type PublicUser } from "@/lib/users";
import {
  createUser,
  removeUser,
  requirePermission,
  setUserEnabled,
  setUserPassword,
  setUserRole,
} from "../actions";

export const metadata = {
  title: "账号",
};

/** 每个角色的权限一句话说清。与 lib/users.ts 的 MATRIX 对应，不是另定一套。 */
const ROLE_PERMISSIONS: Record<string, string> = {
  admin: "全部权限",
  editor: "写草稿与处理投稿",
};

/**
 * 后台账号管理。
 *
 * 门禁是requirePermission("users")：编辑角色会在这一行被重定向走，
 * 所以页面里不必再到处判断「能不能」—— 能进来就意味着是管理员。
 *
 * **口令用表单明文输入，不用交互式隐藏输入。** 命令行那套隐藏输入在 HTTP 表单里
 * 做不到；而明文输入框的风险靠别的方式补：autocomplete="new-password" 让浏览器
 * 不保存、不 autofill，表单提交后立刻 revalidate，页面上不留任何回显。
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const actor = await requirePermission("users");
  const { ok, e } = await searchParams;
  const users = await listUsers();

  /**
   * 引导账号（env-admin）是**虚拟的**：只在 lib/auth.ts 的常量里存在，账号表里没有它。
   *
   * 所以用它在引导模式下登录时，列表里不会出现它 —— 用户会以为登录出了问题。
   * 这里显式说明它在哪、怎么换成真账号，而不是让人对着列表猜。
   */
  const usingBootstrap = !users.some((user) => user.username === actor.username);

  const okMessage: Record<string, string> = {
    created: "账号已创建。",
    password: "口令已重置。",
    enabled: "账号已启用。",
    disabled: "账号已停用。",
    role: "角色已更新。",
    removed: "账号已删除。",
  };
  const errorMessage: Record<string, string> = {
    "bad-username": "账号名需为 2–64 位小写字母、数字或中划线，且以字母或数字开头。",
    "bad-role": "角色只能是管理员或编辑。",
    "bad-password": "口令至少 12 个字符（上限 1024）。",
    "bad-name": "显示名最长 64 个字符。",
    exists: "该账号名已被占用。",
    missing: "账号不存在，可能已被别人删除。",
    "self-disable": "不能停用自己 —— 那会把你锁在门外。请让另一位管理员操作。",
    "self-remove": "不能删除自己。",
    "self-demote": "不能把自己降为编辑 —— 那会让人失去账号管理权限。",
    forbidden: "当前角色没有账号管理权限。",
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.01em]">账号</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            共 <span className="font-mono text-foreground tabular-nums">{users.length}</span> 个账号，
            启用中 <span className="font-mono text-foreground tabular-nums">{users.filter((u) => !u.disabled).length}</span> 个。
            停用后该账号立即无法登录。
          </p>
        </div>
      </div>

      {ok && okMessage[ok] ? (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-opensource/10 px-3 py-2.5 text-[13px] font-medium text-opensource">
          <CircleCheck className="size-4" aria-hidden="true" />
          {okMessage[ok]}
        </p>
      ) : null}
      {e && errorMessage[e] ? (
        <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-[13px] font-medium text-destructive">
          <CircleAlert className="size-4" aria-hidden="true" />
          {errorMessage[e]}
        </p>
      ) : null}

      {usingBootstrap ? (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-brand/10 px-3 py-2.5 text-[13px] text-foreground">
          <ShieldCheck className="mt-px size-4 shrink-0 text-brand" aria-hidden="true" />
          <span>
            你正用<strong className="font-semibold">环境变量管理员</strong>（引导账号）登录，
            它不在下面的列表里 —— 账号表为空时用它兜底。
            建出第一个管理员后建议改用账号登录，并清掉
            <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">ADMIN_PASSWORD_HASH</code>。
          </span>
        </p>
      ) : null}

      {users.length === 0 ? (
        <p className="mt-6 flex items-start gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-[13px] text-muted-foreground">
          <UserRound className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span>
            还没有任何账号。此时后台仍可用环境变量
            <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">ADMIN_PASSWORD_HASH</code>
            登录（引导模式）。建出第一个账号后，建议改用账号登录并清掉该变量。
          </span>
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <Table className="md:min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">账号</TableHead>
                <TableHead className="hidden sm:table-cell">角色</TableHead>
                <TableHead className="hidden lg:table-cell">最近登录</TableHead>
                <TableHead className="pr-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <UserRow key={user.username} user={user} isSelf={user.username === actor.username} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RoleMatrix />

      <details className="mt-8 rounded-2xl border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-2xl px-5 py-4 text-sm font-medium marker:content-none hover:bg-muted/40">
          <Plus className="size-4" aria-hidden="true" />
          新建账号
        </summary>
        <form action={createUser} className="space-y-5 border-t border-border px-5 py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">账号名</span>
              <input
                name="username"
                required
                minLength={2}
                maxLength={64}
                pattern="[a-z0-9][a-z0-9-]{1,63}"
                autoComplete="off"
                placeholder="zhangsan"
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-foreground focus-visible:ring-4 focus-visible:ring-foreground/8"
              />
              <span className="block text-xs text-muted-foreground">2–64 位小写字母、数字或中划线，用于登录。</span>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">显示名</span>
              <input
                name="displayName"
                maxLength={64}
                autoComplete="off"
                placeholder="张三"
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-foreground focus-visible:ring-4 focus-visible:ring-foreground/8"
              />
              <span className="block text-xs text-muted-foreground">后台里显示的名字，留空则用账号名。</span>
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">角色</legend>
            <div className="flex flex-wrap gap-3">
              {ROLES.map((role) => (
                <label
                  key={role}
                  className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3.5 has-checked:border-foreground/25 has-checked:bg-muted"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    defaultChecked={role === "editor"}
                    className="size-4 accent-foreground"
                  />
                  <span className="text-sm">
                    {ROLE_LABEL[role]}
                    <span className="ml-2 text-xs text-muted-foreground">{ROLE_PERMISSIONS[role]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-2">
            <span className="text-sm font-medium">初始口令</span>
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={1024}
              autoComplete="new-password"
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-foreground focus-visible:ring-4 focus-visible:ring-foreground/8"
            />
            <span className="block text-xs text-muted-foreground">
              至少 12 个字符。提交后只存 scrypt 哈希，页面不会回显。
            </span>
          </label>

          <div className="flex justify-end">
            <Button type="submit">创建账号</Button>
          </div>
        </form>
      </details>
    </div>
  );
}

/** 一行账号：角色可改、启停可切、口令可重置、账号可删（自己除外）。 */
function UserRow({ user, isSelf }: { user: PublicUser; isSelf: boolean }) {
  return (
    <TableRow>
      <TableCell className="whitespace-normal pl-4 md:whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="font-medium">{user.displayName}</span>
          {isSelf ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">这是你</span>
          ) : null}
          {user.disabled ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
              已停用
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{user.username}</p>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <form action={setUserRole} className="flex items-center gap-2">
          <input type="hidden" name="username" value={user.username} />
          <select
            name="role"
            defaultValue={user.role}
            // 改自己的角色会被服务端挡下（self-demote），这里直接不给选项。
            disabled={isSelf}
            aria-label={`${user.displayName} 的角色`}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-[13px] outline-none focus-visible:border-foreground disabled:opacity-60"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
          {!isSelf ? (
            <Button type="submit" size="sm" variant="outline">
              改
            </Button>
          ) : null}
        </form>
        <p className="mt-1 text-[11px] text-muted-foreground">{ROLE_PERMISSIONS[user.role]}</p>
      </TableCell>

      <TableCell className="hidden lg:table-cell text-[13px] text-muted-foreground">
        {user.lastLoginAt ? formatDate(user.lastLoginAt) : "从未登录"}
      </TableCell>

      <TableCell className="pr-4">
        <div className="flex items-center justify-end gap-1.5">
          <form action={setUserEnabled}>
            <input type="hidden" name="username" value={user.username} />
            <input type="hidden" name="enabled" value={user.disabled ? "1" : "0"} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              // 自己不能停用：服务端也会挡，这里先不让点。
              disabled={isSelf && !user.disabled}
              title={isSelf && !user.disabled ? "不能停用自己" : undefined}
            >
              {user.disabled ? "启用" : "停用"}
            </Button>
          </form>

          <details className="relative">
            <summary className="inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground marker:content-none hover:bg-muted hover:text-foreground">
              <KeyRound className="size-4" aria-hidden="true" />
              <span className="sr-only">重置 {user.displayName} 的口令</span>
            </summary>
            <form
              action={setUserPassword}
              className="absolute right-0 z-20 mt-1.5 w-64 space-y-2.5 rounded-xl border border-border bg-popover p-3 shadow-lift"
            >
              <input type="hidden" name="username" value={user.username} />
              <label className="block space-y-1.5">
                <span className="text-xs font-medium">新口令</span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  maxLength={1024}
                  autoComplete="new-password"
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-foreground"
                />
              </label>
              <div className="flex justify-end gap-1.5">
                <Button type="submit" size="sm">
                  重置
                </Button>
              </div>
            </form>
          </details>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={isSelf}
                title={isSelf ? "不能删除自己" : undefined}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="sr-only">删除 {user.displayName}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>删除账号 {user.displayName}？</AlertDialogTitle>
                <AlertDialogDescription>
                  该账号立即无法登录，此操作不能撤销。条目内容不受影响，历史审计里仍能查到是谁操作的。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <form action={removeUser}>
                    <input type="hidden" name="username" value={user.username} />
                    <Button type="submit" variant="destructive">
                      删除
                    </Button>
                  </form>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** 把权限矩阵显式列出：角色差别只有两行，但说不清就会变成「凭感觉授权」。 */
function RoleMatrix() {
  const label: Record<Permission, string> = {
    edit: "写草稿",
    publish: "发布上下线",
    moderate: "处理投稿与反馈",
    users: "管理账号",
  };
  const all: Permission[] = ["edit", "publish", "moderate", "users"];
  return (
    <section aria-labelledby="role-matrix" className="mt-8">
      <h2 id="role-matrix" className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="size-4" aria-hidden="true" />
        角色能做什么
      </h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-muted/50 text-[12px] text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">权限</th>
              {ROLES.map((role) => (
                <th key={role} scope="col" className="px-4 py-2.5 text-center font-medium">
                  {ROLE_LABEL[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {all.map((permission) => (
              <tr key={permission}>
                <th scope="row" className="px-4 py-2.5 text-left font-normal">
                  {label[permission]}
                </th>
                {ROLES.map((role) => (
                  <td key={role} className="px-4 py-2.5 text-center">
                    {permissionsOf(role).includes(permission) ? (
                      <CircleCheck className="mx-auto size-4 text-opensource" aria-label="可以" />
                    ) : (
                      <X className="mx-auto size-4 text-muted-foreground/40" aria-label="不可以" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">
        编辑能处理投稿与反馈，但不能发布、不能改已发布条目、也不能管账号。
      </p>
    </section>
  );
}