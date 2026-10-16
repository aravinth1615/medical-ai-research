import * as React from "react";
import { cn } from "@/lib/utils";

const fieldChrome =
  "w-full rounded-lg bg-void text-sm text-gray-100 border border-white/10 transition-[border-color,box-shadow] duration-150 " +
  "placeholder:text-gray-500 hover:border-white/20 " +
  "focus:border-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 " +
  "disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-red-500/60";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; trailing?: React.ReactNode }
>(({ className, icon, trailing, ...props }, ref) => (
  <div className="relative flex w-full items-center">
    {icon && (
      <span className="pointer-events-none absolute left-3 text-gray-500 [&_svg]:size-4">{icon}</span>
    )}
    <input
      ref={ref}
      className={cn(fieldChrome, "h-10 px-3", icon && "pl-9", trailing && "pr-10", className)}
      {...props}
    />
    {trailing && <span className="absolute right-2 flex items-center">{trailing}</span>}
  </div>
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldChrome, "px-3 py-2.5 leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-medium text-gray-300">
          {label}
        </label>
        {hint}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
