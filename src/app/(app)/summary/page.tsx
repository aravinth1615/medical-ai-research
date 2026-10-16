import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import {
  BORDERLINE_DEVIATIONS,
  CRITICAL_DEVIATIONS,
  DEFICIENT_SEVERITY,
  DIAGNOSTICS_PLAN,
  ELEVATED_SEVERITY,
  TREATMENT_PLAN,
} from "@/lib/data/summary";
import { Button } from "@/components/ui/button";
import { DeviationSection } from "@/components/summary/deviation-section";
import { SeverityChart } from "@/components/summary/severity-chart";
import { ActionPlan } from "@/components/summary/action-plan";
import { DeepSearch } from "@/components/summary/deep-search";

export const metadata: Metadata = { title: "Executive Summary" };

export default function SummaryPage() {
  return (
    <div className="mx-auto w-full max-w-[1000px] animate-fade-in space-y-6 px-4 py-8 pb-16 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-100">Out-of-Bounds Biomarker Report</h1>
          <p className="mt-1 text-sm text-gray-400">
            Filtered view isolating Critical (Red) and Borderline (Yellow) deviations.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/report">
            Open full report
            <ArrowRight />
          </Link>
        </Button>
      </header>

      <DeviationSection title="Critical High-Risk Deviations (Red)" tone="red" rows={CRITICAL_DEVIATIONS} />
      <DeviationSection title="Borderline Deviations (Yellow)" tone="yellow" rows={BORDERLINE_DEVIATIONS} />
      <SeverityChart elevated={ELEVATED_SEVERITY} deficient={DEFICIENT_SEVERITY} />
      <ActionPlan diagnostics={DIAGNOSTICS_PLAN} treatment={TREATMENT_PLAN} />
      <DeepSearch />
    </div>
  );
}
