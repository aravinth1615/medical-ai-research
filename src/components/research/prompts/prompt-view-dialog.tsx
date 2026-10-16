"use client";

import * as React from "react";
import { Check, Copy, Library, Pencil, Sparkles } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import type { PromptTemplateRead } from "@/lib/research/types";
import {
  CategoryTag,
  DrawerCloseSlot,
  DrawerFooter,
  DrawerHeader,
  PromptByline,
  PromptDrawer,
  PromptStats,
  PromptText,
  useCopied,
} from "./prompts-ui";

/**
 * Read-only view of one Prompt library entry — the list only shows the start
 * of each description and two lines of the prompt, so this is where the whole
 * clinical question is read (and copied). A drawer from the right; nothing to
 * submit.
 */
export function PromptViewDialog({
  template,
  onOpenChange,
  onEdit,
  onUse,
}: {
  /** The prompt being viewed; null keeps the drawer closed. */
  template: PromptTemplateRead | null;
  onOpenChange: (open: boolean) => void;
  /** Present → adds an Edit button to the footer. */
  onEdit?: (template: PromptTemplateRead) => void;
  /** Present → adds "Use prompt" (start New Research with it). */
  onUse?: (template: PromptTemplateRead) => void;
}) {
  // Callers close this by clearing `template`; the last one shown stays on
  // screen while the drawer slides out, instead of emptying mid-slide.
  const [shown, setShown] = React.useState(template);
  if (template && template !== shown) setShown(template);

  return (
    <PromptDrawer open={template !== null} onOpenChange={onOpenChange} width="36rem">
      {shown && <PromptView key={shown.id} template={shown} onEdit={onEdit} onUse={onUse} />}
    </PromptDrawer>
  );
}

function PromptView({
  template,
  onEdit,
  onUse,
}: {
  template: PromptTemplateRead;
  onEdit?: (template: PromptTemplateRead) => void;
  onUse?: (template: PromptTemplateRead) => void;
}) {
  const { copied, copy } = useCopied(template.prompt);

  return (
    <>
      <DrawerHeader
        icon={<Library />}
        title={template.title}
        description={template.description || "The full text of this clinical research question."}
      >
        {template.category && <CategoryTag name={template.category.name} className="w-fit" />}
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-5 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-xs font-medium text-ink-2">Research question</span>
          <PromptStats text={template.prompt} />
        </div>
        {/* The prompt fills the drawer and scrolls within it. */}
        <PromptText text={template.prompt} className="min-h-0 flex-1 overflow-y-auto" />
        <PromptByline template={template} />
      </div>

      <DrawerFooter>
        <DrawerCloseSlot asChild>
          <Button type="button" variant="ghost" size="sm">
            Close
          </Button>
        </DrawerCloseSlot>
        {onEdit && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(template)}>
            <Pencil />
            Edit
          </Button>
        )}
        {/* Fixed width: the label and icon change when copied, and the
            button shouldn't resize under the pointer. */}
        <Button
          type="button"
          variant={onUse ? "secondary" : "primary"}
          size="sm"
          className="min-w-[8.5rem] justify-center"
          onClick={copy}
          aria-live="polite"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy prompt"}
        </Button>
        {onUse && (
          <Button type="button" variant="primary" size="sm" onClick={() => onUse(template)}>
            <Sparkles />
            Use prompt
          </Button>
        )}
      </DrawerFooter>
    </>
  );
}
