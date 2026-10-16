import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Leaf, Pill } from "@/lib/icons";
import { TREATMENT, type RegimenItem, type TreatmentCategory, type TreatmentView } from "@/lib/data/records";
import { cn } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageBody, PageHeaderBar, PageIntro, SectionCard, tableStyles as t } from "@/components/shell/page-frame";

export const CATEGORIES: Record<TreatmentCategory, { title: string; icon: typeof Pill; accent: string }> = {
  medications: { title: "Medications", icon: Pill, accent: "text-indigo-400" },
  supplements: { title: "Supplements", icon: Leaf, accent: "text-teal-400" },
};

export const VIEWS: Record<TreatmentView, { title: string; description: string }> = {
  current: { title: "Current Regimen", description: "What is active or proposed now, and the lab result behind each item." },
  past: { title: "Past History", description: "Completed and stopped courses, kept for context when reading trends." },
};

const STATUS: Record<RegimenItem["status"], { label: string; tone: BadgeTone }> = {
  active: { label: "Active", tone: "emerald" },
  pending: { label: "Pending review", tone: "amber" },
  completed: { label: "Completed", tone: "gray" },
  stopped: { label: "Not started", tone: "gray" },
};

export function isCategory(v: string): v is TreatmentCategory {
  return v in CATEGORIES;
}
export function isView(v: string): v is TreatmentView {
  return v in VIEWS;
}

/** Everything that depends on the category and view in the URL. It awaits
 *  `params` itself, inside the page's Suspense boundary. */
export async function TreatmentDetail({ params }: Pick<PageProps<"/treatment/[category]/[view]">, "params">) {
  const { category, view } = await params;
  if (!isCategory(category) || !isView(view)) notFound();

  const c = CATEGORIES[category];
  const v = VIEWS[view];
  const items = TREATMENT[category][view];
  const other: TreatmentView = view === "current" ? "past" : "current";

  return (
    <div className="flex min-h-full animate-fade-in flex-col">
      <PageHeaderBar
        icon={<c.icon />}
        title={c.title}
        badge={`${items.length} ${items.length === 1 ? "item" : "items"}`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/treatment/${category}/${other}`}>{VIEWS[other].title}</Link>
          </Button>
        }
      />
      <PageIntro labelIcon={<c.icon />} label="Treatment & protocol" title={v.title} description={v.description} />
      <PageBody>
        <SectionCard icon={<c.icon className={c.accent} />} title={`${c.title} · ${v.title}`} flush>
          {items.length === 0 ? (
            <EmptyState
              icon={<c.icon />}
              title={`No ${c.title.toLowerCase()} recorded`}
              description="Items added to the doctor's action plan appear here once they're started."
              action={
                <Button asChild variant="soft" size="sm">
                  <Link href="/report#doctor-workspace">Open action plan</Link>
                </Button>
              }
            />
          ) : (
            <div className={t.wrap}>
              <table className={t.table}>
                <thead className={t.thead}>
                  <tr>
                    <th scope="col" className={t.th}>Name</th>
                    <th scope="col" className={t.th}>Dose</th>
                    <th scope="col" className={t.th}>Schedule</th>
                    <th scope="col" className={t.th}>Why</th>
                    <th scope="col" className={t.th}>Period</th>
                    <th scope="col" className={t.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const s = STATUS[item.status];
                    return (
                      <tr key={item.name} className={t.tr}>
                        <td className={cn(t.td, "text-sm font-semibold text-gray-100")}>{item.name}</td>
                        <td className={cn(t.td, "font-mono whitespace-nowrap")}>{item.dose}</td>
                        <td className={t.td}>{item.schedule}</td>
                        <td className={cn(t.td, "min-w-56 text-gray-400")}>{item.reason}</td>
                        <td className={cn(t.td, "font-mono whitespace-nowrap")}>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-3.5 text-gray-500" />
                            {item.since}
                          </span>
                        </td>
                        <td className={t.td}>
                          <Badge tone={s.tone} pill>
                            {s.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </PageBody>
    </div>
  );
}
