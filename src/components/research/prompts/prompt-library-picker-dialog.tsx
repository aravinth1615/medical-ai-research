"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Check, CircleAlert, Copy, Eye, Library, Loader, Search, Sparkles } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useResearch } from "@/components/research/ui/use-research";
import { fetchPromptCategories, fetchPromptTemplates } from "@/lib/research/service";
import type { ApiResult, PromptTemplateRead } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import {
  CategoryTag,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  PromptByline,
  PromptDrawer,
  PromptSearch,
  PromptSelect,
  PromptStats,
  PromptText,
  useCopied,
  useDebouncedSearch,
} from "./prompts-ui";

const ALL_CATEGORIES = "";

/**
 * "Prompt library" on the New Research page, as a drawer from the right.
 * Picking a row hands the prompt straight to the composer and closes; the eye
 * on each row opens that prompt's full text, specialty and details inside the
 * drawer first, with "Use this prompt" from there. Everything inside unmounts
 * on close, so each opening starts on a fresh, unfiltered list.
 */
export function PromptLibraryPickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (template: PromptTemplateRead) => void;
}) {
  const pick = React.useCallback(
    (template: PromptTemplateRead) => {
      onPick(template);
      onOpenChange(false);
    },
    [onPick, onOpenChange]
  );

  return (
    <PromptDrawer open={open} onOpenChange={onOpenChange} width="30rem">
      <PickerBody onPick={pick} />
    </PromptDrawer>
  );
}

type Loaded = { key: string; items: PromptTemplateRead[] };

