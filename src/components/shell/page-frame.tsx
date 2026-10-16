import * as React from "react";
import { cn } from "@/lib/utils";

/* Page building blocks in the Research workspace's language — sticky header
   bar, intro band, fact tiles and section cards — so every screen reads as
   the same product. Server-safe: no client hooks. */

export function PageHeaderBar({
  icon,
  title,
  badge,
  status,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  /** e.g. "3 lab sources merged" — hidden on narrow screens. */
  status?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/[0.08] bg-[#0C0E15]/90 px-4 py-2.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-linear-to-br/srgb from-indigo-500 to-sky-500 shadow-lg shadow-indigo-500/20 [&_svg]:size-4 [&_svg]:text-white">
          {icon}
        </span>
        <div className="flex min-w-0 items-center gap-2 font-bold tracking-tight whitespace-nowrap text-white">
          <h1 className="truncate">{title}</h1>
          {badge != null && (
            <span className="rounded border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 font-mono text-[10px] text-indigo-300">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status != null && (
          <div className="mr-2 hidden items-center gap-2 font-mono text-xs text-gray-400 lg:flex">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
            <span>{status}</span>
          </div>
        )}
        {actions}
      </div>
    </header>
  );
}

export function PageIntro({
  labelIcon,
  label,
  title,
  description,
  aside,
}: {
  labelIcon?: React.ReactNode;
  label: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/[0.06] bg-[#0E1018] px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-[1560px] space-y-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-indigo-400 uppercase [&_svg]:size-3.5">
          {labelIcon}
          <span>{label}</span>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {description && <p className="max-w-3xl text-sm leading-relaxed text-gray-400">{description}</p>}
          </div>
          {aside && <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">{aside}</div>}
        </div>
      </div>
    </section>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1560px] flex-1 space-y-6 p-4 sm:p-6", className)}>{children}</div>;
}

const TILE_TONE = {
  indigo: "text-indigo-400",
  amber: "text-amber-400",
  sky: "text-sky-400",
  emerald: "text-emerald-400",
  red: "text-red-400",
  gray: "text-gray-400",
} as const;

export type TileTone = keyof typeof TILE_TONE;

export function StatTile({
  label,
  value,
  unit,
  caption,
  tone = "indigo",
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  caption?: React.ReactNode;
  tone?: TileTone;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1 rounded-lg border border-white/[0.06] bg-[#0B0D14] p-3 text-xs", className)}>
      <span className={cn("block font-semibold", TILE_TONE[tone])}>{label}</span>
      <span className="block text-xl leading-tight font-bold text-white tabular-nums">
        {value}
        {unit && <span className="ml-1 text-xs font-medium text-gray-500">{unit}</span>}
      </span>
      {caption && <span className="block leading-relaxed text-gray-400">{caption}</span>}
    </div>
  );
}

export function SectionCard({
  id,
  icon,
  title,
  aside,
  children,
  flush,
  className,
  bodyClassName,
}: {
  id?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  /** No body padding — for tables. */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 overflow-hidden rounded-xl border border-white/[0.08] bg-panel", className)}
    >
      {(title || aside) && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0">
            {icon}
            {title && <h3 className="truncate text-sm font-bold tracking-wider text-white uppercase">{title}</h3>}
          </div>
          {aside && <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-gray-400">{aside}</div>}
        </div>
      )}
      <div className={cn(!flush && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Table chrome: mono upper-case headers, hairline rows, a soft hover. */
export const tableStyles = {
  wrap: "w-full overflow-x-auto",
  table: "w-full border-collapse text-left text-xs",
  thead: "border-b border-white/[0.06] bg-[#0B0D13]/80",
  th: "h-10 px-4 text-[10px] font-mono font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase",
  tr: "border-b border-white/[0.05] transition-colors last:border-b-0 hover:bg-white/[0.025]",
  td: "px-4 py-3 align-middle text-gray-300",
} as const;

/**
 * Placeholder for a record page while its URL-specific content streams in.
 * It is the part of a dynamic route that goes into the shared, prefetched App
 * Shell, so it mirrors the real layout (header bar, intro, tiles, a card) and
 * the swap doesn't shift the page.
 */
export function RecordPageSkeleton({ tiles = 0 }: { tiles?: number }) {
  const bar = "animate-pulse rounded bg-white/[0.06]";
  return (
    <div className="flex min-h-full flex-col" aria-busy="true" aria-label="Loading record">
      <div className="flex min-h-14 items-center gap-3 border-b border-white/[0.08] bg-[#0C0E15]/90 px-4 sm:px-6">
        <span className="size-7 animate-pulse rounded-lg bg-indigo-500/20" />
        <span className={cn(bar, "h-4 w-40")} />
      </div>
      <div className="space-y-2.5 border-b border-white/[0.06] bg-[#0E1018] px-4 py-4 sm:px-6">
        <span className={cn(bar, "block h-3 w-28 bg-indigo-500/15")} />
        <span className={cn(bar, "block h-4 w-56")} />
        <span className={cn(bar, "block h-3.5 w-full max-w-xl bg-white/[0.04]")} />
      </div>
      <div className="mx-auto w-full max-w-[1560px] space-y-6 p-4 sm:p-6">
        {tiles > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: tiles }, (_, i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-lg border border-white/[0.06] bg-[#0B0D14]" />
            ))}
          </div>
        )}
        <div className="h-72 animate-pulse rounded-xl border border-white/[0.08] bg-panel" />
      </div>
    </div>
  );
}

/** A centred empty state — an invitation to act, not a blank box. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-gray-400 [&_svg]:size-5">
        {icon}
      </span>
      <p className="text-sm font-semibold text-gray-100">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
