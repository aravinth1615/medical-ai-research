"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, CircleAlert, Library, Plus, Tag } from "@/lib/icons";
import { ConfirmDialog } from "@/components/research/ui/dialog";
import { ModuleBody, ModuleHeaderBar, ModuleIntro, ModulePage } from "@/components/research/ui/module-shell";
import { AETHER_BUTTON, InlineError, MonoChip, ReportStateCard, SectionLabel } from "@/components/research/ui/primitives";
import { useResearch } from "@/components/research/ui/use-research";
import { useToast } from "@/components/ui/toast";
import { useComposerStore } from "@/lib/research/composer-store";
import { researchRoutes } from "@/lib/research/format";
import {
  createPromptTemplate,
  deletePromptTemplate,
  fetchPromptCategories,
  fetchPromptTemplates,
  updatePromptTemplate,
} from "@/lib/research/service";
import type { ApiResult, PromptTemplateInput, PromptTemplateRead } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { PromptTemplateDialog } from "./prompt-template-dialog";
import { PromptViewDialog } from "./prompt-view-dialog";
import {
  PROMPT_PRIMARY_BUTTON,
  PromptCard,
  PromptCardSkeleton,
  PromptSearch,
  PromptSelect,
  shortText,
  useDebouncedSearch,
} from "./prompts-ui";

const ALL_CATEGORIES = "";

/** A card shows only the start of a description, then "…". */
const DESCRIPTION_PREVIEW_CHARS = 60;

type Loaded = { key: string; items: PromptTemplateRead[] };

