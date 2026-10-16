import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText, Sparkles } from "@/lib/icons";
import { PREVIOUS_REPORTS } from "@/lib/data/records";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeaderBar, PageIntro, SectionCard, tableStyles as t } from "@/components/shell/page-frame";
import { STATUS_META } from "@/components/report/status";

export function findReport(slug: string) {
  return PREVIOUS_REPORTS.find((r) => r.slug === slug);
}

/** Everything that depends on which report is in the URL. It awaits `params`
 *  itself, inside the page's Suspense boundary. */
export async function ReportDetail({ params }: Pick<PageProps<"/records/reports/[slug]">, "params">) {
  const { slug } = await params;
  const report = findReport(slug);
  if (!report) notFound();

  return (
    <div className="flex min-h-full animate-fade-in flex-col">
      <PageHeaderBar icon={<FileText />} title={report.title} badge={report.file} status={`Collected ${report.date}`} />
      <PageIntro
        labelIcon={<FileText />}
        label="Previous report"
        title={report.title}
        description={report.summary}
        aside={
          <>
            <Badge tone="gray" size="sm">{report.date}</Badge>
            <Badge tone="gray" size="sm">{report.author}</Badge>
            <Badge tone="gray" size="sm">{report.pages} pages</Badge>
          </>
        }
      />
      <PageBody>
        <SectionCard icon={<Sparkles className="text-indigo-400" />} title="Key findings" aside={`${report.findings.length} values`} flush>
          <div className={t.wrap}>
            <table className={t.table}>
              <thead className={t.thead}>
                <tr>
                  <th scope="col" className={t.th}>Marker</th>
                  <th scope="col" className={t.th}>Value</th>
                  <th scope="col" className={t.th}>Status</th>
                  <th scope="col" className={t.th}>Since then</th>
                </tr>
              </thead>
              <tbody>
                {report.findings.map((f) => {
                  const meta = STATUS_META[f.status];
                  return (
                    <tr key={f.label} className={t.tr}>
                      <td className={`${t.td} text-sm font-semibold text-gray-100`}>{f.label}</td>
                      <td className={`${t.td} font-mono whitespace-nowrap text-gray-100`}>{f.value}</td>
                      <td className={t.td}>
                        <Badge tone={meta.badge} pill>
                          <meta.icon />
                          {f.status === "green" ? "In range" : f.status === "yellow" ? "Borderline" : "Out of range"}
                        </Badge>
                      </td>
                      <td className={`${t.td} text-gray-400`}>{f.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.06] p-4">
          <p className="text-sm text-gray-300">
            These values are the comparison baseline in the July 2026 combined report.
          </p>
          <Button asChild variant="primary" size="sm">
            <Link href="/report">
              Compare in report
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </PageBody>
    </div>
  );
}
