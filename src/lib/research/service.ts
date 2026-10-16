"use client";

import { wait } from "@/lib/utils";
import type {
  AddSourceInput,
  ApiResult,
  CreateReportInput,
  DocumentRead,
  FolderRead,
  HashtagRead,
  HashtagReportRead,
  Page,
  PromptCategoryInput,
  PromptCategoryRead,
  PromptTemplateInput,
  PromptTemplateRead,
  RecurringCadence,
  ReportDepth,
  ReportDetail,
  ReportEstimate,
  ReportNoteRead,
  ReportRead,
  ReportState,
  ReportStats,
  ReportVersionRead,
  ReportAttachmentInput,
  ReportVersionSummary,
  ResearchModel,
  RunRead,
  RunReportOptions,
  ScheduleRead,
  ScheduleStats,
  SuggestedNextStep,
  QueuedSuggestion,
  SourceRead,
  SourceStats,
  SourceType,
  Cadence,
} from "./types";
import {
  advanceRuns,
  commit,
  currentOwner,
  db,
  executionRead,
  latestRun,
  latestVersion,
  modelById,
  newId,
  planExecutions,
  reportHashtags,
  resolveTopic,
  sourceRef,
  topicFor,
  versionRead,
  type StoredReport,
  type StoredRun,
} from "./store";
import { DEFAULT_MODEL_PROVIDERS } from "./seed";
import { detectGaps, gapInstruction } from "./gaps";

/**
 * The Research data service — STATIC. No network requests: every function
 * reads and writes the seeded store in `store.ts` (kept in localStorage),
 * after a short delay so screens show their loading states.
 *
 * Function names and result shapes match oneplace-v2's research module
 * (lib/research/analytics.ts, documents.ts, hashtags.ts), so the screens can
 * stay unchanged if a backend is ever added.
 */

const LATENCY = 220;
const DAY = 86_400_000;

