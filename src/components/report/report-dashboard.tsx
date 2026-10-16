"use client";

import * as React from "react";
import { Search } from "@/lib/icons";
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
import { PatientBanner } from "./patient-banner";
import { FilterBar } from "./filter-bar";
import { ReportNav } from "./report-nav";
import { MasterSummary } from "./master-summary";
import { PanelCard } from "./panel-card";
import { DoctorWorkspace } from "./doctor-workspace";
import { FollowUpLabs } from "./follow-up-labs";

const COUNTS = countMarkers(PANELS);
const DEFAULT_COLLAPSED = Object.fromEntries(
  PANELS.filter((p) => p.collapsible && p.defaultCollapsed).map((p) => [p.id, true])
);

export function ReportDashboard() {
  const [filters, setFilters] = React.useState<FilterState>(initialFilters);
  const [compare, setCompare] = React.useState(true);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(DEFAULT_COLLAPSED);

  const panels = React.useMemo(() => visiblePanels(PANELS, filters, collapsed), [filters, collapsed]);

  const reset = () => setFilters(initialFilters());
  const isolateAbnormal = () =>
    setFilters((f) => ({ ...f, statuses: new Set<Status>(["red", "yellow"]), deviation: "all" }));

  return (
    <div className="flex min-h-full animate-fade-in flex-col">
      <PatientBanner />
      <FilterBar
        filters={filters}
        counts={COUNTS}
        compare={compare}
        onToggleStatus={(s) => setFilters((f) => ({ ...f, statuses: toggleStatus(f.statuses, s) }))}
        onDeviation={(d: DeviationFilter) => setFilters((f) => ({ ...f, deviation: d }))}
        onSort={(s: SortOrder) => setFilters((f) => ({ ...f, sort: s }))}
        onQuery={(q) => setFilters((f) => ({ ...f, query: q }))}
        onToggleCompare={() => setCompare((v) => !v)}
        onReset={reset}
      />

      <div className="mx-auto flex w-full max-w-[1560px] flex-1 gap-6 px-4 py-6 sm:px-6">
        <ReportNav />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <MasterSummary onIsolate={isolateAbnormal} onShowAll={reset} />

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
                />
              ))
            )}
          </div>

          <DoctorWorkspace />
          <FollowUpLabs />
          <div className="h-10" aria-hidden />
        </div>
      </div>
    </div>
  );
}
