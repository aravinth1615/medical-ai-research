"use client";

import * as React from "react";
import { FileText, Search } from "@/lib/icons";
import { fetchReports } from "@/lib/research/service";
import { relativeTime } from "@/lib/research/format";
import type { ReportRead } from "@/lib/research/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DialogShell } from "@/components/research/ui/dialog";
import { InlineError, ModelDots, ReportStatePill } from "@/components/research/ui/primitives";
import { useResearch } from "@/components/research/ui/use-research";

/** "Add report" — picks earlier finished reports to ground a new run. Only
 *  reports with a published version are offered. */
export function ReportPickerDialog({
  open,
  onOpenChange,
  excludeIds,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeIds: string[];
  onConfirm: (reports: ReportRead[]) => void;
}) {
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<FileText />}
      title="Attach earlier reports"
      description="Each report's latest version is read as context before the models search the literature."
      width="36rem"
    >
      {/* Mounted only while open, so every opening starts fresh. */}
      {open && <PickerBody excludeIds={excludeIds} onConfirm={onConfirm} onClose={() => onOpenChange(false)} />}
    </DialogShell>
  );
}

function PickerBody({
  excludeIds,
  onConfirm,
  onClose,
}: {
  excludeIds: string[];
  onConfirm: (reports: ReportRead[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [picked, setPicked] = React.useState<string[]>([]);
  const query = search.trim();
  const { data, error, loading, reload } = useResearch(() => fetchReports({ search: query || undefined, limit: 50 }), [query]);
  const reports = (data?.items ?? []).filter((r) => r.version_count > 0);

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-3">
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your reports…" icon={<Search />} aria-label="Search reports" autoFocus />
      {error ? (
        <InlineError message={error} onRetry={reload} />
      ) : loading ? (
        <div className="animate-pulse space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-gray-500">
          {query ? "No finished reports match that search." : "No finished reports yet — run some research first."}
        </p>
      ) : (
        <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
          {reports.map((r) => {
            const attached = excludeIds.includes(r.id);
            const on = picked.includes(r.id);
            return (
              <li key={r.id}>
                <label
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    attached ? "cursor-not-allowed opacity-50" : on ? "border-indigo-500/45 bg-indigo-500/[0.07]" : "border-white/[0.06] hover:bg-white/[0.03]"
                  )}
                >
                  <Checkbox checked={on || attached} disabled={attached} onChange={() => toggle(r.id)} className="mt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-100">{r.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                      <ReportStatePill state={r.state} />
                      <ModelDots models={r.selected_models} />
                      <span>v{r.version_count}</span>
                      <span>· {attached ? "already attached" : relativeTime(r.updated_at)}</span>
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={picked.length === 0}
          onClick={() => {
            onConfirm(reports.filter((r) => picked.includes(r.id)));
            onClose();
          }}
        >
          Attach {picked.length > 0 ? picked.length : ""}
        </Button>
      </div>
    </div>
  );
}
