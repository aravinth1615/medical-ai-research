"use client";

import { FOLLOW_UP_LABS } from "@/lib/data/patient";
import { usePersistentState } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export function FollowUpLabs() {
  const [done, setDone] = usePersistentState<string[]>("omnimed.report.labs-done", []);
  const completed = FOLLOW_UP_LABS.filter((l) => done.includes(l.id)).length;

  const toggle = (id: string) => setDone(done.includes(id) ? done.filter((d) => d !== id) : [...done, id]);

  return (
    <section id="followup-workspace" className="scroll-mt-36 rounded-2xl border border-white/[0.08] bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">⚲ Diagnostic Re-Test Queue</p>
          <h2 className="mt-0.5 text-[17px] font-extrabold text-gray-100">Additional Labs &amp; Follow-Up Diagnostic Tests Needed</h2>
        </div>
        <span className="font-mono text-xs text-gray-400">
          {completed}/{FOLLOW_UP_LABS.length} ordered
        </span>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {FOLLOW_UP_LABS.map((lab) => {
          const isDone = done.includes(lab.id);
          return (
            <li key={lab.id}>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-void p-3 text-[12.5px] transition-colors hover:border-white/15">
                <span className="flex flex-1 items-center gap-2.5 text-gray-200">
                  <Checkbox checked={isDone} onChange={() => toggle(lab.id)} />
                  <span className={cn("transition-opacity", isDone ? "line-through opacity-50" : "font-medium")}>{lab.text}</span>
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10.5px] font-bold whitespace-nowrap text-amber-300">
                  {lab.when}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
