# Premium Bento + Motion Overhaul

Scope rule (locked): no color, theme, hex, bg-*, text-* color, or HSL variable changes. Only layout, spacing, radius, typography features, and motion. All existing semantic tokens stay exactly as-is.

## 1. Global design tokens (`src/index.css`, `tailwind.config.ts`)
- Add utilities: `.bento-card` (rounded-2xl, p-8 sm:p-10, border), `.bento-grid` (gap-6), `.tnum` (`font-variant-numeric: tabular-nums`), `.metric-label` (text-xs uppercase tracking-widest text-muted-foreground), `.editorial-h1` (tracking-tighter), `.editorial-h2` (tracking-tight).
- Add keyframes: `draw-line`, `scanner-sweep`, `spring-in`, `gauge-overshoot`, `stagger-up`, `pop-in` (95→100 + fade, 150ms).
- Custom auto-hide scrollbar: thin, fades in on `:hover`/`:active`, hidden otherwise. Apply on `body` + `.scroll-area`.
- Tighten H1/H2 globally in `@layer base` with `tracking-tight`.

## 2. Bento architecture
- Dashboard (`src/pages/Dashboard.tsx`): convert feature sections to `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with `bento-grid` gap and `bento-card` styling (rounded-2xl, doubled padding).
- LandingPage feature/section grids → same bento treatment (cards only — no copy or color changes).
- Watchlists card shell → rounded-2xl, doubled padding.
- StockDetail panels (Technical Analysis, About, Recent News, chart wrapper) → rounded-2xl + p-8.

## 3. Typography mechanics
- Add `tabular-nums` (`.tnum` / `tabular-nums` Tailwind class) to every price/score/percent span in: Dashboard, Watchlists, StockDetail, TrendingStocks, Sparkline labels, NewsFeed bias scores, BillingStatusWidget price.
- Convert metric labels (Market Cap / Volume / Open / High / Low / Prev Close / Truth Score caption) to `.metric-label`.
- Apply `editorial-h1` / `editorial-h2` to all page H1/H2.

## 4. Hero "money shot" (`LandingPage.tsx`)
- Center URL analyzer, increase to `h-16 text-lg` with `rounded-2xl`.
- Focus state: spring border expansion via Tailwind `focus-within:ring-4 focus-within:ring-primary/30 transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]`.
- New `<ScannerSkeleton />` component: stacked skeleton lines with a moving highlight bar (CSS-only, uses existing tokens) — swapped in during analysis loading.
- Hero copy + split-screen visuals: wrap in `.stagger-fade` (already defined) — extend with two more delays.

## 5. News feed masonry + hover physics
- `StockNewsFeed.tsx`: switch list to CSS columns masonry (`columns-1 md:columns-2 xl:columns-3 gap-6 [&>*]:break-inside-avoid [&>*]:mb-6`).
- Article card hover: `transition-transform duration-200 hover:-translate-y-0.5`; bias badge inside gets `group-hover:scale-105 transition-transform`.

## 6. Watchlists expandable rows (`Watchlists.tsx`)
- Replace static table rows with horizontal bar list. Each row: `group` with collapsed height; `group-hover:` reveals a sparkline + volume strip via `grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300` pattern. Sparkline component already exists.

## 7. Stock detail kinematics
- `YahooFinanceChart`: add SVG overlay `<path>` with `stroke-dasharray` + `animate-[draw-line_1.2s_ease-out_forwards]` on mount (line-draw effect on whatever line chart it renders; if it's an iframe widget, skip the draw and add a fade-in overlay).
- Technical gauge (TradingView widget is iframe — cannot animate internals). Add a wrapper with `animate-[spring-in_700ms_cubic-bezier(0.34,1.56,0.64,1)]` so the gauge container overshoots/settles.

## 8. Heatmap (S&P 500)
- TradingView heatmap is iframe — true zoom/pan + shared-element morph is not possible inside a 3rd-party iframe. Implement closest feasible: wrap in a pinch/scroll-zoom container using CSS `transform: scale()` with wheel + drag handlers; on ticker-row click elsewhere, use a FLIP-style transition (Framer Motion `layoutId`) from clickable mini-card → StockDetail header. Document the iframe limitation in the wrapper.

## 9. Universal micro-interactions
- Override shadcn dropdown / tooltip / dialog / popover animation classes via `tailwind.config.ts` keyframes to use `pop-in 150ms`.
- Scrollbar utility from §1 applied globally.

## Technical notes
- No business-logic or backend changes.
- No new dependencies; reuse existing framer-motion (already used in OnboardingTutorial).
- All animations respect `prefers-reduced-motion` via a `@media` block disabling transforms/keyframes.
- Files touched (≈12): `src/index.css`, `tailwind.config.ts`, `Dashboard.tsx`, `LandingPage.tsx`, `Watchlists.tsx`, `StockDetail.tsx`, `StockNewsFeed.tsx`, `YahooFinanceChart.tsx`, `TradingViewWidgets.tsx`, `Sparkline.tsx`, `BillingStatusWidget.tsx`, new `src/components/ScannerSkeleton.tsx`.

## Out of scope / honest limits
- TradingView widgets (heatmap, technical gauge, news embed) are iframes — internal animations (needle spring, true heatmap pan/zoom, shared-element morph into iframe) cannot be modified. Wrapper-level animations only.
- No color/theme edits anywhere, per instruction.
