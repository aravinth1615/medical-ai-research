import type { ModelProvider, ResearchModel, SourceQualityTier, SourceType } from "./types";

/* Static seed for the Research module. Every figure here agrees with the
   patient on file (combined report, July 2026) so research reads as part of
   the same chart: Lp(a) 67.0 mg/dL, LDL 137, OmegaCheck 4.0%, Strep A IgG
   >30, Vitamin C 0.1 mg/dL, B5 36.9 ng/mL, ASCA IgG 21.9 U, CGM peaks 152 and
   146 mg/dL. Replace with API data once the backend is connected. */

/* --------------------------------- Models -------------------------------- */

export const SEED_MODELS: ResearchModel[] = [
  {
    id: "mdl_claude_sonnet_5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    cost_tier: "high",
    avg_latency_seconds: 7,
    cost_per_run_estimate: 0.18,
    description: "Strong long-form reasoning and synthesis; best for nuanced, well-cited clinical analysis.",
    is_active: true,
  },
  {
    id: "mdl_gemini_2_5_pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    cost_tier: "medium",
    avg_latency_seconds: 5,
    cost_per_run_estimate: 0.1,
    description: "Large context window with native web-grounding citations.",
    is_active: true,
  },
  {
    id: "mdl_gpt_5_1",
    name: "GPT-5.1",
    provider: "openai",
    cost_tier: "high",
    avg_latency_seconds: 5,
    cost_per_run_estimate: 0.16,
    description: "Broad general-purpose reasoning with strong instruction following.",
    is_active: true,
  },
  {
    id: "mdl_grok_4",
    name: "Grok 4",
    provider: "xai",
    cost_tier: "medium",
    avg_latency_seconds: 6,
    cost_per_run_estimate: 0.12,
    description: "Fast reasoning with access to recently published studies.",
    is_active: true,
  },
  {
    id: "mdl_llama_4",
    name: "Llama 4 Maverick",
    provider: "llama",
    cost_tier: "low",
    avg_latency_seconds: 4,
    cost_per_run_estimate: 0.03,
    description: "Open-weights model for quick, low-cost first passes over the literature.",
    is_active: true,
  },
];

/** Picked for a new run unless the user changes them. */
export const DEFAULT_MODEL_PROVIDERS: ModelProvider[] = ["google", "openai"];

/* -------------------------------- Sources -------------------------------- */

export interface SeedSource {
  id: string;
  title: string;
  url: string | null;
  domain: string | null;
  source_type: SourceType;
  quality_tier: SourceQualityTier;
  is_paywalled?: boolean;
  is_stale?: boolean;
  is_internal?: boolean;
  /** Days before the seed date it was first seen. */
  age_days: number;
}

