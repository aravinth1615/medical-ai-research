/* The patient on file. Identifiers stay redacted — the report is shown the
   way it leaves the PII scrubber. */

export const PATIENT = {
  label: "[REDACTED NAME]",
  initials: "MD",
  demographics: "Male • 22 yrs • 66 in • 145 lbs",
  dob: "[REDACTED DOB]",
  phone: "[REDACTED PHONE]",
  email: "[REDACTED EMAIL]",
  address: "[REDACTED ADDRESS]",
  provider: "Marina Moiseyeva, FNP",
  sources: [
    { label: "Vibrant ID", id: "[REDACTED]", date: "07/09/26" },
    { label: "QLS ID", id: "[REDACTED]", date: "07/08/26" },
  ],
} as const;

export const REPORT_KPIS = {
  total: 290,
  red: 7,
  yellow: 7,
  green: 276,
};

export interface FollowUpLab {
  id: string;
  text: string;
  when: string;
}

export const FOLLOW_UP_LABS: FollowUpLab[] = [
  { id: "fibrinogen", text: "Fibrinogen Activity (Draw in Light Blue Top tube)", when: "Immediate / Redraw" },
  { id: "vit-c-b5", text: "Repeat Plasma Vitamin C (freeze at -70°C) + Vitamin B5", when: "Retest in 60 Days" },
  { id: "omegacheck", text: "Repeat OmegaCheck® Whole-Blood Panel", when: "Retest in 90 Days" },
];

export const DOCTOR_PLAN_DEFAULTS = {
  nextSteps:
    "- Correlate rising Strep A IgG (>30), Parvovirus B19 IgG, and persistent B. burgdorferi C6 peptide IgG (14.9) with clinical symptoms.\n- Evaluate GI mucosal health given equivocal ASCA IgG (21.9 U).",
  prescriptions:
    "- Discuss targeted antimicrobial therapy if symptoms of post-streptococcal reactivity are active.\n- No statin indicated at age 22 for isolated LDL 137 mg/dL (hs-CRP is 0.8), but monitor genetically elevated Lp(a) (67.0 mg/dL).",
  supplements:
    "- Liposomal or Buffered Vitamin C: 1,000–2,000 mg/day (addresses 0.1 mg/dL critical low).\n- Vitamin B5 (Pantothenic Acid): 250–500 mg/day (addresses 36.9 ng/mL low).\n- High-EPA/DHA Marine Omega-3 (Triglyceride form): 2,000–3,000 mg/day to lift OmegaCheck from 4.0% to >5.5%.",
};

export type DoctorPlan = typeof DOCTOR_PLAN_DEFAULTS;
