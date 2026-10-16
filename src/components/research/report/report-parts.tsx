"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ExternalLink,
  Maximize,
  Minimize,
} from "@/lib/icons";
import { confidenceAccent, fullDate, providerStyle, relativeTime, sourceKind } from "@/lib/research/format";
import type {
  CitationRead,
  ReportVersionSummary,
  ResearchModel,
  RunModelExecutionRead,
} from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { moduleTable } from "@/components/research/ui/module-shell";
import {
  AETHER_DANGER_BUTTON,
  ConfidenceBar,
  ExecStatusPill,
  ProgressTrack,
  ProviderLogo,
} from "@/components/research/ui/primitives";
import { FormattedResponse } from "@/components/research/ui/formatted-response";
import { VersionTrend } from "@/components/research/ui/charts";

/* ----------------------------- Model cards ------------------------------ */

/** First prose paragraph of a model's markdown answer. */
function answerExcerpt(body: string | null): string {
  if (!body) return "";
  return (
    body
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith("#") && !l.startsWith("-")) ?? ""
  )
    .replace(/\[\d+\]/g, "")
    .replace(/\*\*/g, "");
}

function answerBullets(body: string | null, count: number): string[] {
  if (!body) return [];
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).replace(/\[\d+\]/g, "").trim())
    .slice(0, count);
}

/** One card per model pass behind this version: summary, highlights and the
 *  claims it surfaced that are contested. */
