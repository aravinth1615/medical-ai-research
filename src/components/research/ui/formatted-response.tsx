"use client";

import * as React from "react";
import { Check, Copy } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "./primitives";

/** Inline `code`, **bold** and [n] citation markers. Adjacent markers ("[1][5]")
 *  render as one "1,5" superscript — side by side they would read as "15". */
function renderInline(line: string): React.ReactNode[] {
  const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*|\s*(?:\[\d+\])+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="mx-0.5 rounded border border-white/10 bg-[#1E2231] px-1.5 py-0.5 font-mono text-[12.5px] text-indigo-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-gray-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^\s*(?:\[\d+\])+$/.test(part)) {
      return (
        <sup key={i} className="ml-0.5 align-super font-mono text-[10px] leading-none font-semibold text-indigo-400">
          {(part.match(/\d+/g) ?? []).join(",")}
        </sup>
      );
    }
    return part;
  });
}

/** A model's markdown answer: fenced code (with copy), #/##/### headings,
 *  bullet and numbered lists, paragraphs. */
export function FormattedResponse({
  text,
  onCopy,
  className,
}: {
  text: string;
  onCopy?: (message: string) => void;
  className?: string;
}) {
  const [copied, setCopied] = React.useState<number | null>(null);
  if (!text) return null;

  const segments: { type: "prose" | "code"; content: string; lang?: string }[] = [];
  const codeBlock = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = codeBlock.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ type: "prose", content: text.slice(lastIndex, match.index) });
    segments.push({ type: "code", lang: match[1] || "code", content: match[2].replace(/\n$/, "") });
    lastIndex = codeBlock.lastIndex;
  }
  if (lastIndex < text.length) segments.push({ type: "prose", content: text.slice(lastIndex) });

  return (
    <div className={cn("space-y-3 text-[14.5px] leading-[1.68] text-gray-200", className)}>
      {segments.map((seg, idx) => {
        if (seg.type === "code") {
          return (
            <div key={idx} className="my-3 overflow-hidden rounded-lg border border-white/10 bg-[#0B0D13]">
              <div className="flex items-center justify-between border-b border-white/5 bg-[#141722] px-3.5 py-1.5 font-mono text-[11px] text-gray-400">
                <span className="font-semibold tracking-wider text-indigo-400 uppercase">{seg.lang}</span>
                <button
                  type="button"
                  onClick={() => {
                    copyTextToClipboard(seg.content);
                    setCopied(idx);
                    onCopy?.("Snippet copied");
                    setTimeout(() => setCopied(null), 1800);
                  }}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-gray-300 transition-colors hover:bg-white/10"
                >
                  {copied === idx ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copied === idx ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="overflow-x-auto p-3.5 font-mono text-[12.5px] leading-[1.6] text-gray-200">
                <code>{seg.content}</code>
              </pre>
            </div>
          );
        }
        return (
          <div key={idx} className="space-y-2">
            {seg.content.split("\n").map((line, l) => {
              const t = line.trim();
              if (!t) return <div key={l} className="h-1" />;
              if (t.startsWith("### "))
                return (
                  <h4 key={l} className="pt-2 text-[15px] font-semibold tracking-tight text-white">
                    {renderInline(t.slice(4))}
                  </h4>
                );
              if (t.startsWith("## "))
                return (
                  <h3 key={l} className="border-b border-white/5 pt-2.5 pb-0.5 text-[16px] font-semibold tracking-tight text-white">
                    {renderInline(t.slice(3))}
                  </h3>
                );
              if (t.startsWith("# "))
                return (
                  <h2 key={l} className="pt-3 text-[17px] font-bold tracking-tight text-white">
                    {renderInline(t.slice(2))}
                  </h2>
                );
              if (t.startsWith("- ") || t.startsWith("* "))
                return (
                  <div key={l} className="flex items-start gap-2.5 pl-1">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-indigo-400/80" />
                    <span className="flex-1">{renderInline(t.slice(2))}</span>
                  </div>
                );
              const num = t.match(/^(\d+)\.\s+(.*)/);
              if (num)
                return (
                  <div key={l} className="flex items-start gap-2.5 pl-1">
                    <span className="mt-1 shrink-0 font-mono text-xs font-semibold text-indigo-400">{num[1]}.</span>
                    <span className="flex-1">{renderInline(num[2])}</span>
                  </div>
                );
              return (
                <p key={l} className="text-gray-200">
                  {renderInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
