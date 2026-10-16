"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, Pencil, Plus, Tag, Trash } from "@/lib/icons";
import { ConfirmDialog } from "@/components/research/ui/dialog";
import {
  ModuleBody,
  ModuleCard,
  ModuleHeaderBar,
  ModuleIntro,
  ModulePage,
  moduleTable,
} from "@/components/research/ui/module-shell";
import { AccentBadge, AETHER_BUTTON, InlineError, MonoChip, ReportStateCard } from "@/components/research/ui/primitives";
import { useResearch } from "@/components/research/ui/use-research";
import { useToast } from "@/components/ui/toast";
import { fullDate, relativeTime, researchRoutes } from "@/lib/research/format";
import {
  createPromptCategory,
  deletePromptCategory,
  fetchPromptCategories,
  updatePromptCategory,
} from "@/lib/research/service";
import type { PromptCategoryInput, PromptCategoryRead } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { PromptCategoryDialog } from "./prompt-category-dialog";
import { PROMPT_ACCENT, PROMPT_DANGER_BUTTON, PROMPT_ICON_BUTTON, PROMPT_PRIMARY_BUTTON } from "./prompts-ui";

const byName = (a: PromptCategoryRead, b: PromptCategoryRead) => a.name.localeCompare(b.name);

export function PromptCategoriesView() {
  const toast = useToast((s) => s.show);
  const res = useResearch(() => fetchPromptCategories(), []);
  const categories = res.data;

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PromptCategoryRead | null>(null);
  const [toDelete, setToDelete] = React.useState<PromptCategoryRead | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: PromptCategoryRead) {
    setEditing(category);
    setFormOpen(true);
  }

  async function handleSubmit(payload: PromptCategoryInput) {
    const wasEditing = editing;
    const r = wasEditing ? await updatePromptCategory(wasEditing.id, payload) : await createPromptCategory(payload);
    if (r.error !== null) throw new Error(r.error);
    const saved = r.data;
    res.setData((prev) =>
      prev
        ? (wasEditing ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]).sort(byName)
        : [saved]
    );
    toast(wasEditing ? "Category updated" : "Category added");
  }

  async function handleDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    const r = await deletePromptCategory(id);
    if (r.error !== null) throw new Error(r.error);
    res.setData((prev) => (prev ?? []).filter((c) => c.id !== id));
    toast("Category deleted");
  }

  const retryButton = (
    <button type="button" className={AETHER_BUTTON} onClick={res.reload}>
      Try again
    </button>
  );

  const countLabel = categories ? `${categories.length} categor${categories.length === 1 ? "y" : "ies"}` : null;
  const filed = categories?.reduce((sum, c) => sum + c.template_count, 0) ?? 0;
  const unused = categories?.filter((c) => c.template_count === 0).length ?? 0;

  return (
    <ModulePage>
      <ModuleHeaderBar
        icon={<Tag />}
        title="Prompt Categories"
        badge={countLabel ?? undefined}
        actions={
          <>
            <Link href={researchRoutes.promptLibrary} className={AETHER_BUTTON}>
              <ArrowLeft />
              Back to library
            </Link>
            <button type="button" className={PROMPT_PRIMARY_BUTTON} onClick={openCreate}>
              <Plus />
              New category
            </button>
          </>
        }
      />

      <ModuleIntro
        labelIcon={<Tag />}
        label="Prompt library · Categories"
        title="Specialties that group the clinical prompts in the library."
        description="Assign one when adding or editing a prompt — Cardiology, Metabolism and so on. Deleting a category never deletes its prompts; they stay in the library, uncategorised."
        chips={
          categories !== null && (
            <>
              <MonoChip>Categories: {categories.length}</MonoChip>
              <MonoChip>Categorised prompts: {filed}</MonoChip>
              <MonoChip>Unused: {unused}</MonoChip>
            </>
          )
        }
      />

      <ModuleBody>
        {res.loading ? (
          <ModuleCard icon={<Tag className="text-indigo-400" />} title="Categories" flush>
            <div role="status" aria-label="Loading categories" className="divide-y divide-white/[0.05]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} aria-hidden className="flex animate-pulse items-center gap-4 px-4 py-3.5">
                  <div className="size-7 shrink-0 rounded-md bg-white/[0.05]" />
                  <div className="h-3 w-1/5 rounded bg-white/[0.06]" />
                  <div className="h-2.5 flex-1 rounded bg-white/[0.04]" />
                </div>
              ))}
            </div>
          </ModuleCard>
        ) : res.error && categories === null ? (
          <ReportStateCard
            tone="red"
            icon={<CircleAlert />}
            title="Couldn't load categories"
            description={res.error}
            action={retryButton}
          />
        ) : !categories || categories.length === 0 ? (
          <ReportStateCard
            icon={<Tag />}
            title="No categories yet"
            description="Add the first specialty — Cardiology, say — so prompts can be grouped under it."
            action={
              <button type="button" className={PROMPT_PRIMARY_BUTTON} onClick={openCreate}>
                <Plus />
                New category
              </button>
            }
          />
        ) : (
          <>
            {res.error && <InlineError message={`Couldn't refresh categories: ${res.error}`} onRetry={res.reload} />}
            <ModuleCard
              icon={<Tag className="text-indigo-400" />}
              title="Categories"
              aside={<span className="tabular-nums">{countLabel}</span>}
              flush
            >
              {/* Narrow cards fold the description and date under the name
                  rather than scrolling the table sideways. */}
              <div className={cn(moduleTable.wrap, "@container")}>
                <table aria-label="Prompt library categories" className={cn(moduleTable.table, "table-fixed")}>
                  <thead className={moduleTable.thead}>
                    <tr>
                      <th scope="col" className={cn(moduleTable.th, "@xl:w-[24%]")}>
                        Name
                      </th>
                      <th scope="col" className={cn(moduleTable.th, "hidden @xl:table-cell")}>
                        Description
                      </th>
                      <th scope="col" className={cn(moduleTable.th, "hidden w-24 text-right @xl:table-cell")}>
                        Prompts
                      </th>
                      <th scope="col" className={cn(moduleTable.th, "hidden w-32 @xl:table-cell")}>
                        Updated
                      </th>
                      <th scope="col" className={cn(moduleTable.th, "w-[4.75rem] @xl:w-24")}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <CategoryRow key={c.id} category={c} onEdit={() => openEdit(c)} onDelete={() => setToDelete(c)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </ModuleCard>
          </>
        )}
      </ModuleBody>

      <PromptCategoryDialog open={formOpen} onOpenChange={setFormOpen} category={editing} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        icon={<CircleAlert />}
        title={toDelete ? `Delete "${toDelete.name}"?` : ""}
        description={
          toDelete && toDelete.template_count > 0
            ? `${toDelete.template_count} prompt${toDelete.template_count === 1 ? "" : "s"} currently use${toDelete.template_count === 1 ? "s" : ""} this category — ${toDelete.template_count === 1 ? "it stays" : "they stay"} in the library, just uncategorised.`
            : "This category isn't used by any prompts yet."
        }
        confirmLabel="Delete category"
        tone="danger"
        onConfirm={handleDelete}
      />
    </ModulePage>
  );
}

