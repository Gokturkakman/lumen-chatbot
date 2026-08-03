import { tool } from "ai";
import { z } from "zod";

import { googleNewsFeed } from "./feeds";
import { getExa, hasExa } from "./exa";
import { fetchFeedByUrl, fetchFeedForDomain, type FeedItem } from "./rss";

const RESULTS = 5;
const EXA_WINDOW_DAYS = 14;

export type NewsResult =
  | {
      publisher: string;
      domain: string;
      source: "rss" | "google-news" | "exa";
      feedUrl: string | null;
      items: FeedItem[];
    }
  | { error: string };

function normalizeDomain(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
  return cleaned.split("/")[0] || cleaned;
}

function sortAndSlice(items: FeedItem[], count: number): FeedItem[] {
  return items
    .slice()
    .sort((a, b) => {
      const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return bTime - aTime;
    })
    .slice(0, count);
}

async function tryExa(domain: string): Promise<FeedItem[]> {
  if (!hasExa()) return [];

  const startPublishedDate = new Date(
    Date.now() - EXA_WINDOW_DAYS * 86_400_000
  ).toISOString();

  try {
    const { results } = await getExa().search(`latest news from ${domain}`, {
      category: "news",
      contents: { text: { maxCharacters: 400 } },
      includeDomains: [domain],
      numResults: 10,
      startPublishedDate,
      type: "auto",
    });

    return results.map((result) => ({
      title: result.title ?? "—",
      url: result.url,
      publishedAt: result.publishedDate ?? null,
      summary: result.text ? result.text.slice(0, 400) : null,
      image: result.image ?? null,
    }));
  } catch {
    return [];
  }
}

export const getNews = tool({
  description:
    "Fetch the latest news headlines published by a specific news outlet. " +
    "Use this whenever the user asks what a publication is reporting, or for " +
    "the newest stories from a named outlet. Resolve the outlet's name to its " +
    "main website domain yourself (e.g. 'BBC' -> 'bbc.com', 'Hürriyet' -> " +
    "'hurriyet.com.tr', 'NYT' -> 'nytimes.com').",
  inputSchema: z.object({
    publisherDomain: z
      .string()
      .describe("The outlet's website domain, e.g. 'bbc.com', 'sozcu.com.tr'"),
    publisherName: z
      .string()
      .optional()
      .describe("Display name of the outlet, e.g. 'BBC News'"),
    count: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("How many stories to return. Defaults to 5."),
    locale: z
      .enum(["tr", "en"])
      .optional()
      .describe("Language of the outlet, used for the fallback search."),
  }),
  execute: async ({
    publisherDomain,
    publisherName,
    count,
    locale,
  }): Promise<NewsResult> => {
    const domain = normalizeDomain(publisherDomain);
    if (!domain || !domain.includes(".")) {
      return { error: `"${publisherDomain}" is not a valid website domain.` };
    }

    const limit = count ?? RESULTS;
    const publisher = publisherName ?? domain;

    // 1. The outlet's own RSS feed — authoritative and free.
    const feed = await fetchFeedForDomain(domain);
    if (feed && feed.items.length > 0) {
      return {
        publisher,
        domain,
        source: "rss",
        feedUrl: feed.feedUrl,
        items: sortAndSlice(feed.items, limit),
      };
    }

    // 2. Google News scoped to the domain — covers outlets without a feed.
    const gnews = await fetchFeedByUrl(googleNewsFeed(domain, locale ?? "en"));
    if (gnews && gnews.items.length > 0) {
      return {
        publisher,
        domain,
        source: "google-news",
        feedUrl: gnews.feedUrl,
        items: sortAndSlice(gnews.items, limit),
      };
    }

    // 3. Exa neural search, when a key is configured.
    const exaItems = await tryExa(domain);
    if (exaItems.length > 0) {
      return {
        publisher,
        domain,
        source: "exa",
        feedUrl: null,
        items: sortAndSlice(exaItems, limit),
      };
    }

    return {
      error: `Couldn't find recent news from ${domain}. Double-check the outlet's domain.`,
    };
  },
});
