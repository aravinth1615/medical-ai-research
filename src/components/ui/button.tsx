"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader } from "@/lib/icons";
import { cn } from "@/lib/utils";

const button = cva(
  /* Press feedback is transform-only and ~150ms — the interface confirming it
     heard you. `scale` carries the label and icon with it. */
  "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium select-none " +
    "transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-150 ease-(--ease-out) " +
    "active:scale-[0.97] active:duration-100 disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* The Research workspace's active control: solid indigo-600, white
           label, a soft indigo glow underneath. */
        primary:
          "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:bg-indigo-700",
        /* Its quiet sibling: a tinted indigo well with a hairline ring. */
        soft:
          "bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/25 hover:text-white",
        secondary:
          "bg-white/[0.04] text-gray-200 border border-white/10 hover:bg-white/[0.08] hover:text-white",
        ghost: "text-gray-400 hover:bg-white/[0.06] hover:text-gray-100",
        danger:
          "bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 hover:text-red-200",
        link: "h-auto p-0 text-indigo-400 underline-offset-4 hover:text-indigo-300 hover:underline active:scale-100",
      },
      size: {
        xs: "h-7 rounded-md px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-8 rounded-md px-3 text-xs [&_svg]:size-4",
        md: "h-9 rounded-lg px-3.5 text-sm [&_svg]:size-4",
        lg: "h-11 rounded-lg px-5 text-sm [&_svg]:size-4.5",
        icon: "size-9 rounded-lg [&_svg]:size-4.5",
        "icon-sm": "size-8 rounded-md [&_svg]:size-4",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, children, disabled, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(button({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        type={asChild ? undefined : (type ?? "button")}
        {...props}
      >
        {loading && !asChild ? (
          <>
            <Loader className="animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { button as buttonVariants };
