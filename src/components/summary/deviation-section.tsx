import { CircleAlert, Info } from "@/lib/icons";
import type { DeviationRow } from "@/lib/data/summary";
import { cn } from "@/lib/utils";

const TONES = {
  red: {
    rule: "border-t-red-400",
    text: "text-red-400",
    bar: "bg-red-400",
    icon: CircleAlert,
  },
  yellow: {
    rule: "border-t-amber-400",
    text: "text-amber-400",
    bar: "bg-amber-400",
    icon: Info,
  },
} as const;

export function DeviationSection({
  title,
  tone,
  rows,
}: {
  title: string;
  tone: keyof typeof TONES;
  rows: DeviationRow[];
}) {
  const t = TONES[tone];
  return (
    <section className={cn("rounded-2xl border border-t-4 border-white/[0.08] bg-panel p-5 sm:p-6", t.rule)}>
      <h2 className="mb-4 flex items-center gap-2 border-b border-white/[0.06] pb-3 text-base font-bold text-gray-100">
        <t.icon className={cn("size-4.5", t.text)} />
        {title}
        <span className="ml-auto font-mono text-xs font-medium text-gray-500">{rows.length} markers</span>
      </h2>

      <ul className="grid grid-cols-1 gap-3">
        {rows.map((r) => (
          <li
            key={r.name}
            className="grid grid-cols-1 items-center gap-3 rounded-xl border border-white/[0.06] bg-void p-4 sm:grid-cols-[3fr_1fr_3fr] sm:gap-4"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-100">{r.name}</h3>
              <p className="mt-1 text-xs text-gray-500">{r.role}</p>
            </div>
            <p className={cn("font-mono text-lg font-bold sm:text-right", t.text)}>
              {r.value} <span className="text-xs">{r.unit}</span>
            </p>
            <div className="w-full">
              <div className="mb-1 flex justify-between font-mono text-[11px] text-gray-500">
                {r.scale.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div
                className="relative h-2 w-full rounded-full bg-white/[0.06]"
                role="img"
                aria-label={`${r.name}: ${r.value} ${r.unit}, ${r.fromRight ? "below" : "above"} reference`}
              >
                <div
                  className={cn("absolute inset-y-0 rounded-full", t.bar, r.fromRight ? "right-0" : "left-0")}
                  style={{ width: `${r.fill}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
