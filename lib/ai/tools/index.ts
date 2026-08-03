import { getLinkedInProfile } from "./get-linkedin-profile";
import { getNews } from "./get-news";
import { readUrl } from "./read-url";
import { summarizeYouTube } from "./summarize-youtube";
import { webSearch } from "./web-search";

export const chatTools = {
  getNews,
  webSearch,
  readUrl,
  summarizeYouTube,
  getLinkedInProfile,
} as const;

export type ChatToolName = keyof typeof chatTools;

export type { NewsResult } from "./get-news";
export type { LinkedInResult } from "./get-linkedin-profile";
export type { YouTubeResult } from "./summarize-youtube";
export type { SearchResult } from "./web-search";
export type { ReadUrlResult } from "./read-url";
export type { FeedItem } from "./rss";
