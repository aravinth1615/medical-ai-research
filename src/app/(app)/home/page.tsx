import { redirect } from "next/navigation";
import { researchRoutes } from "@/lib/research/format";

/* Home is New Research — older links to /home land there. */
export default function HomePage() {
  redirect(researchRoutes.newResearch);
}
