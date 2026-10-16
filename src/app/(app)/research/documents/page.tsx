import type { Metadata } from "next";
import { DocumentsView } from "@/components/research/documents/documents-view";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return <DocumentsView />;
}