function CategoryRow({
  category: c,
  onEdit,
  onDelete,
}: {
  category: PromptCategoryRead;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const updated = (
    <time dateTime={c.updated_at} title={fullDate(c.updated_at)} className="font-mono text-[11px] whitespace-nowrap text-gray-500">
      {relativeTime(c.updated_at)}
    </time>
  );
  const count =
    c.template_count > 0 ? (
      <AccentBadge color={PROMPT_ACCENT} className="min-w-6 justify-center tabular-nums">
        {c.template_count}
      </AccentBadge>
    ) : (
      <span className="inline-flex min-w-6 justify-center rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-500 tabular-nums">
        {c.template_count}
      </span>
    );

  return (
    <tr className={cn(moduleTable.tr, "hover:bg-white/[0.02]")}>
      <td className={cn(moduleTable.td, "align-top")}>
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-indigo-500/10 text-indigo-400">
            <Tag className="size-3.5" />
          </span>
          <span className="block truncate text-xs font-semibold text-gray-100" title={c.name}>
            {c.name}
          </span>
        </span>
        <span className="mt-2 block space-y-1.5 pl-[2.375rem] @xl:hidden">
          {c.description ? (
            <span className="line-clamp-2 text-xs leading-relaxed break-words text-gray-400" title={c.description}>
              {c.description}
            </span>
          ) : (
            <span className="block text-xs text-gray-600">—</span>
          )}
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              {count}
              prompt{c.template_count === 1 ? "" : "s"}
            </span>
            <span>updated {updated}</span>
          </span>
        </span>
      </td>
      <td className={cn(moduleTable.td, "hidden align-top @xl:table-cell")}>
        {c.description ? (
          <p className="line-clamp-2 pt-1 text-xs leading-relaxed break-words text-gray-400" title={c.description}>
            {c.description}
          </p>
        ) : (
          <span className="block pt-1 text-xs text-gray-600">—</span>
        )}
      </td>
      <td className={cn(moduleTable.td, "hidden text-right align-top @xl:table-cell")}>
        <span className="inline-flex pt-1">{count}</span>
      </td>
      <td className={cn(moduleTable.td, "hidden align-top @xl:table-cell")}>
        <span className="block pt-1">{updated}</span>
      </td>
      <td className={cn(moduleTable.td, "py-2.5 pr-3 pl-0 align-top @xl:pr-4")}>
        <span className="flex items-center justify-end gap-0.5">
          <button type="button" className={PROMPT_ICON_BUTTON} title="Edit category" aria-label={`Edit ${c.name}`} onClick={onEdit}>
            <Pencil />
          </button>
          <button
            type="button"
            className={PROMPT_DANGER_BUTTON}
            title="Delete category"
            aria-label={`Delete ${c.name}`}
            onClick={onDelete}
          >
            <Trash />
          </button>
        </span>
      </td>
    </tr>
  );
}
