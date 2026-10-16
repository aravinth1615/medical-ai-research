"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Download, FileText, Flask, Loader, Refresh, Search, X } from "@/lib/icons";
import { fetchReportStats, fetchReports } from "@/lib/research/service";
import {
  CADENCES,
  STATE_LABEL,
  cadenceMeta,
  providerStyle,
  relativeTime,
  researchRoutes,
  toCadenceId,
  type CadenceId,
} from "@/lib/research/format";
import type { ReportRead, ReportState, ReportStats } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ModuleBody, ModuleCard, ModuleHeaderBar, ModuleIntro, ModulePage, StatTile, moduleTable } from "@/components/research/ui/module-shell";
import {
  AETHER_BUTTON,
  AETHER_PRIMARY_BUTTON,
  ConfidenceBar,
  MonoChip,
  ReportStateCard,
  ReportStatePill,
  inputClass,
} from "@/components/research/ui/primitives";
import { DeltaTag, Sparkline } from "@/components/research/ui/charts";
import { useResearch } from "@/components/research/ui/use-research";

type StateFilter = "all" | ReportState;
type CadenceFilter = "all" | CadenceId;

const TILE_CARD = "rounded-lg bg-[#10121B] p-4 shadow-sm shadow-black/20";

function ModelAccents({ models }: { models: ReportRead["selected_models"] }) {
  if (models.length === 0) return <span className="text-gray-600">—</span>;
  return (
    <span role="img" aria-label={models.map((m) => m.name).join(", ")} className="inline-flex items-center gap-1">
      {models.map((m) => (
        <span key={m.id} title={m.name} className="size-2 rounded-full ring-2 ring-[#0F111A]" style={{ backgroundColor: providerStyle(m.provider).accent }} />
      ))}
    </span>
  );
}

function CadenceTag({ cadence }: { cadence: ReportRead["cadence"] }) {
  const c = cadenceMeta(cadence);
  return (
    <span
      title={c.hint}
      className={cn(
        "rounded px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap",
        c.id === "once" ? "bg-white/5 text-gray-400" : "bg-indigo-500/15 text-indigo-300"
      )}
    >
      {c.label}
    </span>
  );
}

function runningCaption(stats: ReportStats | null) {
  const r = stats?.running_now;
  if (!r) return "Nothing running right now";
  return `${r.title} · ${r.model_count} model${r.model_count === 1 ? "" : "s"}`;
}

function scheduledCaption(stats: ReportStats | null) {
  const b = stats?.scheduled_breakdown;
  if (!b) return "No recurring reviews";
  const parts = [b.daily && `${b.daily} daily`, b.weekly && `${b.weekly} weekly`, b.monthly && `${b.monthly} monthly`].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No recurring reviews";
}

