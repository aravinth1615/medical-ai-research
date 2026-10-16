"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Brain, ChevronDown, Dna, Eye, Heart, Pencil, Search, Sparkles, Stethoscope, Tag, Trash, X } from "@/lib/icons";
import type { PromptTemplateRead } from "@/lib/research/types";
import { fullDate, relativeTime } from "@/lib/research/format";
import { AccentBadge, AETHER_PRIMARY_BUTTON, copyTextToClipboard } from "@/components/research/ui/primitives";
import { Input } from "@/components/ui/input";

/* The prompt library's pieces in the reference design: its preset cards
   (icon tile, title, specialty badge, two-line prompt) with an author and
   actions footer, the right-hand drawer every prompt dialog slides in as,
   and the small controls the library, its categories and the New Research
   picker share. */

const PRESET_ICONS = [Heart, Brain, Dna, Stethoscope];

export const PROMPT_ACCENT = "#818CF8";

/** The header bar's call-to-action, sized to sit beside AETHER_BUTTON. */
export const PROMPT_PRIMARY_BUTTON = cn(
  AETHER_PRIMARY_BUTTON,
  "gap-1.5 px-3 py-1.5 border border-transparent [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:shrink-0"
);

/** A card or row's icon-only action (view / edit / delete). */
export const PROMPT_ICON_BUTTON =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors " +
  "hover:bg-white/[0.06] hover:text-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/70 [&_svg]:size-3.5";

export const PROMPT_DANGER_BUTTON = cn(PROMPT_ICON_BUTTON, "hover:bg-red-500/10 hover:text-red-300");

/** A card's "Use" — starts New Research with the prompt. */
const PROMPT_USE_BUTTON =
  "inline-flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 font-sans text-[12px] font-medium text-indigo-300 transition-colors " +
  "hover:bg-indigo-500/15 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/70 [&_svg]:size-3.5";

/* ------------------------------- Helpers -------------------------------- */

export function authorOf(t: PromptTemplateRead): string | null {
  return t.created_by?.full_name ?? t.created_by?.email ?? null;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function initialsOf(name: string): string {
  const parts = name.replace(/@.*$/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** A card shows only the start of a description, then "…" — the full text is
 *  on hover and in the view drawer. Cuts at the last whole word that fits. */
export function shortText(text: string, max: number) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Copies text and flips to "Copied" for a moment. */
export function useCopied(text: string) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const copy = React.useCallback(() => {
    copyTextToClipboard(text);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }, [text]);
  return { copied, copy };
}

/** Debounced search text: `value` follows typing, `query` settles 250ms after
 *  (immediately when cleared), so results don't refetch on every keystroke. */
export function useDebouncedSearch() {
  const [value, setValue] = React.useState("");
  const [query, setQuery] = React.useState("");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const change = React.useCallback((next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    const clean = next.trim();
    if (!clean) setQuery("");
    else timer.current = setTimeout(() => setQuery(clean), 250);
  }, []);
  return { value, query, change };
}

/* ------------------------------- Controls ------------------------------- */

/** Search box with a clear button, in the module's compact 32px size. */
export function PromptSearch({
  value,
  onValueChange,
  placeholder = "Search prompts…",
  label = "Search prompts",
  className,
  autoFocus,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Input
        type="search"
        aria-label={label}
        autoFocus={autoFocus}
        icon={<Search />}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            e.stopPropagation();
            onValueChange("");
          }
        }}
        placeholder={placeholder}
        className="h-8 rounded-lg bg-[#0B0D13] text-xs [&::-webkit-search-cancel-button]:hidden"
        trailing={
          value ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onValueChange("")}
              className="grid size-6 place-items-center rounded-md text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200 [&_svg]:size-3.5"
            >
              <X />
            </button>
          ) : undefined
        }
      />
    </div>
  );
}

