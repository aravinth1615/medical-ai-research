import type { PlanItem } from "@/lib/data/summary";

function PlanList({ title, items }: { title: string; items: PlanItem[] }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-void p-5">
      <h3 className="mb-3 text-[13px] font-bold tracking-wide text-indigo-400 uppercase">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item.lead}
            className="relative pl-4 text-[13.5px] leading-relaxed text-gray-300 before:absolute before:left-0 before:text-gray-600 before:content-['•']"
          >
            <strong className="font-semibold text-gray-100">{item.lead}</strong> {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActionPlan({ diagnostics, treatment }: { diagnostics: PlanItem[]; treatment: PlanItem[] }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-panel p-5 sm:p-6">
      <h2 className="mb-4 border-b border-white/[0.06] pb-3 text-base font-bold text-gray-100">
        Suggested Testing &amp; Treatment Protocol
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <PlanList title="Required Diagnostics (Re-Test Queue)" items={diagnostics} />
        <PlanList title="Targeted Treatments & Lifestyle" items={treatment} />
      </div>
    </section>
  );
}
