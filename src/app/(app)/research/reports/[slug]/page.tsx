import type { Metadata } from "next";
import { Suspense } from "react";
import { extractReportId } from "@/lib/research/format";
import { ReportDetail } from "@/components/research/report/report-detail";

export const metadata: Metadata = { title: "Report" };

function ReportSkeleton() {
  return (
    <div className="flex min-h-full flex-col bg-[#08090E]" aria-busy aria-label="Loading report">
      <div className="h-14 border-b border-white/[0.08] bg-[#0C0E15]/90" />
      <div className="mx-auto w-full max-w-[1560px] animate-pulse space-y-4 p-4 sm:p-6">
        <div className="h-24 rounded-xl border border-white/[0.08] bg-[#0F111A]" />
        <div className="h-80 rounded-xl border border-white/[0.08] bg-[#0F111A]" />
      </div>
    </div>
  );
}

/** Reads the URL's report id and `?version=` behind the boundary, so the
 *  route's shared, prefetched shell never waits on one report. */
async function ReportAtSlug({
  params,
  searchParams,
}: Pick<PageProps<"/research/reports/[slug]">, "params" | "searchParams">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const id = extractReportId(slug);
  const raw = Array.isArray(query.version) ? query.version[0] : query.version;
  const version = raw && /^\d+$/.test(raw) ? Number(raw) : null;
  return <ReportDetail key={id ?? slug} reportId={id} version={version} />;
}

/* Reports are created at runtime in the browser, so there are no static
   params — the shell (skeleton) is prerendered and the report streams in. */
export default function ReportPage({ params, searchParams }: PageProps<"/research/reports/[slug]">) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportAtSlug params={params} searchParams={searchParams} />
    </Suspense>
  );
}
