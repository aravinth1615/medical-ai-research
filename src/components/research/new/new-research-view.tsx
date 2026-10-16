"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText } from "@/lib/icons";
import {
  DEPTHS,
  DEPTH_COST_FACTOR,
  DEPTH_HINT,
  fallbackTitle,
  clipTitle,
  depthToApi,
  formatSeconds,
  fromCadenceId,
  researchRoutes,
  type CadenceId,
  type DepthId,
} from "@/lib/research/format";
import {
  attachDocumentsToFolder,
  createReport,
  createSchedule,
  createSourceFromReport,
  defaultModelIds,
  ensureFolder,
  fetchLatestRun,
  fetchModels,
  fetchPromptTemplates,
  fetchReportDetail,
  fetchReportEstimate,
  fetchReports,
  pickableModels,
  runReport,
  uploadSourceFile,
} from "@/lib/research/service";
import type {
  PromptTemplateRead,
  RecurringCadence,
  ReportAttachmentInput,
  ReportRead,
  ReportVersionRead,
  ResearchModel,
  RunModelExecutionRead,
  ReportState,
} from "@/lib/research/types";
import { useComposerStore } from "@/lib/research/composer-store";
import { useToast } from "@/components/ui/toast";
import { NoticeDialog } from "@/components/research/ui/dialog";
import { useResearch } from "@/components/research/ui/use-research";
import { PromptLibraryPickerDialog } from "@/components/research/prompts/prompt-library-picker-dialog";
import { PromptViewDialog } from "@/components/research/prompts/prompt-view-dialog";
import { ASIDE_WIDTH, Aside } from "./aside";
import { ComposerHeader } from "./composer-header";
import { ModelRegistry, type Ensemble } from "./model-registry";
import { ParameterInspector } from "./parameter-inspector";
import { EmptyWorkspace, RecentRuns, WorkspaceIntro } from "./composer-empty";
import { RunTurn, type SubmittedRun } from "./run-turn";
import { ComposerDock, type Upload } from "./composer-dock";
import { ReportPickerDialog } from "./report-picker-dialog";

const MAX_UPLOAD_MB = 50;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
/** How often an in-flight run is re-read. */
const POLL_MS = 1500;
/** Narrowest the centre column may get before a drawer overlays it. */
const MIN_CENTRE_WIDTH = 520;

type FileUpload = Upload & { sourceId?: string; documentId?: string | null };
type ReportUpload = Upload & { reportId: string; sourceId?: string };

interface ActiveRun {
  reportId: string;
  title: string;
  models: ResearchModel[];
  state: ReportState;
  warning: string | null;
  executions: RunModelExecutionRead[] | null;
  version: ReportVersionRead | null;
}

/**
 * New Research — oneplace-v2's multi-model composer. Pick models and depth,
 * ask one clinical question (with files, URLs, earlier reports or a library
 * prompt attached), and watch every model answer before the passes are
 * merged into one cited report. All data is static (lib/research/service).
 */