function exportCsv(rows: ReportRead[]) {
  const header = ["Title", "State", "Cadence", "Versions", "Sources", "Confidence", "Models", "Updated"];
  const body = rows.map((r) => [
    r.title,
    STATE_LABEL[r.state],
    cadenceMeta(r.cadence).label,
    String(r.version_count),
    String(r.source_count),
    r.latest_confidence_score != null ? String(r.latest_confidence_score) : "",
    r.selected_models.map((m) => m.name).join("; "),
    r.updated_at.slice(0, 10),
  ]);
  const csv = [header, ...body].map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "research-reports.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** The report library — every question put to the models. */
export function ReportsView() {
  const showToast = useToast((s) => s.show);
  const stats = useResearch(() => fetchReportStats(), []);
  const reports = useResearch(() => fetchReports({ limit: 200 }), []);
  const [q, setQ] = React.useState("");
  const [state, setState] = React.useState<StateFilter>("all");
  const [cadence, setCadence] = React.useState<CadenceFilter>("all");
  const [exporting, setExporting] = React.useState(false);

  const loading = reports.loading;
  const error = !reports.data ? reports.error : null;
  const rows = reports.data?.items ?? [];
  const needle = q.trim().toLowerCase();
  const list = rows.filter(
    (r) =>
      (state === "all" || r.state === state) &&
      (cadence === "all" || toCadenceId(r.cadence) === cadence) &&
      (!needle || r.title.toLowerCase().includes(needle) || r.prompt.toLowerCase().includes(needle))
  );

  const s = stats.data;
  const total = s?.total ?? rows.length;
  const running = s?.running ?? rows.filter((r) => r.state === "running").length;
  const providers = [...new Map(rows.flatMap((r) => r.selected_models).map((m) => [m.provider, providerStyle(m.provider)])).values()];

  const handleExport = () => {
    setExporting(true);
    try {
      exportCsv(list);
      showToast(`Exported ${list.length} report${list.length === 1 ? "" : "s"} as CSV`);
    } catch {
      showToast("The export didn't complete. Try again.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ModulePage>
      <ModuleHeaderBar
        icon={<FileText />}
        title="Reports"
        badge={loading || error ? undefined : total}
        status={loading || error ? undefined : running > 0 ? `${running} running now` : `${total} reports`}
        statusTone={running > 0 ? "amber" : "emerald"}
        actions={
          <>
            <button type="button" className={AETHER_BUTTON} onClick={handleExport} disabled={exporting || loading || list.length === 0}>
              {exporting ? <Loader className="animate-spin" /> : <Download />}
              Export CSV
            </button>
            <Link href={researchRoutes.newResearch} className={AETHER_PRIMARY_BUTTON}>
              <Flask />
              New research
            </Link>
          </>
        }
      />

      <ModuleIntro
        labelIcon={<Search />}
        label="Report library"
        title="Every clinical question you have put to the models"
        description="With the merged answer, its version history, and the confidence behind every claim."
        chips={
          !loading &&
          !error && (
            <>
              <MonoChip>Reports: {total}</MonoChip>
              {s && <MonoChip>Ready: {s.ready + s.scheduled}</MonoChip>}
              <MonoChip>Sources cited: {rows.reduce((a, r) => a + r.source_count, 0).toLocaleString("en-US")}</MonoChip>
            </>
          )
        }
      >
        {!loading && !error && providers.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-gray-400">
            <span className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">Models</span>
            {providers.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: p.accent }} />
                {p.label}
              </span>
            ))}
          </div>
        )}
      </ModuleIntro>

      <ModuleBody>
        {loading ? (
          <div className="animate-pulse space-y-6" role="status" aria-busy aria-label="Loading reports">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[108px] rounded-lg border border-white/[0.06] bg-[#10121B]" />
              ))}
            </div>
            <div className="h-80 rounded-xl border border-white/[0.08] bg-[#0F111A]" />
          </div>
        ) : error ? (
          <ReportStateCard
            tone="red"
            icon={<AlertTriangle />}
            title="Couldn't load reports"
            description={error}
            action={
              <button type="button" className={AETHER_BUTTON} onClick={reports.reload}>
                <Refresh />
                Try again
              </button>
            }
          />
        ) : (
          <>
            <div className="@container">
              <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
                <StatTile
                  className={TILE_CARD}
                  tone="indigo"
                  label="Reports"
                  value={String(total)}
                  caption={
                    <span className="flex flex-wrap items-center gap-x-1.5">
                      {s?.reports_delta_pct != null && <DeltaTag value={s.reports_delta_pct} />}
                      <span>{s?.reports_delta_pct != null ? "vs. the previous 30 days" : "in your library"}</span>
                    </span>
                  }
                />
                <StatTile className={TILE_CARD} tone="amber" label="Running now" value={String(running)} caption={runningCaption(s)} />
                <StatTile className={TILE_CARD} tone="sky" label="Scheduled" value={String(s?.scheduled ?? 0)} caption={scheduledCaption(s)} />
                <StatTile
                  className={TILE_CARD}
                  tone="emerald"
                  label="Mean confidence"
                  value={s?.mean_confidence != null ? String(s.mean_confidence) : "—"}
                  caption={
                    <span className="flex flex-wrap items-center gap-x-1.5">
                      {s?.confidence_delta_pct != null && <DeltaTag value={s.confidence_delta_pct} />}
                      <span>{s?.confidence_trend.length ? `across ${s.confidence_trend.length} weekly scores` : "no versions scored yet"}</span>
                    </span>
                  }
                >
                  {s && s.confidence_trend.length > 1 && <Sparkline values={s.confidence_trend} color="#34D399" label="Mean confidence by week" />}
                </StatTile>
              </div>
            </div>

            <ModuleCard flush icon={<FileText className="text-indigo-400" />} title="Report index" aside={<span className="tabular-nums">{list.length} of {rows.length}</span>}>
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-5 py-3">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="Search reports"
                    placeholder="Search titles and prompts…"
                    className={cn(inputClass, "pr-7 pl-8")}
                  />
                  {q && (
                    <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <select aria-label="Filter by state" value={state} onChange={(e) => setState(e.target.value as StateFilter)} className={cn(inputClass, "w-auto flex-1 sm:w-36 sm:flex-none")}>
                  <option value="all">All states</option>
                  {(Object.keys(STATE_LABEL) as ReportState[]).map((st) => (
                    <option key={st} value={st}>
                      {STATE_LABEL[st]}
                    </option>
                  ))}
                </select>
                <select aria-label="Filter by cadence" value={cadence} onChange={(e) => setCadence(e.target.value as CadenceFilter)} className={cn(inputClass, "w-auto flex-1 sm:w-40 sm:flex-none")}>
                  <option value="all">Any cadence</option>
                  {CADENCES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {list.length === 0 ? (
                <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent">
                  <ReportStateCard
                    icon={<Search />}
                    title={rows.length === 0 ? "No research yet" : "No reports match those filters"}
                    description={rows.length === 0 ? "Ask the models a clinical question — the report lands here." : "Loosen the state or cadence filter, or clear the search."}
                    action={
                      rows.length === 0 ? (
                        <Link href={researchRoutes.newResearch} className={AETHER_BUTTON}>
                          <Flask />
                          New research
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={AETHER_BUTTON}
                          onClick={() => {
                            setQ("");
                            setState("all");
                            setCadence("all");
                          }}
                        >
                          Clear filters
                        </button>
                      )
                    }
                  />
                </div>
              ) : (
                <div className={cn(moduleTable.wrap, "max-h-[32rem] overflow-y-auto")}>
                  <table className={moduleTable.table}>
                    <thead className={cn(moduleTable.thead, "sticky top-0 z-10 bg-[#0B0D13]")}>
                      <tr>
                        <th scope="col" className={cn(moduleTable.th, "w-[30%]")}>Report</th>
                        <th scope="col" className={moduleTable.th}>State</th>
                        <th scope="col" className={moduleTable.th}>Models</th>
                        <th scope="col" className={moduleTable.th}>Cadence</th>
                        <th scope="col" className={cn(moduleTable.th, "text-right")}>Version</th>
                        <th scope="col" className={cn(moduleTable.th, "text-right")}>Sources</th>
                        <th scope="col" className={cn(moduleTable.th, "w-[10%]")}>Confidence</th>
                        <th scope="col" className={moduleTable.th}>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.id} className={cn(moduleTable.tr, moduleTable.trInteractive, "group")}>
                          <td className={moduleTable.td}>
                            <Link
                              href={researchRoutes.report(r.title, r.id)}
                              className="block max-w-[17rem] min-w-0 rounded focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none 2xl:max-w-80"
                            >
                              <span className="block truncate text-[13px] font-semibold text-white transition-colors group-hover:text-indigo-200">{r.title}</span>
                              <span className="mt-0.5 block truncate text-[11.5px] text-gray-500">{r.prompt}</span>
                            </Link>
                          </td>
                          <td className={moduleTable.td}>
                            <ReportStatePill state={r.state} />
                          </td>
                          <td className={moduleTable.td}>
                            <ModelAccents models={r.selected_models} />
                          </td>
                          <td className={moduleTable.td}>
                            <CadenceTag cadence={r.cadence} />
                          </td>
                          <td className={cn(moduleTable.td, "text-right font-mono tabular-nums")}>v{r.version_count}</td>
                          <td className={cn(moduleTable.td, "text-right font-mono tabular-nums")}>
                            {r.source_count === 0 ? <span className="text-gray-600">—</span> : r.source_count}
                          </td>
                          <td className={moduleTable.td}>
                            {r.latest_confidence_score != null ? (
                              <ConfidenceBar value={r.latest_confidence_score} className="w-20" />
                            ) : (
                              <span className="font-mono text-[11px] whitespace-nowrap text-gray-500">not scored</span>
                            )}
                          </td>
                          <td className={cn(moduleTable.td, "whitespace-nowrap text-gray-400")}>{relativeTime(r.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 border-t border-white/[0.06] px-5 py-3 font-mono text-[11px] leading-relaxed text-gray-500">
                <span className="max-w-3xl">Confidence is the mean of every section&apos;s score in the latest version — contested claims pull it down.</span>
                <span className="whitespace-nowrap tabular-nums">{list.length} shown</span>
              </div>
            </ModuleCard>
          </>
        )}
      </ModuleBody>
    </ModulePage>
  );
}
