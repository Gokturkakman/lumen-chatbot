/**
 * Feed health check — publishers move their RSS endpoints without warning.
 *
 *   npx tsx scripts/check-feeds.mts
 *
 * Verifies every curated feed in lib/ai/tools/feeds.ts still returns dated
 * items, then exercises the full resolution chain (curated → autodiscovery →
 * common paths → Google News) against a sample of outlets, including ones
 * that are deliberately not curated.
 */
import { KNOWN_FEEDS, googleNewsFeed } from "../lib/ai/tools/feeds";
import { fetchFeedByUrl, fetchFeedForDomain } from "../lib/ai/tools/rss";

const SAMPLE_DOMAINS = [
  "bbc.com",
  "hurriyet.com.tr",
  "sozcu.com.tr",
  "theguardian.com",
  "nytimes.com",
  "aa.com.tr",
  "techcrunch.com",
  "ntv.com.tr",
  "espn.com",
  // Not in KNOWN_FEEDS — exercises autodiscovery and the Google News fallback.
  "diken.com.tr",
  "eksisozluk.com",
];

let failures = 0;

console.log(`\nCurated feeds (${Object.keys(KNOWN_FEEDS).length})\n`);

for (const [domain, url] of Object.entries(KNOWN_FEEDS)) {
  const feed = await fetchFeedByUrl(url);

  if (!feed) {
    failures++;
    console.log(`  FAIL  ${domain.padEnd(22)} unreachable or not a feed`);
    continue;
  }

  const dated = feed.items.filter((item) => item.publishedAt).length;
  if (dated === 0) {
    failures++;
    console.log(`  FAIL  ${domain.padEnd(22)} ${feed.items.length} items, no dates`);
    continue;
  }

  console.log(`  ok    ${domain.padEnd(22)} ${String(feed.items.length).padStart(3)} items`);
}

console.log(`\nResolution chain (${SAMPLE_DOMAINS.length} outlets)\n`);

for (const domain of SAMPLE_DOMAINS) {
  let via = "rss";
  let feed = await fetchFeedForDomain(domain);

  if (!feed) {
    via = "google-news";
    feed = await fetchFeedByUrl(googleNewsFeed(domain, "en"));
  }

  if (!feed) {
    failures++;
    console.log(`  FAIL  ${domain.padEnd(22)} no feed found by any route`);
    continue;
  }

  const newest = feed.items
    .filter((item) => item.publishedAt)
    .sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!))[0];

  console.log(`  ok    ${domain.padEnd(22)} ${String(feed.items.length).padStart(3)} items via ${via}`);
  if (newest) {
    console.log(`        ${newest.publishedAt}  ${newest.title.slice(0, 68)}`);
  }
}

console.log(failures === 0 ? "\nAll feeds healthy.\n" : `\n${failures} problem(s).\n`);
process.exit(failures === 0 ? 0 : 1);