export function PromptLibraryView() {
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const search = useDebouncedSearch();
  const [category, setCategory] = React.useState(ALL_CATEGORIES);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PromptTemplateRead | null>(null);
  const [toDelete, setToDelete] = React.useState<PromptTemplateRead | null>(null);
  const [viewing, setViewing] = React.useState<PromptTemplateRead | null>(null);

  const categoriesRes = useResearch(() => fetchPromptCategories(), []);
  const categories = categoriesRes.data;
  // A filter on a category deleted meanwhile falls back to everything.
  const activeCategory =
    category && categories && !categories.some((c) => c.id === category) ? ALL_CATEGORIES : category;

  // Results are tagged with the search they answer, so the previous cards can
  // stay on screen (dimmed) while a new search loads, and the search box
  // never unmounts mid-typing.
  const key = `${search.query}\u0000${activeCategory}`;
  const res = useResearch(async (): Promise<ApiResult<Loaded>> => {
    const r = await fetchPromptTemplates({
      search: search.query || undefined,
      category_id: activeCategory || undefined,
      limit: 200,
    });
    return r.error === null ? { data: { key, items: r.data.items }, error: null } : r;
  }, [key]);

  const templates = res.data?.items ?? null;
  const stale = res.data !== null && res.data.key !== key && !res.error;
  const filtered = search.query !== "" || activeCategory !== ALL_CATEGORIES;

  const contributors = React.useMemo(
    () => new Set((templates ?? []).flatMap((t) => (t.created_by ? [t.created_by.id] : []))).size,
    [templates]
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(template: PromptTemplateRead) {
    setEditing(template);
    setFormOpen(true);
  }

  function startWithPrompt(template: PromptTemplateRead) {
    useComposerStore.getState().setDraft(template.prompt);
    router.push(researchRoutes.newResearch);
  }

  function clearFilters() {
    search.change("");
    setCategory(ALL_CATEGORIES);
  }

  async function handleSubmit(payload: PromptTemplateInput) {
    const wasEditing = editing;
    const r = wasEditing ? await updatePromptTemplate(wasEditing.id, payload) : await createPromptTemplate(payload);
    if (r.error !== null) throw new Error(r.error);
    const saved = r.data;
    // Shown at once; the store's change event then refetches with the filters.
    res.setData((prev) =>
      prev
        ? {
            ...prev,
            items: wasEditing ? prev.items.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev.items],
          }
        : prev
    );
    toast(wasEditing ? "Prompt updated" : "Prompt added to the library");
  }

  async function handleDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    const r = await deletePromptTemplate(id);
    if (r.error !== null) throw new Error(r.error);
    res.setData((prev) => (prev ? { ...prev, items: prev.items.filter((t) => t.id !== id) } : prev));
    toast("Prompt deleted");
  }

  const retryButton = (
    <button type="button" className={AETHER_BUTTON} onClick={res.reload}>
      Try again
    </button>
  );

  const busy = res.loading || stale;
  const count = templates?.length ?? 0;
  const countLabel = `${count} prompt${count === 1 ? "" : "s"}`;

  return (
    <ModulePage>
      <ModuleHeaderBar
        icon={<BookOpen />}
        title="Prompt Library"
        badge={templates !== null ? countLabel : undefined}
        status={
          busy
            ? "Loading prompts…"
            : templates !== null && !res.error
              ? `${countLabel} ${filtered ? "matching" : "ready to pick"}`
              : undefined
        }
        statusTone={busy ? "amber" : "emerald"}
        actions={
          <>
            <Link href={researchRoutes.promptCategories} className={AETHER_BUTTON}>
              <Tag />
              Manage categories
            </Link>
            <button type="button" className={PROMPT_PRIMARY_BUTTON} onClick={openCreate}>
              <Plus />
              New prompt
            </button>
          </>
        }
      />

      <ModuleIntro
        labelIcon={<Library />}
        label="Prompt library"
        title="Reusable clinical research questions, grouped by specialty, ready to start a run."
        description="Use one to open it in New Research, or add the questions your team asks most — anyone signed in to Medical AI can add, edit and organise prompts."
        chips={
          (templates !== null || categories !== null) && (
            <>
              {templates !== null && <MonoChip>Prompts: {count}</MonoChip>}
              {categories !== null && <MonoChip>Specialties: {categories.length}</MonoChip>}
              {/* Counted from the loaded list, so only while it is the whole library. */}
              {templates !== null && !filtered && <MonoChip>Contributors: {contributors}</MonoChip>}
            </>
          )
        }
      />

      <ModuleBody>
        {/* One step up from the module's type scale for everything in the
            Prompt templates section — search, filter, cards, footer. */}
        <div
          className={cn(
            "space-y-3",
            "[--text-xs:0.8125rem] [--text-xs--line-height:1.125rem]",
            "[--text-sm:0.9375rem] [--text-sm--line-height:1.3125rem]",
            "[--text-base:1.0625rem] [--text-base--line-height:1.5625rem]"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
            <SectionLabel>
              Clinical prompts
              {templates !== null && <span className="text-gray-600"> · {count}</span>}
            </SectionLabel>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <PromptSearch value={search.value} onValueChange={search.change} className="w-full sm:w-72" />
              {categories !== null && categories.length > 0 && (
                <PromptSelect
                  label="Filter by specialty"
                  className="w-full sm:w-52"
                  value={activeCategory}
                  onChange={setCategory}
                  options={[
                    { value: ALL_CATEGORIES, label: "All specialties" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              )}
            </div>
          </div>

          {res.loading ? (
            <div className="@container" role="status" aria-label="Loading prompts">
              <div className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PromptCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : res.error && templates === null ? (
            <ReportStateCard
              tone="red"
              icon={<CircleAlert />}
              title="Couldn't load the prompt library"
              description={res.error}
              action={retryButton}
            />
          ) : !templates || templates.length === 0 ? (
            <ReportStateCard
              icon={<Library />}
              title={filtered ? "No matching prompts" : "No prompts yet"}
              description={
                search.query
                  ? "Nothing in the library matches that search."
                  : filtered
                    ? "No prompts in this specialty yet."
                    : "Add the first clinical research question so the team has something to pick from."
              }
              action={
                filtered ? (
                  <button type="button" className={AETHER_BUTTON} onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : (
                  <button type="button" className={PROMPT_PRIMARY_BUTTON} onClick={openCreate}>
                    <Plus />
                    New prompt
                  </button>
                )
              }
            />
          ) : (
            <>
              {res.error && <InlineError message={`Couldn't refresh the library: ${res.error}`} onRetry={res.reload} />}
              {/* Previous cards stay on screen (dimmed) while a new search loads. */}
              <div aria-busy={stale} className={cn("@container transition-opacity duration-150", stale && "opacity-60")}>
                <ul aria-label="Prompt library" className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
                  {templates.map((t, i) => (
                    <li key={t.id} className="min-w-0">
                      <PromptCard
                        template={t}
                        index={i}
                        description={t.description ? shortText(t.description, DESCRIPTION_PREVIEW_CHARS) : null}
                        onView={() => setViewing(t)}
                        onUse={() => startWithPrompt(t)}
                        onEdit={() => openEdit(t)}
                        onDelete={() => setToDelete(t)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 pt-1 font-mono text-[12px] text-gray-500">
                <span className="tabular-nums">
                  {templates.length} prompt{templates.length === 1 ? "" : "s"}
                  {search.query ? ` matching “${search.query}”` : ""}
                </span>
                <span>Also available from New Research&apos;s &quot;Prompt library&quot; button.</span>
              </p>
            </>
          )}
        </div>
      </ModuleBody>

      <PromptViewDialog
        template={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        onEdit={(template) => {
          setViewing(null);
          openEdit(template);
        }}
        onUse={(template) => {
          setViewing(null);
          startWithPrompt(template);
        }}
      />

      <PromptTemplateDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        template={editing}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        icon={<CircleAlert />}
        title={toDelete ? `Delete "${toDelete.title}"?` : ""}
        description="Removes it from the library for everyone. Reports already run from this prompt are unaffected."
        confirmLabel="Delete prompt"
        tone="danger"
        onConfirm={handleDelete}
      />
    </ModulePage>
  );
}