export function ModelReportCards({
  executions,
  citations,
  onAddCriteria,
  onInspect,
}: {
  executions: RunModelExecutionRead[];
  citations: CitationRead[];
  onAddCriteria: (text: string) => void;
  onInspect: (execution: RunModelExecutionRead) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1 font-mono text-xs text-gray-400">
        <span>FRONTIER MODEL REPORTS (SIDE-BY-SIDE)</span>
        {executions.length > 0 && <span className="hidden text-right sm:inline">Inspect a card for its full answer</span>}
      </div>
      {executions.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#10121B] p-4 text-xs text-gray-400">This version&apos;s run didn&apos;t record any model passes.</div>
      ) : (
        <div className="@container">
          <div className={cn("grid grid-cols-1 gap-4", executions.length === 2 ? "@xl:grid-cols-2" : executions.length >= 3 && "@xl:grid-cols-2 @3xl:grid-cols-3")}>
            {executions.map((e) => {
              const s = providerStyle(e.model.provider);
              const cited = citations.filter((c) => c.surfaced_by_model.id === e.model_id);
              const contested = cited.filter((c) => c.is_contested);
              const summary = answerExcerpt(e.body);
              const highlights = answerBullets(e.body, 2);
              return (
                <div
                  key={e.id}
                  className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#10121B] p-4 transition-colors hover:border-indigo-500/40"
                >
                  <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: s.accent }} />
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <ProviderLogo provider={e.model.provider} />
                        <div className="min-w-0">
                          <div className="text-sm font-bold break-words text-white">{e.model.name}</div>
                          <div className="text-[11px] text-gray-400">{s.label}</div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded px-2 py-0.5 font-mono text-xs font-semibold" style={{ backgroundColor: `${s.accent}20`, color: s.accent }}>
                        {cited.length} cited
                      </span>
                    </div>
                    {e.status !== "done" && <ExecStatusPill status={e.status} />}
                    {summary ? (
                      <p className="line-clamp-3 text-xs leading-relaxed text-gray-300">{summary}</p>
                    ) : (
                      <p className="text-xs leading-relaxed text-gray-500">{e.error_message ?? "No response recorded for this pass."}</p>
                    )}
                    {highlights.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="font-mono text-[10px] text-gray-500 uppercase">Key Highlights</span>
                        <ul className="space-y-1 pl-1 text-xs text-gray-300">
                          {highlights.map((h) => (
                            <li key={h} className="flex items-start gap-1.5">
                              <span className="shrink-0 text-emerald-400" aria-hidden>
                                ✓
                              </span>
                              <span className="line-clamp-1" title={h}>
                                {h}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="space-y-1 pt-1">
                      <span className="flex items-center gap-1 font-mono text-[10px] text-amber-500/90 uppercase">
                        <AlertTriangle className="size-3 text-amber-400" />
                        Contested Claims
                      </span>
                      {contested.length === 0 ? (
                        <p className="text-[11px] text-gray-500">No contested claims</p>
                      ) : (
                        contested.map((c) => (
                          <div key={c.id} className="flex items-center justify-between gap-2 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300/80">
                            <span className="truncate" title={c.claim_text}>
                              {c.claim_text}
                            </span>
                            <button
                              type="button"
                              onClick={() => onAddCriteria(`Re-check: ${c.claim_text}`)}
                              aria-label={`Add "${c.claim_text}" to the re-run instructions`}
                              title="Add to the re-run instructions"
                              className="shrink-0 font-bold text-amber-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInspect(e)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-gray-300 transition-colors hover:border-indigo-500/40 hover:bg-indigo-600/20 hover:text-indigo-300"
                  >
                    <Maximize className="size-3.5 shrink-0" />
                    Inspect full answer
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/** Every model's full answer, one after another (the Model Report tab). */
export function ModelResponses({ executions, onToast }: { executions: RunModelExecutionRead[]; onToast: (m: string) => void }) {
  const [focus, setFocus] = React.useState<string | null>(null);
  if (executions.length === 0) {
    return <div className="rounded-xl border border-white/[0.08] bg-[#0F111A] p-6 text-center text-xs text-gray-400">No per-model responses were recorded for this version.</div>;
  }
  return (
    <div className="space-y-4">
      {executions
        .filter((e) => !focus || e.id === focus)
        .map((e) => {
          const s = providerStyle(e.model.provider);
          return (
            <article key={e.id} id={`model-${e.id}`} className="scroll-mt-24 overflow-hidden rounded-xl border border-white/[0.08] bg-[#11131A]">
              <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${s.accent}, transparent)` }} />
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#151822]/90 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <ProviderLogo provider={e.model.provider} />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-gray-100">{e.model.name}</div>
                    <div className="font-mono text-[11px] text-gray-500">
                      {e.duration_ms != null && `${(e.duration_ms / 1000).toFixed(1)}s`}
                      {e.tokens_used != null && ` · ${e.tokens_used.toLocaleString("en-US")} tok`}
                      {e.cost != null && ` · $${e.cost.toFixed(4)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <ExecStatusPill status={e.status} />
                  <button
                    type="button"
                    onClick={() => setFocus((f) => (f === e.id ? null : e.id))}
                    aria-label={focus === e.id ? "Show every model" : `Show only ${e.model.name}`}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {focus === e.id ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
                  </button>
                </div>
              </div>
              <div className="p-5">{e.body ? <FormattedResponse text={e.body} onCopy={onToast} /> : <p className="text-xs text-gray-500">No answer recorded.</p>}</div>
            </article>
          );
        })}
    </div>
  );
}

/* ------------------------------ Run progress ----------------------------- */

export function RunProgressPanel({
  models,
  executions,
  startedAt,
  cancelling,
  onCancel,
}: {
  models: ResearchModel[];
  executions: RunModelExecutionRead[];
  startedAt: string | null;
  cancelling: boolean;
  onCancel: () => void;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-white/[0.08] bg-[#0F111A] p-5">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/40 bg-indigo-500/20 text-indigo-300">
            <Activity className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white">Run in progress</h2>
            <p className="text-xs text-gray-400">
              {models.length} pass{models.length === 1 ? "" : "es"} over the same question
              {startedAt ? ` · started ${relativeTime(startedAt)}` : ""}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 font-mono text-xs text-amber-300">
          <span className="size-2 animate-pulse rounded-full bg-amber-400" />
          Running
        </span>
      </div>
      <ul className="space-y-2.5">
        {models.map((m) => {
          const exec = executions.find((e) => e.model_id === m.id);
          const status = exec?.status ?? "queued";
          return (
            <li key={m.id} className="space-y-2 rounded-lg border border-white/[0.06] bg-[#0B0D14] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <ProviderLogo provider={m.provider} />
                  <span className="truncate text-sm font-medium text-gray-100">{m.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {exec?.duration_ms != null && <span className="font-mono text-[11px] text-gray-500">{(exec.duration_ms / 1000).toFixed(1)}s</span>}
                  <ExecStatusPill status={status} />
                </span>
              </div>
              <ProgressTrack status={status} color={providerStyle(m.provider).accent} />
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
        <span className="min-w-0 flex-1 basis-60 text-[11px] leading-relaxed text-gray-500">
          The new version publishes once every pass finishes and the merge step reconciles them.
        </span>
        <button type="button" disabled={cancelling} onClick={onCancel} className={AETHER_DANGER_BUTTON}>
          {cancelling ? "Cancelling…" : "Cancel run"}
        </button>
      </div>
    </section>
  );
}

/* -------------------------------- Sources -------------------------------- */

export function SourcesTab({ citations }: { citations: CitationRead[] }) {
  const bySource = new Map<string, { source: CitationRead["source"]; claims: CitationRead[] }>();
  for (const c of citations) {
    const cur = bySource.get(c.source.id);
    if (cur) cur.claims.push(c);
    else bySource.set(c.source.id, { source: c.source, claims: [c] });
  }
  const rows = [...bySource.values()];
  if (rows.length === 0) {
    return <div className="rounded-xl border border-white/[0.08] bg-[#0F111A] p-6 text-center text-xs text-gray-400">This version doesn&apos;t cite any sources.</div>;
  }
  return (
    <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F111A]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <h3 className="text-sm font-bold tracking-wider text-white uppercase">Sources in this version</h3>
        <span className="font-mono text-xs text-gray-400">{rows.length} sources</span>
      </div>
      <div className={moduleTable.wrap}>
        <table className={moduleTable.table}>
          <thead className={moduleTable.thead}>
            <tr>
              <th scope="col" className={moduleTable.th}>Source</th>
              <th scope="col" className={moduleTable.th}>Type</th>
              <th scope="col" className={moduleTable.th}>Claims</th>
              <th scope="col" className={moduleTable.th}>Surfaced by</th>
              <th scope="col" className={moduleTable.th}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ source, claims }) => {
              const kind = sourceKind(source.source_type);
              const conf = Math.round(claims.reduce((a, c) => a + (c.confidence_score ?? 0), 0) / claims.length);
              return (
                <tr key={source.id} className={moduleTable.tr}>
                  <td className={moduleTable.td}>
                    <div className="flex max-w-md min-w-0 items-start gap-1.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-gray-100">{source.title}</span>
                        <span className="block font-mono text-[11px] text-gray-500">
                          {source.domain ?? "patient record"}
                          {source.is_paywalled && " · paywalled"}
                          {source.is_stale && " · stale"}
                        </span>
                      </span>
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.title}`} className="mt-0.5 shrink-0 text-gray-500 hover:text-indigo-300">
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className={moduleTable.td}>
                    <span className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ backgroundColor: `${kind.color}22`, color: kind.color }}>
                      {kind.label}
                    </span>
                  </td>
                  <td className={cn(moduleTable.td, "font-mono tabular-nums")}>
                    {claims.map((c) => `[${c.number}]`).join(" ")}
                    {claims.some((c) => c.is_contested) && <span className="ml-1.5 text-amber-400">contested</span>}
                  </td>
                  <td className={moduleTable.td}>{[...new Set(claims.map((c) => c.surfaced_by_model.name))].join(", ")}</td>
                  <td className={moduleTable.td}>
                    <span className="font-mono tabular-nums" style={{ color: confidenceAccent(conf) }}>
                      {conf}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* -------------------------------- Versions ------------------------------- */

export function VersionsTab({
  versions,
  shown,
  latest,
  onSelect,
}: {
  versions: ReportVersionSummary[];
  shown: number | null;
  latest: number | null;
  onSelect: (n: number) => void;
}) {
  const oldestFirst = [...versions].sort((a, b) => a.version_number - b.version_number);
  return (
    <div className="space-y-4">
      {oldestFirst.length > 1 && (
        <section className="rounded-xl border border-white/[0.08] bg-[#0F111A] p-5">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold tracking-wider text-white uppercase">Confidence over versions</h3>
            <span className="font-mono text-[11px] text-gray-500">
              v1 → v{oldestFirst[oldestFirst.length - 1].version_number}
            </span>
          </div>
          <VersionTrend points={oldestFirst.map((v) => ({ label: `v${v.version_number}`, value: v.confidence_score ?? 0 }))} />
        </section>
      )}
      <ol className="space-y-2">
        {versions.map((v) => {
          const on = v.version_number === shown;
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onSelect(v.version_number)}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 text-left transition-colors",
                  on ? "border-indigo-500/45 bg-indigo-500/[0.07]" : "border-white/[0.07] bg-[#11131A] hover:border-indigo-500/30 hover:bg-[#161924]"
                )}
              >
                <span className="w-12 shrink-0 font-mono text-sm font-bold text-white">v{v.version_number}</span>
                <span className="min-w-0 flex-1 basis-56">
                  <span className="block text-xs text-gray-200">{v.change_note ?? "No change note."}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-gray-500">
                    {fullDate(v.created_at)} · {v.triggered_by === "agent" ? "scheduled" : "manual"} · +{v.claims_added} / −{v.claims_removed} claims · {v.source_count} sources
                  </span>
                </span>
                {v.version_number === latest && <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">latest</span>}
                <span className="w-28 shrink-0">{v.confidence_score != null && <ConfidenceBar value={v.confidence_score} />}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
