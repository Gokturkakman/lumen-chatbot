import { tool } from "ai";
import { z } from "zod";

import { getExa, hasExa } from "./exa";

const MAX_CONTENT = 5000;
const MIN_USEFUL = 200;

/** Text LinkedIn serves to logged-out scrapers instead of the real profile. */
const AUTHWALL_MARKERS = [
  "join linkedin",
  "sign in to linkedin",
  "authwall",
  "agree & join",
  "linkedin'e katıl",
  "oturum aç",
];

export type LinkedInResult =
  | {
      name: string | null;
      headline: string | null;
      url: string;
      content: string;
      source: "jina" | "exa";
      alternates: { name: string; url: string }[];
    }
  | { error: string };

function isAuthwall(text: string): boolean {
  const lower = text.toLowerCase();
  return AUTHWALL_MARKERS.some((marker) => lower.includes(marker));
}

/**
 * r.jina.ai renders the page and returns markdown. Free without a key,
 * higher rate limits with one.
 */
async function readWithJina(url: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = { accept: "text/plain" };
    if (process.env.JINA_API_KEY) {
      headers.authorization = `Bearer ${process.env.JINA_API_KEY}`;
    }

    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;

    const text = await res.text();
    if (text.length < MIN_USEFUL || isAuthwall(text)) return null;
    return text.slice(0, MAX_CONTENT);
  } catch {
    return null;
  }
}

function extractHeadline(markdown: string): string | null {
  // Jina's markdown starts with "Title: <Name> - <Headline> | LinkedIn".
  const titleLine = markdown.match(/^Title:\s*(.+)$/m)?.[1];
  if (!titleLine) return null;
  const withoutSuffix = titleLine.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
  const parts = withoutSuffix.split(/\s+-\s+/);
  return parts.length > 1 ? parts.slice(1).join(" - ") : null;
}

function extractName(markdown: string): string | null {
  const titleLine = markdown.match(/^Title:\s*(.+)$/m)?.[1];
  if (!titleLine) return null;
  return titleLine.replace(/\s*\|\s*LinkedIn\s*$/i, "").split(/\s+-\s+/)[0].trim();
}

export const getLinkedInProfile = tool({
  description:
    "Look up a person's public LinkedIn profile — their headline, current " +
    "role, experience and background — by full name or by a " +
    "linkedin.com/in/... URL. Use when the user asks who someone is or what " +
    "they do professionally.",
  inputSchema: z.object({
    nameOrUrl: z
      .string()
      .describe("A person's full name, or a linkedin.com/in/... profile URL"),
    context: z
      .string()
      .optional()
      .describe(
        "Disambiguating context when searching by name, e.g. company or city."
      ),
  }),
  execute: async ({ nameOrUrl, context }): Promise<LinkedInResult> => {
    const input = nameOrUrl.trim();
    const isUrl = /linkedin\.com\/in\//i.test(input);

    /* ── Direct profile URL ────────────────────────────────────────── */
    if (isUrl) {
      const url = input.startsWith("http") ? input : `https://${input}`;

      const markdown = await readWithJina(url);
      if (markdown) {
        return {
          name: extractName(markdown),
          headline: extractHeadline(markdown),
          url,
          content: markdown,
          source: "jina",
          alternates: [],
        };
      }

      if (hasExa()) {
        try {
          const { results } = await getExa().getContents([url], {
            summary: true,
            text: { maxCharacters: MAX_CONTENT },
          });
          const [top] = results;
          if (top && (top.summary || top.text)) {
            return {
              name: top.title ?? null,
              headline: null,
              url,
              content: top.summary || top.text || "",
              source: "exa",
              alternates: [],
            };
          }
        } catch {
          // fall through
        }
      }

      return {
        error:
          `Couldn't read ${url}. LinkedIn blocks logged-out access to some ` +
          `profiles${hasExa() ? "" : ", and no EXA_API_KEY is configured as a fallback"}.`,
      };
    }

    /* ── Search by name ────────────────────────────────────────────── */
    if (!hasExa()) {
      return {
        error:
          "Searching LinkedIn by name needs an EXA_API_KEY. Paste the " +
          "person's linkedin.com/in/... URL instead and I can read it directly.",
      };
    }

    const query = context ? `${input} ${context}` : input;

    try {
      const { results } = await getExa().search(`${query} LinkedIn profile`, {
        category: "people",
        contents: { summary: true, text: { maxCharacters: MAX_CONTENT } },
        includeDomains: ["linkedin.com"],
        numResults: 4,
        type: "auto",
      });

      const profiles = results.filter((r) => /linkedin\.com\/in\//i.test(r.url));
      const [top] = profiles.length > 0 ? profiles : results;

      if (!top) {
        return { error: `No LinkedIn profile found for "${input}".` };
      }

      // Exa's snippet is often thin; Jina usually gets the full profile.
      const markdown = await readWithJina(top.url);

      return {
        name: extractName(markdown ?? "") ?? top.title ?? input,
        headline: extractHeadline(markdown ?? ""),
        url: top.url,
        content: markdown ?? top.summary ?? top.text ?? "",
        source: markdown ? "jina" : "exa",
        alternates: (profiles.length > 1 ? profiles.slice(1, 4) : []).map(
          (r) => ({ name: r.title ?? r.url, url: r.url })
        ),
      };
    } catch {
      return { error: `Failed to search LinkedIn for "${input}".` };
    }
  },
});
