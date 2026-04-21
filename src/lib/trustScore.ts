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
