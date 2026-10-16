import { redirect } from "next/navigation";
import { DEFAULT_AUTHED_ROUTE } from "@/lib/auth/config";

/* proxy.ts has already sent signed-out visitors to /login. */
export default function RootPage() {
  redirect(DEFAULT_AUTHED_ROUTE);
}
