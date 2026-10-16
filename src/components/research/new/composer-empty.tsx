"use client";

import Link from "next/link";
import { Activity, Brain, Code, Cpu, Shield, X } from "@/lib/icons";
import { cadenceMeta, costTierLabel, providerStyle, relativeTime, researchRoutes } from "@/lib/research/format";
import type { PromptTemplateRead, ReportRead, ResearchModel } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import {
  ConfidenceBar,
  InlineError,
  ProviderBadge,
  ReportStatePill,
  SectionLabel,
  TierBadge,
} from "@/components/research/ui/primitives";

const PRESET_ICONS = [Cpu, Brain, Code, Shield];

/** The hero above the chat box. Closing it hides it until the page is next
 *  loaded. */
export function WorkspaceIntro({
  activeCount,
  onClose,
  className,
}: {
  activeCount: number;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto max-w-2xl space-y-3 px-2 text-center sm:px-8", className)}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close intro"
        title="Close (it comes back when the page is refreshed)"
        className="absolute top-0 right-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <X className="size-4" />
      </button>
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 font-mono text-xs text-indigo-300">
        <Activity className="size-3.5" />
        <span>Multi-model research · {activeCount} Active</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white @xl:text-3xl">Route, Compare, and Synthesize Frontier LLMs</h1>
      <p className="text-sm leading-relaxed text-gray-400">
        Send one clinical question to every model you pick. Each answers it independently against the patient&apos;s
        records and cited literature, then the passes are merged into a single report you can check claim by claim.
      </p>
    </div>
  );
}

/** The full workspace before anything has run: the intro, the picked models
 *  as dispatch targets, and prompt-library presets. */
