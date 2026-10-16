"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { DESKTOP_SIDEBAR, useMediaQuery } from "@/lib/use-media-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { AppFooter } from "./app-footer";

/**
 * A side pane's open state. `null` means "not chosen yet" and is resolved by
 * CSS alone — open at desktop widths, closed below — so there's no flash of
 * the wrong layout on load and nothing to sync in an effect.
 */
export type PanePref = boolean | null;

/**
 * The app scrolls inside <main>, not the window, so Next's scroll restoration
 * never sees it — reset it on every route change, or a deep scroll carries
 * over onto the next page. Hash links (the report's section nav) keep theirs.
 */
function ScrollReset({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const pathname = usePathname();
  React.useEffect(() => {
    if (!window.location.hash) target.current?.scrollTo({ top: 0 });
  }, [pathname, target]);
  return null;
}

function ScrollMain({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLElement>(null);
  return (
    // `relative` makes <main> the containing block for every absolutely
    // positioned descendant (sr-only labels, input icons). Without it they're
    // placed against the page, escape this scroller's clipping, stretch the
    // document — and an anchor jump then scrolls the window, sliding the
    // whole shell up.
    <main ref={ref} id="app-scroll" className="relative min-h-0 flex-1 overflow-y-auto">
      <React.Suspense fallback={null}>
        <ScrollReset target={ref} />
      </React.Suspense>
      {children}
    </main>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarPref, setSidebarPref] = React.useState<PanePref>(null);
  const sidebarDesktop = useMediaQuery(DESKTOP_SIDEBAR);
  const sidebarOpen = sidebarPref ?? sidebarDesktop;

  const toggleSidebar = React.useCallback(
    () => setSidebarPref((p) => !(p ?? window.matchMedia(DESKTOP_SIDEBAR).matches)),
    []
  );
  const closeSidebar = React.useCallback(() => setSidebarPref(false), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "\\" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
      // Escape dismisses the overlay drawer on small screens.
      if (e.key === "Escape" && !window.matchMedia(DESKTOP_SIDEBAR).matches) {
        setSidebarPref((p) => (p ? false : p));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  return (
    <TooltipProvider delayDuration={250} skipDelayDuration={150}>
      <div className="flex h-dvh overflow-hidden bg-canvas">
        <Sidebar pref={sidebarPref} onClose={closeSidebar} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
          <ScrollMain>{children}</ScrollMain>
          <AppFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}