export function NewResearchView() {
  const router = useRouter();
  const showToast = useToast((s) => s.show);

  /* ------------------------------ Data ------------------------------ */
  const models = useResearch(() => fetchModels(), []);
  const recent = useResearch(() => fetchReports({ limit: 5 }), []);
  const presets = useResearch(() => fetchPromptTemplates({ limit: 4 }), []);
  const pickable = React.useMemo(() => pickableModels(models.data ?? []), [models.data]);

  /* ----------------------------- Inputs ----------------------------- */
  const [prompt, setPrompt] = React.useState("");
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [picked, setPicked] = React.useState<string[] | null>(null);
  const pickedIds = picked ?? defaultModelIds(pickable);
  const [depth, setDepth] = React.useState<DepthId>("standard");
  const [cadence, setCadence] = React.useState<CadenceId>("once");
  const [sources, setSources] = React.useState<{ title: string; url: string }[]>([]);
  const [showAddSource, setShowAddSource] = React.useState(false);
  const [sourceUrlDraft, setSourceUrlDraft] = React.useState("");
  const [sourceTitleDraft, setSourceTitleDraft] = React.useState("");
  const [sourceError, setSourceError] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<FileUpload[]>([]);
  const [reportAttachments, setReportAttachments] = React.useState<ReportUpload[]>([]);
  const [libraryPrompt, setLibraryPrompt] = React.useState<PromptTemplateRead | null>(null);

  /* A question handed over from the AI Gap Analyzer or the prompt library
     lands in the box — taken once, then cleared from the shared store. */
  const handedDraft = useComposerStore((s) => s.draft);
  const [takenDraft, setTakenDraft] = React.useState("");
  if (handedDraft && handedDraft !== takenDraft) {
    setTakenDraft(handedDraft);
    setPrompt(handedDraft);
  }
  React.useEffect(() => {
    if (handedDraft) useComposerStore.getState().setDraft("");
  }, [handedDraft]);

  /* ---------------------------- Dialogs ----------------------------- */
  const [reportPickerOpen, setReportPickerOpen] = React.useState(false);
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [viewingPrompt, setViewingPrompt] = React.useState<PromptTemplateRead | null>(null);
  const [dragDepth, setDragDepth] = React.useState(0);

  /* ------------------------------ Runs ------------------------------ */
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [pendingRun, setPendingRun] = React.useState<{ title: string; models: ResearchModel[] } | null>(null);
  const [activeRun, setActiveRun] = React.useState<ActiveRun | null>(null);
  const [submitted, setSubmitted] = React.useState<SubmittedRun | null>(null);
  const [completed, setCompleted] = React.useState<{ reportId: string; title: string } | null>(null);

  /* --------------------------- Presentation -------------------------- */
  const [view, setView] = React.useState<"minimal" | "advanced">("minimal");
  const minimal = view === "minimal";
  const [introOpen, setIntroOpen] = React.useState(true);
  const [inspectorOpen, setInspectorOpen] = React.useState(false);
  const [registryOpen, setRegistryOpen] = React.useState(true);
  const [rootWidth, setRootWidth] = React.useState<number | null>(null);
  const [dockHeight, setDockHeight] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const dockRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const measuredRef = React.useRef(false);
  const columnRef = React.useRef<HTMLDivElement>(null);
  const topSpacerRef = React.useRef<HTMLDivElement>(null);
  const introRef = React.useRef<HTMLDivElement>(null);
  const [centerShift, setCenterShift] = React.useState({ x: 0, y: 0 });

  /* The page's own width decides whether a drawer pushes the centre column
     aside or overlays it; on first measure a too-narrow page starts with the
     registry closed rather than covering the chat box. */
  React.useEffect(() => {
    const root = rootRef.current;
    const dock = dockRef.current;
    if (!root || !dock) return;
    const ro = new ResizeObserver(() => {
      const width = root.clientWidth;
      if (!measuredRef.current) {
        measuredRef.current = true;
        if (width - ASIDE_WIDTH < MIN_CENTRE_WIDTH) setRegistryOpen(false);
      }
      setRootWidth(width);
      setDockHeight(dock.offsetHeight);
    });
    ro.observe(root);
    ro.observe(dock);
    return () => ro.disconnect();
  }, []);

  const pickedKey = pickedIds.join("|");
  const estimate = useResearch(
    () => fetchReportEstimate(pickedKey ? pickedKey.split("|") : [], depthToApi(depth)),
    [pickedKey, depth]
  );

  /* Watch the run until its merged version is published. Every update is
     set from the timer callback — never synchronously in the effect. */
  const runningId = activeRun?.state === "running" ? activeRun.reportId : null;
  React.useEffect(() => {
    if (!runningId) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const [detail, run] = await Promise.all([fetchReportDetail(runningId), fetchLatestRun(runningId)]);
      if (cancelled) return;
      const state = detail.data?.state ?? "running";
      setActiveRun((prev) =>
        prev && prev.reportId === runningId
          ? {
              ...prev,
              state,
              executions: run.data?.model_executions ?? prev.executions,
              version: detail.data?.current_version ?? prev.version,
            }
          : prev
      );
      if (state !== "running") {
        setSubmitting(false);
        if (state === "ready" || state === "scheduled") {
          setCompleted({ reportId: runningId, title: detail.data?.title ?? "Your report" });
        }
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [runningId, activeRun?.executions]);

  /* ---------------------------- Derived ----------------------------- */
  const chosen = pickable.filter((m) => pickedIds.includes(m.id));
  const researchPrompt = [libraryPrompt?.prompt.trim(), prompt.trim()].filter(Boolean).join("\n\n");
  const canRun = !!researchPrompt && chosen.length > 0 && !submitting;
  const locked = submitting;
  const starting = !activeRun && pendingRun != null;
  const runView: ActiveRun | null =
    activeRun ??
    (pendingRun ? { reportId: "", title: pendingRun.title, models: pendingRun.models, state: "draft", warning: null, executions: null, version: null } : null);

  /* The normal view centres the intro and chat box on the whole window, not
     just the space between the sidebar and the model registry — measured, as
     either panel can open or close. Clamped so the block never leaves the
     column. Offsets are relative positioning, so they don't move the layout
     being measured. */
  const centring = minimal && !runView;
  React.useEffect(() => {
    if (!centring) return;
    const column = columnRef.current;
    const spacer = topSpacerRef.current;
    const dock = dockRef.current;
    if (!column || !spacer || !dock) return;
    const clamp = (v: number, slack: number) => Math.round(Math.max(-slack, Math.min(slack, v)));
    const measure = () => {
      const col = column.getBoundingClientRect();
      const top = spacer.getBoundingClientRect().top;
      const blockWidth = (dock.firstElementChild as HTMLElement | null)?.offsetWidth ?? dock.offsetWidth;
      const blockHeight = (introRef.current?.offsetHeight ?? 0) + dock.offsetHeight;
      const slackX = Math.max(0, (col.width - blockWidth) / 2 - 16);
      const slackY = Math.max(0, (col.bottom - top - blockHeight) / 2 - 16);
      const x = clamp(window.innerWidth / 2 - (col.left + col.width / 2), slackX);
      const y = clamp(window.innerHeight / 2 - (top + col.bottom) / 2, slackY);
      setCenterShift((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(column);
    ro.observe(dock);
    if (introRef.current) ro.observe(introRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [centring, introOpen]);
  const runEnded = runView != null && !starting && runView.state !== "running";

  const ensembles = React.useMemo<Ensemble[]>(() => {
    const byId = new Map(pickable.map((m) => [m.id, m]));
    const seen = new Set<string>();
    const out: Ensemble[] = [];
    for (const r of recent.data?.items ?? []) {
      const set = r.selected_models.map((m) => byId.get(m.id)).filter((m): m is ResearchModel => m != null);
      if (!set.length) continue;
      const key = set.map((m) => m.id).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, name: r.title, subtitle: set.map((m) => m.name).join(" · "), ids: set.map((m) => m.id) });
      if (out.length === 3) break;
    }
    return out;
  }, [pickable, recent.data]);

  /* Drawer layout: in the flow while the centre keeps enough room, otherwise
     sliding over it. Too narrow for two side by side, one closes the other. */
  const width = rootWidth ?? Number.POSITIVE_INFINITY;
  const registryOverlay = width - ASIDE_WIDTH < MIN_CENTRE_WIDTH;
  const inspectorOverlay = width - ASIDE_WIDTH * (registryOpen && !registryOverlay ? 2 : 1) < MIN_CENTRE_WIDTH;
  const drawersSideBySide = width >= ASIDE_WIDTH * 2 + 40;
  const inspectorRight = registryOpen && drawersSideBySide ? ASIDE_WIDTH : 0;

  /* ---------------------------- Handlers ---------------------------- */
  const toggleModel = (id: string) =>
    setPicked(pickedIds.includes(id) ? pickedIds.filter((x) => x !== id) : [...pickedIds, id]);

  function toggleInspector() {
    const next = !inspectorOpen;
    setInspectorOpen(next);
    if (next && !drawersSideBySide) setRegistryOpen(false);
  }

  function toggleRegistry() {
    const next = !registryOpen;
    setRegistryOpen(next);
    if (next && !drawersSideBySide) setInspectorOpen(false);
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

  /* Each file is uploaded right away, so by run time it's already a source.
     A file over the limit (or empty) is listed with the reason instead. */
  function addFiles(list: File[]) {
    for (const file of list) {
      const key = `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`;
      const refusal = file.size > MAX_UPLOAD_BYTES ? `larger than ${MAX_UPLOAD_MB} MB` : file.size === 0 ? "the file is empty" : null;
      if (refusal) {
        setFiles((prev) => [...prev, { key, title: file.name, status: "error", error: refusal }]);
        continue;
      }
      setFiles((prev) => [...prev, { key, title: file.name, status: "uploading" }]);
      uploadSourceFile(file)
        .then((u) =>
          setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, status: "done", sourceId: u.id, title: u.title, documentId: u.documentId } : f)))
        )
        .catch((err: unknown) =>
          setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, status: "error", error: err instanceof Error ? err.message : "Upload failed" } : f)))
        );
    }
  }

  function handleReportsPicked(list: ReportRead[]) {
    for (const report of list) {
      const key = report.id;
      setReportAttachments((prev) => [...prev, { key, reportId: report.id, title: report.title, status: "uploading" }]);
      createSourceFromReport(report.id)
        .then((source) => setReportAttachments((prev) => prev.map((r) => (r.key === key ? { ...r, status: "done", sourceId: source.id } : r))))
        .catch((err: unknown) =>
          setReportAttachments((prev) =>
            prev.map((r) => (r.key === key ? { ...r, status: "error", error: err instanceof Error ? err.message : "Couldn't attach that report." } : r))
          )
        );
    }
  }

  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  async function handleRunResearch() {
    if (!canRun) return;
    const title = fallbackTitle(researchPrompt, libraryPrompt?.title);
    const submittedModels = chosen;
    setSubmitting(true);
    setSubmitError(null);
    setActiveRun(null);
    setSubmitted({
      at: Date.now(),
      prompt: prompt.trim(),
      libraryPrompt: libraryPrompt?.title ?? null,
      sources: sources.map((s) => s.title),
      files: files.filter((f) => f.status === "done").map((f) => f.title),
      reports: reportAttachments.filter((r) => r.status === "done").map((r) => r.title),
    });
    setPendingRun({ title, models: submittedModels });

    const fail = (message: string) => {
      setSubmitError(message);
      setSubmitting(false);
      setPendingRun(null);
    };

    const uploaded = files.filter((f) => f.status === "done" && f.sourceId);
    const attachments: ReportAttachmentInput[] = [
      ...sources.map((s) => ({ title: s.title, url: s.url })),
      ...uploaded.map((f) => ({ title: f.title, source_id: f.sourceId })),
      ...reportAttachments.filter((r) => r.status === "done" && r.sourceId).map((r) => ({ title: r.title, source_id: r.sourceId })),
    ];

    const created = await createReport({
      title: clipTitle(title),
      prompt: researchPrompt,
      model_ids: pickedIds,
      depth: depthToApi(depth),
      cadence: fromCadenceId(cadence),
      attachments: attachments.length ? attachments : undefined,
      hashtags: hashtags.length ? hashtags : undefined,
    });
    if (!created.data) return fail(created.error);

    // Files sent with a run are filed under Documents in a folder named after
    // the report — best effort, never blocks the run.
    const documentIds = uploaded.map((f) => f.documentId).filter((id): id is string => !!id);
    if (documentIds.length) {
      void ensureFolder(created.data.title).then((folder) => folder.data && attachDocumentsToFolder(folder.data.id, documentIds));
    }

    const run = await runReport(created.data.id);
    if (!run.data) return fail(`The report was created, but the run couldn't start: ${run.error}`);

    let warning: string | null = null;
    if (cadence !== "once") {
      const schedule = await createSchedule(created.data.id, fromCadenceId(cadence) as RecurringCadence);
      if (!schedule.data) warning = `The report is running, but the schedule couldn't be set up: ${schedule.error}`;
    }

    setActiveRun({
      reportId: created.data.id,
      title: created.data.title,
      models: submittedModels,
      state: "running",
      warning,
      executions: run.data.model_executions,
      version: null,
    });
    setPendingRun(null);
  }

  function clearWorkspace() {
    setActiveRun(null);
    setPendingRun(null);
    setSubmitted(null);
  }

  function showView(next: "minimal" | "advanced") {
    setView(next);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  const pickLibraryPrompt = (t: PromptTemplateRead) => {
    if (!locked) setLibraryPrompt(t);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const depthMeta = DEPTHS.find((d) => d.id === depth)!;
  const estimateText = estimate.data && chosen.length ? { time: formatSeconds(estimate.data.estimated_time_seconds), cost: estimate.data.estimated_cost_usd.toFixed(2) } : null;
  const estimateLine = (
    <>
      {chosen.length} models
      {estimateText && (
        <>
          {" "}
          · est. {estimateText.time} · ~${estimateText.cost}/run
        </>
      )}
    </>
  );

  const runTurn = runView && (
    <RunTurn submitted={submitted} run={runView} starting={starting} runEnded={runEnded} onToast={(m) => showToast(m)} />
  );

  /* ------------------------------ View ------------------------------ */
  return (
    <div ref={rootRef} className="relative flex h-full overflow-hidden bg-canvas">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-64"
        style={{ background: "radial-gradient(ellipse 60% 45% at 50% -10%, rgba(99, 102, 241, 0.14), transparent)" }}
      />

      <NoticeDialog
        notice={
          completed && {
            tone: "success",
            title: "Research completed",
            message: (
              <>
                <span className="font-medium text-gray-200">{completed.title}</span> is ready — every model has answered
                and been merged into one cited report.
              </>
            ),
            action: { label: "Go to report", onSelect: () => router.push(researchRoutes.report(completed.title, completed.reportId)) },
          }
        }
        onClose={() => setCompleted(null)}
      />
      <ReportPickerDialog
        open={reportPickerOpen}
        onOpenChange={setReportPickerOpen}
        excludeIds={reportAttachments.map((r) => r.reportId)}
        onConfirm={handleReportsPicked}
      />
      <PromptLibraryPickerDialog open={libraryOpen} onOpenChange={setLibraryOpen} onPick={pickLibraryPrompt} />
      <PromptViewDialog template={viewingPrompt} onOpenChange={(open) => !open && setViewingPrompt(null)} />

      <div
        ref={columnRef}
        className="relative z-10 flex min-w-0 flex-1 flex-col"
        onDragEnter={(e) => {
          if (!isFileDrag(e)) return;
          e.preventDefault();
          setDragDepth((d) => d + 1);
        }}
        onDragOver={(e) => {
          if (!isFileDrag(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (isFileDrag(e)) setDragDepth((d) => Math.max(0, d - 1));
        }}
        onDrop={(e) => {
          if (!isFileDrag(e)) return;
          e.preventDefault();
          setDragDepth(0);
          addFiles(Array.from(e.dataTransfer.files));
        }}
      >
        <ComposerHeader
          modelCount={models.loading ? null : pickable.length}
          depth={depth}
          onDepthChange={setDepth}
          chosen={chosen}
          onRemoveModel={toggleModel}
          inspectorOpen={inspectorOpen}
          onToggleInspector={toggleInspector}
          registryOpen={registryOpen}
          onToggleRegistry={toggleRegistry}
          onClear={runEnded ? clearWorkspace : null}
          minimal={minimal}
          onToggleView={() => showView(minimal ? "advanced" : "minimal")}
        />

        {minimal && runView ? (
          <div className="@container flex-1 overflow-y-auto px-4 pt-4 md:px-6" style={{ paddingBottom: Math.max(192, dockHeight + 24) }}>
            {runTurn}
          </div>
        ) : minimal ? (
          <>
            <div ref={topSpacerRef} aria-hidden className="min-h-6 flex-1" />
            {introOpen && (
              <div ref={introRef} className="relative pb-8" style={{ left: centerShift.x, top: centerShift.y }}>
                <WorkspaceIntro activeCount={chosen.length} onClose={() => setIntroOpen(false)} className="w-full" />
              </div>
            )}
          </>
        ) : (
          <div className="@container flex-1 overflow-y-auto px-4 pt-6 md:px-6" style={{ paddingBottom: Math.max(192, dockHeight + 24) }}>
            {runTurn ?? (
              <EmptyWorkspace
                introOpen={introOpen}
                onCloseIntro={() => setIntroOpen(false)}
                loading={models.loading}
                error={models.error}
                onRetry={models.reload}
                chosen={chosen}
                onOpenRegistry={() => !registryOpen && toggleRegistry()}
                presets={presets.data?.items ?? null}
                onPickPreset={pickLibraryPrompt}
                onBrowseLibrary={() => setLibraryOpen(true)}
                libraryDisabled={locked}
              />
            )}
            <RecentRuns loading={recent.loading} recent={recent.data?.items ?? null} className={runView ? "max-w-[1600px]" : "max-w-5xl"} />
          </div>
        )}

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

        <ComposerDock
          ref={dockRef}
          centered={centring}
          shift={centerShift}
          submitError={submitError}
          libraryPrompt={libraryPrompt}
          onViewLibraryPrompt={() => libraryPrompt && setViewingPrompt(libraryPrompt)}
          onRemoveLibraryPrompt={() => setLibraryPrompt(null)}
          sources={sources}
          onRemoveSource={(url) => setSources((prev) => prev.filter((s) => s.url !== url))}
          files={files}
          onRemoveFile={(key) => setFiles((prev) => prev.filter((f) => f.key !== key))}
          reports={reportAttachments}
          onRemoveReport={(key) => setReportAttachments((prev) => prev.filter((r) => r.key !== key))}
          showAddSource={showAddSource}
          onToggleAddSource={() => setShowAddSource((v) => !v)}
          sourceUrlDraft={sourceUrlDraft}
          onSourceUrlDraftChange={setSourceUrlDraft}
          sourceTitleDraft={sourceTitleDraft}
          onSourceTitleDraftChange={setSourceTitleDraft}
          sourceError={sourceError}
          onAddSource={handleAddSource}
          hashtags={hashtags}
          onHashtagsChange={setHashtags}
          textareaRef={textareaRef}
          prompt={prompt}
          onPromptChange={(v) => !locked && setPrompt(v)}
          onPromptKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
            e.preventDefault();
            void handleRunResearch();
          }}
          placeholder={
            libraryPrompt
              ? "Optional — add to the library prompt attached above. Whatever you write here is sent after it."
              : chosen.length
                ? `Ask ${chosen.map((m) => m.name).join(", ")}… (Enter to run, Shift+Enter for newline)`
                : "Pick a model in the registry, then ask your clinical question… (Enter to run, Shift+Enter for newline)"
          }
          locked={locked}
          researchPrompt={researchPrompt}
          onAttach={() => fileInputRef.current?.click()}
          onAddReport={() => setReportPickerOpen(true)}
          onOpenLibrary={() => setLibraryOpen(true)}
          modelCount={chosen.length}
          estimate={estimateText}
          canRun={canRun}
          submitting={submitting}
          onRun={() => void handleRunResearch()}
        />
        {minimal && !runView && <div aria-hidden className="min-h-6 flex-1" />}

        {dragDepth > 0 && (
          <div className="pointer-events-none absolute inset-3 z-40 flex animate-fade-in flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-500/70 bg-[#090A0F]/70 text-center">
            <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/20 p-3 text-indigo-300">
              <FileText className="size-5" />
            </div>
            <div className="text-sm font-semibold text-indigo-200">Drop files to attach</div>
            <div className="font-mono text-xs text-indigo-300/80">PDF, Word or text · up to {MAX_UPLOAD_MB} MB each</div>
          </div>
        )}
      </div>

      <Aside open={inspectorOpen} overlay={inspectorOverlay} right={inspectorRight} label="Run parameters" onClose={() => setInspectorOpen(false)}>
        <ParameterInspector
          onClose={() => setInspectorOpen(false)}
          depth={depth}
          onDepthChange={setDepth}
          depthHint={`${depthMeta.hint} — ${DEPTH_HINT[depth]}`}
          depthFactor={DEPTH_COST_FACTOR[depth]}
          cadence={cadence}
          onCadenceChange={setCadence}
          estimateLine={estimateLine}
        />
      </Aside>
      <Aside open={registryOpen} overlay={registryOverlay} label="Model registry" onClose={() => setRegistryOpen(false)}>
        <ModelRegistry
          models={pickable}
          loading={models.loading}
          picked={pickedIds}
          onToggle={toggleModel}
          onPickSet={setPicked}
          ensembles={ensembles}
          onClose={() => setRegistryOpen(false)}
        />
      </Aside>
    </div>
  );
}
