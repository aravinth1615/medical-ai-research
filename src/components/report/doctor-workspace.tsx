"use client";

import * as React from "react";
import { Save } from "@/lib/icons";
import { DOCTOR_PLAN_DEFAULTS, type DoctorPlan } from "@/lib/data/patient";
import { usePersistentState } from "@/lib/storage";
import { cn, wait } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const BUCKETS: { key: keyof DoctorPlan; label: string; wide?: boolean }[] = [
  { key: "nextSteps", label: "1. Next Steps (Clinical Actions)" },
  { key: "prescriptions", label: "2. Prescriptions (Rx)" },
  { key: "supplements", label: "3. Vitamins & Supplements", wide: true },
];

function PlanForm({ saved, onSave }: { saved: DoctorPlan; onSave: (plan: DoctorPlan) => void }) {
  const [draft, setDraft] = React.useState<DoctorPlan>(saved);
  const [saving, setSaving] = React.useState(false);
  const showToast = useToast((s) => s.show);
  const dirty = BUCKETS.some((b) => draft[b.key] !== saved[b.key]);

  const submit = async () => {
    setSaving(true);
    await wait(400);
    onSave(draft);
    setSaving(false);
    showToast("Protocol saved");
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">✚ Clinician Collaboration Workspace</p>
          <h2 className="mt-0.5 text-[17px] font-extrabold text-gray-100">
            Doctor&rsquo;s Action Plan &amp; Clinical Protocol (5-Bucket Framework)
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {dirty && !saving && <span className="text-xs text-amber-300">Unsaved changes</span>}
          <Button variant="primary" size="sm" onClick={submit} loading={saving} disabled={!dirty}>
            {!saving && <Save />}
            {saving ? "Saving…" : "Save Protocol"}
          </Button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {BUCKETS.map((b) => (
          <div key={b.key} className={cn("rounded-xl border border-white/[0.06] bg-void p-3.5", b.wide && "md:col-span-2")}>
            <label htmlFor={`plan-${b.key}`} className="mb-2 block text-[11.5px] font-extrabold text-indigo-400 uppercase">
              {b.label}
            </label>
            <Textarea
              id={`plan-${b.key}`}
              rows={4}
              value={draft[b.key]}
              onChange={(e) => setDraft((d) => ({ ...d, [b.key]: e.target.value }))}
              className="bg-panel text-[12.5px]"
            />
          </div>
        ))}
      </div>
    </>
  );
}

export function DoctorWorkspace() {
  const [saved, save, hydrated] = usePersistentState<DoctorPlan>("omnimed.report.plan", DOCTOR_PLAN_DEFAULTS);
  return (
    <section id="doctor-workspace" className="scroll-mt-36 rounded-2xl border border-white/[0.08] bg-panel p-5 sm:p-6">
      {/* Remounts once storage has been read, so the draft starts from the
          stored plan rather than the defaults. */}
      <PlanForm key={hydrated ? "stored" : "default"} saved={saved} onSave={save} />
    </section>
  );
}
