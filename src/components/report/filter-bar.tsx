"use client";

import { ArrowLeftRight, Refresh, Search, X } from "@/lib/icons";
import type { Status } from "@/lib/data/biomarkers";
import type { Counts, DeviationFilter, FilterState, SortOrder } from "@/lib/report/filters";
import { cn } from "@/lib/utils";
import { STATUS_META } from "./status";

const chip =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-[opacity,filter,transform,background-color] duration-150 ease-(--ease-out) active:scale-[0.97]";

const DEVIATIONS: { id: Exclude<DeviationFilter, "all">; label: string; countKey: keyof Counts }[] = [
  { id: "highly_above", label: "▲▲ Highly Above", countKey: "highly_above" },
  { id: "above", label: "▲ Above", countKey: "above" },
  { id: "below", label: "▼ Below", countKey: "below" },
];

export function FilterBar({
  filters,
  counts,
  compare,
  onToggleStatus,
  onDeviation,
  onSort,
  onQuery,
  onToggleCompare,
  onReset,
  variant = "sticky",
}: {
  filters: FilterState;
  counts: Counts;
  compare: boolean;
  onToggleStatus: (s: Status) => void;
  onDeviation: (d: DeviationFilter) => void;
  onSort: (s: SortOrder) => void;
  onQuery: (q: string) => void;
  onToggleCompare: () => void;
  onReset: () => void;
  /** "inline" sits in the page flow as a card — for a page that already has
   *  its own sticky bar (the research report). */
  variant?: "sticky" | "inline";
}) {
  return (
    <div
      className={cn(
        "shrink-0",
        variant === "sticky"
          ? "sticky top-0 z-sticky border-b border-white/[0.07] bg-[#0C0E15]/95 px-4 py-3 backdrop-blur-md sm:px-6"
          : "rounded-xl border border-white/[0.08] bg-[#0C0E15] px-4 py-3"
      )}
    >
      <div className={cn("flex flex-wrap items-center justify-between gap-3", variant === "sticky" && "mx-auto max-w-[1560px]")}>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
          <span className="mr-1 text-[11px] font-bold tracking-wider text-gray-500 uppercase">Status:</span>
          {(["red", "yellow", "green"] as const).map((s) => {
            const meta = STATUS_META[s];
            const on = filters.statuses.has(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleStatus(s)}
                className={cn(chip, meta.chip, !on && "opacity-35 grayscale-[60%]")}
              >
                <meta.icon className="size-3.5" />
                {meta.label} ({counts[s]})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by deviation">
          <span className="mr-1 text-[11px] font-bold tracking-wider text-gray-500 uppercase">Deviation:</span>
          {DEVIATIONS.map((d) => {
            const on = filters.deviation === d.id;
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={on}
                onClick={() => onDeviation(on ? "all" : d.id)}
                className={cn(
                  chip,
                  on
                    ? "border-indigo-500/60 bg-indigo-600 text-white shadow"
                    : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.07]"
                )}
              >
                {d.label} ({counts[d.countKey]})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <label htmlFor="report-sort" className="sr-only">
            Sort order
          </label>
          <select
            id="report-sort"
            value={filters.sort}
            onChange={(e) => onSort(e.target.value as SortOrder)}
            className="h-8 rounded-lg border border-white/10 bg-void px-2.5 text-xs text-gray-200 outline-none focus:border-indigo-500/70"
          >
            <option value="default">Default Order</option>
            <option value="severity-desc">Severity (Red ➔ Green)</option>
            <option value="severity-asc">Severity (Green ➔ Red)</option>
          </select>

          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 size-3.5 text-gray-500" />
            <label htmlFor="report-search" className="sr-only">
              Search biomarker
            </label>
            <input
              id="report-search"
              type="search"
              value={filters.query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search biomarker..."
              className="h-8 w-44 rounded-lg border border-white/10 bg-void pr-7 pl-8 text-xs text-gray-200 outline-none placeholder:text-gray-500 focus:border-indigo-500/70 xl:w-60 [&::-webkit-search-cancel-button]:hidden"
            />
            {filters.query && (
              <button
                type="button"
                onClick={() => onQuery("")}
                aria-label="Clear search"
                className="absolute right-2 text-gray-500 hover:text-gray-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            aria-pressed={compare}
            onClick={onToggleCompare}
            className={cn(
              chip,
              compare
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.07]"
            )}
          >
            <ArrowLeftRight className="size-3.5" />
            Compare Dates: <span className="font-mono">{compare ? "ON" : "OFF"}</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className={cn(chip, "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.07]")}
          >
            <Refresh className="size-3.5" />
            Reset ({counts.total})
          </button>
        </div>
      </div>
    </div>
  );
}
