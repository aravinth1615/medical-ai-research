"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, FileText, Loader } from "@/lib/icons";
import { TONE_CLASSES } from "@/config/nav";
import { researchRoutes } from "@/lib/research/format";
import { fetchReportVersions, fetchReports } from "@/lib/research/service";
import type { ReportRead } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { useResearch } from "@/components/research/ui/use-research";

const tone = TONE_CLASSES.sky;
/** A shortcut list, not the whole library — "All reports" opens that. */
const LIMIT = 8;

const leafClass = (on: boolean) =>
  cn(
    "flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs transition-colors duration-150",
    on ? cn("font-medium", tone.active) : cn("text-gray-400 hover:text-gray-200", tone.hover)
  );

/**
 * The Reports group under New Research: the latest reports, newest first.
 * A report with one version links straight to it; one with several opens
 * into its versions (V-1, V-2 …), each linking to that version.
 */
export function SidebarReports({
  pathname,
  version,
  onNavigate,
}: {
  pathname: string;
  /** The `?version=` on the current URL, if any. */
  version: string | null;
  onNavigate: () => void;
}) {
  const { data, loading } = useResearch(() => fetchReports({ limit: LIMIT }), []);
  const inReports = pathname.startsWith(researchRoutes.reports);
  const [open, setOpen] = React.useState(true);
  const [wasIn, setWasIn] = React.useState(inReports);
  if (inReports !== wasIn) {
    setWasIn(inReports);
    if (inReports) setOpen(true);
  }
  const listId = React.useId();
  const reports = data?.items ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "group flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold tracking-wide transition-colors duration-150",
          tone.text,
          tone.hover
        )}
      >
        <FileText className="size-4 shrink-0 opacity-85" />
        <span className="min-w-0 flex-1 truncate text-left">Reports</span>
        {data && <span className="shrink-0 rounded bg-white/[0.06] px-1.5 font-mono text-[10px] text-gray-400 tabular-nums">{data.total}</span>}
        <ChevronDown className={cn("size-3.5 shrink-0 opacity-50 transition-transform duration-200 ease-(--ease-out)", open && "rotate-180")} />
      </button>

      {open && (
        <ul id={listId} className={cn("mt-1 mb-2 ml-5 space-y-0.5 border-l-2 pl-3", tone.rule)}>
          {loading ? (
            <li className="flex h-8 items-center px-2.5 text-gray-600">
              <Loader className="size-3.5 animate-spin" />
            </li>
          ) : reports.length === 0 ? (
            <li className="px-2.5 py-1.5 text-[11px] leading-relaxed text-gray-500">No reports yet — ask a question in New Research.</li>
          ) : (
            reports.map((r) => <ReportRow key={r.id} report={r} pathname={pathname} version={version} onNavigate={onNavigate} />)
          )}
          {data && data.total > 0 && (
            <li>
              <Link
                href={researchRoutes.reports}
                onClick={onNavigate}
                aria-current={pathname === researchRoutes.reports ? "page" : undefined}
                className={cn(leafClass(pathname === researchRoutes.reports), "text-[11px]")}
              >
                <span className="flex-1">All reports</span>
                <ArrowRight className="size-3 shrink-0" />
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function ReportRow({
  report,
  pathname,
  version,
  onNavigate,
}: {
  report: ReportRead;
  pathname: string;
  version: string | null;
  onNavigate: () => void;
}) {
  const href = researchRoutes.report(report.title, report.id);
  // Matched on the id, so a link carrying an older title still counts.
  const on = pathname.includes(report.id);
  const [open, setOpen] = React.useState(on);
  const [wasOn, setWasOn] = React.useState(on);
  if (on !== wasOn) {
    setWasOn(on);
    if (on) setOpen(true);
  }
  const running = report.state === "running" && <Loader className="size-3 shrink-0 animate-spin text-indigo-400" />;

  if (report.version_count <= 1) {
    return (
      <li>
        <Link href={href} onClick={onNavigate} title={report.title} aria-current={on ? "page" : undefined} className={leafClass(on)}>
          <span className="min-w-0 flex-1 truncate">{report.title}</span>
          {running}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} title={report.title} className={leafClass(on && !open)}>
        <span className={cn("min-w-0 flex-1 truncate", on && "font-medium text-sky-200")}>{report.title}</span>
        {running}
        <span className="shrink-0 rounded bg-white/[0.06] px-1 font-mono text-[10px] text-gray-400 tabular-nums">{report.version_count}</span>
        <ChevronDown className={cn("size-3 shrink-0 opacity-60 transition-transform duration-200 ease-(--ease-out)", open && "rotate-180")} />
      </button>
      {open && <VersionLinks report={report} href={href} on={on} version={version} onNavigate={onNavigate} />}
    </li>
  );
}

function VersionLinks({
  report,
  href,
  on,
  version,
  onNavigate,
}: {
  report: ReportRead;
  href: string;
  on: boolean;
  version: string | null;
  onNavigate: () => void;
}) {
  const { data } = useResearch(() => fetchReportVersions(report.id), [report.id, report.version_count]);
  if (!data) {
    return (
      <div className="flex h-7 items-center pl-4 text-gray-600">
        <Loader className="size-3 animate-spin" />
      </div>
    );
  }
  const latest = data[0]?.version_number;
  return (
    <ul className="mt-0.5 mb-1 ml-2 space-y-0.5 border-l border-white/[0.08] pl-2">
      {data.map((v) => {
        const isLatest = v.version_number === latest;
        // No ?version= on the URL means the latest one is showing.
        const active = on && (version ? Number(version) === v.version_number : isLatest);
        return (
          <li key={v.id}>
            <Link
              href={isLatest ? href : `${href}?version=${v.version_number}`}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-7 items-center justify-between gap-2 rounded-md px-2 font-mono text-[11px] transition-colors",
                active ? tone.active : "text-gray-500 hover:bg-white/[0.05] hover:text-gray-200"
              )}
            >
              <span>
                V-{v.version_number}
                {isLatest && <span className="ml-1.5 text-[10px] text-emerald-400">latest</span>}
              </span>
              {v.confidence_score != null && <span className="tabular-nums">{v.confidence_score}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
