"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Flask, PanelLeftClose } from "@/lib/icons";
import { NAV, NAV_PREFERENCE, NAV_PRIMARY, TONE_CLASSES, isActivePath, type NavItem } from "@/config/nav";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/badge";
import { AccountMenu } from "@/components/auth/account-menu";
import { SidebarReports } from "./sidebar-reports";

function Brand({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/[0.07] px-3">
      <Link href="/research" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-linear-to-br/srgb from-indigo-500 to-sky-500 shadow-md shadow-indigo-500/20">
          <Flask className="size-4 text-white" strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-wide text-white uppercase">Medical AI</span>
          <span className="block truncate text-[11px] text-gray-500">Clinical research console</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onClose}
        aria-label="Collapse sidebar"
        className="grid size-8 shrink-0 place-items-center rounded-md text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200"
      >
        <PanelLeftClose className="size-4" />
      </button>
    </div>
  );
}

function NavRow({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const tone = TONE_CLASSES[item.tone];
  const childActive = item.children?.some((c) => isActivePath(pathname, c.href)) ?? false;
  const [open, setOpen] = React.useState(item.defaultOpen || childActive);
  const [wasActive, setWasActive] = React.useState(childActive);
  const listId = React.useId();

  // Arriving at a record from elsewhere (a link, the back button) reveals its
  // group rather than leaving the active row hidden. Adjusted during render,
  // so there's no extra pass with the group shut.
  if (childActive !== wasActive) {
    setWasActive(childActive);
    if (childActive) setOpen(true);
  }

  const rowClass = cn(
    "group flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold tracking-wide transition-colors duration-150",
    tone.text,
    tone.hover
  );

  if (item.href) {
    const on = isActivePath(pathname, item.href, item.exact);
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={on ? "page" : undefined}
        className={cn(rowClass, on && tone.active)}
      >
        <item.icon className="size-4 shrink-0 opacity-85" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={listId}
        className={rowClass}
      >
        <item.icon className="size-4 shrink-0 opacity-85" />
        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-50 transition-transform duration-200 ease-(--ease-out)",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <ul id={listId} className={cn("mt-1 mb-2 ml-5 space-y-0.5 border-l-2 pl-3", tone.rule)}>
          {item.children?.map((leaf) => {
            const on = isActivePath(pathname, leaf.href);
            return (
              <li key={leaf.href}>
                <Link
                  href={leaf.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  title={leaf.label}
                  className={cn(
                    "flex h-8 items-center gap-2 rounded-md px-2.5 text-xs transition-colors duration-150",
                    on ? cn("font-medium", tone.active) : cn("text-gray-400 hover:text-gray-200", tone.hover)
                  )}
                >
                  {leaf.device && <StatusDot tone={leaf.live ? "emerald" : "gray"} pulse={leaf.live} />}
                  <span className="truncate">{leaf.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SystemIntegrity() {
  return (
    <div className="px-1.5 pb-2.5">
      <p className="mb-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">System Integrity</p>
      <p className="flex items-center gap-2 text-xs font-medium text-gray-300">
        <StatusDot tone="emerald" pulse />
        All APIs Operational
      </p>
    </div>
  );
}

/**
 * The main sidebar: New Research and its Reports, then the patient records,
 * treatment and health-data sections, then the collapsible Preference group
 * (the research settings pages). At lg+ it sits in the layout and collapses to
 * zero width; below lg it's an overlay drawer on a transform, so the content
 * keeps its full width on small screens.
 */
export function Sidebar(props: { pref: boolean | null; onClose: () => void }) {
  // The current URL is unknown while a dynamic route prerenders (a report or
  // folder id), so it's read behind a boundary; the fallback is the same
  // sidebar with nothing marked active.
  return (
    <React.Suspense fallback={<SidebarView {...props} pathname="" version={null} />}>
      <SidebarAtPath {...props} />
    </React.Suspense>
  );
}

function SidebarAtPath(props: { pref: boolean | null; onClose: () => void }) {
  return <SidebarView {...props} pathname={usePathname()} version={useSearchParams().get("version")} />;
}

function SidebarView({
  pref,
  onClose,
  pathname,
  version,
}: {
  pref: boolean | null;
  onClose: () => void;
  pathname: string;
  version: string | null;
}) {
  /* On the overlay drawer, picking a record should reveal it. On desktop the
     rail stays — stepping through records one after another is its main use. */
  const closeIfOverlay = React.useCallback(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) onClose();
  }, [onClose]);

  return (
    <>
      {pref === true && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-backdrop animate-fade-in bg-black/60 lg:hidden"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={cn(
          "z-drawer flex shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-rail",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:transition-transform max-lg:duration-300 max-lg:ease-(--ease-drawer)",
          "lg:static lg:min-w-0",
          "w-68",
          pref === null && "max-lg:-translate-x-full",
          pref === true && "max-lg:translate-x-0",
          pref === false && "max-lg:-translate-x-full lg:w-0 lg:border-r-0"
        )}
      >
        <div className="flex min-h-0 w-68 min-w-68 flex-1 flex-col">
          <Brand onClose={onClose} />

          <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              <NavRow item={NAV_PRIMARY} pathname={pathname} onNavigate={closeIfOverlay} />
              <SidebarReports pathname={pathname} version={version} onNavigate={closeIfOverlay} />
            </div>
            {NAV.map((section) => (
              <div key={section.label}>
                <h2 className="mb-2 px-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                  {section.label}
                </h2>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavRow key={item.label} item={item} pathname={pathname} onNavigate={closeIfOverlay} />
                  ))}
                </div>
              </div>
            ))}
            <NavRow item={NAV_PREFERENCE} pathname={pathname} onNavigate={closeIfOverlay} />
          </nav>

          <div className="shrink-0 border-t border-white/[0.07] p-3">
            <SystemIntegrity />
            <AccountMenu variant="card" />
          </div>
        </div>
      </aside>
    </>
  );
}
