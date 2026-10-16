"use client";

import * as React from "react";
import { CircleAlert, Tag } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { PromptCategoryInput, PromptCategoryRead } from "@/lib/research/types";
import { CategoryTag, DrawerCloseSlot, DrawerFooter, DrawerHeader, PromptDrawer } from "./prompts-ui";

const NAME_MAX = 120;
const DESCRIPTION_MAX = 500;

/**
 * Create or edit a Prompt library category (a specialty) — a drawer from the
 * right. The form lives inside the drawer's content, which unmounts once it
 * has slid out, so every opening starts from the category being edited (or
 * empty, for a new one).
 */
export function PromptCategoryDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → editing that category; absent → creating a new one. */
  category?: PromptCategoryRead | null;
  /** Throws with a readable message when the save fails. */
  onSubmit: (payload: PromptCategoryInput) => Promise<void>;
}) {
  // While saving, the drawer can't be closed (Esc, outside click, ×, Cancel).
  const [busy, setBusy] = React.useState(false);

  return (
    <PromptDrawer open={open} onOpenChange={onOpenChange} width="28rem" dismissable={!busy}>
      <PromptCategoryForm
        busy={busy}
        onBusyChange={setBusy}
        onOpenChange={onOpenChange}
        category={category ?? null}
        onSubmit={onSubmit}
      />
    </PromptDrawer>
  );
}

function PromptCategoryForm({
  busy,
  onBusyChange,
  onOpenChange,
  category,
  onSubmit,
}: {
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onOpenChange: (open: boolean) => void;
  category: PromptCategoryRead | null;
  onSubmit: (payload: PromptCategoryInput) => Promise<void>;
}) {
  // Fixed at opening, so the heading can't flip mid-slide if the page clears
  // what it was editing while the drawer closes.
  const [initial] = React.useState(category);
  const editing = initial !== null;
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return setError("Give it a short, searchable name.");
    onBusyChange(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null });
      onBusyChange(false);
      onOpenChange(false);
    } catch (err) {
      onBusyChange(false);
      setError(err instanceof Error ? err.message : "That didn't go through. Try again.");
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" aria-busy={busy || undefined}>
      <DrawerHeader
        icon={<Tag />}
        title={editing ? "Edit category" : "New category"}
        description="Groups clinical prompts by specialty so they're easier to find in the library and the New Research picker."
        closeDisabled={busy}
      />

      <fieldset disabled={busy} className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="pc-name" className="text-xs font-medium text-ink-2">
              Name
            </label>
            <span className="text-[11px] text-ink-4 tnum">
              {name.length} / {NAME_MAX}
            </span>
          </div>
          <Input
            id="pc-name"
            autoFocus
            maxLength={NAME_MAX}
            value={name}
            aria-invalid={error !== null ? true : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Endocrinology"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="pc-description" className="text-xs font-medium text-ink-2">
              Description <span className="font-normal text-ink-4">· optional</span>
            </label>
            <span className="text-[11px] text-ink-4 tnum">
              {description.length} / {DESCRIPTION_MAX}
            </span>
          </div>
          <Textarea
            id="pc-description"
            rows={4}
            maxLength={DESCRIPTION_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Thyroid, adrenal and hormone panels — what kind of questions belong here"
            className="leading-relaxed"
          />
        </div>

        {/* The tag exactly as prompts in the library will carry it. */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium tracking-wide text-ink-4 uppercase">Preview</span>
          <div className="space-y-2 rounded-lg bg-void/50 px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--color-line)]">
            {name.trim() ? (
              <CategoryTag name={name.trim()} className="w-fit" />
            ) : (
              <p className="text-[11px] text-ink-4">Type a name to see the tag prompts will carry.</p>
            )}
            {name.trim() && description.trim() && (
              <p className="text-[11px] leading-relaxed break-words text-ink-3">{description.trim()}</p>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-critical/10 px-3 py-2 text-xs text-critical">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}
      </fieldset>

      <DrawerFooter>
        <DrawerCloseSlot asChild>
          <Button type="button" variant="ghost" size="sm" disabled={busy}>
            Cancel
          </Button>
        </DrawerCloseSlot>
        <Button type="submit" variant="primary" size="sm" loading={busy}>
          {!busy && <Tag />}
          {busy ? "Saving…" : editing ? "Save changes" : "Add category"}
        </Button>
      </DrawerFooter>
    </form>
  );
}
