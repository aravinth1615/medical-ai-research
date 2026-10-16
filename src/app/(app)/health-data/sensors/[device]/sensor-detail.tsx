import { notFound } from "next/navigation";
import { Activity, Watch, Wifi } from "@/lib/icons";
import { SENSORS } from "@/lib/data/records";
import { STATUS_META } from "@/components/report/status";
import { Badge, StatusDot } from "@/components/ui/badge";
import { PageBody, PageHeaderBar, PageIntro, SectionCard, StatTile } from "@/components/shell/page-frame";
import { SensorChart } from "@/components/records/sensor-chart";

const EVENT_ICON_TONE = { green: "text-emerald-400", yellow: "text-amber-400", red: "text-red-400" } as const;

/** Everything that depends on which device is in the URL. It awaits `params`
 *  itself, inside the page's Suspense boundary, so the route's shared App
 *  Shell never waits on one URL. */
export async function SensorDetail({ params }: Pick<PageProps<"/health-data/sensors/[device]">, "params">) {
  const { device } = await params;
  const sensor = SENSORS.find((s) => s.slug === device);
  if (!sensor) notFound();

  const Icon = sensor.live ? Wifi : Watch;

  return (
    <div className="flex min-h-full animate-fade-in flex-col">
      <PageHeaderBar
        icon={<Icon />}
        title={sensor.name}
        badge={sensor.kind}
        actions={
          <Badge tone={sensor.live ? "emerald" : "gray"} pill>
            <StatusDot tone={sensor.live ? "emerald" : "gray"} pulse={sensor.live} />
            {sensor.lastSync}
          </Badge>
        }
      />
      <PageIntro labelIcon={<Wifi />} label="Connected sensors" title={sensor.name} description={sensor.summary} />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {sensor.metrics.map((m) => (
            <StatTile key={m.label} label={m.label} value={m.value} unit={m.unit} caption={m.caption} tone={m.tone} />
          ))}
        </div>

        <SensorChart label={sensor.series.label} unit={sensor.series.unit} values={sensor.series.values} band={sensor.series.band} />

        <SectionCard icon={<Activity className="text-emerald-400" />} title="Events" aside={`${sensor.events.length} today`}>
          <ol className="space-y-3">
            {sensor.events.map((e) => {
              const meta = STATUS_META[e.tone];
              return (
                <li key={e.time} className="flex items-start gap-3">
                  <span className="w-12 shrink-0 font-mono text-xs text-gray-500">{e.time}</span>
                  <meta.icon className={`mt-0.5 size-4 shrink-0 ${EVENT_ICON_TONE[e.tone]}`} />
                  <span className="text-sm text-gray-300">{e.text}</span>
                </li>
              );
            })}
          </ol>
        </SectionCard>
      </PageBody>
    </div>
  );
}
