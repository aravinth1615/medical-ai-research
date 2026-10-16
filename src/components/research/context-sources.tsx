"use client";

import { CONTEXT_SOURCES } from "@/lib/data/research";
import { useComposerStore } from "@/lib/research/composer-store";
import { CheckboxLabel } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/** "Include additional context" — which patient data rides with a question. */
export function ContextSources({ className, align = "start" }: { className?: string; align?: "start" | "center" }) {
  const context = useComposerStore((s) => s.context);
  const toggle = useComposerStore((s) => s.toggleContext);
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend
        className={cn(
          "mb-2.5 block w-full text-[10px] font-bold tracking-wider text-gray-500 uppercase",
          align === "center" && "text-center"
        )}
      >
        Include Additional Context
      </legend>
      <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2.5", align === "center" && "justify-center")}>
        {CONTEXT_SOURCES.map((c) => (
          <CheckboxLabel key={c.id} checked={context.includes(c.id)} onChange={() => toggle(c.id)}>
            {c.label}
          </CheckboxLabel>
        ))}
      </div>
    </fieldset>
  );
}
