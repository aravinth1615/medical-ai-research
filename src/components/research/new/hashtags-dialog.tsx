"use client";

import * as React from "react";
import { Hash, Plus, X } from "@/lib/icons";
import { normalizeHashtagInput } from "@/lib/research/format";
import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/research/ui/dialog";

/** The report's hashtags, opened from the chat box's # button. Tags are added
 *  with Enter, a comma or the Add button and saved with the report when it
 *  runs. Read-only while a run is under way. */
export function HashtagsDialog({
  open,
  onOpenChange,
  hashtags,
  onChange,
  locked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hashtags: string[];
  onChange: (tags: string[]) => void;
  locked: boolean;
}) {
  const [draft, setDraft] = React.useState("");

  const commit = () => {
    const tag = normalizeHashtagInput(draft);
    if (tag && !hashtags.includes(tag)) onChange([...hashtags, tag]);
    setDraft("");
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) commit();
        onOpenChange(next);
      }}
      icon={<Hash />}
      title="Hashtags"
      description={
        locked
          ? "This run's tags — they can be changed once it finishes."
          : "Saved with the report when you run the research, so related reports can be found together."
      }
      width="28rem"
      footer={
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            commit();
            onOpenChange(false);
          }}
        >
          Done
        </Button>
      }
    >
      <div className="space-y-3">
        {!locked && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Hash className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      commit();
                    }
                  }}
                  maxLength={50}
                  aria-label="Hashtag"
                  aria-describedby="hashtag-hint"
                  placeholder={hashtags.length ? "Add another hashtag" : "e.g. lipids"}
                  className="h-9 w-full rounded-lg border border-white/10 bg-void pr-3 pl-8 font-mono text-xs text-gray-100 placeholder:text-gray-500 focus:border-indigo-500/60 focus:outline-none"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={commit} disabled={!draft.trim()}>
                <Plus />
                Add
              </Button>
            </div>
            <p id="hashtag-hint" className="text-[11px] text-gray-500">
              Press Enter or a comma to add each tag.
            </p>
          </>
        )}
        {hashtags.length > 0 ? (
          <ul aria-label="Added hashtags" className="flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <li
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/15 py-0.5 pr-1 pl-2.5 font-mono text-xs text-indigo-300"
              >
                #{tag}
                <button
                  type="button"
                  disabled={locked}
                  aria-label={`Remove #${tag}`}
                  onClick={() => onChange(hashtags.filter((t) => t !== tag))}
                  className="rounded-full p-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-xs text-gray-500">No hashtags yet.</p>
        )}
      </div>
    </DialogShell>
  );
}
