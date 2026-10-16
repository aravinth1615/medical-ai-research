"use client";

import * as React from "react";
import { BookOpen, Clock, Layers, PieChart, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type ReportTab = "summary" | "executive" | "models" | "sources" | "versions";

const TABS: { id: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "summary", label: "AI Summary", icon: Sparkles },
  { id: "executive", label: "Executive Summary", icon: PieChart },
  { id: "models", label: "Model passes", icon: Layers },
  { id: "sources", label: "Sources", icon: BookOpen },
  { id: "versions", label: "Versions", icon: Clock },
];

export const tabPanelId = (tab: ReportTab) => `report-tab-${tab}`;

/**
 * The tab an in-page anchor lives in, so a link to it (the section nav, a
 * "Compare models" button, a shared URL's #hash) can switch tabs first.
 * null for anchors outside the tabs — the re-run box, its notes.
 */
export function tabForAnchor(hash: string): ReportTab | null {
  const id = hash.replace(/^#/, "");
  if (!id) return null;
  if (
    id === "master-summary" ||
    id.startsWith("section-") ||
    id === "lab-results" ||
    id.startsWith("sec-") ||
    id.startsWith("plan-") ||
    id === "doctor-workspace" ||
    id === "followup-workspace"
  )
    return "summary";
  if (id === "executive-summary") return "executive";
  if (id === "model-passes" || id.startsWith("model-")) return "models";
  if (id === "report-sources") return "sources";
  if (id === "report-versions") return "versions";
  return null;
}

/**
 * The report's tabs — AI Summary (the merged answer, its sections, the
 * biomarker panels and the clinician's workspace), Executive Summary (red and
 * yellow deviations, the severity index and the testing & treatment
 * protocol), Model passes, Sources and Versions. A WAI-ARIA tablist: arrow
 * keys, Home and End move between tabs and select them.
 */
export function ReportTabs({
  active,
  onChange,
  counts,
}: {
  active: ReportTab;
  onChange: (tab: ReportTab) => void;
  /** Shown as a pill after the label, when known. */
  counts: Partial<Record<ReportTab, number>>;
}) {
  const refs = React.useRef<Partial<Record<ReportTab, HTMLButtonElement | null>>>({});

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === active);
    const next =
      e.key === "ArrowRight"
        ? (i + 1) % TABS.length
        : e.key === "ArrowLeft"
          ? (i - 1 + TABS.length) % TABS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? TABS.length - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(TABS[next].id);
    refs.current[TABS[next].id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Report views"
      onKeyDown={onKeyDown}
      className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-panel p-1"
    >
      {TABS.map((t) => {
        const on = t.id === active;
        const count = counts[t.id];
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${tabPanelId(t.id)}-tab`}
            aria-selected={on}
            aria-controls={tabPanelId(t.id)}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:outline-none",
              on
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-gray-400 hover:bg-white/[0.05] hover:text-gray-100"
            )}
          >
            <t.icon className={cn("size-3.5", on ? "text-white" : "text-gray-500")} />
            {t.label}
            {count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none tabular-nums",
                  on ? "bg-white/20 text-white" : "bg-white/[0.06] text-gray-400"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** One tab's content. Inactive tabs stay mounted (hidden), so filters,
 *  expanded answers and drafts survive switching. */
export function ReportTabPanel({ tab, active, children }: { tab: ReportTab; active: ReportTab; children: React.ReactNode }) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(tab)}
      aria-labelledby={`${tabPanelId(tab)}-tab`}
      hidden={tab !== active}
      className={tab === active ? "flex animate-fade-in flex-col gap-6" : "hidden"}
    >
      {children}
    </div>
  );
}
