/* Lab panels for the combined report — the three source reports
   (Vibrant America, QLS, Lincoln Reference), 07/08/2026 – 07/09/2026. */

export type Status = "red" | "yellow" | "green";
export type Deviation = "highly_above" | "above" | "below" | "normal";

export interface PriorValue {
  val: number;
  date: string;
}

export interface Marker {
  name: string;
  role: string;
  value: number;
  /** Shown instead of `value` when the lab reports a bound (">30", "<1.0"). */
  displayValue?: string;
  unit: string;
  rangeText: string;
  min: number;
  max: number;
  /** Only an upper limit is defined (≤ x). */
  upperOnly?: boolean;
  status: Status;
  badge: string;
  dev: Deviation;
  prev1?: PriorValue | null;
  prev2?: PriorValue | null;
}

export interface Panel {
  id: string;
  lab: string;
  title: string;
  date: string;
  accession: string;
  collapsible: boolean;
  defaultCollapsed?: boolean;
  aiSummary: string;
  markers: Marker[];
}

/** Rows shown before a collapsible panel asks to expand. */
export const COMPACT_ROWS = 6;

/** Vibrant serology index: ≤ 10 normal, 10–20 moderate, > 20 high-risk. */
function vSero(
  name: string,
  role: string,
  val: number,
  prevVal: number | null,
  prevDate = "02/05/2026",
  disp?: string
): Marker {
  let status: Status = "green";
  let badge = "Normal";
  let dev: Deviation = "normal";
  if (val > 20.0) {
    status = "red";
    badge = "Highly Above Average";
    dev = "highly_above";
  } else if (val > 10.0) {
    status = "yellow";
    badge = "Above Average";
    dev = "above";
  }
  return {
    name,
    role,
    value: val,
    displayValue: disp,
    unit: "Index",
    rangeText: "≤ 10.0",
    min: 0,
    max: 10.0,
    upperOnly: true,
    status,
    badge,
    dev,
    prev1: prevVal !== null ? { val: prevVal, date: prevDate } : null,
    prev2: null,
  };
}

