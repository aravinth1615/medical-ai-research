import type { IconComponent } from "@/lib/icons";
import {
  FileText,
  Flame,
  Flask,
  Home,
  Leaf,
  Pill,
  PieChart,
  Sliders,
  Sparkles,
  TestTube,
  Wifi,
} from "@/lib/icons";
import { PREVIOUS_REPORTS, SENSORS } from "@/lib/data/records";
import { researchRoutes } from "@/lib/research/format";

/** Each sidebar section keeps its own hue — the records read as distinct
 *  areas at a glance. Values are classes so Tailwind can see them. */
export type NavTone = "rose" | "amber" | "indigo" | "teal" | "emerald" | "orange" | "violet" | "sky";

export const TONE_CLASSES: Record<NavTone, { text: string; hover: string; active: string; rule: string }> = {
  rose: { text: "text-rose-400", hover: "hover:bg-rose-500/10", active: "bg-rose-500/12 text-rose-200", rule: "border-rose-500/20" },
  amber: { text: "text-amber-400", hover: "hover:bg-amber-500/10", active: "bg-amber-500/12 text-amber-200", rule: "border-amber-500/20" },
  indigo: { text: "text-indigo-400", hover: "hover:bg-indigo-500/10", active: "bg-indigo-500/15 text-indigo-200", rule: "border-indigo-500/25" },
  teal: { text: "text-teal-400", hover: "hover:bg-teal-500/10", active: "bg-teal-500/12 text-teal-200", rule: "border-teal-500/20" },
  emerald: { text: "text-emerald-400", hover: "hover:bg-emerald-500/10", active: "bg-emerald-500/12 text-emerald-200", rule: "border-emerald-500/20" },
  orange: { text: "text-orange-400", hover: "hover:bg-orange-500/10", active: "bg-orange-500/12 text-orange-200", rule: "border-orange-500/20" },
  violet: { text: "text-violet-400", hover: "hover:bg-violet-500/10", active: "bg-violet-500/12 text-violet-200", rule: "border-violet-500/20" },
  sky: { text: "text-sky-400", hover: "hover:bg-sky-500/10", active: "bg-sky-500/12 text-sky-200", rule: "border-sky-500/20" },
};

export interface NavLeaf {
  label: string;
  href: string;
  /** A live device shows a pulsing dot. */
  live?: boolean;
  /** A connected-but-idle device shows a grey dot. */
  device?: boolean;
}

