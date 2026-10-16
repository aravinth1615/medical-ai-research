"use client";

import * as React from "react";
import { CircleAlert, Library } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PromptCategoryRead, PromptTemplateInput, PromptTemplateRead } from "@/lib/research/types";
import { DrawerCloseSlot, DrawerFooter, DrawerHeader, PromptDrawer, PromptSelect, wordCount } from "./prompts-ui";

const TITLE_MAX = 255;
const PROMPT_MAX = 10_000;
const DESCRIPTION_MAX = 1000;
const NO_CATEGORY = "";

/**
 * Create or edit a Prompt library entry — a drawer from the right. The form
 * lives inside the drawer's content, which unmounts once it has slid out, so
 * every opening starts from the prompt being edited (or empty, for a new one).
 */
export function PromptTemplateDialog({
  open,
  onOpenChange,
  template,
  categories,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → editing that template; absent → creating a new one. */
  template?: PromptTemplateRead | null;
  /** Every category to offer in the picker, or null while still loading. */
  categories: PromptCategoryRead[] | null;
  /** Throws with a readable message when the save fails. */
  onSubmit: (payload: PromptTemplateInput) => Promise<void>;
}) {
  // While saving, the drawer can't be closed (Esc, outside click, ×, Cancel).
  const [busy, setBusy] = React.useState(false);

  return (
    <PromptDrawer open={open} onOpenChange={onOpenChange} width="34rem" dismissable={!busy}>
      <PromptTemplateForm
        busy={busy}
        onBusyChange={setBusy}
        onOpenChange={onOpenChange}
        template={template ?? null}
        categories={categories}
        onSubmit={onSubmit}
      />
    </PromptDrawer>
  );
}

function PromptTemplateForm({
  busy,
  onBusyChange,
  onOpenChange,
  template,
  categories,
  onSubmit,
}: {
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onOpenChange: (open: boolean) => void;
  template: PromptTemplateRead | null;
  categories: PromptCategoryRead[] | null;
  onSubmit: (payload: PromptTemplateInput) => Promise<void>;
}) {
  // Fixed at opening, so the heading can't flip mid-slide if the page clears
  // what it was editing while the drawer closes.
  const [initial] = React.useState(template);
  const editing = initial !== null;
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [prompt, setPrompt] = React.useState(initial?.prompt ?? "");
  const [categoryId, setCategoryId] = React.useState(initial?.category?.id ?? NO_CATEGORY);
  const [error, setError] = React.useState<string | null>(null);

  const words = prompt.trim() ? wordCount(prompt) : 0;

  // A category deleted elsewhere since this prompt was saved is still offered
  // under its old name, so opening the form doesn't silently change it.
  const options = React.useMemo(() => {
    const list = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));
    if (initial?.category && !list.some((o) => o.value === initial.category!.id)) {
      list.unshift({ value: initial.category.id, label: initial.category.name });
    }
    return [{ value: NO_CATEGORY, label: categories === null ? "Loading specialties…" : "No category" }, ...list];
  }, [categories, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!title.trim()) return setError("Give it a short, searchable title.");
    if (!prompt.trim()) return setError("The research question itself can't be empty.");
    onBusyChange(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        prompt: prompt.trim(),
        category_id: categoryId === NO_CATEGORY ? null : categoryId,
      });
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
        icon={<Library />}
        title={editing ? "Edit prompt" : "New prompt"}
        description="Anyone in Medical AI can pick this from the library to start a research run — write it the way you'd want a clinician to read it back."
        closeDisabled={busy}
      />

      <fieldset disabled={busy} className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="pt-title" className="text-xs font-medium text-ink-2">
              Title
            </label>
            <span className="text-[11px] text-ink-4 tnum">
              {title.length} / {TITLE_MAX}
            </span>
          </div>
          <Input
            id="pt-title"
            autoFocus
            maxLength={TITLE_MAX}
            value={title}
            aria-invalid={error !== null && !title.trim() ? true : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Lp(a)-adjusted ASCVD risk"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="pt-description" className="text-xs font-medium text-ink-2">
              Description <span className="font-normal text-ink-4">· optional</span>
            </label>
            <span className="text-[11px] text-ink-4 tnum">
              {description.length.toLocaleString()} / {DESCRIPTION_MAX.toLocaleString()}
            </span>
          </div>
          <Input
            id="pt-description"
            maxLength={DESCRIPTION_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this question answers, shown in the picker"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pt-category" className="block text-xs font-medium text-ink-2">
            Specialty <span className="font-normal text-ink-4">· optional</span>
          </label>
          <PromptSelect
            id="pt-category"
            size="md"
            value={categoryId}
            onChange={setCategoryId}
            disabled={categories === null && !initial?.category}
            options={options}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="pt-prompt" className="text-xs font-medium text-ink-2">
              Research question
            </label>
            <span className={cn("text-[11px] tnum", prompt.length > PROMPT_MAX * 0.9 ? "text-amber-300" : "text-ink-4")}>
              {words.toLocaleString()} word{words === 1 ? "" : "s"} · {prompt.length.toLocaleString()} / {PROMPT_MAX.toLocaleString()}
            </span>
          </div>
          <Textarea
            id="pt-prompt"
            rows={12}
            maxLength={PROMPT_MAX}
            value={prompt}
            aria-invalid={error !== null && !prompt.trim() ? true : undefined}
            aria-describedby="pt-prompt-hint"
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Summarize the 10-year ASCVD risk based on the latest lipid panel, adjusting for Lp(a), apoB and hs-CRP. State whether statin therapy is indicated and what to retest."
            className="min-h-56 leading-relaxed"
          />
          <p id="pt-prompt-hint" className="text-[11px] text-ink-4">
            Line breaks and lists are kept exactly as written.
          </p>
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
          {!busy && <Library />}
          {busy ? "Saving…" : editing ? "Save changes" : "Add to library"}
        </Button>
      </DrawerFooter>
    </form>
  );
}
