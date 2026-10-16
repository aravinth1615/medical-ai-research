/* Research module records — the same shapes the ai_research backend returns
   (oneplace-v2 lib/research/analytics.ts), so `api.ts` can switch from the
   static store to real requests without any screen changing. */

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Every service call resolves to one of these — never throws for an API
 *  failure, so a screen handles errors in one place. */
export type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

/* --------------------------------- Models -------------------------------- */

export type ModelProvider = "anthropic" | "openai" | "google" | "perplexity" | "xai" | "llama";
export type ModelCostTier = "low" | "medium" | "high";

export interface ResearchModel {
  id: string;
  name: string;
  provider: ModelProvider;
  cost_tier: ModelCostTier;
  avg_latency_seconds: number;
  cost_per_run_estimate: number;
  description: string;
  is_active: boolean;
}

export interface ReportEstimate {
  estimated_time_seconds: number;
  estimated_cost_usd: number;
  per_model: Record<string, number>;
}

/* -------------------------------- Reports -------------------------------- */

export type ReportState = "draft" | "running" | "ready" | "scheduled" | "failed";
export type ReportDepth = "quick_scan" | "standard" | "deep_dive";
export type Cadence = "run_once" | "daily" | "weekly" | "monthly";
export type RecurringCadence = Exclude<Cadence, "run_once">;

export type SourceType = "web" | "news" | "filings" | "social" | "academic" | "internal";
export type SourceQualityTier = "primary" | "secondary" | "tertiary" | "unknown";

export interface ResearchSourceRef {
  id: string;
  title: string;
  url: string | null;
  domain: string | null;
  source_type: SourceType;
  first_seen: string;
  last_fetched: string | null;
  cited_count: number;
  is_stale: boolean;
  is_paywalled: boolean;
  is_internal: boolean;
  quality_tier: SourceQualityTier;
}

export interface CitationRead {
  id: string;
  /** The [n] marker used in the report body. */
  number: number;
  source: ResearchSourceRef;
  surfaced_by_model: ResearchModel;
  claim_text: string;
  is_contested: boolean;
  created_at: string;
  human_score: number | null;
  confidence_score: number | null;
}

export interface ReportVersionSection {
  id: string;
  order_index: number;
  title: string;
  body: string;
  confidence_score: number | null;
  cited_numbers: number[];
}

export interface ReportVersionSummary {
  id: string;
  version_number: number;
  confidence_score: number | null;
  source_count: number;
  change_note: string | null;
  created_at: string;
  claims_added: number;
  claims_removed: number;
  triggered_by: "agent" | "user";
}

export interface ReportVersionRead extends ReportVersionSummary {
  body: string;
  executive_summary: string | null;
  sections: ReportVersionSection[];
  citations: CitationRead[];
  model_executions: RunModelExecutionRead[];
}

export interface OwnerRef {
  id: string;
  email: string;
  full_name: string | null;
}

export interface ReportRead {
  id: string;
  title: string;
  prompt: string;
  state: ReportState;
  depth: ReportDepth;
  cadence: Cadence;
  owner_id: string;
  owner: OwnerRef;
  current_version_id: string | null;
  version_count: number;
  latest_confidence_score: number | null;
  source_count: number;
  selected_models: ResearchModel[];
  created_at: string;
  updated_at: string;
}

export interface ReportDetail extends ReportRead {
  current_version: ReportVersionRead | null;
  attached_sources: ResearchSourceRef[];
  hashtags: string[];
}

export interface ReportStats {
  total: number;
  draft: number;
  running: number;
  ready: number;
  scheduled: number;
  failed: number;
  mean_confidence: number | null;
  reports_delta_pct: number | null;
  confidence_trend: number[];
  confidence_delta_pct: number | null;
  running_now: { title: string; model_count: number } | null;
  scheduled_breakdown: Record<RecurringCadence, number>;
}

export interface ReportAttachmentInput {
  title: string;
  url?: string;
  source_type?: SourceType;
  is_internal?: boolean;
  /** An already-created source (an uploaded file, a report turned source). */
  source_id?: string;
}

export interface CreateReportInput {
  title: string;
  prompt: string;
  model_ids: string[];
  depth: ReportDepth;
  cadence: Cadence;
  attachments?: ReportAttachmentInput[];
  hashtags?: string[];
}

