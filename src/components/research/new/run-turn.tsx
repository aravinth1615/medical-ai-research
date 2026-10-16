"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CircleAlert,
  Copy,
  FileText,
  Globe,
  Library,
  Maximize,
  Minimize,
  Refresh,
  Sparkles,
} from "@/lib/icons";
import { costTierLabel, providerStyle, researchRoutes } from "@/lib/research/format";
import type { ReportState, ReportVersionRead, ResearchModel, RunModelExecutionRead } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import {
  ConfidenceBar,
  ProviderLogo,
  ReportStatePill,
  StatusPill,
  TierBadge,
  copyTextToClipboard,
  renderWithCitations,
} from "@/components/research/ui/primitives";
import { FormattedResponse } from "@/components/research/ui/formatted-response";

/** What was sent with the run, snapshotted when Run research was clicked. */
export interface SubmittedRun {
  at: number;
  prompt: string;
  libraryPrompt: string | null;
  sources: string[];
  files: string[];
  reports: string[];
}

export interface RunViewModel {
  reportId: string;
  title: string;
  models: ResearchModel[];
  state: ReportState;
  warning: string | null;
  executions: RunModelExecutionRead[] | null;
  version: ReportVersionRead | null;
}

const compactPill = {
  className: "p-1.5 @[20rem]:px-2 @[20rem]:py-0.5",
  labelClassName: "sr-only @[20rem]:not-sr-only",
};

const formatCost = (cost: number) => (cost < 0.01 ? cost.toFixed(4) : cost.toFixed(2));

/** A run as a chat turn: the submitted prompt, one card per model as it
 *  answers, and the merged report once it's published. */
