import Link from "next/link";
import { notFound } from "next/navigation";

import { DraftKeeper } from "@/components/DraftKeeper";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { scenes } from "@/data/scenes";
import type { Software } from "@/data/types";
import { getCatalogAll } from "@/lib/store";
import { kindLabel, platformLabel, sourceLabel } from "@/lib/items";
import { requireAdmin, saveItem } from "../../actions";

export const metadata = {
  title: "编辑条目",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    e?: string;
    name?: string;
    kind?: string;
    url?: string;
    note?: string;
  }>;
};

const selectCls =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const cell = "flex flex-col gap-1.5";
const hintCls = "text-[12px] font-medium text-muted-foreground";

const GIT_HOSTS = /(^|\.)github\.com$|^gitlab\.com$|^gitee\.com$|^codeberg\.org$/;

function Check({
  name,
  value,
  defaultChecked,
  children,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex h-7 items-center gap-1.5 text-[13px]">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-3.5 accent-primary"
      />
      {children}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-4 p-4">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

export default async function ItemFormPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const {
    e,
    name: prefillName,
    kind: prefillKind,
    url: prefillUrl,
    note: prefillNote,
  } = await searchParams;
  const isNew = id === "new";
  const item = isNew
    ? undefined
    : (await getCatalogAll()).find((i) => i.slug === id);
  if (!isNew && !item) notFound();

  // 投稿转条目：主链接按主机归到 GitHub 或官网
  let prefillGithub = "";
  let prefillOfficial = "";
  if (prefillUrl) {
    try {
      prefillGithub = GIT_HOSTS.test(new URL(prefillUrl).host) ? prefillUrl : "";
    } catch {
      prefillGithub = "";
    }
    prefillOfficial = prefillGithub ? "" : prefillUrl;
  }

  return (
    <form action={saveItem} id="item-form" className="pb-16">
      <DraftKeeper formId="item-form" storageKey={isNew ? "new" : item!.slug} />
      {item ? (
        <input type="hidden" name="originalSlug" value={item.slug} />
      ) : null}

      {e ? (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
          {e}
        </p>
      ) : null}
      {isNew && prefillName ? (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-[13px] text-primary">
          已带入投稿「{prefillName}」的内容，核对后保存即可上架。
        </p>
      ) : null}

      <Section title="基本">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="名称 *" htmlFor="f-name">
            <Input
              id="f-name"
              name="name"
              required
              defaultValue={item?.name ?? prefillName}
            />
          </Field>
          <Field label="slug（URL，小写字母数字中划线）*" htmlFor="f-slug">
            <Input id="f-slug" name="slug" required defaultValue={item?.slug} />
          </Field>
          <Field label="中文名（可选）" htmlFor="f-nameZh">
            <Input id="f-nameZh" name="nameZh" defaultValue={item?.nameZh} />
          </Field>
          <Field label="别名（逗号分隔，用于搜索）" htmlFor="f-aliases">
            <Input
              id="f-aliases"
              name="aliases"
              defaultValue={item?.aliases.join("，")}
            />
          </Field>
          <Field label="类型" htmlFor="f-kind">
            <select
              id="f-kind"
              name="kind"
              defaultValue={item?.kind ?? prefillKind ?? "app"}
              className={selectCls}
            >
              {Object.entries(kindLabel).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </Field>
          <Field label="来源徽章" htmlFor="f-source">
            <select
              id="f-source"
              name="source"
              defaultValue={item?.source ?? "official"}
              className={selectCls}
            >
              {Object.entries(sourceLabel).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="价格（卡片展示，如 免费 / 会员 ¥68/月；留空按免费）"
            htmlFor="f-price"
          >
            <Input id="f-price" name="price" defaultValue={item?.price} />
          </Field>
          <Field label="状态" htmlFor="f-status">
            <select
              id="f-status"
              name="status"
              defaultValue={item?.status ?? "draft"}
              className={selectCls}
            >
              <option value="draft">草稿（前台不可见）</option>
              <option value="published">已发布</option>
            </select>
          </Field>
          <Field label="标签（逗号分隔，最多展示 3 个）" htmlFor="f-tags">
            <Input id="f-tags" name="tags" defaultValue={item?.tags.join("，")} />
          </Field>
        </div>
        <div className="mt-3">
          <Check name="featured" value="on" defaultChecked={item?.featured}>
            精选（卡片显示 NEW）
          </Check>
        </div>
      </Section>

      <Section title="文案">
        <div className="grid gap-3">
          <Field label="一句话简介 *（卡片两行展示）" htmlFor="f-summary">
            <Input
              id="f-summary"
              name="summary"
              required
              defaultValue={item?.summary ?? prefillNote}
            />
          </Field>
          <Field
            label="详细介绍（纯文本，空行分段，不解析 HTML）"
            htmlFor="f-body"
          >
            <Textarea
              id="f-body"
              name="body"
              rows={6}
              defaultValue={item?.body}
            />
          </Field>
          <Field label="使用教程（每行一步）" htmlFor="f-tutorial">
            <Textarea
              id="f-tutorial"
              name="tutorial"
              rows={5}
              defaultValue={item?.tutorial.join("\n")}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="适合" htmlFor="f-whoFor">
              <Textarea
                id="f-whoFor"
                name="whoFor"
                rows={2}
                defaultValue={item?.whoFor}
              />
            </Field>
            <Field label="不适合" htmlFor="f-whoNot">
              <Textarea
                id="f-whoNot"
                name="whoNot"
                rows={2}
                defaultValue={item?.whoNot}
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="归类">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className={hintCls}>场景（可多选）</p>
            <div className="mt-1 flex flex-wrap gap-x-4">
              {scenes.map((s) => (
                <Check
                  key={s.id}
                  name="scenes"
                  value={s.id}
                  defaultChecked={item?.scenes.includes(s.id)}
                >
                  {s.name}
                </Check>
              ))}
            </div>
          </div>
          <div>
            <p className={hintCls}>平台（可多选）</p>
            <div className="mt-1 flex flex-wrap gap-x-4">
              {Object.entries(platformLabel).map(([value, text]) => (
                <Check
                  key={value}
                  name="platforms"
                  value={value}
                  defaultChecked={item?.platforms.includes(
                    value as Software["platforms"][number],
                  )}
                >
                  {text}
                </Check>
              ))}
            </div>
          </div>
          <Field label="同类替代（slug，逗号分隔）" htmlFor="f-alternatives">
            <Input
              id="f-alternatives"
              name="alternatives"
              defaultValue={item?.alternatives.join("，")}
            />
          </Field>
          <Field label="优惠说明（可选）" htmlFor="f-discountNote">
            <Input
              id="f-discountNote"
              name="discountNote"
              defaultValue={item?.discountNote}
            />
          </Field>
        </div>
      </Section>

      <Section title="链接（只允许 https）">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="官网（主 CTA）" htmlFor="f-official">
            <Input
              id="f-official"
              name="official"
              type="url"
              defaultValue={item?.links.official ?? prefillOfficial}
            />
          </Field>
          <Field label="产品主页（可与官网不同）" htmlFor="f-homepage">
            <Input
              id="f-homepage"
              name="homepage"
              type="url"
              defaultValue={item?.links.homepage}
            />
          </Field>
          <Field label="GitHub（限 github.com 等 Git 托管）" htmlFor="f-github">
            <Input
              id="f-github"
              name="github"
              type="url"
              defaultValue={item?.links.github ?? prefillGithub}
            />
          </Field>
          <Field
            label="已核验镜像（必须同时有官网或 GitHub）"
            htmlFor="f-disk"
          >
            <Input
              id="f-disk"
              name="disk"
              type="url"
              defaultValue={item?.links.disk}
            />
          </Field>
          <Field
            label="镜像说明（镜像必填：来源、校验方式）"
            htmlFor="f-diskNote"
          >
            <Input
              id="f-diskNote"
              name="diskNote"
              defaultValue={item?.links.diskNote}
            />
          </Field>
        </div>
      </Section>

      <Section title="图标与预览图（存服务器，单张 ≤5MB，JPEG/PNG/WebP/GIF）">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={cell}>
            <label className={hintCls} htmlFor="f-previews">
              预览图（可多选，按住 Ctrl/Cmd 追加，最多 6 张；GIF 可动图）
            </label>
            <Input
              id="f-previews"
              name="previews"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="h-auto py-1.5"
            />
            {item?.previews.length ? (
              <div className="mt-1 space-y-1.5">
                {item.previews.map((src, index) => (
                  <label
                    key={src}
                    className="flex items-center gap-2 text-[12px] text-muted-foreground"
                  >
                    <input
                      type="checkbox"
                      name="removePreview"
                      value={index}
                      className="size-3.5 accent-destructive"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="h-8 w-14 rounded border border-border object-cover"
                    />
                    第 {index + 1} 张（勾选保存后删除）
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <div className={cell}>
            <label className={hintCls} htmlFor="f-iconImage">
              图标图（替代字母/Simple Icons）
            </label>
            <Input
              id="f-iconImage"
              name="iconImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="h-auto py-1.5"
            />
            {item?.iconImage ? (
              <p className="text-[12px] text-muted-foreground">
                当前：{item.iconImage}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="字母回退" htmlFor="f-letter">
              <Input
                id="f-letter"
                name="letter"
                maxLength={2}
                defaultValue={item?.icon.letter}
              />
            </Field>
            <Field label="品牌色" htmlFor="f-color">
              <Input
                id="f-color"
                name="color"
                placeholder="#0071e3"
                defaultValue={item?.icon.color}
              />
            </Field>
            <Field label="Simple Icons id" htmlFor="f-simpleIcon">
              <Input
                id="f-simpleIcon"
                name="simpleIcon"
                defaultValue={item?.icon.simpleIcon}
              />
            </Field>
          </div>
        </div>
      </Section>

      <div className="mt-5 flex items-center gap-4">
        <Button type="submit">保存</Button>
        <Button asChild variant="ghost">
          <Link href="/admin">取消</Link>
        </Button>
      </div>
    </form>
  );
}
