"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, Download, FileText, Folder, FolderOpen, Loader, Trash, Upload } from "@/lib/icons";
import {
  deleteDocument,
  downloadDocument,
  fetchDocuments,
  fetchFolder,
  fetchFolders,
} from "@/lib/research/service";
import { fileSize, relativeTime, researchRoutes } from "@/lib/research/format";
import type { ApiResult, DocumentRead, FolderRead } from "@/lib/research/types";
import {
  ModuleBody,
  ModuleCard,
  ModuleHeaderBar,
  ModuleIntro,
  ModulePage,
  moduleTable,
} from "@/components/research/ui/module-shell";
import { AETHER_BUTTON, AETHER_PRIMARY_BUTTON, MonoChip, ReportStateCard } from "@/components/research/ui/primitives";
import { ConfirmDialog } from "@/components/research/ui/dialog";
import { useResearch } from "@/components/research/ui/use-research";
import { useToast } from "@/components/ui/toast";
import {
  DOC_DANGER_BUTTON,
  DOC_FOCUS_RING,
  DOC_ICON_BUTTON,
  UploadQueue,
  DocumentIcon,
  useFileDrop,
  useFolderUploads,
} from "./documents-bits";
import { cn } from "@/lib/utils";

type FolderState = { found: true; folder: FolderRead; documents: DocumentRead[] } | { found: false };

/** The folder and its files in one load. A failed folder lookup is checked
 *  against the folder list, so an unknown (or just-deleted) id reads as
 *  "not found" rather than as an error to retry. */
async function loadFolder(folderId: string): Promise<ApiResult<FolderState>> {
  const [folderRes, documentsRes] = await Promise.all([
    fetchFolder(folderId),
    fetchDocuments(folderId, { limit: 200 }),
  ]);
  if (folderRes.error !== null) {
    const all = await fetchFolders();
    if (all.error === null && !all.data.some((f) => f.id === folderId)) {
      return { data: { found: false }, error: null };
    }
    return { data: null, error: folderRes.error };
  }
  if (documentsRes.error !== null) return { data: null, error: documentsRes.error };
  return { data: { found: true, folder: folderRes.data, documents: documentsRes.data.items }, error: null };
}

/** /research/documents/[folderId] — one folder's files, with drag-and-drop
 *  upload anywhere on the page. */