export interface NavItem {
  label: string;
  icon: IconComponent;
  tone: NavTone;
  /** A direct link… */
  href?: string;
  /** Match only this exact path (New Research would otherwise match every
   *  /research/* page). */
  exact?: boolean;
  /** …or a collapsible group of links. */
  children?: NavLeaf[];
  defaultOpen?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** First in the sidebar, on its own — no section heading. */
export const NAV_PRIMARY: NavItem = {
  label: "New Research",
  icon: Sparkles,
  tone: "indigo",
  href: researchRoutes.newResearch,
  exact: true,
};

/** The sidebar sections between New Research and Preference. */
export const NAV: NavSection[] = [
  {
    label: "Patient Records",
    items: [
      { label: "Blood Labs", icon: TestTube, tone: "rose", href: "/records/blood-labs" },
      {
        label: "Previous Reports",
        icon: FileText,
        tone: "amber",
        defaultOpen: true,
        children: PREVIOUS_REPORTS.map((r) => ({ label: r.file, href: `/records/reports/${r.slug}` })),
      },
    ],
  },
  {
    label: "Treatment & Protocol",
    items: [
      {
        label: "Medications",
        icon: Pill,
        tone: "indigo",
        defaultOpen: true,
        children: [
          { label: "Current Regimen", href: "/treatment/medications/current" },
          { label: "Past History", href: "/treatment/medications/past" },
        ],
      },
      {
        label: "Supplements",
        icon: Leaf,
        tone: "teal",
        children: [
          { label: "Current Regimen", href: "/treatment/supplements/current" },
          { label: "Past History", href: "/treatment/supplements/past" },
        ],
      },
    ],
  },
  {
    label: "Digital Health Data",
    items: [
      {
        label: "Connected Sensors",
        icon: Wifi,
        tone: "emerald",
        defaultOpen: true,
        children: SENSORS.map((s) => ({
          label: s.live ? `${s.name} (Live)` : s.name,
          href: `/health-data/sensors/${s.slug}`,
          live: s.live,
          device: true,
        })),
      },
      { label: "Nutrition & Food Log", icon: Flame, tone: "orange", href: "/health-data/nutrition" },
    ],
  },
];

/** Last in the sidebar, on its own: the research module's settings pages,
 *  collapsed until opened (or until one of its pages is the current one). */
export const NAV_PREFERENCE: NavItem = {
  label: "Preference",
  icon: Sliders,
  tone: "violet",
  children: [
    { label: "Schedule", href: researchRoutes.schedules },
    { label: "Source", href: researchRoutes.sources },
    { label: "Prompt Library", href: researchRoutes.promptLibrary },
    { label: "Document", href: researchRoutes.documents },
  ],
};

/* -------------------------------- Research -------------------------------- */

/** Every Research page, for the breadcrumb trail. */
const RESEARCH_PAGES: { label: string; href: string; exact?: boolean }[] = [
  { label: "New Research", href: researchRoutes.newResearch, exact: true },
  { label: "Reports", href: researchRoutes.reports },
  { label: "Schedule", href: researchRoutes.schedules },
  { label: "Source", href: researchRoutes.sources },
  { label: "Prompt Library", href: researchRoutes.promptLibrary },
  { label: "Document", href: researchRoutes.documents },
];

/** Research routes get the Research breadcrumb trail. */
export function suiteFor(pathname: string): "research" | "clinical" {
  return isActivePath(pathname, "/research") ? "research" : "clinical";
}

/** Workspace pages outside the sidebar menu — named here for the top bar's
 *  breadcrumb. Home is New Research. */
export const VIEWS: { label: string; short: string; href: string; icon: IconComponent; exact?: boolean }[] = [
  { label: "Home", short: "Home", href: researchRoutes.newResearch, icon: Home, exact: true },
  { label: "Executive Summary", short: "Summary", href: "/summary", icon: PieChart },
  { label: "Report", short: "Report", href: "/report", icon: Flask },
];

export function isActivePath(pathname: string, href: string, exact = false): boolean {
  return pathname === href || (!exact && pathname.startsWith(href + "/"));
}

/** "lp-a-67-mg-dl-rpt_ab12" → "Lp a 67 mg dl" — a readable leaf for the trail. */
function readableSlug(segment: string): string {
  const text = decodeURIComponent(segment).replace(/-?(rpt|fld)_[a-z0-9]+$/i, "").replace(/-/g, " ").trim();
  if (!text) return "";
  const clipped = text.length > 48 ? `${text.slice(0, 48).trimEnd()}…` : text;
  return clipped[0].toUpperCase() + clipped.slice(1);
}

/** Readable trail for the current route, for the top bar and page titles. */
export function crumbsFor(pathname: string): string[] {
  if (suiteFor(pathname) === "research") {
    const item = [...RESEARCH_PAGES]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => isActivePath(pathname, i.href, i.exact));
    if (!item) return ["Research"];
    const rest = pathname.slice(item.href.length).split("/").filter(Boolean);
    const leaf = rest.length ? (rest[0] === "categories" ? "Categories" : readableSlug(rest[rest.length - 1])) : "";
    return leaf ? ["Research", item.label, leaf] : ["Research", item.label];
  }
  const view = VIEWS.find((v) => isActivePath(pathname, v.href, v.exact));
  if (view) return ["Workspace", view.label];
  for (const section of NAV) {
    for (const item of section.items) {
      if (item.href && isActivePath(pathname, item.href, item.exact)) return [section.label, item.label];
      const leaf = item.children?.find((c) => isActivePath(pathname, c.href));
      if (leaf) return [section.label, item.label, leaf.label];
    }
  }
  return ["Workspace"];
}
