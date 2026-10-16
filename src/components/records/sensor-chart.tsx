"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * 24 hourly columns against the target band. In-band readings wear the
 * accent; readings above the band switch to the warning status and say so in
 * the tooltip and legend, never by colour alone.
 */
export function SensorChart({
  label,
  unit,
  values,
  band,
}: {
  label: string;
  unit: string;
  values: number[];
  band: [number, number];
}) {
  const ceiling = Math.max(...values, band[1]) * 1.1;
  const floor = Math.min(...values, band[0]) * 0.8;
  const y = (v: number) => ((v - floor) / (ceiling - floor)) * 100;
  const hourLabel = (i: number) => `${String(i % 24).padStart(2, "0")}:00`;

  return (
    <figure className="rounded-xl border border-white/[0.08] bg-panel p-5">
      <figcaption className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-bold tracking-wider text-white uppercase">{label}</span>
        <span className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-indigo-400" aria-hidden />
            In target ({band[0]}–{band[1]} {unit})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-amber-400" aria-hidden />
            Above target
          </span>
        </span>
      </figcaption>

      <div className="relative h-44">
        {/* Target band — recessive, behind the marks. */}
        <div
          className="absolute inset-x-0 rounded-sm border-y border-dashed border-emerald-400/25 bg-emerald-400/[0.04]"
          style={{ bottom: `${y(band[0])}%`, height: `${y(band[1]) - y(band[0])}%` }}
          aria-hidden
        />
        <ol className="relative flex h-full items-end gap-[2px]" aria-label={`${label}, hourly`}>
          {values.map((v, i) => {
            const high = v > band[1];
            return (
              <li key={i} className="flex h-full flex-1 items-end">
                <Tooltip
                  content={
                    <span>
                      <span className="font-mono text-gray-400">{hourLabel(i)}</span>{" "}
                      <span className="font-semibold">
                        {v} {unit}
                      </span>
                      {high && <span className="text-amber-300"> · above target</span>}
                    </span>
                  }
                >
                  <button
                    type="button"
                    aria-label={`${hourLabel(i)}: ${v} ${unit}${high ? ", above target" : ""}`}
                    className="group flex h-full w-full cursor-default items-end"
                  >
                    <span
                      className={cn(
                        "w-full rounded-t-[4px] transition-opacity group-hover:opacity-80",
                        high ? "bg-amber-400" : "bg-indigo-400/80"
                      )}
                      style={{ height: `${y(v)}%` }}
                    />
                  </button>
                </Tooltip>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-gray-500">
        <span>{hourLabel(0)}</span>
        <span>{hourLabel(Math.floor(values.length / 2))}</span>
        <span>{hourLabel(values.length - 1)}</span>
      </div>
    </figure>
  );
}
