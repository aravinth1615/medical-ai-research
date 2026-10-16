"use client";

import { readSession } from "@/lib/auth/session";
import type {
  QueuedSuggestion,
  Cadence,
  CitationRead,
  ExecutionStatus,
  OwnerRef,
  RecurringCadence,
  ReportDepth,
  ReportState,
  ReportVersionRead,
  ResearchModel,
  ResearchSourceRef,
  RunModelExecutionRead,
  SourceQualityTier,
  SourceType,
} from "./types";
import { extractHashtags } from "./format";
import {
  GENERIC_TOPIC_SOURCES,
  SEED_CATEGORIES,
  SEED_DOCUMENTS,
  SEED_FOLDERS,
  SEED_MODELS,
  SEED_REPORTS,
  SEED_SOURCES,
  SEED_TEMPLATES,
  TOPICS,
  type Topic,
} from "./seed";

/**
 * The Research module's static backend: one JSON document in localStorage,
 * built from `seed.ts` on first use. `api.ts` is the only reader — screens go
 * through it, so swapping this for HTTP calls changes nothing above it.
 *
 * Runs progress against the clock: each model's pass finishes after its
 * latency, then a merged version is published. `advanceRuns()` applies that
 * on every read, so a run started before a reload is still finished after it.
 */

const STORAGE_KEY = "omnimed.research.v1";
const CHANGE_EVENT = "omnimed:research-changed";
const DAY = 86_400_000;

/* --------------------------------- Schema -------------------------------- */

export interface StoredReport {
  id: string;
  title: string;
  prompt: string;
  state: ReportState;
  depth: ReportDepth;
  cadence: Cadence;
  owner: OwnerRef;
  model_ids: string[];
  hashtags: string[];
  attached_source_ids: string[];
  topic: string;
  created_at: string;
  updated_at: string;
  /** Gaps queued for the next run, with their text — folded into that run's
   *  instructions when it starts, then cleared. Optional, so blobs saved
   *  before suggested next steps existed still load. */
  queued_gaps?: QueuedSuggestion[];
}


export interface StoredExecution {
  id: string;
  model_id: string;
  /** Milliseconds after the run started that this pass finishes. */
  finish_after_ms: number;
  tokens: number;
  cost: number;
  status_override?: "cancelled";
}

export interface StoredRun {
  id: string;
  report_id: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "done" | "cancelled";
  trigger_type: "manual" | "scheduled";
  custom_instructions: string | null;
  executions: StoredExecution[];
  version_id: string | null;
  /** The queued gaps this run took — handed back to the queue if it's
   *  cancelled, so a re-run plan is never silently lost. */
  queued_gaps?: QueuedSuggestion[];
}

export interface StoredSource {
  id: string;
  title: string;
  url: string | null;
  domain: string | null;
  source_type: SourceType;
  quality_tier: SourceQualityTier;
  is_paywalled: boolean;
  is_stale: boolean;
  is_internal: boolean;
  first_seen: string;
  last_fetched: string | null;
}

export interface StoredVersion extends Omit<ReportVersionRead, "citations" | "model_executions"> {
  report_id: string;
  run_id: string | null;
  citations: (Omit<CitationRead, "source" | "surfaced_by_model"> & { source_id: string; model_id: string })[];
}

