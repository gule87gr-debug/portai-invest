import { Building2, Lock, Map, Quote, User, Cpu } from "lucide-react";

const CARDS = [
  {
    icon: User,
    label: "Who built it",
    title: "Founder-led, independent",
    body: "Built and maintained by Guillermo, an independent developer-investor. No sell-side desk, no affiliate stock deals, no sponsored coverage.",
  },
  {
    icon: Building2,
    label: "Company",
    title: "Registered in Spain (EU)",
    body: "Operated as a registered sole trader under Spanish and EU law. VAT-compliant invoicing on every subscription.",
  },
  {
    icon: Map,
    label: "Roadmap",
    title: "What ships next",
    body: "Q3 browser extension beta · Q4 portfolio-wide bias reports · 2027 broker sync and API access.",
  },
  {
    icon: Lock,
    label: "Security",
    title: "Encrypted end to end",
    body: "TLS 1.3 in transit, AES-256 at rest, row-level access control per user, and GDPR-compliant data handling. We never sell your data.",
  },
  {
    icon: Cpu,
    label: "Technology",
    title: "The stack",
    body: "React + TypeScript front end, Postgres with row-level security, edge functions for analysis, and large language models for bias and claim checks.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I stopped acting on hype headlines. The score alone makes me pause before I buy.",
    name: "Early user",
    role: "Retail investor, Madrid",
  },
  {
    quote: "The missing-context list caught an insider sale I would never have looked up.",
    name: "Early user",
    role: "Swing trader, Berlin",
  },
  {
    quote: "It reads like a research desk note, in ten seconds, for the price of a coffee.",
    name: "Early user",
    role: "ETF investor, Dublin",
  },
];

const TransparencyTrust = () => (
  <section
    id="transparency"
    aria-labelledby="transparency-heading"
    className="px-4 sm:px-6 py-16 max-w-5xl mx-auto border-t border-border"
  >
    <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">
      Transparency &amp; trust
    </p>
    <h2
      id="transparency-heading"
      className="text-center editorial-heading text-3xl sm:text-4xl text-foreground mb-10"
    >
      Everything you should know before you pay us
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CARDS.map((c) => (
        <article key={c.title} className="rounded-2xl border border-border bg-card p-5 h-full card-hover">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40">
              <c.icon className="h-4 w-4 text-foreground/80" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {c.label}
            </p>
          </div>
          <h3 className="text-base font-bold text-foreground mb-1.5">{c.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
        </article>
      ))}
    </div>

    <div className="mt-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">
        Early users
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t) => (
          <figure key={t.quote} className="rounded-2xl border border-border bg-card p-5 flex flex-col h-full">
            <Quote className="h-4 w-4 text-muted-foreground mb-3" />
            <blockquote className="text-sm text-foreground/90 leading-relaxed flex-1">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-2.5 border-t border-border pt-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                EU
              </span>
              <span>
                <span className="block text-xs font-semibold text-foreground">{t.name}</span>
                <span className="block text-[11px] text-muted-foreground">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Testimonials shown are illustrative placeholders from our early-access programme.
      </p>
    </div>
  </section>
);

export default TransparencyTrust;
