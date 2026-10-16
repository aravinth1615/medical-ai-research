import type { Metadata } from "next";
import { Suspense } from "react";
import { PREVIOUS_REPORTS } from "@/lib/data/records";
import { RecordPageSkeleton } from "@/components/shell/page-frame";
import { ReportDetail, findReport } from "./report-detail";

export function generateStaticParams() {
  return PREVIOUS_REPORTS.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/records/reports/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: findReport(slug)?.title ?? "Report not found" };
}

/* Shared App Shell: the page never awaits `params`, so the skeleton is
   prefetched for every report link and the report streams in behind it. */
export default function PreviousReportPage({ params }: PageProps<"/records/reports/[slug]">) {
  return (
    <Suspense fallback={<RecordPageSkeleton />}>
      <ReportDetail params={params} />
    </Suspense>
  );
}
