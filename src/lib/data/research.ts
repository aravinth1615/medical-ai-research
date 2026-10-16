/* Clinical-side research inputs: which patient data rides along with a deep
   search. The Research module's
   own data (models, reports, prompt library…) lives in lib/research/seed.ts. */

export type ContextSourceId = "sensors" | "medications" | "supplements" | "nutrition";

export const CONTEXT_SOURCES: { id: ContextSourceId; label: string }[] = [
  { id: "sensors", label: "Sensor Data (CGM/Watch)" },
  { id: "medications", label: "Medications" },
  { id: "supplements", label: "Supplements" },
  { id: "nutrition", label: "Nutrition / Food Log" },
];


export const DEEP_SEARCH_DEFAULT =
  "Cross-reference elevated Lp(a), Strep A IgG >30, and low Vitamin C for systemic inflammatory links...";
