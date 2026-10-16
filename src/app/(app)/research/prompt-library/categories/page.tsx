import type { Metadata } from "next";
import { PromptCategoriesView } from "@/components/research/prompts/prompt-categories-view";

export const metadata: Metadata = { title: "Prompt categories" };

export default function PromptCategoriesPage() {
  return <PromptCategoriesView />;
}
