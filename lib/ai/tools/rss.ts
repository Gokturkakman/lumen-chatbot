import { XMLParser } from "fast-xml-parser";

import { COMMON_FEED_PATHS, KNOWN_FEEDS } from "./feeds";

export type FeedItem = {
  title: string;
  url: string;
  publishedAt: string | null;
  summary: string | null;
  image: string | null;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 8000;
const MAX_SUMMARY_CHARS = 400;

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": UA,
        // Some CDNs (ESPN's among them) answer a narrow Accept with an empty
        // 202, so keep a catch-all in the list.
        accept: "application/rss+xml, application/xml, text/xml, */*;q=0.8",
        "accept-language": "tr,en;q=0.9",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  // Some feeds (Sözcü, among others) escape the timezone sign in pubDate as
  // `&#x2B;`, which makes every date unparseable unless entities are decoded.
  htmlEntities: true,
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** XML nodes come back as either a string or `{ "#text": "..." }`. */
function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (typeof record["#text"] === "string") return record["#text"];
    if (typeof record["@_href"] === "string") return record["@_href"];
  }
  return "";
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Named zones RFC-822 allows but V8's Date.parse rejects. */
const TZ_OFFSETS: Record<string, string> = {
  BST: "+0100",
  IST: "+0100",
  CET: "+0100",
  CEST: "+0200",
  EET: "+0200",
  EEST: "+0300",
  TRT: "+0300",
  MSK: "+0300",
  EST: "-0500",
  EDT: "-0400",
  CST: "-0600",
  CDT: "-0500",
  MST: "-0700",
  MDT: "-0600",
  PST: "-0800",
  PDT: "-0700",
};

function toIso(value: string): string | null {
  if (!value) return null;

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();

  // Retry with a numeric offset, e.g. "… 20:04:00 BST" → "… 20:04:00 +0100".
  const zone = value.trim().match(/\s([A-Z]{2,4})$/)?.[1];
  const offset = zone ? TZ_OFFSETS[zone] : undefined;
  if (offset) {
    const retry = Date.parse(value.trim().replace(/\s[A-Z]{2,4}$/, ` ${offset}`));
    if (!Number.isNaN(retry)) return new Date(retry).toISOString();
  }

  return null;
}

/** Digs an image out of the many places feeds hide one. */
function extractImage(entry: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    entry["media:content"],
    entry["media:thumbnail"],
    entry.enclosure,
    entry["image"],
  ];

  for (const candidate of candidates) {
    for (const node of asArray(candidate)) {
      if (!node) continue;
      if (typeof node === "string" && node.startsWith("http")) return node;
      const record = node as Record<string, unknown>;
      const url = record["@_url"] ?? record["@_href"] ?? record["url"];
      const type = String(record["@_type"] ?? "");
      if (typeof url === "string" && url.startsWith("http")) {
        if (type && !type.startsWith("image")) continue;
        return url;
      }
    }
  }

  // Some feeds only embed the image inside the HTML description.
  const html = [
    textOf(entry.description),
    textOf(entry["content:encoded"]),
    textOf(entry.content),
  ].join(" ");
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function parseFeed(xml: string): FeedItem[] {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  const rss = doc.rss as Record<string, unknown> | undefined;
  const rdf = doc["rdf:RDF"] as Record<string, unknown> | undefined;
  const channel = (rss?.channel ?? doc.channel) as
    | Record<string, unknown>
    | undefined;
  const atomFeed = doc.feed as Record<string, unknown> | undefined;

  const rawEntries = [
    ...asArray(channel?.item as unknown),
    ...asArray(rdf?.item as unknown),
    ...asArray(atomFeed?.entry as unknown),
  ] as Record<string, unknown>[];

  const items: FeedItem[] = [];

  for (const entry of rawEntries) {
    if (!entry || typeof entry !== "object") continue;

    const title = stripHtml(textOf(entry.title));
    if (!title) continue;

    // RSS puts the URL in <link>'s text, Atom on <link href>. Some feeds
    // (Milliyet) ship neither and only expose it via <guid> or <atom:link>.
    const linkCandidates = [
      ...asArray(entry.link),
      ...asArray(entry["atom:link"]),
      entry.guid,
      entry.id,
    ];

    let url = "";
    for (const candidate of linkCandidates) {
      const value = textOf(candidate);
      if (value.startsWith("http")) {
        url = value;
        break;
      }
    }
    if (!url) continue;

    const rawSummary =
      textOf(entry.description) ||
      textOf(entry.summary) ||
      textOf(entry["content:encoded"]) ||
      textOf(entry.content);

    items.push({
      title,
      url,
      publishedAt:
        toIso(textOf(entry.pubDate)) ??
        toIso(textOf(entry.published)) ??
        toIso(textOf(entry.updated)) ??
        toIso(textOf(entry["dc:date"])),
      summary: rawSummary
        ? stripHtml(rawSummary).slice(0, MAX_SUMMARY_CHARS) || null
        : null,
      image: extractImage(entry),
    });
  }

  return items;
}

/** Reads `<link rel="alternate" type="application/rss+xml" href="...">`. */
function discoverFeedUrls(html: string, origin: string): string[] {
  const found: string[] = [];
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    if (!/rel=["']?alternate/i.test(tag)) continue;
    if (!/type=["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      found.push(new URL(href, origin).toString());
    } catch {
      // ignore malformed hrefs
    }
  }

  return found.slice(0, 3);
}

function looksLikeFeed(text: string): boolean {
  const head = text.slice(0, 1500).toLowerCase();
  return (
    head.includes("<rss") ||
    head.includes("<feed") ||
    head.includes("<rdf:rdf") ||
    head.includes("<channel")
  );
}

/**
 * Resolves a domain to a working feed and returns its items.
 * Order: curated map → homepage autodiscovery → common paths.
 */
export async function fetchFeedForDomain(
  domain: string
): Promise<{ items: FeedItem[]; feedUrl: string } | null> {
  const candidates: string[] = [];

  const known = KNOWN_FEEDS[domain];
  if (known) candidates.push(known);

  const origin = `https://${domain}`;
  const homepage = await fetchText(origin);
  if (homepage) {
    if (looksLikeFeed(homepage)) {
      const items = parseFeed(homepage);
      if (items.length > 0) return { items, feedUrl: origin };
    }
    candidates.push(...discoverFeedUrls(homepage, origin));
  }

  candidates.push(...COMMON_FEED_PATHS.map((path) => `${origin}${path}`));

  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);

    const xml = await fetchText(candidate);
    if (!xml || !looksLikeFeed(xml)) continue;

    const items = parseFeed(xml);
    if (items.length > 0) return { items, feedUrl: candidate };
  }

  return null;
}

export async function fetchFeedByUrl(
  feedUrl: string
): Promise<{ items: FeedItem[]; feedUrl: string } | null> {
  const xml = await fetchText(feedUrl);
  if (!xml || !looksLikeFeed(xml)) return null;
  const items = parseFeed(xml);
  return items.length > 0 ? { items, feedUrl } : null;
}