export const PANELS: Panel[] = [
  {
    id: "sec-vib-ig",
    lab: "Vibrant America Clinical Laboratory",
    title: "1A. Total Immunoglobulins Panel",
    date: "2026-07-09",
    accession: "[REDACTED ID]",
    collapsible: false,
    aiSummary:
      "All four immunoglobulin classes are well within healthy control ranges, ruling out humoral immune deficiency or hyper-IgE allergic surges.",
    markers: [
      { name: "Total IgA", role: "Mucosal immune defense", value: 215, unit: "mg/dL", rangeText: "61 - 356", min: 61, max: 356, status: "green", badge: "Normal", dev: "normal" },
      { name: "Total IgG", role: "Systemic humoral protection", value: 1148, unit: "mg/dL", rangeText: "767 - 1590", min: 767, max: 1590, status: "green", badge: "Normal", dev: "normal" },
      { name: "Total IgE", role: "Allergic immune response", value: 10.9, unit: "IU/mL", rangeText: "≤ 87", min: 0, max: 87, upperOnly: true, status: "green", badge: "Normal", dev: "normal" },
      { name: "Total IgM", role: "Primary acute-phase response", value: 80, unit: "mg/dL", rangeText: "45 - 281", min: 45, max: 281, status: "green", badge: "Normal", dev: "normal" },
    ],
  },
  {
    id: "sec-vib-pos",
    lab: "Vibrant Wellness Tickborne 2.0",
    title: "1B. Tickborne Diseases 2.0 — Elevated Summary",
    date: "2026-07-09",
    accession: "[REDACTED ID]",
    collapsible: false,
    aiSummary:
      "Streptococcal A IgG (>30) and Parvovirus B19 IgG are in the Red High-Risk zone (>20), while Borrelia burgdorferi C6 peptide IgG (14.9) and B. bavariensis VlsE1 IgM are in the Yellow Moderate zone.",
    markers: [
      vSero("Streptococcal A — IgG", "Group A Strep IgG (Molecular mimicry)", 31.0, 20.6, "02/05/2026", ">30"),
      vSero("Parvovirus B19 VLP VP2 — IgG", "Viral capsid protein VP2 IgG", 21.5, 16.6),
      vSero("Parvovirus B19 VLP VP1/Vp2 Co Capsid — IgG", "Combined VP1/VP2 capsid IgG", 20.1, 16.8),
      vSero("Borrelia burgdorferi C6 peptide — IgG", "Conserved VlsE C6 invariant region IgG", 14.9, 12.1),
      vSero("Borrelia bavariensis VlsE1 — IgM", "Eurasian Borrelia complex VlsE1 IgM (Decreased)", 11.0, 23.1),
    ],
  },
  {
    id: "sec-vib-lyme",
    lab: "Vibrant Wellness Tickborne 2.0",
    title: "1C. Lyme Disease & Borrelia Species (Select Rows)",
    date: "2026-07-09",
    accession: "[REDACTED ID]",
    collapsible: true,
    defaultCollapsed: true,
    aiSummary:
      "Previously elevated B. burgdorferi p31 OspA IgM (11.5 → 3.3) and p58 IgM (11.9 → 4.5) have normalized into the Green zone.",
    markers: [
      vSero("Borrelia burgdorferi p31 (OspA) — IgM", "Outer surface protein A (Normalized)", 3.3, 11.5),
      vSero("Borrelia burgdorferi p58 — IgM", "58 kDa protein (Normalized)", 4.5, 11.9),
      vSero("Borrelia burgdorferi C6 peptide — IgG", "Sixth invariant region C6 of VlsE", 14.9, 12.1),
    ],
  },
  {
    id: "sec-qls-gi",
    lab: "Quality Laboratory Service",
    title: "2B. Gastrointestinal & Autoimmune Serology",
    date: "2026-07-08",
    accession: "[REDACTED ID]",
    collapsible: false,
    aiSummary: "Celiac disease markers are completely negative. Saccharomyces cerevisiae (ASCA) IgG is mildly elevated at 21.9 U.",
    markers: [
      { name: "S. cerevisiae Ab (ASCA IgG)", role: "Anti-Saccharomyces cerevisiae IgG", value: 21.9, unit: "U", rangeText: "≤ 20.0", min: 0, max: 20.0, upperOnly: true, status: "yellow", badge: "Above Average", dev: "above" },
      { name: "Tissue Transglutaminase (tTG) IgA Ab", role: "Primary Celiac disease screen", value: 0.5, displayValue: "<1.0", unit: "U/mL", rangeText: "< 15.0", min: 0, max: 15.0, upperOnly: true, status: "green", badge: "Normal", dev: "normal" },
    ],
  },
  {
    id: "sec-qls-vit",
    lab: "Quality Laboratory Service",
    title: "2C. Comprehensive Vitamins & Coenzyme Q10",
    date: "2026-07-08",
    accession: "[REDACTED ID]",
    collapsible: false,
    aiSummary: "Critically low Vitamin C (0.1 mg/dL) and borderline low Vitamin B5 (36.9 ng/mL). Other vitamins optimal.",
    markers: [
      { name: "Vitamin C (Ascorbic Acid)", role: "Water-soluble antioxidant", value: 0.1, unit: "mg/dL", rangeText: "0.2 - 2.1", min: 0.2, max: 2.1, status: "red", badge: "Critical Low", dev: "below" },
      { name: "Vitamin B5 (Pantothenic Acid)", role: "Coenzyme A (CoA) precursor", value: 36.9, unit: "ng/mL", rangeText: "37 - 250", min: 37, max: 250, status: "yellow", badge: "Below Average", dev: "below" },
      { name: "Vitamin D, 25-Hydroxy", role: "Calciferol store", value: 42, unit: "ng/mL", rangeText: "30 - 100", min: 30, max: 100, status: "green", badge: "Normal", dev: "normal" },
    ],
  },
  {
    id: "sec-lin-cmp",
    lab: "Lincoln Reference Laboratory",
    title: "3B. Comprehensive Metabolic Panel (CMP)",
    date: "2026-07-08",
    accession: "[REDACTED ID]",
    collapsible: false,
    aiSummary: "ALT, AST, Potassium, and Glucose have completely normalized since last year. BUN is mildly elevated at 27 mg/dL.",
    markers: [
      { name: "Urea Nitrogen (BUN)", role: "Protein turnover & hydration status", value: 27, unit: "mg/dL", rangeText: "7 - 25", min: 7, max: 25, status: "yellow", badge: "Above Average", dev: "above", prev1: { val: 17, date: "10/16/2025" }, prev2: { val: 21, date: "08/21/2025" } },
      { name: "ALT (SGPT)", role: "Hepatic transaminase (Normalized)", value: 19, unit: "U/L", rangeText: "7 - 52", min: 7, max: 52, status: "green", badge: "Normal", dev: "normal", prev1: { val: 23, date: "10/16/2025" }, prev2: { val: 93, date: "08/21/2025" } },
      { name: "AST (SGOT)", role: "Hepatic/muscular transaminase (Normalized)", value: 19, unit: "U/L", rangeText: "13 - 39", min: 13, max: 39, status: "green", badge: "Normal", dev: "normal", prev1: { val: 20, date: "10/16/2025" }, prev2: { val: 49, date: "08/21/2025" } },
    ],
  },
  {
    id: "sec-lin-lipids",
    lab: "Lincoln Reference Laboratory",
    title: "3C. Lipid Panel w/ Direct LDL & Lipoprotein(a)",
    date: "2026-07-08",
    accession: "[REDACTED ID]",
    collapsible: false,
    aiSummary: "Lp(a) is elevated at 67.0 mg/dL, Direct LDL is 137 mg/dL, and Total Cholesterol is 209 mg/dL. HDL improved to 71 mg/dL.",
    markers: [
      { name: "Lp(a) [Lipoprotein (a)], Serum", role: "Genetically determined atherogenic particle", value: 67.0, unit: "mg/dL", rangeText: "10.0 - 30.0", min: 10.0, max: 30.0, status: "red", badge: "Highly Above Average", dev: "highly_above" },
      { name: "LDL, Direct", role: "Direct low-density lipoprotein cholesterol", value: 137, unit: "mg/dL", rangeText: "0 - 100", min: 0, max: 100, upperOnly: true, status: "red", badge: "Above Average", dev: "above", prev2: { val: 135, date: "08/21/2025" } },
      { name: "Cholesterol, Total", role: "Total circulating cholesterol", value: 209, unit: "mg/dL", rangeText: "< 200", min: 100, max: 200, status: "yellow", badge: "Above Average", dev: "above", prev2: { val: 204, date: "08/21/2025" } },
      { name: "Ferritin, Serum", role: "Intracellular iron storage protein (Declined)", value: 59.5, unit: "ng/mL", rangeText: "38 - 380", min: 38, max: 380, status: "green", badge: "Normal", dev: "normal", prev2: { val: 130.8, date: "08/21/2025" } },
    ],
  },
];

/** The lab each panel belongs to, in report order. */
export const LAB_GROUPS: { label: string; labs: string[] }[] = [
  { label: "1. Vibrant America", labs: ["Vibrant America Clinical Laboratory", "Vibrant Wellness Tickborne 2.0"] },
  { label: "2. QLS Laboratory", labs: ["Quality Laboratory Service"] },
  { label: "3. Lincoln Reference", labs: ["Lincoln Reference Laboratory"] },
];
