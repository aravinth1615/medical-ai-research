import type {
  Cadence,
  ModelCostTier,
  ModelProvider,
  RecurringCadence,
  ReportDepth,
  ReportState,
  SourceType,
} from "./types";

/* Vocabularies, display rules and formatting for the Research module. The
   data colours below are the only colour literals the module keeps outside
   the theme — they identify a provider or a source type, not a surface. */

/** Where the module lives. Every link is built from this. */
export const RESEARCH_BASE = "/research";

export const researchRoutes = {
  newResearch: RESEARCH_BASE,
  reports: `${RESEARCH_BASE}/reports`,
  report: (title: string, id: string) => `${RESEARCH_BASE}/reports/${toReportSlug(title, id)}`,
  schedules: `${RESEARCH_BASE}/schedules`,
  sources: `${RESEARCH_BASE}/sources`,
  promptLibrary: `${RESEARCH_BASE}/prompt-library`,
  promptCategories: `${RESEARCH_BASE}/prompt-library/categories`,
  documents: `${RESEARCH_BASE}/documents`,
  folder: (id: string) => `${RESEARCH_BASE}/documents/${id}`,
  hashtag: (name: string) => `${RESEARCH_BASE}/hashtags/${encodeURIComponent(name)}`,
};

/* --------------------------------- Depth --------------------------------- */

export const DEPTHS = [
  { id: "quick", label: "Quick scan", hint: "~15 sources · 2 min", api: "quick_scan" },
  { id: "standard", label: "Standard", hint: "~60 sources · 8 min", api: "standard" },
  { id: "deep", label: "Deep dive", hint: "~250 sources · 40 min", api: "deep_dive" },
] as const;

export type DepthId = (typeof DEPTHS)[number]["id"];

/** What each depth buys beyond the source count. */
export const DEPTH_HINT: Record<DepthId, string> = {
  quick: "guideline headlines and the obvious numbers, no cross-checking",
  standard: "every claim cross-checked against a second source",
  deep: "primary trials pulled and contested findings chased to origin",
};

export const DEPTH_COST_FACTOR: Record<DepthId, number> = { quick: 0.45, standard: 1, deep: 4.6 };

export function depthToApi(d: DepthId): ReportDepth {
  return DEPTHS.find((x) => x.id === d)!.api;
}

export function depthFromApi(d: ReportDepth): DepthId {
  return DEPTHS.find((x) => x.api === d)?.id ?? "standard";
}

export const DEPTH_LABEL: Record<ReportDepth, string> = {
  quick_scan: "Quick scan",
  standard: "Standard",
  deep_dive: "Deep dive",
};

/* -------------------------------- Cadence -------------------------------- */

export const CADENCES = [
  { id: "once", label: "Run once", hint: "No schedule" },
  { id: "daily", label: "Daily", hint: "Every morning at 07:00" },
  { id: "weekly", label: "Weekly", hint: "Mondays at 07:00" },
  { id: "monthly", label: "Monthly", hint: "1st of the month" },
] as const;

export type CadenceId = (typeof CADENCES)[number]["id"];

export function toCadenceId(c: Cadence): CadenceId {
  return c === "run_once" ? "once" : c;
}

export function fromCadenceId(c: CadenceId): Cadence {
  return c === "once" ? "run_once" : c;
}

export function cadenceMeta(c: Cadence) {
  return CADENCES.find((x) => x.id === toCadenceId(c))!;
}

/* ------------------------------ Source types ----------------------------- */

export const SOURCE_KINDS: { id: SourceType; label: string; color: string }[] = [
  { id: "academic", label: "Academic", color: "#818CF8" },
  { id: "web", label: "Web", color: "#38BDF8" },
  { id: "news", label: "News", color: "#F472B6" },
  { id: "filings", label: "Guidelines", color: "#FBBF24" },
  { id: "social", label: "Social", color: "#FB923C" },
  { id: "internal", label: "Internal", color: "#34D399" },
];

export function sourceKind(t: SourceType) {
  return SOURCE_KINDS.find((k) => k.id === t) ?? SOURCE_KINDS[1];
}

/* -------------------------------- Providers ------------------------------ */

const PROVIDER_STYLE: Record<
  ModelProvider,
  { accent: string; badgeBg: string; badgeText: string; letter: string; label: string; group: string }
> = {
  google: { accent: "#6366F1", badgeBg: "rgba(99, 102, 241, 0.14)", badgeText: "#818CF8", letter: "G", label: "Google", group: "Google" },
  anthropic: { accent: "#F59E0B", badgeBg: "rgba(245, 158, 11, 0.14)", badgeText: "#FBBF24", letter: "A", label: "Anthropic", group: "Anthropic" },
  openai: { accent: "#10B981", badgeBg: "rgba(16, 185, 129, 0.14)", badgeText: "#34D399", letter: "O", label: "OpenAI", group: "OpenAI" },
  llama: { accent: "#3B82F6", badgeBg: "rgba(59, 130, 246, 0.14)", badgeText: "#60A5FA", letter: "M", label: "Meta", group: "Open Weights" },
  perplexity: { accent: "#38BDF8", badgeBg: "rgba(56, 189, 248, 0.14)", badgeText: "#38BDF8", letter: "P", label: "Perplexity", group: "Perplexity" },
  xai: { accent: "#F97316", badgeBg: "rgba(249, 115, 22, 0.14)", badgeText: "#FB923C", letter: "X", label: "xAI", group: "xAI" },
};

