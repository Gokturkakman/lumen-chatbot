"use client";

import { ArrowUpRightIcon, PlayIcon } from "@/components/icons";
import { ToolCard, ToolError } from "@/components/tools/tool-shell";
import type { YouTubeResult } from "@/lib/ai/tools";
import { useI18n } from "@/lib/i18n";

/** "4:12" → 252 seconds, so a timestamp can become a ?t= deep link. */
function toSeconds(timestamp: string): number | null {
  const parts = timestamp.split(":").map((piece) => Number.parseInt(piece, 10));
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function YouTubeCard({ result }: { result: YouTubeResult }) {
  const { t } = useI18n();

  if ("error" in result) return <ToolError message={result.error} />;

  return (
    <ToolCard icon={PlayIcon} eyebrow="YouTube" meta={result.channel ?? undefined}>
      {/* Header: thumbnail + title + TL;DR */}
      <div className="flex gap-4 border-b border-rule p-4">
        <a
          href={result.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative h-[76px] w-[135px] shrink-0 overflow-hidden rounded-lg border border-rule"
        >
          {result.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.thumbnailUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="block h-full w-full bg-sunken" />
          )}
          <span className="absolute inset-0 grid place-items-center bg-ink/25 transition-colors group-hover:bg-ink/10">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-paper/90 text-ink shadow-card backdrop-blur-sm">
              <PlayIcon size={14} />
            </span>
          </span>
        </a>

        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[18px] leading-[1.24] text-ink">
            {result.title}
          </h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            {result.tldr}
          </p>
        </div>
      </div>

      {/* Key points */}
      <div className="border-b border-rule px-4 py-3.5">
        <p className="eyebrow">{t("card.keyPoints")}</p>
        <ul className="mt-2 space-y-1.5">
          {result.keyPoints.map((point) => (
            <li key={point} className="flex gap-2.5 text-[13px] leading-relaxed text-ink">
              <span className="mt-[9px] h-px w-2.5 shrink-0 bg-accent opacity-70" />
              <span className="min-w-0">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Chapter timeline — a real vertical rail with clickable timestamps. */}
      <div className="px-4 py-3.5">
        <p className="eyebrow">{t("card.timeline")}</p>

        <ol className="relative mt-3 space-y-3.5 pl-4">
          <span className="absolute bottom-1.5 left-[3px] top-1.5 w-px bg-rule" />

          {result.chapters.map((chapter) => {
            const seconds = toSeconds(chapter.timestamp);
            const href = seconds
              ? `${result.videoUrl}&t=${seconds}s`
              : result.videoUrl;

            return (
              <li key={`${chapter.timestamp}-${chapter.title}`} className="relative">
                <span className="absolute -left-4 top-[6px] h-[7px] w-[7px] rounded-full border border-paper bg-accent ring-1 ring-accent-rule" />

                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <span className="flex items-baseline gap-2.5">
                    <span className="font-mono text-[11px] tabular-nums text-accent">
                      {chapter.timestamp}
                    </span>
                    <span className="text-[13px] font-medium text-ink decoration-accent-rule underline-offset-2 group-hover:underline">
                      {chapter.title}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                    {chapter.detail}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      {result.notableQuote && (
        <figure className="border-t border-rule bg-sunken/45 px-4 py-3.5">
          <p className="eyebrow">{t("card.quote")}</p>
          <blockquote className="mt-1.5 border-l-2 border-accent pl-3 font-serif text-[15px] leading-snug text-ink">
            {result.notableQuote}
          </blockquote>
        </figure>
      )}

      <a
        href={result.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-center gap-1.5 border-t border-rule py-2.5 text-[12px] font-medium text-muted transition-colors hover:bg-sunken/60 hover:text-accent"
      >
        {t("card.watchOn")}
        <ArrowUpRightIcon
          size={12}
          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </a>
    </ToolCard>
  );
}
