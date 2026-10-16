"use client";

import * as React from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FileText,
  Globe,
  Hash,
  Loader,
  Maximize,
  Minimize,
  Paperclip,
  Plus,
  Refresh,
  Sparkles,
  X,
} from "@/lib/icons";
import { createSourceFromReport, uploadSourceFile } from "@/lib/research/service";
import { relativeTime, shortDate } from "@/lib/research/format";
import type { QueuedSuggestion, ReportAttachmentInput, ReportNoteRead, ReportRead, ResearchModel } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { ProviderLogoMark, inputClass, toolbarButton } from "@/components/research/ui/primitives";
import { HashtagsDialog } from "@/components/research/new/hashtags-dialog";
import { ReportPickerDialog } from "@/components/research/new/report-picker-dialog";

/** Same cap the backend puts on a run's custom prompt. */
export const MAX_PROMPT_CHARS = 8000;

/** The same per-file limit as New Research's Attach. */
const MAX_UPLOAD_MB = 50;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** A file or earlier report being attached — turned into a source up front,
 *  so the run only has to reference its id. */
type Upload = {
  key: string;
  title: string;
  status: "uploading" | "done" | "error";
  sourceId?: string;
  reportId?: string;
  error?: string;
};

/** "min" folds the box to its heading bar; "max" gives the instructions
 *  most of the window. */
export type ComposerSize = "min" | "normal" | "max";

export interface RerunOptions {
  customPrompt: string;
  modelIds: string[];
  noteIds: string[];
  attachments: ReportAttachmentInput[];
  hashtags: string[];
}

const chip = "flex shrink-0 items-center gap-2 rounded-lg border py-1 pr-1.5 pl-2 text-xs";
const chipOk = "border-white/10 bg-[#0D0F17] text-gray-200";
const chipError = "border-red-500/30 bg-red-500/10 text-red-300";
const chipRemove =
  "rounded p-0.5 text-gray-400 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