export function RunTurn({
  submitted,
  run,
  starting,
  runEnded,
  onToast,
}: {
  submitted: SubmittedRun | null;
  run: RunViewModel;
  starting: boolean;
  runEnded: boolean;
  onToast: (message: string) => void;
}) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const n = run.models.length;
  const expanded = expandedId && run.models.some((m) => m.id === expandedId) ? expandedId : null;
  const attachments = submitted
    ? [
        ...(submitted.libraryPrompt ? [{ key: "lib", icon: Library, label: submitted.libraryPrompt }] : []),
        ...submitted.sources.map((s, i) => ({ key: `s${i}`, icon: Globe, label: s })),
        ...submitted.files.map((f, i) => ({ key: `f${i}`, icon: FileText, label: f })),
        ...submitted.reports.map((r, i) => ({ key: `r${i}`, icon: BookOpen, label: r })),
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1600px] animate-rise-in space-y-4">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#141722] p-4 @3xl:flex-row @3xl:items-center">
        <div className="min-w-0 max-w-4xl space-y-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-gray-400">
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-semibold text-indigo-300">USER PROMPT</span>
            {submitted && <span>{new Date(submitted.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
            <span className="whitespace-nowrap">· Routed to {n} model(s)</span>
            {starting ? <StatusPill tone="indigo" live label="Starting" /> : <ReportStatePill state={run.state} />}
          </div>
          <div className="text-[15px] leading-relaxed font-medium break-words whitespace-pre-wrap text-white">{submitted?.prompt || run.title}</div>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {attachments.map(({ key, icon: Icon, label }) => (
                <div key={key} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-[#0B0D13] px-2.5 py-1.5 text-xs">
                  <Icon className="size-4 shrink-0 text-indigo-400" />
                  <span className="max-w-[260px] truncate font-mono text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {runEnded ? (
            <Link
              href={researchRoutes.report(run.title, run.reportId)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors",
                run.state === "ready" || run.state === "scheduled"
                  ? "border-indigo-400/40 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500"
                  : "border-white/[0.08] bg-[#141722] text-gray-200 hover:bg-[#1B1F2E]"
              )}
            >
              <Sparkles className="size-3.5" />
              <span>{run.state === "ready" || run.state === "scheduled" ? "Go to report" : "Open report"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex max-w-full cursor-not-allowed items-center gap-2 rounded-lg border border-white/5 bg-[#191D2B] px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-gray-500"
            >
              <Sparkles className="size-3.5 shrink-0" />
              <span className="@sm:hidden">Merging when done…</span>
              <span className="hidden @sm:inline">Merging when every model finishes…</span>
            </button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          expanded ? "grid-cols-1" : n === 1 ? "mx-auto max-w-4xl grid-cols-1" : n === 3 ? "grid-cols-1 @2xl:grid-cols-2 @3xl:grid-cols-3" : "grid-cols-1 @2xl:grid-cols-2"
        )}
      >
        {run.models.map((m) => {
          if (expanded && expanded !== m.id) return null;
          return (
            <ModelResponseCard
              key={m.id}
              model={m}
              exec={run.executions?.find((e) => e.model_id === m.id) ?? null}
              isExpanded={expanded === m.id}
              onToggleExpand={() => setExpandedId((prev) => (prev === m.id ? null : m.id))}
              onToast={onToast}
            />
          );
        })}
      </div>

      <MergedReportCard run={run} starting={starting} onToast={onToast} />
    </div>
  );
}

function ModelResponseCard({
  model,
  exec,
  isExpanded,
  onToggleExpand,
  onToast,
}: {
  model: ResearchModel;
  exec: RunModelExecutionRead | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToast: (message: string) => void;
}) {
  const s = providerStyle(model.provider);
  const status = exec?.status ?? "queued";
  const loading = status === "queued" || status === "running";
  const body = exec?.body?.trim() || null;

  return (
    <div className="@container flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#11131A] transition-colors duration-200 hover:border-white/[0.14]">
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${s.accent}, transparent)` }} />
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#151822]/90 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProviderLogo provider={model.provider} />
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="min-w-0 truncate text-[13.5px] font-semibold text-gray-100">{model.name}</span>
              <TierBadge provider={model.provider}>{costTierLabel(model.cost_tier)}</TierBadge>
            </div>
            <div className="truncate text-[11px] text-gray-400">
              {s.label} · ~{Math.round(model.avg_latency_seconds)}s
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {status === "queued" && <StatusPill tone="indigo" live label="In progress" {...compactPill} />}
          {status === "running" && <StatusPill tone="indigo" live label="Answering…" {...compactPill} />}
          {status === "failed" && <StatusPill tone="red" label="Failed" {...compactPill} />}
          {status === "cancelled" && <StatusPill tone="gray" label="Cancelled" {...compactPill} />}
          {status === "done" && exec?.duration_ms != null && (
            <div className="hidden items-center gap-2 rounded border border-white/[0.06] bg-[#0B0D13] px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-gray-400 @sm:flex">
              <span title="Time to answer">{(exec.duration_ms / 1000).toFixed(1)}s</span>
              {exec.tokens_used != null && (
                <>
                  <span className="text-gray-600">·</span>
                  <span className="text-emerald-400" title="Tokens used">
                    {(exec.tokens_used / 1000).toFixed(1)}K tok
                  </span>
                </>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Restore grid view" : "Expand card"}
            title={isExpanded ? "Restore grid view" : "Expand card"}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            {isExpanded ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between space-y-4 p-4">
        <div className="min-w-0 space-y-3">
          {loading && (
            <div className="animate-pulse space-y-3 py-2">
              <div className="flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 font-mono text-xs text-indigo-300">
                <Brain className="size-3.5 animate-spin" />
                <span>{status === "running" ? "Answering…" : "Queued for this model…"}</span>
              </div>
              <div className="h-3.5 w-3/4 rounded bg-white/5" />
              <div className="h-3.5 w-full rounded bg-white/5" />
              <div className="h-3.5 w-5/6 rounded bg-white/5" />
              <div className="h-20 w-full rounded-lg border border-white/5 bg-white/[0.03]" />
            </div>
          )}
          {status === "failed" && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-400" />
              <div className="min-w-0">
                <div className="font-semibold">This model failed to respond</div>
                {exec?.error_message && <div className="mt-0.5 break-words text-red-300/80">{exec.error_message}</div>}
              </div>
            </div>
          )}
          {status === "cancelled" && <p className="text-xs text-gray-400">Cancelled.</p>}
          {status === "done" &&
            (body ? (
              <FormattedResponse text={body} onCopy={onToast} className="[&>div:first-child>:first-child]:pt-0" />
            ) : (
              <p className="text-[14.5px] leading-[1.68] text-gray-300">Done — included in the merged report.</p>
            ))}
        </div>

        {status === "done" && (
          <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 font-mono text-[11px] text-gray-400">
            <div className="flex flex-wrap items-center gap-2">
              {exec?.tokens_used != null && <span>{exec.tokens_used.toLocaleString("en-US")} tok</span>}
              {exec?.tokens_used != null && exec?.cost != null && <span>·</span>}
              {exec?.cost != null && <span>${formatCost(exec.cost)}</span>}
            </div>
            {body && (
              <button
                type="button"
                onClick={() => {
                  copyTextToClipboard(body);
                  onToast(`Copied ${model.name} response`);
                }}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-gray-300 transition-colors hover:bg-white/[0.06]"
                title="Copy full response"
              >
                <Copy className="size-3.5" />
                <span>Copy</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MergedReportCard({ run, starting, onToast }: { run: RunViewModel; starting: boolean; onToast: (message: string) => void }) {
  const v = run.version;
  const published = run.state === "ready" || run.state === "scheduled";
  const hasContent = published && v != null && (!!v.executive_summary || v.sections.length > 0);
  const waiting = starting || run.state === "running";

  const copySummary = () => {
    if (!v) return;
    const text = [v.executive_summary ? `Executive summary\n\n${v.executive_summary}` : null, ...v.sections.map((s) => `${s.title}\n\n${s.body}`)]
      .filter(Boolean)
      .join("\n\n");
    copyTextToClipboard(text);
    onToast("Copied merged report summary");
  };

  return (
    <div className="space-y-3 rounded-xl border border-indigo-500/40 bg-linear-to-b/srgb from-[#171A29] to-[#11131C] p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/40 bg-indigo-500/20 text-indigo-300">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-white">
              <span className="whitespace-nowrap">Merged Report</span>
              {hasContent && <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-[10px] text-indigo-300">Consensus</span>}
            </div>
            <div className="truncate text-xs text-gray-400">Merged across {run.models.map((m) => m.name).join(", ")}</div>
          </div>
        </div>
        {hasContent && (
          <button
            type="button"
            onClick={copySummary}
            aria-label="Copy summary"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs whitespace-nowrap text-gray-200 transition-colors hover:bg-white/10"
          >
            <Copy className="size-3.5" />
            <span className="hidden @sm:inline">Copy summary</span>
          </button>
        )}
      </div>

      {waiting && (
        <div className="flex items-center gap-3 py-4 font-mono text-xs text-indigo-300">
          <Refresh className="size-4 shrink-0 animate-spin" />
          <span>
            {starting
              ? "Creating the report and queueing your prompt for every model you picked…"
              : "Waiting for every model, then merging the passes into one cited report…"}
          </span>
        </div>
      )}

      {run.state === "draft" && !starting && <p className="py-2 text-xs text-gray-400">This run was cancelled before it published a version.</p>}

      {hasContent && v && (
        <div className="max-w-[80ch] space-y-5">
          {v.executive_summary && (
            <section className="space-y-2">
              <h4 className="pt-1 text-[15px] font-semibold tracking-tight text-white">Executive summary</h4>
              {v.executive_summary.split(/\n\n+/).map((para, i) => (
                <p key={i} className="text-[14.5px] leading-[1.68] text-gray-200">
                  {renderWithCitations(para)}
                </p>
              ))}
            </section>
          )}
          {v.sections.map((s) => (
            <section key={s.id} className="space-y-2">
              <div className="flex items-end justify-between gap-4 border-b border-white/5 pb-1">
                <h3 className="text-[16px] font-semibold tracking-tight text-white">{s.title}</h3>
                {s.confidence_score != null && <ConfidenceBar value={s.confidence_score} className="w-24 shrink-0 pb-1" />}
              </div>
              {s.body.split(/\n\n+/).map((para, i) => (
                <p key={i} className="text-[14.5px] leading-[1.68] text-gray-200">
                  {renderWithCitations(para)}
                </p>
              ))}
            </section>
          ))}
        </div>
      )}

      {run.state === "failed" && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-400" />
          <span>This run failed. Open the report to see what came back before it failed.</span>
        </div>
      )}

      {run.warning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <span>{run.warning}</span>
        </div>
      )}
    </div>
  );
}