export function FolderView({ folderId }: { folderId: string }) {
  const { data, error, loading, reload } = useResearch(() => loadFolder(folderId), [folderId]);
  const showToast = useToast((s) => s.show);
  const uploads = useFolderUploads(folderId);
  const [toDelete, setToDelete] = React.useState<DocumentRead | null>(null);
  const [downloading, setDownloading] = React.useState<string | null>(null);
  // The file picker behind "Upload files" / "Browse files" — the same upload
  // as dropping files on the page.
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const folder = data?.found ? data.folder : null;
  const documents = data?.found ? data.documents : null;
  const { dragging, handlers } = useFileDrop(uploads.upload, folder !== null);

  async function handleDelete() {
    if (!toDelete) return;
    const res = await deleteDocument(toDelete.id);
    if (res.error !== null) throw new Error(res.error);
    showToast(`Deleted "${toDelete.original_filename}"`);
    reload();
  }

  async function handleDownload(doc: DocumentRead) {
    setDownloading(doc.id);
    try {
      await downloadDocument(doc);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't download that file.", "error");
    } finally {
      setDownloading(null);
    }
  }

  function handleFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    // Cleared so picking the same file again still fires a change.
    e.target.value = "";
    uploads.upload(picked);
  }

  const openFilePicker = () => fileInputRef.current?.click();

  const backLink = (
    <Link href={researchRoutes.documents} className={cn(AETHER_BUTTON, DOC_FOCUS_RING)}>
      <ArrowLeft />
      Back to Documents
    </Link>
  );

  if (data && !data.found) {
    return (
      <ModulePage>
        <ModuleHeaderBar icon={<Folder />} title="Documents" />
        <ModuleBody>
          <ReportStateCard
            icon={<Folder />}
            title="Folder not found"
            description="It may have been deleted, or the link is out of date. The patient's other folders are still in Documents."
            action={
              <Link href={researchRoutes.documents} className={cn(AETHER_PRIMARY_BUTTON, DOC_FOCUS_RING)}>
                <ArrowLeft />
                Back to Documents
              </Link>
            }
          />
        </ModuleBody>
      </ModulePage>
    );
  }

  const totalBytes = documents?.reduce((sum, d) => sum + d.size_bytes, 0) ?? 0;

  return (
    <ModulePage>
      <ModuleHeaderBar
        icon={<Folder />}
        title={folder?.name ?? "…"}
        badge={folder ? folder.document_count : undefined}
        actions={
          <>
            {backLink}
            {folder && (
              <button
                type="button"
                onClick={openFilePicker}
                className={cn(AETHER_PRIMARY_BUTTON, "gap-1.5 px-3 py-[7px]", DOC_FOCUS_RING)}
              >
                {uploads.busy ? <Loader className="animate-spin" /> : <Upload />}
                {uploads.busy ? "Uploading…" : "Upload files"}
              </button>
            )}
          </>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        aria-hidden
        tabIndex={-1}
        onChange={handleFilesPicked}
      />

      <ModuleIntro
        labelIcon={<Folder />}
        label="Folder"
        title={
          folder?.name ??
          (loading ? <span className="block h-5 w-56 max-w-full animate-pulse rounded bg-white/[0.06]" aria-hidden /> : "…")
        }
        description="Files in this folder — lab PDFs, clinical summaries and device exports Medical AI can draw on when they're attached to a research run."
        chips={
          folder && (
            <>
              <MonoChip>
                Files: <span className="tabular-nums">{folder.document_count}</span>
              </MonoChip>
              {/* Summed from the loaded rows, so only shown when they are all of them. */}
              {documents && documents.length > 0 && documents.length === folder.document_count && (
                <MonoChip>
                  Total size: <span className="tabular-nums">{fileSize(totalBytes)}</span>
                </MonoChip>
              )}
            </>
          )
        }
      />

      <ModuleBody>
        <div className="space-y-4" {...handlers}>
          {folder && (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all sm:px-6",
                dragging
                  ? "border-indigo-400/80 bg-indigo-500/[0.14] shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                  : uploads.busy
                    ? "border-indigo-500/50 bg-indigo-500/[0.06]"
                    : "border-indigo-500/30 bg-[#11131A]/60"
              )}
            >
              <div
                className={cn(
                  "rounded-xl border p-3 text-indigo-300 transition-colors",
                  dragging ? "border-indigo-500/60 bg-indigo-500/25" : "border-indigo-500/35 bg-indigo-500/15"
                )}
              >
                {uploads.busy && !dragging ? (
                  <Loader className="size-5 animate-spin" />
                ) : (
                  <FolderOpen className="size-5" />
                )}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold",
                  dragging || uploads.busy ? "text-indigo-200" : "text-gray-200"
                )}
              >
                {dragging
                  ? "Drop to upload here"
                  : uploads.busy
                    ? "Uploading…"
                    : "Drag & drop lab PDFs, summaries or CSV exports anywhere here to add them to this folder"}
              </div>
              {!dragging && !uploads.busy && (
                <>
                  <div className="text-xs text-gray-500">or</div>
                  <button type="button" onClick={openFilePicker} className={cn(AETHER_BUTTON, DOC_FOCUS_RING)}>
                    <Upload />
                    Browse files
                  </button>
                  <div className="text-[11px] text-gray-500">Up to 50 MB per file</div>
                </>
              )}
            </div>
          )}

          <UploadQueue items={uploads.items} onDismiss={uploads.dismiss} onClearFailed={uploads.clearFailed} />

          {loading && data === null ? (
            <div className="space-y-2 rounded-xl border border-white/[0.08] bg-[#0F111A] p-3" aria-hidden>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
              ))}
            </div>
          ) : error && data === null ? (
            <ReportStateCard
              tone="red"
              icon={<CircleAlert />}
              title="Couldn't load this folder"
              description={error}
              action={
                <>
                  <button type="button" className={cn(AETHER_BUTTON, DOC_FOCUS_RING)} onClick={reload}>
                    Try again
                  </button>
                  {backLink}
                </>
              }
            />
          ) : !documents || documents.length === 0 ? (
            <ReportStateCard
              icon={<FileText />}
              title="No files yet"
              description="Drop a lab PDF, cardiology summary or CGM/watch export anywhere on this page, or use Upload files, to add it."
            />
          ) : (
            <ModuleCard flush icon={<FileText className="text-indigo-400" />} title="Files">
              <div className={moduleTable.wrap}>
                <table aria-label={`Files in ${folder?.name ?? "folder"}`} className={cn(moduleTable.table, "table-fixed")}>
                  <colgroup>
                    <col />
                    <col className="hidden w-[8rem] sm:table-column" />
                    <col className="hidden w-[9rem] sm:table-column" />
                    <col className="w-[5.5rem]" />
                  </colgroup>
                  <thead className={moduleTable.thead}>
                    <tr>
                      <th scope="col" className={cn(moduleTable.th, "pl-4 sm:pl-5")}>
                        File
                      </th>
                      <th scope="col" className={cn(moduleTable.th, "hidden text-right sm:table-cell")}>
                        Size
                      </th>
                      <th scope="col" className={cn(moduleTable.th, "hidden sm:table-cell")}>
                        Uploaded
                      </th>
                      <th scope="col" className={cn(moduleTable.th, "pr-4 text-right sm:pr-5")}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => {
                      return (
                        <tr key={doc.id} className={cn(moduleTable.tr, "hover:bg-white/[0.025]")}>
                          <td className={cn(moduleTable.td, "pl-4 sm:pl-5")}>
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                                <DocumentIcon contentType={doc.content_type} className="size-3.5" />
                              </span>
                              <span className="min-w-0">
                                <span
                                  className="block truncate text-xs font-medium text-gray-100"
                                  title={doc.original_filename}
                                >
                                  {doc.original_filename}
                                </span>
                                {/* Size and age move under the name when their columns are hidden. */}
                                <span className="mt-0.5 block truncate font-mono text-[11px] text-gray-500 tabular-nums sm:hidden">
                                  {fileSize(doc.size_bytes)} · {relativeTime(doc.created_at)}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td
                            className={cn(
                              moduleTable.td,
                              "hidden text-right font-mono text-[11px] text-gray-300 tabular-nums sm:table-cell"
                            )}
                          >
                            {fileSize(doc.size_bytes)}
                          </td>
                          <td className={cn(moduleTable.td, "hidden sm:table-cell")}>
                            <time
                              dateTime={doc.created_at}
                              title={new Date(doc.created_at).toLocaleString()}
                              className="font-mono text-[11px] whitespace-nowrap text-gray-400"
                            >
                              {relativeTime(doc.created_at)}
                            </time>
                          </td>
                          <td className={cn(moduleTable.td, "py-2 pr-3 sm:pr-4")}>
                            <span className="flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                className={cn(DOC_ICON_BUTTON, DOC_FOCUS_RING)}
                                title="Download"
                                aria-label={`Download ${doc.original_filename}`}
                                disabled={downloading === doc.id}
                                onClick={() => handleDownload(doc)}
                              >
                                {downloading === doc.id ? <Loader className="animate-spin" /> : <Download />}
                              </button>
                              <button
                                type="button"
                                className={cn(DOC_DANGER_BUTTON, DOC_FOCUS_RING)}
                                title="Delete"
                                aria-label={`Delete ${doc.original_filename}`}
                                onClick={() => setToDelete(doc)}
                              >
                                <Trash />
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/[0.06] px-5 py-3 font-mono text-[11px] text-gray-500 tabular-nums">
                {documents.length} file{documents.length === 1 ? "" : "s"}
              </div>
            </ModuleCard>
          )}
        </div>
      </ModuleBody>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        icon={<CircleAlert />}
        title={toDelete ? `Delete "${toDelete.original_filename}"?` : ""}
        description="It's removed from this folder for good — this can't be undone."
        confirmLabel="Delete file"
        tone="danger"
        onConfirm={handleDelete}
      />
    </ModulePage>
  );
}
