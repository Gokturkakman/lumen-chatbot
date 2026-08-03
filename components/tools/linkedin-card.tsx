"use client";

import { useState } from "react";

import { ArrowUpRightIcon, UserIcon } from "@/components/icons";
import { ToolCard, ToolError } from "@/components/tools/tool-shell";
import type { LinkedInResult } from "@/lib/ai/tools";
import { useI18n } from "@/lib/i18n";

const PREVIEW_CHARS = 520;

/** Strips Jina's "Title:/URL Source:/Markdown Content:" preamble. */
function cleanContent(raw: string): string {
  return raw
    .replace(/^Title:.*$/m, "")
    .replace(/^URL Source:.*$/m, "")
    .replace(/^Markdown Content:\s*/m, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function LinkedInCard({ result }: { result: LinkedInResult }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  if ("error" in result) return <ToolError message={result.error} />;

  const content = cleanContent(result.content);
  const truncated = content.length > PREVIEW_CHARS;
  const visible = expanded ? content : content.slice(0, PREVIEW_CHARS);

  return (
    <ToolCard icon={UserIcon} eyebrow="LinkedIn">
      <div className="flex items-start gap-3.5 border-b border-rule p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-accent-rule bg-accent-wash font-serif text-[17px] text-accent">
          {initials(result.name)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[19px] leading-tight text-ink">
            {result.name ?? result.url}
          </h3>
          {result.headline && (
            <p className="mt-1 text-[13px] leading-snug text-muted">
              {result.headline}
            </p>
          )}
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent"
          >
            {t("card.viewProfile")}
            <ArrowUpRightIcon
              size={11}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>

      {content && (
        <div className="px-4 py-3.5">
          <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">
            {visible}
            {truncated && !expanded && "…"}
          </p>
          {truncated && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-2 text-[12px] font-medium text-accent hover:underline"
            >
              {expanded ? "−" : "+"} {t("card.readMore")}
            </button>
          )}
        </div>
      )}

      {result.alternates.length > 0 && (
        <div className="border-t border-rule bg-sunken/45 px-4 py-3">
          <p className="eyebrow">{t("card.otherMatches")}</p>
          <ul className="mt-1.5 space-y-1">
            {result.alternates.map((alternate) => (
              <li key={alternate.url}>
                <a
                  href={alternate.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12.5px] text-muted hover:text-accent hover:underline"
                >
                  {alternate.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ToolCard>
  );
}
