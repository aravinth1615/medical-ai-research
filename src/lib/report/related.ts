import { PANELS } from "@/lib/data/biomarkers";

/* Which lab panels a research question is about — matched on the clinical
   terms in its prompt, so a report on Lp(a) leads with the lipid panel. */

const PANEL_TERMS: Record<string, string[]> = {
  "sec-lin-lipids": ["lp(a)", "lpa", "lipoprotein", "ldl", "hdl", "cholesterol", "lipid", "ascvd", "statin", "cardio", "triglyceride", "omega", "ferritin"],
  "sec-vib-pos": ["strep", "aslo", "aso", "parvovirus", "borrelia", "lyme", "tick", "serology", "igg", "igm", "antimicrobial"],
  "sec-vib-lyme": ["borrelia", "lyme", "tick", "ospa", "c6"],
  "sec-vib-ig": ["immunoglobulin", "iga", "ige", "igm", "humoral", "allerg"],
  "sec-qls-vit": ["vitamin", "ascorbic", "pantothenic", "b5", "micronutrient", "supplement", "repletion", "coq10"],
  "sec-qls-gi": ["asca", "celiac", "ttg", "gut", "gi ", "mucosal", "calprotectin", "boulardii", "crohn", "bowel"],
  "sec-lin-cmp": ["bun", "alt", "ast", "liver", "kidney", "creatinine", "egfr", "glucose", "metabolic", "cgm", "hydration"],
};

/** Panel ids related to a prompt, in report order. Empty when none match. */
export function relatedPanelIds(prompt: string): string[] {
  const text = ` ${prompt.toLowerCase()} `;
  return PANELS.map((p) => p.id).filter((id) => (PANEL_TERMS[id] ?? []).some((term) => text.includes(term)));
}