const headerButton =
  "rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * The report page's "ask more" box (oneplace's rerun composer): the report's
 * notes log, the instructions for the next run, the models to run it on and
 * the New Research toolbar — Attach, Source, Report, Hashtag and Save as
 * note. Whatever is typed goes to every model for that one run only (the
 * report's own question never changes), together with any notes ticked in
 * the log. Attachments and hashtags stay with the report afterwards.
 *
 * The instructions text is owned by the page, so a model card's contested
 * claims can be added to it.
 */
export function RerunComposer({
  reportId,
  models,
  currentModelIds,
  notes,
  onDeleteNote,
  queued,
  removingQueuedId,
  onRemoveQueued,
  prompt,
  onPromptChange,
  onAddNote,
  busy,
  onRun,
  textareaRef,
  size,
  onSizeChange,
}: {
  /** This report — left out of its own "Report" picker. */
  reportId: string;
  /** Every pickable model, or null while still loading. */
  models: ResearchModel[] | null;
  /** The models the report runs on now — the default pick. */
  currentModelIds: string[];
  /** Every saved note, newest first, or null while loading. */
  notes: ReportNoteRead[] | null;
  onDeleteNote: (noteId: string) => void;
  /** Gaps queued from Suggested next steps — they go with the next run on
   *  their own, so they alone are enough to run. */
  queued: QueuedSuggestion[];
  removingQueuedId: string | null;
  onRemoveQueued: (id: string) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  /** Resolves true once the note is saved. */
  onAddNote: (content: string) => Promise<boolean>;
  /** A run is starting or in progress. */
  busy: boolean;
  /** Resolves true once the run has started. */
  onRun: (options: RerunOptions) => Promise<boolean>;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  /** Owned by the page, so "Rerun with criteria" can unfold the box. */
  size: ComposerSize;
  onSizeChange: (size: ComposerSize) => void;
}) {
  const [picked, setPicked] = React.useState<string[]>(currentModelIds);
  const [pickedNotes, setPickedNotes] = React.useState<string[]>([]);
  const [notesExpanded, setNotesExpanded] = React.useState(false);
  const [queuedExpanded, setQueuedExpanded] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);
  const [files, setFiles] = React.useState<Upload[]>([]);
  const [reports, setReports] = React.useState<Upload[]>([]);
  const [sources, setSources] = React.useState<{ title: string; url: string }[]>([]);
  const [showAddSource, setShowAddSource] = React.useState(false);
  const [sourceUrlDraft, setSourceUrlDraft] = React.useState("");
  const [sourceTitleDraft, setSourceTitleDraft] = React.useState("");
  const [sourceError, setSourceError] = React.useState<string | null>(null);
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [showHashtags, setShowHashtags] = React.useState(false);
  const [reportPickerOpen, setReportPickerOpen] = React.useState(false);
  // > 0 while files are dragged over the box — a counter, so crossing child
  // elements doesn't flicker the highlight.
  const [dragDepth, setDragDepth] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // A deleted note can't stay picked.
  const selectedNoteIds = pickedNotes.filter((id) => notes?.some((n) => n.id === id));
  const trimmed = prompt.trim();
  const readyFiles = files.filter((f) => f.status === "done" && f.sourceId);
  const readyReports = reports.filter((r) => r.status === "done" && r.sourceId);
  const attachmentCount = sources.length + readyFiles.length + readyReports.length;
  // A run waits for every upload in flight, so nothing attached is silently
  // left out.
  const uploading = files.some((f) => f.status === "uploading") || reports.some((r) => r.status === "uploading");
  const modelsChanged = picked.length !== currentModelIds.length || picked.some((id) => !currentModelIds.includes(id));
  const hasSomethingNew =
    trimmed.length > 0 || queued.length > 0 || selectedNoteIds.length > 0 || attachmentCount > 0 || hashtags.length > 0 || modelsChanged;
  const canRun = !busy && !uploading && picked.length > 0 && hasSomethingNew;
  const minimized = size === "min";
  const maximized = size === "max";
  // Maximized, every note shows in full.
  const showNotesInFull = notesExpanded || maximized;
  const showQueuedInFull = queuedExpanded || maximized;

  const toggleModel = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleNote = (id: string) => setPickedNotes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function handleRun() {
    if (!canRun) return;
    const started = await onRun({
      customPrompt: trimmed,
      modelIds: picked,
      noteIds: selectedNoteIds,
      attachments: [
        ...sources.map((s) => ({ title: s.title, url: s.url })),
        ...readyFiles.map((f) => ({ title: f.title, source_id: f.sourceId })),
        ...readyReports.map((r) => ({ title: r.title, source_id: r.sourceId })),
      ],
      hashtags,
    });
    if (!started) return;
    onPromptChange("");
    setPickedNotes([]);
    setFiles([]);
    setReports([]);
    setSources([]);
    setHashtags([]);
    setShowAddSource(false);
  }

  /** Each picked or dropped file uploads at once; one over the limit (or
   *  empty) is listed with the reason instead. */
  function addFiles(list: File[]) {
    for (const file of list) {
      const key = `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`;
      const refusal =
        file.size > MAX_UPLOAD_BYTES ? `larger than ${MAX_UPLOAD_MB} MB` : file.size === 0 ? "the file is empty" : null;
      if (refusal) {
        setFiles((prev) => [...prev, { key, title: file.name, status: "error", error: refusal }]);
        continue;
      }
      setFiles((prev) => [...prev, { key, title: file.name, status: "uploading" }]);
      uploadSourceFile(file)
        .then((up) =>
          setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, status: "done", sourceId: up.id, title: up.title } : f)))
        )
        .catch((err: unknown) =>
          setFiles((prev) =>
            prev.map((f) =>
              f.key === key
                ? {
                    ...f,
                    status: "error",
                    error: err instanceof Error ? err.message : "Upload failed",
                  }
                : f
            )
          )
        );
    }
  }

  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  function handleDrop(e: React.DragEvent) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setDragDepth(0);
    // Read now — the browser empties dataTransfer once this returns. A
    // dropped folder isn't a file, so it's skipped.
    const items = Array.from(e.dataTransfer.items ?? []);
    const dropped = items.length
      ? items
          .filter((item) => item.kind === "file" && !item.webkitGetAsEntry?.()?.isDirectory)
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
      : Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }

  function handleReportsPicked(list: ReportRead[]) {
    for (const r of list) {
      setReports((prev) => [...prev, { key: r.id, reportId: r.id, title: r.title, status: "uploading" }]);
      createSourceFromReport(r.id)
        .then((source) =>
          setReports((prev) => prev.map((x) => (x.key === r.id ? { ...x, status: "done", sourceId: source.id } : x)))
        )
        .catch((err: unknown) =>
          setReports((prev) =>
            prev.map((x) =>
              x.key === r.id
                ? {
                    ...x,
                    status: "error",
                    error: err instanceof Error ? err.message : "Couldn't attach that report.",
                  }
                : x
            )
          )
        );
    }
  }

  function handleAddSource() {
    const url = sourceUrlDraft.trim();
    if (!url) return setSourceError("Enter a URL to add.");
    try {
      new URL(url);
    } catch {
      return setSourceError("That doesn't look like a valid URL — include https://.");
    }
    if (sources.some((s) => s.url === url)) return setSourceError("That source is already added.");
    setSources((prev) => [...prev, { title: sourceTitleDraft.trim() || url, url }]);
    setSourceUrlDraft("");
    setSourceTitleDraft("");
    setSourceError(null);
  }

  /** Saves what's typed as a reusable note, then clears it. */
  async function handleAddNote() {
    if (!trimmed || savingNote) return;
    setSavingNote(true);
    const added = await onAddNote(trimmed);
    setSavingNote(false);
    if (added) onPromptChange("");
  }

  const sending = [
    trimmed && "your instructions",
    attachmentCount > 0 && plural(attachmentCount, "attachment"),
    hashtags.length > 0 && plural(hashtags.length, "hashtag"),
    selectedNoteIds.length > 0 && plural(selectedNoteIds.length, "note"),
    queued.length > 0 && plural(queued.length, "queued suggestion"),
  ].filter(Boolean);

  const sourceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAddSource();
    }
  };

  return (
    <section
      aria-labelledby="rerun-composer-title"
      onDragEnter={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        setDragDepth((d) => d + 1);
      }}
      onDragOver={(e) => {
        if (!isFileDrag(e)) return;
        // Without this the browser opens the dropped file in the tab.
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (isFileDrag(e)) setDragDepth((d) => Math.max(0, d - 1));
      }}
      onDrop={handleDrop}
      onKeyDown={(e) => {
        if (e.key === "Escape" && maximized) {
          e.stopPropagation();
          onSizeChange("normal");
        }
      }}
      className={cn(
        // A raised surface over the report — lighter than the cards beneath,
        // an indigo edge and a shadow cast both ways — so it reads as the
        // place to act. Focus brightens the edge.
        "@container relative overflow-hidden rounded-2xl border border-indigo-400/25 bg-[#191D2B] shadow-[0_-16px_44px_-12px_rgba(0,0,0,0.9),0_24px_60px_-10px_rgba(0,0,0,0.85)] ring-1 ring-black/40 transition-[border-color,box-shadow] focus-within:border-indigo-400/60 focus-within:ring-4 focus-within:ring-indigo-500/15",
        dragDepth > 0 && "border-indigo-400/70"
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-linear-to-r from-indigo-500 via-sky-400/80 to-indigo-500/0"
      />
      <ReportPickerDialog
        open={reportPickerOpen}
        onOpenChange={setReportPickerOpen}
        excludeIds={[reportId, ...reports.map((r) => r.reportId!)]}
        onConfirm={handleReportsPicked}
      />
      <HashtagsDialog
        open={showHashtags}
        onOpenChange={setShowHashtags}
        hashtags={hashtags}
        onChange={setHashtags}
        locked={busy}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []);
          e.target.value = "";
          addFiles(list);
        }}
      />
      {dragDepth > 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#090A0F]/80 text-center">
          <Paperclip className="size-5 text-indigo-300" />
          <div className="text-sm font-semibold text-indigo-200">Drop files to attach</div>
          <div className="font-mono text-[11px] text-indigo-300/80">
            PDF, Word (.docx) or text · up to {MAX_UPLOAD_MB} MB each
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex items-center gap-2 bg-indigo-500/[0.07] py-1.5 pr-2 pl-4",
          !minimized && "border-b border-white/[0.07]"
        )}
      >
        <Refresh className={cn("size-3.5 shrink-0 text-indigo-400", busy && "animate-spin")} />
        {/* Folded, the whole heading unfolds the box. */}
        {minimized ? (
          <button
            type="button"
            onClick={() => onSizeChange("normal")}
            aria-expanded={false}
            aria-controls="rerun-composer-body"
            className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
          >
            <h3 id="rerun-composer-title" className="shrink-0 text-xs font-semibold text-white">
              Rerun Report with Added Criteria
            </h3>
            <span className="hidden min-w-0 truncate font-mono text-[11px] text-gray-500 @min-[560px]:inline">
              {[
                plural(picked.length, "model"),
                selectedNoteIds.length > 0 && `${plural(selectedNoteIds.length, "note")} in run`,
                trimmed && "draft instructions",
                queued.length > 0 && `${queued.length} queued`,
                attachmentCount > 0 && plural(attachmentCount, "attachment"),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </button>
        ) : (
          <h3 id="rerun-composer-title" className="min-w-0 flex-1 truncate py-1 text-xs font-semibold text-white">
            Rerun Report with Added Criteria
          </h3>
        )}
        <span className="hidden shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 @min-[440px]:inline">
          Refine &amp; Resynthesize
        </span>
        <div className="flex shrink-0 items-center gap-0.5 border-l border-white/[0.08] pl-1.5">
          <button
            type="button"
            onClick={() => onSizeChange(minimized ? "normal" : "min")}
            aria-label={minimized ? "Restore the re-run box" : "Minimize the re-run box"}
            title={minimized ? "Restore" : "Minimize"}
            className={headerButton}
          >
            {minimized ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => onSizeChange(maximized ? "normal" : "max")}
            aria-label={maximized ? "Restore the re-run box" : "Maximize the re-run box"}
            aria-pressed={maximized}
            title={maximized ? "Restore (Esc)" : "Maximize"}
            className={cn(headerButton, maximized && "bg-indigo-500/15 text-indigo-200")}
          >
            {maximized ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
          </button>
        </div>
      </div>

      {!minimized && (
        <div id="rerun-composer-body">
          {/* Attachments for this run: URLs, files and earlier reports. */}
          {(sources.length > 0 || files.length > 0 || reports.length > 0) && (
            <ul className="no-scrollbar flex gap-2 overflow-x-auto border-b border-white/[0.06] px-3.5 py-2">
              {sources.map((s) => (
                <li key={s.url} className={cn(chip, chipOk)} title={s.url}>
                  <Globe className="size-3.5 shrink-0 text-sky-400" />
                  <span className="max-w-[160px] truncate font-mono text-[11px]">{s.title}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${s.title}`}
                    onClick={() => setSources((prev) => prev.filter((x) => x.url !== s.url))}
                    className={chipRemove}
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
              {[
                ...files.map((f) => ({ ...f, kind: "file" as const })),
                ...reports.map((r) => ({ ...r, kind: "report" as const })),
              ].map((a) => (
                <li key={a.key} className={cn(chip, a.status === "error" ? chipError : chipOk)}>
                  {a.status === "uploading" ? (
                    <Loader className="size-3.5 shrink-0 animate-spin text-indigo-400" />
                  ) : a.status === "error" ? (
                    <CircleAlert className="size-3.5 shrink-0 text-red-400" />
                  ) : a.kind === "file" ? (
                    <FileText className="size-3.5 shrink-0 text-indigo-400" />
                  ) : (
                    <BookOpen className="size-3.5 shrink-0 text-indigo-400" />
                  )}
                  <span className="max-w-[240px] truncate font-mono text-[11px]" title={a.error ?? a.title}>
                    {a.status === "error" ? `${a.title} — ${a.error}` : a.title}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${a.title}`}
                    onClick={() =>
                      a.kind === "file"
                        ? setFiles((prev) => prev.filter((f) => f.key !== a.key))
                        : setReports((prev) => prev.filter((r) => r.key !== a.key))
                    }
                    className={chipRemove}
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showAddSource && (
            <div className="space-y-1.5 border-b border-white/[0.06] px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Globe className="size-3.5 shrink-0 text-sky-400" />
                <input
                  value={sourceUrlDraft}
                  onChange={(e) => setSourceUrlDraft(e.target.value)}
                  onKeyDown={sourceKeyDown}
                  aria-label="Source URL"
                  autoFocus
                  placeholder="https://www.ahajournals.org/…"
                  className={cn(inputClass, "w-auto min-w-0 flex-1 basis-56 font-mono")}
                />
                <input
                  value={sourceTitleDraft}
                  onChange={(e) => setSourceTitleDraft(e.target.value)}
                  onKeyDown={sourceKeyDown}
                  aria-label="Source title"
                  placeholder="Title (optional)"
                  className={cn(inputClass, "w-auto min-w-0 flex-1 basis-40")}
                />
                <button
                  type="button"
                  onClick={handleAddSource}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#141722] px-3 py-1.5 text-xs font-medium text-gray-200 transition-all hover:bg-[#1B1F2E]"
                >
                  <Plus className="size-3.5 text-indigo-400" />
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddSource(false)}
                  aria-label="Close add source"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              {sourceError && <p className="pl-5.5 text-[11px] text-red-300">{sourceError}</p>}
            </div>
          )}

          {/* Gaps queued from Suggested next steps: a chip each — More shows
              what each asks for, ✕ takes it back out of the next run. */}
          {queued.length > 0 && (
            <div className="flex items-start gap-2.5 border-b border-white/[0.06] px-3.5 py-2">
              <div className="flex shrink-0 items-center gap-1.5 pt-1 font-mono text-[10px] tracking-wider text-gray-400 uppercase">
                <Sparkles className="size-3 text-amber-400" />
                <span className="hidden @min-[520px]:inline">Queued from suggestions</span>
                <span className="@min-[520px]:hidden">Queued</span>({queued.length})
              </div>
              <ul
                className={cn(
                  "flex min-w-0 flex-1 gap-2",
                  showQueuedInFull ? "max-h-48 flex-wrap overflow-y-auto" : "no-scrollbar overflow-x-auto"
                )}
              >
                {queued.map((g) => {
                  const removing = removingQueuedId === g.id;
                  return (
                    <li
                      key={g.id}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] py-1 pr-1 pl-2 text-xs text-gray-200",
                        showQueuedInFull ? "max-w-full" : "shrink-0",
                        removing && "opacity-60"
                      )}
                    >
                      <Sparkles className="mt-px size-3.5 shrink-0 text-amber-400" />
                      <span className="min-w-0" title={showQueuedInFull ? undefined : `${g.title}\n\n${g.description}`}>
                        <span
                          className={cn(
                            "block font-mono text-[11px]",
                            showQueuedInFull ? "break-words whitespace-normal text-gray-100" : "max-w-[260px] truncate"
                          )}
                        >
                          {g.title}
                        </span>
                        {showQueuedInFull && (
                          <span className="mt-0.5 block text-[11px] leading-relaxed break-words whitespace-normal text-gray-400">
                            {g.description}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={removingQueuedId != null}
                        onClick={() => onRemoveQueued(g.id)}
                        aria-label={`Remove “${g.title}” from the next run`}
                        title="Remove from the next run"
                        className="shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                      >
                        {removing ? <Loader className="size-3 animate-spin" /> : <X className="size-3" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {!maximized && (
                <button
                  type="button"
                  onClick={() => setQueuedExpanded((v) => !v)}
                  aria-expanded={queuedExpanded}
                  aria-label={queuedExpanded ? "Show less of the queued suggestions" : "View the queued suggestions in full"}
                  className="shrink-0 pt-1 font-mono text-[10px] tracking-wider text-indigo-400 uppercase hover:text-indigo-300"
                >
                  {queuedExpanded ? "Less" : "More"}
                </button>
              )}
            </div>
          )}

          {/* The notes log: each saved note is a chip — tick it to include it in
          the next run, ✕ to delete it. New ones come from "Save as note". */}
          <div id="report-notes" className="flex scroll-mt-40 items-start gap-2.5 border-b border-white/[0.06] px-3.5 py-2">
            <div className="flex shrink-0 items-center gap-1.5 pt-1 font-mono text-[10px] tracking-wider text-gray-400 uppercase">
              <FileText className="size-3 text-sky-400" />
              <span>
                Notes ({notes?.length ?? 0})
                {selectedNoteIds.length > 0 && <span className="text-indigo-400"> · {selectedNoteIds.length} in run</span>}
              </span>
            </div>
            {notes === null ? (
              <p className="min-w-0 flex-1 pt-0.5 text-[11px] text-gray-500">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="min-w-0 flex-1 pt-0.5 text-[11px] text-gray-500">
                No notes yet — type one below and click Save as note.
              </p>
            ) : (
              <>
                <ul
                  className={cn(
                    "flex min-w-0 flex-1 gap-2",
                    showNotesInFull
                      ? cn("flex-wrap overflow-y-auto", maximized ? "max-h-56" : "max-h-40")
                      : "no-scrollbar overflow-x-auto"
                  )}
                >
                  {notes.map((note) => {
                    const on = selectedNoteIds.includes(note.id);
                    const author = note.created_by?.full_name ?? note.created_by?.email ?? "Unknown author";
                    return (
                      <li
                        key={note.id}
                        className={cn(
                          "flex items-start rounded-lg border text-xs transition-colors",
                          showNotesInFull ? "max-w-full" : "shrink-0",
                          on
                            ? "border-indigo-500/50 bg-indigo-500/15 text-gray-100"
                            : "border-white/10 bg-[#0D0F17] text-gray-300"
                        )}
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          aria-label={`Include in next run: ${note.content}`}
                          title={`${author} · ${shortDate(note.created_at)}\n\n${note.content}`}
                          onClick={() => toggleNote(note.id)}
                          className="flex min-w-0 items-start gap-2 py-1 pr-1 pl-2 text-left"
                        >
                          <span
                            className={cn(
                              "mt-px flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                              on ? "border-indigo-400 bg-indigo-500 text-white" : "border-white/20"
                            )}
                          >
                            {on && <Check className="size-2.5" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={cn(
                                "block font-mono text-[11px]",
                                showNotesInFull ? "break-words whitespace-pre-wrap" : "max-w-[220px] truncate"
                              )}
                            >
                              {note.content}
                            </span>
                            {showNotesInFull && (
                              <span className="mt-0.5 block font-mono text-[10px] text-gray-500">
                                {author} · {relativeTime(note.created_at)}
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Delete note"
                          title="Delete note"
                          className="m-1 shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        >
                          <X className="size-3" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {!maximized && (
                  <button
                    type="button"
                    onClick={() => setNotesExpanded((v) => !v)}
                    aria-expanded={notesExpanded}
                    className="shrink-0 pt-1 font-mono text-[10px] tracking-wider text-indigo-400 uppercase hover:text-indigo-300"
                  >
                    {notesExpanded ? "Less" : "More"}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="px-4 pt-3 pb-3.5">
            <textarea
              ref={textareaRef}
              rows={2}
              value={prompt}
              maxLength={MAX_PROMPT_CHARS}
              onChange={(e) => onPromptChange(e.target.value)}
              aria-label="Instructions for the next run"
              placeholder="e.g., Re-check the Lp(a) recommendation against the new apoB result; weigh the family history of early MI; only use 2024+ guidelines..."
              className={cn(
                "field-sizing-content block w-full resize-none bg-transparent text-[14.5px] leading-relaxed text-gray-100 placeholder:text-gray-500 focus:outline-none",
                maximized ? "max-h-[50vh] min-h-[min(36vh,320px)]" : "max-h-48 min-h-[47px]"
              )}
            />
          </div>

          <div className="space-y-1.5 border-t border-white/[0.06] px-3.5 py-2">
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 font-mono text-[10px] tracking-wider text-gray-500 uppercase">
                Models{" "}
                <span className="text-indigo-400">
                  {picked.length}/{(models ?? []).length}
                </span>
              </div>
              {models === null ? (
                <p className="text-[11px] text-gray-500">Loading models…</p>
              ) : (
                <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                  {models.map((m) => {
                    const on = picked.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggleModel(m.id)}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs whitespace-nowrap transition-all duration-150",
                          on
                            ? "border-indigo-500/50 bg-indigo-500/15 text-gray-100"
                            : "border-white/[0.08] bg-[#141722] text-gray-400 hover:bg-[#1B1F2E] hover:text-gray-200"
                        )}
                      >
                        <ProviderLogoMark provider={m.provider} />
                        <span>{m.name}</span>
                        {on && <Check className="size-3 text-indigo-300" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {picked.length === 0 && <p className="text-[11px] text-red-300">Pick at least one model.</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/[0.06] bg-[#11131B]/90 px-3 py-2">
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto @min-[440px]:basis-56 @min-[440px]:gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach files"
                title={`Attach files — PDF, Word (.docx) or text, up to ${MAX_UPLOAD_MB} MB each`}
                className={toolbarButton}
              >
                <Paperclip className="size-3.5 text-gray-400" />
                <span className="hidden @min-[700px]:inline">Attach</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddSource((v) => !v)}
                aria-label="Add source URL"
                aria-expanded={showAddSource}
                title="Add a source URL for every model to consider"
                className={cn(toolbarButton, showAddSource && "bg-white/[0.06] text-white")}
              >
                <Globe className="size-3.5 text-sky-400" />
                <span className="hidden @min-[700px]:inline">Source</span>
              </button>
              <button
                type="button"
                onClick={() => setReportPickerOpen(true)}
                aria-label="Add report"
                title="Attach an earlier report as context"
                className={toolbarButton}
              >
                <BookOpen className="size-3.5 text-indigo-400" />
                <span className="hidden @min-[700px]:inline">Report</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHashtags(true)}
                aria-label={hashtags.length ? `Hashtags (${hashtags.length})` : "Add hashtags"}
                aria-haspopup="dialog"
                title={hashtags.length ? `Hashtags: ${hashtags.map((t) => `#${t}`).join(" ")}` : "Tag this report"}
                className={cn(toolbarButton, hashtags.length > 0 && "bg-white/[0.06] text-white")}
              >
                <Hash className="size-3.5 text-indigo-300" />
                <span className="hidden @min-[700px]:inline">Hashtag</span>
                {hashtags.length > 0 && (
                  <span className="h-4 min-w-4 rounded-full border border-indigo-500/40 bg-indigo-500/25 px-1 text-center font-mono text-[10px] leading-[14px] text-indigo-200 tabular-nums">
                    {hashtags.length}
                  </span>
                )}
              </button>
              <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-white/[0.08]" />
              <button
                type="button"
                disabled={!trimmed || savingNote}
                onClick={handleAddNote}
                aria-label="Save as note"
                className={toolbarButton}
              >
                {savingNote ? (
                  <Loader className="size-3.5 animate-spin text-gray-400" />
                ) : (
                  <Plus className="size-3.5 text-indigo-400" />
                )}
                <span className="hidden @min-[440px]:inline">{savingNote ? "Saving…" : "Save as note"}</span>
              </button>
              <span className="hidden min-w-0 pl-1 text-[11px] leading-snug text-gray-500 @min-[760px]:inline">
                {uploading
                  ? "Waiting for uploads to finish…"
                  : sending.length > 0
                    ? `Sends ${sending.join(" + ")} to ${plural(picked.length, "model")}.`
                    : modelsChanged
                      ? `Re-runs the report on ${plural(picked.length, "model")}.`
                      : "Type instructions, tick a note or queue a suggested next step to run."}
              </span>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {trimmed.length > 0 && (
                <span className="hidden font-mono text-[11px] whitespace-nowrap text-gray-500 tabular-nums @min-[620px]:inline">
                  {trimmed.length} chars
                </span>
              )}
              <button
                type="button"
                disabled={!canRun}
                onClick={() => void handleRun()}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                  canRun
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
                    : "cursor-not-allowed bg-white/5 text-gray-500"
                )}
              >
                <Refresh className={cn("size-3.5", busy && "animate-spin")} />
                {busy ? (
                  <span>Re-synthesizing…</span>
                ) : (
                  <span>
                    Rerun
                    <span className="sr-only @min-[440px]:not-sr-only"> Analysis</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
