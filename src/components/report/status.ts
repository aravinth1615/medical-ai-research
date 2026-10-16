import type { Status } from "@/lib/data/biomarkers";
import { CircleAlert, CircleCheck, Info } from "@/lib/icons";

/** One mapping for every status mark in the report — colour, icon and label
 *  travel together so status is never colour alone. */
export const STATUS_META: Record<
  Status,
  { label: string; hex: string; dot: string; icon: typeof CircleAlert; chip: string; badge: "red" | "amber" | "emerald" }
> = {
  red: {
    label: "Red",
    hex: "#f87171",
    dot: "bg-red-400",
    icon: CircleAlert,
    chip: "bg-red-500/10 border-red-500/30 text-red-300",
    badge: "red",
  },
  yellow: {
    label: "Yellow",
    hex: "#fbbf24",
    dot: "bg-amber-400",
    icon: Info,
    chip: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    badge: "amber",
  },
  green: {
    label: "Green",
    hex: "#34d399",
    dot: "bg-emerald-400",
    icon: CircleCheck,
    chip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    badge: "emerald",
  },
};
