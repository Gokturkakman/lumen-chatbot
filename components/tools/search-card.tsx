"use client";

import { ArrowUpRightIcon, GlobeIcon, LinkIcon } from "@/components/icons";
import { ToolCard, ToolError } from "@/components/tools/tool-shell";
import type { ReadUrlResult, SearchResult } from "@/lib/ai/tools";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { formatRelative } from "@/lib/utils";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SearchCard({ result }: { result: SearchResult }) {
  const { t, locale } = useI18n();

  if ("error" in result) return <ToolError message={result.error} />;

  return (
    <ToolCard
      icon={GlobeIcon}
      eyebrow={result.query}
      meta={t(`card.source.${result.source}` as TranslationKey)}
    >
      <ol>
        {result.hits.map((hit, index) => (
          <li key={hit.url}>
            <a
              href={hit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-3 border-b border-rule px-4 py-3 last:border-b-0 transition-colors hover:bg-sunken/45"
            >
              <span className="w-4 shrink-0 font-mono text-[11px] tabular-nums text-faint transition-colors group-hover:text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="min-w-0 truncate text-[13.5px] font-medium text-ink decoration-accent-rule underline-offset-2 group-hover:underline">
                    {hit.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-faint">
                    {hostOf(hit.url)}
                  </span>
                </span>

                {hit.snippet && (
                  <span className="mt-1 line-clamp-2 block text-[12.5px] leading-relaxed text-muted">
                    {hit.snippet}
                  </span>
                )}
                {hit.publishedAt && (
                  <span className="mt-1 block text-[11px] tabular-nums text-faint">
                    {formatRelative(hit.publishedAt, locale)}
                  </span>
                )}
              </span>

              <ArrowUpRightIcon
                size={13}
                className="shrink-0 translate-y-0.5 text-transparent transition-colors group-hover:text-accent"
              />
            </a>
          </li>
        ))}
      </ol>
    </ToolCard>
  );
}

export function ReadUrlCard({ result }: { result: ReadUrlResult }) {
  if ("error" in result) return <ToolError message={result.error} />;

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group my-3 inline-flex max-w-full items-center gap-2 rounded-full border border-rule bg-sunken/70 py-1.5 pl-3 pr-3.5 transition-colors hover:border-accent-rule hover:bg-accent-wash"
    >
      <LinkIcon size={12} className="shrink-0 text-accent" />
      <span className="truncate text-[12.5px] font-medium text-ink">
        {result.title ?? hostOf(result.url)}
      </span>
      <span className="shrink-0 font-mono text-[10.5px] text-faint">
        {hostOf(result.url)}
      </span>
    </a>
  );
}
