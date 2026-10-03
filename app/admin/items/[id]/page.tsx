import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronLeft, CircleAlert, Info } from "lucide-react";

import { Breadcrumb } from "@/components/Breadcrumb";
import { DraftKeeper } from "@/components/DraftKeeper";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
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
  "h-11 w-full min-w-0 appearance-auto rounded-lg border border-input bg-card px-3 text-base text-foreground transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-foreground focus-visible:ring-4 focus-visible:ring-foreground/8 md:text-sm";
const fileCls = "h-auto py-1.5";

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
    <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] transition-colors hover:border-foreground/30 has-checked:border-foreground has-checked:font-medium pointer-coarse:h-11">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-4 accent-primary"
      />
      {children}
    </label>
  );
}

function Section({
  index,
  title,
  description,
  children,
}: {
  index: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const id = `section-${index}`;
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-5 rounded-3xl border border-border bg-card p-5 sm:p-7 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <div>
        <span className="font-mono text-[13px] text-muted-foreground tabular-nums" aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        <h2 id={id} className="mt-1.5 text-base font-semibold">
          {title}
        </h2>
        {description ? <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </fieldset>
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
    <form action={saveItem} id="item-form">
      <DraftKeeper formId="item-form" storageKey={isNew ? "new" : item!.slug} />
      {item ? (
        <input type="hidden" name="originalSlug" value={item.slug} />
      ) : null}

      <Breadcrumb items={[{ href: "/admin", label: "条目" }, { label: isNew ? "新建" : item!.name }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-[-0.01em]">{isNew ? "新建条目" : `编辑：${item!.name}`}</h1>
        {item?.status === "published" ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/software/${item.slug}`} target="_blank" rel="noopener">
              看前台页面
              <ArrowUpRight />
            </Link>
          </Button>
        ) : null}
      </div>

      {e ? (
        <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-[13px] font-medium text-destructive">
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          {e}
        </p>
      ) : null}
      {isNew && prefillName ? (
        <p role="status" className="mt-5 flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5 text-[13px]">
          <Info className="mt-px size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          已带入投稿「{prefillName}」的内容，核对后保存即可。
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        <Section index={1} title="基本" description="名称、网址和在卡片上展示的信息。">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="名称" htmlFor="f-name">
              <Input
                id="f-name"
                name="name"
                required
                defaultValue={item?.name ?? prefillName}
              />
            </Field>
            <Field label="slug" htmlFor="f-slug" hint="网址里的标识，小写字母、数字和中划线。">
              <Input id="f-slug" name="slug" required className="font-mono" aria-describedby="f-slug-hint" defaultValue={item?.slug} />
            </Field>
            <Field label="中文名" htmlFor="f-nameZh" optional>
              <Input id="f-nameZh" name="nameZh" defaultValue={item?.nameZh} />
            </Field>
            <Field label="别名" htmlFor="f-aliases" hint="逗号分隔，只用于搜索。">
              <Input
                id="f-aliases"
                name="aliases"
                aria-describedby="f-aliases-hint"
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
            <Field label="价格" htmlFor="f-price" hint="卡片展示，如「会员 ¥68/月」；留空按免费。">
              <Input id="f-price" name="price" aria-describedby="f-price-hint" defaultValue={item?.price} />
            </Field>
            <Field
              label="许可证"
              htmlFor="f-license"
              optional
              hint="SPDX 标识，如 GPL-3.0-only、MIT。核验不到就留空，不要猜。"
            >
              <Input
                id="f-license"
                name="license"
                aria-describedby="f-license-hint"
                defaultValue={item?.license}
                placeholder="MIT"
              />
            </Field>
            <Field label="版本" htmlFor="f-version" optional hint="条目描述的版本号，如 4.9.8。">
              <Input
                id="f-version"
                name="version"
                aria-describedby="f-version-hint"
                defaultValue={item?.version}
              />
            </Field>
            <Field
              label="链接核验于"
              htmlFor="f-linksCheckedAt"
              optional
              hint="最近一次人工确认链接可达的日期，用于发现死链。"
            >
              <Input
                id="f-linksCheckedAt"
                name="linksCheckedAt"
                type="date"
                aria-describedby="f-linksCheckedAt-hint"
                defaultValue={item?.linksCheckedAt}
              />
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
            <Field label="标签" htmlFor="f-tags" hint="逗号分隔，卡片最多展示 3 个。">
              <Input id="f-tags" name="tags" aria-describedby="f-tags-hint" defaultValue={item?.tags.join("，")} />
            </Field>
            <div className="flex items-end">
              <Check name="featured" value="on" defaultChecked={item?.featured}>
                精选（卡片与首页显示「精选」）
              </Check>
            </div>
          </div>
        </Section>

        <Section index={2} title="文案" description="先回答该不该用：一句话、适合、不适合，再写详细介绍。">
          <div className="grid grid-cols-1 gap-5">
            <Field label="一句话简介" htmlFor="f-summary" hint="卡片最多展示两行。">
              <Input
                id="f-summary"
                name="summary"
                required
                aria-describedby="f-summary-hint"
                defaultValue={item?.summary ?? prefillNote}
              />
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="适合" htmlFor="f-whoFor">
                <Textarea
                  id="f-whoFor"
                  name="whoFor"
                  rows={3}
                  defaultValue={item?.whoFor}
                />
              </Field>
              <Field label="不适合" htmlFor="f-whoNot">
                <Textarea
                  id="f-whoNot"
                  name="whoNot"
                  rows={3}
                  defaultValue={item?.whoNot}
                />
              </Field>
            </div>
            <Field label="详细介绍" htmlFor="f-body" hint="纯文本，空行分段，不解析 HTML。">
              <Textarea
                id="f-body"
                name="body"
                rows={7}
                aria-describedby="f-body-hint"
                defaultValue={item?.body}
              />
            </Field>
            <Field label="上手步骤" htmlFor="f-tutorial" hint="每行一步。">
              <Textarea
                id="f-tutorial"
                name="tutorial"
                rows={5}
                aria-describedby="f-tutorial-hint"
                defaultValue={item?.tutorial.join("\n")}
              />
            </Field>
          </div>
        </Section>

        <Section index={3} title="归类" description="决定条目出现在哪些场景和平台筛选里。">
          <div className="grid grid-cols-1 gap-6">
            <Group label="场景（可多选）">
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
            </Group>
            <Group label="平台（可多选）">
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
            </Group>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="同类替代" htmlFor="f-alternatives" hint="填 slug，逗号分隔。">
                <Input
                  id="f-alternatives"
                  name="alternatives"
                  className="font-mono"
                  aria-describedby="f-alternatives-hint"
                  defaultValue={item?.alternatives.join("，")}
                />
              </Field>
              <Field label="优惠说明" htmlFor="f-discountNote" optional>
                <Input
                  id="f-discountNote"
                  name="discountNote"
                  defaultValue={item?.discountNote}
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section index={4} title="链接" description="只允许 https。主按钮按官网 → GitHub → 产品主页取第一个；镜像永远不做主按钮。">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="官网" htmlFor="f-official">
              <Input
                id="f-official"
                name="official"
                type="url"
                className="font-mono"
                defaultValue={item?.links.official ?? prefillOfficial}
              />
            </Field>
            <Field label="产品主页" htmlFor="f-homepage" optional>
              <Input
                id="f-homepage"
                name="homepage"
                type="url"
                className="font-mono"
                defaultValue={item?.links.homepage}
              />
            </Field>
            <Field label="GitHub" htmlFor="f-github" hint="限 github.com、GitLab、Gitee、Codeberg。">
              <Input
                id="f-github"
                name="github"
                type="url"
                className="font-mono"
                aria-describedby="f-github-hint"
                defaultValue={item?.links.github ?? prefillGithub}
              />
            </Field>
            <Field label="已核验镜像" htmlFor="f-disk" hint="必须同时有官网或 GitHub。">
              <Input
                id="f-disk"
                name="disk"
                type="url"
                className="font-mono"
                aria-describedby="f-disk-hint"
                defaultValue={item?.links.disk}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="镜像说明" htmlFor="f-diskNote" hint="填了镜像就必须写：来源、校验方式。">
                <Input
                  id="f-diskNote"
                  name="diskNote"
                  aria-describedby="f-diskNote-hint"
                  defaultValue={item?.links.diskNote}
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section index={5} title="图标与截图" description="存在服务器上，单张不超过 5MB，支持 JPEG、PNG、WebP、GIF。">
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="截图" htmlFor="f-previews" hint="可多选，最多 6 张；GIF 可以是动图。">
                <Input
                  id="f-previews"
                  name="previews"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  aria-describedby="f-previews-hint"
                  className={fileCls}
                />
              </Field>
              <Field label="图标图" htmlFor="f-iconImage" hint={item?.iconImage ? `当前：${item.iconImage}` : "优先于 Simple Icons 和字母。"}>
                <Input
                  id="f-iconImage"
                  name="iconImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-describedby="f-iconImage-hint"
                  className={fileCls}
                />
              </Field>
            </div>
            {item?.previews.length ? (
              <fieldset>
                <legend className="text-sm font-medium">现有截图</legend>
                <p className="mt-1 text-xs text-muted-foreground">勾选的会在保存后删除。</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.previews.map((src, index) => (
                    <label
                      key={src}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-border p-1.5 pr-3 text-xs text-muted-foreground transition-colors has-checked:border-destructive has-checked:text-destructive"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="h-10 w-16 rounded-lg border border-border object-cover"
                      />
                      <input
                        type="checkbox"
                        name="removePreview"
                        value={index}
                        className="size-4 accent-destructive"
                      />
                      删除第 {index + 1} 张
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                  placeholder="#1f6feb"
                  className="font-mono"
                  defaultValue={item?.icon.color}
                />
              </Field>
              <Field label="Simple Icons id" htmlFor="f-simpleIcon">
                <Input
                  id="f-simpleIcon"
                  name="simpleIcon"
                  className="font-mono"
                  defaultValue={item?.icon.simpleIcon}
                />
              </Field>
            </div>
          </div>
        </Section>
      </div>

      <div className="glass sticky bottom-0 z-10 -mx-5 mt-8 border-t border-border px-5 py-3 sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg">
            保存
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/admin">
              <ChevronLeft />
              返回列表
            </Link>
          </Button>
          <p className="ml-auto hidden text-xs text-muted-foreground sm:block">
            填写内容会暂存在本机，校验失败跳回时自动恢复。
          </p>
        </div>
      </div>
    </form>
  );
}
