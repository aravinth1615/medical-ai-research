"use client";

import * as React from "react";
import { Check, Layers, PanelRightClose, Search, X } from "@/lib/icons";
import { costTierLabel, providerStyle } from "@/lib/research/format";
import type { ModelCostTier, ResearchModel } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { ProviderLogo, TierBadge, inputClass } from "@/components/research/ui/primitives";

export interface Ensemble {
  key: string;
  name: string;
  subtitle: string;
  ids: string[];
}

const FILTERS: { id: "all" | ModelCostTier; label: string }[] = [
  { id: "all", label: "All" },
  { id: "low", label: "Low cost" },
  { id: "medium", label: "Mid cost" },
  { id: "high", label: "High cost" },
];

/** The right-hand model registry: filter, quick ensembles from recent runs,
 *  and the toggleable model list grouped by provider. */
export function ModelRegistry({
  models,
  loading,
  picked,
  onToggle,
  onPickSet,
  ensembles,
  onClose,
}: {
  models: ResearchModel[] | null;
  loading: boolean;
  picked: string[];
  onToggle: (id: string) => void;
  onPickSet: (ids: string[]) => void;
  ensembles: Ensemble[];
  onClose: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | ModelCostTier>("all");
  const all = React.useMemo(() => models ?? [], [models]);

  const groups = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const out: { group: string; models: ResearchModel[] }[] = [];
    for (const m of all) {
      if (filter !== "all" && m.cost_tier !== filter) continue;
      const s = providerStyle(m.provider);
      if (q && ![m.name, s.label, m.description, costTierLabel(m.cost_tier)].some((v) => v.toLowerCase().includes(q))) continue;
      const g = out.find((x) => x.group === s.group);
      if (g) g.models.push(m);
      else out.push({ group: s.group, models: [m] });
    }
    return out;
  }, [all, search, filter]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/[0.07] p-3.5">
        <div>
          <div className="text-[13px]/[1.125rem] font-bold tracking-wider text-white uppercase">Model Registry</div>
          <div className="text-[12px] text-gray-400">
            {picked.length}/{all.length} selected
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Collapse model registry"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <PanelRightClose className="size-4" />
        </button>
      </div>

      <div className="space-y-2.5 border-b border-white/[0.06] p-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter models"
            placeholder={`Filter ${all.length} models…`}
            className={cn(inputClass, "pr-7 pl-8 text-[13px]")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear filter"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-md border px-2 py-1 text-[12px] font-medium transition-colors",
                filter === f.id
                  ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
                  : "border-transparent text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {ensembles.length > 0 && (
        <div className="border-b border-white/[0.06] bg-[#0D0F17]/60 px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] tracking-wider text-gray-400 uppercase">
            <span>Quick Ensembles</span>
            <span className="text-indigo-400">From recent runs</span>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {ensembles.map((b) => {
              const isCurrent = b.ids.length === picked.length && b.ids.every((id) => picked.includes(id));
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => onPickSet(b.ids)}
                  aria-pressed={isCurrent}
                  title={`Pick ${b.subtitle}`}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[13px]/[1.125rem] transition-colors",
                    isCurrent
                      ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
                      : "border-white/[0.05] bg-[#131620] text-gray-300 hover:bg-[#181C29]"
                  )}
                >
                  <div className="min-w-0 truncate pr-2">
                    <div className="truncate text-[12.5px] font-medium">{b.name}</div>
                    <div className="truncate text-[11px] text-gray-500">{b.subtitle}</div>
                  </div>
                  <Layers className="size-3.5 shrink-0 text-indigo-400" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[84px] rounded-xl border border-white/[0.05] bg-white/[0.03]" />
            ))}
          </div>
        ) : all.length === 0 ? (
          <div className="rounded-xl border border-white/[0.05] bg-[#0E1017] p-4 text-center">
            <div className="text-[13px] font-semibold text-gray-200">No models available</div>
            <p className="mt-1 text-[12px] leading-relaxed text-gray-400">No active models are configured.</p>
          </div>
        ) : groups.length === 0 ? (
          <p className="px-1 text-[12px] text-gray-500">No models match this filter.</p>
        ) : (
          groups.map(({ group, models: list }) => (
            <div key={group} className="space-y-1.5">
              <div className="flex items-center justify-between px-1 font-mono text-[11px] tracking-wider text-gray-500 uppercase">
                <span>{group}</span>
                <span>{list.length}</span>
              </div>
              {list.map((m) => {
                const isSelected = picked.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => onToggle(m.id)}
                    className={cn(
                      "group relative w-full rounded-xl border p-2.5 text-left transition-colors duration-150",
                      isSelected
                        ? "border-indigo-500/50 bg-[#171B26] shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]"
                        : "border-white/[0.05] bg-[#0E1017] hover:bg-[#141722]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <ProviderLogo provider={m.provider} />
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-gray-100">{m.name}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <TierBadge provider={m.provider} className="py-0 text-[11px] font-normal">
                              {costTierLabel(m.cost_tier)}
                            </TierBadge>
                            <span className="font-mono text-[11px] text-gray-400">~{Math.round(m.avg_latency_seconds)}s</span>
                            <span className="font-mono text-[11px] text-gray-500">· ~${m.cost_per_run_estimate.toFixed(2)}/run</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected ? "border-indigo-400 bg-indigo-500 text-white" : "border-white/20 group-hover:border-white/40"
                        )}
                      >
                        {isSelected && <Check className="size-3" strokeWidth={3} />}
                      </div>
                    </div>
                    {m.description && <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-gray-400">{m.description}</p>}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.07] bg-[#0C0E14] p-3 font-mono text-[12px] text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", loading ? "animate-pulse bg-indigo-400" : all.length ? "bg-emerald-400" : "bg-gray-500")} />
          {loading ? "Loading models…" : `${all.length} model${all.length === 1 ? "" : "s"} available`}
        </span>
        <span>{picked.length} selected</span>
      </div>
    </>
  );
}
