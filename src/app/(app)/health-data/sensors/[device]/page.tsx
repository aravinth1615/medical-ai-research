import type { Metadata } from "next";
import { Suspense } from "react";
import { SENSORS } from "@/lib/data/records";
import { RecordPageSkeleton } from "@/components/shell/page-frame";
import { SensorDetail } from "./sensor-detail";

export function generateStaticParams() {
  return SENSORS.map((s) => ({ device: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/health-data/sensors/[device]">): Promise<Metadata> {
  const { device } = await params;
  return { title: SENSORS.find((s) => s.slug === device)?.name ?? "Device not found" };
}

/* The App Shell for this route is shared by every device link, so the page
   itself never awaits `params` — the skeleton is prefetched and shows
   instantly, and the device's own content streams in behind it. */
export default function SensorPage({ params }: PageProps<"/health-data/sensors/[device]">) {
  return (
    <Suspense fallback={<RecordPageSkeleton tiles={4} />}>
      <SensorDetail params={params} />
    </Suspense>
  );
}
