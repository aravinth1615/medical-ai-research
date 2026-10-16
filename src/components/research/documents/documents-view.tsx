"use client";

import * as React from "react";
import Link from "next/link";
import { CircleAlert, FileText, Folder, FolderPlus, Loader, Pencil, Trash, X } from "@/lib/icons";
import { createFolder, deleteFolder, fetchFolders, renameFolder } from "@/lib/research/service";
import { researchRoutes } from "@/lib/research/format";
import type { FolderRead } from "@/lib/research/types";
import { ModuleBody, ModuleHeaderBar, ModuleIntro, ModulePage } from "@/components/research/ui/module-shell";
import {
  AETHER_BUTTON,
  AETHER_PRIMARY_BUTTON,
  MonoChip,
  ReportStateCard,
  SectionLabel,
} from "@/components/research/ui/primitives";
import { ConfirmDialog } from "@/components/research/ui/dialog";
import { useResearch } from "@/components/research/ui/use-research";
import { useToast } from "@/components/ui/toast";
import { FolderDialog } from "./folder-dialog";
import {
  DOC_DANGER_BUTTON,
  DOC_FOCUS_RING,
  DOC_ICON_BUTTON,
  useFileDrop,
  useFolderUploads,
} from "./documents-bits";
import { cn } from "@/lib/utils";

/** /research/documents — the patient's files, one tile per folder. */
export function DocumentsView() {
  const { data: folders, error, loading, reload } = useResearch(() => fetchFolders(), []);
  const showToast = useToast((s) => s.show);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FolderRead | null>(null);
  const [toDelete, setToDelete] = React.useState<FolderRead | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openRename(folder: FolderRead) {
    setEditing(folder);
    setFormOpen(true);
  }

  async function handleSubmit(name: string) {
    const res = editing ? await renameFolder(editing.id, name) : await createFolder(name);
    if (res.error !== null) throw new Error(res.error);
    showToast(editing ? "Folder renamed" : `Created "${res.data.name}"`);
    reload();
  }

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deleteFolder(toDelete.id);
    if (res.error !== null) throw new Error(res.error);
    showToast(`Deleted "${toDelete.name}"`);
    reload();
  }

  const fileCount = folders?.reduce((sum, f) => sum + f.document_count, 0) ?? 0;

  const newFolderButton = (
    <button type="button" className={cn(AETHER_PRIMARY_BUTTON, DOC_FOCUS_RING)} onClick={openCreate}>
      <FolderPlus />
      New folder
    </button>
  );

  return (
    <ModulePage>
      <ModuleHeaderBar
        icon={<Folder />}
        title="Documents"
        badge={folders !== null ? folders.length : undefined}
        actions={newFolderButton}
      />

      <ModuleIntro
        labelIcon={<Folder />}
        label="Documents"
        title="The patient's files, organized into folders."
        description="Lab PDFs, cardiology summaries and CGM or watch exports live here. Files attached to a research run are filed in automatically under the run's title."
        chips={
          folders !== null && (
            <>
              <MonoChip>
                Folders: <span className="tabular-nums">{folders.length}</span>
              </MonoChip>
              <MonoChip>
                Files: <span className="tabular-nums">{fileCount}</span>
              </MonoChip>
            </>
          )
        }
      />

      <ModuleBody>
        <section className="@container space-y-2.5" aria-label="Folders" aria-busy={loading || undefined}>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
            <SectionLabel className="px-0">
              Folders{folders && folders.length > 0 ? ` (${folders.length})` : ""}
            </SectionLabel>
            {folders && folders.length > 0 && (
              <span className="hidden font-mono text-xs text-gray-500 sm:inline">
                Drop a file onto a folder to add it
              </span>
            )}
          </div>

          {loading && folders === null ? (
            <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3" aria-hidden>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[70px] animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]" />
              ))}
            </div>
          ) : error && folders === null ? (
            <ReportStateCard
              tone="red"
              icon={<CircleAlert />}
              title="Couldn't load Documents"
              description={error}
              action={
                <button type="button" className={cn(AETHER_BUTTON, DOC_FOCUS_RING)} onClick={reload}>
                  Try again
                </button>
              }
            />
          ) : !folders || folders.length === 0 ? (
            <ReportStateCard
              icon={<Folder />}
              title="No folders yet"
              description="Add one, or start a New Research run with a lab PDF or sensor export attached — a folder is created for it automatically."
              action={newFolderButton}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onRename={() => openRename(folder)}
                  onDelete={() => setToDelete(folder)}
                />
              ))}
            </div>
          )}
        </section>
      </ModuleBody>

      <FolderDialog open={formOpen} onOpenChange={setFormOpen} folder={editing} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        icon={<CircleAlert />}
        title={toDelete ? `Delete "${toDelete.name}"?` : ""}
        description={
          toDelete && toDelete.document_count > 0
            ? `The ${toDelete.document_count} file${toDelete.document_count === 1 ? "" : "s"} inside it will be deleted too — this can't be undone.`
            : "This folder is empty. This can't be undone."
        }
        confirmLabel="Delete folder"
        tone="danger"
        onConfirm={handleDelete}
      />
    </ModulePage>
  );
}

