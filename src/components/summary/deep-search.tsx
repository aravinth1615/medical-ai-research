"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "@/lib/icons";
import { CONTEXT_SOURCES, DEEP_SEARCH_DEFAULT } from "@/lib/data/research";
import { useComposerStore } from "@/lib/research/composer-store";
import { createReport, defaultModelIds, fetchModels, pickableModels, runReport } from "@/lib/research/service";
import { fallbackTitle, researchRoutes } from "@/lib/research/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ContextSources } from "@/components/research/context-sources";

/** A literature review across the report's overlapping deviations — starts a
 *  real research run (standard depth, default models) and opens its report. */
export function DeepSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState(DEEP_SEARCH_DEFAULT);
  const [running, setRunning] = React.useState(false);
  const context = useComposerStore((s) => s.context);
  const showToast = useToast((s) => s.show);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = query.trim();
    if (question.length < 8) {
      showToast("Add a little more detail — the question is too short to research.", "error");
      return;
    }
    setRunning(true);
    const contextLine = context.length
      ? `\n\nInclude patient context: ${CONTEXT_SOURCES.filter((c) => context.includes(c.id)).map((c) => c.label).join(", ")}.`
      : "";
    const models = await fetchModels();
    const created = await createReport({
      title: fallbackTitle(question),
      prompt: `${question}${contextLine}`,
      model_ids: defaultModelIds(pickableModels(models.data ?? [])),
      depth: "standard",
      cadence: "run_once",
    });
    if (!created.data) {
      showToast(created.error, "error");
      setRunning(false);
      return;
    }
    const run = await runReport(created.data.id);
    if (!run.data) {
      showToast(run.error, "error");
      setRunning(false);
      return;
    }
    showToast(`Deep search started across ${run.data.model_executions.length} models`);
    router.push(researchRoutes.report(created.data.title, created.data.id));
  };

  return (
    <section className="relative mt-10 flex flex-col items-center overflow-hidden rounded-2xl border-2 border-indigo-500/70 bg-panel p-6 text-center shadow-[0_0_30px_rgba(79,70,229,0.18)] sm:p-8">
      <h2 className="mb-2 text-xl font-extrabold text-gray-100">AI Clinical Deep Search</h2>
      <p className="mb-6 max-w-2xl text-sm text-gray-400">
        Run a cross-referenced literature review on these overlapping deviations utilizing current medical
        databases and research protocols.
      </p>

      <ContextSources align="center" className="mb-6 w-full max-w-3xl border-b border-white/[0.06] pb-6" />

      <form onSubmit={onSubmit} className="flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
        <label htmlFor="deep-search" className="sr-only">
          Deep search question
        </label>
        <Input
          id="deep-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon={<Search />}
          className="h-12"
          disabled={running}
        />
        <Button type="submit" variant="primary" size="lg" className="h-12 px-6 font-bold" loading={running}>
          {running ? "Starting…" : "Run Search"}
        </Button>
      </form>
    </section>
  );
}