export interface StoredSchedule {
  id: string;
  report_id: string;
  cadence: RecurringCadence;
  next_run_at: string;
  last_run_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StoredTemplate {
  id: string;
  title: string;
  description: string | null;
  prompt: string;
  category_id: string | null;
  created_by: OwnerRef | null;
  created_at: string;
  updated_at: string;
}

export interface StoredCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredFolder {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface StoredDocument {
  id: string;
  folder_id: string | null;
  original_filename: string;
  content_type: string | null;
  size_bytes: number;
  created_at: string;
}

export interface StoredNote {
  id: string;
  report_id: string;
  content: string;
  created_by: OwnerRef | null;
  created_at: string;
  updated_at: string;
}

export interface ResearchDB {
  schema: 1;
  seeded_at: string;
  models: ResearchModel[];
  reports: StoredReport[];
  runs: StoredRun[];
  versions: StoredVersion[];
  sources: StoredSource[];
  schedules: StoredSchedule[];
  categories: StoredCategory[];
  templates: StoredTemplate[];
  folders: StoredFolder[];
  documents: StoredDocument[];
  notes: StoredNote[];
}

/* -------------------------------- Helpers -------------------------------- */

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

const iso = (ms: number) => new Date(ms).toISOString();

export function currentOwner(): OwnerRef {
  const user = readSession()?.user;
  return {
    id: user?.id ?? "usr_local",
    email: user?.email ?? "admin@hubts.io",
    full_name: user?.name ?? null,
  };
}

/** The best-matching topic for a prompt, by keyword hits; null for none. */
export function topicFor(prompt: string): Topic | null {
  const text = prompt.toLowerCase();
  let best: Topic | null = null;
  let bestHits = 0;
  for (const t of TOPICS) {
    const hits = t.keywords.filter((k) => text.includes(k)).length;
    if (hits > bestHits) {
      best = t;
      bestHits = hits;
    }
  }
  return best;
}

export function topicById(id: string): Topic | null {
  return TOPICS.find((t) => t.id === id) ?? null;
}

/** A topic built around a prompt no seeded topic matches. */
function genericTopic(prompt: string): Topic {
  const question = prompt.replace(/\s+/g, " ").trim();
  return {
    id: "generic",
    keywords: [],
    title: question,
    prompt: question,
    hashtags: [],
    executive_summary:
      `The models reviewed “${question.slice(0, 160)}${question.length > 160 ? "…" : ""}” against the patient's combined July 2026 labs [1] and current clinical guidance [2].\n\n` +
      "The most relevant abnormal values on file are Lp(a) 67.0 mg/dL, LDL 137 mg/dL, Strep A IgG >30, Vitamin C 0.1 mg/dL and an equivocal ASCA IgG of 21.9 U [1]. None of the models found evidence that changes the existing protocol; they agree on retesting before any new treatment [2][3].",
    sections: [
      {
        title: "What the patient's data shows",
        body:
          "Seven markers are in the red zone and seven are borderline out of 290 extracted [1]. The protective markers are strong: HDL 71 mg/dL, hs-CRP 0.8 mg/L and HbA1c 4.9% [1].",
        confidence: 86,
      },
      {
        title: "What the evidence says",
        body:
          "Guidelines favour confirming borderline results on a repeat draw before acting on them, and treating serology in the light of symptoms rather than on the index alone [2][4]. Micronutrient deficiencies are corrected orally and rechecked at 60 days [3].",
        confidence: 74,
      },
      {
        title: "Suggested next steps",
        body:
          "Follow the existing 60- and 90-day retest queue, and re-run this question once the new results are in so the report can compare versions [1][2].",
        confidence: 70,
      },
    ],
    citations: [
      { n: 1, source: GENERIC_TOPIC_SOURCES[0], claim: "290 biomarkers extracted; 7 red, 7 yellow.", confidence: 97 },
      { n: 2, source: GENERIC_TOPIC_SOURCES[1], claim: "Risk-enhancing factors guide the timing of therapy.", confidence: 85 },
      { n: 3, source: GENERIC_TOPIC_SOURCES[2], claim: "Oral repletion restores low vitamin C within weeks.", confidence: 83 },
      { n: 4, source: GENERIC_TOPIC_SOURCES[3], claim: "Serology alone is not an indication for treatment.", contested: true, confidence: 69 },
    ],
    angles: [
      "Confirm borderline values before acting on them.",
      "The protective markers carry real weight.",
      "Symptoms decide how serology is read.",
      "Retest timing is the main lever.",
      "Re-run once the 60-day results are in.",
    ],
    findings: [
      "7 red and 7 borderline markers out of 290.",
      "HDL 71, hs-CRP 0.8 and HbA1c 4.9% are protective.",
      "Confirm borderline results on a repeat draw.",
      "Correct micronutrients orally and recheck at 60 days.",
      "Re-run this report after the retest queue completes.",
    ],
    contested: "How much weight to give borderline values before the repeat draw is where the models differ.",
  };
}

export function resolveTopic(report: Pick<StoredReport, "topic" | "prompt">): Topic {
  return topicById(report.topic) ?? genericTopic(report.prompt);
}

/** One model's own markdown answer — every model leads with a different
 *  angle and lists the findings in its own order. */
export function modelAnswer(topic: Topic, model: ResearchModel, index: number, instructions?: string | null): string {
  const angle = topic.angles[index % topic.angles.length];
  const order = topic.findings.map((_, i) => (i + index) % topic.findings.length);
  const cites = topic.citations.map((c) => c.n);
  const lines = [
    `## ${angle}`,
    "",
    `${topic.sections[0]?.body.split("\n\n")[0] ?? topic.executive_summary}`,
    "",
    "### Key findings",
    ...order.map((i, k) => `- ${topic.findings[i]} [${cites[(i + k) % cites.length]}]`),
    "",
    "### Where the evidence is thin",
    topic.contested,
  ];
  if (instructions?.trim()) {
    lines.push("", "### On your follow-up instructions", `Re-checked with the added criteria: “${instructions.trim()}”. ${model.name} found no result that changes the recommendation above.`);
  }
  return lines.join("\n");
}

/** A merged version for a report, built from its topic. */
export function buildVersion(input: {
  report: Pick<StoredReport, "id" | "topic" | "prompt" | "model_ids">;
  number: number;
  createdAt: number;
  runId: string | null;
  changeNote: string | null;
  triggeredBy: "agent" | "user";
  previous?: StoredVersion | null;
  /** Shifts each confidence a little so successive versions differ. */
  drift?: number;
}): StoredVersion {
  const topic = resolveTopic(input.report);
  const drift = input.drift ?? 0;
  const clamp = (v: number) => Math.max(30, Math.min(97, Math.round(v + drift)));
  const sections = topic.sections.map((s, i) => ({
    id: `${input.report.id}_v${input.number}_s${i}`,
    order_index: i,
    title: s.title,
    body: s.body,
    confidence_score: clamp(s.confidence),
    cited_numbers: [...new Set([...s.body.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])))],
  }));
  const citations = topic.citations.map((c, i) => ({
    id: `${input.report.id}_v${input.number}_c${c.n}`,
    number: c.n,
    source_id: c.source,
    model_id: input.report.model_ids[i % input.report.model_ids.length],
    claim_text: c.claim,
    is_contested: !!c.contested,
    created_at: iso(input.createdAt),
    human_score: null,
    confidence_score: clamp(c.confidence),
  }));
  const confidence = Math.round(sections.reduce((a, s) => a + (s.confidence_score ?? 0), 0) / sections.length);
  const prevClaims = input.previous?.citations.length ?? 0;
  return {
    id: newId("ver"),
    report_id: input.report.id,
    run_id: input.runId,
    version_number: input.number,
    confidence_score: confidence,
    source_count: new Set(citations.map((c) => c.source_id)).size,
    change_note: input.changeNote,
    created_at: iso(input.createdAt),
    claims_added: Math.max(0, citations.length - prevClaims) || (input.previous ? 1 : citations.length),
    claims_removed: input.previous ? 1 : 0,
    triggered_by: input.triggeredBy,
    body: sections.map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n"),
    executive_summary: topic.executive_summary,
    sections,
    citations,
  };
}

