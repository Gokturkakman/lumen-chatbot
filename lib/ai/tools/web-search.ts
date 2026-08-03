import { tool } from "ai";
import { z } from "zod";

import { getExa, hasExa } from "./exa";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export type SearchHit = {
  title: string;
  url: string;
  snippet: string | null;
  publishedAt: string | null;
};

export type SearchResult =
  | { query: string; source: "exa" | "duckduckgo"; hits: SearchHit[] }
  | { error: string };

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/**
 * Keyless fallback. DuckDuckGo's HTML endpoint has no API key and no quota,
 * which keeps web search working on a bare .env.local.
 */
async function searchDuckDuckGo(
  query: string,
  count: number
): Promise<SearchHit[]> {
  try {
    const res = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: {
        "user-agent": UA,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ q: query }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    const hits: SearchHit[] = [];
    const seen = new Set<string>();

    // Each result is an <a class="result__a" href="…">Title</a>, with the
    // snippet in the next .result__snippet node. Attribute order varies, so
    // match the anchor rather than a fixed container class.
    const anchor = /<a\b[^>]*class="[^"]*\bresult__a\b[^"]*"[^>]*>([\s\S]*?)<\/a>/g;

    for (const match of html.matchAll(anchor)) {
      const tag = match[0];
      const href = tag.match(/\bhref="([^"]+)"/)?.[1];
      if (!href) continue;

      // Outbound links are sometimes wrapped as /l/?uddg=<encoded>.
      let url = href;
      const wrapped = href.match(/[?&]uddg=([^&]+)/);
      if (wrapped) url = decodeURIComponent(wrapped[1]);
      if (url.startsWith("//")) url = `https:${url}`;
      if (!url.startsWith("http") || seen.has(url)) continue;
      seen.add(url);

      const title = stripTags(match[1]);
      if (!title) continue;

      const rest = html.slice(match.index + tag.length, match.index + tag.length + 3000);
      const snippetHtml = rest.match(
        /class="[^"]*\bresult__snippet\b[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div|span)>/
      )?.[1];

      hits.push({
        title,
        url,
        snippet: snippetHtml ? stripTags(snippetHtml).slice(0, 400) || null : null,
        publishedAt: null,
      });

      if (hits.length >= count) break;
    }

    return hits;
  } catch {
    return [];
  }
}

async function searchExa(query: string, count: number): Promise<SearchHit[]> {
  try {
    const { results } = await getExa().search(query, {
      numResults: count,
      type: "auto",
      contents: { text: { maxCharacters: 500 } },
    });

    return results.map((result) => ({
      title: result.title ?? result.url,
      url: result.url,
      snippet: result.text ? result.text.slice(0, 400) : null,
      publishedAt: result.publishedDate ?? null,
    }));
  } catch {
    return [];
  }
}

export const webSearch = tool({
  description:
    "Search the live web for current information. Use for anything you might " +
    "not know, anything after your training cutoff, or when the user asks " +
    "about current events, prices, releases or people. Always cite the URLs " +
    "you use in your answer.",
  inputSchema: z.object({
    query: z.string().describe("The search query."),
    count: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("How many results to return. Defaults to 6."),
  }),
  execute: async ({ query, count }): Promise<SearchResult> => {
    const limit = count ?? 6;

    if (hasExa()) {
      const hits = await searchExa(query, limit);
      if (hits.length > 0) {
        return { query, source: "exa", hits };
      }
    }

    const hits = await searchDuckDuckGo(query, limit);
    if (hits.length > 0) {
      return { query, source: "duckduckgo", hits };
    }

    return { error: `No web results found for "${query}".` };
  },
});
