"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  CircleAlert,
  Download,
  FileText,
  Flask,
  LinkIcon,
  Loader,
  Pencil,
  Refresh,
  Search,
  Trash,
} from "@/lib/icons";
import {
  addSuggestionToRun,
  cancelRun,
  createReportNote,
  deleteReport,
  deleteReportNote,
  fetchLatestRun,
  fetchModels,
  fetchQueuedSuggestions,
  fetchReportDetail,
  fetchReportNotes,
  fetchReportVersion,
  fetchReportVersions,
  fetchSuggestedNextSteps,
  pickableModels,
  removeSuggestionFromRun,
  runReport,
  updateReport,
} from "@/lib/research/service";
import { DEPTH_LABEL, cadenceMeta, providerStyle, relativeTime, researchRoutes } from "@/lib/research/format";
import type { ReportDetail as ReportDetailRead, ReportVersionRead } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { PatientBanner } from "@/components/report/patient-banner";
import { ModuleHeaderBar, ModulePage } from "@/components/research/ui/module-shell";
import { AETHER_BUTTON, AETHER_DANGER_BUTTON, ReportStateCard, ReportStatePill } from "@/components/research/ui/primitives";
import { ConfirmDialog, NoticeDialog, type Notice } from "@/components/research/ui/dialog";
import { useResearch } from "@/components/research/ui/use-research";
import { ModelReportCards, ModelResponses, RunProgressPanel, SourcesTab, VersionsTab } from "./report-parts";
import { RerunComposer, type ComposerSize, type RerunOptions } from "./rerun-composer";
import { GapDrawer, GapDrawerTrigger } from "./suggested-next-steps";
import { ReportTabPanel, ReportTabs, tabForAnchor, type ReportTab } from "./report-tabs";
import { MasterSynthesis, PanelCard, ReportSectionNav, SectionPanel } from "./report-layout";
import { LabResults } from "./lab-results";
import { ExecutiveSummary } from "./executive-summary";
import { DoctorWorkspace } from "@/components/report/doctor-workspace";
import { FollowUpLabs } from "@/components/report/follow-up-labs";
import { relatedPanelIds } from "@/lib/report/related";

const POLL_MS = 1500;
const RERUN_ID = "rerun-box";

function toMarkdown(report: ReportDetailRead, v: ReportVersionRead): string {
  const lines = [
    `# ${report.title}`,
    "",
    `> ${report.prompt.replace(/\n/g, " ")}`,
    "",
    `Version ${v.version_number} · ${new Date(v.created_at).toLocaleDateString("en-US")} · confidence ${v.confidence_score ?? "—"} · ${report.selected_models.map((m) => m.name).join(", ")}`,
    "",
  ];
  if (v.executive_summary) lines.push("## Executive summary", "", v.executive_summary, "");
  for (const s of v.sections) lines.push(`## ${s.title}`, "", s.body, "");
  if (v.citations.length) {
    lines.push("## Citations", "");
    for (const c of [...v.citations].sort((a, b) => a.number - b.number)) {
      lines.push(
        `${c.number}. ${c.source.title}${c.source.url ? ` — ${c.source.url}` : ""}${c.is_contested ? " (contested)" : ""}`
      );
    }
  }
  return lines.join("\n");
}

