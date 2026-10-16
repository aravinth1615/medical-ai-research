import type { Metadata } from "next";
import { Suspense } from "react";
import type { TreatmentCategory, TreatmentView } from "@/lib/data/records";
import { RecordPageSkeleton } from "@/components/shell/page-frame";
import { CATEGORIES, TreatmentDetail, VIEWS, isCategory, isView } from "./treatment-detail";

export function generateStaticParams() {
  return (Object.keys(CATEGORIES) as TreatmentCategory[]).flatMap((category) =>
    (Object.keys(VIEWS) as TreatmentView[]).map((view) => ({ category, view }))
  );
}

export async function generateMetadata({ params }: PageProps<"/treatment/[category]/[view]">): Promise<Metadata> {
  const { category, view } = await params;
  if (!isCategory(category) || !isView(view)) return { title: "Not found" };
  return { title: `${CATEGORIES[category].title} — ${VIEWS[view].title}` };
}

/* Shared App Shell: the page never awaits `params`, so the skeleton is
   prefetched for every regimen link and the table streams in behind it. */
export default function TreatmentPage({ params }: PageProps<"/treatment/[category]/[view]">) {
  return (
    <Suspense fallback={<RecordPageSkeleton />}>
      <TreatmentDetail params={params} />
    </Suspense>
  );
}
