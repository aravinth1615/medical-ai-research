"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ChevronDown, Loader, Pause, Play, Trash } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { deleteSchedule, runReport, updateSchedule } from "@/lib/research/service";
import type { RecurringCadence, ReportRead, ReportVersionSummary, ScheduleRead } from "@/lib/research/types";
import {
  cadenceMeta,
  confidenceAccent,
  providerStyle,
  relativeFuture,
  relativeTime,
  researchRoutes,
  scheduleWindow,
} from "@/lib/research/format";
import {
  AETHER_BUTTON,
  AETHER_DANGER_BUTTON,
  AccentBadge,
  ConfidenceBar,
  ProviderLogoMark,
  ReportStatePill,
  StatusPill,
} from "@/components/research/ui/primitives";
import { VersionTrend } from "@/components/research/ui/charts";
import { ConfirmDialog } from "@/components/research/ui/dialog";
import { useToast } from "@/components/ui/toast";

const INDIGO = "#6366F1";

const MONO_LABEL = "text-[10px] font-mono uppercase tracking-wider text-gray-500";

export const RECURRING_CADENCES: RecurringCadence[] = ["daily", "weekly", "monthly"];

type Pending = "toggle" | "cadence" | "run";

/** The report page link for a schedule's report (falls back to the bare id). */
export function scheduleReportHref(reportId: string, report: ReportRead | undefined): string {
  return report ? researchRoutes.report(report.title, report.id) : `${researchRoutes.reports}/${reportId}`;
}

/** One recurring literature review, in the report page's side-by-side card
 *  style: the model's accent bar, the next run as the headline figure, the
 *  confidence trend across its versions, its models — plus the controls the
 *  schedule supports (pause/resume, cadence, run now, stop). */
