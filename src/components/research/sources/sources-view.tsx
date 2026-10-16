"use client";

import * as React from "react";
import { CircleAlert, Download, ExternalLink, Globe, Layers, Loader, Lock, Rss, Search, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { ShareBar } from "@/components/research/ui/charts";
import {
  ModuleBody,
  ModuleCard,
  ModuleHeaderBar,
  ModuleIntro,
  ModulePage,
  StatTile,
  moduleTable,
} from "@/components/research/ui/module-shell";
import { AETHER_BUTTON, AccentBadge, MonoChip, ReportStateCard, inputClass } from "@/components/research/ui/primitives";
import { useResearch } from "@/components/research/ui/use-research";
import { useToast } from "@/components/ui/toast";
import { AddDomainDialog, KIND_ICON, type AddDomainInput } from "./add-domain-dialog";
import {
  addSourceDomain,
  exportSourcesCsv,
  fetchReports,
  fetchSourceStats,
  fetchSources,
} from "@/lib/research/service";
import type { SourceStats, SourceType } from "@/lib/research/types";
import { SOURCE_KINDS, relativeTime, shortDate, sourceKind } from "@/lib/research/format";

/** A source row, reshaped from SourceRead into the fields the table renders.
 *  `reports` (reports that currently cite it) comes straight from
 *  SourceRead.cited_by_reports. Keeps each report's id alongside its title:
 *  two reports can share the exact same title (the same question run twice),
 *  so matching/keying on title alone is not safe. */
interface SourceRow {
  id: string;
  title: string;
  /** Where the source lives; null for uploaded lab files, which have no page to open. */
  url: string | null;
  domain: string;
  kind: SourceType;
  firstSeen: string;
  lastSeen: string;
  cited: number;
  reports: { id: string; title: string }[];
  paywalled: boolean;
  stale: boolean;
}

/** The library is read in one page — the static store holds well under this. */
const PAGE_LIMIT = 200;

const TILE = "p-4 bg-[#0F111A] border-white/[0.08]";

const FILTER_SELECT = cn(inputClass, "h-8 cursor-pointer bg-[#0B0D13] hover:bg-[#141722] text-gray-200 pr-7 disabled:cursor-not-allowed disabled:opacity-50 [&_option]:bg-[#141722]");

const TH = cn(moduleTable.th, "px-3 first:pl-5 last:pr-5");
const TD = cn(moduleTable.td, "px-3 first:pl-5 last:pr-5");

const num = (n: number) => n.toLocaleString("en-US");

/** The kind colour lifted toward white, so small text and glyphs in it stay
 *  legible on the dark cards. */
function kindInk(color: string) {
  return `color-mix(in oklab, ${color} 72%, white)`;
}

export function SourcesView() {
  const sources = useResearch(() => fetchSources({ limit: PAGE_LIMIT }), []);
  const statsRes = useResearch(() => fetchSourceStats(), []);
  const reportsRes = useResearch(() => fetchReports({ limit: PAGE_LIMIT }), []);

  const [q, setQ] = React.useState("");
  const [kind, setKind] = React.useState<SourceType | "all">("all");
  const [report, setReport] = React.useState("all");

  // Export / Add a domain (header actions).
  const [exporting, setExporting] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [retrying, setRetrying] = React.useState(false);
  const show = useToast((s) => s.show);

  /** The plain CSV of the whole library (not just the rows on screen). */
  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    setActionError(null);
    try {
      await exportSourcesCsv();
      show("Source library exported as CSV");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't export the source library.");
    } finally {
      setExporting(false);
    }
  }

  /** Saves the domain, then shows it straight away at the top of the list.
   *  The save also notifies the research store, so the figures and list
   *  re-read themselves a moment later. */
  async function handleAddDomain(input: AddDomainInput) {
    const res = await addSourceDomain(input);
    if (res.error !== null) throw new Error(res.error);
    const added = res.data;
    sources.setData((prev) =>
      prev && !prev.items.some((s) => s.id === added.id)
        ? { ...prev, items: [added, ...prev.items], total: prev.total + 1 }
        : prev
    );
    setActionError(null);
    show(`Added ${added.domain ?? added.title}`);
  }

  /** Re-reads everything; the button spins until the library answers. */
  async function handleRetry() {
    setRetrying(true);
    const [sr, st, rp] = await Promise.all([
      fetchSources({ limit: PAGE_LIMIT }),
      fetchSourceStats(),
      fetchReports({ limit: PAGE_LIMIT }),
    ]);
    if (sr.data) sources.setData(sr.data);
    if (st.data) statsRes.setData(st.data);
    if (rp.data) reportsRes.setData(rp.data);
    setActionError(sr.data ? null : sr.error);
    setRetrying(false);
  }

  const loading = sources.loading || statsRes.loading;
  const error = sources.data ? null : sources.error;

  const rows: SourceRow[] = (sources.data?.items ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    // Only real web addresses become links. Citation URLs come from model
    // output, so anything that isn't http(s) is treated as having no link.
    url: s.url && /^https?:\/\//i.test(s.url) ? s.url : null,
    domain: s.domain ?? "—",
    kind: s.source_type,
    firstSeen: shortDate(s.first_seen),
    lastSeen: s.last_fetched ? relativeTime(s.last_fetched) : "Never fetched",
    cited: s.cited_count,
    reports: s.cited_by_reports.map((r) => ({ id: r.id, title: r.title })),
    paywalled: s.is_paywalled,
    stale: s.is_stale,
  }));

  // The library's figures; read from the rows if the stats call failed.
  const stats: SourceStats = statsRes.data ?? {
    total: sources.data?.total ?? rows.length,
    distinct_domains: new Set(rows.map((r) => r.domain).filter((d) => d !== "—")).size,
    paywalled_count: rows.filter((r) => r.paywalled).length,
    stale_count: rows.filter((r) => r.stale).length,
    by_type: rows.reduce<SourceStats["by_type"]>((acc, r) => ({ ...acc, [r.kind]: (acc[r.kind] ?? 0) + 1 }), {}),
  };

  const totalCitations = rows.reduce((a, r) => a + r.cited, 0);

  const mix = SOURCE_KINDS.map((k) => ({
    label: k.label,
    value: stats.by_type[k.id] ?? 0,
    color: k.color,
  })).filter((d) => d.value > 0);
  const mixTotal = mix.reduce((a, m) => a + m.value, 0);

  const needle = q.trim().toLowerCase();
  const list = rows.filter(
    (s) =>
      (kind === "all" || s.kind === kind) &&
      (report === "all" || s.reports.some((r) => r.id === report)) &&
      (!needle || s.title.toLowerCase().includes(needle) || s.domain.toLowerCase().includes(needle))
  );
  const filtered = needle !== "" || kind !== "all" || report !== "all";

  // Keyed by id, not title — two reports can share the exact same title.
  const reportOptions = (reportsRes.data?.items ?? []).filter((r) => r.source_count > 0);

  const total = stats.total;
  const domains = stats.distinct_domains;
  const paywalled = stats.paywalled_count;
  const stale = stats.stale_count;

  function clearFilters() {
    setQ("");
    setKind("all");
    setReport("all");
  }

  return (
    <ModulePage>
      <ModuleHeaderBar
        icon={<Rss />}
        title="Source Library"
        badge={loading || error ? undefined : num(total)}
        status={
          loading ? "Loading library" : error ? "Library unavailable" : `${num(total)} sources · ${num(domains)} domains`
        }
        statusTone={loading ? "amber" : error ? "gray" : "emerald"}
        actions={
          <>
            <button
              type="button"
              className={AETHER_BUTTON}
              onClick={handleExport}
              disabled={exporting || loading || !!error}
              aria-label="Export the source library as CSV"
            >
              {exporting ? <Loader className="animate-spin" /> : <Download />}
              <span className="max-sm:sr-only">{exporting ? "Exporting…" : "Export CSV"}</span>
            </button>
            <button type="button" className={AETHER_BUTTON} onClick={() => setAddOpen(true)} aria-label="Add a domain">
              <Globe className="text-indigo-400" />
              <span className="max-sm:sr-only">Add a domain</span>
            </button>
          </>
        }
      />

      <ModuleIntro
        labelIcon={<Search />}
        label="Source Library"
        title="Every reference your research runs have cited, deduplicated across reports."
        description="A source joins the library the first time a clinical claim resolves to it — a trial, a society guideline, an NIH fact sheet — and is re-checked on the schedule of the most frequent report that cites it."
        chips={
          !loading &&
          !error && (
            <>
              <MonoChip>Sources: {num(total)}</MonoChip>
              <MonoChip>Domains: {num(domains)}</MonoChip>
              <MonoChip>Citations: {num(totalCitations)}</MonoChip>
            </>
          )
        }
      />

      <AddDomainDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAddDomain} />

      <ModuleBody>
        {actionError && !error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
          >
            <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-red-400" />
            <span className="min-w-0 flex-1">{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              aria-label="Dismiss"
              className="shrink-0 text-red-300/80 hover:text-red-200"
            >
              <X className="size-3.5" />
            </button>
          </p>
        )}
        {loading ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="h-[98px] animate-pulse rounded-lg border border-white/[0.08] bg-[#0F111A]"
                />
              ))}
            </div>
            <div aria-hidden className="h-36 animate-pulse rounded-xl border border-white/[0.08] bg-[#0F111A]" />
            <div aria-hidden className="h-72 animate-pulse rounded-xl border border-white/[0.08] bg-[#0F111A]" />
            <span className="sr-only" role="status">
              Loading the source library…
            </span>
          </>
        ) : error ? (
          <ReportStateCard
            tone="red"
            icon={<CircleAlert />}
            title="Couldn't load sources"
            description={actionError ?? error}
            action={
              <button type="button" className={AETHER_BUTTON} onClick={handleRetry} disabled={retrying}>
                {retrying && <Loader className="animate-spin" />}
                {retrying ? "Retrying…" : "Try again"}
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile className={TILE} label="Sources in library" value={num(total)} caption="references in the library" />
              <StatTile
                className={TILE}
                label="Distinct domains"
                value={num(domains)}
                caption="journals, agencies and societies"
                tone="sky"
              />
              <StatTile
                className={TILE}
                label="Paywalled"
                value={num(paywalled)}
                caption="full text needs a subscription"
                tone={paywalled > 0 ? "amber" : "gray"}
              />
              <StatTile
                className={TILE}
                label="Stale"
                value={num(stale)}
                caption="not re-checked in 90 days"
                tone={stale > 0 ? "amber" : "emerald"}
              />
            </div>

            <ModuleCard
              icon={<Layers className="text-indigo-400" />}
              title="Source mix"
              aside={<span>{num(mixTotal)} references by type</span>}
            >
              <div className="space-y-4">
                <div className="overflow-hidden rounded-full bg-white/5">
                  {mix.length > 0 ? <ShareBar segments={mix} height={8} /> : <div className="h-2" aria-hidden />}
                </div>
                {mix.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {mix.map((m) => (
                      <li
                        key={m.label}
                        className="min-w-0 space-y-1 rounded-lg border border-white/[0.06] bg-[#0B0D14] px-3 py-2"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 text-xs text-gray-300">
                          <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{ background: m.color }} />
                          <span className="truncate">{m.label}</span>
                        </span>
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold text-white tabular-nums">{num(m.value)}</span>
                          <span className="font-mono text-[11px] text-gray-500 tabular-nums">
                            {Math.round((m.value / mixTotal) * 100)}%
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400">No references yet — the mix fills in as runs cite sources.</p>
                )}
                <p className="flex items-start gap-1.5 text-[11px] text-gray-500">
                  <Lock className="mt-px size-3 shrink-0" />
                  Internal sources — the patient&apos;s own lab reports and records — are never sent to a third-party
                  model
                </p>
              </div>
            </ModuleCard>

            <ModuleCard icon={<Rss className="text-indigo-400" />} title="Sources" flush>
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="Search sources"
                    placeholder="Search titles or domains…"
                    className={cn(inputClass, "h-8 pr-7 pl-8 [&::-webkit-search-cancel-button]:hidden")}
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      aria-label="Clear search"
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
                <select
                  aria-label="Filter by source type"
                  className={cn(FILTER_SELECT, "min-w-32 flex-1 sm:w-36 sm:flex-none")}
                  value={kind}
                  onChange={(e) => setKind(e.target.value as SourceType | "all")}
                >
                  <option value="all">All types</option>
                  {SOURCE_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by citing report"
                  className={cn(FILTER_SELECT, "min-w-32 flex-1 truncate sm:w-52 sm:flex-none")}
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  disabled={reportsRes.loading && !reportsRes.data}
                  title={reportsRes.error && !reportsRes.data ? "Couldn't load reports" : undefined}
                >
                  <option value="all">Any report</option>
                  {reportOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <span className="ml-auto font-mono text-xs text-gray-400 tabular-nums" aria-live="polite">
                  {list.length} of {rows.length}
                </span>
              </div>

              {list.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
                  <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-300">
                    <Search className="size-5" />
                  </div>
                  <h2 className="text-sm font-bold text-white">{rows.length === 0 ? "No sources yet" : "No sources match"}</h2>
                  <p className="max-w-md text-xs leading-relaxed text-gray-400">
                    {rows.length === 0
                      ? "References appear here once a research run cites them — or add a journal or guideline body by hand."
                      : "Nothing in the library fits those filters. The library only holds references a published claim actually resolved to — failed runs never contribute."}
                  </p>
                  <div className="mt-3">
                    {rows.length === 0 ? (
                      <button type="button" className={AETHER_BUTTON} onClick={() => setAddOpen(true)}>
                        <Globe className="text-indigo-400" />
                        Add a domain
                      </button>
                    ) : (
                      filtered && (
                        <button type="button" className={AETHER_BUTTON} onClick={clearFilters}>
                          <X />
                          Clear filters
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className={cn(moduleTable.wrap, "relative max-h-[28rem] overflow-y-auto")}>
                  <table className={moduleTable.table}>
                    <thead className={cn(moduleTable.thead, "sticky top-0 z-10 bg-[#0B0D13]")}>
                      <tr>
                        <th className={TH}>Source</th>
                        <th className={TH}>Type</th>
                        <th className={TH}>Domain</th>
                        <th className={TH}>First seen</th>
                        <th className={TH}>Last fetched</th>
                        <th className={cn(TH, "text-right")}>Cited</th>
                        <th className={TH}>Used by</th>
                        <th className={cn(TH, "w-10")}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((s) => {
                        const meta = sourceKind(s.kind);
                        const KindIcon = KIND_ICON[s.kind];
                        const noLink = s.kind === "internal" ? "No link — uploaded lab file" : "No link available";
                        return (
                          <tr key={s.id} className={cn(moduleTable.tr, "hover:bg-white/[0.025]")}>
                            <td className={TD}>
                              <span className="flex max-w-[320px] min-w-[220px] items-center gap-2.5">
                                <span
                                  aria-hidden
                                  className="flex size-7 shrink-0 items-center justify-center rounded-lg border"
                                  style={{
                                    color: kindInk(meta.color),
                                    backgroundColor: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
                                    borderColor: `color-mix(in oklab, ${meta.color} 30%, transparent)`,
                                  }}
                                >
                                  <KindIcon className="size-3.5" />
                                </span>
                                <span className="line-clamp-2 min-w-0 flex-1 leading-snug font-semibold text-gray-100">
                                  {s.title}
                                </span>
                                {s.paywalled && (
                                  <span title="Paywalled" className="shrink-0 text-gray-400">
                                    <Lock className="size-3.5" aria-hidden />
                                    <span className="sr-only">Paywalled</span>
                                  </span>
                                )}
                                {s.stale && (
                                  <span className="shrink-0 rounded border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-300">
                                    Stale
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className={TD}>
                              <AccentBadge color={kindInk(meta.color)}>{meta.label}</AccentBadge>
                            </td>
                            <td className={TD}>
                              {s.domain === "—" ? (
                                <span className="text-gray-500">—</span>
                              ) : (
                                <MonoChip className="inline-block max-w-44 truncate px-1.5 py-0.5 align-middle text-[11px]">
                                  {s.domain}
                                </MonoChip>
                              )}
                            </td>
                            <td className={cn(TD, "whitespace-nowrap tabular-nums")}>{s.firstSeen}</td>
                            <td
                              className={cn(
                                TD,
                                "whitespace-nowrap",
                                s.lastSeen === "Never fetched" ? "text-gray-500" : "text-gray-400"
                              )}
                            >
                              {s.lastSeen}
                            </td>
                            <td className={cn(TD, "text-right font-bold text-white tabular-nums")}>{s.cited}</td>
                            <td className={TD}>
                              {s.reports.length === 0 ? (
                                <span className="text-gray-500">—</span>
                              ) : (
                                <span className="flex max-w-44 min-w-0 items-center gap-1.5">
                                  <span className="min-w-0 truncate text-gray-300" title={s.reports[0].title}>
                                    {s.reports[0].title}
                                  </span>
                                  {s.reports.length > 1 && (
                                    <span
                                      className="shrink-0 rounded border border-white/10 bg-[#171A26] px-1.5 py-0.5 font-mono text-[10px] text-gray-400 tabular-nums"
                                      title={s.reports
                                        .slice(1)
                                        .map((r) => r.title)
                                        .join(", ")}
                                    >
                                      +{s.reports.length - 1}
                                      <span className="sr-only"> more</span>
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>
                            <td className={cn(TD, "text-right")}>
                              {/* Opens the cited page in a new tab. Uploaded lab
                                  files have no page (nor does a URL that isn't
                                  http/https), so the icon shows but can't be used. */}
                              {s.url ? (
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Open ${s.title} in a new tab`}
                                  title="Open source"
                                  className="inline-flex rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:outline-none"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              ) : (
                                <span
                                  role="img"
                                  aria-label={noLink}
                                  title={noLink}
                                  className="inline-flex cursor-not-allowed rounded-lg p-1.5 text-gray-600"
                                >
                                  <ExternalLink className="size-3.5" aria-hidden />
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-white/[0.06] px-4 py-3 text-[11px] text-gray-500 sm:px-5">
                <span>
                  A source leaves the library when no live version of any report cites it — citations in older
                  versions still resolve.
                </span>
                <span className="font-mono text-gray-400 tabular-nums">{num(totalCitations)} citations total</span>
              </div>
            </ModuleCard>
          </>
        )}
      </ModuleBody>
    </ModulePage>
  );
}
