"use client";

import * as React from "react";
import { BookOpen, Check, CircleAlert, FileText, Globe, Hash, Library, Rss, type IconComponent } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogShell } from "@/components/research/ui/dialog";
import { sourceKind } from "@/lib/research/format";
import type { AddSourceInput, SourceType } from "@/lib/research/types";
import { cn } from "@/lib/utils";

/** The glyph for each source type — shared with the Sources table. */
export const KIND_ICON: Record<SourceType, IconComponent> = {
  academic: Library,
  web: Globe,
  news: Rss,
  filings: BookOpen,
  social: Hash,
  internal: FileText,
};

/** The kinds a hand-added source can be — the backend's SourceType values,
 *  labelled the way the Sources page's type filter labels them, each with
 *  what belongs in it and the colour the page's Source mix uses for it. */
const SOURCE_TYPE_OPTIONS: { value: SourceType; hint: string }[] = [
  { value: "academic", hint: "Journals, trials and meta-analyses" },
  { value: "filings", hint: "Society guidelines and consensus statements" },
  { value: "web", hint: "Health-authority pages and NIH fact sheets" },
  { value: "news", hint: "Medical news and trial read-outs" },
  { value: "social", hint: "Patient forums and community threads" },
  { value: "internal", hint: "Never sent to a third-party model" },
];

export type AddDomainInput = Required<Pick<AddSourceInput, "url" | "title" | "source_type" | "is_paywalled" | "is_internal">>;

/** "nejm.org" or "nejm.org/doi/…" → a full https:// URL; null when it still
 *  isn't a web address after that. */
export function normalizeSourceUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // A bare word ("localhost", "intranet") has no dot — not a public domain.
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

const FORM_ID = "add-domain-form";

/**
 * Add a journal, guideline body or health-authority page to the source
 * library by hand. The form lives inside the dialog's content, which Radix
 * unmounts once closed, so every opening starts with empty fields.
 */
export function AddDomainDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves once saved; throws with a readable message on failure. */
  onSubmit: (input: AddDomainInput) => Promise<void>;
}) {
  // While saving, the dialog can't be closed (Esc, outside click, ×, Cancel).
  const [busy, setBusy] = React.useState(false);

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      dismissable={!busy}
      icon={<Globe />}
      title="Add a domain"
      description="Add a journal, guideline body or health-authority page to your source library by hand. One that's already there is kept as it is, not added twice."
      width="32rem"
      top="8%"
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="sm" loading={busy}>
            {!busy && <Globe />}
            Add domain
          </Button>
        </>
      }
    >
      <AddDomainForm busy={busy} onBusyChange={setBusy} onOpenChange={onOpenChange} onSubmit={onSubmit} />
    </DialogShell>
  );
}

