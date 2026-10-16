import { LAB_GROUPS, PANELS, type Panel } from "@/lib/data/biomarkers";
import { cn } from "@/lib/utils";

/** Section badge: flagged count in its worst status, or the row count when
 *  every marker is in range. */
function badgeFor(panel: Panel): { text: string; cls: string } {
  const red = panel.markers.filter((m) => m.status === "red").length;
  const yellow = panel.markers.filter((m) => m.status === "yellow").length;
  if (red) return { text: `${red + yellow} Flagged`, cls: "bg-red-500/15 text-red-300" };
  if (yellow) return { text: `${yellow} Flagged`, cls: "bg-amber-500/15 text-amber-300" };
  return { text: String(panel.markers.length), cls: "bg-emerald-500/15 text-emerald-300" };
}

const link =
  "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-gray-200";
const group = "mx-2 mt-4 mb-1 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase";

/** "1. Vibrant America → 1A, 1B …" — every lab panel with its flag badge. */
export function LabPanelLinks({ related = [] }: { related?: string[] }) {
  return (
    <>
      {LAB_GROUPS.map((g) => {
        const panels = PANELS.filter((p) => g.labs.includes(p.lab));
        if (panels.length === 0) return null;
        return (
          <div key={g.label} className="flex flex-col gap-0.5">
            <p className={group}>{g.label}</p>
            {panels.map((p) => {
              const b = badgeFor(p);
              return (
                <a key={p.id} href={`#${p.id}`} className={cn(link, related.includes(p.id) && "text-indigo-200")}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    {related.includes(p.id) && <span className="size-1.5 shrink-0 rounded-full bg-indigo-400" title="Related to this research" />}
                    <span className="truncate">{p.title.replace(/\s—.*$/, "")}</span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold", b.cls)}>{b.text}</span>
                </a>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

export function ReportNav() {
  return (
    <nav
      aria-label="Report sections"
      className="sticky top-20 hidden max-h-[calc(100dvh-14rem-var(--app-footer-h))] w-64 shrink-0 flex-col gap-0.5 self-start overflow-y-auto rounded-xl border border-white/[0.08] bg-panel p-3 lg:flex"
    >
      <p className={cn(group, "mt-1")}>Overview</p>
      <a href="#master-summary" className="flex items-center rounded-lg bg-indigo-500/15 px-2.5 py-1.5 text-xs font-bold text-indigo-200">
        ✦ Master AI Summary
      </a>

      <LabPanelLinks />

      <p className={group}>Actionable Workspace</p>
      <a href="#doctor-workspace" className={link}>
        ✚ Doctor Action Plan
      </a>
      <a href="#followup-workspace" className={link}>
        ⚲ Follow-Up Labs
      </a>
    </nav>
  );
}
