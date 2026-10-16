"use client";

import * as React from "react";
import { Search, Sparkles, TestTube } from "@/lib/icons";
import { PANELS, type Status } from "@/lib/data/biomarkers";
import {
  countMarkers,
  initialFilters,
  toggleStatus,
  visiblePanels,
  type DeviationFilter,
  type FilterState,
  type SortOrder,
} from "@/lib/report/filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/page-frame";
import { FilterBar } from "@/components/report/filter-bar";
import { PanelCard } from "@/components/report/panel-card";

const COUNTS = countMarkers(PANELS);
const DEFAULT_COLLAPSED = Object.fromEntries(PANELS.filter((p) => p.collapsible && p.defaultCollapsed).map((p) => [p.id, true]));

/**
 * The patient's lab results inside a research report — the same panels,
 * filters and comparison columns as the Report page (/report), built from
 * the same components. Panels the research question is about come first,
 * tagged, so the evidence and the labs it rests on read side by side.
 */
export function LabResults({ related }: { related: string[] }) {
  const [filters, setFilters] = React.useState<FilterState>(initialFilters);
  const [compare, setCompare] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(DEFAULT_COLLAPSED);

  const ordered = React.useMemo(
    () => [...PANELS.filter((p) => related.includes(p.id)), ...PANELS.filter((p) => !related.includes(p.id))],
    [related]
  );
  const panels = React.useMemo(() => visiblePanels(ordered, filters, collapsed), [ordered, filters, collapsed]);
  const reset = () => setFilters(initialFilters());

  return (
    <section id="lab-results" aria-labelledby="lab-results-title" className="scroll-mt-40 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
            <TestTube className="size-3.5" />
            Patient lab results • 3 combined reports (07/08/2026 – 07/09/2026)
          </p>
          <h2 id="lab-results-title" className="mt-0.5 text-[20px] font-extrabold text-gray-100">
            Biomarker Panels Behind This Research
          </h2>
        </div>
        {related.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles className="size-3.5 text-indigo-400" />
            {related.length} panel{related.length === 1 ? "" : "s"} related to this question shown first
          </p>
        )}
      </div>

      <FilterBar
        variant="inline"
        filters={filters}
        counts={COUNTS}
        compare={compare}
        onToggleStatus={(s: Status) => setFilters((f) => ({ ...f, statuses: toggleStatus(f.statuses, s) }))}
        onDeviation={(d: DeviationFilter) => setFilters((f) => ({ ...f, deviation: d }))}
        onSort={(s: SortOrder) => setFilters((f) => ({ ...f, sort: s }))}
        onQuery={(q) => setFilters((f) => ({ ...f, query: q }))}
        onToggleCompare={() => setCompare((v) => !v)}
        onReset={reset}
      />

      <div className="flex flex-col gap-6" aria-live="polite">
        {panels.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-panel">
            <EmptyState
              icon={<Search />}
              title="No biomarkers match these filters"
              description="Try a different status or deviation, or clear the search to see every panel again."
              action={
                <Button variant="soft" size="sm" onClick={reset}>
                  Reset filters
                </Button>
              }
            />
          </div>
        ) : (
          panels.map((view) => (
            <PanelCard
              key={view.panel.id}
              view={view}
              compare={compare}
              onToggleCollapse={(id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))}
              tag={
                related.includes(view.panel.id) ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-indigo-200">
                    <Sparkles className="size-3" />
                    Related to this research
                  </span>
                ) : undefined
              }
            />
          ))
        )}
      </div>
    </section>
  );
}
