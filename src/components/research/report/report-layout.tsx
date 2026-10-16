"use client";

import * as React from "react";
import { CircleAlert, CircleCheck, Info, Sparkles } from "@/lib/icons";
import { confidenceAccent, fullDate, providerStyle, shortDate } from "@/lib/research/format";
import type { CitationRead, ReportVersionRead, ReportVersionSection, ReportVersionSummary, ResearchModel } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { ConfidenceBar, renderWithCitations } from "@/components/research/ui/primitives";
import { LabPanelLinks } from "@/components/report/report-nav";

/* The research report in the clinical Report page's layout: a left section
   nav, a Master AI synthesis card with KPI tiles and priority cards, and one
   panel card per section — the same vocabulary as the combined lab report. */

const stripMarkers = (text: string) => text.replace(/\s*(\[\d+\])+/g, "");
const firstSentence = (text: string) => stripMarkers(text.split(/\n\n/)[0].split(/(?<=\.)\s/)[0] ?? text);

/* ------------------------------ Evidence bands ----------------------------- */

/** A section's evidence band — the research equivalent of Red / Yellow / Green. */
export type Band = "red" | "yellow" | "green";

export function bandOf(confidence: number | null): Band {
  if (confidence == null || confidence < 70) return "red";
  if (confidence < 80) return "yellow";
  return "green";
}

const BAND = {
  red: {
    label: "Needs review",
    priority: "Priority 1",
    card: "border-red-500/30 bg-red-500/[0.07]",
    pill: "border-red-500/40 bg-red-500/15 text-red-300",
    nav: "bg-red-500/15 text-red-300",
    icon: CircleAlert,
  },
  yellow: {
    label: "Moderate evidence",
    priority: "Priority 2",
    card: "border-amber-500/30 bg-amber-500/[0.07]",
    pill: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    nav: "bg-amber-500/15 text-amber-300",
    icon: Info,
  },
  green: {
    label: "Well supported",
    priority: "Priority 3",
    card: "border-white/[0.08] bg-void",
    pill: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
    nav: "bg-emerald-500/15 text-emerald-300",
    icon: CircleCheck,
  },
} as const;

export const sectionAnchor = (s: ReportVersionSection) => `section-${s.order_index}`;

/* -------------------------------- Panel frame ------------------------------ */

/** A clinical-report card: eyebrow, title, optional right-hand slot. */
export function PanelCard({
  id,
  eyebrow,
  title,
  aside,
  summary,
  children,
  flush,
  className,
}: {
  id: string;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  aside?: React.ReactNode;
  /** The blue "✦ AI Panel Summary" strip under the header. */
  summary?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-40 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel transition-shadow hover:shadow-lg hover:shadow-black/30", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold tracking-wider text-indigo-400 uppercase">{eyebrow}</p>
          <h3 className="mt-0.5 text-[17px] font-extrabold text-gray-100">{title}</h3>
        </div>
        {aside && <div className="flex flex-wrap items-center gap-2">{aside}</div>}
      </div>
      {summary && (
        <div className="flex items-start gap-2.5 border-b border-white/[0.06] bg-indigo-500/[0.07] px-5 py-3 text-[12.5px] text-gray-300">
          <strong className="flex shrink-0 items-center gap-1 whitespace-nowrap text-indigo-300">
            <Sparkles className="size-3.5" />
            AI Panel Summary:
          </strong>
          <span>{summary}</span>
        </div>
      )}
      <div className={cn(!flush && "p-5")}>{children}</div>
    </section>
  );
}

/* ------------------------------- Section nav ------------------------------- */

const navLink =
  "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-white/[0.04] hover:text-gray-200";
const navGroup = "mx-2 mt-4 mb-1 text-[10px] font-extrabold tracking-widest text-gray-500 uppercase";

/**
 * The AI Summary's in-page menu: the merged answer, its sections, the lab
 * panels and the clinician's workspace. Executive Summary, Model passes,
 * Sources and Versions are tabs, so they aren't repeated here.
 */
