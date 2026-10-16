import type { Metadata } from "next";
import { SourcesView } from "@/components/research/sources/sources-view";

export const metadata: Metadata = { title: "Sources" };

/* The source library — every reference the research runs have cited. */
export default function SourcesPage() {
  return <SourcesView />;
}
