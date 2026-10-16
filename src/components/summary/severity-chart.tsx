"use client";

import * as React from "react";
import { BarChart, CircleAlert, Info } from "@/lib/icons";
import type { SeverityBar } from "@/lib/data/summary";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

const STATUS = {
  red: { bar: "bg-red-400", label: "Critical", icon: CircleAlert, text: "text-red-300" },
  yellow: { bar: "bg-amber-400", label: "Borderline", icon: Info, text: "text-amber-300" },
} as const;

function Row({ bar, grown }: { bar: SeverityBar; grown: boolean }) {
  const s = STATUS[bar.tone];
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 sm:grid-cols-[11rem_1fr_4.5rem] sm:gap-4">
      <span className="truncate text-right text-[13px] font-semibold text-gray-200" title={bar.label}>
        {bar.label}
      </span>
      <Tooltip
        content={
          <span className="flex items-center gap-1.5">
            <s.icon className={cn("size-3.5", s.text)} />
            <span className="font-medium">{bar.label}</span>
            <span className="text-gray-400">
              · {bar.value} · {s.label}, severity {bar.severity}/100
            </span>
          </span>
        }
      >
        {/* The hit target is the whole track, taller than the mark. */}
        <span className="relative flex h-6 cursor-default items-center" tabIndex={0} aria-label={`${bar.label} ${bar.value}, ${s.label}`}>
          <span className="absolute inset-x-0 h-3 rounded bg-white/[0.05]" aria-hidden />
          <span
            className={cn("relative h-3 rounded transition-[width] duration-[900ms] ease-(--ease-out)", s.bar)}
            style={{ width: grown ? `${bar.severity}%` : "0%" }}
            aria-hidden
          />
        </span>
      </Tooltip>
      <span className="flex items-center gap-1 font-mono text-xs font-semibold text-gray-200 tabular-nums">
        <s.icon className={cn("size-3.5 shrink-0", s.text)} aria-hidden />
        {bar.value}
      </span>
    </li>
  );
}

/** Relative severity across every out-of-range marker. Bars grow in once on
 *  mount — a one-off reveal on a page opened a few times a day. */
export function SeverityChart({ elevated, deficient }: { elevated: SeverityBar[]; deficient: SeverityBar[] }) {
  const [grown, setGrown] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-100">
            <BarChart className="size-4.5 text-gray-500" />
            Severity Index Overview
          </h2>
          <p className="mt-1 text-[13px] text-gray-500">
            Relative severity magnitude across all elevated and deficient biomarkers.
          </p>
        </div>
        <ul className="flex items-center gap-4 text-xs text-gray-400" aria-label="Legend">
          {(Object.keys(STATUS) as (keyof typeof STATUS)[]).map((k) => {
            const s = STATUS[k];
            return (
              <li key={k} className="flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-sm", s.bar)} aria-hidden />
                {s.label}
              </li>
            );
          })}
        </ul>
      </div>

      <h3 className="mt-5 mb-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">Elevated</h3>
      <ul className="flex flex-col gap-2">
        {elevated.map((b) => (
          <Row key={b.label} bar={b} grown={grown} />
        ))}
      </ul>

      <h3 className="mt-5 mb-2 border-t border-dashed border-white/10 pt-4 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
        Deficient
      </h3>
      <ul className="flex flex-col gap-2">
        {deficient.map((b) => (
          <Row key={b.label} bar={b} grown={grown} />
        ))}
      </ul>
    </section>
  );
}
