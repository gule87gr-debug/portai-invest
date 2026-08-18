// Shared trust-score logic — must stay aligned with the
// article-analysis edge function (supabase/functions/analyze-link)
// scoring guide so the news feed badge matches what the
// "Analyze Article" tool would return for the same source.
//
// Scoring guide (1-10):
//   9-10: Major wire services (Reuters, AP), SEC filings, Fed publications
//   7-8:  Established financial media (Bloomberg, CNBC, FT, WSJ)
//   5-6:  Contributor platforms (Seeking Alpha, Motley Fool), established blogs
//   3-4:  Social media, anonymous forums, unverified sources
//   1-2:  Known misinformation sources

export const TRUST_SCORES: Record<string, number> = {
  // 9-10: wires / regulators
  reuters: 10,
  "associated press": 10,
  ap: 10,
  "ap news": 10,
  "sec.gov": 10,
  sec: 10,
  "federal reserve": 10,
  "u.s. securities and exchange commission": 10,

  // 7-8: established financial / general media
  bloomberg: 8,
  "financial times": 8,
  ft: 8,
  "the wall street journal": 8,
  "wall street journal": 8,
  wsj: 8,
  "the economist": 8,
  bbc: 8,
  "bbc news": 8,
  "the new york times": 7,
  "new york times": 7,
  nyt: 7,
  "the washington post": 7,
  "washington post": 7,
  cnbc: 7,
  "barron's": 7,
  barrons: 7,
  marketwatch: 7,
  "the guardian": 7,
  guardian: 7,
  axios: 7,
  morningstar: 7,
  reutersagency: 10,

  // 5-6: contributor platforms / mainstream business blogs
  forbes: 6,
  fortune: 6,
  "business insider": 6,
  "yahoo finance": 6,
  yahoo: 6,
  investopedia: 6,
  cnn: 6,
  "cnn business": 6,
  zacks: 6,
  "seeking alpha": 5,
  "the motley fool": 5,
  "motley fool": 5,
  benzinga: 5,
  investorplace: 5,
  "fox business": 5,
  thestreet: 5,
  "the street": 5,
  kiplinger: 6,

  // 3-4: lower-trust / social
  reddit: 3,
  twitter: 3,
  x: 3,
  "stocktwits": 3,
};

/** Returns 1-10 trust score for a source name (case-insensitive, partial match). */
export function getTrustScore(source: string): number {
  if (!source) return 4;
  const key = source.toLowerCase().trim();
  if (TRUST_SCORES[key] !== undefined) return TRUST_SCORES[key];
  for (const [name, score] of Object.entries(TRUST_SCORES)) {
    if (key.includes(name)) return score;
  }
  return 4;
}

// Maps URL hostnames to the canonical source name used in TRUST_SCORES.
// Mirrors DOMAIN_TO_SOURCE in supabase/functions/analyze-link/index.ts so the
// news-feed badge and the article analyzer can never disagree for a link.
export const DOMAIN_TO_SOURCE: Record<string, string> = {
  "reuters.com": "reuters",
  "apnews.com": "associated press",
  "ap.org": "associated press",
  "sec.gov": "sec.gov",
  "federalreserve.gov": "federal reserve",
  "bloomberg.com": "bloomberg",
  "ft.com": "financial times",
  "wsj.com": "the wall street journal",
  "economist.com": "the economist",
  "nytimes.com": "the new york times",
  "washingtonpost.com": "the washington post",
  "cnbc.com": "cnbc",
  "barrons.com": "barron's",
  "marketwatch.com": "marketwatch",
  "bbc.com": "bbc",
  "bbc.co.uk": "bbc",
  "theguardian.com": "the guardian",
  "axios.com": "axios",
  "morningstar.com": "morningstar",
  "forbes.com": "forbes",
  "fortune.com": "fortune",
  "businessinsider.com": "business insider",
  "finance.yahoo.com": "yahoo finance",
  "yahoo.com": "yahoo finance",
  "investopedia.com": "investopedia",
  "cnn.com": "cnn",
  "edition.cnn.com": "cnn",
  "zacks.com": "zacks",
  "kiplinger.com": "kiplinger",
  "seekingalpha.com": "seeking alpha",
  "fool.com": "the motley fool",
  "benzinga.com": "benzinga",
  "investorplace.com": "investorplace",
  "foxbusiness.com": "fox business",
  "thestreet.com": "thestreet",
  "reddit.com": "reddit",
  "twitter.com": "twitter",
  "x.com": "x",
  "stocktwits.com": "stocktwits",
};

/** Resolves a known publisher (and its score) from an article URL. */
export function lookupKnownSource(urlStr: string): { source: string; score: number } | null {
  try {
    const host = new URL(urlStr).hostname.toLowerCase().replace(/^www\./, "");
    if (DOMAIN_TO_SOURCE[host]) {
      const src = DOMAIN_TO_SOURCE[host];
      return { source: src, score: TRUST_SCORES[src] };
    }
    for (const [domain, src] of Object.entries(DOMAIN_TO_SOURCE)) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        return { source: src, score: TRUST_SCORES[src] };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Score for a news item. Prefers the article URL's publisher domain (exactly
 * what the analyzer keys off) and falls back to the RSS source label, so the
 * badge shown in the feed matches the score returned when the same link is
 * re-analyzed.
 */
export function getArticleTrustScore(link: string, source: string): number {
  const known = link ? lookupKnownSource(link) : null;
  if (known) return known.score;
  return getTrustScore(source);
}
