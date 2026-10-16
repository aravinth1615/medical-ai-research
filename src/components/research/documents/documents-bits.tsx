"use client";

import * as React from "react";
import { CircleAlert, CircleCheck, FileText, ImageIcon, Loader, X } from "@/lib/icons";
import { uploadDocumentToFolder } from "@/lib/research/service";
import { fileSize } from "@/lib/research/format";
import { AETHER_ICON_BUTTON } from "@/components/research/ui/primitives";
import { cn } from "@/lib/utils";

/* Pieces shared by the Documents folder grid and the folder page: the icon
   actions, file-drag handling and the per-file upload queue. */

/** Small square icon action (rename, download). */
export const DOC_ICON_BUTTON = AETHER_ICON_BUTTON;

/** The same, for destructive actions. */
export const DOC_DANGER_BUTTON =
  "inline-grid size-7 place-items-center rounded-lg text-gray-400 hover:text-red-300 hover:bg-red-500/10 " +
  "transition-colors disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-3.5";

/** A visible keyboard focus ring for links and buttons on these screens. */
export const DOC_FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

/** Image documents (an ECG strip, a scan) get the image icon; the rest a page. */
export function DocumentIcon({ contentType, className }: { contentType: string | null; className?: string }) {
  return contentType?.startsWith("image/") ? <ImageIcon className={className} /> : <FileText className={className} />;
}

const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

/** The files in a drop — folders dragged in alongside them are skipped. */
function filesFromDrop(e: React.DragEvent): File[] {
  const items = Array.from(e.dataTransfer.items ?? []);
  if (!items.length) return Array.from(e.dataTransfer.files);
  return items
    .filter((item) => item.kind === "file" && !item.webkitGetAsEntry?.()?.isDirectory)
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

/** Drag-and-drop handlers for one drop target. `dragging` stays true while a
 *  file is held over the target or any of its children. */
export function useFileDrop(onFiles: (files: File[]) => void, enabled = true) {
  const [depth, setDepth] = React.useState(0);

  const handlers = {
    onDragEnter(e: React.DragEvent) {
      if (!enabled || !isFileDrag(e)) return;
      e.preventDefault();
      setDepth((d) => d + 1);
    },
    onDragOver(e: React.DragEvent) {
      if (!enabled || !isFileDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave(e: React.DragEvent) {
      if (!enabled || !isFileDrag(e)) return;
      setDepth((d) => Math.max(0, d - 1));
    },
    onDrop(e: React.DragEvent) {
      if (!enabled || !isFileDrag(e)) return;
      e.preventDefault();
      setDepth(0);
      const files = filesFromDrop(e);
      if (files.length) onFiles(files);
    },
  };

  return { dragging: depth > 0, handlers };
}

/* ------------------------------ Upload queue ------------------------------ */

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  contentType: string;
  status: UploadStatus;
  error?: string;
}

let uploadSeq = 0;

/** Uploads files into a folder one at a time, tracking each file's own
 *  progress and error. Finished rows clear themselves after a moment; failed
 *  rows stay until dismissed. Batches dropped while one is running queue up
 *  behind it. */
export function useFolderUploads(folderId: string) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const chain = React.useRef<Promise<void>>(Promise.resolve());

  const patch = React.useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const upload = React.useCallback(
    (files: File[]) => {
      if (!files.length) return;
      const batch = files.map((file) => ({
        file,
        item: {
          id: `up_${++uploadSeq}`,
          name: file.name,
          size: file.size,
          contentType: file.type,
          status: "queued" as UploadStatus,
        },
      }));
      setItems((prev) => [...prev, ...batch.map((b) => b.item)]);

      chain.current = chain.current.then(async () => {
        for (const { file, item } of batch) {
          patch(item.id, { status: "uploading" });
          try {
            await uploadDocumentToFolder(folderId, file);
            patch(item.id, { status: "done" });
            setTimeout(() => dismiss(item.id), 2500);
          } catch (err) {
            patch(item.id, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
          }
        }
      });
    },
    [folderId, patch, dismiss]
  );

  const active = items.filter((i) => i.status === "queued" || i.status === "uploading");
  const finished = items.filter((i) => i.status === "done");
  const failed = items.filter((i) => i.status === "error");
  const clearFailed = React.useCallback(() => setItems((prev) => prev.filter((i) => i.status !== "error")), []);

  return {
    items,
    busy: active.length > 0,
    /** 1-based position of the file uploading now, out of the batch in flight. */
    progress: active.length > 0 ? { current: finished.length + failed.length + 1, total: items.length } : null,
    failed,
    upload,
    dismiss,
    clearFailed,
  };
}

/** One row per file in the queue: name, size, a progress sweep while it
 *  uploads, and its error if it failed. */
export function UploadQueue({
  items,
  onDismiss,
  onClearFailed,
}: {
  items: UploadItem[];
  onDismiss: (id: string) => void;
  onClearFailed: () => void;
}) {
  if (!items.length) return null;
  const failedCount = items.filter((i) => i.status === "error").length;

  return (
    <section
      aria-label="Uploads"
      className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F111A]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-gray-400 uppercase">Uploads</span>
        {failedCount > 1 && (
          <button
            type="button"
            onClick={onClearFailed}
            className={cn("rounded text-[11px] font-medium text-gray-400 hover:text-white", DOC_FOCUS_RING)}
          >
            Clear failed
          </button>
        )}
      </div>
      <ul aria-live="polite" className="divide-y divide-white/[0.05]">
        {items.map((item) => (
          <UploadRow key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
        ))}
      </ul>
    </section>
  );
}

function UploadRow({ item, onDismiss }: { item: UploadItem; onDismiss: () => void }) {
  const status =
    item.status === "queued"
      ? "Waiting…"
      : item.status === "uploading"
        ? "Uploading…"
        : item.status === "done"
          ? "Uploaded"
          : "Failed";

  return (
    <li className="flex items-start gap-3 px-4 py-2.5">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg [&_svg]:size-3.5",
          item.status === "error" ? "bg-red-500/10 text-red-300" : "bg-indigo-500/10 text-indigo-400"
        )}
      >
        <DocumentIcon contentType={item.contentType} />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-100" title={item.name}>
            {item.name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-gray-500 tabular-nums">{fileSize(item.size)}</span>
        </div>
        {item.status === "error" ? (
          <p className="flex items-start gap-1.5 text-[11px] text-red-300">
            <CircleAlert className="mt-px size-3 shrink-0" />
            <span>{item.error}</span>
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/5" aria-hidden>
              {item.status === "done" ? (
                <div className="h-full w-full rounded-full bg-emerald-400" />
              ) : (
                <div
                  className={cn(
                    "h-full w-2/5 rounded-full bg-indigo-400 motion-reduce:animate-none",
                    item.status === "uploading"
                      ? "animate-[research-sweep_1.5s_ease-in-out_infinite]"
                      : "opacity-30"
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 font-mono text-[11px]",
                item.status === "done" ? "text-emerald-300" : "text-indigo-300"
              )}
            >
              {item.status === "uploading" && <Loader className="size-3 animate-spin" />}
              {item.status === "done" && <CircleCheck className="size-3" />}
              {status}
            </span>
          </div>
        )}
      </div>
      {item.status === "error" && (
        <button
          type="button"
          className={cn(DOC_ICON_BUTTON, "-mr-1.5", DOC_FOCUS_RING)}
          title="Dismiss"
          aria-label={`Dismiss the failed upload of ${item.name}`}
          onClick={onDismiss}
        >
          <X />
        </button>
      )}
    </li>
  );
}
