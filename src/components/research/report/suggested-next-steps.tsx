"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ArrowRight, Check, Loader, PlusCircle, X } from "@/lib/icons";
import type { SuggestedNextStep, SuggestionType } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { DrawerClose, PromptDrawer } from "@/components/research/prompts/prompts-ui";

const TYPE_LABEL: Record<SuggestionType, string> = {
  quick: "Quick",
  standard: "Standard",
  deep: "Deep",
};

/** A suggestion's title as the bold lead-in sentence of its card. */
function leadIn(title: string): string {
  const t = title.trim();
  return /[.!?:]$/.test(t) ? t : `${t}.`;
}

/**
 * The prominent way into the gaps: an amber button for the report's sticky
 * control bar, with how many gaps are still open — so the drawer is one
 * click away from anywhere on the page.
 */
export function GapDrawerTrigger({
  open,
  openCount,
  loading,
  onOpen,
}: {
  open: boolean;
  /** Gaps not yet queued; null while loading. */
  openCount: number | null;
  loading: boolean;
  onOpen: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="gap-drawer"
      aria-label={openCount ? `Suggested next steps — ${openCount} open gap${openCount === 1 ? "" : "s"}` : "Suggested next steps"}
      className="inline-flex h-8 items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 text-xs font-semibold text-amber-200 shadow-[0_0_0_3px_rgba(245,158,11,0.06)] transition-[color,background-color,border-color,transform] duration-150 ease-out hover:border-amber-400/60 active:scale-[0.97] hover:bg-amber-500/25 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none"
    >
      <AlertTriangle className="size-3.5 text-amber-400" />
      <span className="max-sm:sr-only">Suggested next steps</span>
      {loading ? (
        <Loader className="size-3 animate-spin text-amber-300" />
      ) : openCount != null && openCount > 0 ? (
        <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-amber-500 px-1 font-mono text-[10px] leading-none font-bold text-[#1a1203] tabular-nums">
          {openCount}
        </span>
      ) : null}
    </button>
  );
}

/**
 * "Suggested Next Steps" (gap-driven) — the gaps detected in the report's
 * latest version, in a drawer from the right. Each can be queued for the
 * next run, or all of them at once as a re-run plan; queued gaps also show
 * in the re-run box, where they can be taken back out.
 */
export function GapDrawer({
  open,
  onOpenChange,
  suggestions,
  error,
  onRetry,
  versionNumber,
  addingId,
  removingId,
  queueingAll,
  running,
  onAdd,
  onRemove,
  onQueueAll,
  onGoToRerun,
  canGoToRerun,
  queuedTotal,
  returnFocusTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null while loading. */
  suggestions: SuggestedNextStep[] | null;
  error: string | null;
  onRetry: () => void;
  /** The version the gaps were detected in. */
  versionNumber: number | null;
  addingId: string | null;
  removingId: string | null;
  queueingAll: boolean;
  /** A run is under way — queued gaps wait for the one after. */
  running: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  /** Resolves true once every gap is queued — the drawer then closes and
   *  hands focus to the re-run box. */
  onQueueAll: () => Promise<boolean>;
  /** Opens the re-run box and focuses its instructions. */
  onGoToRerun: () => void;
  /** The re-run box is on the page (a published version, no run going) —
   *  otherwise Queue All keeps the drawer open and focus stays put. */
  canGoToRerun: boolean;
  /** Everything queued for the next run, including gaps a newer version
   *  has since closed. */
  queuedTotal: number;
  /** The control that opened the drawer — focus goes back to it on close. */
  returnFocusTo: React.RefObject<HTMLElement | null>;
}) {
  // Set just before "open the re-run box" closes the drawer, so focus goes
  // there instead of back to the opener. Read and cleared on every close.
  const toRerun = React.useRef(false);
  const remaining = (suggestions ?? []).filter((s) => s.status === "suggested").length;
  const busy = addingId != null || removingId != null || queueingAll;

  /** Closes into the re-run box — only while the drawer is still open (it
   *  may have been dismissed while Queue All was in flight). */
  const closeToRerun = () => {
    if (!canGoToRerun || !document.getElementById("gap-drawer")) return;
    toRerun.current = true;
    onOpenChange(false);
  };

  return (
    <PromptDrawer
      open={open}
      onOpenChange={onOpenChange}
      width="30rem"
      onCloseAutoFocus={(e) => {
        const rerun = toRerun.current;
        toRerun.current = false;
        e.preventDefault();
        if (rerun) {
          onGoToRerun();
          return;
        }
        const opener = returnFocusTo.current;
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      }}
    >
      <div id="gap-drawer" className="flex min-h-0 flex-1 flex-col">
        <div className="relative shrink-0 overflow-hidden border-b border-white/[0.08] px-5 pt-5 pb-4">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <AlertTriangle className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Dialog.Title className="text-sm font-bold tracking-wider whitespace-nowrap text-white uppercase">
                  Suggested Next Steps
                </Dialog.Title>
                <span className="shrink-0 rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-300">Gap-Driven</span>
              </div>
              <Dialog.Description className="mt-1.5 text-xs leading-relaxed text-gray-400">
                These recommendations are generated from the gaps detected in this report
                {versionNumber != null && <> (v{versionNumber}, latest)</>} — contested claims, stale sources and thin evidence:
              </Dialog.Description>
            </div>
            <DrawerClose className="-mt-1 -mr-2" />
          </div>
          {running && (
            <p className="relative mt-3 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-[11px] leading-relaxed text-sky-200">
              A run is under way — anything you queue now goes with the next one.
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {error ? (
            <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-xs text-red-200">
              <p>{error}</p>
              <button type="button" onClick={onRetry} className="font-medium text-red-100 underline underline-offset-2">
                Try again
              </button>
            </div>
          ) : !suggestions ? (
            <>
              <div className="h-32 animate-pulse rounded-lg bg-white/[0.04]" aria-hidden />
              <div className="h-32 animate-pulse rounded-lg bg-white/[0.04]" aria-hidden />
              <div className="h-32 animate-pulse rounded-lg bg-white/[0.04]" aria-hidden />
            </>
          ) : suggestions.length === 0 ? (
            <div className="space-y-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-xs text-emerald-300">
              <p className="font-medium">No additional research gaps detected</p>
              <p className="text-[11px] text-emerald-300/70">No contested claims, every source looks fresh, and confidence is solid.</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {suggestions.map((s, idx) => {
                const queued = s.status === "added";
                const adding = addingId === s.id;
                const removing = removingId === s.id;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "group space-y-2 rounded-lg border p-3.5 transition-colors",
                      queued
                        ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                        : "border-white/[0.06] bg-[#08090E] hover:border-amber-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                      <span className="font-semibold text-amber-400">Priority Gap #{idx + 1}</span>
                      <span className="text-gray-500">{TYPE_LABEL[s.type]}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-gray-300">
                      <span className="font-semibold text-gray-100">{leadIn(s.title)}</span> {s.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      {queued ? (
                        <span className="inline-flex items-center gap-2 text-[11px] font-medium">
                          <span className="inline-flex items-center gap-1.5 text-emerald-400">
                            <Check className="size-3.5" strokeWidth={2.5} />
                            Queued for the next run
                          </span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onRemove(s.id)}
                            aria-label={`Remove “${s.title}” from the next run`}
                            className="inline-flex items-center gap-1 rounded px-1 text-gray-500 transition-colors hover:text-red-300 disabled:pointer-events-none disabled:opacity-50"
                          >
                            {removing ? <Loader className="size-3 animate-spin" /> : <X className="size-3" />}
                            Remove
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onAdd(s.id)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 transition-colors group-hover:underline hover:text-indigo-300 disabled:pointer-events-none disabled:no-underline disabled:opacity-50"
                        >
                          <PlusCircle className={cn("size-3.5", adding && "animate-pulse")} />
                          {adding ? "Queuing…" : "Queue as Next Investigation"}
                        </button>
                      )}
                      <span className="font-mono text-[11px]">
                        {s.estimated_confidence_uplift != null ? (
                          <span className="text-emerald-400">+{Math.round(s.estimated_confidence_uplift)}% confidence</span>
                        ) : (
                          <span className="text-gray-500">Potential confidence gain</span>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {suggestions && suggestions.length > 0 && (
          <div className="shrink-0 space-y-2 border-t border-white/[0.08] bg-void/40 px-5 py-3.5">
            <button
              type="button"
              onClick={async () => {
                if (await onQueueAll()) closeToRerun();
              }}
              disabled={remaining === 0 || busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-amber-600/90 to-orange-600/90 px-3 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-600/20 transition-all hover:from-amber-500 hover:to-orange-500 disabled:pointer-events-none disabled:opacity-50"
            >
              {queueingAll ? <Loader className="size-3.5 animate-spin" /> : null}
              <span>{queueingAll ? "Queuing gaps…" : remaining === 0 ? "Every gap is queued" : "Queue All Gaps as Rerun Plan"}</span>
              {!queueingAll && remaining > 0 && <ArrowRight className="size-3.5" />}
            </button>
            {queuedTotal > 0 && canGoToRerun && (
              <button
                type="button"
                onClick={closeToRerun}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-white/[0.05]"
              >
                {queuedTotal} queued — open the re-run box
                <ArrowRight className="size-3.5 text-indigo-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </PromptDrawer>
  );
}
