import * as React from "react";
import { Check } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * A native checkbox (so keyboard, forms and screen readers behave as
 * expected) drawn as the Research registry's indigo tick box.
 */
export function Checkbox({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <span className={cn("relative inline-grid size-4 shrink-0 place-items-center", className)}>
      <input
        type="checkbox"
        className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded border border-white/20 bg-void transition-colors duration-150 checked:border-indigo-500 checked:bg-indigo-600 hover:border-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-45"
        {...props}
      />
      <Check
        strokeWidth={3}
        className="pointer-events-none relative size-3 text-white opacity-0 transition-opacity duration-100 peer-checked:opacity-100"
      />
    </span>
  );
}

/** Checkbox with its label — the "Include additional context" chips. */
export function CheckboxLabel({
  children,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "group inline-flex items-center gap-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-200 has-[:checked]:text-gray-200",
        className
      )}
    >
      <Checkbox {...props} />
      {children}
    </label>
  );
}