function AddDomainForm({
  busy,
  onBusyChange,
  onOpenChange,
  onSubmit,
}: {
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: AddDomainInput) => Promise<void>;
}) {
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [sourceType, setSourceType] = React.useState<SourceType>("academic");
  const [paywalled, setPaywalled] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const kindRefs = React.useRef(new Map<SourceType, HTMLButtonElement>());

  const normalized = normalizeSourceUrl(url);
  const host = normalized ? hostOf(normalized) : null;
  const invalid = url.trim() !== "" && !normalized;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!normalized) {
      setError("Enter a web address, e.g. nejm.org or https://ods.od.nih.gov/factsheets/.");
      return;
    }
    onBusyChange(true);
    setError(null);
    try {
      await onSubmit({
        url: normalized,
        // No title given: the domain itself names the source.
        title: title.trim() || hostOf(normalized),
        source_type: sourceType,
        is_paywalled: paywalled,
        is_internal: sourceType === "internal",
      });
      onBusyChange(false);
      onOpenChange(false);
    } catch (err) {
      onBusyChange(false);
      setError(err instanceof Error ? err.message : "That didn't go through. Try again.");
    }
  };

  /* The kind tiles are one radio group: Tab lands on the picked one, the
     arrow keys move (and pick) along it, as a native radio group does. */
  function onKindKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[e.key];
    if (!step) return;
    e.preventDefault();
    const next = SOURCE_TYPE_OPTIONS[(index + step + SOURCE_TYPE_OPTIONS.length) % SOURCE_TYPE_OPTIONS.length];
    setSourceType(next.value);
    kindRefs.current.get(next.value)?.focus();
  }

  const picked = sourceKind(sourceType);
  const PickedIcon = KIND_ICON[sourceType];

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-6">
      {/* The address — the one thing required. */}
      <div className="space-y-1.5">
        <label htmlFor="domain-url" className="text-xs font-medium text-ink-2">
          Domain or URL
        </label>
        <div className="relative">
          <Input
            id="domain-url"
            autoFocus
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            maxLength={2048}
            value={url}
            disabled={busy}
            aria-invalid={invalid || (error !== null && !normalized) || undefined}
            aria-describedby="domain-url-hint"
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="nejm.org or https://ods.od.nih.gov/factsheets/…"
            icon={<Globe />}
            className="pr-9"
          />
          {normalized && (
            <Check
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-good"
            />
          )}
        </div>
        <p id="domain-url-hint" className={cn("text-[11px]", invalid ? "text-amber-300" : "text-ink-4")}>
          {invalid ? "Not a web address yet — add the domain, e.g. cdc.gov." : "A bare domain is saved as https://."}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="domain-title" className="text-xs font-medium text-ink-2">
          Title <span className="font-normal text-ink-4">· optional</span>
        </label>
        <Input
          id="domain-title"
          maxLength={512}
          value={title}
          disabled={busy}
          aria-describedby="domain-title-hint"
          onChange={(e) => setTitle(e.target.value)}
          placeholder={host ?? "e.g. NIH ODS — Vitamin D fact sheet"}
        />
        <p id="domain-title-hint" className="text-[11px] text-ink-4">
          Left empty, the domain names the source.
        </p>
      </div>

      {/* Kind — every option in view, each saying what belongs in it. */}
      <fieldset className="space-y-2">
        <legend id="domain-kind-label" className="mb-2 text-xs font-medium text-ink-2">
          Kind
        </legend>
        <div role="radiogroup" aria-labelledby="domain-kind-label" className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          {SOURCE_TYPE_OPTIONS.map((o, i) => {
            const on = o.value === sourceType;
            const kind = sourceKind(o.value);
            const Icon = KIND_ICON[o.value];
            return (
              <button
                key={o.value}
                ref={(el) => {
                  if (el) kindRefs.current.set(o.value, el);
                  else kindRefs.current.delete(o.value);
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                disabled={busy}
                onClick={() => setSourceType(o.value)}
                onKeyDown={(e) => onKindKeyDown(e, i)}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150",
                  "focus-visible:shadow-[0_0_0_1px_var(--color-iris)] focus-visible:outline-none disabled:cursor-not-allowed",
                  on ? "border-iris/50 bg-iris-well/50" : "border-line hover:border-line-2 hover:bg-overlay/50"
                )}
              >
                <span
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md"
                  style={{ color: kind.color, backgroundColor: `color-mix(in oklab, ${kind.color} 16%, transparent)` }}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-xs font-medium", on ? "text-ink" : "text-ink-2")}>{kind.label}</span>
                  <span className="block text-[11px] leading-snug text-ink-4">{o.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Paywall — a switch, with what it means. */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-line px-3.5 py-3">
        <label htmlFor="domain-paywall" className="min-w-0 cursor-pointer">
          <span className="block text-xs font-medium text-ink-2">Behind a paywall</span>
          <span id="domain-paywall-hint" className="mt-0.5 block text-[11px] leading-snug text-ink-4">
            Turn on when the full text needs a journal subscription or institutional access.
          </span>
        </label>
        <button
          id="domain-paywall"
          type="button"
          role="switch"
          aria-checked={paywalled}
          aria-describedby="domain-paywall-hint"
          disabled={busy}
          onClick={() => setPaywalled((v) => !v)}
          className={cn(
            "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150",
            "disabled:cursor-not-allowed disabled:opacity-45",
            paywalled ? "border-indigo-500 bg-indigo-600" : "border-white/15 bg-void hover:border-white/30"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block size-3.5 rounded-full bg-white shadow transition-transform duration-150 ease-(--ease-out)",
              paywalled ? "translate-x-[18px]" : "translate-x-[2px]"
            )}
          />
        </button>
      </div>

      {/* How it will appear in the library, before it's added. */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium tracking-wide text-ink-4 uppercase">Preview</span>
        {normalized && host ? (
          <div className="flex items-center gap-3 rounded-lg bg-void/50 px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-lg"
              style={{ color: picked.color, backgroundColor: `color-mix(in oklab, ${picked.color} 16%, transparent)` }}
            >
              <PickedIcon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-ink">{title.trim() || host}</span>
              <span className="block truncate font-mono text-[11px] text-ink-4">{normalized.replace(/^https?:\/\//, "")}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-md bg-overlay px-1.5 py-0.5 text-[11px] text-ink-3">{picked.label}</span>
              {paywalled && <span className="rounded-md bg-warn/15 px-1.5 py-0.5 text-[11px] text-warn">Paywalled</span>}
            </span>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[11px] text-ink-4">
            Enter a domain or URL to see how it will appear in your library.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-critical/10 px-3 py-2 text-xs text-critical">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </form>
  );
}
