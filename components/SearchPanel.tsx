import Form from "next/form";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_SEARCH_LENGTH } from "@/lib/catalog-query";

/** 站内搜索框。hero 用在首页，page 用在搜索页与 404。 */
export function SearchPanel({
  initialQuery = "",
  variant = "page",
  className = "",
}: {
  initialQuery?: string;
  variant?: "hero" | "page";
  className?: string;
}) {
  const hero = variant === "hero";
  return (
    <Form action="/search" role="search" aria-label="搜索工具" className={className}>
      <label htmlFor="search-page" className="sr-only">
        搜索工具
      </label>
      <div
        className={`flex items-center gap-2 border border-input bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-foreground focus-within:ring-4 focus-within:ring-foreground/8 ${hero ? "h-14 rounded-2xl p-1.5 pl-5" : "h-12 rounded-xl p-1 pl-4"}`}
      >
        <Search className={`shrink-0 text-muted-foreground ${hero ? "size-5" : "size-4"}`} aria-hidden="true" />
        <input
          key={initialQuery}
          id="search-page"
          name="q"
          type="search"
          defaultValue={initialQuery}
          maxLength={MAX_SEARCH_LENGTH}
          enterKeyHint="search"
          autoComplete="off"
          placeholder={hero ? "软件名称，或你要做的事，比如「写论文」" : "软件名称、别名或用途"}
          className={`h-full min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden ${hero ? "text-base sm:text-[17px]" : "text-base"}`}
        />
        <Button type="submit" className={hero ? "h-11 rounded-xl px-5" : "h-10 rounded-lg px-4"}>
          搜索
        </Button>
      </div>
    </Form>
  );
}
