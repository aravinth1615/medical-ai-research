"use client";

import * as React from "react";
import {
  BookOpen,
  CircleAlert,
  FileText,
  Globe,
  Hash,
  Library,
  Loader,
  Lock,
  Paperclip,
  Plus,
  Send,
  Wand,
  X,
} from "@/lib/icons";
import { extractHashtags } from "@/lib/research/format";
import { cn } from "@/lib/utils";
import { inputClass, toolbarButton } from "@/components/research/ui/primitives";
import { HashtagsDialog } from "./hashtags-dialog";

export type Upload = { key: string; title: string; status: "uploading" | "done" | "error"; error?: string };

const chip = "flex max-w-full items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg border text-xs";
const chipOk = "bg-[#0D0F17] border-white/10 text-gray-200";
const chipError = "bg-red-500/10 border-red-500/30 text-red-300";
const chipRemove = "p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

function AttachmentChip({ item, icon, onRemove }: { item: Upload; icon: React.ReactNode; onRemove: () => void }) {
  return (
    <div className={cn(chip, item.status === "error" ? chipError : chipOk)}>
      {item.status === "uploading" ? (
        <Loader className="size-3.5 shrink-0 animate-spin text-indigo-400" />
      ) : item.status === "error" ? (
        <CircleAlert className="size-3.5 shrink-0 text-red-400" />
      ) : (
        icon
      )}
      <span className="max-w-[260px] truncate font-mono text-[11px]" title={item.error}>
        {item.status === "error" ? `${item.title} — ${item.error}` : item.title}
      </span>
      <button type="button" aria-label={`Remove ${item.title}`} onClick={onRemove} className={chipRemove}>
        <X className="size-3" />
      </button>
    </div>
  );
}

/** The floating chat box: attachments, the prompt, and run controls.
 *  `centered` lays it out in the flow (the normal view, where the chat box
 *  is the whole page) instead of floating over the workspace's bottom edge;
 *  `shift` then nudges it onto the window's centre. */
