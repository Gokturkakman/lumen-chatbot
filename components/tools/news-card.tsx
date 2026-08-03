"use client";

import { ArrowUpRightIcon, NewspaperIcon } from "@/components/icons";
import { ToolCard, ToolError } from "@/components/tools/tool-shell";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { NewsResult } from "@/lib/ai/tools";
import { formatRelative } from "@/lib/utils";

export function NewsCard({ result }: { result: NewsResult }) {
  const { t, locale } = useI18n();

  if ("error" in result) return <ToolError message={result.error} />;

  const [lead, ...rest] = result.items;
  const sourceLabel = t(`card.source.${result.source}` as TranslationKey);

  return (
    <ToolCard
      icon={NewspaperIcon}
      eyebrow={result.publisher}
      meta={sourceLabel}
    >
      {/* Lead story gets the image and the larger headline. */}
      <a
        href={lead.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-4 border-b border-rule p-4 transition-colors hover:bg-sunken/45"
      >
        {lead.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lead.image}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="h-[88px] w-[120px] shrink-0 rounded-lg border border-rule object-cover"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 font-serif text-[19px] leading-[1.22] text-ink decoration-accent-rule underline-offset-2 group-hover:underline">
              {lead.title}
            </h3>
            <ArrowUpRightIcon
              size={14}
              className="mt-1 shrink-0 text-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </div>

          {lead.summary && (
            <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
              {lead.summary}
            </p>
          )}
          {lead.publishedAt && (
            <p className="mt-2 text-[11px] tabular-nums text-faint">
              {formatRelative(lead.publishedAt, locale)}
            </p>
          )}
        </div>
      </a>

      {/* The rest as a numbered index — compact, scannable, editorial. */}
      <ol>
        {rest.map((item, index) => (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-3 border-b border-rule px-4 py-3 last:border-b-0 transition-colors hover:bg-sunken/45"
            >
              <span className="w-4 shrink-0 font-mono text-[11px] tabular-nums text-faint transition-colors group-hover:text-accent">
                {String(index + 2).padStart(2, "0")}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium leading-snug text-ink decoration-accent-rule underline-offset-2 group-hover:underline">
                  {item.title}
                </span>
                {item.publishedAt && (
                  <span className="mt-1 block text-[11px] tabular-nums text-faint">
                    {formatRelative(item.publishedAt, locale)}
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
