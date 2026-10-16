import { REPORT_KPIS } from "@/lib/data/patient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const KPI = [
  { value: REPORT_KPIS.total, label: "Total Biomarkers Extracted", cls: "border-white/[0.08] bg-void", text: "text-gray-100" },
  { value: REPORT_KPIS.red, label: "Red / Critical Or High-Risk", cls: "border-red-500/30 bg-red-500/10", text: "text-red-300" },
  { value: REPORT_KPIS.yellow, label: "Yellow / Borderline Issues", cls: "border-amber-500/30 bg-amber-500/10", text: "text-amber-300" },
  { value: REPORT_KPIS.green, label: "Green / In-Control Biomarkers", cls: "border-emerald-500/30 bg-emerald-500/10", text: "text-emerald-300" },
];

const B = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-gray-100">{children}</strong>;

export function MasterSummary({ onIsolate, onShowAll }: { onIsolate: () => void; onShowAll: () => void }) {
  const flagged = REPORT_KPIS.red + REPORT_KPIS.yellow;
  return (
    <section id="master-summary" className="@container scroll-mt-20 rounded-2xl border-2 border-indigo-500/60 bg-panel p-5 shadow-[0_0_30px_-10px_rgba(79,70,229,0.4)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
            ✦ Master AI Executive Synthesis • 3 Combined Reports (07/08/2026 – 07/09/2026)
          </p>
          <h2 className="mt-1 text-[22px] font-extrabold text-gray-100">
            Holistic Clinical Correlation &amp; Longitudinal Health Velocity
          </h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="danger" onClick={onIsolate}>
            ⚡ Isolate All {flagged} Out-of-Range
          </Button>
          <Button size="sm" variant="secondary" onClick={onShowAll}>
            Show All
          </Button>
        </div>
      </div>

      <div className="my-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {KPI.map((k) => (
          <div key={k.label} className={cn("rounded-xl border p-3", k.cls)}>
            <div className={cn("font-mono text-[22px] leading-tight font-extrabold tabular-nums", k.text)}>{k.value}</div>
            <div className={cn("mt-1 text-[11px] font-semibold", k.text === "text-gray-100" ? "text-gray-500" : k.text)}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Sized by the card, not the viewport: with both side panes open the
          column is far narrower than the window. */}
      <div className="mt-4 grid grid-cols-1 gap-4 @4xl:grid-cols-3">
        <article className="rounded-xl border border-red-500/30 bg-red-500/[0.07] p-4">
          <span className="inline-block rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-[11.5px] font-bold text-red-300">
            Priority 1 • Humoral &amp; Infectious
          </span>
          <h3 className="my-2 text-sm font-bold text-gray-100">Strep A IgG (&gt;30), Parvovirus B19 IgG &amp; Borrelia Titers</h3>
          <p className="text-[12.5px] leading-relaxed text-gray-300">
            <B>Streptococcal A IgG is markedly elevated at &gt;30</B> (up from 20.6 on 02/05/26) alongside High-Risk{" "}
            <B>Parvovirus B19 IgG (VLP VP2: 21.5, Co-Capsid: 20.1)</B>. <B>Borrelia burgdorferi C6 Peptide IgG is moderately elevated at 14.9</B>{" "}
            (up from 12.1), while <B>B. bavariensis VlsE1 IgM dropped by 52% (23.1 → 11.0)</B>. Crucially,{" "}
            <B>all 36 PCR DNA/RNA targets are NOT DETECTED</B>.
          </p>
        </article>
        <article className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4">
          <span className="inline-block rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-300">
            Priority 2 • Cardiovascular &amp; Lipids
          </span>
          <h3 className="my-2 text-sm font-bold text-gray-100">Elevated Lp(a) (67.0), Direct LDL (137) &amp; Low OmegaCheck (4.0%)</h3>
          <p className="text-[12.5px] leading-relaxed text-gray-300">
            <B>Lipoprotein(a) is elevated at 67.0 mg/dL</B> (ref 10–30) with <B>Direct LDL at 137 mg/dL</B> and{" "}
            <B>Total Cholesterol at 209 mg/dL</B>. Whole-blood <B>OmegaCheck is Low at 4.0% by wt</B>. Offsetting these lipid
            numbers are stellar vascular protective markers: <B>HDL jumped from 59 → 71 mg/dL</B>,{" "}
            <B>Triglycerides fell 101 → 74 mg/dL</B>, <B>hs-CRP is 0.8 mg/L</B>, and <B>HbA1c is 4.9%</B>.
          </p>
        </article>
        <article className="rounded-xl border border-white/[0.08] bg-void p-4">
          <span className="inline-block rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-[11.5px] font-bold text-red-300">
            Priority 3 • Micronutrients &amp; GI
          </span>
          <h3 className="my-2 text-sm font-bold text-gray-100">Low Vitamin C (0.1), Low Vit B5 (36.9), ASCA IgG (21.9) &amp; BUN (27)</h3>
          <p className="text-[12.5px] leading-relaxed text-gray-300">
            <B>Vitamin C is critically low at 0.1 mg/dL</B> (ref 0.2–2.1) and <B>Vitamin B5 is borderline low at 36.9 ng/mL</B>{" "}
            (ref 37–250). GI serology shows <B>S. cerevisiae (ASCA) IgG in the equivocal/elevated zone at 21.9 U</B> (ref ≤20.0)
            while Celiac antibodies are 100% negative. <B>BUN is 27 mg/dL</B> with normal Creatinine (1.0) and eGFR (109.8).
          </p>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.08] bg-void p-4 text-[12.5px] text-gray-300">
        <B>📈 Key Longitudinal Velocity (August 2025 → October 2025 → February 2026 → July 2026):</B>
        <ul className="mt-2 grid grid-cols-1 gap-2.5 @2xl:grid-cols-2">
          <li>
            • <B>Liver Enzymes Normalized:</B> ALT fell from <B>93 H (08/21/25) → 23 (10/16/25) → 19 U/L (07/08/26)</B>; AST normalized from{" "}
            <B>49 H → 20 → 19 U/L</B>.
          </li>
          <li>
            • <B>Co-Infection Serology Resolved:</B> Elevations in <em>Babesia microti WCS IgG</em> (13.3 → 5.6) and{" "}
            <em>Chlamydophila pneumoniae IgM</em> (10.5 → 6.0) normalized (≤10.0).
          </li>
          <li>
            • <B>Hormonal Vigor:</B> Total Testosterone rose <B>423 → 507 ng/dL (+19.9%)</B>, Free T rose <B>7.94 → 10.41 ng/dL (+31.1%)</B>.
          </li>
          <li>
            • <B>Ferritin Watch:</B> Serum Ferritin declined by 54.5% from <B>130.8 ng/mL (08/21/25) → 59.5 ng/mL (07/08/26)</B>.
          </li>
        </ul>
      </div>
    </section>
  );
}
