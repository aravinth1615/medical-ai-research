import { Sparkles } from "@/lib/icons";
import { COMPACT_ROWS, type Marker } from "@/lib/data/biomarkers";
import { pinPercent, trendOf, type VisiblePanel } from "@/lib/report/filters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_META } from "./status";

const th = "p-3 text-[11px] font-bold tracking-wider whitespace-nowrap text-gray-500 uppercase";
const compareCell = "bg-indigo-500/[0.04] border-l border-dashed border-white/[0.08]";

function Sparkline({ marker }: { marker: Marker }) {
  const trend = trendOf(marker);
  if (!trend) return <span className="font-mono text-[11px] text-gray-500">Baseline</span>;
  const sign = trend.deltaPct > 0 ? "+" : "";
  return (
    <div className="flex items-center gap-2">
      <svg
        width="56"
        height="22"
        className="rounded border border-white/[0.08] bg-void"
        role="img"
        aria-label={`Trend ${sign}${trend.deltaPct.toFixed(1)}% since the previous draw`}
      >
        <polyline
          fill="none"
          stroke={STATUS_META[marker.status].hex}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={trend.points}
        />
      </svg>
      <span className="rounded border border-white/[0.08] bg-void px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-200">
        {sign}
        {trend.deltaPct.toFixed(1)}%
      </span>
    </div>
  );
}

function Prior({ value }: { value: Marker["prev1"] }) {
  if (!value) return <span className="text-gray-600">—</span>;
  return (
    <>
      <strong className="text-gray-200">{value.val}</strong>{" "}
      <span className="text-[11px] text-gray-500">({value.date})</span>
    </>
  );
}

function MarkerRow({ m, compare }: { m: Marker; compare: boolean }) {
  const meta = STATUS_META[m.status];
  return (
    <tr className="border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.025]">
      <td className="p-3 align-middle">
        <div className="text-[13.5px] font-bold text-gray-100">{m.name}</div>
        <div className="mt-0.5 text-[11.5px] text-gray-500">{m.role}</div>
      </td>
      <td className="p-3 align-middle font-mono whitespace-nowrap">
        <span className="text-[14px] font-bold text-gray-100">{m.displayValue ?? m.value}</span>
        <span className="ml-1 text-[11px] text-gray-500">{m.unit}</span>
      </td>
      <td className="max-w-[230px] min-w-[190px] p-3 align-middle">
        <div className="mb-1.5 font-mono text-[11px] text-gray-500">Ref: {m.rangeText}</div>
        <div className={cn("range-track", m.upperOnly && "upper-only")} aria-hidden>
          <div className="range-pin" style={{ left: `${pinPercent(m)}%`, background: meta.hex }} />
        </div>
      </td>
      <td className="p-3 align-middle">
        <Badge tone={meta.badge} pill>
          <meta.icon />
          {m.badge}
        </Badge>
      </td>
      {compare && (
        <>
          <td className={cn("p-3 align-middle", compareCell)}>
            <Sparkline marker={m} />
          </td>
          <td className={cn("p-3 align-middle font-mono text-xs whitespace-nowrap", compareCell)}>
            <Prior value={m.prev1} />
          </td>
          <td className={cn("p-3 align-middle font-mono text-xs whitespace-nowrap", compareCell)}>
            <Prior value={m.prev2} />
          </td>
          <td className={cn("p-3 align-middle font-mono text-[11px] whitespace-nowrap text-gray-600", compareCell)}>
            Awaiting next draw
          </td>
        </>
      )}
    </tr>
  );
}

export function PanelCard({
  view,
  compare,
  onToggleCollapse,
  tag,
}: {
  view: VisiblePanel;
  compare: boolean;
  onToggleCollapse: (id: string) => void;
  tag?: React.ReactNode;
}) {
  const { panel, rows, matched, collapsed, hidden } = view;
  const canCompact = panel.collapsible && matched > COMPACT_ROWS;

  return (
    <section
      id={panel.id}
      className="scroll-mt-36 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel transition-shadow hover:shadow-lg hover:shadow-black/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
            {panel.lab} • {panel.date} • {panel.accession}
          </p>
          <h3 className="mt-0.5 text-[17px] font-extrabold text-gray-100">{panel.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {tag}
          <span className="rounded-md border border-white/10 bg-void px-2.5 py-1 font-mono text-xs text-gray-400">
            Showing {rows.length} of {matched}
          </span>
          {canCompact && (
            <Button size="xs" variant="secondary" onClick={() => onToggleCollapse(panel.id)}>
              {collapsed ? `▼ Expand All ${matched} Rows` : "▲ Compact View"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 border-b border-white/[0.06] bg-indigo-500/[0.07] px-5 py-3 text-[12.5px] text-gray-300">
        <strong className="flex shrink-0 items-center gap-1 whitespace-nowrap text-indigo-300">
          <Sparkles className="size-3.5" />
          AI Panel Summary:
        </strong>
        <span>{panel.aiSummary}</span>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-void/80">
            <tr className="border-b border-white/[0.06]">
              <th scope="col" className={th}>Biomarker &amp; Physiological Role</th>
              <th scope="col" className={th}>Measured Value</th>
              <th scope="col" className={th}>Reference Range Bar</th>
              <th scope="col" className={th}>Status Badge</th>
              {compare && (
                <>
                  <th scope="col" className={cn(th, compareCell)}>Trend &amp; Delta</th>
                  <th scope="col" className={cn(th, compareCell)}>Baseline 1</th>
                  <th scope="col" className={cn(th, compareCell)}>Baseline 2</th>
                  <th scope="col" className={cn(th, compareCell)}>Future</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <MarkerRow key={m.name} m={m} compare={compare} />
            ))}
          </tbody>
        </table>
      </div>

      {collapsed && hidden > 0 && (
        <div className="border-t border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <Button size="xs" variant="secondary" onClick={() => onToggleCollapse(panel.id)}>
            + Show Remaining {hidden} In-Control Biomarkers
          </Button>
        </div>
      )}
    </section>
  );
}