export function planExecutions(modelIds: string[], models: ResearchModel[], depth: ReportDepth): StoredExecution[] {
  const factor = depth === "quick_scan" ? 0.6 : depth === "deep_dive" ? 1.6 : 1;
  return modelIds.map((id, i) => {
    const m = models.find((x) => x.id === id);
    const latency = (m?.avg_latency_seconds ?? 5) * 1000 * factor;
    return {
      id: newId("exe"),
      model_id: id,
      finish_after_ms: Math.round(latency + i * 650),
      tokens: Math.round((2400 + i * 380) * factor),
      cost: Number(((m?.cost_per_run_estimate ?? 0.1) * factor).toFixed(4)),
    };
  });
}

/** Time to merge every pass into a version once the last one finishes. */
export const MERGE_MS = 1500;

export function executionStatus(run: StoredRun, exec: StoredExecution, now = Date.now()): ExecutionStatus {
  if (exec.status_override === "cancelled" || run.status === "cancelled") {
    const finished = new Date(run.started_at).getTime() + exec.finish_after_ms <= (run.completed_at ? new Date(run.completed_at).getTime() : now);
    return finished ? "done" : "cancelled";
  }
  if (run.status === "done") return "done";
  const elapsed = now - new Date(run.started_at).getTime();
  if (elapsed >= exec.finish_after_ms) return "done";
  return elapsed >= 400 ? "running" : "queued";
}

/* ---------------------------------- Seed --------------------------------- */

