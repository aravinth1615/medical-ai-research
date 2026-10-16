"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

/* Small SVG charts for the Research screens — no charting library. Each is a
   single series or a composition, labelled in text ink, with a native title
   tooltip per mark. */

/** A KPI's change vs. its comparison window (flat under 0.05%, up is good). */
export function DeltaTag({ value }: { value: number }) {
  const flat = Math.abs(value) < 0.05;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 font-mono text-[11px] font-medium tabular-nums",
        flat ? "text-gray-400" : value > 0 ? "text-emerald-400" : "text-red-400"
      )}
    >
      {!flat && <Icon className="size-3" strokeWidth={2.5} />}
      {flat ? "0" : Math.abs(value).toFixed(1)}%
    </span>
  );
}

/** A thin area sparkline across a tile, in the tile's accent. */
export function Sparkline({ values, color, label }: { values: number[]; color: string; label?: string }) {
  const id = React.useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const w = 100;
  const h = 28;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const line = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-2 block h-7 w-full" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {label && <title>{label}</title>}
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#sp-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** One 100%-wide bar broken into shares, with a 2px gap between segments. */
export function ShareBar({
  segments,
  height = 8,
  className,
}: {
  segments: { label: string; value: number; color: string }[];
  height?: number;
  className?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <div className={cn("flex w-full gap-0.5 overflow-hidden rounded-full", className)} style={{ height }} role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div
            key={s.label}
            title={`${s.label} — ${s.value} (${((s.value / total) * 100).toFixed(0)}%)`}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
          />
        ))}
    </div>
  );
}

/** Confidence across a report's versions: a line with a dot per version. */
export function VersionTrend({
  points,
  color = "#818CF8",
  className,
}: {
  points: { label: string; value: number }[];
  color?: string;
  className?: string;
}) {
  if (points.length === 0) return null;
  const w = 240;
  const h = 56;
  const pad = 6;
  const min = Math.min(...points.map((p) => p.value), 40);
  const max = Math.max(...points.map((p) => p.value), 100);
  const span = max - min || 1;
  const xy = points.map((p, i) => ({
    ...p,
    x: points.length === 1 ? w / 2 : pad + (i / (points.length - 1)) * (w - pad * 2),
    y: h - pad - ((p.value - min) / span) * (h - pad * 2),
  }));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("block h-14 w-full", className)} role="img" aria-label={`Confidence by version: ${points.map((p) => `${p.label} ${p.value}`).join(", ")}`}>
      <line x1={pad} x2={w - pad} y1={h - pad} y2={h - pad} stroke="rgba(255,255,255,0.08)" />
      {xy.length > 1 && (
        <polyline
          points={xy.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {xy.map((p) => (
        <circle key={p.label} cx={p.x} cy={p.y} r={4} fill={color} stroke="#0F111A" strokeWidth={2}>
          <title>{`${p.label}: confidence ${p.value}`}</title>
        </circle>
      ))}
    </svg>
  );
}
