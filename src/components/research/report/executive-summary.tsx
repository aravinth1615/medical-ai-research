import { PieChart } from "@/lib/icons";
import {
  BORDERLINE_DEVIATIONS,
  CRITICAL_DEVIATIONS,
  DEFICIENT_SEVERITY,
  DIAGNOSTICS_PLAN,
  ELEVATED_SEVERITY,
  TREATMENT_PLAN,
} from "@/lib/data/summary";
import { DeviationSection } from "@/components/summary/deviation-section";
import { SeverityChart } from "@/components/summary/severity-chart";
import { ActionPlan } from "@/components/summary/action-plan";

/**
 * The patient's Executive Summary inside a research report — the same
 * out-of-bounds view as the Executive Summary page (/summary), built from
 * the same components: critical and borderline deviations, the severity
 * index and the testing & treatment protocol.
 */
export function ExecutiveSummary() {
  return (
    <section id="executive-summary" aria-labelledby="executive-summary-title" className="scroll-mt-40 space-y-6">
      <div className="px-1">
        <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
          <PieChart className="size-3.5" />
          Executive summary • critical (red) and borderline (yellow) deviations
        </p>
        <h2 id="executive-summary-title" className="mt-0.5 text-[20px] font-extrabold text-gray-100">
          Out-of-Bounds Biomarker Report
        </h2>
      </div>
      <DeviationSection title="Critical High-Risk Deviations (Red)" tone="red" rows={CRITICAL_DEVIATIONS} />
      <DeviationSection title="Borderline Deviations (Yellow)" tone="yellow" rows={BORDERLINE_DEVIATIONS} />
      <SeverityChart elevated={ELEVATED_SEVERITY} deficient={DEFICIENT_SEVERITY} />
      <ActionPlan diagnostics={DIAGNOSTICS_PLAN} treatment={TREATMENT_PLAN} />
    </section>
  );
}
