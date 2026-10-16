import { Lock, ShieldCheck } from "@/lib/icons";

/**
 * The app's footer: a slim bar under the content area, the same height on
 * every page so long reports and full-height views (New Research, the
 * report's re-run box) keep their layout. Product name and the two promises
 * a clinician should always see — records are redacted, and the output is
 * decision support, not a diagnosis.
 */
export function AppFooter() {
  return (
    <footer className="flex h-(--app-footer-h) shrink-0 items-center justify-between gap-4 border-t border-white/[0.07] bg-[#090A0F]/85 px-3 text-[11px] text-gray-500 sm:px-4">
      <p className="flex min-w-0 items-center gap-2">
        <span className="font-semibold text-gray-300">© 2026 Medical AI</span>
        <span aria-hidden className="max-sm:hidden">
          ·
        </span>
        <span className="truncate max-sm:hidden">Clinical research console</span>
      </p>
      <ul className="flex shrink-0 items-center gap-4">
        <li className="flex items-center gap-1.5 max-md:hidden">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          HIPAA-aligned PII redaction
        </li>
        <li className="flex items-center gap-1.5 max-lg:hidden">
          <Lock className="size-3.5 text-gray-500" />
          Static demo data · no records leave this browser
        </li>
        <li className="font-medium text-gray-400">For clinician use · not a diagnosis</li>
      </ul>
    </footer>
  );
}
