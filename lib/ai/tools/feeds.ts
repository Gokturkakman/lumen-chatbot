/**
 * Known RSS endpoints for outlets whose feed URL is not discoverable from the
 * homepage (or where the discoverable one is a low-quality partial feed).
 * Everything else falls back to autodiscovery, then to common feed paths.
 */
export const KNOWN_FEEDS: Record<string, string> = {
  // ── Türkiye ─────────────────────────────────────────────────────────
  "hurriyet.com.tr": "https://www.hurriyet.com.tr/rss/anasayfa",
  "milliyet.com.tr": "https://www.milliyet.com.tr/rss/rssnew/gundemrss.xml",
  "sozcu.com.tr": "https://www.sozcu.com.tr/rss.xml",
  "haberturk.com": "https://www.haberturk.com/rss",
  "ntv.com.tr": "https://www.ntv.com.tr/gundem.rss",
  "cnnturk.com": "https://www.cnnturk.com/feed/rss/all/news",
  "aa.com.tr": "https://www.aa.com.tr/tr/rss/default?cat=guncel",
  "trthaber.com": "https://www.trthaber.com/sondakika.rss",
  "bbc.com/turkce": "https://feeds.bbci.co.uk/turkce/rss.xml",
  "cumhuriyet.com.tr": "https://www.cumhuriyet.com.tr/rss/son_dakika.xml",
  "birgun.net": "https://www.birgun.net/xml/rss.xml",
  "dunya.com": "https://www.dunya.com/rss?dunya",
  "webtekno.com": "https://www.webtekno.com/rss.xml",
  "donanimhaber.com": "https://www.donanimhaber.com/rss/tum/",
  "anadoluajansi.com.tr": "https://www.aa.com.tr/tr/rss/default?cat=guncel",

  // ── International ───────────────────────────────────────────────────
  "bbc.com": "https://feeds.bbci.co.uk/news/rss.xml",
  "bbc.co.uk": "https://feeds.bbci.co.uk/news/rss.xml",
  "nytimes.com": "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
  "theguardian.com": "https://www.theguardian.com/international/rss",
  "cnn.com": "http://rss.cnn.com/rss/edition.rss",
  "reuters.com": "https://news.google.com/rss/search?q=site:reuters.com&hl=en-US&gl=US&ceid=US:en",
  "apnews.com": "https://news.google.com/rss/search?q=site:apnews.com&hl=en-US&gl=US&ceid=US:en",
  "aljazeera.com": "https://www.aljazeera.com/xml/rss/all.xml",
  "npr.org": "https://feeds.npr.org/1001/rss.xml",
  "washingtonpost.com": "https://feeds.washingtonpost.com/rss/world",
  "wsj.com": "https://feeds.content.dowjones.io/public/rss/RSSWorldNews",
  "ft.com": "https://www.ft.com/rss/home",
  "economist.com": "https://www.economist.com/latest/rss.xml",
  "bloomberg.com": "https://news.google.com/rss/search?q=site:bloomberg.com&hl=en-US&gl=US&ceid=US:en",
  "dw.com": "https://rss.dw.com/rdf/rss-en-all",
  "france24.com": "https://www.france24.com/en/rss",
  "euronews.com": "https://www.euronews.com/rss",
  "theverge.com": "https://www.theverge.com/rss/index.xml",
  "techcrunch.com": "https://techcrunch.com/feed/",
  "arstechnica.com": "https://feeds.arstechnica.com/arstechnica/index",
  "wired.com": "https://www.wired.com/feed/rss",
  "engadget.com": "https://www.engadget.com/rss.xml",
  "hackernews.com": "https://news.ycombinator.com/rss",
  "news.ycombinator.com": "https://news.ycombinator.com/rss",
  // ESPN's own feed answers bots with an empty 202.
  "espn.com": "https://news.google.com/rss/search?q=site:espn.com&hl=en-US&gl=US&ceid=US:en",
  "skysports.com": "https://www.skysports.com/rss/12040",
  "nature.com": "https://www.nature.com/nature.rss",
  "sciencedaily.com": "https://www.sciencedaily.com/rss/all.xml",
};

/** Tried in order when a domain has no known feed and autodiscovery fails. */
export const COMMON_FEED_PATHS = [
  "/rss.xml",
  "/feed",
  "/feed/",
  "/rss",
  "/rss/",
  "/index.xml",
  "/atom.xml",
  "/feeds/all.rss.xml",
  "/en/rss",
];

/**
 * Last-resort feed: Google News scoped to the outlet's domain. Works for
 * effectively any publisher, at the cost of Google's redirect URLs.
 */
export function googleNewsFeed(domain: string, locale: "tr" | "en"): string {
  const params =
    locale === "tr" ? "hl=tr&gl=TR&ceid=TR:tr" : "hl=en-US&gl=US&ceid=US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(
    `site:${domain}`
  )}&${params}`;
}
