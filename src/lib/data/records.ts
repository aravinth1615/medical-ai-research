/* Patient records behind the sidebar — prior reports, treatment history and
   connected health data. Figures agree with the lab history in the combined
   report (e.g. ALT 93 → 23 → 19, Ferritin 130.8 → 59.5). */

import type { Status } from "./biomarkers";

/* ---- Previous reports ----------------------------------------------------- */

export interface PreviousReport {
  slug: string;
  file: string;
  title: string;
  date: string;
  author: string;
  pages: number;
  summary: string;
  findings: { label: string; value: string; status: Status; note: string }[];
}

export const PREVIOUS_REPORTS: PreviousReport[] = [
  {
    slug: "2025-annual-physical",
    file: "2025_Annual_Physical.pdf",
    title: "2025 Annual Physical",
    date: "08/21/2025",
    author: "Lincoln Reference Laboratory",
    pages: 14,
    summary:
      "Baseline physical with CMP, lipids, ferritin and hormones. Liver transaminases were elevated at the time of draw; every value here is a comparison point in the combined July 2026 report.",
    findings: [
      { label: "ALT (SGPT)", value: "93 U/L", status: "red", note: "High — normalized to 19 U/L by 07/08/26" },
      { label: "AST (SGOT)", value: "49 U/L", status: "yellow", note: "High — normalized to 19 U/L by 07/08/26" },
      { label: "LDL, Direct", value: "135 mg/dL", status: "red", note: "Above range — 137 mg/dL on 07/08/26" },
      { label: "Cholesterol, Total", value: "204 mg/dL", status: "yellow", note: "Above range — 209 mg/dL on 07/08/26" },
      { label: "Ferritin, Serum", value: "130.8 ng/mL", status: "green", note: "In range — declined 54.5% to 59.5 ng/mL" },
      { label: "Urea Nitrogen (BUN)", value: "21 mg/dL", status: "green", note: "In range — 27 mg/dL on 07/08/26" },
    ],
  },
  {
    slug: "q3-cardiology-summary",
    file: "Q3_Cardiology_Summary.pdf",
    title: "Q3 Cardiology Summary",
    date: "10/16/2025",
    author: "Marina Moiseyeva, FNP",
    pages: 6,
    summary:
      "Follow-up after the August transaminase elevation, with a cardiovascular risk review. Liver enzymes had largely recovered; lipid management was deferred given low inflammatory markers.",
    findings: [
      { label: "ALT (SGPT)", value: "23 U/L", status: "green", note: "Recovered from 93 U/L in August" },
      { label: "AST (SGOT)", value: "20 U/L", status: "green", note: "Recovered from 49 U/L in August" },
      { label: "Urea Nitrogen (BUN)", value: "17 mg/dL", status: "green", note: "In range" },
      { label: "Statin therapy", value: "Not indicated", status: "green", note: "Reassess with Lp(a) on the next lipid panel" },
    ],
  },
];

/* ---- Treatment: medications & supplements -------------------------------- */

export type TreatmentCategory = "medications" | "supplements";
export type TreatmentView = "current" | "past";

export interface RegimenItem {
  name: string;
  dose: string;
  schedule: string;
  reason: string;
  since: string;
  status: "active" | "pending" | "completed" | "stopped";
}

export const TREATMENT: Record<TreatmentCategory, Record<TreatmentView, RegimenItem[]>> = {
  medications: {
    current: [
      {
        name: "Targeted antimicrobial therapy",
        dose: "To be determined",
        schedule: "Pending symptom review",
        reason: "Rising Strep A IgG (>30) with possible post-streptococcal reactivity",
        since: "Proposed 07/2026",
        status: "pending",
      },
      {
        name: "Statin therapy",
        dose: "—",
        schedule: "Not started",
        reason: "LDL 137 mg/dL; not indicated given hs-CRP 0.8, HbA1c 4.9%, HDL 71",
        since: "Reviewed 07/2026",
        status: "stopped",
      },
    ],
    past: [
      {
        name: "Doxycycline",
        dose: "100 mg",
        schedule: "Twice daily, 21 days",
        reason: "Borrelia serology follow-up",
        since: "02/2026 – 03/2026",
        status: "completed",
      },
    ],
  },
  supplements: {
    current: [
      { name: "Liposomal Vitamin C", dose: "1,000–2,000 mg", schedule: "Daily, split doses", reason: "Vitamin C critical low (0.1 mg/dL)", since: "07/2026", status: "active" },
      { name: "Vitamin B5 (Pantothenic Acid)", dose: "250–500 mg", schedule: "Daily with breakfast", reason: "Vitamin B5 borderline low (36.9 ng/mL)", since: "07/2026", status: "active" },
      { name: "High-EPA/DHA Marine Omega-3", dose: "2,000–3,000 mg", schedule: "Daily with meals", reason: "OmegaCheck low (4.0%), target > 5.5%", since: "07/2026", status: "active" },
      { name: "Saccharomyces boulardii", dose: "250 mg", schedule: "Twice daily", reason: "Mucosal barrier support (ASCA IgG 21.9 U)", since: "07/2026", status: "active" },
      { name: "L-Glutamine", dose: "5 g", schedule: "Daily, empty stomach", reason: "Mucosal barrier support", since: "07/2026", status: "active" },
    ],
    past: [
      { name: "Vitamin D3", dose: "2,000 IU", schedule: "Daily", reason: "Repletion — 25-OH D now optimal at 42 ng/mL", since: "08/2025 – 06/2026", status: "completed" },
      { name: "Milk thistle (silymarin)", dose: "140 mg", schedule: "Twice daily", reason: "Liver support during ALT 93 U/L elevation", since: "08/2025 – 11/2025", status: "stopped" },
    ],
  },
};

