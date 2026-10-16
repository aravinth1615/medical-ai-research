import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded border font-medium [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
        red: "bg-red-500/10 text-red-300 border-red-500/30",
        amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
        sky: "bg-sky-500/10 text-sky-300 border-sky-500/30",
        gray: "bg-white/[0.04] text-gray-400 border-white/10",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px] font-mono",
        md: "px-2 py-0.5 text-[11px]",
      },
      pill: { true: "rounded-full", false: "" },
    },
    defaultVariants: { tone: "gray", size: "md", pill: false },
  }
);

export type BadgeTone = NonNullable<VariantProps<typeof badge>["tone"]>;

export function Badge({
  className,
  tone,
  size,
  pill,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone, size, pill }), className)} {...props} />;
}

/** A small pulsing/steady dot, for live and status indicators. */
export function StatusDot({ tone, pulse }: { tone: "emerald" | "amber" | "red" | "gray"; pulse?: boolean }) {
  const color = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    red: "bg-red-400",
    gray: "bg-gray-500",
  }[tone];
  return (
    <span className="relative inline-flex size-2 shrink-0" aria-hidden>
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)} />}
      <span className={cn("relative inline-flex size-2 rounded-full", color)} />
    </span>
  );
}