export function ReportSectionNav({
  version,
  noteCount,
  related,
  gapCount,
  onOpenGaps,
}: {
  version: ReportVersionRead | null;
  /** Lab panels this research is about — marked in the lab groups. */
  related: string[];
  noteCount: number;
  /** Gaps still open in the latest version — null hides the entry (no
   *  version yet), undefined shows it without a count (still loading). */
  gapCount?: number | null;
  onOpenGaps?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <nav
      aria-label="Report sections"
      className="sticky top-36 hidden max-h-[calc(100dvh-13rem-var(--app-footer-h))] w-64 shrink-0 flex-col gap-0.5 self-start overflow-y-auto rounded-xl border border-white/[0.08] bg-panel p-3 lg:flex"
    >
      <p className={cn(navGroup, "mt-1")}>Overview</p>
      <a href="#master-summary" className="flex items-center rounded-lg bg-indigo-500/15 px-2.5 py-1.5 text-xs font-bold text-indigo-200">
        ✦ Master AI Summary
      </a>
      {onOpenGaps && gapCount !== null && (
        <button
          type="button"
          onClick={onOpenGaps}
          aria-haspopup="dialog"
          className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-left text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/20"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <span aria-hidden className="text-amber-400">
              ⚠
            </span>
            <span className="truncate">Suggested next steps</span>
          </span>
          {gapCount != null && gapCount > 0 && (
            <span className="shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] leading-none font-bold text-[#1a1203]">{gapCount}</span>
          )}
        </button>
      )}

      {version && version.sections.length > 0 && (
        <>
          <p className={navGroup}>Report sections</p>
          {version.sections.map((s, i) => {
            const band = BAND[bandOf(s.confidence_score)];
            return (
              <a key={s.id} href={`#${sectionAnchor(s)}`} className={navLink}>
                <span className="truncate">
                  {i + 1}. {s.title}
                </span>
                {s.confidence_score != null && (
                  <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", band.nav)}>{s.confidence_score}</span>
                )}
              </a>
            );
          })}
        </>
      )}

      <LabPanelLinks related={related} />

      <p className={navGroup}>Actionable Workspace</p>
      <a href="#doctor-workspace" className={navLink}>
        ✚ Doctor Action Plan
      </a>
      <a href="#followup-workspace" className={navLink}>
        ⚲ Follow-Up Labs
      </a>
      <a href="#rerun-box" className={navLink}>
        ↻ Rerun with criteria
      </a>
      <a href="#report-notes" className={navLink}>
        <span>⚲ Audit notes</span>
        {noteCount > 0 && <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-gray-400">{noteCount}</span>}
      </a>
    </nav>
  );
}

/* --------------------------- Master AI synthesis --------------------------- */

const B = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-gray-100">{children}</strong>;

export function MasterSynthesis({
  version,
  models,
  versions,
  actions,
}: {
  version: ReportVersionRead;
  models: ResearchModel[];
  versions: ReportVersionSummary[];
  actions?: React.ReactNode;
}) {
  const sections = version.sections;
  const bands = sections.map((s) => bandOf(s.confidence_score));
  const contested = version.citations.filter((c) => c.is_contested);
  const kpis = [
    { value: version.citations.length, label: "Claims Cited Across Passes", cls: "border-white/[0.08] bg-void", text: "text-gray-100", sub: "text-gray-500" },
    { value: contested.length, label: "Red / Contested Between Models", cls: "border-red-500/30 bg-red-500/10", text: "text-red-300", sub: "text-red-300" },
    { value: bands.filter((b) => b === "yellow").length, label: "Yellow / Moderate-Evidence Sections", cls: "border-amber-500/30 bg-amber-500/10", text: "text-amber-300", sub: "text-amber-300" },
    { value: bands.filter((b) => b === "green").length, label: "Green / Well-Supported Sections", cls: "border-emerald-500/30 bg-emerald-500/10", text: "text-emerald-300", sub: "text-emerald-300" },
  ];
  // Weakest evidence first — the sections that most need a clinician's eye.
  const priorities = [...sections].sort((a, b) => (a.confidence_score ?? 0) - (b.confidence_score ?? 0));
  const history = [...versions].sort((a, b) => a.version_number - b.version_number);

  return (
    <section id="master-summary" className="@container scroll-mt-40 rounded-2xl border-2 border-indigo-500/60 bg-panel p-5 shadow-[0_0_30px_-10px_rgba(79,70,229,0.4)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
            ✦ Master AI Executive Synthesis • {models.length} Model{models.length === 1 ? "" : "s"} • v{version.version_number} ({fullDate(version.created_at)})
          </p>
          <h2 className="mt-1 text-[22px] font-extrabold text-gray-100">Merged Answer &amp; Evidence Strength</h2>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="my-4 grid grid-cols-2 gap-3 @3xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={cn("rounded-xl border p-3", k.cls)}>
            <div className={cn("font-mono text-[22px] leading-tight font-extrabold tabular-nums", k.text)}>{k.value}</div>
            <div className={cn("mt-1 text-[11px] font-semibold", k.sub)}>{k.label}</div>
          </div>
        ))}
      </div>

      {version.executive_summary && (
        <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-void p-4 text-[13.5px] leading-relaxed text-gray-200">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
            <Sparkles className="size-3.5" />
            Executive summary
            {version.confidence_score != null && (
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] tracking-normal text-indigo-300 normal-case">
                {version.confidence_score}% confidence
              </span>
            )}
          </p>
          {version.executive_summary.split(/\n\n+/).map((p, i) => (
            <p key={i}>{renderWithCitations(p)}</p>
          ))}
        </div>
      )}

      {priorities.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 @4xl:grid-cols-3">
          {priorities.map((s) => {
            const band = BAND[bandOf(s.confidence_score)];
            return (
              <a key={s.id} href={`#${sectionAnchor(s)}`} className={cn("group block rounded-xl border p-4 transition-colors hover:border-indigo-500/40", band.card)}>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold", band.pill)}>
                  <band.icon className="size-3" />
                  {band.priority} • {band.label}
                </span>
                <h3 className="my-2 text-sm font-bold text-gray-100 group-hover:text-indigo-200">{s.title}</h3>
                <p className="line-clamp-4 text-[12.5px] leading-relaxed text-gray-300">{stripMarkers(s.body.split(/\n\n/)[0])}</p>
                {s.confidence_score != null && <ConfidenceBar value={s.confidence_score} className="mt-3" />}
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/[0.08] bg-void p-4 text-[12.5px] text-gray-300">
        <B>📈 Evidence Velocity ({history.length > 1 ? `v1 → v${history[history.length - 1].version_number}` : "first version"}):</B>
        <ul className="mt-2 grid grid-cols-1 gap-2.5 @2xl:grid-cols-2">
          <li>
            • <B>Confidence:</B>{" "}
            {history.length > 1 ? (
              <>
                {history.map((v) => v.confidence_score ?? "—").join(" → ")} across {history.length} versions
              </>
            ) : (
              <>{version.confidence_score ?? "not scored"} on the first version</>
            )}
            .
          </li>
          <li>
            • <B>Models:</B> {models.map((m) => m.name).join(", ")} each answered independently before the merge.
          </li>
          <li>
            • <B>Sources:</B> {version.source_count} distinct sources behind {version.citations.length} cited claims
            {contested.length ? `, ${contested.length} contested` : ", none contested"}.
          </li>
          <li>
            • <B>Latest change:</B> {history[history.length - 1]?.change_note ?? "First version."} ({shortDate(version.created_at)})
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------ Section panels ----------------------------- */

const th = "p-3 text-[11px] font-bold tracking-wider whitespace-nowrap text-gray-500 uppercase";

/** One report section as a clinical panel: its summary strip, body and the
 *  citations it relies on. */
export function SectionPanel({
  section,
  index,
  version,
  modelNames,
}: {
  section: ReportVersionSection;
  index: number;
  version: ReportVersionRead;
  modelNames: string[];
}) {
  const band = BAND[bandOf(section.confidence_score)];
  const cited: CitationRead[] = version.citations
    .filter((c) => section.cited_numbers.includes(c.number))
    .sort((a, b) => a.number - b.number);
  const paragraphs = section.body.split(/\n\n+/);

  return (
    <PanelCard
      id={sectionAnchor(section)}
      flush
      eyebrow={`${modelNames.join(" + ")} • ${shortDate(version.created_at)} • v${version.version_number}`}
      title={`${index + 1}. ${section.title}`}
      aside={
        <>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap", band.pill)}>
            <band.icon className="size-3" />
            {band.label}
          </span>
          {section.confidence_score != null && (
            <span className="rounded-md border border-white/10 bg-void px-2.5 py-1 font-mono text-xs text-gray-400">
              Confidence {section.confidence_score}
            </span>
          )}
        </>
      }
      summary={firstSentence(section.body)}
    >
      <div className="space-y-3 px-5 py-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[14px] leading-[1.7] text-gray-200">
            {renderWithCitations(p)}
          </p>
        ))}
      </div>
      {cited.length > 0 && (
        <div className="w-full overflow-x-auto border-t border-white/[0.06]">
          <table className="w-full border-collapse text-left">
            <thead className="bg-void/80">
              <tr className="border-b border-white/[0.06]">
                <th scope="col" className={th}>#</th>
                <th scope="col" className={th}>Claim &amp; Source</th>
                <th scope="col" className={th}>Surfaced By</th>
                <th scope="col" className={th}>Confidence</th>
                <th scope="col" className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {cited.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.025]">
                  <td className="p-3 align-middle font-mono text-xs font-bold text-indigo-400">[{c.number}]</td>
                  <td className="p-3 align-middle">
                    <div className="text-[13px] font-semibold text-gray-100">{c.claim_text}</div>
                    <div className="mt-0.5 text-[11.5px] text-gray-500">
                      {c.source.url ? (
                        <a href={c.source.url} target="_blank" rel="noreferrer" className="hover:text-indigo-300 hover:underline">
                          {c.source.title}
                        </a>
                      ) : (
                        c.source.title
                      )}
                      {c.source.domain && <span className="font-mono"> · {c.source.domain}</span>}
                    </div>
                  </td>
                  <td className="p-3 align-middle text-xs whitespace-nowrap text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: providerStyle(c.surfaced_by_model.provider).accent }} />
                      {c.surfaced_by_model.name}
                    </span>
                  </td>
                  <td className="min-w-[140px] p-3 align-middle">
                    {c.confidence_score != null ? <ConfidenceBar value={c.confidence_score} /> : <span className="font-mono text-[11px] text-gray-500">—</span>}
                  </td>
                  <td className="p-3 align-middle">
                    {c.is_contested ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap text-amber-300">
                        <Info className="size-3" />
                        Contested
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold whitespace-nowrap"
                        style={{
                          color: confidenceAccent(c.confidence_score ?? 0),
                          borderColor: `${confidenceAccent(c.confidence_score ?? 0)}66`,
                          backgroundColor: `${confidenceAccent(c.confidence_score ?? 0)}1F`,
                        }}
                      >
                        <CircleCheck className="size-3" />
                        Agreed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelCard>
  );
}
