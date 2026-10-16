import type { Metadata } from "next";
import { NewResearchView } from "@/components/research/new/new-research-view";

export const metadata: Metadata = { title: "New Research" };

export default function NewResearchPage() {
  return <NewResearchView />;
}
