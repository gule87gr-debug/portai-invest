/**
 * Publisher opt-out checks for article analysis:
 *  - robots.txt (RFC 9309) for our agent token and "*"
 *  - TDM Reservation Protocol: /.well-known/tdmrep.json, "tdm-reservation"
 *    HTTP header and <meta name="tdm-reservation">
 * Plus a paywall/truncation heuristic. We never try to work around any of them.
 */
export const ANALYZER_AGENT_TOKEN = "PortAI";
export const ANALYZER_USER_AGENT = "PortAI-ArticleAnalyzer/1.0 (+https://portai-invest.com)";

type Rule = { allow: boolean; path: string };

/** Parses robots.txt and returns the rules that apply to our agent (or "*"). */
export function robotsRules(robots: string, agentToken = ANALYZER_AGENT_TOKEN): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((field === "allow" || field === "disallow") && current) {
      lastWasAgent = false;
      if (field === "disallow" && value === "") continue; // empty Disallow = allow all
      current.rules.push({ allow: field === "allow", path: value });
    } else {
      lastWasAgent = false;
    }
  }
  const token = agentToken.toLowerCase();
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && token.includes(a.replace(/\/.*$/, ""))));
  const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes("*"));
  return chosen.flatMap((g) => g.rules);
}

function ruleMatches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`).test(path);
}

/** Longest matching rule wins; Allow wins ties. No matching rule → allowed. */
export function isPathAllowed(rules: Rule[], path: string): boolean {
  let best: Rule | null = null;
  for (const r of rules) {
    if (!ruleMatches(r.path, path)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
  }
  return best ? best.allow : true;
}

/** tdmrep.json: array of { location, "tdm-reservation": 0|1 } entries. */
export function tdmReservedByPolicy(policy: unknown, path: string): boolean {
  if (!Array.isArray(policy)) return false;
  for (const entry of policy) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const loc = typeof e.location === "string" ? e.location : "";
    if (!loc) continue;
    if (ruleMatches(loc.startsWith("/") ? loc : `/${loc}`, path)) return Number(e["tdm-reservation"]) === 1;
  }
  return false;
}

async function timedFetch(url: string, ms: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { headers: { "User-Agent": ANALYZER_USER_AGENT }, redirect: "follow", signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type PermissionResult = { allowed: true } | { allowed: false; reason: "robots" | "tdm" };

/** Checks robots.txt and tdmrep.json for the page's origin BEFORE fetching it. */
export async function checkPublisherPermissions(pageUrl: URL): Promise<PermissionResult> {
  const path = pageUrl.pathname + pageUrl.search;
  const [robotsRes, tdmRes] = await Promise.all([
    timedFetch(`${pageUrl.origin}/robots.txt`, 4000),
    timedFetch(`${pageUrl.origin}/.well-known/tdmrep.json`, 4000),
  ]);

  // RFC 9309: unreachable robots.txt (network error / 5xx) → assume full disallow; 4xx → no restrictions.
  if (!robotsRes || robotsRes.status >= 500) return { allowed: false, reason: "robots" };
  if (robotsRes.ok) {
    const text = (await robotsRes.text()).slice(0, 500_000);
    if (!isPathAllowed(robotsRules(text), path)) return { allowed: false, reason: "robots" };
  } else {
    await robotsRes.body?.cancel();
  }

  if (tdmRes?.ok) {
    try {
      if (tdmReservedByPolicy(JSON.parse((await tdmRes.text()).slice(0, 200_000)), path)) return { allowed: false, reason: "tdm" };
    } catch { /* not valid JSON → no policy */ }
  } else {
    await tdmRes?.body?.cancel();
  }
  return { allowed: true };
}

/** Reservation signals carried on the article response itself. */
export function tdmReservedByResponse(headers: Headers, headHtml: string): boolean {
  if ((headers.get("tdm-reservation") ?? "").trim() === "1") return true;
  if (/\bnoai\b/i.test(headers.get("x-robots-tag") ?? "")) return true;
  if (/<meta[^>]+name=["']tdm-reservation["'][^>]+content=["']\s*1\s*["']/i.test(headHtml)) return true;
  if (/<meta[^>]+content=["']\s*1\s*["'][^>]+name=["']tdm-reservation["']/i.test(headHtml)) return true;
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*\bnoai\b/i.test(headHtml)) return true;
  return false;
}

/** True when the page declares itself paywalled or the readable text is clearly truncated. */
export function looksPaywalled(html: string, bodyText: string): boolean {
  if (/"isAccessibleForFree"\s*:\s*(false|"false"|"False")/i.test(html)) return true;
  if (/<meta[^>]+(name|property)=["'](article:content_tier|content_tier)["'][^>]+content=["'](locked|metered|premium)["']/i.test(html)) return true;
  if (/class=["'][^"']*\b(paywall|piano-paywall|subscriber-only|regwall|tp-modal)\b/i.test(html) && bodyText.length < 1500) return true;
  return bodyText.length < 400;
}

const MESSAGES: Record<"blocked" | "paywall" | "unreachable", Record<string, string>> = {
  blocked: {
    en: "This publisher doesn't allow automated analysis of its articles. Try the same story from another outlet.",
    es: "Este medio no permite el análisis automatizado de sus artículos. Prueba con la misma noticia de otro medio.",
    fr: "Cet éditeur n'autorise pas l'analyse automatisée de ses articles. Essayez la même information chez un autre média.",
    pt: "Este editor não permite a análise automatizada dos seus artigos. Experimente a mesma notícia noutro meio.",
    de: "Dieser Verlag erlaubt keine automatisierte Analyse seiner Artikel. Versuche dieselbe Meldung von einem anderen Medium.",
    it: "Questo editore non consente l'analisi automatizzata dei suoi articoli. Prova la stessa notizia da un'altra testata.",
  },
  paywall: {
    en: "This article is behind a paywall or only partly available, so we can't analyse it. Try the same story from another outlet.",
    es: "Este artículo está tras un muro de pago o solo está disponible en parte, así que no podemos analizarlo. Prueba con la misma noticia de otro medio.",
    fr: "Cet article est derrière un paywall ou n'est que partiellement accessible, nous ne pouvons donc pas l'analyser. Essayez la même information chez un autre média.",
    pt: "Este artigo está atrás de um paywall ou só está parcialmente disponível, por isso não o podemos analisar. Experimente a mesma notícia noutro meio.",
    de: "Dieser Artikel liegt hinter einer Paywall oder ist nur teilweise verfügbar, daher können wir ihn nicht analysieren. Versuche dieselbe Meldung von einem anderen Medium.",
    it: "Questo articolo è dietro un paywall o è disponibile solo in parte, quindi non possiamo analizzarlo. Prova la stessa notizia da un'altra testata.",
  },
  unreachable: {
    en: "We couldn't reach this page right now. Please try again later or try the same story from another outlet.",
    es: "No hemos podido acceder a esta página ahora mismo. Inténtalo más tarde o prueba con la misma noticia de otro medio.",
    fr: "Nous n'avons pas pu accéder à cette page pour le moment. Réessayez plus tard ou essayez la même information chez un autre média.",
    pt: "Não conseguimos aceder a esta página agora. Tente mais tarde ou experimente a mesma notícia noutro meio.",
    de: "Wir konnten diese Seite gerade nicht erreichen. Bitte versuche es später erneut oder nimm dieselbe Meldung von einem anderen Medium.",
    it: "Non siamo riusciti a raggiungere questa pagina. Riprova più tardi o prova la stessa notizia da un'altra testata.",
  },
};

export function permissionMessage(kind: keyof typeof MESSAGES, lang: string): string {
  const l = (lang || "en").slice(0, 2).toLowerCase();
  return MESSAGES[kind][l] ?? MESSAGES[kind].en;
}
