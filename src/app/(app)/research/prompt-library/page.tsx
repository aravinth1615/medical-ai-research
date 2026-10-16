import type { Metadata } from "next";
import { PromptLibraryView } from "@/components/research/prompts/prompt-library-view";

export const metadata: Metadata = { title: "Prompt library" };

export default function PromptLibraryPage() {
  return <PromptLibraryView />;
}
