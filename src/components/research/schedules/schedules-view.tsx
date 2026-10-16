"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, CircleAlert, Clock, FileText, Refresh, Repeat } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  fetchReportVersions,
  fetchReports,
  fetchScheduleStats,
  fetchSchedules,
} from "@/lib/research/service";
import type {
  ApiResult,
  RecurringCadence,
  ReportRead,
  ReportVersionSummary,
  ScheduleRead,
  ScheduleStats,
} from "@/lib/research/types";
import { cadenceMeta, relativeFuture, researchRoutes } from "@/lib/research/format";
import { useResearch } from "@/components/research/ui/use-research";
import {
  ModuleBody,
  ModuleCard,
  ModuleHeaderBar,
  ModuleIntro,
  ModulePage,
  StatTile,
} from "@/components/research/ui/module-shell";
import {
  AETHER_BUTTON,
  AETHER_PRIMARY_BUTTON,
  InlineError,
  MonoChip,
  ReportStateCard,
  SectionLabel,
} from "@/components/research/ui/primitives";
import { CadenceOptionCard, RECURRING_CADENCES, ScheduleCard } from "./schedule-card";

/** Runs a cadence fires in a 30-day month — the basis for the volume metric. */
const RUNS_PER_MONTH: Record<RecurringCadence, number> = {
  daily: 30,
  weekly: 4,
  monthly: 1,
};

/** What each cadence is actually for — the thing a dropdown can't tell you. */
const CADENCE_USE: Record<RecurringCadence, string> = {
  daily:
    "Titration and inpatient work — a marker drawn every day, a dose being adjusted. Expect many near-identical versions.",
  weekly:
    "Active risk reviews such as Lp(a) or ApoB. Long enough that a new version usually means new literature.",
  monthly:
    "Serology, hormone and nutrient panels. Guidelines and trial readouts rarely move faster than this.",
};

const CADENCE_ICON: Record<RecurringCadence, React.ReactNode> = {
  daily: <Clock />,
  weekly: <Calendar />,
  monthly: <Repeat />,
};

const COMPACT_PRIMARY = cn(AETHER_PRIMARY_BUTTON, "gap-1.5 px-3 py-1.5");

/** How often to re-read while one of these reports is mid-run. */
const RUNNING_POLL_MS = 2500;

interface SchedulesData {
  stats: ScheduleStats | null;
  schedules: ScheduleRead[];
  reports: ReportRead[];
  /** Per report id, newest version first. */
  versions: Record<string, ReportVersionSummary[]>;
}

async function loadSchedules(): Promise<ApiResult<SchedulesData>> {
  const [st, sc, rp] = await Promise.all([fetchScheduleStats(), fetchSchedules(), fetchReports({ limit: 200 })]);
  if (sc.error !== null) return { data: null, error: sc.error };
  const lists = await Promise.all(sc.data.map((s) => fetchReportVersions(s.report_id)));
  const versions: Record<string, ReportVersionSummary[]> = {};
  sc.data.forEach((s, i) => {
    const list = lists[i];
    if (list.error === null) versions[s.report_id] = list.data;
  });
  return {
    data: { stats: st.data, schedules: sc.data, reports: rp.data?.items ?? [], versions },
    error: null,
  };
}

function SchedulesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading schedules" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

