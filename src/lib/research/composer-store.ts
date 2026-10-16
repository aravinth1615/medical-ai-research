"use client";

import { create } from "zustand";
import type { ContextSourceId } from "@/lib/data/research";

/**
 * A question handed to New Research from elsewhere (the AI Gap Analyzer),
 * plus the patient context the Executive Summary's deep search sends. New
 * Research takes the draft once and clears it.
 */
interface ComposerState {
  draft: string;
  context: ContextSourceId[];
  setDraft: (draft: string) => void;
  takeDraft: () => string;
  toggleContext: (id: ContextSourceId) => void;
}

export const useComposerStore = create<ComposerState>((set, get) => ({
  draft: "",
  context: ["sensors", "nutrition"],
  setDraft: (draft) => set({ draft }),
  takeDraft: () => {
    const draft = get().draft;
    if (draft) set({ draft: "" });
    return draft;
  },
  toggleContext: (id) =>
    set((s) => ({
      context: s.context.includes(id) ? s.context.filter((c) => c !== id) : [...s.context, id],
    })),
}));
