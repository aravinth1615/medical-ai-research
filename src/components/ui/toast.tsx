"use client";

import * as React from "react";
import { create } from "zustand";
import { CircleAlert, CircleCheck } from "@/lib/icons";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

interface ToastState {
  toast: { id: number; message: string; tone: ToastTone } | null;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** One toast at a time — a new one replaces whatever is up. */
export const useToast = create<ToastState>((set) => ({
  toast: null,
  show: (message, tone = "success") => {
    if (timer) clearTimeout(timer);
    set({ toast: { id: Date.now(), message, tone } });
    timer = setTimeout(() => set({ toast: null }), 2800);
  },
  dismiss: () => set({ toast: null }),
}));

export function Toaster() {
  const toast = useToast((s) => s.toast);
  if (!toast) return null;
  const Icon = toast.tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-5 left-1/2 z-toast flex -translate-x-1/2 animate-rise-in items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium shadow-2xl backdrop-blur-md",
        toast.tone === "error"
          ? "border-red-500/40 bg-[#1c1216]/95 text-red-200"
          : "border-indigo-500/40 bg-[#181C28]/95 text-indigo-200"
      )}
    >
      <Icon className={cn("size-4 shrink-0", toast.tone === "error" ? "text-red-400" : "text-indigo-400")} />
      <span>{toast.message}</span>
    </div>
  );
}