export function EmptyWorkspace({
  introOpen,
  onCloseIntro,
  loading,
  error,
  onRetry,
  chosen,
  onOpenRegistry,
  presets,
  onPickPreset,
  onBrowseLibrary,
  libraryDisabled,
}: {
  introOpen: boolean;
  onCloseIntro: () => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  chosen: ResearchModel[];
  onOpenRegistry: () => void;
  presets: PromptTemplateRead[] | null;
  onPickPreset: (template: PromptTemplateRead) => void;
  onBrowseLibrary: () => void;
  libraryDisabled: boolean;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pt-4">
      {introOpen && <WorkspaceIntro activeCount={chosen.length} onClose={onCloseIntro} />}

      {loading ? (
        <div className="animate-pulse space-y-2.5" aria-label="Loading models">
          <div className="h-4 w-48 rounded bg-white/5" />
          <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
            <div className="h-36 rounded-xl border border-white/[0.08] bg-[#11131A]/90" />
            <div className="h-36 rounded-xl border border-white/[0.08] bg-[#11131A]/90" />
          </div>
        </div>
      ) : error ? (
        <InlineError message={`Couldn't load models — ${error}`} onRetry={onRetry} />
      ) : (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 font-mono text-xs text-gray-400">
            <span>ACTIVE DISPATCH TARGETS ({chosen.length})</span>
            <button type="button" onClick={onOpenRegistry} className="text-left transition-colors hover:text-indigo-300">
              Select or toggle models in the right sidebar →
            </button>
          </div>
          {chosen.length === 0 ? (
            <div className="space-y-2 rounded-xl border border-dashed border-white/[0.12] bg-[#11131A]/90 p-6 text-center">
              <div className="text-sm font-semibold text-white">No models selected</div>
              <p className="text-xs leading-relaxed text-gray-400">
                Pick at least one model in the registry — every model you pick answers the question on its own.
              </p>
              <button
                type="button"
                onClick={onOpenRegistry}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/50 bg-indigo-500/20 px-3 py-1.5 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-500/30"
              >
                Open model registry
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-3",
                chosen.length === 1
                  ? "mx-auto max-w-xl grid-cols-1"
                  : chosen.length === 2
                    ? "grid-cols-1 @2xl:grid-cols-2"
                    : chosen.length === 3
                      ? "grid-cols-1 @2xl:grid-cols-2 @3xl:grid-cols-3"
                      : "grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-4"
              )}
            >
              {chosen.map((m) => (
                <div key={m.id} className="flex flex-col justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#11131A]/90 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <ProviderBadge provider={m.provider} />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-gray-400">{providerStyle(m.provider).label}</div>
                      </div>
                    </div>
                    <TierBadge provider={m.provider} className="font-normal">
                      {costTierLabel(m.cost_tier)}
                    </TierBadge>
                  </div>
                  <div className="text-[11.5px] leading-relaxed text-gray-400">{m.description}</div>
                  <div className="flex items-center justify-between gap-2 border-t border-white/[0.05] pt-2 font-mono text-[11px] text-gray-500">
                    <span>Latency: ~{Math.round(m.avg_latency_seconds)}s</span>
                    <span>Cost: ~${m.cost_per_run_estimate.toFixed(2)}/run</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {presets && presets.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
            <SectionLabel className="px-0">Prompt Library Presets</SectionLabel>
            <button
              type="button"
              onClick={onBrowseLibrary}
              disabled={libraryDisabled}
              className="font-mono text-xs text-gray-400 transition-colors hover:text-indigo-300 disabled:cursor-not-allowed disabled:text-gray-600"
            >
              Browse prompt library →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
            {presets.map((t, i) => {
              const Icon = PRESET_ICONS[i % PRESET_ICONS.length];
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={libraryDisabled}
                  onClick={() => onPickPreset(t)}
                  title={`Attach “${t.title}” from the prompt library`}
                  className="group flex items-start gap-3.5 rounded-xl border border-white/[0.07] bg-[#11131A] p-4 text-left transition-colors hover:border-indigo-500/40 hover:bg-[#161924] disabled:cursor-not-allowed"
                >
                  <div className="shrink-0 rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 @2xl:flex-nowrap">
                      <span className="text-xs font-semibold text-gray-100 transition-colors group-hover:text-indigo-300 @2xl:truncate">
                        {t.title}
                      </span>
                      <span className="max-w-full shrink-0 truncate rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-400 @2xl:max-w-[45%]">
                        {t.category?.name ?? "Prompt"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">{t.prompt}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** The latest reports, newest first — under the empty workspace and under a
 *  run alike. */
export function RecentRuns({
  loading,
  recent,
  className,
}: {
  loading: boolean;
  recent: ReportRead[] | null;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto mt-8 space-y-2.5 pb-4", className)}>
      <div className="flex items-center justify-between gap-3 px-1 font-mono text-xs text-gray-400">
        <span>
          RECENT RUNS <span className="text-gray-600">· newest first</span>
        </span>
        <Link href={researchRoutes.reports} className="transition-colors hover:text-indigo-300">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[62px] rounded-xl border border-white/[0.07] bg-[#11131A]" />
          ))}
        </div>
      ) : !recent || recent.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#11131A] p-5 text-center">
          <div className="text-xs font-semibold text-gray-200">No research yet</div>
          <p className="mt-1 text-xs text-gray-400">Ask a question below — the report will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {recent.map((r) => {
            const cadence = cadenceMeta(r.cadence);
            return (
              <li key={r.id}>
                <Link
                  href={researchRoutes.report(r.title, r.id)}
                  className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/[0.07] bg-[#11131A] px-4 py-3 transition-colors hover:border-indigo-500/40 hover:bg-[#161924]"
                >
                  <span className="flex w-[92px] shrink-0">
                    <ReportStatePill state={r.state} />
                  </span>
                  <span className="min-w-0 flex-1 basis-56">
                    <span className="block truncate text-xs font-semibold text-gray-100 transition-colors group-hover:text-indigo-300">
                      {r.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-400">{r.prompt}</span>
                  </span>
                  <span className="hidden w-14 shrink-0 items-center justify-end gap-1 @md:flex">
                    {r.selected_models.map((m) => (
                      <span key={m.id} title={m.name} className="size-2 rounded-full" style={{ backgroundColor: providerStyle(m.provider).accent }} />
                    ))}
                  </span>
                  <span className="flex w-[72px] shrink-0 justify-center">
                    <span
                      title={cadence.hint}
                      className={cn(
                        "w-full rounded px-1.5 py-0.5 text-center font-mono text-[10px]",
                        cadence.id === "once" ? "bg-white/5 text-gray-400" : "bg-indigo-500/15 text-indigo-300"
                      )}
                    >
                      {cadence.label}
                    </span>
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono text-[11px] text-gray-400 tabular-nums">v{r.version_count}</span>
                  <span className="hidden w-28 shrink-0 text-right font-mono text-[11px] text-gray-500 @2xl:block">
                    {relativeTime(r.updated_at)}
                  </span>
                  <span className="flex w-24 shrink-0 items-center">
                    {r.latest_confidence_score != null ? (
                      <ConfidenceBar value={r.latest_confidence_score} className="w-full" />
                    ) : (
                      <span className="w-full text-right font-mono text-[11px] text-gray-500">no score yet</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="px-1 font-mono text-[11px] text-gray-500">Reports are versioned — re-running never overwrites what you already read.</p>
    </div>
  );
}