function download(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** One research report, laid out like the clinical Report page: patient
 *  banner, a sticky control bar, a section nav, the Master AI synthesis and a
 *  panel per section — then model passes, sources, versions, re-run and notes. */
export function ReportDetail({
  reportId,
  version: versionNumber,
}: {
  reportId: string | null;
  /** The `?version=` on the URL — null shows the latest. The URL is the one
   *  source of truth, so the sidebar, the picker and shared links agree. */
  version: number | null;
}) {
  const router = useRouter();
  const showToast = useToast((s) => s.show);
  const id = reportId ?? "";

  const detail = useResearch(() => fetchReportDetail(id), [id]);
  const versions = useResearch(() => fetchReportVersions(id), [id]);
  const notes = useResearch(() => fetchReportNotes(id), [id]);
  const latestRun = useResearch(() => fetchLatestRun(id), [id]);
  const models = useResearch(() => fetchModels(), []);
  const suggestions = useResearch(() => fetchSuggestedNextSteps(id), [id]);
  const queued = useResearch(() => fetchQueuedSuggestions(id), [id]);
  const olderQuery = useResearch<ReportVersionRead | null>(
    () => (versionNumber != null ? fetchReportVersion(id, versionNumber) : Promise.resolve({ data: null, error: null })),
    [id, versionNumber]
  );

  const [criteria, setCriteria] = React.useState("");
  const criteriaRef = React.useRef<HTMLTextAreaElement>(null);
  // Starts folded to its title bar, so the report gets the whole window.
  const [composerSize, setComposerSize] = React.useState<ComposerSize>("min");
  const [rerunning, setRerunning] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState<string | null>(null);
  const [savingTitle, setSavingTitle] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [gapsOpen, setGapsOpen] = React.useState(false);
  const gapOpener = React.useRef<HTMLElement | null>(null);
  const openGaps = (e: React.MouseEvent<HTMLElement>) => {
    gapOpener.current = e.currentTarget;
    setGapsOpen(true);
  };
  // Every visit opens on AI Summary — even when the URL still carries a
  // #hash into another tab from an earlier click.
  const [tab, setTab] = React.useState<ReportTab>("summary");
  const [addingGapId, setAddingGapId] = React.useState<string | null>(null);
  const [removingGapId, setRemovingGapId] = React.useState<string | null>(null);
  const [queueingAll, setQueueingAll] = React.useState(false);

  const report = detail.data;
  const running = report?.state === "running";

  /* While a run is in flight, re-read the report and run on a timer; the
     store publishes the merged version once every pass has finished. */
  const reloadDetail = detail.reload;
  const reloadRun = latestRun.reload;
  // Bumped by each poll, so the next one is always scheduled — even when a
  // poll comes back unchanged (a model still answering).
  const [pollTick, setPollTick] = React.useState(0);
  React.useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      reloadRun();
      reloadDetail();
      setPollTick((n) => n + 1);
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [running, pollTick, reloadDetail, reloadRun]);

  /* The run this page started just finished. "started" waits for the first
     read that shows the run in progress — until then the page still holds
     the pre-run report, which would announce the old version as new. */
  const [watching, setWatching] = React.useState<"no" | "started" | "running">("no");
  if (watching === "started" && running) setWatching("running");
  if (watching === "running" && report && !running) {
    setWatching("no");
    if (report.state === "ready" || report.state === "scheduled") {
      setNotice({
        tone: "success",
        title: `v${report.version_count} published`,
        message: "Every model has answered and the passes have been merged. The previous version is kept under Versions.",
      });
    }
  }

  /* A #hash on load: the browser tried to scroll before the report had
     loaded. A section of AI Summary is scrolled to once it's there; a hash
     into another tab is dropped, since the page opens on AI Summary. */
  const loaded = !!report;
  const scrolledToHash = React.useRef(false);
  React.useEffect(() => {
    if (!loaded || scrolledToHash.current) return;
    scrolledToHash.current = true;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    if (tabForAnchor(hash) === "summary" || !tabForAnchor(hash)) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
    } else {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [loaded]);

  /* Back/Forward or a same-page link to a #hash in another tab. */
  React.useEffect(() => {
    const onHash = () => {
      const target = tabForAnchor(window.location.hash);
      if (!target) return;
      setTab(target);
      requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" }));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (!reportId || (!report && detail.error && !detail.loading)) {
    const notFound = !reportId || /doesn't exist/.test(detail.error ?? "");
    return (
      <ModulePage>
        <ModuleHeaderBar icon={<FileText />} title="Report" />
        <div className="mx-auto w-full max-w-[1560px] p-4 sm:p-6">
          <ReportStateCard
            tone={notFound ? "indigo" : "red"}
            icon={notFound ? <Search /> : <AlertTriangle />}
            title={notFound ? "Report not found" : "Couldn't load the report"}
            description={notFound ? "It may have been deleted, or the link is out of date." : detail.error}
            action={
              notFound ? (
                <Link href={researchRoutes.reports} className={AETHER_BUTTON}>
                  <ArrowLeft />
                  All reports
                </Link>
              ) : (
                <button type="button" className={AETHER_BUTTON} onClick={detail.reload}>
                  <Refresh />
                  Try again
                </button>
              )
            }
          />
        </div>
      </ModulePage>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-full flex-col" aria-busy aria-label="Loading report">
        <PatientBanner />
        <div className="h-[60px] border-b border-white/[0.07] bg-[#0C0E15]/95" />
        <div className="mx-auto flex w-full max-w-[1560px] animate-pulse gap-6 px-4 py-6 sm:px-6">
          <div className="hidden h-96 w-64 shrink-0 rounded-xl border border-white/[0.08] bg-panel lg:block" />
          <div className="flex-1 space-y-6">
            <div className="h-80 rounded-2xl border-2 border-indigo-500/30 bg-panel" />
            <div className="h-64 rounded-2xl border border-white/[0.08] bg-panel" />
          </div>
        </div>
      </div>
    );
  }

  const latestNumber = report.current_version?.version_number ?? null;
  const viewingOlder = versionNumber != null && versionNumber !== latestNumber;
  const shownNumber = viewingOlder ? versionNumber : latestNumber;
  const older = olderQuery.data?.version_number === versionNumber ? olderQuery.data : null;
  const olderError = viewingOlder && !older ? olderQuery.error : null;
  const version = viewingOlder ? older : report.current_version;
  const executions = version?.model_executions ?? [];
  const modelNames = report.selected_models.map((m) => m.name);
  const reportHref = researchRoutes.report(report.title, report.id);
  const sourceCount = version ? new Set(version.citations.map((c) => c.source.id)).size : 0;
  const cadence = cadenceMeta(report.cadence);
  const related = relatedPanelIds(report.prompt);

  /** Picking a version changes the URL; the page follows it. */
  function selectVersion(n: number) {
    router.replace(n === latestNumber ? reportHref : `${reportHref}?version=${n}`, { scroll: false });
  }

  /** Switches tab and, for a deep link, lands on the anchor inside it. */
  function openTab(next: ReportTab, anchor?: string) {
    setTab(next);
    requestAnimationFrame(() => {
      if (anchor) {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${anchor}`);
      }
    });
  }

  /* Any in-page link (the section nav, "Compare models", a section card)
     whose target sits in another tab switches to that tab first — a hidden
     tab has nothing to scroll to. */
  const onAnchorClick = (e: React.MouseEvent) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const anchor = link.getAttribute("href")!.slice(1);
    const target = tabForAnchor(anchor);
    if (!target || target === tab) return;
    e.preventDefault();
    openTab(target, anchor);
  };

  /** No options re-runs the report as it is (the "Run now" of a draft). */
  async function rerun(options?: RerunOptions): Promise<boolean> {
    setRerunning(true);
    const res = await runReport(
      id,
      options && {
        custom_prompt: options.customPrompt || undefined,
        model_ids: options.modelIds,
        note_ids: options.noteIds,
        attachments: options.attachments,
        hashtags: options.hashtags,
      }
    );
    setRerunning(false);
    if (!res.data) {
      showToast(res.error, "error");
      return false;
    }
    setCriteria("");
    if (viewingOlder) router.replace(reportHref, { scroll: false });
    setWatching("started");
    const gapCount = queued.data?.length ?? 0;
    showToast(
      `Re-run started across ${res.data.model_executions.length} models${gapCount ? ` with ${gapCount} queued gap${gapCount === 1 ? "" : "s"}` : ""}`
    );
    detail.reload();
    latestRun.reload();
    document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }

  /** The re-run box floats at the bottom of the page — focus it, don't scroll. */
  const focusCriteria = () => {
    // A minimized box has no text area yet — unfold it, then focus.
    if (composerSize === "min") setComposerSize("normal");
    requestAnimationFrame(() => {
      const box = criteriaRef.current;
      if (!box) return;
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
    });
  };

  async function cancel() {
    const run = latestRun.data;
    if (!run) return;
    setCancelling(true);
    const res = await cancelRun(id, run.id);
    setCancelling(false);
    setWatching("no");
    if (res.data) showToast("Run cancelled — the previous version is unchanged");
    else showToast(res.error, "error");
  }

  async function saveTitle() {
    if (titleDraft == null) return;
    const next = titleDraft.trim();
    if (!next || next === report!.title) {
      setTitleDraft(null);
      return;
    }
    setSavingTitle(true);
    const res = await updateReport(id, { title: next });
    setSavingTitle(false);
    if (res.data) {
      setTitleDraft(null);
      showToast("Title saved");
      router.replace(researchRoutes.report(res.data.title, res.data.id));
    } else {
      showToast(res.error, "error");
    }
  }

  const exportMarkdown = () => {
    if (!version) return;
    download(
      toMarkdown(report, version),
      `${report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-v${version.version_number}.md`,
      "text/markdown"
    );
    showToast("Report exported as Markdown");
  };

  const share = () => {
    void navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    showToast("Link copied");
  };

  const addCriteria = (text: string) => {
    setCriteria((c) => (c ? `${c}\n${text}` : text));
    showToast("Added to the re-run instructions");
    focusCriteria();
  };

  const addNote = async (content: string) => {
    const res = await createReportNote(id, content);
    if (res.data) showToast("Note added");
    else showToast(res.error, "error");
    return res.data != null;
  };
  const removeNote = async (noteId: string) => {
    const res = await deleteReportNote(id, noteId);
    showToast(res.error === null ? "Note deleted" : res.error, res.error === null ? "success" : "error");
  };

  /* Suggested next steps. Queued gaps go with the next run whoever starts
     it; the lists refresh themselves on every store change. */
  const queueGap = async (suggestionId: string, silent = false) => {
    setAddingGapId(suggestionId);
    const res = await addSuggestionToRun(id, suggestionId);
    setAddingGapId(null);
    if (res.error !== null) {
      showToast(res.error, "error");
      suggestions.reload();
      return false;
    }
    if (!silent) showToast(running ? "Queued — it goes with the run after this one" : "Gap queued for the next run");
    return true;
  };
  const unqueueGap = async (suggestionId: string) => {
    setRemovingGapId(suggestionId);
    const res = await removeSuggestionFromRun(id, suggestionId);
    setRemovingGapId(null);
    showToast(res.error === null ? "Removed from the next run" : res.error, res.error === null ? "success" : "error");
  };
  /** Resolves true once every open gap is queued. */
  const queueAllGaps = async () => {
    const pending = (suggestions.data ?? []).filter((g) => g.status === "suggested");
    if (!pending.length) return false;
    setQueueingAll(true);
    let done = 0;
    for (const g of pending) {
      // Stops at the first failure; its toast says why.
      if (!(await queueGap(g.id, true))) break;
      done += 1;
    }
    setQueueingAll(false);
    if (done < pending.length) return false;
    showToast(done === 1 ? "Gap queued for the next run" : `All ${done} gaps queued for the next run`);
    return true;
  };
  const openGapCount = suggestions.data ? suggestions.data.filter((g) => g.status === "suggested").length : null;

  return (
    <div className="flex min-h-full animate-fade-in flex-col" onClickCapture={onAnchorClick}>
      <NoticeDialog notice={notice} onClose={() => setNotice(null)} />
      <GapDrawer
        open={gapsOpen}
        onOpenChange={setGapsOpen}
        suggestions={suggestions.data}
        error={suggestions.data ? null : suggestions.error}
        onRetry={suggestions.reload}
        versionNumber={report.current_version?.version_number ?? null}
        addingId={addingGapId}
        removingId={removingGapId}
        queueingAll={queueingAll}
        running={running}
        onAdd={(gid) => void queueGap(gid)}
        onRemove={(gid) => void unqueueGap(gid)}
        onQueueAll={queueAllGaps}
        onGoToRerun={focusCriteria}
        canGoToRerun={!!version && !running}
        queuedTotal={queued.data?.length ?? 0}
        returnFocusTo={gapOpener}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        tone="danger"
        icon={<Trash />}
        title="Delete this report?"
        description={`“${report.title}” and all ${report.version_count} version${report.version_count === 1 ? "" : "s"}, its notes and any schedule are removed. This can't be undone.`}
        confirmLabel="Delete report"
        onConfirm={async () => {
          const res = await deleteReport(id);
          if (res.error) throw new Error(res.error);
          showToast("Report deleted");
          router.push(researchRoutes.reports);
        }}
      />

      <PatientBanner />

      {/* Sticky control bar — the research question and its actions, in the
          slot the clinical report uses for its filters. The title is the one
          dominant element; its facts read as a quiet line beneath it. */}
      <div className="sticky top-0 z-sticky shrink-0 border-b border-white/[0.07] bg-[#0C0E15]/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1 basis-[28rem]">
            <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-indigo-300/80 uppercase">
              Research report
              {shownNumber != null && (
                <span className="font-mono tracking-normal text-gray-500 normal-case">
                  · v{shownNumber}
                  {shownNumber === latestNumber ? " · latest" : ` of ${latestNumber}`}
                </span>
              )}
            </p>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
              {titleDraft != null ? (
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.nativeEvent.isComposing) return;
                      if (e.key === "Enter") void saveTitle();
                      if (e.key === "Escape") setTitleDraft(null);
                    }}
                    onBlur={() => void saveTitle()}
                    readOnly={savingTitle}
                    maxLength={255}
                    aria-label="Report title"
                    className="min-w-0 flex-1 rounded-md border border-indigo-500/50 bg-[#141722] px-2 py-0.5 text-lg font-semibold tracking-tight text-white outline-none focus:border-indigo-400"
                  />
                  {savingTitle && <Loader className="size-4 animate-spin text-indigo-400" />}
                </span>
              ) : (
                <span className="group/title flex min-w-0 items-center gap-1">
                  <h1
                    className="min-w-0 truncate text-lg leading-snug font-semibold tracking-tight text-white"
                    title={report.title}
                    onDoubleClick={() => setTitleDraft(report.title)}
                  >
                    {report.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setTitleDraft(report.title)}
                    aria-label="Edit report title"
                    className="shrink-0 rounded-md p-1 text-gray-600 transition-colors group-hover/title:text-gray-400 hover:bg-white/5 hover:text-white focus-visible:text-white"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </span>
              )}
              <ReportStatePill state={report.state} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
              <span className="text-gray-300">{DEPTH_LABEL[report.depth]}</span>
              <span aria-hidden className="text-gray-700">
                ·
              </span>
              <span className="text-gray-300">{cadence.label}</span>
              <span aria-hidden className="text-gray-700">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5" title={report.selected_models.map((m) => m.name).join(", ")}>
                <span className="inline-flex gap-0.5">
                  {report.selected_models.map((m) => (
                    <span
                      key={m.id}
                      className="size-2 rounded-full"
                      style={{ backgroundColor: providerStyle(m.provider).accent }}
                    />
                  ))}
                </span>
                <span className="text-gray-300">{report.selected_models.length} models</span>
              </span>
              <span aria-hidden className="text-gray-700">
                ·
              </span>
              <span>Updated {relativeTime(report.updated_at)}</span>
              {report.hashtags.length > 0 && (
                <span className="ml-1 flex flex-wrap gap-1">
                  {report.hashtags.map((t) => (
                    <span key={t} className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 font-mono text-[11px] text-indigo-300">
                      #{t}
                    </span>
                  ))}
                </span>
              )}
              <button
                type="button"
                onClick={() => setPromptOpen((o) => !o)}
                aria-expanded={promptOpen}
                aria-controls="report-question"
                className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-300"
              >
                {promptOpen ? "Hide question" : "Show question"}
                <ChevronDown className={cn("size-3 transition-transform duration-200 ease-out", promptOpen && "rotate-180")} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {report.current_version && (
              <>
                <GapDrawerTrigger
                  open={gapsOpen}
                  openCount={openGapCount}
                  loading={suggestions.loading && !suggestions.data}
                  onOpen={openGaps}
                />
                <span aria-hidden className="mx-1 hidden h-5 w-px bg-white/[0.08] sm:block" />
              </>
            )}
            {(versions.data?.length ?? 0) > 1 && (
              <span className="relative inline-flex">
                <select
                  aria-label="Version"
                  value={shownNumber ?? ""}
                  onChange={(e) => selectVersion(Number(e.target.value))}
                  className="h-8 cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-[#141722] pr-7 pl-2.5 text-xs font-medium text-gray-200 transition-colors outline-none hover:bg-[#1B1F2E] focus-visible:border-indigo-500/70"
                >
                  {versions.data!.map((v) => (
                    <option key={v.id} value={v.version_number}>
                      Version {v.version_number}
                      {v.version_number === latestNumber ? " (latest)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-gray-500" />
              </span>
            )}
            <button type="button" className={cn(AETHER_BUTTON, "h-8")} onClick={exportMarkdown} disabled={!version}>
              <Download />
              <span className="max-sm:sr-only">Export</span>
            </button>
            <button type="button" className={cn(AETHER_BUTTON, "h-8")} onClick={share}>
              <LinkIcon />
              <span className="max-sm:sr-only">Share</span>
            </button>
            <button
              type="button"
              className={cn(AETHER_DANGER_BUTTON, "h-8 w-8 px-0")}
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete report"
            >
              <Trash />
            </button>
          </div>
        </div>

        {promptOpen && (
          <div id="report-question" className="mx-auto mt-3 max-w-[1560px] animate-fade-in">
            <p className="max-w-[90ch] rounded-lg border-l-2 border-indigo-500/60 bg-void px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line text-gray-300">
              <span className="mb-1 block text-[10px] font-semibold tracking-[0.14em] text-gray-500 uppercase">Research question</span>
              {report.prompt}
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-[1560px] flex-1 gap-6 px-4 py-6 sm:px-6">
        <ReportSectionNav
          version={version}
          noteCount={notes.data?.length ?? 0}
          related={related}
          gapCount={report.current_version ? (openGapCount ?? undefined) : null}
          onOpenGaps={openGaps}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {running && !viewingOlder && (
            <RunProgressPanel
              models={report.selected_models}
              executions={latestRun.data?.model_executions ?? []}
              startedAt={latestRun.data?.started_at ?? null}
              cancelling={cancelling}
              onCancel={() => void cancel()}
            />
          )}

          {viewingOlder && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                You&apos;re viewing v{versionNumber} of {latestNumber} — an older version of this report.
              </span>
              <button type="button" className={AETHER_BUTTON} onClick={() => selectVersion(latestNumber ?? 1)}>
                Back to latest (v{latestNumber})
              </button>
            </div>
          )}

          {!version ? (
            viewingOlder && !olderError ? (
              <ReportStateCard
                icon={<Loader className="animate-spin" />}
                title={`Loading v${versionNumber}…`}
                description="Fetching this version's report, citations and model passes."
              />
            ) : olderError ? (
              <ReportStateCard
                tone="red"
                icon={<CircleAlert />}
                title={`Couldn't load v${versionNumber}`}
                description={olderError}
                action={
                  <button type="button" className={AETHER_BUTTON} onClick={() => selectVersion(latestNumber ?? 1)}>
                    Back to latest
                  </button>
                }
              />
            ) : running ? null : (
              <ReportStateCard
                icon={<Flask />}
                title="No version yet"
                description={
                  report.state === "draft"
                    ? "This report hasn't been run yet — run it to publish the first version."
                    : "No version has published for this report."
                }
                action={
                  <button type="button" className={AETHER_BUTTON} onClick={() => void rerun()} disabled={rerunning}>
                    {rerunning ? <Loader className="animate-spin" /> : <Refresh />}
                    Run now
                  </button>
                }
              />
            )
          ) : (
            <>
              <ReportTabs
                active={tab}
                onChange={(t) => openTab(t)}
                counts={{
                  summary: version.sections.length,
                  models: executions.length,
                  sources: sourceCount,
                  versions: versions.data?.length ?? report.version_count,
                }}
              />

              <ReportTabPanel tab="summary" active={tab}>
                <MasterSynthesis
                  version={version}
                  models={report.selected_models}
                  versions={versions.data ?? []}
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={focusCriteria}
                        className={cn(
                          AETHER_BUTTON,
                          "border-indigo-500/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25"
                        )}
                      >
                        <Refresh />
                        Rerun with criteria
                      </button>
                      <a href="#model-passes" className={AETHER_BUTTON}>
                        Compare models
                      </a>
                    </>
                  }
                />

                {version.sections.map((s, i) => (
                  <SectionPanel key={s.id} section={s} index={i} version={version} modelNames={modelNames} />
                ))}

                <LabResults related={related} />
                <DoctorWorkspace />
                <FollowUpLabs />
              </ReportTabPanel>

              <ReportTabPanel tab="executive" active={tab}>
                <ExecutiveSummary />
              </ReportTabPanel>

              <ReportTabPanel tab="models" active={tab}>
                <PanelCard
                  id="model-passes"
                  eyebrow={`${executions.length} independent passes • v${version.version_number}`}
                  title="Frontier Model Reports (Side-by-Side)"
                >
                  <div className="space-y-6">
                    <ModelReportCards
                      executions={executions}
                      citations={version.citations}
                      onAddCriteria={addCriteria}
                      onInspect={(e) =>
                        document.getElementById(`model-${e.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                    />
                    <ModelResponses executions={executions} onToast={(m) => showToast(m)} />
                  </div>
                </PanelCard>
              </ReportTabPanel>

              <ReportTabPanel tab="sources" active={tab}>
                <div id="report-sources" className="scroll-mt-40">
                  <SourcesTab citations={version.citations} />
                </div>
              </ReportTabPanel>

              <ReportTabPanel tab="versions" active={tab}>
                <PanelCard
                  id="report-versions"
                  eyebrow={`${versions.data?.length ?? 0} versions kept • re-runs never overwrite`}
                  title="Version History"
                >
                  <VersionsTab
                    versions={versions.data ?? []}
                    shown={shownNumber}
                    latest={latestNumber}
                    onSelect={(n) => {
                      selectVersion(n);
                      // Land on the version's answer, not mid-way down the list.
                      openTab("summary");
                      document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </PanelCard>
              </ReportTabPanel>
            </>
          )}

          {/* No version to show (a draft, or an older one still loading):
              the history stays reachable under the state card. */}
          {!version && (versions.data?.length ?? 0) > 0 && (
            <PanelCard
              id="report-versions"
              eyebrow={`${versions.data?.length ?? 0} versions kept • re-runs never overwrite`}
              title="Version History"
            >
              <VersionsTab versions={versions.data ?? []} shown={shownNumber} latest={latestNumber} onSelect={selectVersion} />
            </PanelCard>
          )}

          {/* The re-run box floats over the bottom of the page like the New
              Research chat box: sticky at the end of the report column, so it
              stays in view while the report scrolls under it and comes to rest
              after the last section. The report fades into the page above it. */}
          {version && !running ? (
            <div
              id={RERUN_ID}
              className="z-20 -mt-6 pt-8 pb-3 md:sticky md:bottom-0 md:pt-14 md:pb-5 md:bg-[linear-gradient(to_bottom,rgb(9_10_15/0)_0,rgb(9_10_15/0.88)_2.25rem,var(--color-canvas)_3.5rem)]"
            >
              <RerunComposer
                key={report.selected_models.map((m) => m.id).join(",")}
                reportId={report.id}
                models={models.data ? pickableModels(models.data) : null}
                currentModelIds={report.selected_models.map((m) => m.id)}
                notes={notes.data}
                onDeleteNote={(noteId) => void removeNote(noteId)}
                queued={queued.data ?? []}
                removingQueuedId={removingGapId}
                onRemoveQueued={(gid) => void unqueueGap(gid)}
                prompt={criteria}
                onPromptChange={setCriteria}
                onAddNote={addNote}
                busy={rerunning}
                onRun={rerun}
                textareaRef={criteriaRef}
                size={composerSize}
                onSizeChange={setComposerSize}
              />
            </div>
          ) : (
            <div className="h-10" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
