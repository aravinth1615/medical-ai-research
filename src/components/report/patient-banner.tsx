import { Lock, ShieldCheck } from "@/lib/icons";
import { PATIENT } from "@/lib/data/patient";
import { Tooltip } from "@/components/ui/tooltip";

/** The fields the PII scrubber removed, listed only on demand — four
 *  "[REDACTED]" values in a row are noise, not information. */
const REDACTED_FIELDS: [string, string][] = [
  ["Date of birth", PATIENT.dob],
  ["Phone", PATIENT.phone],
  ["Email", PATIENT.email],
  ["Address", PATIENT.address],
];

/**
 * Who the report is about — context for the page, not its subject, so it's
 * one quiet row: identity and demographics on the left, where the labs came
 * from on the right. Identifiers stay redacted, the way the record leaves the
 * PII scrubber.
 */
export function PatientBanner() {
  return (
    <header className="shrink-0 border-b border-white/[0.06] bg-[#06070B] px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-500/15 font-mono text-xs font-bold text-indigo-200 ring-1 ring-indigo-400/30 ring-inset"
          >
            {PATIENT.initials}
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <p className="flex min-w-0 items-baseline gap-2">
              <span className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">Patient</span>
              <span className="truncate font-mono text-[13px] font-semibold text-sky-300">{PATIENT.label}</span>
            </p>
            <span className="text-xs text-gray-400 tabular-nums">{PATIENT.demographics}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-300 uppercase">
              <ShieldCheck className="size-3" />
              PII redacted
            </span>
            <Tooltip
              side="bottom"
              align="start"
              content={
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                  {REDACTED_FIELDS.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-gray-400">{k}</dt>
                      <dd className="font-mono text-gray-200">{v}</dd>
                    </div>
                  ))}
                </dl>
              }
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-gray-500 transition-colors hover:bg-white/[0.05] hover:text-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:outline-none"
              >
                <Lock className="size-3" />
                Contact details hidden
              </button>
            </Tooltip>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
          {PATIENT.sources.map((s) => (
            <div key={s.label} className="flex items-baseline gap-1.5" title={`${s.label}: ${s.id}`}>
              <dt>{s.label.replace(/\s*ID$/, "")}</dt>
              <dd className="font-mono text-gray-300 tabular-nums">{s.date}</dd>
            </div>
          ))}
          <div className="flex items-baseline gap-1.5 border-l border-white/[0.08] pl-4">
            <dt>Provider</dt>
            <dd className="font-medium text-gray-200">{PATIENT.provider}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
