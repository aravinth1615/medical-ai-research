"use client";

import * as React from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ChatGptIcon,
  ClaudeIcon,
  GoogleGeminiIcon,
  Grok02Icon,
  MetaIcon,
  PerplexityAiIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { confidenceAccent, providerStyle, STATE_LABEL } from "@/lib/research/format";
import type { ExecutionStatus, ModelProvider, ReportState } from "@/lib/research/types";

/* Small pieces of the Research workspace (oneplace-v2's aether set): provider
   marks, tier and status pills, confidence bars, buttons and state cards. */

/* --------------------------------- Buttons -------------------------------- */

export const AETHER_BUTTON =
  "inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border " +
  "bg-[#141722] border-white/[0.08] text-gray-200 hover:bg-[#1B1F2E] transition-[color,background-color,border-color,transform] duration-150 ease-out " +
  "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0";

export const AETHER_PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 " +
  "text-white text-xs font-semibold transition-[color,background-color,transform] duration-150 ease-out shadow-md shadow-indigo-600/20 " +
  "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0";

export const AETHER_DANGER_BUTTON =
  "inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border " +
  "bg-[#141722] border-white/[0.08] text-gray-300 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30 " +
  "transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-3.5";

export const AETHER_ICON_BUTTON =
  "inline-grid size-7 place-items-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] " +
  "transition-colors disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-3.5";

/** Ghost toolbar button (the chat dock: Attach / Source / Report). */
export const toolbarButton =
  "inline-flex items-center gap-1.5 px-2 @min-[440px]:px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap disabled:text-gray-600 disabled:hover:bg-transparent disabled:cursor-not-allowed";

export const inputClass =
  "w-full px-2.5 py-1.5 rounded-lg bg-[#0B0D13] border border-white/[0.08] focus:border-indigo-500/60 focus:outline-none text-xs text-gray-200 placeholder:text-gray-500";

/* ---------------------------------- Chips --------------------------------- */

export function MonoChip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded border border-white/10 bg-[#171A26] px-2.5 py-1 font-mono text-xs whitespace-nowrap text-gray-300",
        className
      )}
    >
      {children}
    </span>
  );
}

/** A tinted mono label (category, kind, cadence) from any CSS colour. */
export function AccentBadge({
  color,
  children,
  className,
  title,
}: {
  color: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium whitespace-nowrap", className)}
      style={{ backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-1 font-mono text-xs tracking-wider text-gray-400 uppercase", className)}>{children}</div>;
}

/* -------------------------------- Providers ------------------------------- */

const PROVIDER_LOGO: Record<ModelProvider, { icon: IconSvgElement; color: string; label: string }> = {
  anthropic: { icon: ClaudeIcon, color: "#D97757", label: "Anthropic" },
  google: { icon: GoogleGeminiIcon, color: "#4F8FF7", label: "Google Gemini" },
  openai: { icon: ChatGptIcon, color: "#F3F4F6", label: "OpenAI" },
  xai: { icon: Grok02Icon, color: "#F3F4F6", label: "xAI" },
  llama: { icon: MetaIcon, color: "#2D8CFF", label: "Meta" },
  perplexity: { icon: PerplexityAiIcon, color: "#20B8CD", label: "Perplexity" },
};

export function ProviderBadge({ provider, className }: { provider: string | null | undefined; className?: string }) {
  const s = providerStyle(provider);
  return (
    <span
      className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold tracking-tight", className)}
      style={{ backgroundColor: `${s.accent}18`, borderColor: `${s.accent}45`, color: s.accent }}
    >
      {s.letter}
    </span>
  );
}

/** The provider's own logo on a tile tinted in its brand colour. */
export function ProviderLogo({ provider, className }: { provider: string; className?: string }) {
  const logo = PROVIDER_LOGO[provider as ModelProvider];
  if (!logo) return <ProviderBadge provider={provider} className={cn("text-[12px]", className)} />;
  return (
    <span
      title={logo.label}
      className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md border", className)}
      style={{ color: logo.color, backgroundColor: `${logo.color}1A`, borderColor: `${logo.color}40` }}
    >
      <HugeiconsIcon icon={logo.icon} size={15} strokeWidth={1.8} aria-hidden />
    </span>
  );
}

export function ProviderLogoMark({ provider, size = 13 }: { provider: string; size?: number }) {
  const logo = PROVIDER_LOGO[provider as ModelProvider];
  if (!logo) {
    return <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: providerStyle(provider).accent }} />;
  }
  return <HugeiconsIcon icon={logo.icon} size={size} strokeWidth={1.8} color={logo.color} className="shrink-0" aria-label={logo.label} />;
}

export function TierBadge({
  provider,
  children,
  className,
}: {
  provider: string | null | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  const s = providerStyle(provider);
  return (
    <span
      className={cn("shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium", className)}
      style={{ backgroundColor: s.badgeBg, color: s.badgeText }}
    >
      {children}
    </span>
  );
}

/** Model dots, one per selected model, in its provider accent. */
export function ModelDots({ models }: { models: { id: string; name: string; provider: string }[] }) {
  return (
    <span className="flex items-center gap-1">
      {models.map((m) => (
        <span
          key={m.id}
          title={m.name}
          className="size-2 rounded-full"
          style={{ backgroundColor: providerStyle(m.provider).accent }}
        />
      ))}
    </span>
  );
}

/* --------------------------------- Status -------------------------------- */

export type PillTone = "indigo" | "emerald" | "sky" | "amber" | "red" | "gray";

const PILL_TONE: Record<PillTone, string> = {
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  red: "bg-red-500/15 text-red-300 border-red-500/30",
  gray: "bg-white/5 text-gray-400 border-white/10",
};

const DOT_TONE: Record<PillTone, string> = {
  indigo: "bg-indigo-400",
  emerald: "bg-emerald-400",
  sky: "bg-sky-400",
  amber: "bg-amber-400",
  red: "bg-red-400",
  gray: "bg-gray-500",
};

export function StatusPill({
  tone,
  label,
  live,
  className,
  labelClassName,
}: {
  tone: PillTone;
  label: string;
  live?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <span
      title={labelClassName ? label : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] whitespace-nowrap",
        PILL_TONE[tone],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_TONE[tone], live && "animate-ping")} />
      {labelClassName ? <span className={labelClassName}>{label}</span> : label}
    </span>
  );
}

