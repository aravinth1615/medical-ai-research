import { Flask, Layers, ShieldCheck, TestTube } from "@/lib/icons";

const CAPABILITIES = [
  {
    icon: TestTube,
    title: "Every lab, one panel",
    text: "Vibrant, QLS and Lincoln results merged into one report, with prior draws side by side.",
    tone: "text-rose-400 bg-rose-500/10",
  },
  {
    icon: Layers,
    title: "Several models, one answer",
    text: "Ask once; each model answers with citations, then the passes are reconciled.",
    tone: "text-indigo-400 bg-indigo-500/15",
  },
  {
    icon: ShieldCheck,
    title: "Redacted by default",
    text: "Names, dates of birth and contact details are stripped before any model sees a record.",
    tone: "text-emerald-400 bg-emerald-500/10",
  },
];

/**
 * Auth shell: a brand column that states what the product does, beside the
 * form — the same instrument vocabulary as the app, no hero imagery.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.07] bg-rail p-10 lg:flex">
        <div className="grid-dots pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -top-40 -left-40 size-[480px] rounded-full bg-indigo-600/15 blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-linear-to-br/srgb from-indigo-500 to-sky-500 shadow-lg shadow-indigo-500/25">
            <Flask className="size-4.5 text-white" strokeWidth={2} />
          </span>
          <span className="text-sm font-bold tracking-wide text-white uppercase">Medical AI</span>
        </div>

        <div className="relative max-w-md">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 font-mono text-[11px] text-indigo-300">
            <span className="size-1.5 rounded-full bg-indigo-400" aria-hidden />
            Clinical research console
          </p>
          <h2 className="text-4xl leading-tight font-semibold tracking-tight text-white">
            Read the whole chart,
            <br />
            <span className="bg-linear-to-r/srgb from-indigo-300 to-sky-300 bg-clip-text text-transparent">
              not just the flags.
            </span>
          </h2>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-gray-400">
            Lab panels, sensor streams and treatment history, cross-referenced so a borderline value is read in
            the context it belongs to.
          </p>

          <ul className="mt-8 space-y-4">
            {CAPABILITIES.map((c) => (
              <li key={c.title} className="flex items-start gap-3">
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${c.tone}`}>
                  <c.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-100">{c.title}</span>
                  <span className="block text-sm leading-relaxed text-gray-400">{c.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <footer className="relative flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>© 2026 Medical AI</span>
          <span aria-hidden>·</span>
          <span>HIPAA-aligned PII redaction</span>
          <span aria-hidden>·</span>
          <span>For clinician use</span>
        </footer>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">{children}</main>
    </div>
  );
}
