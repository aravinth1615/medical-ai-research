import type { Metadata } from "next";
import { ReportDashboard } from "@/components/report/report-dashboard";

export const metadata: Metadata = { title: "Report" };

export default function ReportPage() {
  return <ReportDashboard />;
}