function buildSeed(): ResearchDB {
  const now = Date.now();
  const owner = currentOwner();
  const models = SEED_MODELS;
  const sources: StoredSource[] = SEED_SOURCES.map((s) => ({
    id: s.id,
    title: s.title,
    url: s.url,
    domain: s.domain,
    source_type: s.source_type,
    quality_tier: s.quality_tier,
    is_paywalled: !!s.is_paywalled,
    is_stale: !!s.is_stale,
    is_internal: !!s.is_internal,
    first_seen: iso(now - s.age_days * DAY),
    last_fetched: iso(now - Math.min(s.age_days, s.is_stale ? 200 : 2) * DAY),
  }));

  const reports: StoredReport[] = [];
  const runs: StoredRun[] = [];
  const versions: StoredVersion[] = [];
  const schedules: StoredSchedule[] = [];

  for (const seed of SEED_REPORTS) {
    const topic = topicById(seed.topic)!;
    const modelIds = seed.model_providers.map((p) => models.find((m) => m.provider === p)!.id);
    const first = now - seed.versions_days_ago[0] * DAY - 3600_000;
    const last = now - seed.versions_days_ago[seed.versions_days_ago.length - 1] * DAY;
    const report: StoredReport = {
      id: seed.id,
      title: topic.title,
      prompt: topic.prompt,
      state: seed.cadence === "run_once" ? "ready" : "scheduled",
      depth: seed.depth,
      cadence: seed.cadence,
      owner,
      model_ids: modelIds,
      hashtags: topic.hashtags,
      attached_source_ids: [],
      topic: topic.id,
      created_at: iso(first),
      updated_at: iso(last),
    };
    reports.push(report);

    let previous: StoredVersion | null = null;
    seed.versions_days_ago.forEach((days, i) => {
      const at = now - days * DAY;
      const runId = newId("run");
      const executions = planExecutions(modelIds, models, seed.depth);
      const version = buildVersion({
        report,
        number: i + 1,
        createdAt: at,
        runId,
        changeNote:
          i === 0
            ? "First version."
            : i === seed.versions_days_ago.length - 1
              ? "Scheduled re-run: two new citations, confidence re-scored."
              : "Scheduled re-run: no material change.",
        triggeredBy: i === 0 ? "user" : "agent",
        previous,
        drift: (i - seed.versions_days_ago.length + 1) * 3,
      });
      versions.push(version);
      runs.push({
        id: runId,
        report_id: report.id,
        started_at: iso(at - 12_000),
        completed_at: iso(at),
        status: "done",
        trigger_type: i === 0 ? "manual" : "scheduled",
        custom_instructions: null,
        executions,
        version_id: version.id,
      });
      previous = version;
    });

    if (seed.cadence !== "run_once") {
      const cadence = seed.cadence as RecurringCadence;
      const step = cadence === "daily" ? DAY : cadence === "weekly" ? 7 * DAY : 30 * DAY;
      const next = new Date(last + step);
      next.setUTCHours(7, 0, 0, 0);
      schedules.push({
        id: newId("sch"),
        report_id: report.id,
        cadence,
        next_run_at: next.toISOString(),
        last_run_at: iso(last),
        is_active: true,
        created_at: report.created_at,
      });
    }
  }

  const categories: StoredCategory[] = SEED_CATEGORIES.map((c, i) => ({
    ...c,
    created_at: iso(now - (40 - i) * DAY),
    updated_at: iso(now - (40 - i) * DAY),
  }));
  const templates: StoredTemplate[] = SEED_TEMPLATES.map((t, i) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    prompt: t.prompt,
    category_id: t.category,
    created_by: owner,
    created_at: iso(now - (30 - i * 2) * DAY),
    updated_at: iso(now - (20 - i) * DAY),
  }));
  const folders: StoredFolder[] = SEED_FOLDERS.map((f) => ({
    id: f.id,
    name: f.name,
    created_at: iso(now - f.age_days * DAY),
    updated_at: iso(now - f.age_days * DAY),
  }));
  const documents: StoredDocument[] = SEED_DOCUMENTS.map((d) => ({
    id: d.id,
    folder_id: d.folder,
    original_filename: d.name,
    content_type: d.type,
    size_bytes: d.size,
    created_at: iso(now - d.age_days * DAY),
  }));
  const notes: StoredNote[] = [
    {
      id: newId("note"),
      report_id: "rpt_lpa01",
      content: "Family history: father had an MI at 51 — weigh this before the 90-day lipid recheck.",
      created_by: owner,
      created_at: iso(now - 6 * DAY),
      updated_at: iso(now - 6 * DAY),
    },
  ];

  return {
    schema: 1,
    seeded_at: iso(now),
    models,
    reports,
    runs,
    versions,
    sources,
    schedules,
    categories,
    templates,
    folders,
    documents,
    notes,
  };
}

/* ------------------------------ Load and save ----------------------------- */

let cache: ResearchDB | null = null;

export function db(): ResearchDB {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ResearchDB) : null;
    if (parsed?.schema === 1) {
      cache = parsed;
      return cache;
    }
  } catch {
    // Unreadable or blocked storage — start from the seed, in memory.
  }
  cache = buildSeed();
  persist();
  return cache;
}

function persist() {
  if (!cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Blocked or full storage: changes still live for this visit.
  }
}

