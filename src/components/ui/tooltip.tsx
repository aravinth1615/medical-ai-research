"use client";

import * as React from "react";
import * as T from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = T.Provider;

export function Tooltip({
  content,
  side = "top",
  align = "center",
  children,
  className,
}: {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  children: React.ReactNode;
  className?: string;
}) {
  if (!content) return <>{children}</>;
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={8}
          className={cn(
            "anim-pop surface-raised z-popover max-w-64 rounded-lg px-2.5 py-1.5 text-xs text-gray-100",
            className
          )}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