export function SchedulesView() {
  const { data, error, loading, reload, setData } = useResearch(loadSchedules, []);

  const rows = React.useMemo(() => data?.schedules ?? [], [data]);
  const reportsById = React.useMemo(() => new Map((data?.reports ?? []).map((r) => [r.id, r])), [data]);
  const stats = data?.stats ?? null;
  const active = rows.filter((s) => s.is_active).length;
  const paused = rows.length - active;
  const failures = stats?.failures_30d ?? 0;
  const failedFirstLoad = !data && !!error;
  const ready = !loading && !failedFirstLoad;

  // Keep a "Run now" card current until its run publishes a new version.
  const anyRunning = rows.some((s) => reportsById.get(s.report_id)?.state === "running");
  React.useEffect(() => {
    if (!anyRunning) return;
    const timer = window.setInterval(reload, RUNNING_POLL_MS);
    return () => window.clearInterval(timer);
  }, [anyRunning, reload]);

  const patchSchedule = React.useCallback(
    (next: ScheduleRead) =>
      setData((d) => (d ? { ...d, schedules: d.schedules.map((s) => (s.id === next.id ? next : s)) } : d)),
    [setData]
  );
  const removeSchedule = React.useCallback(
    (id: string) => setData((d) => (d ? { ...d, schedules: d.schedules.filter((s) => s.id !== id) } : d)),
    [setData]
  );
  const markRunning = React.useCallback(
    (reportId: string) =>
      setData((d) =>
        d ? { ...d, reports: d.reports.map((r) => (r.id === reportId ? { ...r, state: "running" as const } : r)) } : d
      ),
    [setData]
  );

  const retryButton = (
    <button type="button" className={AETHER_BUTTON} onClick={reload}>
      <Refresh />
      Try again
    </button>
  );

  const headerStatus = !ready
    ? undefined
    : active > 0
      ? `${active} active${stats?.next_run_at ? ` · next review ${relativeFuture(stats.next_run_at)}` : ""}`
      : rows.length > 0
        ? `${paused} paused`
        : "No schedules";

  return (
    <ModulePage>
      <ModuleHeaderBar
        icon={<Repeat />}
        title="Schedules"
        badge={ready ? active : undefined}
        status={headerStatus}
        statusTone={active > 0 ? "emerald" : "gray"}
        actions={
          <>
            <Link href={researchRoutes.reports} className={AETHER_BUTTON}>
              <FileText />
              All reports
            </Link>
            <Link href={researchRoutes.newResearch} className={COMPACT_PRIMARY}>
              <Calendar />
              New schedule
            </Link>
          </>
        }
      />

      <ModuleIntro
        labelIcon={<Repeat />}
        label="Recurring research"
        title="Literature reviews that keep themselves current."
        description="Medical AI re-runs the original clinical question against the patient's flagged labs on its cadence, publishes a new version, and notes what moved in the evidence since the last one."
        chips={
          !loading && (
            <>
              {!failedFirstLoad && (
                <>
                  <MonoChip>Active: {active}</MonoChip>
                  <MonoChip>Paused: {paused}</MonoChip>
                </>
              )}
              <MonoChip>All times UTC</MonoChip>
            </>
          )
        }
      />

      <ModuleBody>
        {loading ? (
          <SchedulesSkeleton />
        ) : failedFirstLoad ? (
          <ReportStateCard
            tone="red"
            icon={<CircleAlert />}
            title="Couldn't load schedules"
            description={error}
            action={retryButton}
          />
        ) : (
          <>
            {error && <InlineError message={`Couldn't refresh schedules: ${error}`} onRetry={reload} />}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile
                label="Active schedules"
                value={String(stats?.active_count ?? active)}
                caption={`${paused} paused`}
                tone="indigo"
              />
              <StatTile
                label="Runs this month"
                value={String(stats?.runs_this_month ?? 0)}
                caption="across every schedule"
                tone="sky"
              />
              <StatTile
                label="Next review"
                value={stats?.next_run_at ? relativeFuture(stats.next_run_at) : "—"}
                tone="emerald"
              />
              <StatTile
                label="Failures (30d)"
                value={String(failures)}
                tone={failures > 0 ? "amber" : "gray"}
                className={cn(failures > 0 && "border-amber-500/25")}
              />
            </div>

            <section className="space-y-3" aria-labelledby="schedules-recurring">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
                <SectionLabel className="px-0">
                  <h2 id="schedules-recurring">Recurring reviews</h2>
                </SectionLabel>
                <span className="font-mono text-xs text-gray-500">
                  Pause a schedule and every published version stays exactly where it is
                </span>
              </div>

              {rows.length === 0 ? (
                <ReportStateCard
                  icon={<Repeat />}
                  title="No schedules yet"
                  description="Pick Daily, Weekly or Monthly in New Research's Run Parameters and the review re-runs itself on that cadence."
                  action={
                    <Link href={researchRoutes.newResearch} className={AETHER_BUTTON}>
                      <Calendar />
                      Go to New Research
                    </Link>
                  }
                />
              ) : (
                <div className="@container">
                  <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-2">
                    {rows.map((s) => (
                      <ScheduleCard
                        key={s.id}
                        schedule={s}
                        report={reportsById.get(s.report_id)}
                        versions={data?.versions[s.report_id] ?? []}
                        onScheduleChange={patchSchedule}
                        onScheduleRemoved={removeSchedule}
                        onRunStarted={markRunning}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        <section className="space-y-3" aria-labelledby="schedules-create">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
            <SectionLabel className="px-0">
              <h2 id="schedules-create">Create a schedule</h2>
            </SectionLabel>
            <span className="font-mono text-xs text-gray-500">
              Any report can become a recurring one — the clinical question is already written
            </span>
          </div>

          <ModuleCard icon={<Calendar className="text-indigo-400" />} title="Cadence options">
            <div className="@container space-y-4">
              <p className="text-xs leading-relaxed text-gray-400">
                Pick the slowest cadence that still catches the change you care about
              </p>
              <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-3">
                {RECURRING_CADENCES.map((c) => {
                  const meta = cadenceMeta(c);
                  return (
                    <CadenceOptionCard
                      key={c}
                      icon={CADENCE_ICON[c]}
                      label={meta.label}
                      hint={meta.hint}
                      runsPerMonth={RUNS_PER_MONTH[c]}
                      use={CADENCE_USE[c]}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                <p className="min-w-0 flex-1 basis-80 text-xs leading-relaxed text-gray-400">
                  Scheduled runs use the same models and depth as the original — change either and the next version
                  says so in its note.
                </p>
                <Link href={researchRoutes.newResearch} className={cn(AETHER_PRIMARY_BUTTON, "ml-auto")}>
                  <Repeat />
                  Start a scheduled review
                </Link>
              </div>
            </div>
          </ModuleCard>
        </section>
      </ModuleBody>
    </ModulePage>
  );
}