const FALLBACK_STYLE = {
  accent: "#9CA3AF",
  badgeBg: "rgba(156, 163, 175, 0.14)",
  badgeText: "#D1D5DB",
  letter: "?",
  label: "Model",
  group: "Other",
};

export function providerStyle(provider: ModelProvider | string | null | undefined) {
  return (provider && PROVIDER_STYLE[provider as ModelProvider]) || FALLBACK_STYLE;
}

const COST_TIER_LABEL: Record<ModelCostTier, string> = {
  low: "Low cost",
  medium: "Mid cost",
  high: "High cost",
};

export function costTierLabel(tier: ModelCostTier | string | null | undefined): string {
  return (tier && COST_TIER_LABEL[tier as ModelCostTier]) || "Standard";
}

/* -------------------------------- Reports -------------------------------- */

export const STATE_LABEL: Record<ReportState, string> = {
  draft: "Draft",
  running: "Running",
  ready: "Ready",
  scheduled: "Scheduled",
  failed: "Failed",
};

/** Confidence bands, 0–100. */
export function confidenceAccent(v: number): string {
  if (v >= 80) return "#34D399";
  if (v >= 65) return "#38BDF8";
  if (v >= 50) return "#FBBF24";
  return "#F87171";
}

export function confidenceLabel(v: number): string {
  if (v >= 80) return "High";
  if (v >= 65) return "Good";
  if (v >= 50) return "Moderate";
  return "Low";
}

export function formatSeconds(s: number): string {
  const t = Math.round(s);
  return t < 90 ? `${t}s` : `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, "0")}s`;
}

/** At most 80 characters, cut on a word, never mid-emoji. */
export function clipTitle(text: string, atWord = false): string {
  const chars = Array.from(text);
  if (chars.length <= 80) return text;
  const cut = chars.slice(0, 77).join("");
  const space = atWord ? cut.lastIndexOf(" ") : -1;
  return `${(space > 40 ? cut.slice(0, space) : cut).replace(/[\s,.;:—-]+$/, "")}…`;
}

/** A report named after its library prompt, else its prompt's first words
 *  (#tags left out). */
export function fallbackTitle(prompt: string, libraryTitle?: string | null): string {
  if (libraryTitle?.trim()) return clipTitle(libraryTitle.trim());
  const plain = prompt.replace(/\s+/g, " ").trim();
  const tags = /(^|\s)#(?=[\p{L}\p{N}\p{M}_-]*\p{L})[\p{L}\p{N}\p{M}_-]+/gu;
  const text = plain.replace(tags, " ").replace(/\s+/g, " ").trim() || plain;
  return clipTitle(text, true);
}

/* ---------------------------------- Time --------------------------------- */

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function relativeFuture(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 60_000) return "any moment";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `in ${mins} minute${mins === 1 ? "" : "s"}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fullDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const WEEKDAYS = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

/** "Every day at 07:00 UTC" / "Mondays at 07:00 UTC" / "1st of the month, 07:00 UTC". */
export function scheduleWindow(nextRunAt: string, cadence: RecurringCadence): string {
  const d = new Date(nextRunAt);
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
  if (cadence === "daily") return `Every day at ${time} UTC`;
  if (cadence === "weekly") return `${WEEKDAYS[d.getUTCDay()]} at ${time} UTC`;
  const day = d.getUTCDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} of the month, ${time} UTC`;
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* --------------------------------- Slugs --------------------------------- */

const ID_TAIL = /(rpt_[a-z0-9]+)$/i;

/** "lp-a-risk-review-rpt_ab12" — readable in the breadcrumb, with the real id
 *  kept at the end so a rename never breaks a link. */
export function toReportSlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug ? `${slug}-${id}` : id;
}

export function extractReportId(slug: string): string | null {
  return decodeURIComponent(slug).match(ID_TAIL)?.[1] ?? null;
}

/* -------------------------------- Hashtags ------------------------------- */

const MAX_HASHTAG_LENGTH = 50;

/** The #tags in a prompt — `#` then letters, digits, `_` or `-`, lower-cased,
 *  at least one letter. Not tags: `# Heading`, `C#`, `#123`. */
export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const found = new Set<string>();
  const pattern = /(?<![\p{L}\p{N}\p{M}_#&/])#([\p{L}\p{N}][\p{L}\p{N}\p{M}_-]*)/gu;
  for (const match of text.matchAll(pattern)) {
    if ([...match[1]].length > MAX_HASHTAG_LENGTH) continue;
    const tag = match[1].replace(/[_-]+$/, "").toLowerCase();
    if (/\p{L}/u.test(tag)) found.add(tag);
  }
  return [...found];
}

/** A tag typed into a tag box → what's stored ("#Lp-a risk" → "lp-a"). */
export function normalizeHashtagInput(raw: string): string {
  const stripped = raw.trim().replace(/^#+/, "");
  const match = stripped.match(/^[\p{L}\p{N}][\p{L}\p{N}\p{M}_-]*/u);
  if (!match) return "";
  const tag = match[0].slice(0, MAX_HASHTAG_LENGTH).replace(/[_-]+$/, "").toLowerCase();
  return /\p{L}/u.test(tag) ? tag : "";
}