const STATE_TONE: Record<ReportState, { tone: PillTone; live?: boolean }> = {
  draft: { tone: "gray" },
  running: { tone: "indigo", live: true },
  ready: { tone: "emerald" },
  scheduled: { tone: "sky" },
  failed: { tone: "red" },
};

export function ReportStatePill({ state, className }: { state: ReportState; className?: string }) {
  const t = STATE_TONE[state];
  return <StatusPill tone={t.tone} live={t.live} label={STATE_LABEL[state]} className={className} />;
}

const EXEC_STATUS: Record<ExecutionStatus, { label: string; className: string }> = {
  done: { label: "Done", className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" },
  running: { label: "Running", className: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
  failed: { label: "Failed", className: "bg-red-500/10 text-red-300 border-red-500/30" },
  cancelled: { label: "Cancelled", className: "bg-white/5 text-gray-400 border-white/10" },
  queued: { label: "In progress", className: "bg-sky-500/10 text-sky-300 border-sky-500/25" },
};

export function ExecStatusPill({ status, className }: { status: ExecutionStatus; className?: string }) {
  const s = EXEC_STATUS[status] ?? EXEC_STATUS.queued;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-medium whitespace-nowrap",
        s.className,
        className
      )}
    >
      {(status === "running" || status === "queued") && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
      {s.label}
    </span>
  );
}

/** One model's progress: an indeterminate sweep while working, full once done. */
export function ProgressTrack({ status, color }: { status: ExecutionStatus; color: string }) {
  const working = status === "running" || status === "queued";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/5" aria-hidden>
      {working ? (
        <div
          className={cn(
            "h-full w-2/5 rounded-full motion-reduce:animate-none",
            status === "running" ? "animate-[research-sweep_1.5s_ease-in-out_infinite]" : "animate-[research-sweep_2.4s_ease-in-out_infinite] opacity-40"
          )}
          style={{ backgroundColor: color }}
        />
      ) : (
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: status === "cancelled" ? "0%" : "100%", backgroundColor: status === "failed" ? "#EF4444" : color }}
        />
      )}
    </div>
  );
}

export function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)} title={`Confidence ${Math.round(value)} of 100`}>
      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/5">
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: confidenceAccent(value) }}
        />
      </span>
      <span className="w-6 shrink-0 text-right font-mono text-[11px] text-gray-300 tabular-nums">{Math.round(value)}</span>
    </span>
  );
}

/* ------------------------------- State cards ------------------------------ */

/** A centred message card for loading, empty, not-found and error states. */
export function ReportStateCard({
  icon,
  title,
  description,
  action,
  tone = "indigo",
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "indigo" | "red";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0F111A] px-6 py-14 text-center">
      {icon && (
        <div
          className={cn(
            "mb-1 flex size-10 items-center justify-center rounded-xl border [&_svg]:size-5",
            tone === "red" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-indigo-500/30 bg-indigo-500/15 text-indigo-300"
          )}
        >
          {icon}
        </div>
      )}
      <h2 className="text-sm font-bold text-white">{title}</h2>
      {description && <p className="max-w-md text-xs leading-relaxed text-gray-400">{description}</p>}
      {action && <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}

/** A red inline error with an optional retry. */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
      <span className="min-w-0 flex-1 leading-relaxed">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-medium text-red-200 underline underline-offset-2 hover:text-white"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* --------------------------------- Helpers -------------------------------- */

/** "A", "A and B", "A, B, and C". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function copyTextToClipboard(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => copyViaTextarea(text));
    return;
  }
  copyViaTextarea(text);
}

function copyViaTextarea(text: string) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  } catch {
    // Nothing more to try.
  }
}

/** Inline "[3]" / "[3][7]" markers → one "3,7" superscript. */
export function renderWithCitations(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\s*((?:\[\d+\])+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <sup key={key++} className="ml-0.5 align-super font-mono text-[10px] leading-none font-semibold text-indigo-400">
        {(match[1].match(/\d+/g) ?? []).join(",")}
      </sup>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
