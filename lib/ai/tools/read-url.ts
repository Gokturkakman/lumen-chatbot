import { tool } from "ai";
import { z } from "zod";

const MAX_CHARS = 8000;

export type ReadUrlResult =
  | { url: string; title: string | null; content: string }
  | { error: string };

export const readUrl = tool({
  description:
    "Fetch and read the full text of a web page, given its URL. Use after a " +
    "web search when a result looks worth reading in full, or when the user " +
    "pastes a link and asks about its contents.",
  inputSchema: z.object({
    url: z.string().describe("The full URL of the page to read."),
  }),
  execute: async ({ url }): Promise<ReadUrlResult> => {
    const target = url.startsWith("http") ? url : `https://${url}`;

    try {
      new URL(target);
    } catch {
      return { error: `"${url}" is not a valid URL.` };
    }

    try {
      // r.jina.ai renders the page and returns clean markdown, which handles
      // JavaScript-only sites that a plain fetch would return empty.
      const headers: Record<string, string> = { accept: "text/plain" };
      if (process.env.JINA_API_KEY) {
        headers.authorization = `Bearer ${process.env.JINA_API_KEY}`;
      }

      const res = await fetch(`https://r.jina.ai/${target}`, {
        headers,
        signal: AbortSignal.timeout(20_000),
      });

      if (!res.ok) {
        return { error: `Couldn't read ${target} (HTTP ${res.status}).` };
      }

      const text = await res.text();
      const title = text.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? null;

      return { url: target, title, content: text.slice(0, MAX_CHARS) };
    } catch {
      return { error: `Couldn't read ${target}. The site may be blocking us.` };
    }
  },
});