/** Saves and tells every open screen (the sidebar lists included) to re-read. */
export function commit() {
  persist();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onResearchChange(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

/** Discards every change and goes back to the seed. */
export function resetResearchData() {
  cache = buildSeed();
  commit();
}

/* ------------------------------ Run progress ----------------------------- */

/** Publishes the version of every run whose passes have all finished. */
export function advanceRuns(): boolean {
  const store = db();
  const now = Date.now();
  let changed = false;
  for (const run of store.runs) {
    if (run.status !== "running") continue;
    const lastFinish = Math.max(...run.executions.map((e) => e.finish_after_ms));
    const doneAt = new Date(run.started_at).getTime() + lastFinish + MERGE_MS;
    if (now < doneAt) continue;
    const report = store.reports.find((r) => r.id === run.report_id);
    if (!report) continue;
    const previous = latestVersion(report.id);
    const version = buildVersion({
      report,
      number: (previous?.version_number ?? 0) + 1,
      createdAt: doneAt,
      runId: run.id,
      changeNote: previous
        ? run.custom_instructions
          ? `Re-run with added criteria: “${run.custom_instructions.slice(0, 80)}”.`
          : "Re-run: sources refreshed and confidence re-scored."
        : "First version.",
      triggeredBy: run.trigger_type === "scheduled" ? "agent" : "user",
      previous,
      drift: previous ? 2 : 0,
    });
    store.versions.push(version);
    run.status = "done";
    run.completed_at = iso(doneAt);
    run.version_id = version.id;
    report.state = report.cadence === "run_once" ? "ready" : "scheduled";
    report.updated_at = iso(doneAt);
    changed = true;
  }
  if (changed) commit();
  return changed;
}

export function latestVersion(reportId: string): StoredVersion | null {
  const list = db().versions.filter((v) => v.report_id === reportId);
  return list.reduce<StoredVersion | null>((a, v) => (!a || v.version_number > a.version_number ? v : a), null);
}

export function latestRun(reportId: string): StoredRun | null {
  const list = db().runs.filter((r) => r.report_id === reportId);
  return list.reduce<StoredRun | null>((a, r) => (!a || r.started_at > a.started_at ? r : a), null);
}

/* -------------------------------- Read model ------------------------------ */

export function modelById(id: string): ResearchModel {
  return (
    db().models.find((m) => m.id === id) ?? {
      id,
      name: "Retired model",
      provider: "llama",
      cost_tier: "low",
      avg_latency_seconds: 0,
      cost_per_run_estimate: 0,
      description: "",
      is_active: false,
    }
  );
}

export function sourceRef(id: string): ResearchSourceRef {
  const store = db();
  const s = store.sources.find((x) => x.id === id);
  const cited = store.versions.reduce((n, v) => n + v.citations.filter((c) => c.source_id === id).length, 0);
  if (!s) {
    return {
      id,
      title: "Removed source",
      url: null,
      domain: null,
      source_type: "web",
      first_seen: store.seeded_at,
      last_fetched: null,
      cited_count: cited,
      is_stale: false,
      is_paywalled: false,
      is_internal: false,
      quality_tier: "unknown",
    };
  }
  return { ...s, cited_count: cited };
}

export function executionRead(run: StoredRun, exec: StoredExecution, report: StoredReport): RunModelExecutionRead {
  const status = executionStatus(run, exec);
  const model = modelById(exec.model_id);
  const index = report.model_ids.indexOf(exec.model_id);
  const done = status === "done";
  return {
    id: exec.id,
    model_id: exec.model_id,
    model,
    status,
    duration_ms: done ? exec.finish_after_ms : null,
    cost: done ? exec.cost : null,
    error_message: null,
    body: done ? modelAnswer(resolveTopic(report), model, Math.max(0, index), run.custom_instructions) : null,
    tokens_used: done ? exec.tokens : null,
  };
}

export function versionRead(v: StoredVersion, report: StoredReport): ReportVersionRead {
  const run = v.run_id ? db().runs.find((r) => r.id === v.run_id) ?? null : null;
  return {
    ...v,
    citations: v.citations.map(({ source_id, model_id, ...c }) => ({
      ...c,
      source: sourceRef(source_id),
      surfaced_by_model: modelById(model_id),
    })),
    model_executions: run ? run.executions.map((e) => executionRead(run, e, report)) : [],
  };
}

/** Tags in the prompt plus any added explicitly. */
export function reportHashtags(prompt: string, explicit: string[] = []): string[] {
  return [...new Set([...explicit, ...extractHashtags(prompt)])];
}
