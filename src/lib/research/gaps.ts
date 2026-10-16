import type { CitationRead, ReportVersionRead, ResearchSourceRef, SuggestionType } from "./types";

/**
 * Gap detection for "Suggested next steps" — what the backend's gap service
 * does, done here over a published version: contested claims, stale or
 * paywalled sources, thin or single-source sections, weak sources and model
 * passes that never finished. Pure and deterministic: the same version always
 * yields the same gaps, and a gap keeps its id from one version to the next
 * while it's still open — so a gap queued before a re-run publishes is still
 * recognised as queued afterwards, not offered (and queued) a second time.
 */

export interface DetectedGap {
  /** `${kind}:${key}`, keyed on what the gap is about (a citation number,
   *  a section's position, a source) — never on the version. */
  id: string;
  kind: GapKind;
  title: string;
  description: string;
  type: SuggestionType;
  /** Rough confidence the report gains once the gap is closed. */
  uplift: number;
}

export type GapKind = "contested" | "thin" | "stale" | "single-source" | "weak-source" | "paywalled" | "missing-pass";

/** Below this a section reads yellow in the report (see bandOf). */
const THIN_SECTION = 80;
/** Below this a cited claim is treated as weakly supported. */
const WEAK_CLAIM = 65;
/** Gaps listed per version — the drawer is a short, actionable list. */
const MAX_GAPS = 6;

/** Order the drawer lists kinds in: disagreement first, housekeeping last. */
const KIND_ORDER: GapKind[] = ["contested", "thin", "missing-pass", "stale", "single-source", "weak-source", "paywalled"];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/** "New England Journal of Medicine — Lp(a) lowering" → the part before the dash. */
function shortTitle(source: ResearchSourceRef): string {
  const t = source.title.split(/\s[—–-]\s/)[0].trim();
  return t.length > 64 ? `${t.slice(0, 63).trimEnd()}…` : t;
}

const where = (s: ResearchSourceRef) => (s.domain ? ` (${s.domain})` : "");
const claim = (c: CitationRead) => c.claim_text.trim().replace(/\.$/, "");
const refs = (ns: number[]) => ns.map((n) => `[${n}]`).join("");

export function detectGaps(version: ReportVersionRead): DetectedGap[] {
  const gaps: DetectedGap[] = [];
  const add = (kind: GapKind, key: string, g: Omit<DetectedGap, "id" | "kind">) =>
    gaps.push({ id: `${kind}:${key}`, kind, ...g });

  const byNumber = new Map(version.citations.map((c) => [c.number, c]));
  const citedBy = (sourceId: string) => version.citations.filter((c) => c.source.id === sourceId).map((c) => c.number);
  const flagged = new Set<number>();

  // 1 · Claims the models disagree on.
  for (const c of version.citations.filter((c) => c.is_contested)) {
    flagged.add(c.number);
    add("contested", String(c.number), {
      title: `Resolve the contested claim [${c.number}]`,
      description: `${c.surfaced_by_model.name} cited “${claim(c)}” from ${shortTitle(c.source)}${where(c.source)}, but the other passes don't back it. Have every model check it against the primary source and say whether it changes the recommendation.`,
      type: "standard",
      uplift: clamp((100 - (c.confidence_score ?? 60)) / 3, 6, 18),
    });
  }

  // 2 · Sections with thin support (yellow or red).
  for (const s of version.sections) {
    const score = s.confidence_score;
    if (score == null || score >= THIN_SECTION) continue;
    const sources = [...new Set(s.cited_numbers.map((n) => byNumber.get(n)?.source).filter(Boolean))] as ResearchSourceRef[];
    const only = sources.length === 1;
    add("thin", String(s.order_index), {
      title: `Strengthen “${s.title}” (confidence ${Math.round(score)})`,
      description: `This section rests on ${only ? "a single source" : `${sources.length} sources`}${sources.length ? ` — ${sources.map(shortTitle).join(", ")}` : ""}. Look for primary evidence — a guideline, an RCT or a repeat lab on a second assay — that would confirm or overturn it.`,
      type: score < 70 ? "deep" : "standard",
      uplift: clamp((THIN_SECTION - score) / 1.5 + 5, 5, 20),
    });
  }

  // 3 · Model passes that never finished.
  for (const e of version.model_executions.filter((e) => e.status === "failed" || e.status === "cancelled")) {
    add("missing-pass", e.model_id, {
      title: `Re-run the ${e.model.name} pass`,
      description: `${e.model.name}'s pass ${e.status === "failed" ? "failed" : "was cancelled"}, so this version was merged without it. Re-run so its answer can confirm or challenge the others.`,
      type: "quick",
      uplift: 8,
    });
  }

  // Each cited source is judged once, on its worst trait.
  const sources = new Map(version.citations.map((c) => [c.source.id, c.source]));
  for (const source of sources.values()) {
    const numbers = citedBy(source.id);
    if (source.is_stale) {
      add("stale", source.id, {
        title: `Refresh the stale source “${shortTitle(source)}”`,
        description: `Cited for ${refs(numbers)} but not re-checked recently. Re-fetch it or find a newer guideline or trial, and confirm the claims built on it still hold.`,
        type: "quick",
        uplift: clamp(4 + numbers.length * 2, 5, 12),
      });
      continue;
    }
    const weak = version.citations.filter((c) => c.source.id === source.id && !flagged.has(c.number) && (c.confidence_score ?? 100) < WEAK_CLAIM);
    if (source.quality_tier === "tertiary" || source.source_type === "social" || weak.length) {
      add("weak-source", source.id, {
        title: `Replace the weak source “${shortTitle(source)}”`,
        description: `${refs(numbers)} leans on ${source.source_type === "social" ? "a forum post" : source.quality_tier === "tertiary" ? "a tertiary summary" : "a low-confidence citation"}${where(source)}. Swap it for peer-reviewed or guideline evidence, or drop the claim.`,
        type: "quick",
        uplift: clamp(6 + weak.length * 3, 6, 12),
      });
      continue;
    }
    if (source.is_paywalled && !source.is_internal) {
      add("paywalled", source.id, {
        title: `Read “${shortTitle(source)}” beyond the abstract`,
        description: `It's paywalled, so the passes may have cited ${refs(numbers)} from the abstract alone. Check the full text — methods, population and effect size — before relying on it.`,
        type: "quick",
        uplift: 5,
      });
    }
  }

  // 4 · Sections a single source carries (not already flagged as thin).
  for (const s of version.sections) {
    if ((s.confidence_score ?? 100) < THIN_SECTION) continue;
    const ids = new Set(s.cited_numbers.map((n) => byNumber.get(n)?.source.id).filter(Boolean));
    if (ids.size !== 1) continue;
    const source = byNumber.get(s.cited_numbers[0])!.source;
    add("single-source", String(s.order_index), {
      title: `Corroborate “${s.title}” with a second source`,
      description: `Everything in this section comes from ${shortTitle(source)}${where(source)}. A second independent source would show whether the conclusion holds.`,
      type: "standard",
      uplift: 7,
    });
  }

  return gaps
    .map((g, i) => ({ g, i }))
    .sort((a, b) => KIND_ORDER.indexOf(a.g.kind) - KIND_ORDER.indexOf(b.g.kind) || a.i - b.i)
    .slice(0, MAX_GAPS)
    .map(({ g }) => g);
}

/** One line of run instructions for a queued gap. */
export function gapInstruction(g: Pick<DetectedGap, "title" | "description">): string {
  return `Investigate this gap — ${g.title.replace(/\.$/, "")}: ${g.description}`;
}