/* ---- Connected sensors ---------------------------------------------------- */

export interface SensorMetric {
  label: string;
  value: string;
  unit?: string;
  caption: string;
  tone: "indigo" | "emerald" | "amber" | "sky";
}

export interface Sensor {
  slug: string;
  name: string;
  kind: string;
  live: boolean;
  lastSync: string;
  summary: string;
  metrics: SensorMetric[];
  /** Hourly readings for the last 24 hours, oldest first. */
  series: { label: string; unit: string; values: number[]; band: [number, number] };
  events: { time: string; text: string; tone: Status }[];
}

export const SENSORS: Sensor[] = [
  {
    slug: "dexcom-g7",
    name: "Dexcom G7",
    kind: "Continuous glucose monitor",
    live: true,
    lastSync: "Streaming · updated 2 min ago",
    summary: "Glucose has stayed in the 70–140 mg/dL target band 92% of the last 24 hours, consistent with the HbA1c of 4.9%.",
    metrics: [
      { label: "Current glucose", value: "94", unit: "mg/dL", caption: "Steady · → arrow", tone: "emerald" },
      { label: "Time in range", value: "92", unit: "%", caption: "70–140 mg/dL, last 24 h", tone: "indigo" },
      { label: "24 h average", value: "101", unit: "mg/dL", caption: "GMI 5.3%", tone: "sky" },
      { label: "Peaks over 140", value: "2", caption: "Both within 60 min of a meal", tone: "amber" },
    ],
    series: {
      label: "Glucose, last 24 h",
      unit: "mg/dL",
      band: [70, 140],
      values: [92, 90, 88, 87, 86, 88, 91, 118, 152, 131, 104, 97, 96, 128, 146, 122, 101, 95, 93, 109, 124, 106, 97, 94],
    },
    events: [
      { time: "08:40", text: "Peak 152 mg/dL — 45 min after breakfast (oat porridge, banana)", tone: "yellow" },
      { time: "14:10", text: "Peak 146 mg/dL — 50 min after lunch (white rice bowl)", tone: "yellow" },
      { time: "20:30", text: "Rise to 124 mg/dL after dinner, back in band within 40 min", tone: "green" },
    ],
  },
  {
    slug: "apple-watch-s9",
    name: "Apple Watch S9",
    kind: "Heart rate, HRV, sleep & activity",
    live: false,
    lastSync: "Last synced 2 h ago",
    summary: "Resting heart rate and HRV sit in a healthy range for age. Sleep averaged just over 7 hours this week.",
    metrics: [
      { label: "Resting heart rate", value: "58", unit: "bpm", caption: "7-day average", tone: "emerald" },
      { label: "Heart rate variability", value: "64", unit: "ms", caption: "SDNN, overnight", tone: "indigo" },
      { label: "Sleep", value: "7 h 12 m", caption: "Last night · 1 h 34 m deep", tone: "sky" },
      { label: "Steps", value: "9,840", caption: "Today · goal 10,000", tone: "amber" },
    ],
    series: {
      label: "Heart rate, last 24 h",
      unit: "bpm",
      band: [50, 100],
      values: [56, 54, 53, 52, 53, 55, 62, 78, 84, 72, 70, 74, 76, 71, 69, 92, 118, 96, 80, 74, 70, 66, 61, 58],
    },
    events: [
      { time: "16:00", text: "Workout — 42 min outdoor run, peak 162 bpm", tone: "green" },
      { time: "02:15", text: "Lowest overnight heart rate 52 bpm", tone: "green" },
    ],
  },
];

/* ---- Nutrition & food log ------------------------------------------------- */

export interface Meal {
  time: string;
  meal: "Breakfast" | "Lunch" | "Snack" | "Dinner";
  items: string;
  carbs: number;
  protein: number;
  kcal: number;
  /** Glucose peak within 2 h, from the CGM. */
  peak: number;
}

export const FOOD_LOG: { date: string; meals: Meal[] } = {
  date: "Yesterday",
  meals: [
    { time: "07:55", meal: "Breakfast", items: "Oat porridge, banana, honey", carbs: 72, protein: 11, kcal: 420, peak: 152 },
    { time: "11:00", meal: "Snack", items: "Greek yogurt, walnuts", carbs: 12, protein: 18, kcal: 240, peak: 104 },
    { time: "13:20", meal: "Lunch", items: "White rice bowl, chicken, teriyaki sauce", carbs: 88, protein: 38, kcal: 690, peak: 146 },
    { time: "19:50", meal: "Dinner", items: "Salmon, quinoa, roasted vegetables", carbs: 46, protein: 41, kcal: 610, peak: 124 },
  ],
};

export const GLUCOSE_PEAK_LIMIT = 140;