async function ok<T>(value: () => T, latency = LATENCY): Promise<ApiResult<T>> {
  await wait(latency);
  try {
    advanceRuns();
    return { data: value(), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

class NotFound extends Error {}

function must<T>(value: T | undefined | null, what: string): T {
  if (value == null) throw new NotFound(`That ${what} doesn't exist any more.`);
  return value;
}

const iso = (ms: number) => new Date(ms).toISOString();

function paginate<T>(items: T[], limit = 50, offset = 0): Page<T> {
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
}

/* --------------------------------- Models -------------------------------- */

/** Providers the picker leaves out (kept for older reports' labels). */
export const HIDDEN_MODEL_PROVIDERS: readonly ResearchModel["provider"][] = ["perplexity"];

export function fetchModels() {
  return ok(() => db().models.filter((m) => m.is_active));
}

export function pickableModels(models: ResearchModel[]): ResearchModel[] {
  return models.filter((m) => !HIDDEN_MODEL_PROVIDERS.includes(m.provider));
}

export function defaultModelIds(models: ResearchModel[]): string[] {
  const picks = models.filter((m) => DEFAULT_MODEL_PROVIDERS.includes(m.provider));
  return (picks.length ? picks : models.slice(0, 2)).map((m) => m.id);
}

const DEPTH_FACTOR: Record<ReportDepth, number> = { quick_scan: 0.45, standard: 1, deep_dive: 4.6 };

export function fetchReportEstimate(modelIds: string[], depth: ReportDepth) {
  return ok<ReportEstimate>(() => {
    const factor = DEPTH_FACTOR[depth];
    const per_model: Record<string, number> = {};
    let seconds = 0;
    for (const id of modelIds) {
      const m = modelById(id);
      per_model[id] = Number((m.cost_per_run_estimate * factor).toFixed(4));
      seconds = Math.max(seconds, m.avg_latency_seconds * (depth === "deep_dive" ? 1.6 : depth === "quick_scan" ? 0.6 : 1));
    }
    return {
      estimated_time_seconds: seconds + 2,
      estimated_cost_usd: Object.values(per_model).reduce((a, b) => a + b, 0),
      per_model,
    };
  }, 120);
}

/* -------------------------------- Reports -------------------------------- */

function reportRead(r: StoredReport): ReportRead {
  const store = db();
  const versions = store.versions.filter((v) => v.report_id === r.id);
  const latest = latestVersion(r.id);
  return {
    id: r.id,
    title: r.title,
    prompt: r.prompt,
    state: r.state,
    depth: r.depth,
    cadence: r.cadence,
    owner_id: r.owner.id,
    owner: r.owner,
    current_version_id: latest?.id ?? null,
    version_count: versions.length,
    latest_confidence_score: latest?.confidence_score ?? null,
    source_count: latest?.source_count ?? r.attached_source_ids.length,
    selected_models: r.model_ids.map(modelById),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function reportOrThrow(id: string): StoredReport {
  return must(db().reports.find((r) => r.id === id), "report");
}

const byUpdated = (a: { updated_at: string }, b: { updated_at: string }) => (a.updated_at < b.updated_at ? 1 : -1);

export function fetchReports(params?: {
  state?: ReportState;
  cadence?: Cadence;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return ok<Page<ReportRead>>(() => {
    const q = params?.search?.trim().toLowerCase();
    const list = db()
      .reports.filter((r) => !params?.state || r.state === params.state)
      .filter((r) => !params?.cadence || r.cadence === params.cadence)
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.prompt.toLowerCase().includes(q))
      .sort(byUpdated)
      .map(reportRead);
    return paginate(list, params?.limit ?? 50, params?.offset ?? 0);
  });
}

export function fetchReportStats() {
  return ok<ReportStats>(() => {
    const store = db();
    const reports = store.reports;
    const count = (s: ReportState) => reports.filter((r) => r.state === s).length;
    const scores = reports
      .map((r) => latestVersion(r.id)?.confidence_score)
      .filter((v): v is number => v != null);
    const now = Date.now();
    const trend = Array.from({ length: 8 }, (_, w) => {
      const end = now - (7 - w) * 7 * DAY;
      const vs = store.versions.filter((v) => new Date(v.created_at).getTime() <= end);
      const latestPer = new Map<string, number>();
      for (const v of vs) latestPer.set(v.report_id, v.confidence_score ?? 0);
      const vals = [...latestPer.values()];
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    }).filter((v) => v > 0);
    const recent = reports.filter((r) => now - new Date(r.created_at).getTime() < 30 * DAY).length;
    const prior = reports.filter((r) => {
      const age = now - new Date(r.created_at).getTime();
      return age >= 30 * DAY && age < 60 * DAY;
    }).length;
    const running = reports.find((r) => r.state === "running");
    const active = store.schedules.filter((s) => s.is_active);
    return {
      total: reports.length,
      draft: count("draft"),
      running: count("running"),
      ready: count("ready"),
      scheduled: count("scheduled"),
      failed: count("failed"),
      mean_confidence: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      reports_delta_pct: prior ? ((recent - prior) / prior) * 100 : null,
      confidence_trend: trend,
      confidence_delta_pct:
        trend.length >= 2 ? ((trend[trend.length - 1] - trend[trend.length - 2]) / trend[trend.length - 2]) * 100 : null,
      running_now: running ? { title: running.title, model_count: running.model_ids.length } : null,
      scheduled_breakdown: {
        daily: active.filter((s) => s.cadence === "daily").length,
        weekly: active.filter((s) => s.cadence === "weekly").length,
        monthly: active.filter((s) => s.cadence === "monthly").length,
      },
    };
  });
}

export function fetchReportDetail(reportId: string) {
  return ok<ReportDetail>(() => {
    const r = reportOrThrow(reportId);
    const latest = latestVersion(r.id);
    return {
      ...reportRead(r),
      current_version: latest ? versionRead(latest, r) : null,
      attached_sources: r.attached_source_ids.map(sourceRef),
      hashtags: r.hashtags,
    };
  });
}

/** Each attachment as a source id — an already-created source, or a URL
 *  turned into one (reusing the source a URL already has). */
function resolveAttachments(attachments: ReportAttachmentInput[] | undefined, now: number): string[] {
  const store = db();
  const sourceIds: string[] = [];
  for (const a of attachments ?? []) {
    if (a.source_id) {
      sourceIds.push(a.source_id);
      continue;
    }
    if (!a.url) continue;
    const existing = store.sources.find((s) => s.url === a.url);
    if (existing) {
      sourceIds.push(existing.id);
      continue;
    }
    const id = newId("src");
    store.sources.push({
      id,
      title: a.title || a.url,
      url: a.url,
      domain: safeDomain(a.url),
      source_type: a.source_type ?? "web",
      quality_tier: "unknown",
      is_paywalled: false,
      is_stale: false,
      is_internal: !!a.is_internal,
      first_seen: iso(now),
      last_fetched: iso(now),
    });
    sourceIds.push(id);
  }
  return sourceIds;
}

export function createReport(payload: CreateReportInput) {
  return ok<ReportRead>(() => {
    const store = db();
    if (!payload.prompt.trim()) throw new Error("Add a research question first.");
    if (payload.model_ids.length === 0) throw new Error("Pick at least one model.");
    const now = Date.now();
    const sourceIds = resolveAttachments(payload.attachments, now);
    const report: StoredReport = {
      id: newId("rpt"),
      title: payload.title.trim() || "Untitled research",
      prompt: payload.prompt.trim(),
      state: "draft",
      depth: payload.depth,
      cadence: payload.cadence,
      owner: currentOwner(),
      model_ids: payload.model_ids,
      hashtags: reportHashtags(payload.prompt, payload.hashtags),
      attached_source_ids: sourceIds,
      topic: topicFor(payload.prompt)?.id ?? "generic",
      created_at: iso(now),
      updated_at: iso(now),
    };
    store.reports.push(report);
    commit();
    return reportRead(report);
  });
}

export function updateReport(reportId: string, payload: { title: string }) {
  return ok<ReportRead>(() => {
    const r = reportOrThrow(reportId);
    const title = payload.title.trim();
    if (!title) throw new Error("A report needs a title.");
    r.title = title;
    r.updated_at = iso(Date.now());
    commit();
    return reportRead(r);
  });
}

export function deleteReport(reportId: string) {
  return ok<null>(() => {
    const store = db();
    reportOrThrow(reportId);
    store.reports = store.reports.filter((r) => r.id !== reportId);
    store.runs = store.runs.filter((r) => r.report_id !== reportId);
    store.versions = store.versions.filter((v) => v.report_id !== reportId);
    store.schedules = store.schedules.filter((s) => s.report_id !== reportId);
    store.notes = store.notes.filter((n) => n.report_id !== reportId);
    commit();
    return null;
  });
}

/* ---------------------------------- Runs --------------------------------- */

function runRead(run: StoredRun): RunRead {
  const report = reportOrThrow(run.report_id);
  const executions = run.executions.map((e) => executionRead(run, e, report));
  const done = run.status === "done";
  return {
    id: run.id,
    report_id: run.report_id,
    report_version_id: run.version_id,
    trigger_type: run.trigger_type,
    status: run.status === "running" ? "running" : run.status,
    total_cost: done ? Number(run.executions.reduce((a, e) => a + e.cost, 0).toFixed(4)) : null,
    error_message: null,
    started_at: run.started_at,
    completed_at: run.completed_at,
    custom_instructions: run.custom_instructions,
    model_executions: executions,
  };
}

export function runReport(reportId: string, options?: RunReportOptions) {
  return ok<RunRead>(() => {
    const store = db();
    const r = reportOrThrow(reportId);
    if (r.state === "running") throw new Error("This report is already running.");
    const now = Date.now();
    if (options?.model_ids?.length) r.model_ids = options.model_ids;
    r.hashtags = reportHashtags(options?.custom_prompt ?? "", [...r.hashtags, ...(options?.hashtags ?? [])]);
    const added = resolveAttachments(options?.attachments, now);
    r.attached_source_ids = [...new Set([...r.attached_source_ids, ...added])];
    // Picked notes go to the models with the typed instructions, oldest first.
    const noteText = store.notes
      .filter((n) => n.report_id === r.id && options?.note_ids?.includes(n.id))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((n) => n.content.trim());
    // Queued gaps ride along with every run, whoever starts it, then clear.
    const takenGaps = r.queued_gaps ?? [];
    const gapText = takenGaps.map(gapInstruction);
    r.queued_gaps = [];
    const instructions = [options?.custom_prompt?.trim(), ...noteText, ...gapText].filter(Boolean).join("\n");
    const run: StoredRun = {
      id: newId("run"),
      report_id: r.id,
      started_at: iso(now),
      completed_at: null,
      status: "running",
      trigger_type: "manual",
      custom_instructions: instructions || null,
      executions: planExecutions(r.model_ids, store.models, r.depth),
      version_id: null,
      queued_gaps: takenGaps,
    };
    store.runs.push(run);
    r.state = "running";
    r.updated_at = run.started_at;
    commit();
    return runRead(run);
  });
}

export function fetchLatestRun(reportId: string) {
  return ok<RunRead | null>(() => {
    reportOrThrow(reportId);
    const run = latestRun(reportId);
    return run ? runRead(run) : null;
  }, 120);
}

export function cancelRun(reportId: string, runId: string) {
  return ok<RunRead>(() => {
    const r = reportOrThrow(reportId);
    const run = must(db().runs.find((x) => x.id === runId && x.report_id === reportId), "run");
    if (run.status !== "running") throw new Error("That run has already finished.");
    run.status = "cancelled";
    run.completed_at = iso(Date.now());
    // The run never published, so the gaps it took go back on the queue —
    // ahead of anything queued while it ran, without duplicates.
    const queuedSince = r.queued_gaps ?? [];
    const restored = (run.queued_gaps ?? []).filter((g) => !queuedSince.some((q) => q.id === g.id));
    r.queued_gaps = [...restored, ...queuedSince];
    run.queued_gaps = [];
    r.state = latestVersion(r.id) ? (r.cadence === "run_once" ? "ready" : "scheduled") : "draft";
    r.updated_at = run.completed_at;
    commit();
    return runRead(run);
  });
}

export function fetchReportVersions(reportId: string) {
  return ok<ReportVersionSummary[]>(() => {
    reportOrThrow(reportId);
    return db()
      .versions.filter((v) => v.report_id === reportId)
      .sort((a, b) => b.version_number - a.version_number)
      .map((v) => ({
        id: v.id,
        version_number: v.version_number,
        confidence_score: v.confidence_score,
        source_count: v.source_count,
        change_note: v.change_note,
        created_at: v.created_at,
        claims_added: v.claims_added,
        claims_removed: v.claims_removed,
        triggered_by: v.triggered_by,
      }));
  });
}

export function fetchReportVersion(reportId: string, versionNumber: number) {
  return ok<ReportVersionRead>(() => {
    const r = reportOrThrow(reportId);
    const v = must(
      db().versions.find((x) => x.report_id === reportId && x.version_number === versionNumber),
      "version"
    );
    return versionRead(v, r);
  });
}

/* -------------------------- Suggested next steps ------------------------- */

/** The gaps detected in the report's latest version, each marked "added"
 *  once queued for the next run. Empty before the first version publishes. */
export function fetchSuggestedNextSteps(reportId: string) {
  return ok<SuggestedNextStep[]>(() => {
    const r = reportOrThrow(reportId);
    const latest = latestVersion(r.id);
    if (!latest) return [];
    const queued = new Set((r.queued_gaps ?? []).map((g) => g.id));
    return detectGaps(versionRead(latest, r)).map((g, i) => ({
      id: g.id,
      report_id: r.id,
      report_version_id: latest.id,
      title: g.title,
      description: g.description,
      type: g.type,
      estimated_confidence_uplift: g.uplift,
      priority: i + 1,
      status: queued.has(g.id) ? "added" : "suggested",
    }));
  }, 160);
}

function gapOrThrow(reportId: string, suggestionId: string) {
  const r = reportOrThrow(reportId);
  const latest = latestVersion(r.id);
  const gap = latest ? detectGaps(versionRead(latest, r)).find((g) => g.id === suggestionId) : undefined;
  // A newer version re-detects its gaps; one it closed is gone.
  if (!gap) throw new Error("That gap was closed by a newer version — the list has been refreshed.");
  return { r, gap };
}

/** Queues a gap for the report's next run — Re-run, the re-run box or a
 *  schedule. It's folded into that run's instructions, then cleared. */
export function addSuggestionToRun(reportId: string, suggestionId: string) {
  return ok<null>(() => {
    const { r, gap } = gapOrThrow(reportId, suggestionId);
    const queued = r.queued_gaps ?? [];
    if (!queued.some((g) => g.id === gap.id)) {
      r.queued_gaps = [...queued, { id: gap.id, title: gap.title, description: gap.description }];
      commit();
    }
    return null;
  });
}

/** Everything queued for the next run — kept with its text, so a gap
 *  queued from a version a later run replaced still goes with that run. */
export function fetchQueuedSuggestions(reportId: string) {
  return ok<QueuedSuggestion[]>(() => [...(reportOrThrow(reportId).queued_gaps ?? [])], 120);
}

/** Takes a queued gap back out of the next run. */
export function removeSuggestionFromRun(reportId: string, suggestionId: string) {
  return ok<null>(() => {
    const r = reportOrThrow(reportId);
    r.queued_gaps = (r.queued_gaps ?? []).filter((g) => g.id !== suggestionId);
    commit();
    return null;
  });
}

/* ---------------------------------- Notes -------------------------------- */

export function fetchReportNotes(reportId: string) {
  return ok<ReportNoteRead[]>(() =>
    db()
      .notes.filter((n) => n.report_id === reportId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map(({ report_id: _r, ...n }) => {
        void _r;
        return n;
      })
  );
}

export function createReportNote(reportId: string, content: string) {
  return ok<ReportNoteRead>(() => {
    reportOrThrow(reportId);
    const text = content.trim();
    if (!text) throw new Error("Write something in the note first.");
    const now = iso(Date.now());
    const note = { id: newId("note"), report_id: reportId, content: text, created_by: currentOwner(), created_at: now, updated_at: now };
    db().notes.push(note);
    commit();
    const { report_id: _r, ...read } = note;
    void _r;
    return read;
  });
}

export function deleteReportNote(reportId: string, noteId: string) {
  return ok<null>(() => {
    const store = db();
    store.notes = store.notes.filter((n) => !(n.id === noteId && n.report_id === reportId));
    commit();
    return null;
  });
}

/* ------------------------- Attachments for new runs ----------------------- */

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Session-only file contents — the store keeps metadata, never bytes. */
const fileBlobs = new Map<string, Blob>();

/** Uploads a file as a source for the next run, and files a copy under
 *  Documents (unfiled). Throws on failure, like the real upload. */
export async function uploadSourceFile(file: File): Promise<{ id: string; title: string; documentId: string | null }> {
  await wait(500 + Math.min(1500, file.size / 20_000));
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Larger than 50 MB.");
  const store = db();
  const now = iso(Date.now());
  const id = newId("src");
  store.sources.push({
    id,
    title: file.name,
    url: null,
    domain: null,
    source_type: "internal",
    quality_tier: "primary",
    is_paywalled: false,
    is_stale: false,
    is_internal: true,
    first_seen: now,
    last_fetched: now,
  });
  const documentId = newId("doc");
  store.documents.push({
    id: documentId,
    folder_id: null,
    original_filename: file.name,
    content_type: file.type || null,
    size_bytes: file.size,
    created_at: now,
  });
  fileBlobs.set(documentId, file);
  commit();
  return { id, title: file.name, documentId };
}

/** An earlier report, turned into a source the next run can read. */
export async function createSourceFromReport(reportId: string): Promise<{ id: string }> {
  await wait(350);
  const store = db();
  const r = reportOrThrow(reportId);
  const existing = store.sources.find((s) => s.url === `report://${r.id}`);
  if (existing) return { id: existing.id };
  const id = newId("src");
  const now = iso(Date.now());
  store.sources.push({
    id,
    title: `Report: ${r.title}`,
    url: `report://${r.id}`,
    domain: null,
    source_type: "internal",
    quality_tier: "primary",
    is_paywalled: false,
    is_stale: false,
    is_internal: true,
    first_seen: now,
    last_fetched: now,
  });
  commit();
  return { id };
}

/* -------------------------------- Sources -------------------------------- */

function safeDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function sourceRead(id: string): SourceRead {
  const store = db();
  const reportIds = new Set(
    store.versions.filter((v) => v.citations.some((c) => c.source_id === id)).map((v) => v.report_id)
  );
  for (const r of store.reports) if (r.attached_source_ids.includes(id)) reportIds.add(r.id);
  return {
    ...sourceRef(id),
    cited_by_reports: store.reports.filter((r) => reportIds.has(r.id)).map((r) => ({ id: r.id, title: r.title })),
  };
}

export function fetchSources(params?: {
  source_type?: SourceType;
  report_id?: string;
  search?: string;
  is_paywalled?: boolean;
  is_stale?: boolean;
  limit?: number;
  offset?: number;
}) {
  return ok<Page<SourceRead>>(() => {
    const q = params?.search?.trim().toLowerCase();
    const list = db()
      .sources.map((s) => sourceRead(s.id))
      .filter((s) => !s.url?.startsWith("report://"))
      .filter((s) => !params?.source_type || s.source_type === params.source_type)
      .filter((s) => !params?.report_id || s.cited_by_reports.some((r) => r.id === params.report_id))
      .filter((s) => params?.is_paywalled == null || s.is_paywalled === params.is_paywalled)
      .filter((s) => params?.is_stale == null || s.is_stale === params.is_stale)
      .filter((s) => !q || s.title.toLowerCase().includes(q) || (s.domain ?? "").includes(q))
      .sort((a, b) => b.cited_count - a.cited_count || (a.first_seen < b.first_seen ? 1 : -1));
    return paginate(list, params?.limit ?? 50, params?.offset ?? 0);
  });
}

export function fetchSourceStats() {
  return ok<SourceStats>(() => {
    const list = db().sources.filter((s) => !s.url?.startsWith("report://"));
    const by_type: SourceStats["by_type"] = {};
    for (const s of list) by_type[s.source_type] = (by_type[s.source_type] ?? 0) + 1;
    return {
      total: list.length,
      distinct_domains: new Set(list.map((s) => s.domain).filter(Boolean)).size,
      paywalled_count: list.filter((s) => s.is_paywalled).length,
      stale_count: list.filter((s) => s.is_stale).length,
      by_type,
    };
  });
}

export function addSourceDomain(input: AddSourceInput) {
  return ok<SourceRead>(() => {
    const store = db();
    let url: URL;
    try {
      url = new URL(input.url.trim());
    } catch {
      throw new Error("That doesn't look like a valid URL — include https://.");
    }
    if (store.sources.some((s) => s.url === url.toString())) throw new Error("That source is already in the library.");
    const now = iso(Date.now());
    const id = newId("src");
    store.sources.push({
      id,
      title: input.title.trim() || url.hostname,
      url: url.toString(),
      domain: url.hostname.replace(/^www\./, ""),
      source_type: input.source_type ?? "web",
      quality_tier: "unknown",
      is_paywalled: !!input.is_paywalled,
      is_stale: false,
      is_internal: !!input.is_internal,
      first_seen: now,
      last_fetched: null,
    });
    commit();
    return sourceRead(id);
  });
}

/** Downloads the source library as CSV. */
export async function exportSourcesCsv(): Promise<void> {
  const res = await fetchSources({ limit: 1000 });
  if (!res.data) throw new Error(res.error);
  const rows = [
    ["Title", "URL", "Domain", "Type", "Quality", "Cited", "Paywalled", "Stale", "First seen"],
    ...res.data.items.map((s) => [
      s.title,
      s.url ?? "",
      s.domain ?? "",
      s.source_type,
      s.quality_tier,
      String(s.cited_count),
      s.is_paywalled ? "yes" : "no",
      s.is_stale ? "yes" : "no",
      s.first_seen.slice(0, 10),
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  saveBlob(new Blob([csv], { type: "text/csv" }), "research-sources.csv");
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/* ----------------------------- Prompt library ---------------------------- */

function templateRead(id: string): PromptTemplateRead {
  const store = db();
  const t = must(store.templates.find((x) => x.id === id), "prompt");
  const cat = t.category_id ? store.categories.find((c) => c.id === t.category_id) : null;
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    prompt: t.prompt,
    category: cat ? { id: cat.id, name: cat.name } : null,
    created_by: t.created_by,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

export function fetchPromptTemplates(params?: { search?: string; category_id?: string; limit?: number; offset?: number }) {
  return ok<Page<PromptTemplateRead>>(() => {
    const q = params?.search?.trim().toLowerCase();
    const list = db()
      .templates.filter((t) => !params?.category_id || t.category_id === params.category_id)
      .filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.prompt.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      )
      .sort(byUpdated)
      .map((t) => templateRead(t.id));
    return paginate(list, params?.limit ?? 50, params?.offset ?? 0);
  });
}

function validateTemplate(p: Partial<PromptTemplateInput>, partial: boolean) {
  if (!partial || p.title !== undefined) if (!p.title?.trim()) throw new Error("Give the prompt a title.");
  if (!partial || p.prompt !== undefined) if (!p.prompt?.trim()) throw new Error("The prompt text can't be empty.");
  if (p.category_id && !db().categories.some((c) => c.id === p.category_id)) throw new Error("That category no longer exists.");
}

export function createPromptTemplate(payload: PromptTemplateInput) {
  return ok<PromptTemplateRead>(() => {
    validateTemplate(payload, false);
    const now = iso(Date.now());
    const id = newId("tpl");
    db().templates.push({
      id,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      prompt: payload.prompt.trim(),
      category_id: payload.category_id ?? null,
      created_by: currentOwner(),
      created_at: now,
      updated_at: now,
    });
    commit();
    return templateRead(id);
  });
}

export function updatePromptTemplate(id: string, payload: Partial<PromptTemplateInput>) {
  return ok<PromptTemplateRead>(() => {
    validateTemplate(payload, true);
    const t = must(db().templates.find((x) => x.id === id), "prompt");
    if (payload.title !== undefined) t.title = payload.title.trim();
    if (payload.description !== undefined) t.description = payload.description?.trim() || null;
    if (payload.prompt !== undefined) t.prompt = payload.prompt.trim();
    if (payload.category_id !== undefined) t.category_id = payload.category_id ?? null;
    t.updated_at = iso(Date.now());
    commit();
    return templateRead(id);
  });
}

export function deletePromptTemplate(id: string) {
  return ok<null>(() => {
    const store = db();
    must(store.templates.find((x) => x.id === id), "prompt");
    store.templates = store.templates.filter((t) => t.id !== id);
    commit();
    return null;
  });
}

function categoryRead(id: string): PromptCategoryRead {
  const store = db();
  const c = must(store.categories.find((x) => x.id === id), "category");
  return { ...c, template_count: store.templates.filter((t) => t.category_id === id).length };
}

export function fetchPromptCategories() {
  return ok<PromptCategoryRead[]>(() =>
    [...db().categories].sort((a, b) => a.name.localeCompare(b.name)).map((c) => categoryRead(c.id))
  );
}

function validateCategoryName(name: string | undefined, exceptId?: string) {
  const clean = name?.trim();
  if (!clean) throw new Error("Give the category a name.");
  if (db().categories.some((c) => c.id !== exceptId && c.name.toLowerCase() === clean.toLowerCase())) {
    throw new Error("A category with that name already exists.");
  }
}

export function createPromptCategory(payload: PromptCategoryInput) {
  return ok<PromptCategoryRead>(() => {
    validateCategoryName(payload.name);
    const now = iso(Date.now());
    const id = newId("cat");
    db().categories.push({ id, name: payload.name.trim(), description: payload.description?.trim() || null, created_at: now, updated_at: now });
    commit();
    return categoryRead(id);
  });
}

export function updatePromptCategory(id: string, payload: Partial<PromptCategoryInput>) {
  return ok<PromptCategoryRead>(() => {
    const c = must(db().categories.find((x) => x.id === id), "category");
    if (payload.name !== undefined) {
      validateCategoryName(payload.name, id);
      c.name = payload.name.trim();
    }
    if (payload.description !== undefined) c.description = payload.description?.trim() || null;
    c.updated_at = iso(Date.now());
    commit();
    return categoryRead(id);
  });
}

/** Templates in a deleted category become uncategorised, never deleted. */
export function deletePromptCategory(id: string) {
  return ok<null>(() => {
    const store = db();
    must(store.categories.find((x) => x.id === id), "category");
    store.categories = store.categories.filter((c) => c.id !== id);
    for (const t of store.templates) if (t.category_id === id) t.category_id = null;
    commit();
    return null;
  });
}

/* -------------------------------- Schedules ------------------------------ */

const CADENCE_MS: Record<RecurringCadence, number> = { daily: DAY, weekly: 7 * DAY, monthly: 30 * DAY };

/** Keeps every schedule's next run in the future. */
function rollSchedules() {
  const now = Date.now();
  let changed = false;
  for (const s of db().schedules) {
    let next = new Date(s.next_run_at).getTime();
    while (s.is_active && next <= now) {
      next += CADENCE_MS[s.cadence];
      changed = true;
    }
    if (changed) s.next_run_at = iso(next);
  }
  if (changed) commit();
}

function scheduleRead(id: string): ScheduleRead {
  const store = db();
  const s = must(store.schedules.find((x) => x.id === id), "schedule");
  return {
    id: s.id,
    report_id: s.report_id,
    cadence: s.cadence,
    next_run_at: s.next_run_at,
    last_run_at: s.last_run_at,
    is_active: s.is_active,
    version_count: store.versions.filter((v) => v.report_id === s.report_id).length,
    failure_count_30d: 0,
  };
}

export function fetchSchedules() {
  return ok<ScheduleRead[]>(() => {
    rollSchedules();
    return [...db().schedules].sort((a, b) => (a.next_run_at < b.next_run_at ? -1 : 1)).map((s) => scheduleRead(s.id));
  });
}

export function fetchScheduleStats() {
  return ok<ScheduleStats>(() => {
    rollSchedules();
    const store = db();
    const active = store.schedules.filter((s) => s.is_active);
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const scheduledIds = new Set(store.schedules.map((s) => s.report_id));
    return {
      active_count: active.length,
      runs_this_month: store.runs.filter(
        (r) => scheduledIds.has(r.report_id) && new Date(r.started_at) >= monthStart
      ).length,
      next_run_at: active.map((s) => s.next_run_at).sort()[0] ?? null,
      failures_30d: 0,
    };
  });
}

export function createSchedule(reportId: string, cadence: RecurringCadence) {
  return ok<ScheduleRead>(() => {
    const store = db();
    const r = reportOrThrow(reportId);
    if (store.schedules.some((s) => s.report_id === reportId)) throw new Error("This report already has a schedule.");
    const next = new Date(Date.now() + CADENCE_MS[cadence]);
    next.setUTCHours(7, 0, 0, 0);
    const id = newId("sch");
    store.schedules.push({
      id,
      report_id: reportId,
      cadence,
      next_run_at: next.toISOString(),
      last_run_at: null,
      is_active: true,
      created_at: iso(Date.now()),
    });
    r.cadence = cadence;
    if (r.state === "ready") r.state = "scheduled";
    commit();
    return scheduleRead(id);
  });
}

/** Pause/resume or change the cadence of a schedule. */
export function updateSchedule(id: string, payload: { is_active?: boolean; cadence?: RecurringCadence }) {
  return ok<ScheduleRead>(() => {
    const store = db();
    const s = must(store.schedules.find((x) => x.id === id), "schedule");
    const r = store.reports.find((x) => x.id === s.report_id);
    if (payload.cadence && payload.cadence !== s.cadence) {
      s.cadence = payload.cadence;
      const next = new Date(Date.now() + CADENCE_MS[payload.cadence]);
      next.setUTCHours(7, 0, 0, 0);
      s.next_run_at = next.toISOString();
      if (r) r.cadence = payload.cadence;
    }
    if (payload.is_active !== undefined) {
      s.is_active = payload.is_active;
      if (r && r.state !== "running") r.state = payload.is_active ? "scheduled" : "ready";
    }
    commit();
    return scheduleRead(id);
  });
}

/** Stops a schedule; the report and its versions stay. */
export function deleteSchedule(id: string) {
  return ok<null>(() => {
    const store = db();
    const s = must(store.schedules.find((x) => x.id === id), "schedule");
    store.schedules = store.schedules.filter((x) => x.id !== id);
    const r = store.reports.find((x) => x.id === s.report_id);
    if (r) {
      r.cadence = "run_once";
      if (r.state === "scheduled") r.state = "ready";
    }
    commit();
    return null;
  });
}

/* -------------------------------- Documents ------------------------------ */

function folderRead(id: string): FolderRead {
  const store = db();
  const f = must(store.folders.find((x) => x.id === id), "folder");
  return { ...f, document_count: store.documents.filter((d) => d.folder_id === id).length };
}

function validateFolderName(name: string, exceptId?: string) {
  const clean = name.trim();
  if (!clean) throw new Error("Give the folder a name.");
  if (clean.length > 120) throw new Error("Keep the folder name under 120 characters.");
  if (db().folders.some((f) => f.id !== exceptId && f.name.toLowerCase() === clean.toLowerCase())) {
    throw new Error("You already have a folder with that name.");
  }
  return clean;
}

export function fetchFolders() {
  return ok<FolderRead[]>(() =>
    [...db().folders].sort((a, b) => a.name.localeCompare(b.name)).map((f) => folderRead(f.id))
  );
}

export function fetchFolder(folderId: string) {
  return ok<FolderRead>(() => folderRead(folderId));
}

export function createFolder(name: string) {
  return ok<FolderRead>(() => {
    const clean = validateFolderName(name);
    const now = iso(Date.now());
    const id = newId("fld");
    db().folders.push({ id, name: clean, created_at: now, updated_at: now });
    commit();
    return folderRead(id);
  });
}

export function renameFolder(folderId: string, name: string) {
  return ok<FolderRead>(() => {
    const f = must(db().folders.find((x) => x.id === folderId), "folder");
    f.name = validateFolderName(name, folderId);
    f.updated_at = iso(Date.now());
    commit();
    return folderRead(folderId);
  });
}

/** Deletes a folder and the documents inside it. */
export function deleteFolder(folderId: string) {
  return ok<null>(() => {
    const store = db();
    must(store.folders.find((x) => x.id === folderId), "folder");
    store.folders = store.folders.filter((f) => f.id !== folderId);
    store.documents = store.documents.filter((d) => d.folder_id !== folderId);
    commit();
    return null;
  });
}

/** Get-or-create by name — filing a run's uploads never duplicates a folder. */
export function ensureFolder(name: string) {
  return ok<FolderRead>(() => {
    const store = db();
    const clean = name.trim().slice(0, 120) || "Untitled research";
    const existing = store.folders.find((f) => f.name.toLowerCase() === clean.toLowerCase());
    if (existing) return folderRead(existing.id);
    const now = iso(Date.now());
    const id = newId("fld");
    store.folders.push({ id, name: clean, created_at: now, updated_at: now });
    commit();
    return folderRead(id);
  });
}

export function fetchDocuments(folderId: string, params?: { limit?: number; offset?: number }) {
  return ok<Page<DocumentRead>>(() => {
    folderRead(folderId);
    const list = db()
      .documents.filter((d) => d.folder_id === folderId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return paginate(list, params?.limit ?? 100, params?.offset ?? 0);
  });
}

/** Uploads straight into a folder. Throws on failure. */
export async function uploadDocumentToFolder(folderId: string, file: File): Promise<DocumentRead> {
  await wait(400 + Math.min(1500, file.size / 20_000));
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Larger than 50 MB.");
  const store = db();
  must(store.folders.find((x) => x.id === folderId), "folder");
  const doc: DocumentRead = {
    id: newId("doc"),
    folder_id: folderId,
    original_filename: file.name,
    content_type: file.type || null,
    size_bytes: file.size,
    created_at: iso(Date.now()),
  };
  store.documents.push(doc);
  fileBlobs.set(doc.id, file);
  const folder = store.folders.find((f) => f.id === folderId);
  if (folder) folder.updated_at = doc.created_at;
  commit();
  return doc;
}

export function attachDocumentsToFolder(folderId: string, documentIds: string[]) {
  return ok<DocumentRead[]>(() => {
    const store = db();
    folderRead(folderId);
    const moved = store.documents.filter((d) => documentIds.includes(d.id));
    for (const d of moved) d.folder_id = folderId;
    commit();
    return moved;
  });
}

export function deleteDocument(documentId: string) {
  return ok<null>(() => {
    const store = db();
    must(store.documents.find((d) => d.id === documentId), "document");
    store.documents = store.documents.filter((d) => d.id !== documentId);
    fileBlobs.delete(documentId);
    commit();
    return null;
  });
}

/** Saves the file. Only files uploaded in this visit have their bytes —
 *  the static store keeps names and sizes, not contents. Throws otherwise. */
export async function downloadDocument(document: DocumentRead): Promise<void> {
  await wait(150);
  const blob = fileBlobs.get(document.id);
  if (!blob) {
    throw new Error(
      "This file's contents aren't stored yet — downloads work for files uploaded in this visit until the backend is connected."
    );
  }
  saveBlob(blob, document.original_filename);
}

/* -------------------------------- Hashtags ------------------------------- */

export function fetchHashtags(params?: { limit?: number }) {
  return ok<HashtagRead[]>(() => {
    const tags = new Map<string, { count: number; last: string }>();
    for (const r of db().reports) {
      for (const t of r.hashtags) {
        const cur = tags.get(t);
        tags.set(t, { count: (cur?.count ?? 0) + 1, last: !cur || r.updated_at > cur.last ? r.updated_at : cur.last });
      }
    }
    return [...tags.entries()]
      .map(([name, v]) => ({ name, report_count: v.count, last_used_at: v.last }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, params?.limit ?? 100);
  }, 150);
}

export function fetchHashtagReports(name: string, params?: { limit?: number; offset?: number }) {
  return ok<Page<HashtagReportRead>>(() => {
    const tag = name.toLowerCase();
    const list = db()
      .reports.filter((r) => r.hashtags.includes(tag))
      .sort(byUpdated)
      .map((r) => {
        const v = latestVersion(r.id);
        return {
          id: r.id,
          title: r.title,
          state: r.state,
          summary: v ? (v.executive_summary ?? resolveTopic(r).executive_summary) : null,
          latest_confidence_score: v?.confidence_score ?? null,
          source_count: v?.source_count ?? 0,
          created_at: r.created_at,
          updated_at: r.updated_at,
        };
      });
    return paginate(list, params?.limit ?? 20, params?.offset ?? 0);
  });
}

export { onResearchChange, resetResearchData } from "./store";