export const SEED_SOURCES: SeedSource[] = [
  { id: "src_eas_lpa", title: "Lipoprotein(a) in atherosclerotic cardiovascular disease — EAS consensus statement", url: "https://academic.oup.com/eurheartj/article/43/39/3925/6670882", domain: "academic.oup.com", source_type: "academic", quality_tier: "primary", age_days: 41 },
  { id: "src_aha_chol", title: "2018 AHA/ACC Guideline on the Management of Blood Cholesterol", url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625", domain: "ahajournals.org", source_type: "filings", quality_tier: "primary", age_days: 41 },
  { id: "src_nejm_lpa", title: "Lipoprotein(a) lowering in persons with cardiovascular disease", url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1905239", domain: "nejm.org", source_type: "academic", quality_tier: "primary", is_paywalled: true, age_days: 40 },
  { id: "src_jacc_omega", title: "Omega-3 index and risk of cardiovascular events", url: "https://www.jacc.org/doi/10.1016/j.jacc.2021.01.008", domain: "jacc.org", source_type: "academic", quality_tier: "secondary", is_paywalled: true, age_days: 38 },
  { id: "src_stat_lpa", title: "Lp(a)-lowering therapies move into late-stage outcome trials", url: "https://www.statnews.com/2026/05/lpa-outcome-trials", domain: "statnews.com", source_type: "news", quality_tier: "tertiary", age_days: 12 },
  { id: "src_ada_cgm", title: "Standards of Care in Diabetes — Glycemic Targets", url: "https://diabetesjournals.org/care/article/48/Supplement_1/S128", domain: "diabetesjournals.org", source_type: "filings", quality_tier: "primary", age_days: 30 },
  { id: "src_pubmed_cgm", title: "Postprandial glycemic responses in normoglycemic adults measured by CGM", url: "https://pubmed.ncbi.nlm.nih.gov/31337649/", domain: "pubmed.ncbi.nlm.nih.gov", source_type: "academic", quality_tier: "primary", age_days: 29 },
  { id: "src_cell_glycemic", title: "Personalized nutrition by prediction of glycemic responses", url: "https://www.cell.com/cell/fulltext/S0092-8674(15)01481-6", domain: "cell.com", source_type: "academic", quality_tier: "primary", is_paywalled: true, age_days: 29 },
  { id: "src_cdc_gas", title: "Group A Streptococcal (GAS) Disease — Clinical Guidance", url: "https://www.cdc.gov/group-a-strep/hcp/clinical-guidance/", domain: "cdc.gov", source_type: "web", quality_tier: "primary", age_days: 22 },
  { id: "src_idsa_strep", title: "IDSA guideline for the diagnosis and management of Group A streptococcal pharyngitis", url: "https://academic.oup.com/cid/article/55/10/e86/321183", domain: "academic.oup.com", source_type: "filings", quality_tier: "primary", age_days: 22 },
  { id: "src_bmj_aso", title: "Interpreting antistreptolysin O and anti-DNase B titres", url: "https://www.bmj.com/content/aso-dnase-interpretation", domain: "bmj.com", source_type: "academic", quality_tier: "secondary", is_paywalled: true, is_stale: true, age_days: 210 },
  { id: "src_cdc_lyme", title: "Lyme Disease — Clinical Testing Guidance", url: "https://www.cdc.gov/lyme/hcp/diagnosis-testing/", domain: "cdc.gov", source_type: "web", quality_tier: "primary", age_days: 22 },
  { id: "src_ods_vitc", title: "Vitamin C — Fact Sheet for Health Professionals", url: "https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/", domain: "ods.od.nih.gov", source_type: "web", quality_tier: "primary", age_days: 18 },
  { id: "src_ods_b5", title: "Pantothenic Acid — Fact Sheet for Health Professionals", url: "https://ods.od.nih.gov/factsheets/PantothenicAcid-HealthProfessional/", domain: "ods.od.nih.gov", source_type: "web", quality_tier: "primary", age_days: 18 },
  { id: "src_nutrients_vitc", title: "Vitamin C and immune function", url: "https://www.mdpi.com/2072-6643/9/11/1211", domain: "mdpi.com", source_type: "academic", quality_tier: "secondary", age_days: 17 },
  { id: "src_acg_crohn", title: "ACG Clinical Guideline: Management of Crohn's Disease in Adults", url: "https://journals.lww.com/ajg/fulltext/2025/crohns_guideline", domain: "journals.lww.com", source_type: "filings", quality_tier: "primary", is_paywalled: true, age_days: 9 },
  { id: "src_asca_meta", title: "ASCA as a serological marker in inflammatory bowel disease — a meta-analysis", url: "https://pubmed.ncbi.nlm.nih.gov/16454846/", domain: "pubmed.ncbi.nlm.nih.gov", source_type: "academic", quality_tier: "secondary", age_days: 9 },
  { id: "src_wjg_boulardii", title: "Saccharomyces boulardii in gastrointestinal disease", url: "https://www.wjgnet.com/1007-9327/full/v16/i18/2202.htm", domain: "wjgnet.com", source_type: "academic", quality_tier: "secondary", is_stale: true, age_days: 260 },
  { id: "src_reddit_cgm", title: "Patient forum: CGM readings after white rice vs. quinoa", url: "https://www.reddit.com/r/ContinuousGlucose/comments/rice_vs_quinoa", domain: "reddit.com", source_type: "social", quality_tier: "tertiary", age_days: 6 },
  { id: "src_internal_labs", title: "Combined lab report — Vibrant, QLS, Lincoln (Jul 2026)", url: null, domain: null, source_type: "internal", quality_tier: "primary", is_internal: true, age_days: 5 },
];

/* ------------------------------ Report topics ----------------------------- */

export interface TopicCitation {
  n: number;
  source: string;
  claim: string;
  contested?: boolean;
  confidence: number;
}

export interface Topic {
  id: string;
  keywords: string[];
  title: string;
  prompt: string;
  hashtags: string[];
  executive_summary: string;
  sections: { title: string; body: string; confidence: number }[];
  citations: TopicCitation[];
  /** One headline per model pass — each model leads with a different angle. */
  angles: string[];
  findings: string[];
  contested: string;
}

export const TOPICS: Topic[] = [
  {
    id: "lpa",
    keywords: ["lp(a)", "lpa", "lipoprotein", "ldl", "ascvd", "cholesterol", "lipid", "cardio", "statin", "omega", "heart"],
    title: "Lp(a) 67 mg/dL — 10-year cardiovascular risk review",
    prompt:
      "Summarize the 10-year ASCVD risk for a 22-year-old male with Lp(a) 67.0 mg/dL, direct LDL 137 mg/dL, HDL 71, hs-CRP 0.8 and OmegaCheck 4.0%. Should therapy start now? #lipids #cardiology",
    hashtags: ["lipids", "cardiology"],
    executive_summary:
      "Lp(a) of 67.0 mg/dL sits above the 50 mg/dL threshold at which guidelines treat it as a risk-enhancing factor [1][2], and it is genetically fixed — lifestyle will not move it [1]. At age 22 the conventional 10-year ASCVD estimate is low, so the decision is about lifetime risk rather than the next decade.\n\nThe offsetting markers are strong: HDL 71, hs-CRP 0.8 mg/L and HbA1c 4.9% [5]. The models agree that a statin is not indicated now for an isolated LDL of 137 mg/dL; they differ on whether to lower the LDL target given the Lp(a) [2][3].",
    sections: [
      {
        title: "What Lp(a) 67 mg/dL means",
        body:
          "Lp(a) above 50 mg/dL (roughly 125 nmol/L) is listed as a risk enhancer that favours earlier or more intensive LDL lowering [2]. About 20% of the population carries a level this high, and the level is set by the LPA gene — diet and exercise change it very little [1].\n\nOutcome trials of dedicated Lp(a)-lowering drugs are still running; none is approved for primary prevention yet [3][4].",
        confidence: 88,
      },
      {
        title: "LDL 137 mg/dL in context",
        body:
          "With hs-CRP 0.8 mg/L, triglycerides 74 mg/dL and HDL 71 mg/dL, the inflammatory and metabolic picture is favourable [5]. Guidelines reserve statins in adults under 40 for LDL ≥ 160 mg/dL or a strong family history [2]. A lower personal LDL goal (< 100 mg/dL) through diet is reasonable given the Lp(a) [1].",
        confidence: 81,
      },
      {
        title: "Omega-3 index 4.0%",
        body:
          "An omega-3 index below 4% is associated with higher cardiovascular event rates in cohort data; 8% or more is considered protective [6]. Raising it with 2–3 g/day of EPA+DHA is low-risk and measurable on the 90-day retest [6].",
        confidence: 72,
      },
      {
        title: "Recommended plan",
        body:
          "Repeat a lipid panel with apoB in 90 days, document family history of premature ASCVD, and screen first-degree relatives for Lp(a) [1][2]. Consider a coronary artery calcium score only after age 35–40 [2]. Revisit therapy if apoB stays above 90 mg/dL [5].",
        confidence: 79,
      },
    ],
    citations: [
      { n: 1, source: "src_eas_lpa", claim: "Lp(a) is genetically determined and largely unaffected by lifestyle.", confidence: 92 },
      { n: 2, source: "src_aha_chol", claim: "Lp(a) ≥ 50 mg/dL is a risk-enhancing factor; statins under 40 are reserved for LDL ≥ 160 mg/dL.", confidence: 90 },
      { n: 3, source: "src_nejm_lpa", claim: "Antisense therapy lowers Lp(a) by up to 80%; outcome benefit is not yet proven.", contested: true, confidence: 70 },
      { n: 4, source: "src_stat_lpa", claim: "Several Lp(a)-lowering drugs are in phase 3 outcome trials.", confidence: 64 },
      { n: 5, source: "src_internal_labs", claim: "HDL 71, hs-CRP 0.8 mg/L, HbA1c 4.9%, triglycerides 74 mg/dL.", confidence: 98 },
      { n: 6, source: "src_jacc_omega", claim: "An omega-3 index under 4% is associated with higher event rates.", confidence: 74 },
    ],
    angles: [
      "Lifetime risk matters more than the 10-year score at 22.",
      "Lp(a) is a risk enhancer, not a treatment trigger on its own.",
      "Favourable hs-CRP and HDL argue for watchful waiting.",
      "Track apoB — it is the better target than LDL here.",
      "Family screening is the highest-value next step.",
    ],
    findings: [
      "Lp(a) 67.0 mg/dL exceeds the 50 mg/dL risk-enhancer threshold.",
      "No statin indicated for isolated LDL 137 mg/dL at age 22.",
      "hs-CRP 0.8 mg/L and HDL 71 mg/dL are protective.",
      "Omega-3 index 4.0% is low; target 8% with EPA+DHA.",
      "Repeat lipids with apoB in 90 days; screen relatives for Lp(a).",
    ],
    contested:
      "Whether to set an LDL goal below 100 mg/dL now, or wait for apoB and family history, is where the models split.",
  },
  {
    id: "cgm",
    keywords: ["cgm", "glucose", "dexcom", "carb", "food", "meal", "spike", "glycemic", "nutrition", "sugar", "diet"],
    title: "CGM spikes vs. food log — trigger carbohydrates",
    prompt:
      "Cross-reference yesterday's food log with the Dexcom G7 trace and identify which carbohydrates drove the 152 and 146 mg/dL peaks. #cgm #nutrition",
    hashtags: ["cgm", "nutrition"],
    executive_summary:
      "Both glucose excursions above 140 mg/dL followed high-glycemic, low-fibre meals: oat porridge with banana and honey (72 g carbohydrate, peak 152 mg/dL) and a white-rice teriyaki bowl (88 g, peak 146 mg/dL) [5]. The quinoa dinner with similar protein peaked at 124 mg/dL [5].\n\nTime in range was 92% and HbA1c is 4.9%, so these are normal postprandial responses rather than dysglycemia [1][2] — but they are a clean signal for meal ordering and carbohydrate swaps.",
    sections: [
      {
        title: "Peaks and their meals",
        body:
          "08:40 — 152 mg/dL, 45 minutes after breakfast; 14:10 — 146 mg/dL, 50 minutes after lunch [5]. Both returned to the 70–140 mg/dL band within 90 minutes, which is typical for normoglycemic adults [2].",
        confidence: 91,
      },
      {
        title: "Why these carbohydrates",
        body:
          "Instant oats, ripe banana, honey and white rice are rapidly digested starches and sugars with little fibre or fat to slow absorption [2][3]. Individual responses to the same food vary widely, so this patient's own CGM data is a better guide than a glycemic-index table [3].",
        confidence: 78,
      },
      {
        title: "Practical swaps",
        body:
          "Eat the protein and vegetables before the starch; swap instant oats for steel-cut oats with nuts; replace half the white rice with quinoa or lentils; take a 10-minute walk after lunch [2][3]. Anecdotal reports agree, but they are not evidence on their own [4].",
        confidence: 70,
      },
    ],
    citations: [
      { n: 1, source: "src_ada_cgm", claim: "Time in range above 70% is the standard target; this patient is at 92%.", confidence: 93 },
      { n: 2, source: "src_pubmed_cgm", claim: "Healthy adults commonly peak above 140 mg/dL after high-carbohydrate meals and recover within 2 hours.", confidence: 86 },
      { n: 3, source: "src_cell_glycemic", claim: "Glycemic responses to identical meals vary widely between individuals.", confidence: 84 },
      { n: 4, source: "src_reddit_cgm", claim: "Users report lower peaks after swapping white rice for quinoa.", contested: true, confidence: 41 },
      { n: 5, source: "src_internal_labs", claim: "Peaks 152 and 146 mg/dL; quinoa dinner peak 124 mg/dL; HbA1c 4.9%.", confidence: 97 },
    ],
    angles: [
      "Breakfast is the larger lever — 72 g of fast carbohydrate.",
      "Meal order matters as much as meal content.",
      "These are normal responses, not prediabetes.",
      "Quinoa dinner is the patient's own control meal.",
      "A post-lunch walk is the cheapest intervention.",
    ],
    findings: [
      "Breakfast peak 152 mg/dL after oats, banana and honey (72 g carbs).",
      "Lunch peak 146 mg/dL after a white-rice bowl (88 g carbs).",
      "Quinoa dinner peaked at 124 mg/dL with similar protein.",
      "Time in range 92%; HbA1c 4.9% — no dysglycemia.",
      "Swap instant oats and half the rice; eat protein first.",
    ],
    contested: "Whether 140 mg/dL peaks in a normoglycemic adult need any intervention at all is debated.",
  },
  {
    id: "strep",
    keywords: ["strep", "aslo", "aso", "parvovirus", "borrelia", "lyme", "igg", "tick", "infect", "serology", "antimicrobial", "pandas"],
    title: "Strep A IgG >30 — post-streptococcal reactivity evidence",
    prompt:
      "Strep A IgG rose from 20.6 to >30 with Parvovirus B19 IgG 21.5 and Borrelia C6 IgG 14.9, but all 36 PCR targets are negative. What does the evidence say about post-streptococcal reactivity and when is antimicrobial therapy justified? #serology #infectious-disease",
    hashtags: ["serology", "infectious-disease"],
    executive_summary:
      "A rising Strep A IgG without positive PCR points to past exposure and an ongoing antibody response, not an active infection [1][5]. Guidelines do not recommend antibiotics on serology alone; treatment follows a confirmed active infection or a clinical syndrome such as rheumatic fever [2].\n\nThe recommended next step is ASLO and anti-DNase B titres to time the exposure, correlated with joint, cardiac or neurological symptoms [3]. Parvovirus B19 IgG and Borrelia C6 IgG similarly reflect prior exposure [4].",
    sections: [
      {
        title: "Reading the serology",
        body:
          "IgG antibodies persist for months to years after a streptococcal infection [1]. A rise from 20.6 to >30 suggests a relatively recent exposure, but without IgM or PCR evidence it cannot date it precisely [3][5].",
        confidence: 76,
      },
      {
        title: "When treatment is justified",
        body:
          "IDSA reserves antibiotics for confirmed GAS pharyngitis or its complications [2]. Post-streptococcal syndromes are diagnosed clinically — by symptoms plus titres — not from an IgG index alone [3].",
        confidence: 83,
      },
      {
        title: "Co-infection markers",
        body:
          "Parvovirus B19 VP2 IgG 21.5 indicates past infection and immunity [4]. Borrelia C6 IgG 14.9 with negative PCR and a falling VlsE1 IgM is consistent with prior exposure; two-tier testing is needed before any Lyme diagnosis [4].",
        confidence: 71,
      },
    ],
    citations: [
      { n: 1, source: "src_cdc_gas", claim: "Strep antibodies persist long after infection and do not indicate active disease.", confidence: 88 },
      { n: 2, source: "src_idsa_strep", claim: "Antibiotics are indicated for confirmed GAS infection, not serology alone.", confidence: 91 },
      { n: 3, source: "src_bmj_aso", claim: "Paired ASO and anti-DNase B titres help time a streptococcal exposure.", confidence: 72 },
      { n: 4, source: "src_cdc_lyme", claim: "Two-tier serology is required for Lyme diagnosis; C6 IgG alone is insufficient.", confidence: 85 },
      { n: 5, source: "src_internal_labs", claim: "Strep A IgG >30 (from 20.6); all 36 PCR targets not detected.", confidence: 98 },
    ],
    angles: [
      "Serology alone is not an indication for antibiotics.",
      "Paired ASLO and anti-DNase B titres date the exposure.",
      "Symptoms decide — joints, heart and neurology first.",
      "Negative PCR makes active infection unlikely.",
      "Borrelia C6 needs two-tier confirmation.",
    ],
    findings: [
      "Strep A IgG >30 reflects exposure, not confirmed active infection.",
      "All 36 PCR targets negative.",
      "Order ASLO and anti-DNase B titres before any treatment decision.",
      "Parvovirus B19 IgG 21.5 indicates past infection.",
      "Borrelia C6 IgG 14.9 requires two-tier confirmation.",
    ],
    contested: "Whether low-grade post-streptococcal reactivity justifies empiric treatment without symptoms is disputed.",
  },
  {
    id: "micronutrient",
    keywords: ["vitamin", "b5", "ascorbic", "pantothenic", "deficien", "supplement", "micronutrient", "repletion"],
    title: "Vitamin C 0.1 and B5 36.9 — repletion protocol",
    prompt:
      "Vitamin C is 0.1 mg/dL (ref 0.2–2.1) and Vitamin B5 is 36.9 ng/mL (ref 37–250). Build an evidence-based repletion protocol with doses, duration and retest timing. #micronutrients",
    hashtags: ["micronutrients"],
    executive_summary:
      "Plasma vitamin C of 0.1 mg/dL is in the deficient range (below 0.2 mg/dL) [1], although sample handling can falsely lower it — the redraw should be frozen at −70°C [1][4]. Oral repletion with 500–1,000 mg/day typically normalises plasma levels within weeks [1][3].\n\nVitamin B5 at 36.9 ng/mL is a hair under the reference floor; true deficiency is rare and a 250 mg/day supplement for 60 days is a conservative correction [2].",
    sections: [
      {
        title: "Vitamin C",
        body:
          "Deficiency below 0.2 mg/dL raises the risk of fatigue, poor wound healing and impaired immunity [1][3]. Split dosing (e.g. 500 mg twice daily) improves absorption over a single large dose [1]. Recheck at 60 days on a frozen sample [4].",
        confidence: 84,
      },
      {
        title: "Vitamin B5",
        body:
          "Pantothenic acid is found in most foods; low values usually reflect intake or assay variability rather than disease [2]. 250 mg/day is well below any reported adverse dose [2].",
        confidence: 73,
      },
      {
        title: "Protocol and retest",
        body:
          "Start liposomal or buffered vitamin C 1,000 mg/day in two doses and B5 250 mg/day; retest both at 60 days alongside the stool panel [1][2][4].",
        confidence: 80,
      },
    ],
    citations: [
      { n: 1, source: "src_ods_vitc", claim: "Plasma vitamin C below 0.2 mg/dL indicates deficiency; split oral dosing restores levels.", confidence: 91 },
      { n: 2, source: "src_ods_b5", claim: "Pantothenic acid deficiency is rare; supplements up to 1 g/day are well tolerated.", confidence: 86 },
      { n: 3, source: "src_nutrients_vitc", claim: "Vitamin C supports immune function; deficiency impairs it.", contested: true, confidence: 68 },
      { n: 4, source: "src_internal_labs", claim: "Vitamin C 0.1 mg/dL; B5 36.9 ng/mL; retest planned at 60 days.", confidence: 97 },
    ],
    angles: [
      "Confirm with a properly frozen redraw before escalating.",
      "Split dosing beats one large dose.",
      "B5 is borderline — conservative correction only.",
      "Retest at 60 days with the stool panel.",
      "Diet first: citrus, peppers and kiwi cover most of the gap.",
    ],
    findings: [
      "Vitamin C 0.1 mg/dL is deficient (ref 0.2–2.1).",
      "Redraw must be frozen at −70°C to rule out handling error.",
      "Vitamin C 1,000 mg/day in two doses.",
      "Vitamin B5 250 mg/day for 60 days.",
      "Retest both at 60 days.",
    ],
    contested: "How much immune benefit vitamin C repletion adds beyond correcting the deficiency is debated.",
  },
  {
    id: "gi",
    keywords: ["asca", "gi", "gut", "celiac", "calprotectin", "probiotic", "mucosal", "boulardii", "crohn", "ibd", "bowel"],
    title: "ASCA IgG 21.9 U — GI mucosal follow-up",
    prompt:
      "ASCA IgG is 21.9 U (equivocal, ref ≤ 20.0) with negative celiac serology. What follow-up testing is warranted and what does the evidence say about S. boulardii and L-glutamine for mucosal support? #gut-health",
    hashtags: ["gut-health"],
    executive_summary:
      "An equivocal ASCA IgG of 21.9 U is a weak marker on its own: ASCA is found in some healthy adults and has modest specificity for Crohn's disease [2]. Fecal calprotectin is the recommended next test to look for actual intestinal inflammation [1].\n\nS. boulardii has trial support for antibiotic-associated diarrhoea, but evidence for general mucosal 'support' is thin [3].",
    sections: [
      {
        title: "What an equivocal ASCA means",
        body:
          "Meta-analysis puts ASCA sensitivity for Crohn's around 55% and specificity around 90% [2]. Without symptoms or raised calprotectin, a borderline value does not suggest IBD [1][2].",
        confidence: 77,
      },
      {
        title: "Recommended testing",
        body:
          "Fecal calprotectin and secretory IgA at the 60-day retest; escalate to gastroenterology only if calprotectin is raised or symptoms appear [1][4].",
        confidence: 82,
      },
      {
        title: "Supplements",
        body:
          "S. boulardii is generally safe in immunocompetent adults [3]. L-glutamine for barrier function is supported mainly by small studies [3].",
        confidence: 61,
      },
    ],
    citations: [
      { n: 1, source: "src_acg_crohn", claim: "Fecal calprotectin is the preferred non-invasive test for intestinal inflammation.", confidence: 89 },
      { n: 2, source: "src_asca_meta", claim: "ASCA has ~55% sensitivity and ~90% specificity for Crohn's disease.", confidence: 80 },
      { n: 3, source: "src_wjg_boulardii", claim: "S. boulardii evidence is strongest for antibiotic-associated diarrhoea.", contested: true, confidence: 63 },
      { n: 4, source: "src_internal_labs", claim: "ASCA IgG 21.9 U; tTG IgA <1.0 (celiac negative).", confidence: 97 },
    ],
    angles: [
      "Calprotectin first — it measures inflammation directly.",
      "An equivocal ASCA alone does not suggest IBD.",
      "Celiac is already ruled out.",
      "Supplement evidence is weaker than it looks.",
      "Escalate only on symptoms or raised calprotectin.",
    ],
    findings: [
      "ASCA IgG 21.9 U is equivocal, not diagnostic.",
      "Celiac serology negative.",
      "Order fecal calprotectin and secretory IgA at 60 days.",
      "S. boulardii is safe; mucosal benefit evidence is limited.",
      "Refer to GI only if calprotectin is raised.",
    ],
    contested: "Whether probiotics change outcomes for an asymptomatic equivocal ASCA is not settled.",
  },
];

export const GENERIC_TOPIC_SOURCES = ["src_internal_labs", "src_aha_chol", "src_ods_vitc", "src_cdc_gas"];

/* ------------------------------ Seeded reports ---------------------------- */

export interface SeedReport {
  id: string;
  topic: string;
  model_providers: ModelProvider[];
  depth: "quick_scan" | "standard" | "deep_dive";
  cadence: "run_once" | "daily" | "weekly" | "monthly";
  /** Days before the seed date each version was published, oldest first. */
  versions_days_ago: number[];
}

export const SEED_REPORTS: SeedReport[] = [
  { id: "rpt_lpa01", topic: "lpa", model_providers: ["anthropic", "google", "openai"], depth: "deep_dive", cadence: "weekly", versions_days_ago: [21, 14, 7, 0.2] },
  { id: "rpt_cgm01", topic: "cgm", model_providers: ["google", "openai"], depth: "standard", cadence: "run_once", versions_days_ago: [1] },
  { id: "rpt_strep1", topic: "strep", model_providers: ["anthropic", "openai", "xai"], depth: "standard", cadence: "monthly", versions_days_ago: [30, 2] },
  { id: "rpt_vitc01", topic: "micronutrient", model_providers: ["google", "llama"], depth: "quick_scan", cadence: "run_once", versions_days_ago: [3] },
  { id: "rpt_gi0001", topic: "gi", model_providers: ["anthropic", "google"], depth: "standard", cadence: "run_once", versions_days_ago: [4] },
];

/* ----------------------------- Prompt library ---------------------------- */

export const SEED_CATEGORIES = [
  { id: "cat_cardio", name: "Cardiology", description: "Lipids, Lp(a), blood pressure and cardiovascular risk." },
  { id: "cat_metab", name: "Metabolism", description: "Glucose, CGM, insulin sensitivity and body composition." },
  { id: "cat_infect", name: "Infectious disease", description: "Serology, tickborne panels and antimicrobial decisions." },
  { id: "cat_nutri", name: "Nutrition & supplements", description: "Micronutrients, dosing and food-log analysis." },
  { id: "cat_gi", name: "Gastroenterology", description: "GI serology, stool panels and mucosal health." },
];

export const SEED_TEMPLATES = [
  { id: "tpl_ascvd", category: "cat_cardio", title: "10-year ASCVD risk with Lp(a)", description: "Risk estimate that folds in Lp(a), apoB and family history.", prompt: "Summarize the 10-year and lifetime ASCVD risk based on the latest lipid panel, adjusting for Lp(a), apoB, hs-CRP and familial history. State whether statin therapy is indicated and what to retest." },
  { id: "tpl_omega", category: "cat_cardio", title: "Omega-3 index improvement plan", description: "EPA+DHA dosing to move the OmegaCheck into range.", prompt: "Given the current OmegaCheck result, recommend an EPA+DHA dose, form and duration to reach an omega-3 index of 8%, with expected change by the 90-day retest." },
  { id: "tpl_cgm", category: "cat_metab", title: "CGM spikes vs. food log", description: "Matches glucose excursions to the meals that caused them.", prompt: "Cross-reference yesterday's food log entries with the Dexcom CGM glucose spikes to identify trigger carbohydrates, and suggest swaps that keep peaks under 140 mg/dL." },
  { id: "tpl_tir", category: "cat_metab", title: "Time-in-range weekly review", description: "A weekly read of CGM time in range and variability.", prompt: "Review the last 7 days of CGM data: time in range, glucose variability, overnight lows and the three largest excursions with their likely causes." },
  { id: "tpl_strep", category: "cat_infect", title: "Post-streptococcal reactivity workup", description: "When rising Strep IgG warrants titres or treatment.", prompt: "Strep A IgG is elevated with negative PCR. Summarize the evidence on post-streptococcal reactivity, which titres to order, and when antimicrobial therapy is justified." },
  { id: "tpl_tick", category: "cat_infect", title: "Tickborne serology interpretation", description: "Reads Borrelia and co-infection panels against PCR.", prompt: "Interpret the tickborne serology panel against the PCR results: which values indicate past exposure, which need confirmation testing, and what the next steps are." },
  { id: "tpl_vitc", category: "cat_nutri", title: "Micronutrient repletion protocol", description: "Doses, duration and retest timing for low vitamins.", prompt: "Build an evidence-based repletion protocol for the low micronutrients on the latest panel, with dose, form, duration, interactions and retest timing." },
  { id: "tpl_asca", category: "cat_gi", title: "Equivocal ASCA follow-up", description: "Next tests after a borderline ASCA IgG.", prompt: "ASCA IgG is equivocal with negative celiac serology. What follow-up testing is warranted, and what does the evidence say about probiotics and L-glutamine for mucosal support?" },
];

/* -------------------------------- Documents ------------------------------- */

export const SEED_FOLDERS = [
  { id: "fld_labs", name: "Lab reports — July 2026", age_days: 5 },
  { id: "fld_cardio", name: "Cardiology", age_days: 40 },
  { id: "fld_sensors", name: "Sensor exports", age_days: 2 },
];

export const SEED_DOCUMENTS = [
  { id: "doc_vibrant", folder: "fld_labs", name: "Vibrant_Tickborne_2.0_2026-07-09.pdf", type: "application/pdf", size: 1_842_331, age_days: 5 },
  { id: "doc_qls", folder: "fld_labs", name: "QLS_Comprehensive_2026-07-08.pdf", type: "application/pdf", size: 2_204_118, age_days: 5 },
  { id: "doc_lincoln", folder: "fld_labs", name: "Lincoln_Reference_CMP_Lipids_2026-07-08.pdf", type: "application/pdf", size: 963_402, age_days: 5 },
  { id: "doc_cardio", folder: "fld_cardio", name: "Q3_Cardiology_Summary.pdf", type: "application/pdf", size: 488_920, age_days: 40 },
  { id: "doc_ecg", folder: "fld_cardio", name: "Resting_ECG_2025-10-16.png", type: "image/png", size: 731_884, age_days: 40 },
  { id: "doc_dexcom", folder: "fld_sensors", name: "dexcom_g7_export_14d.csv", type: "text/csv", size: 214_660, age_days: 2 },
  { id: "doc_watch", folder: "fld_sensors", name: "apple_watch_hrv_sleep_30d.csv", type: "text/csv", size: 98_117, age_days: 2 },
];
