// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { assetDatabase } from "../src/lib/stockDatabase/index";

const BASE_URL = "https://portai-invest.com";

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/dashboard", changefreq: "weekly", priority: "0.7" },
  { path: "/news", changefreq: "daily", priority: "0.7" },
  { path: "/watchlists", changefreq: "weekly", priority: "0.7" },
  { path: "/chat", changefreq: "weekly", priority: "0.6" },
  { path: "/quiz", changefreq: "monthly", priority: "0.5" },
  { path: "/compare/seeking-alpha-vs-motley-fool", changefreq: "monthly", priority: "0.6" },
  { path: "/compare/best-stock-advisor-services", changefreq: "monthly", priority: "0.6" },
  { path: "/blog/how-to-detect-pump-and-dump-schemes", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
  { path: "/data-compliance", changefreq: "yearly", priority: "0.3" },
  { path: "/ip-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/accessibility", changefreq: "yearly", priority: "0.3" },
];

const stockEntries: Entry[] = assetDatabase.map((a) => ({
  path: `/stock/${encodeURIComponent(a.ticker)}`,
  changefreq: "weekly",
  priority: "0.5",
}));

// No <lastmod>: the project has no authoritative per-page change timestamp,
// and a build-time date is not a real signal.
const entries: Entry[] = [...staticEntries, ...stockEntries];


function generate(entries: Entry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generate(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
