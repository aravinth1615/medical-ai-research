"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Columns,
  FileText,
  Layers,
  Maximize,
  Minimize,
  PanelRightClose,
  PanelRightOpen,
  Sliders,
  Sparkles,
  Terminal,
  Trash,
  X,
} from "@/lib/icons";
import { DEPTHS, researchRoutes, type DepthId } from "@/lib/research/format";
import type { ResearchModel } from "@/lib/research/types";
import { ProviderLogoMark } from "@/components/research/ui/primitives";

const DEPTH_ICON: Record<DepthId, typeof Terminal> = {
  quick: Terminal,
  standard: Columns,
  deep: Sparkles,
};

const control =
  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors active:scale-[0.97] [&_svg]:size-3.5";
const idle = "bg-[#141722] border-white/[0.08] text-gray-200 hover:bg-[#1B1F2E]";
const pressed = "bg-indigo-500/20 border-indigo-500/50 text-indigo-200";

/* Labels give way in a fixed order as the header narrows — model chips
   first, then the wordmark, then button labels, so the controls themselves
   are always there. Container queries, so it follows the column, not the
   window. */

/** The workspace header: brand, the depth switch, the chosen-model chips,
 *  Clear (once a run has ended), the view toggle and the two drawer toggles. */
export function ComposerHeader({
  modelCount,
  depth,
  onDepthChange,
  chosen,
  onRemoveModel,
  inspectorOpen,
  onToggleInspector,
  registryOpen,
  onToggleRegistry,
  onClear,
  minimal,
  onToggleView,
}: {
  modelCount: number | null;
  depth: DepthId;
  onDepthChange: (depth: DepthId) => void;
  chosen: ResearchModel[];
  onRemoveModel: (id: string) => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  registryOpen: boolean;
  onToggleRegistry: () => void;
  /** Set only once the current run has ended. */
  onClear: (() => void) | null;
  minimal: boolean;
  onToggleView: () => void;
}) {
  return (
    <header className="@container flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/[0.07] bg-[#090A0F]/85 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden shrink-0 items-center gap-2 border-r border-white/[0.07] pr-2 @[25rem]:flex">
          <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br/srgb from-indigo-500 to-sky-500 shadow-md shadow-indigo-500/20">
            <Layers className="size-4 text-white" />
          </div>
          <div className="hidden @[53rem]:block">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-white uppercase">
              <span>Research</span>
              {modelCount != null && (
                <span className="hidden rounded border border-indigo-500/30 bg-indigo-500/20 px-1.5 font-mono text-[10px] tracking-normal whitespace-nowrap text-indigo-300 normal-case @[61rem]:inline">
                  {modelCount} models
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Research depth"
          className="hidden shrink-0 items-center rounded-lg border border-white/[0.07] bg-[#11131A] p-1 @[22rem]:flex"
        >
          {DEPTHS.map((d) => {
            const Icon = DEPTH_ICON[d.id];
            const active = depth === d.id;
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={d.label}
                title={d.hint}
                onClick={() => onDepthChange(d.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  active ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
                )}
              >
                <Icon className="size-3.5" />
                <span className="hidden @[39rem]:inline">{d.label}</span>
              </button>
            );
          })}
        </div>

        {chosen.length > 0 && (
          <div className="hidden min-w-0 items-center gap-1.5 overflow-x-auto py-1 @min-[1180px]:flex">
            {chosen.map((m) => (
              <span
                key={m.id}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#141722] px-2.5 py-1 text-xs whitespace-nowrap text-gray-200"
              >
                <ProviderLogoMark provider={m.provider} />
                <span>{m.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveModel(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="ml-0.5 text-gray-500 hover:text-gray-200"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 @[28rem]:gap-2">
        <Link href={researchRoutes.reports} aria-label="All reports" title="All reports" className={cn(control, idle, "hidden @[24rem]:flex")}>
          <span className="hidden @[57rem]:inline">All reports</span>
          <FileText className="text-indigo-400 @[57rem]:hidden" />
          <ArrowRight className="hidden text-indigo-400 @[57rem]:block" />
        </Link>

        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear"
            title="Clear the workspace — the report is kept"
            className={cn(control, "border-white/[0.08] bg-[#141722] text-gray-400 hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-300")}
          >
            <Trash />
            <span className="hidden @[62rem]:inline">Clear</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleView}
          aria-label={minimal ? "Advanced" : "Normal mode"}
          title={minimal ? "Advanced — presets and recent runs" : "Normal mode — just the chat box"}
          className={cn(control, idle)}
        >
          {minimal ? <Maximize className="text-indigo-400" /> : <Minimize className="text-indigo-400" />}
          <span className="hidden @[48rem]:inline">{minimal ? "Advanced" : "Normal"}</span>
        </button>

        <button
          type="button"
          onClick={onToggleInspector}
          aria-pressed={inspectorOpen}
          aria-label="Parameters"
          className={cn(control, inspectorOpen ? pressed : idle)}
        >
          <Sliders className="text-indigo-400" />
          <span className="hidden @[44rem]:inline">Parameters</span>
        </button>

        <button
          type="button"
          onClick={onToggleRegistry}
          aria-pressed={registryOpen}
          aria-label={`Models (${chosen.length})`}
          title="Toggle the model registry"
          className={cn(control, registryOpen ? pressed : idle)}
        >
          <span>
            <span className="hidden @md:inline">Models </span>({chosen.length})
          </span>
          {registryOpen ? <PanelRightClose className="text-indigo-400" /> : <PanelRightOpen className="text-indigo-400" />}
        </button>
      </div>
    </header>
  );
}