export function ComposerDock({
  ref,
  centered,
  shift,
  submitError,
  libraryPrompt,
  onViewLibraryPrompt,
  onRemoveLibraryPrompt,
  sources,
  onRemoveSource,
  files,
  onRemoveFile,
  reports,
  onRemoveReport,
  showAddSource,
  onToggleAddSource,
  sourceUrlDraft,
  onSourceUrlDraftChange,
  sourceTitleDraft,
  onSourceTitleDraftChange,
  sourceError,
  onAddSource,
  hashtags,
  onHashtagsChange,
  textareaRef,
  prompt,
  onPromptChange,
  onPromptKeyDown,
  placeholder,
  locked,
  researchPrompt,
  onAttach,
  onAddReport,
  onOpenLibrary,
  modelCount,
  estimate,
  canRun,
  submitting,
  onRun,
}: {
  ref?: React.Ref<HTMLDivElement>;
  centered: boolean;
  shift?: { x: number; y: number };
  submitError: string | null;
  libraryPrompt: { title: string } | null;
  onViewLibraryPrompt: () => void;
  onRemoveLibraryPrompt: () => void;
  sources: { title: string; url: string }[];
  onRemoveSource: (url: string) => void;
  files: Upload[];
  onRemoveFile: (key: string) => void;
  reports: Upload[];
  onRemoveReport: (key: string) => void;
  showAddSource: boolean;
  onToggleAddSource: () => void;
  sourceUrlDraft: string;
  onSourceUrlDraftChange: (value: string) => void;
  sourceTitleDraft: string;
  onSourceTitleDraftChange: (value: string) => void;
  sourceError: string | null;
  onAddSource: () => void;
  hashtags: string[];
  onHashtagsChange: (tags: string[]) => void;
  textareaRef: React.Ref<HTMLTextAreaElement>;
  prompt: string;
  onPromptChange: (value: string) => void;
  onPromptKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  locked: boolean;
  researchPrompt: string;
  onAttach: () => void;
  onAddReport: () => void;
  onOpenLibrary: () => void;
  modelCount: number;
  estimate: { time: string; cost: string } | null;
  canRun: boolean;
  submitting: boolean;
  onRun: () => void;
}) {
  const hasChips = !!libraryPrompt || sources.length > 0 || files.length > 0 || reports.length > 0;
  const [hashtagsOpen, setHashtagsOpen] = React.useState(false);
  const inlineTags = React.useMemo(() => extractHashtags(researchPrompt), [researchPrompt]);

  const onSourceKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddSource();
    }
  };

  return (
    <div
      ref={ref}
      style={centered && shift ? { left: shift.x, top: shift.y } : undefined}
      className={
        centered
          ? "relative z-20 px-3 md:px-5"
          : "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t/srgb from-[#090A0F] via-[#090A0F]/90 to-transparent p-3 md:p-5"
      }
    >
      <div className="pointer-events-auto mx-auto max-w-4xl">
        {submitError && (
          <div role="alert" className="mb-2 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 backdrop-blur-md">
            <CircleAlert className="mt-px size-4 shrink-0 text-red-400" />
            <span className="min-w-0 leading-relaxed">{submitError}</span>
          </div>
        )}

        <HashtagsDialog open={hashtagsOpen} onOpenChange={setHashtagsOpen} hashtags={hashtags} onChange={onHashtagsChange} locked={locked} />

        <div className="@container overflow-hidden rounded-2xl border border-white/[0.1] bg-[#161923]/95 shadow-[0_20px_50px_rgba(0,0,0,0.75)] backdrop-blur-xl transition-colors focus-within:border-indigo-500/60">
          {hasChips && (
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto border-b border-white/[0.06] px-3.5 pt-3 pb-1">
              {libraryPrompt && (
                <div className={cn(chip, chipOk)}>
                  <Library className="size-3.5 shrink-0 text-indigo-400" />
                  <button
                    type="button"
                    title={`View prompt: ${libraryPrompt.title}`}
                    onClick={onViewLibraryPrompt}
                    className="max-w-[200px] truncate text-left font-mono text-[11px] transition-colors hover:text-white"
                  >
                    {libraryPrompt.title}
                  </button>
                  <button type="button" aria-label={`Remove ${libraryPrompt.title}`} disabled={locked} onClick={onRemoveLibraryPrompt} className={chipRemove}>
                    <X className="size-3" />
                  </button>
                </div>
              )}
              {sources.map((s) => (
                <div key={s.url} className={cn(chip, chipOk)} title={s.url}>
                  <Globe className="size-3.5 shrink-0 text-sky-400" />
                  <span className="max-w-[160px] truncate font-mono text-[11px]">{s.title}</span>
                  <button type="button" aria-label={`Remove ${s.title}`} onClick={() => onRemoveSource(s.url)} className={chipRemove}>
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {files.map((f) => (
                <AttachmentChip key={f.key} item={f} icon={<FileText className="size-3.5 shrink-0 text-indigo-400" />} onRemove={() => onRemoveFile(f.key)} />
              ))}
              {reports.map((r) => (
                <AttachmentChip key={r.key} item={r} icon={<BookOpen className="size-3.5 shrink-0 text-indigo-400" />} onRemove={() => onRemoveReport(r.key)} />
              ))}
            </div>
          )}

          {showAddSource && (
            <div className="space-y-1.5 border-b border-white/[0.06] px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Globe className="size-3.5 shrink-0 text-sky-400" />
                <input
                  value={sourceUrlDraft}
                  onChange={(e) => onSourceUrlDraftChange(e.target.value)}
                  onKeyDown={onSourceKey}
                  aria-label="Source URL"
                  placeholder="https://www.ahajournals.org/doi/…"
                  className={cn(inputClass, "w-auto min-w-0 flex-1 basis-56 font-mono")}
                />
                <input
                  value={sourceTitleDraft}
                  onChange={(e) => onSourceTitleDraftChange(e.target.value)}
                  onKeyDown={onSourceKey}
                  aria-label="Source title"
                  placeholder="Title (optional)"
                  className={cn(inputClass, "w-auto min-w-0 flex-1 basis-40")}
                />
                <button
                  type="button"
                  onClick={onAddSource}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#141722] px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-[#1B1F2E]"
                >
                  <Plus className="size-3.5 text-indigo-400" />
                  Add
                </button>
                <button type="button" onClick={onToggleAddSource} aria-label="Close add source" className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white">
                  <X className="size-3.5" />
                </button>
              </div>
              {sourceError && <p className="pl-5.5 text-[11px] text-red-300">{sourceError}</p>}
            </div>
          )}

          <div className="space-y-2 px-4 pt-3 pb-3.5">
            <textarea
              ref={textareaRef}
              rows={2}
              value={prompt}
              readOnly={locked}
              aria-readonly={locked}
              aria-label="Research prompt"
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={onPromptKeyDown}
              placeholder={placeholder}
              className={cn(
                "field-sizing-content block max-h-48 min-h-[47px] w-full resize-none bg-transparent text-[14.5px] leading-relaxed text-gray-100 placeholder:text-gray-500 focus:outline-none",
                locked && "cursor-not-allowed text-gray-400"
              )}
            />
            {inlineTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-gray-500">Hashtags</span>
                {inlineTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-iris-well px-2 py-0.5 text-[11px] text-iris-soft">
                    #{tag}
                  </span>
                ))}
                <span className="text-[11px] text-gray-500">saved with this report</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] bg-[#11131B]/90 px-3 py-2">
            <div className="flex min-w-0 items-center gap-1 @min-[440px]:gap-1.5">
              <button
                type="button"
                onClick={onAttach}
                aria-label="Attach files"
                title="Attach files — PDF, Word or text, up to 50 MB each. Attached files are filed under Preference → Document."
                className={toolbarButton}
              >
                <Paperclip className="size-3.5 text-gray-400" />
                <span className="hidden @min-[600px]:inline">Attach</span>
              </button>
              <button
                type="button"
                onClick={onToggleAddSource}
                aria-label="Add source URL"
                aria-expanded={showAddSource}
                title="Add a source URL for every model to consider"
                className={cn(toolbarButton, showAddSource && "bg-white/[0.06] text-white")}
              >
                <Globe className="size-3.5 text-sky-400" />
                <span className="hidden @min-[850px]:inline">Source</span>
              </button>
              <button type="button" onClick={onAddReport} aria-label="Add report" title="Attach an earlier report as context" className={toolbarButton}>
                <FileText className="size-3.5 text-indigo-400" />
                <span className="hidden @min-[850px]:inline">Report</span>
              </button>
              <button
                type="button"
                onClick={onOpenLibrary}
                disabled={locked}
                aria-label="Prompt library"
                title="Attach a prompt from the library"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs whitespace-nowrap transition-colors @min-[440px]:px-2.5",
                  locked ? "cursor-not-allowed text-gray-600" : "text-indigo-300 hover:bg-indigo-500/15"
                )}
              >
                <Wand className="size-3.5" />
                <span className="hidden @min-[760px]:inline">Prompt library</span>
              </button>
              <button
                type="button"
                onClick={() => setHashtagsOpen(true)}
                aria-label={hashtags.length ? `Hashtags (${hashtags.length})` : "Add hashtags"}
                aria-haspopup="dialog"
                title={hashtags.length ? `Hashtags: ${hashtags.map((t) => `#${t}`).join(" ")}` : "Add hashtags — saved with the report"}
                className={cn(toolbarButton, hashtags.length > 0 && "text-indigo-200")}
              >
                <Hash className="size-3.5 text-indigo-400" />
                {hashtags.length > 0 && (
                  <span className="h-4 min-w-4 rounded-full border border-indigo-500/40 bg-indigo-500/25 px-1 text-center font-mono text-[10px] leading-[14px] text-indigo-200 tabular-nums">
                    {hashtags.length}
                  </span>
                )}
              </button>
              {locked && (
                <span
                  className="hidden items-center gap-1 rounded border border-indigo-500/30 bg-indigo-500/15 px-1.5 py-1 font-mono text-[10px] leading-none whitespace-nowrap text-indigo-300 @min-[300px]:inline-flex"
                  title="The prompt can be edited again once this run finishes"
                >
                  <Lock className="size-3" />
                  <span className="hidden @min-[1040px]:inline">Locked while running</span>
                </span>
              )}
              {!locked && researchPrompt.length > 0 && (
                <span className="hidden pl-1 font-mono text-[11px] whitespace-nowrap text-gray-500 tabular-nums @min-[880px]:inline">
                  {researchPrompt.length} chars
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden font-mono text-[11px] whitespace-nowrap text-gray-500 @min-[530px]:inline">
                {modelCount} model{modelCount === 1 ? "" : "s"} armed
                {estimate && (
                  <>
                    <span className="hidden @min-[880px]:inline"> · ~{estimate.time}</span>
                    <span className="hidden @min-[700px]:inline"> · ~${estimate.cost}/run</span>
                  </>
                )}
              </span>
              <button
                type="button"
                disabled={!canRun}
                onClick={onRun}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors active:scale-[0.97] @min-[400px]:px-4",
                  canRun ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500" : "cursor-not-allowed bg-white/5 text-gray-500"
                )}
              >
                {submitting ? (
                  <>
                    <Loader className="size-3.5 animate-spin" />
                    <span>Running…</span>
                  </>
                ) : (
                  <>
                    <span>
                      Run<span className="sr-only @min-[400px]:not-sr-only"> research</span> ({modelCount})
                    </span>
                    <Send className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
