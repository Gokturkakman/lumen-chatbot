"use client";

import {
  GlobeIcon,
  LinkIcon,
  NewspaperIcon,
  PlayIcon,
  UserIcon,
} from "@/components/icons";
import { LinkedInCard } from "@/components/tools/linkedin-card";
import { NewsCard } from "@/components/tools/news-card";
import { ReadUrlCard, SearchCard } from "@/components/tools/search-card";
import { ToolError, ToolRunning } from "@/components/tools/tool-shell";
import { YouTubeCard } from "@/components/tools/youtube-card";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import type { LumenMessage } from "@/lib/types";

export type ToolPartType = Extract<
  LumenMessage["parts"][number],
  { type: `tool-${string}` }
>;

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> =
  {
    getNews: NewspaperIcon,
    webSearch: GlobeIcon,
    readUrl: LinkIcon,
    summarizeYouTube: PlayIcon,
    getLinkedInProfile: UserIcon,
  };

export function ToolPart({ part }: { part: ToolPartType }) {
  const { t } = useI18n();

  const name = part.type.slice("tool-".length);
  const Icon = ICONS[name] ?? GlobeIcon;

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <ToolRunning icon={Icon} label={t(`tool.${name}.running` as TranslationKey)} />
    );
  }

  if (part.state === "output-error") {
    return <ToolError message={part.errorText ?? t("tool.failed")} />;
  }

  if (part.state !== "output-available") return null;

  switch (name) {
    case "getNews":
      return <NewsCard result={part.output as never} />;
    case "webSearch":
      return <SearchCard result={part.output as never} />;
    case "readUrl":
      return <ReadUrlCard result={part.output as never} />;
    case "summarizeYouTube":
      return <YouTubeCard result={part.output as never} />;
    case "getLinkedInProfile":
      return <LinkedInCard result={part.output as never} />;
    default:
      return null;
  }
}