/* ---------------------------------- Runs --------------------------------- */

export type ExecutionStatus = "queued" | "running" | "done" | "failed" | "cancelled";

export interface RunModelExecutionRead {
  id: string;
  model_id: string;
  model: ResearchModel;
  status: ExecutionStatus;
  duration_ms: number | null;
  cost: number | null;
  error_message: string | null;
  body: string | null;
  tokens_used: number | null;
}

export interface RunRead {
  id: string;
  report_id: string;
  report_version_id: string | null;
  trigger_type: "manual" | "scheduled";
  status: ExecutionStatus;
  total_cost: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  custom_instructions: string | null;
  model_executions: RunModelExecutionRead[];
}

export interface RunReportOptions {
  custom_prompt?: string;
  model_ids?: string[];
  /** Saved notes folded into this run's instructions. */
  note_ids?: string[];
  /** Linked to the report for this run and every later one. */
  attachments?: ReportAttachmentInput[];
  /** Added to the report's tags. */
  hashtags?: string[];
}

/* ------------------------- Suggested next steps ------------------------- */

export type SuggestionType = "quick" | "standard" | "deep";
/** "added" — queued for the report's next run. */
export type SuggestionStatus = "suggested" | "added";

/** A gap detected in the report's latest version (contested claims, stale
 *  sources, thin evidence), queueable for the next run. */
export interface SuggestedNextStep {
  id: string;
  report_id: string;
  report_version_id: string;
  title: string;
  description: string;
  type: SuggestionType;
  /** null renders as "Potential confidence gain". */
  estimated_confidence_uplift: number | null;
  priority: number;
  status: SuggestionStatus;
}

/** A gap queued for the next run, kept with its text. */
export interface QueuedSuggestion {
  id: string;
  title: string;
  description: string;
}

export interface ReportNoteRead {
  id: string;
  content: string;
  created_by: { id: string; full_name: string | null; email: string } | null;
  created_at: string;
  updated_at: string;
}

/* -------------------------------- Sources -------------------------------- */

export interface SourceRead extends ResearchSourceRef {
  cited_by_reports: { id: string; title: string }[];
}

export interface SourceStats {
  total: number;
  distinct_domains: number;
  paywalled_count: number;
  stale_count: number;
  by_type: Partial<Record<SourceType, number>>;
}

export interface AddSourceInput {
  title: string;
  url: string;
  source_type?: SourceType;
  is_paywalled?: boolean;
  is_internal?: boolean;
}

/* ----------------------------- Prompt library ---------------------------- */

export interface PromptCategoryRef {
  id: string;
  name: string;
}

export interface PromptTemplateRead {
  id: string;
  title: string;
  description: string | null;
  prompt: string;
  category: PromptCategoryRef | null;
  created_by: OwnerRef | null;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplateInput {
  title: string;
  description?: string | null;
  prompt: string;
  category_id?: string | null;
}

export interface PromptCategoryRead {
  id: string;
  name: string;
  description: string | null;
  /** Templates currently assigned to it. */
  template_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromptCategoryInput {
  name: string;
  description?: string | null;
}

/* -------------------------------- Schedules ------------------------------ */

export interface ScheduleRead {
  id: string;
  report_id: string;
  cadence: RecurringCadence;
  next_run_at: string;
  last_run_at: string | null;
  is_active: boolean;
  version_count: number;
  failure_count_30d: number;
}

export interface ScheduleStats {
  active_count: number;
  runs_this_month: number;
  next_run_at: string | null;
  failures_30d: number;
}

/* -------------------------------- Documents ------------------------------ */

export interface FolderRead {
  id: string;
  name: string;
  document_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentRead {
  id: string;
  folder_id: string | null;
  original_filename: string;
  content_type: string | null;
  size_bytes: number;
  created_at: string;
}

/* -------------------------------- Hashtags ------------------------------- */

export interface HashtagRead {
  /** Lower-cased, without the "#". */
  name: string;
  report_count: number;
  last_used_at: string;
}

export interface HashtagReportRead {
  id: string;
  title: string;
  state: ReportState;
  summary: string | null;
  latest_confidence_score: number | null;
  source_count: number;
  created_at: string;
  updated_at: string;
}
