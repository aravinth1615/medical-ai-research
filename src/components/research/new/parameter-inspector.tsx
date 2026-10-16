"use client";

import { Clock, Layers, Repeat, Sliders, Sparkles, X } from "@/lib/icons";
import { CADENCES, DEPTHS, type CadenceId, type DepthId } from "@/lib/research/format";
import { cn } from "@/lib/utils";

/** The parameter drawer: depth, cadence and the live estimate. */
export function ParameterInspector({
  onClose,
  depth,
  onDepthChange,
  depthHint,
  depthFactor,
  cadence,
  onCadenceChange,
  estimateLine,
}: {
  onClose: () => void;
  depth: DepthId;
  onDepthChange: (depth: DepthId) => void;
  depthHint: string;
  depthFactor: number;
  cadence: CadenceId;
  onCadenceChange: (cadence: CadenceId) => void;
  estimateLine: React.ReactNode;
}) {
  const cadenceMeta = CADENCES.find((c) => c.id === cadence)!;

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/[0.07] p-3.5">
        <div className="flex items-center gap-2">
          <Sliders className="size-4 text-indigo-400" />
          <span className="text-[13px]/[1.125rem] font-bold tracking-wider text-white uppercase">Run Parameters</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close run parameters"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]/[1.125rem]">
            <span className="font-medium text-gray-300">Depth</span>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-indigo-400 tabular-nums">{depthFactor}× cost</span>
          </div>
          <div role="radiogroup" aria-label="Research depth" className="grid grid-cols-3 gap-1.5 rounded-lg border border-white/[0.06] bg-[#0B0D13] p-1">
            {DEPTHS.map((d) => (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={depth === d.id}
                title={d.hint}
                onClick={() => onDepthChange(d.id)}
                className={cn(
                  "rounded-md py-1.5 font-mono text-[12px] whitespace-nowrap uppercase transition-colors",
                  depth === d.id ? "bg-indigo-600 font-semibold text-white" : "text-gray-400 hover:text-gray-200"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-[11.5px] leading-relaxed text-gray-500">{depthHint}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]/[1.125rem] font-medium text-gray-300">
            <span>Cadence</span>
            <Repeat className="size-3.5 text-gray-500" />
          </div>
          <div role="radiogroup" aria-label="Cadence" className="grid grid-cols-1 gap-1.5">
            {CADENCES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={cadence === c.id}
                onClick={() => onCadenceChange(c.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-[13px]/[1.125rem] transition-colors",
                  cadence === c.id
                    ? "border-indigo-500/40 bg-indigo-500/15 font-medium text-indigo-200"
                    : "border-white/[0.06] bg-[#0B0D13] text-gray-400 hover:text-gray-200"
                )}
              >
                <span className="shrink-0">{c.label}</span>
                <span className={cn("min-w-0 truncate text-[11.5px] font-normal", cadence === c.id ? "text-indigo-300/80" : "text-gray-500")}>
                  {c.hint}
                </span>
              </button>
            ))}
          </div>
          {cadence === "once" ? (
            <p className="text-[11.5px] leading-relaxed text-gray-500">
              {cadenceMeta.hint}. The report is written once and then frozen — re-run it by hand whenever new
              results come in.
            </p>
          ) : (
            <div className="flex gap-2 rounded-lg border border-white/[0.08] bg-[#0B0D13] p-2.5">
              <Clock className="mt-px size-3.5 shrink-0 text-indigo-400" />
              <p className="text-[12px] leading-relaxed text-gray-300">
                {cadenceMeta.hint}. The question is re-run on that schedule and an updated version is published — the
                old ones are kept, so you can see what changed. It appears under Preference → Schedule.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]/[1.125rem] font-medium text-gray-300">
            <span>Estimate</span>
            <Layers className="size-3.5 text-gray-500" />
          </div>
          <div className="space-y-1 rounded-lg border border-white/[0.08] bg-[#0B0D13] p-3">
            <div className="font-mono text-[13px]/[1.125rem] text-gray-200 tabular-nums">{estimateLine}</div>
            <div className="font-mono text-[11.5px] text-gray-500">billed on completion</div>
          </div>
        </div>

        <div className="flex gap-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-indigo-400" />
          <p className="text-[12px] leading-relaxed text-gray-400">
            Every claim in the finished report carries the model that found it and the source behind it. Anything two
            models disagree on is marked contested rather than averaged away.
          </p>
        </div>
      </div>
    </>
  );
}
