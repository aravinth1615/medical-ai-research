"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/auth/store";

/**
 * Second line of the route guard (proxy.ts is the first). The proxy only sees
 * the cookie; this also catches a stored session that expired or was cleared
 * mid-visit and sends the user back to sign in, carrying where they were.
 *
 * Children render straight away — the proxy has already vouched for the
 * request — so pages prerender instead of waiting on a client check. Anything
 * that shows the user reads the store and renders a placeholder until then.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useSessionStore((s) => s.status);
  const hydrate = useSessionStore((s) => s.hydrate);
  const signedOut = useSessionStore((s) => s.signedOut);

  React.useEffect(() => {
    hydrate();
    // Signing out in another tab clears storage; follow it here too.
    const onStorage = () => hydrate();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [hydrate]);

  React.useEffect(() => {
    if (status !== "anonymous") return;
    // A deliberate sign-out starts fresh; an expired session comes back here.
    // The path is read at redirect time — usePathname() here would suspend
    // every page under the guard while a dynamic route prerenders.
    const pathname = window.location.pathname;
    const next = !signedOut && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [status, signedOut, router]);

  return <>{children}</>;
}
