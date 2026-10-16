/* Executive summary content — the out-of-bounds view of the combined report. */

export interface DeviationRow {
  name: string;
  role: string;
  value: string;
  unit: string;
  /** Scale labels above the bar, low → high. */
  scale: string[];
  /** Bar fill, 0–100. */
  fill: number;
  /** Deficiencies fill from the right — the gap below the floor. */
  fromRight?: boolean;
}

export const CRITICAL_DEVIATIONS: DeviationRow[] = [
  { name: "Lp(a) [Lipoprotein (a)]", role: "Atherogenic lipoprotein particle", value: "67.0", unit: "mg/dL", scale: ["Ref: 10.0", "30.0", "Max"], fill: 95 },
  { name: "LDL, Direct", role: "Low-density lipoprotein cholesterol", value: "137", unit: "mg/dL", scale: ["Ref: 0", "100", "Max"], fill: 85 },
  { name: "Streptococcal A IgG", role: "Group A Strep IgG (Molecular mimicry)", value: "31.0", unit: "Index", scale: ["Ref: ≤ 10.0", "Max"], fill: 90 },
  { name: "Parvovirus B19 VLP VP2 IgG", role: "Viral capsid protein", value: "21.5", unit: "Index", scale: ["Ref: ≤ 10.0", "Max"], fill: 75 },
  { name: "OmegaCheck (EPA+DPA+DHA)", role: "Cardioprotective Omega-3 index", value: "4.0", unit: "%", scale: ["Min", "Ref: > 5.4"], fill: 60, fromRight: true },
  { name: "Vitamin C (Ascorbic Acid)", role: "Water-soluble antioxidant", value: "0.1", unit: "mg/dL", scale: ["Min", "Ref: 0.2", "2.1"], fill: 20 },
];

export const BORDERLINE_DEVIATIONS: DeviationRow[] = [
  { name: "Urea Nitrogen (BUN)", role: "Protein turnover & hydration status", value: "27", unit: "mg/dL", scale: ["Ref: 7", "25", "Max"], fill: 80 },
  { name: "S. cerevisiae Ab (ASCA IgG)", role: "Equivocal 20.1–29.9", value: "21.9", unit: "U", scale: ["Ref: ≤ 20.0", "Max"], fill: 65 },
  { name: "Cholesterol, Total", role: "Total circulating cholesterol", value: "209", unit: "mg/dL", scale: ["Ref: 100", "< 200", "Max"], fill: 70 },
  { name: "Borrelia burgdorferi C6 peptide IgG", role: "Conserved VlsE C6 invariant region", value: "14.9", unit: "Index", scale: ["Ref: ≤ 10.0", "Max"], fill: 55 },
  { name: "Vitamin B5 (Pantothenic Acid)", role: "Coenzyme A (CoA) precursor", value: "36.9", unit: "ng/mL", scale: ["Min", "Ref: 37", "250"], fill: 15 },
];

export interface SeverityBar {
  label: string;
  value: string;
  /** Relative severity, 0–100. */
  severity: number;
  tone: "red" | "yellow";
}

export const ELEVATED_SEVERITY: SeverityBar[] = [
  { label: "Lp(a)", value: "67.0", severity: 95, tone: "red" },
  { label: "Strep A IgG", value: "31.0", severity: 90, tone: "red" },
  { label: "Direct LDL", value: "137", severity: 85, tone: "red" },
  { label: "BUN", value: "27", severity: 80, tone: "yellow" },
  { label: "Parvovirus B19", value: "21.5", severity: 75, tone: "red" },
  { label: "Total Chol", value: "209", severity: 70, tone: "yellow" },
  { label: "ASCA IgG", value: "21.9", severity: 65, tone: "yellow" },
  { label: "Borrelia burgdorferi", value: "14.9", severity: 55, tone: "yellow" },
];

export const DEFICIENT_SEVERITY: SeverityBar[] = [
  { label: "Vitamin C (Deficiency)", value: "0.1", severity: 95, tone: "red" },
  { label: "Vitamin B5 (Deficiency)", value: "36.9", severity: 85, tone: "yellow" },
  { label: "OmegaCheck (Deficiency)", value: "4.0%", severity: 80, tone: "red" },
];

export interface PlanItem {
  lead: string;
  text: string;
}

export const DIAGNOSTICS_PLAN: PlanItem[] = [
  { lead: "Immediate:", text: "Draw Fibrinogen Activity in Light Blue Top (NaCit) tube (TNP on prior report). Verify Final ANCA Screen result." },
  { lead: "60-Day Retest:", text: "Repeat Plasma Vitamin C (freeze at -70°C) and Vitamin B5. Conduct Fecal Calprotectin & Secretory IgA Stool Panel to correlate with ASCA IgG elevation (21.9 U)." },
  { lead: "90-Day Retest:", text: "Run ASLO & Anti-DNase B Strep Titers, repeat Vibrant Tickborne 2.0 Serology, and OmegaCheck® Whole-Blood Panel with Direct LDL." },
];

export const TREATMENT_PLAN: PlanItem[] = [
  { lead: "Infectious/Immune:", text: "Correlate rising Strep A IgG (>30) and Parvovirus B19 IgG with joint, fatigue, or neuro symptoms. Discuss targeted antimicrobial or immunomodulatory therapy if active." },
  { lead: "Supplementation:", text: "Start Liposomal Vitamin C (1,000–2,000 mg/day) and Vitamin B5 (250–500 mg/day). Introduce High-EPA/DHA Marine Omega-3 (2,000–3,000 mg/day) to improve OmegaCheck." },
  { lead: "GI Health:", text: "Use broad-spectrum digestive enzymes with meals. Consider Saccharomyces boulardii or spore-based probiotics and L-glutamine for mucosal barrier support." },
  { lead: "Cardio/Lipid Watch:", text: "Monitor genetic Lp(a) (67.0 mg/dL). No statin indicated for LDL 137 mg/dL due to excellent hs-CRP (0.8), HbA1c (4.9%), and HDL (71)." },
];