function FolderCard({
  folder,
  onRename,
  onDelete,
}: {
  folder: FolderRead;
  onRename: () => void;
  onDelete: () => void;
}) {
  const uploads = useFolderUploads(folder.id);
  const { dragging, handlers } = useFileDrop(uploads.upload);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border p-4 transition-all",
        dragging
          ? "border-indigo-500/60 bg-indigo-500/[0.08]"
          : uploads.busy
            ? "border-indigo-500/40 bg-[#11131A]"
            : "border-white/[0.07] bg-[#11131A] hover:border-indigo-500/40 hover:bg-[#161924]"
      )}
      {...handlers}
    >
      <Link
        href={researchRoutes.folder(folder.id)}
        aria-label={`Open ${folder.name}, ${folder.document_count} file${folder.document_count === 1 ? "" : "s"}`}
        className={cn("absolute inset-0 rounded-xl", DOC_FOCUS_RING)}
      />

      <div className="flex items-center gap-3.5">
        <div className="shrink-0 rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
          <Folder className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-semibold text-gray-100 transition-colors group-hover:text-indigo-300">
            {folder.name}
          </h3>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-gray-400">
            <span className="shrink-0 tabular-nums">
              {folder.document_count} file{folder.document_count === 1 ? "" : "s"}
            </span>
            {uploads.progress && (
              <span className="flex min-w-0 items-center gap-1 font-mono text-indigo-300" aria-live="polite">
                <Loader className="size-3 shrink-0 animate-spin" />
                <span className="truncate">
                  {uploads.progress.total > 1
                    ? `Uploading ${uploads.progress.current} of ${uploads.progress.total}…`
                    : "Uploading…"}
                </span>
              </span>
            )}
          </p>
        </div>
        <span className="relative z-[1] flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className={cn(DOC_ICON_BUTTON, DOC_FOCUS_RING)}
            title="Rename folder"
            aria-label={`Rename ${folder.name}`}
            onClick={onRename}
          >
            <Pencil />
          </button>
          <button
            type="button"
            className={cn(DOC_DANGER_BUTTON, DOC_FOCUS_RING)}
            title="Delete folder"
            aria-label={`Delete ${folder.name}`}
            onClick={onDelete}
          >
            <Trash />
          </button>
        </span>
      </div>

      {uploads.failed.length > 0 && (
        <ul className="relative z-[1] mt-3 space-y-1.5" aria-label={`Failed uploads to ${folder.name}`}>
          {uploads.failed.map((item) => (
            <li
              key={item.id}
              role="alert"
              className="flex items-start gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-[11px] text-red-300"
            >
              <CircleAlert className="mt-0.5 size-3 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-red-200" title={item.name}>
                  {item.name}
                </span>
                <span className="line-clamp-2">{item.error}</span>
              </span>
              <button
                type="button"
                onClick={() => uploads.dismiss(item.id)}
                aria-label={`Dismiss the failed upload of ${item.name}`}
                className={cn("-m-0.5 grid size-5 shrink-0 place-items-center rounded text-red-300 hover:bg-red-500/15 hover:text-white", DOC_FOCUS_RING)}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-[2] flex animate-fade-in items-center justify-center gap-3 rounded-xl border-2 border-dashed border-indigo-500/70 bg-[#10122A] px-4">
          <div className="shrink-0 rounded-lg border border-indigo-500/40 bg-indigo-500/20 p-2 text-indigo-300">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-indigo-200">Drop to upload here</div>
            <div className="truncate font-mono text-[11px] text-indigo-300/80">{folder.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}
