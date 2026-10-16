import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert, CircleCheck, Flame } from "@/lib/icons";
import { FOOD_LOG, GLUCOSE_PEAK_LIMIT } from "@/lib/data/records";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeaderBar, PageIntro, SectionCard, StatTile, tableStyles as t } from "@/components/shell/page-frame";

export const metadata: Metadata = { title: "Nutrition & Food Log" };

export default function NutritionPage() {
  const meals = FOOD_LOG.meals;
  const totals = meals.reduce(
    (acc, m) => ({ carbs: acc.carbs + m.carbs, protein: acc.protein + m.protein, kcal: acc.kcal + m.kcal }),
    { carbs: 0, protein: 0, kcal: 0 }
  );
  const spikes = meals.filter((m) => m.peak > GLUCOSE_PEAK_LIMIT);

  return (
    <div className="flex min-h-full animate-fade-in flex-col">
      <PageHeaderBar
        icon={<Flame />}
        title="Nutrition & Food Log"
        badge={`${meals.length} entries`}
        status="Linked to Dexcom G7"
        actions={
          <Button asChild variant="primary" size="sm">
            <Link href="/health-data/sensors/dexcom-g7">
              Glucose trace
              <ArrowRight />
            </Link>
          </Button>
        }
      />
      <PageIntro
        labelIcon={<Flame />}
        label="Digital health data"
        title={`${FOOD_LOG.date}'s meals against CGM response`}
        description={`Each entry carries the highest glucose reading within two hours of eating. Peaks over ${GLUCOSE_PEAK_LIMIT} mg/dL are flagged.`}
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Energy" value={totals.kcal.toLocaleString("en-US")} unit="kcal" tone="sky" caption="Logged total" />
          <StatTile label="Carbohydrate" value={totals.carbs} unit="g" tone="amber" caption={`${Math.round((totals.carbs * 4 * 100) / totals.kcal)}% of energy`} />
          <StatTile label="Protein" value={totals.protein} unit="g" tone="indigo" caption="≈ 1.6 g/kg body weight" />
          <StatTile
            label="Meals over target"
            value={spikes.length}
            tone={spikes.length ? "red" : "emerald"}
            caption={spikes.length ? spikes.map((s) => s.meal).join(" & ") : "All within target"}
          />
        </div>

        <SectionCard icon={<Flame className="text-orange-400" />} title="Food log" aside={FOOD_LOG.date} flush>
          <div className={t.wrap}>
            <table className={t.table}>
              <thead className={t.thead}>
                <tr>
                  <th scope="col" className={t.th}>Time</th>
                  <th scope="col" className={t.th}>Meal</th>
                  <th scope="col" className={t.th}>Carbs</th>
                  <th scope="col" className={t.th}>Protein</th>
                  <th scope="col" className={t.th}>Energy</th>
                  <th scope="col" className={t.th}>Glucose peak (2 h)</th>
                </tr>
              </thead>
              <tbody>
                {meals.map((m) => {
                  const high = m.peak > GLUCOSE_PEAK_LIMIT;
                  return (
                    <tr key={m.time} className={t.tr}>
                      <td className={cn(t.td, "font-mono")}>{m.time}</td>
                      <td className={t.td}>
                        <p className="text-sm font-semibold text-gray-100">{m.meal}</p>
                        <p className="mt-0.5 text-gray-500">{m.items}</p>
                      </td>
                      <td className={cn(t.td, "font-mono")}>{m.carbs} g</td>
                      <td className={cn(t.td, "font-mono")}>{m.protein} g</td>
                      <td className={cn(t.td, "font-mono")}>{m.kcal} kcal</td>
                      <td className={t.td}>
                        <Badge tone={high ? "amber" : "emerald"} pill>
                          {high ? <CircleAlert /> : <CircleCheck />}
                          {m.peak} mg/dL{high ? " · above target" : ""}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </PageBody>
    </div>
  );
}
