"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CircleAlert, CircleCheck, Sparkles, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* Modal dialogs for the Research module, on Radix Dialog: a shell every form
   dialog uses, a confirm dialog for destructive actions, and a centred
   notice popup for results that would otherwise be easy to miss. Opacity-only
   entrance — the centring rides on `transform`, which a scale keyframe would
   overwrite. */

const overlay = "fixed inset-0 z-backdrop animate-fade-in bg-black/60 backdrop-blur-[2px]";
const content =
  "surface-raised fixed left-1/2 z-drawer max-h-[calc(100dvh-2rem)] -translate-x-1/2 animate-fade-in overflow-hidden rounded-2xl flex flex-col";

/** A form dialog: icon + title + description header, a scrolling body and a
 *  footer for the actions. */
export function DialogShell({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  footer,
  width = "32rem",
  top = "12%",
  dismissable = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  top?: string;
  /** False while a save is in flight — Escape and outside clicks are ignored. */
  dismissable?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => (dismissable || next ? onOpenChange(next) : undefined)}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content
          className={content}
          style={{ width: `min(${width}, calc(100vw - 2rem))`, top }}
          onEscapeKeyDown={(e) => !dismissable && e.preventDefault()}
          onPointerDownOutside={(e) => !dismissable && e.preventDefault()}
        >
          <div className="relative shrink-0 overflow-hidden border-b border-white/[0.08] px-6 pt-6 pb-5">
            <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative flex items-start gap-3.5">
              {icon && (
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-iris-well text-indigo-300 ring-1 ring-indigo-500/35 [&_svg]:size-5">
                  {icon}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-base font-semibold text-gray-100">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-1 text-xs leading-relaxed text-gray-400">{description}</Dialog.Description>
                ) : (
                  <Dialog.Description className="sr-only">{title}</Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  disabled={!dismissable}
                  className="-mt-1 -mr-2 grid size-8 place-items-center rounded-md text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          {footer && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.08] bg-void/40 px-6 py-3.5">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Confirms a destructive or consequential action. `onConfirm` may be async:
 *  the dialog stays open with the button spinning until it settles, and shows
 *  an error in place instead of closing on a failure. */
export function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  title,
  description,
  children,
  confirmLabel,
  tone = "primary",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const change = (next: boolean) => {
    if (busy) return;
    if (!next) setError(null);
    onOpenChange(next);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't go through. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={change}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content className={content} style={{ width: "min(30rem, calc(100vw - 2rem))", top: "18%" }}>
          <div className="flex gap-3.5 p-5">
            {icon && (
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-4.5",
                  tone === "danger" ? "bg-red-500/12 text-red-300" : "bg-iris-well text-indigo-300"
                )}
              >
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-sm font-semibold text-gray-100">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-xs leading-relaxed text-gray-400">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
              {children && <div className="mt-3.5">{children}</div>}
              {error && (
                <p role="alert" className="mt-3 text-xs text-red-300">
                  {error}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] bg-void/40 px-5 py-3">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm" disabled={busy}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button variant={tone} size="sm" loading={busy} onClick={confirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export type NoticeTone = "success" | "info" | "error";

export interface Notice {
  tone: NoticeTone;
  title: string;
  message: React.ReactNode;
  /** An optional next step beside OK — e.g. "Go to report". */
  action?: { label: string; onSelect: () => void };
}

const NOTICE_TONE: Record<NoticeTone, { icon: React.ReactNode; className: string }> = {
  success: { icon: <CircleCheck />, className: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/25" },
  info: { icon: <Sparkles />, className: "bg-iris-well text-indigo-300 ring-indigo-500/25" },
  error: { icon: <CircleAlert />, className: "bg-red-500/12 text-red-300 ring-red-500/30" },
};

/** A centred popup — big icon, title, message, OK (and an optional action). */
export function NoticeDialog({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  // Run the action only once the dialog has closed, so focus restoration
  // doesn't scroll the page back to the button that opened it.
  const pendingAction = React.useRef<(() => void) | null>(null);
  const tone = NOTICE_TONE[notice?.tone ?? "info"];

  return (
    <Dialog.Root open={notice !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content
          className={content}
          style={{ width: "min(26rem, calc(100vw - 2rem))", top: "50%", transform: "translate(-50%, -50%)" }}
          onCloseAutoFocus={(e) => {
            const action = pendingAction.current;
            if (!action) return;
            pendingAction.current = null;
            e.preventDefault();
            action();
          }}
        >
          {notice && (
            <>
              <div className="flex flex-col items-center px-6 pt-7 pb-5 text-center">
                <span className={cn("grid size-14 place-items-center rounded-full ring-1 [&_svg]:size-7", tone.className)}>{tone.icon}</span>
                <Dialog.Title className="mt-4 text-base font-semibold text-gray-100">{notice.title}</Dialog.Title>
                <Dialog.Description className="mt-2 text-xs leading-relaxed text-gray-400">{notice.message}</Dialog.Description>
              </div>
              <div className="flex items-center justify-center gap-2 border-t border-white/[0.08] bg-void/40 px-5 py-3">
                <Dialog.Close asChild>
                  <Button variant={notice.action ? "ghost" : "primary"} size="sm">
                    OK
                  </Button>
                </Dialog.Close>
                {notice.action && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      pendingAction.current = notice.action!.onSelect;
                      onClose();
                    }}
                  >
                    {notice.action.label}
                  </Button>
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
