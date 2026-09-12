import { HomeCatalog } from "@/components/HomeCatalog";
import { scenes } from "@/data/scenes";
import { software } from "@/data/software";
import { featuredSoftware } from "@/lib/catalog";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">
          按你要做的事找软件
        </h1>
        <p className="mt-3 max-w-[58ch] text-[1.05rem] text-muted">
          目录按场景排。每条都告诉你适不适合、去哪个官网、有没有平替。不提供安装包，也不做破解。
        </p>
      </header>

      <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.875rem] text-ink">
        <li>只连官方与开源</li>
        <li>安装要点写在详情里</li>
        <li>商业软件旁给出免费路径</li>
      </ul>

      <div className="mt-8">
        <HomeCatalog
          scenes={scenes}
          catalog={software}
          featured={featuredSoftware()}
        />
      </div>
    </div>
  );
}
