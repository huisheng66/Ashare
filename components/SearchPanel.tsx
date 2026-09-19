import Form from "next/form";
import { MagnifierIcon } from "@/components/MagnifierIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_SEARCH_LENGTH } from "@/lib/catalog-query";

export function SearchPanel({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <Form action="/search" role="search" className="mt-6 max-w-xl">
      <Label htmlFor="search-page" className="mb-2 block text-sm">
        搜索工具
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <MagnifierIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={initialQuery}
            id="search-page"
            name="q"
            type="search"
            defaultValue={initialQuery}
            maxLength={MAX_SEARCH_LENGTH}
            placeholder="名称、别名或用途"
            className="h-11 bg-muted pl-9 text-base"
          />
        </div>
        <Button type="submit" className="h-11 px-4">搜索</Button>
      </div>
    </Form>
  );
}