/** A styled native select — no Radix Select in this app. */
export function PromptSelect({
  value,
  onChange,
  options,
  label,
  id,
  disabled,
  className,
  size = "sm",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  /** Accessible name when no visible <label htmlFor> points at it. */
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        id={id}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full cursor-pointer appearance-none truncate rounded-lg border border-white/10 bg-[#0B0D13] pr-8 pl-3 text-gray-200 [color-scheme:dark]",
          "transition-[border-color,box-shadow,background-color] duration-150 hover:border-white/20 hover:bg-[#141722]",
          "focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45",
          "[&_option]:bg-[#0F111A] [&_option]:text-gray-200",
          size === "sm" ? "h-8 text-xs" : "h-10 text-sm"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-gray-500" />
    </div>
  );
}

/** The specialty tag as prompts carry it. */
export function CategoryTag({ name, className }: { name: string; className?: string }) {
  return (
    <AccentBadge color={PROMPT_ACCENT} title={name} className={cn("max-w-full text-[11px]", className)}>
      <Tag className="size-3 shrink-0" />
      <span className="truncate">{name}</span>
    </AccentBadge>
  );
}

/** The full prompt, exactly as written — line breaks, blank lines and lists
 *  kept (pre-wrap); focusable so a long prompt scrolls by keyboard. */
export function PromptText({ text, className }: { text: string; className?: string }) {
  return (
    <div
      role="region"
      aria-label="Prompt text"
      tabIndex={0}
      className={cn(
        "rounded-lg border border-white/[0.08] bg-void p-4 transition-shadow duration-150 focus-visible:shadow-[inset_0_0_0_1px_var(--color-iris)] focus-visible:outline-none",
        className
      )}
    >
      <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", userSelect: "text" }} className="text-sm leading-relaxed text-ink">
        {text}
      </p>
    </div>
  );
}

export function PromptStats({ text }: { text: string }) {
  const words = wordCount(text);
  return (
    <span className="text-[11px] text-ink-3 tnum">
      {words.toLocaleString()} word{words === 1 ? "" : "s"} · {text.length.toLocaleString()} characters
    </span>
  );
}

export function PromptByline({ template }: { template: PromptTemplateRead }) {
  const author = authorOf(template);
  return (
    <p className="text-[11px] text-ink-3">
      {author ? `Added by ${author} · ` : ""}Updated{" "}
      <time dateTime={template.updated_at} title={fullDate(template.updated_at)}>
        {relativeTime(template.updated_at).toLowerCase()}
      </time>
    </p>
  );
}

/* -------------------------------- Drawer -------------------------------- */

/* The drawer's motion, as in the reference's research drawers. Opening eases
   out over 320ms, closing takes 240ms; with reduced motion, a fade only.
   Hoisted (and de-duplicated) into <head> by React, so the closing animation
   still has its keyframes after the Portal's children unmount. */
const DRAWER_CSS = `
@keyframes prompt-drawer-in { from { transform: translateX(100%); } to { transform: none; } }
@keyframes prompt-drawer-out { from { transform: none; } to { transform: translateX(100%); } }
@keyframes prompt-drawer-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes prompt-drawer-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes prompt-drawer-view-in { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
.prompt-drawer { will-change: transform; }
.prompt-drawer[data-state="open"] { animation: prompt-drawer-in 320ms cubic-bezier(0.32, 0.72, 0, 1); }
.prompt-drawer[data-state="closed"] { animation: prompt-drawer-out 240ms cubic-bezier(0.32, 0.72, 0, 1); }
.prompt-drawer-backdrop[data-state="open"] { animation: prompt-drawer-fade-in 320ms ease-out; }
.prompt-drawer-backdrop[data-state="closed"] { animation: prompt-drawer-fade-out 240ms ease-in; }
.prompt-drawer-view { animation: prompt-drawer-view-in 200ms cubic-bezier(0.32, 0.72, 0, 1); }
@media (prefers-reduced-motion: reduce) {
  .prompt-drawer[data-state="open"] { animation-name: prompt-drawer-fade-in; }
  .prompt-drawer[data-state="closed"] { animation-name: prompt-drawer-fade-out; }
  .prompt-drawer-view { animation-name: prompt-drawer-fade-in; }
}
`;

/** A drawer from the right. Its content unmounts once it has slid out, so
 *  forms inside start fresh on every opening. `dismissable={false}` while a
 *  save is in flight: Esc, outside clicks and × are ignored. */
export function PromptDrawer({
  open,
  onOpenChange,
  width = "34rem",
  dismissable = true,
  onCloseAutoFocus,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: string;
  dismissable?: boolean;
  /** Radix's hook for where focus goes on close — preventDefault() to send
   *  it somewhere other than the trigger. */
  onCloseAutoFocus?: (e: Event) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => (dismissable || next ? onOpenChange(next) : undefined)}>
      <style href="prompt-drawer-motion" precedence="default">
        {DRAWER_CSS}
      </style>
      <Dialog.Portal>
        <Dialog.Overlay className="prompt-drawer-backdrop fixed inset-0 z-backdrop bg-black/55 backdrop-blur-[2px]" />
        <Dialog.Content
          style={{ width: `min(${width}, 100vw)` }}
          onEscapeKeyDown={(e) => !dismissable && e.preventDefault()}
          onPointerDownOutside={(e) => !dismissable && e.preventDefault()}
          onCloseAutoFocus={onCloseAutoFocus}
          className="prompt-drawer surface-raised fixed inset-y-0 right-0 z-drawer flex flex-col border-l border-white/[0.08] shadow-[-24px_0_60px_rgba(0,0,0,0.6)] focus:outline-none"
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The drawer's header: iris icon tile, title, description and ×. */
export function DrawerHeader({
  icon,
  title,
  description,
  closeDisabled,
  bordered = true,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  closeDisabled?: boolean;
  bordered?: boolean;
  /** Extra lines under the title (e.g. a category tag). */
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden px-5 pt-5 pb-4", bordered && "border-b border-white/[0.08]")}>
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-iris/20 blur-3xl" />
      <div className="relative flex items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-iris-well text-iris-soft shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-iris)_35%,transparent)] [&_svg]:size-5">
          {icon}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Dialog.Title className="text-base leading-snug font-semibold break-words text-ink">{title}</Dialog.Title>
          {children}
          {description ? (
            <Dialog.Description className="text-xs leading-relaxed break-words text-ink-3">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}
        </div>
        <DrawerClose disabled={closeDisabled} className="-mt-1 -mr-2" />
      </div>
    </div>
  );
}

export function DrawerClose({ disabled, className }: { disabled?: boolean; className?: string }) {
  return (
    <Dialog.Close asChild>
      <button
        type="button"
        aria-label="Close"
        disabled={disabled}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-overlay hover:text-ink disabled:opacity-40",
          className
        )}
      >
        <X className="size-4" />
      </button>
    </Dialog.Close>
  );
}

/** The drawer's action row. Wraps on a phone rather than overflowing. */
export function DrawerFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/[0.08] bg-void/40 px-5 py-3.5", className)}>
      {children}
    </div>
  );
}