export function ScheduleCard({
  schedule: s,
  report,
  versions,
  onScheduleChange,
  onScheduleRemoved,
  onRunStarted,
}: {
  schedule: ScheduleRead;
  report: ReportRead | undefined;
  /** Newest first, as the service returns them. */
  versions: ReportVersionSummary[];
  onScheduleChange: (next: ScheduleRead) => void;
  onScheduleRemoved: (id: string) => void;
  onRunStarted: (reportId: string) => void;
}) {
  const show = useToast((t) => t.show);
  const [pending, setPending] = React.useState<Pending | null>(null);
  const [confirmStop, setConfirmStop] = React.useState(false);
  const cadenceId = React.useId();

  const models = report?.selected_models ?? [];
  const accent = models.length === 1 ? providerStyle(models[0].provider).accent : INDIGO;
  const cadence = cadenceMeta(s.cadence);
  const off = !s.is_active;
  const running = report?.state === "running";
  const busy = pending !== null;
  const title = report?.title ?? "Untitled review";
  const href = scheduleReportHref(s.report_id, report);
  const confidence = report?.latest_confidence_score ?? 0;
  const trend = [...versions]
    .reverse()
    .map((v) => ({ label: `v${v.version_number}`, value: v.confidence_score ?? 0 }));

  const toggleActive = async () => {
    setPending("toggle");
    const res = await updateSchedule(s.id, { is_active: off });
    setPending(null);
    if (res.error !== null) {
      show(`Couldn't ${off ? "resume" : "pause"} the schedule: ${res.error}`, "error");
      return;
    }
    onScheduleChange(res.data);
    show(res.data.is_active ? `Resumed — “${title}” re-runs ${cadenceMeta(res.data.cadence).label.toLowerCase()}` : `Paused — published versions of “${title}” stay as they are`);
  };

  const changeCadence = async (next: RecurringCadence) => {
    if (next === s.cadence) return;
    setPending("cadence");
    const res = await updateSchedule(s.id, { cadence: next });
    setPending(null);
    if (res.error !== null) {
      show(`Couldn't change the cadence: ${res.error}`, "error");
      return;
    }
    onScheduleChange(res.data);
    show(`Now runs ${cadenceMeta(next).label.toLowerCase()} — next review ${relativeFuture(res.data.next_run_at)}`);
  };

  const runNow = async () => {
    setPending("run");
    const res = await runReport(s.report_id);
    setPending(null);
    if (res.error !== null) {
      show(`Couldn't start the run: ${res.error}`, "error");
      return;
    }
    onRunStarted(s.report_id);
    show(`Run started — open “${title}” to follow it`);
  };

  const stop = async () => {
    const res = await deleteSchedule(s.id);
    if (res.error !== null) {
      show(`Couldn't stop the schedule: ${res.error}`, "error");
      throw new Error(res.error);
    }
    show(`Schedule stopped — “${title}” and its versions stay in Reports`);
    onScheduleRemoved(s.id);
  };

  return (
    <article
      aria-label={title}
      className={cn(
        "@container/card relative flex min-w-0 flex-col justify-between gap-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#10121B] p-4 pt-5 transition-all hover:border-indigo-500/40 hover:shadow-lg",
        off && "opacity-70 focus-within:opacity-100 hover:opacity-100"
      )}
    >
      <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: accent }} aria-hidden />

      <div className="space-y-4">
        <div className="flex flex-col gap-2 @md/card:flex-row @md/card:items-start @md/card:justify-between @md/card:gap-3">
          <div className="min-w-0">
            <Link href={href} className="text-sm font-bold break-words text-white transition-colors hover:text-indigo-300">
              {title}
            </Link>
            <div className="mt-0.5 text-[11px] text-gray-400">{scheduleWindow(s.next_run_at, s.cadence)}</div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <AccentBadge color={INDIGO} title={cadence.hint} className="px-2 text-[11px]">
              {cadence.label}
            </AccentBadge>
            {running ? (
              <ReportStatePill state="running" />
            ) : off ? (
              <StatusPill tone="gray" label="Paused" />
            ) : (
              <ReportStatePill state="scheduled" />
            )}
          </div>
        </div>

        <dl className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-lg border border-white/[0.06] bg-[#0B0D14] p-3 @md/card:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] @md/card:items-end">
          <div className="col-span-3 min-w-0 @md/card:col-span-1">
            <dt className={MONO_LABEL}>Next review</dt>
            <dd className="mt-0.5 truncate text-xl leading-tight font-bold text-white tabular-nums">
              {off ? "Paused" : relativeFuture(s.next_run_at)}
            </dd>
          </div>
          <Fact label="Last run" value={s.last_run_at ? relativeTime(s.last_run_at) : "Never"} />
          <Fact label="Versions" value={String(s.version_count)} />
          <Fact label="Sources" value={(report?.source_count ?? 0).toLocaleString("en-US")} />
        </dl>

        {trend.length > 1 && (
          <div className="space-y-1.5">
            <div className={MONO_LABEL}>Confidence trend</div>
            <VersionTrend points={trend} color={confidenceAccent(confidence)} />
          </div>
        )}

        {confidence > 0 && (
          <div className="flex items-center gap-3">
            <span className={cn(MONO_LABEL, "shrink-0")}>Confidence</span>
            <ConfidenceBar value={confidence} className="flex-1" />
          </div>
        )}

        {s.failure_count_30d > 0 && (
          <div className="flex items-center gap-2 rounded border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300/80">
            <AlertTriangle className="size-3.5 shrink-0 text-amber-400" />
            <span>
              {s.failure_count_30d} failed run{s.failure_count_30d === 1 ? "" : "s"} in the last 30 days.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Schedule controls">
          <label htmlFor={cadenceId} className={cn(MONO_LABEL, "shrink-0")}>
            Cadence
          </label>
          <span className="relative inline-flex items-center">
            <select
              id={cadenceId}
              value={s.cadence}
              disabled={busy}
              onChange={(e) => changeCadence(e.target.value as RecurringCadence)}
              className="h-7 appearance-none rounded-lg border border-white/[0.08] bg-[#0B0D13] py-0 pr-7 pl-2.5 text-xs text-gray-200 [color-scheme:dark] transition-colors hover:bg-[#141722] focus:border-indigo-500/60 disabled:opacity-50"
            >
              {RECURRING_CADENCES.map((c) => (
                <option key={c} value={c}>
                  {cadenceMeta(c).label}
                </option>
              ))}
            </select>
            {pending === "cadence" ? (
              <Loader className="pointer-events-none absolute right-2 size-3.5 animate-spin text-gray-400" />
            ) : (
              <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-gray-400" />
            )}
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <button type="button" className={AETHER_BUTTON} disabled={busy} onClick={toggleActive}>
              {pending === "toggle" ? <Loader className="animate-spin" /> : off ? <Play /> : <Pause />}
              {off ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              className={AETHER_DANGER_BUTTON}
              disabled={busy}
              onClick={() => setConfirmStop(true)}
            >
              <Trash />
              Stop
              <span className="sr-only"> schedule</span>
            </button>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-3">
        {models.length > 0 && (
          <ul className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="Models">
            {models.map((m) => (
              <li
                key={m.id}
                title={m.name}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/[0.06] bg-[#0E1017] py-0.5 pr-2 pl-1.5 text-[11px] text-gray-300"
              >
                <ProviderLogoMark provider={m.provider} size={12} />
                <span className="truncate">{m.name}</span>
              </li>
            ))}
          </ul>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {running ? (
            <Link href={href} className={cn(AETHER_BUTTON, "border-indigo-500/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20")}>
              <Loader className="animate-spin" />
              View run
            </Link>
          ) : (
            <button
              type="button"
              disabled={busy || !report}
              onClick={runNow}
              className={cn(AETHER_BUTTON, "border-transparent bg-transparent text-gray-300 hover:text-white")}
            >
              {pending === "run" ? <Loader className="animate-spin" /> : <Play />}
              Run now
            </button>
          )}
          <Link href={href} className={AETHER_BUTTON}>
            Open
            <span className="sr-only"> {title}</span>
            <ArrowRight />
          </Link>
        </span>
      </div>

      <ConfirmDialog
        open={confirmStop}
        onOpenChange={setConfirmStop}
        icon={<Trash />}
        tone="danger"
        title="Stop this schedule?"
        description={
          <>
            “{title}” stops re-running {cadence.label.toLowerCase()}. The report and its {s.version_count} published
            version{s.version_count === 1 ? "" : "s"} stay in Reports — you can schedule it again from New Research.
          </>
        }
        confirmLabel="Stop schedule"
        onConfirm={stop}
      />
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className={cn(MONO_LABEL, "truncate")}>{label}</dt>
      <dd className="mt-0.5 font-mono text-xs break-words text-gray-200 tabular-nums">{value}</dd>
    </div>
  );
}

/** A cadence as a preset card: icon tile, name, runs a month, its window and
 *  what it suits. */
export function CadenceOptionCard({
  icon,
  label,
  hint,
  runsPerMonth,
  use,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  runsPerMonth: number;
  use: string;
}) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-white/[0.07] bg-[#11131A] p-4">
      <div className="shrink-0 rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400 [&_svg]:size-4" aria-hidden>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-100">{label}</span>
          <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-400 tabular-nums">
            {runsPerMonth}/month
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-300">{hint}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{use}</p>
      </div>
    </div>
  );
}
