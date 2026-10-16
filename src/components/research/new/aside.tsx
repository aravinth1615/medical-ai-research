"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const ASIDE_WIDTH = 310;

/**
 * The workspace's collapsible right drawer. In the flow it pushes the centre
 * column aside; as an overlay it slides over it instead, for when the page is
 * too narrow to give up the width — starting below the workspace header, so
 * its controls stay usable.
 */
export function Aside({
  open,
  overlay,
  right = 0,
  label,
  onClose,
  children,
}: {
  open: boolean;
  overlay: boolean;
  right?: number;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      onKeyDown={(e) => {
        if (overlay && e.key === "Escape") onClose();
      }}
      style={overlay ? { right } : undefined}
      className={cn(
        open ? "w-[310px]" : "w-0",
        "flex shrink-0 flex-col overflow-hidden bg-[#11131A] transition-[width] duration-300 ease-(--ease-in-out)",
        overlay
          ? cn("absolute top-14 bottom-0 z-30", open && "border-l border-white/[0.07] shadow-[-24px_0_60px_rgba(0,0,0,0.6)]")
          : "relative z-20 border-l border-white/[0.07]"
      )}
    >
      <div className="flex h-full w-[310px] flex-col">{children}</div>
    </aside>
  );
}
