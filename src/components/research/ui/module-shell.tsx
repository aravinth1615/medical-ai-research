import * as React from "react";
import { cn } from "@/lib/utils";
import { Layers } from "@/lib/icons";

/* The page frame shared by every Research screen (Reports, Schedules,
   Sources, Prompt library, Documents) — oneplace-v2's research module shell:
   sticky header bar, intro band, fact tiles and section cards. */

export function ModulePage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-h-full animate-fade-in flex-col bg-[#08090E]", className)}>{children}</div>;
}

export function ModuleHeaderBar({
  icon,
  title,
  badge,
  status,
  statusTone = "emerald",
  actions,
}: {
  icon?: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  /** e.g. "8 reports synthesized" — hidden when the bar is narrow. */
  status?: React.ReactNode;
  statusTone?: "emerald" | "amber" | "gray";
  actions?: React.ReactNode;
}) {
  return (
    <header className="@container/hdr top-0 z-sticky flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/[0.08] bg-[#0C0E15]/90 px-4 py-2.5 backdrop-blur-md sm:px-6 md:sticky">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br/srgb from-indigo-500 to-sky-500 shadow-lg shadow-indigo-500/20 [&_svg]:size-4 [&_svg]:text-white">
          {icon ?? <Layers />}
        </div>
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
          <div className="mr-2 hidden items-center gap-2 font-mono text-xs text-gray-400 @3xl/hdr:flex">
            <span
              className={cn(
                "size-2 rounded-full",
                statusTone === "emerald" && "animate-pulse bg-emerald-400",
                statusTone === "amber" && "animate-pulse bg-amber-400",
                statusTone === "gray" && "bg-gray-500"
              )}
            />
            <span>{status}</span>
          </div>
        )}
        {actions}
      </div>
    </header>
  );
}

export function ModuleIntro({
  labelIcon,
  label,
  title,
  description,
  chips,
  children,
}: {
  labelIcon?: React.ReactNode;
  label: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  chips?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/[0.06] bg-[#0E1018] px-4 py-4 sm:px-6">
      <div className="@container/intro mx-auto max-w-[1560px] space-y-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-indigo-400 uppercase [&_svg]:size-3.5">
          {labelIcon}
          <span>{label}</span>
        </div>
        <div className="flex flex-col gap-3 @4xl/intro:flex-row @4xl/intro:items-start @4xl/intro:justify-between @4xl/intro:gap-6">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {description && <p className="max-w-3xl text-sm leading-relaxed text-gray-400">{description}</p>}
          </div>
          {chips && (
            <div className="flex shrink-0 flex-wrap items-center gap-2 @4xl/intro:max-w-[55%] @4xl/intro:justify-end">
              {chips}
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function ModuleBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1560px] flex-1 space-y-6 p-4 sm:p-6", className)}>{children}</div>;
}

const TILE_TONE = {
  indigo: "text-indigo-400",
  amber: "text-amber-400",
  sky: "text-sky-400",
  emerald: "text-emerald-400",
  red: "text-red-400",
  violet: "text-violet-400",
  gray: "text-gray-400",
} as const;

export type TileTone = keyof typeof TILE_TONE;

export function StatTile({
  label,
  value,
  caption,
  tone = "indigo",
  className,
  children,
}: {
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  tone?: TileTone;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1 rounded-lg border border-white/[0.06] bg-[#0B0D14] p-3 text-xs", className)}>
      <span className={cn("block font-semibold", TILE_TONE[tone])}>{label}</span>
      <span className="block text-xl leading-tight font-bold text-white tabular-nums">{value}</span>
      {caption && <span className="block leading-relaxed text-gray-400">{caption}</span>}
      {children}
    </div>
  );
}

export function ModuleCard({
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
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F111A]", className)}>
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

export const moduleTable = {
  wrap: "w-full overflow-x-auto",
  table: "w-full border-collapse text-xs",
  thead: "border-b border-white/[0.06] bg-[#0B0D13]/80",
  th: "h-10 px-4 text-left text-[10px] font-mono font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase",
  tr: "border-b border-white/[0.05] transition-colors last:border-b-0",
  trInteractive: "cursor-pointer hover:bg-white/[0.025]",
  td: "px-4 py-3 align-middle text-gray-300",
} as const;
