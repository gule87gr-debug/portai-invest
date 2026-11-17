/**
 * The ONLY news sources PortAI reads: publishers' own official public RSS
 * feeds (business / markets sections). No aggregators (no Google News,
 * Yahoo, etc.). We keep headline, source, date, link and a ≤150-char
 * snippet from the feed's own description — never article bodies or images.
 */
export type NewsCategory = "technology" | "finance" | "healthcare" | "energy" | "consumer" | "crypto" | "etfs";
export type NewsRegion = "us" | "europe" | "asia" | "americas" | "africa" | "middle_east" | "oceania";

export interface NewsFeed {
  key: string;
  publisher: string;
  /** Publisher's own website domain (used to skip self-corroboration). */
  site: string;
  url: string;
  regions: NewsRegion[];
  categories: NewsCategory[];
}

export const NEWS_FEEDS: NewsFeed[] = [
  { key: "cnbc-top", publisher: "CNBC", site: "cnbc.com", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", regions: ["us"], categories: [] },
  { key: "cnbc-finance", publisher: "CNBC", site: "cnbc.com", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html", regions: ["us"], categories: ["finance"] },
  { key: "cnbc-tech", publisher: "CNBC", site: "cnbc.com", url: "https://www.cnbc.com/id/19854910/device/rss/rss.html", regions: ["us"], categories: ["technology"] },
  { key: "marketwatch-top", publisher: "MarketWatch", site: "marketwatch.com", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", regions: ["us"], categories: [] },
  { key: "marketwatch-pulse", publisher: "MarketWatch", site: "marketwatch.com", url: "https://feeds.content.dowjones.io/public/rss/mw_marketpulse", regions: ["us"], categories: [] },
  { key: "wsj-markets", publisher: "The Wall Street Journal", site: "wsj.com", url: "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain", regions: ["us"], categories: ["finance"] },
  { key: "nyt-business", publisher: "The New York Times", site: "nytimes.com", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", regions: ["us"], categories: [] },
  { key: "bloomberg-markets", publisher: "Bloomberg", site: "bloomberg.com", url: "https://feeds.bloomberg.com/markets/news.rss", regions: [], categories: ["finance"] },
  { key: "fortune", publisher: "Fortune", site: "fortune.com", url: "https://fortune.com/feed/", regions: ["us"], categories: [] },
  { key: "ft-markets", publisher: "Financial Times", site: "ft.com", url: "https://www.ft.com/markets?format=rss", regions: ["europe"], categories: ["finance"] },
  { key: "economist-finance", publisher: "The Economist", site: "economist.com", url: "https://www.economist.com/finance-and-economics/rss.xml", regions: [], categories: ["finance"] },
  { key: "bbc-business", publisher: "BBC News", site: "bbc.co.uk", url: "https://feeds.bbci.co.uk/news/business/rss.xml", regions: ["europe"], categories: [] },
  { key: "guardian-business", publisher: "The Guardian", site: "theguardian.com", url: "https://www.theguardian.com/uk/business/rss", regions: ["europe"], categories: [] },
  { key: "guardian-markets", publisher: "The Guardian", site: "theguardian.com", url: "https://www.theguardian.com/business/stock-markets/rss", regions: ["europe"], categories: ["finance"] },
  { key: "euronews-business", publisher: "Euronews", site: "euronews.com", url: "https://www.euronews.com/rss?level=vertical&name=business", regions: ["europe"], categories: [] },
  { key: "expansion-mercados", publisher: "Expansión", site: "expansion.com", url: "https://e00-expansion.uecdn.es/rss/mercados.xml", regions: ["europe"], categories: ["finance"] },
  { key: "elpais-economia", publisher: "El País", site: "elpais.com", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada", regions: ["europe"], categories: [] },
  { key: "scmp-business", publisher: "South China Morning Post", site: "scmp.com", url: "https://www.scmp.com/rss/92/feed", regions: ["asia"], categories: [] },
  { key: "abc-au-business", publisher: "ABC News (Australia)", site: "abc.net.au", url: "https://www.abc.net.au/news/feed/51892/rss.xml", regions: ["oceania"], categories: [] },
  { key: "coindesk", publisher: "CoinDesk", site: "coindesk.com", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", regions: [], categories: ["crypto"] },
  { key: "cointelegraph", publisher: "Cointelegraph", site: "cointelegraph.com", url: "https://cointelegraph.com/rss", regions: [], categories: ["crypto"] },
  { key: "federal-reserve", publisher: "Federal Reserve", site: "federalreserve.gov", url: "https://www.federalreserve.gov/feeds/press_all.xml", regions: ["us"], categories: ["finance"] },
  { key: "sec-press", publisher: "U.S. SEC", site: "sec.gov", url: "https://www.sec.gov/news/pressreleases.rss", regions: ["us"], categories: ["finance"] },
  { key: "ecb-press", publisher: "European Central Bank", site: "ecb.europa.eu", url: "https://www.ecb.europa.eu/rss/press.html", regions: ["europe"], categories: ["finance"] },
];

export const NEWS_USER_AGENT = "PortAI-NewsBot/1.0 (+https://portai-invest.com)";
export const SNIPPET_MAX = 150;
