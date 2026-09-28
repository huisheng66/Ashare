import Form from "next/form";
import { MagnifierIcon } from "@/components/MagnifierIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_SEARCH_LENGTH } from "@/lib/catalog-query";

export function SearchPanel({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <Form action="/search" role="search" className="mt-6 max-w-xl">
      <Label htmlFor="search-page" className="sr-only">
        搜索工具
      </Label>
      <div className="flex h-12 items-center gap-1 rounded-2xl border border-input bg-card p-1.5 pl-4 shadow-card transition-[border-color,box-shadow] duration-200 focus-within:border-ring/60 focus-within:shadow-card-hover focus-within:ring-2 focus-within:ring-ring/20">
        <MagnifierIcon className="size-4 shrink-0 text-muted-foreground" />
        <Input
          key={initialQuery}
          id="search-page"
          name="q"
          type="search"
          defaultValue={initialQuery}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="名称、别名或用途"
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Button type="submit" className="h-9 rounded-xl px-4">搜索</Button>
      </div>
    </Form>
  );
}