/** Re-export so dialogs needn't import Radix just for a Close. */
export const DrawerCloseSlot = Dialog.Close;

/* --------------------------------- Cards -------------------------------- */

export function PromptCard({
  template: t,
  index,
  description,
  onView,
  onUse,
  onEdit,
  onDelete,
}: {
  template: PromptTemplateRead;
  /** Position in the list — picks the icon tile, as New Research's presets do. */
  index: number;
  /** The shortened description shown on the card; the full text is on hover. */
  description: string | null;
  onView: () => void;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = PRESET_ICONS[index % PRESET_ICONS.length];
  const author = authorOf(t);

  return (
    <article
      onClick={() => {
        // Dragging to select text on a card isn't a request to open it.
        if (window.getSelection()?.toString()) return;
        onView();
      }}
      className="@container/card group flex h-full cursor-pointer flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#11131A] p-4 transition-all hover:border-indigo-500/40 hover:bg-[#161924]"
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <div className="shrink-0 rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 @md/card:flex-nowrap">
            <h2 className="max-w-full min-w-0">
              {/* The keyboard way into a card (cards themselves aren't
                  focusable): Enter/Space opens the prompt. */}
              <button
                type="button"
                title={t.title}
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="block max-w-full truncate rounded-xs text-left text-xs font-semibold text-gray-100 transition-colors group-hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/70"
              >
                {t.title}
              </button>
            </h2>
            {t.category && <CategoryTag name={t.category.name} className="shrink-0 @md/card:max-w-[45%]" />}
          </div>
          {description && (
            <p className="mt-0.5 truncate text-[12px] text-gray-500" title={t.description ?? undefined}>
              {description}
            </p>
          )}
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed break-words text-gray-400" title={t.prompt}>
            {t.prompt}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.05] pt-2.5 font-mono text-[12px] text-gray-500">
        <span className="flex min-w-0 flex-col gap-1 @sm/card:flex-row @sm/card:items-center @sm/card:gap-2">
          {author ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/[0.06] font-sans text-[10px] font-semibold text-gray-300">
                {initialsOf(author)}
              </span>
              <span className="truncate text-gray-400" title={author}>
                {author}
              </span>
            </span>
          ) : (
            <span className="text-gray-600">—</span>
          )}
          <span aria-hidden className="hidden text-gray-600 @sm/card:inline">
            ·
          </span>
          <time dateTime={t.updated_at} title={fullDate(t.updated_at)} className="shrink-0 whitespace-nowrap">
            updated {relativeTime(t.updated_at).toLowerCase()}
          </time>
        </span>
        {/* Buttons here shouldn't also trigger the card's click. */}
        <span className="-my-1 -mr-1.5 flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={PROMPT_USE_BUTTON}
            title="Start research with this prompt"
            aria-label={`Use prompt: ${t.title}`}
            onClick={onUse}
          >
            <Sparkles />
            Use
          </button>
          <button type="button" className={PROMPT_ICON_BUTTON} title="View prompt" aria-label={`View prompt: ${t.title}`} onClick={onView}>
            <Eye />
          </button>
          <button type="button" className={PROMPT_ICON_BUTTON} title="Edit prompt" aria-label={`Edit ${t.title}`} onClick={onEdit}>
            <Pencil />
          </button>
          <button type="button" className={PROMPT_DANGER_BUTTON} title="Delete prompt" aria-label={`Delete ${t.title}`} onClick={onDelete}>
            <Trash />
          </button>
        </span>
      </div>
    </article>
  );
}

/** A preset card's outline while the library first loads. */
export function PromptCardSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#11131A] p-4">
      <div className="flex items-start gap-3.5">
        <div className="size-9 shrink-0 rounded-lg bg-white/[0.05]" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3 w-2/5 rounded bg-white/[0.06]" />
          <div className="h-2.5 w-3/5 rounded bg-white/[0.04]" />
          <div className="h-2.5 w-full rounded bg-white/[0.04]" />
          <div className="h-2.5 w-4/5 rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="border-t border-white/[0.05] pt-2.5">
        <div className="h-5 w-1/3 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}
