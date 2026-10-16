"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftOpen, PanelLeftClose, Plus } from "@/lib/icons";
import { crumbsFor } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { AccountMenu } from "@/components/auth/account-menu";

function Crumbs({ pathname }: { pathname: string }) {
  // Parent and page only — three truncated fragments read worse than two
  // whole words. The parent yields first when the bar runs short.
  const trail = crumbsFor(pathname).slice(-2);
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
      {trail.map((part, i) => {
        const last = i === trail.length - 1;
        return (
          <span
            key={`${part}-${i}`}
            className={cn("flex items-center gap-1.5", last ? "min-w-0" : "shrink-0 max-xl:hidden")}
            aria-current={last ? "page" : undefined}
          >
            {i > 0 && <span className="text-gray-600 max-xl:hidden">/</span>}
            <span className={cn("truncate", last ? "font-medium text-gray-100" : "text-gray-500")}>{part}</span>
          </span>
        );
      })}
    </nav>
  );
}

export function TopBar(props: { sidebarOpen: boolean; onToggleSidebar: () => void }) {
  // See Sidebar: the URL is read behind a boundary so dynamic routes can
  // still prerender the bar.
  return (
    <React.Suspense fallback={<TopBarView {...props} pathname="" />}>
      <TopBarAtPath {...props} />
    </React.Suspense>
  );
}

function TopBarAtPath(props: { sidebarOpen: boolean; onToggleSidebar: () => void }) {
  return <TopBarView {...props} pathname={usePathname()} />;
}

function TopBarView({
  sidebarOpen,
  onToggleSidebar,
  pathname,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  pathname: string;
}) {
  return (
    <header className="z-sticky flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#090A0F]/85 px-3 backdrop-blur-md sm:px-4">
      <Tooltip content={sidebarOpen ? "Collapse sidebar (Ctrl+\\)" : "Expand sidebar (Ctrl+\\)"} side="bottom">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </Tooltip>

      <div className="min-w-0 flex-1 pl-1">
        <Crumbs pathname={pathname} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="primary" size="sm">
          <Link href="/research">
            <Plus />
            <span className="max-sm:sr-only">New research</span>
          </Link>
        </Button>
        <AccountMenu />
      </div>
    </header>
  );
}
