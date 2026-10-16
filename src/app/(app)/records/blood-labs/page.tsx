import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TestTube } from "@/lib/icons";
import { LAB_GROUPS, PANELS } from "@/lib/data/biomarkers";
import { countMarkers } from "@/lib/report/filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeaderBar, PageIntro, SectionCard, StatTile, tableStyles as t } from "@/components/shell/page-frame";

export const metadata: Metadata = { title: "Blood Labs" };

export default function BloodLabsPage() {
  const counts = countMarkers(PANELS);
  return (
    <div className="flex min-h-full animate-fade-in flex-col">
      <PageHeaderBar
        icon={<TestTube />}
        title="Blood Labs"
        badge={`${PANELS.length} panels`}
        status="3 lab sources merged"
        actions={
          <Button asChild variant="primary" size="sm">
            <Link href="/report">
              Open combined report
              <ArrowRight />
            </Link>
          </Button>
        }
      />
      <PageIntro
        labelIcon={<TestTube />}
        label="Patient records"
        title="July 2026 draw — Vibrant America, QLS and Lincoln Reference"
        description="Every panel extracted from the three source reports. Open one to see its markers, reference ranges and prior draws in the combined report."
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Markers in these panels" value={counts.total} tone="indigo" caption="Across all three labs" />
          <StatTile label="Red" value={counts.red} tone="red" caption="Critical or high-risk" />
          <StatTile label="Yellow" value={counts.yellow} tone="amber" caption="Borderline" />
          <StatTile label="Green" value={counts.green} tone="emerald" caption="In control" />
        </div>

        {LAB_GROUPS.map((g) => {
          const panels = PANELS.filter((p) => g.labs.includes(p.lab));
          return (
            <SectionCard key={g.label} icon={<TestTube className="text-rose-400" />} title={g.label} aside={`${panels.length} panels`} flush>
              <div className={t.wrap}>
                <table className={t.table}>
                  <thead className={t.thead}>
                    <tr>
                      <th scope="col" className={t.th}>Panel</th>
                      <th scope="col" className={t.th}>Collected</th>
                      <th scope="col" className={t.th}>Markers</th>
                      <th scope="col" className={t.th}>Flags</th>
                      <th scope="col" className={t.th}>
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {panels.map((p) => {
                      const red = p.markers.filter((m) => m.status === "red").length;
                      const yellow = p.markers.filter((m) => m.status === "yellow").length;
                      return (
                        <tr key={p.id} className={t.tr}>
                          <td className={t.td}>
                            <p className="text-sm font-semibold text-gray-100">{p.title}</p>
                            <p className="mt-0.5 text-gray-500">{p.lab}</p>
                          </td>
                          <td className={`${t.td} font-mono`}>{p.date}</td>
                          <td className={`${t.td} font-mono`}>{p.markers.length}</td>
                          <td className={t.td}>
                            <span className="flex flex-wrap gap-1.5">
                              {red > 0 && <Badge tone="red" size="sm">{red} red</Badge>}
                              {yellow > 0 && <Badge tone="amber" size="sm">{yellow} yellow</Badge>}
                              {red + yellow === 0 && <Badge tone="emerald" size="sm">All in range</Badge>}
                            </span>
                          </td>
                          <td className={`${t.td} text-right`}>
                            <Button asChild variant="ghost" size="xs">
                              <Link href={`/report#${p.id}`}>
                                View
                                <ArrowRight />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          );
        })}
      </PageBody>
    </div>
  );
}
