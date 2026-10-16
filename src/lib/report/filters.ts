import { COMPACT_ROWS, type Deviation, type Marker, type Panel, type Status } from "@/lib/data/biomarkers";

export type DeviationFilter = Exclude<Deviation, "normal"> | "all";
export type SortOrder = "default" | "severity-desc" | "severity-asc";

export interface FilterState {
  statuses: Set<Status>;
  deviation: DeviationFilter;
  query: string;
  sort: SortOrder;
}

export const ALL_STATUSES: Status[] = ["red", "yellow", "green"];

export const initialFilters = (): FilterState => ({
  statuses: new Set(ALL_STATUSES),
  deviation: "all",
  query: "",
  sort: "default",
});

/**
 * Status chips behave like a legend: from "all on", the first click isolates
 * one status; after that clicks add and remove, and emptying it resets to all.
 */
export function toggleStatus(current: Set<Status>, status: Status): Set<Status> {
  if (current.size === ALL_STATUSES.length) return new Set([status]);
  const next = new Set(current);
  if (next.has(status)) next.delete(status);
  else next.add(status);
  return next.size === 0 ? new Set(ALL_STATUSES) : next;
}

export function isFiltering(f: FilterState): boolean {
  return f.query.trim() !== "" || f.statuses.size < ALL_STATUSES.length || f.deviation !== "all";
}

export interface Counts {
  total: number;
  red: number;
  yellow: number;
  green: number;
  highly_above: number;
  above: number;
  below: number;
}

/** Counts across every marker — the chips show totals, not filtered counts. */
export function countMarkers(panels: Panel[]): Counts {
  const c: Counts = { total: 0, red: 0, yellow: 0, green: 0, highly_above: 0, above: 0, below: 0 };
  for (const p of panels) {
    for (const m of p.markers) {
      c.total++;
      c[m.status]++;
      if (m.dev !== "normal") c[m.dev]++;
    }
  }
  return c;
}

const SEVERITY: Record<Status, number> = { red: 3, yellow: 2, green: 1 };

export interface VisiblePanel {
  panel: Panel;
  rows: Marker[];
  matched: number;
  collapsed: boolean;
  /** Rows hidden behind the "show remaining" control. */
  hidden: number;
}

export function visiblePanels(
  panels: Panel[],
  f: FilterState,
  collapsedIds: Record<string, boolean>
): VisiblePanel[] {
  const query = f.query.trim().toLowerCase();
  const filtering = isFiltering(f);

  return panels.flatMap((panel) => {
    let matched = panel.markers.filter(
      (m) =>
        f.statuses.has(m.status) &&
        (f.deviation === "all" || m.dev === f.deviation) &&
        (!query ||
          m.name.toLowerCase().includes(query) ||
          m.role.toLowerCase().includes(query) ||
          panel.title.toLowerCase().includes(query))
    );
    if (matched.length === 0) return [];

    if (f.sort !== "default") {
      const dir = f.sort === "severity-desc" ? -1 : 1;
      // Stable: equal severities keep the lab's own order.
      matched = [...matched].sort((a, b) => dir * (SEVERITY[a.status] - SEVERITY[b.status]));
    }

    // Collapsing only applies to the unfiltered view — a filter is already a
    // request to see specific rows.
    const collapsed = !filtering && Boolean(collapsedIds[panel.id]) && matched.length > COMPACT_ROWS;
    const rows = collapsed ? matched.slice(0, COMPACT_ROWS) : matched;
    return [{ panel, rows, matched: matched.length, collapsed, hidden: matched.length - rows.length }];
  });
}

/* ---- Geometry ------------------------------------------------------------ */

/** Pin position on the reference track, 5–95%. Two-sided ranges map the
 *  in-range band to 25–75%; upper-only ranges put the limit at 60%. */
export function pinPercent(m: Marker): number {
  if (m.upperOnly) return clamp((m.value / (m.max || 1)) * 60);
  const span = m.max - m.min;
  if (span <= 0) return 50;
  return clamp(25 + ((m.value - m.min) / span) * 50);
}

function clamp(n: number): number {
  return Math.max(5, Math.min(95, n));
}

export interface Trend {
  points: string;
  deltaPct: number;
}

/** Oldest → newest values with the change against the previous draw, or null
 *  when there's no prior value to compare. */
export function trendOf(m: Marker, width = 56, height = 22): Trend | null {
  const nums = [m.prev2?.val, m.prev1?.val, m.value].filter((n): n is number => typeof n === "number");
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const range = Math.max(...nums) - min || 1;
  const pad = 5;
  const points = nums
    .map((n, i) => {
      const x = pad + (i / (nums.length - 1)) * (width - pad * 2);
      const y = height - 4 - ((n - min) / range) * (height - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const prev = nums[nums.length - 2];
  const curr = nums[nums.length - 1];
  return { points, deltaPct: prev !== 0 ? ((curr - prev) / prev) * 100 : 0 };
}
