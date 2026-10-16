import { cn } from "@/lib/utils";

const bar = "animate-pulse rounded bg-white/[0.06]";

/** The folder page's frame while its id resolves — header bar, intro band,
 *  drop zone and a few table rows, in the folder page's own proportions. */
export function FolderSkeleton() {
  return (
    <div className="flex min-h-full flex-col bg-[#08090E]" aria-busy="true" aria-label="Loading folder">
      <div className="flex min-h-14 items-center gap-3 border-b border-white/[0.08] bg-[#0C0E15]/90 px-4 sm:px-6">
        <span className="size-7 animate-pulse rounded-lg bg-indigo-500/20" />
        <span className={cn(bar, "h-4 w-40")} />
      </div>
      <div className="space-y-2.5 border-b border-white/[0.06] bg-[#0E1018] px-4 py-4 sm:px-6">
        <span className={cn(bar, "block h-3 w-20 bg-indigo-500/15")} />
        <span className={cn(bar, "block h-5 w-56 max-w-full")} />
        <span className={cn(bar, "block h-3.5 w-full max-w-xl bg-white/[0.04]")} />
      </div>
      <div className="mx-auto w-full max-w-[1560px] space-y-4 p-4 sm:p-6">
        <div className="h-[168px] animate-pulse rounded-xl border-2 border-dashed border-indigo-500/20 bg-[#11131A]/60" />
        <div className="space-y-2 rounded-xl border border-white/[0.08] bg-[#0F111A] p-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </div>
  );
}