function PickerBody({ onPick }: { onPick: (template: PromptTemplateRead) => void }) {
  const search = useDebouncedSearch();
  const [category, setCategory] = React.useState(ALL_CATEGORIES);
  // The prompt being read in full (the eye), or null for the list.
  const [viewing, setViewing] = React.useState<PromptTemplateRead | null>(null);

  const categories = useResearch(() => fetchPromptCategories(), []);
  // A filter on a category deleted meanwhile falls back to everything.
  const activeCategory =
    category && categories.data && !categories.data.some((c) => c.id === category) ? ALL_CATEGORIES : category;

  const key = `${search.query}\u0000${activeCategory}`;
  const templates = useResearch(async (): Promise<ApiResult<Loaded>> => {
    const res = await fetchPromptTemplates({
      search: search.query || undefined,
      category_id: activeCategory || undefined,
      limit: 50,
    });
    return res.error === null ? { data: { key, items: res.data.items }, error: null } : res;
  }, [key]);

  const items = templates.data?.items ?? null;
  const stale = templates.data !== null && templates.data.key !== key && !templates.error;
  const filtered = search.query !== "" || activeCategory !== ALL_CATEGORIES;

  return (
    // Switching between the list and a prompt's details eases too.
    <div key={viewing ? viewing.id : "list"} className="prompt-drawer-view flex min-h-0 flex-1 flex-col">
      {viewing ? (
        <PromptDetail template={viewing} onBack={() => setViewing(null)} onUse={() => onPick(viewing)} />
      ) : (
        <>
          <DrawerHeader
            icon={<Library />}
            title="Prompt library"
            description="Pick a saved clinical question to start your research — or open one with the eye to read it in full first."
            bordered={false}
          />
          <div className="flex shrink-0 flex-col gap-2 border-b border-white/[0.08] px-5 pb-4 sm:flex-row">
            <PromptSearch value={search.value} onValueChange={search.change} className="flex-1" autoFocus />
            {categories.data && categories.data.length > 0 && (
              <PromptSelect
                label="Filter by specialty"
                value={activeCategory}
                onChange={setCategory}
                className="sm:w-44"
                options={[
                  { value: ALL_CATEGORIES, label: "All specialties" },
                  ...categories.data.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2" aria-busy={templates.loading || stale}>
            {templates.loading ? (
              <div role="status" className="flex items-center justify-center gap-2 py-12 text-xs text-ink-4">
                <Loader className="size-5 animate-spin" />
                <span className="sr-only">Loading prompts…</span>
              </div>
            ) : templates.error && items === null ? (
              <div role="alert" className="flex flex-col items-center gap-3 px-3 py-10 text-center">
                <span className="flex items-center gap-2 text-xs text-critical">
                  <CircleAlert className="size-4 shrink-0" />
                  {templates.error}
                </span>
                <Button type="button" variant="secondary" size="xs" onClick={templates.reload}>
                  Try again
                </Button>
              </div>
            ) : !items || items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-12 text-center">
                <Search className="size-5 text-ink-4" />
                <p className="text-xs text-ink-3">
                  {search.query
                    ? `Nothing matches "${search.query}".`
                    : filtered
                      ? "No prompts in this specialty yet."
                      : "The prompt library is empty — add clinical questions from the Prompt library page."}
                </p>
                {filtered && (
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    onClick={() => {
                      search.change("");
                      setCategory(ALL_CATEGORIES);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {templates.error && (
                  <p role="alert" className="mx-1 mb-2 flex items-center gap-2 rounded-lg bg-critical/10 px-3 py-2 text-[11px] text-critical">
                    <CircleAlert className="size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1">{templates.error}</span>
                    <button type="button" onClick={templates.reload} className="shrink-0 font-medium underline underline-offset-2">
                      Retry
                    </button>
                  </p>
                )}
                <ul aria-label="Prompts" className={cn("space-y-1 transition-opacity duration-150", stale && "opacity-60")}>
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className="group flex items-start gap-1 rounded-lg border border-transparent transition-colors hover:border-white/[0.08] hover:bg-overlay/50"
                    >
                      <button
                        type="button"
                        onClick={() => onPick(t)}
                        title="Use this prompt"
                        className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg px-3 py-2.5 text-left focus-visible:shadow-[inset_0_0_0_1px_var(--color-iris)] focus-visible:outline-none"
                      >
                        <Library className="mt-0.5 size-3.5 shrink-0 text-iris" />
                        <span className="min-w-0 flex-1 space-y-1">
                          <span className="block text-xs leading-snug font-medium break-words text-ink">{t.title}</span>
                          {t.category && <CategoryTag name={t.category.name} className="w-fit" />}
                          <span className="line-clamp-2 text-[11px] leading-relaxed break-words text-ink-3">
                            {t.description || t.prompt}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewing(t)}
                        aria-label={`View prompt: ${t.title}`}
                        title="View the full prompt"
                        className="mt-1.5 mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-iris-well hover:text-iris-soft focus-visible:shadow-[inset_0_0_0_1px_var(--color-iris)] focus-visible:outline-none"
                      >
                        <Eye className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** One prompt in full, inside the drawer: what it's for, its specialty, the
 *  exact text (as written — line breaks and lists kept), and who added it. */
function PromptDetail({
  template,
  onBack,
  onUse,
}: {
  template: PromptTemplateRead;
  onBack: () => void;
  onUse: () => void;
}) {
  const { copied, copy } = useCopied(template.prompt);
  const backRef = React.useRef<HTMLButtonElement>(null);

  // Focus starts on Back, so the keyboard lands inside the new view.
  React.useEffect(() => {
    backRef.current?.focus();
  }, []);

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-3 py-2.5">
        <button
          ref={backRef}
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-2 transition-colors hover:bg-overlay hover:text-ink focus-visible:shadow-[inset_0_0_0_1px_var(--color-iris)] focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" />
          All prompts
        </button>
        <DrawerClose />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="space-y-2">
          <Dialog.Title className="text-base leading-snug font-semibold break-words text-ink">{template.title}</Dialog.Title>
          {template.category && <CategoryTag name={template.category.name} className="w-fit" />}
          <Dialog.Description className="text-xs leading-relaxed break-words text-ink-3">
            {template.description || "The full text of this clinical research question."}
          </Dialog.Description>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-xs font-medium text-ink-2">Research question</span>
            <PromptStats text={template.prompt} />
          </div>
          <PromptText text={template.prompt} />
          <PromptByline template={template} />
        </div>
      </div>

      <DrawerFooter>
        {/* Fixed width: the label changes when copied, and the button
            shouldn't resize under the pointer. */}
        <Button type="button" variant="secondary" size="sm" className="min-w-[6.5rem] justify-center" onClick={copy} aria-live="polite">
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onUse}>
          <Sparkles />
          Use this prompt
        </Button>
      </DrawerFooter>
    </>
  );
}
