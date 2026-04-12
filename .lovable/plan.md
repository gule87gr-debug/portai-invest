

# PortAI "Midnight Gold" UI Redesign

A style-only overhaul — no functionality or logic changes. Updates colors, typography, animations, and polish across the entire app.

---

## Files to modify

### 1. `index.html`
- Replace Google Fonts import: swap Inter + Manrope for **Plus Jakarta Sans** + keep JetBrains Mono
- Update `<meta name="theme-color">` to `#05080F`

### 2. `src/index.css` — Core theme variables & utilities
- **Dark `:root` variables**: Replace entire color palette with Midnight Gold scheme:
  - `--background: 220 60% 3%` (≈ #05080F)
  - `--card: 220 40% 9%` (≈ #0D1421)
  - `--secondary: 220 35% 17%` (≈ #1A2540)
  - `--primary: 43 87% 55%` (≈ #F0B429 gold)
  - `--gain / --success: 168 100% 42%` (≈ #00D4B1 teal)
  - `--loss / --destructive: 0 100% 65%` (≈ #FF4D4D)
  - `--foreground: 220 40% 93%` (≈ #E8EDF5)
  - `--muted-foreground: 220 20% 50%` (≈ #6B7A99)
  - `--border: 220 40% 20%` (≈ #1E2D4A)
- **Light theme** (`.light`): Update to matching light-mode gold palette
- **Font variables**: `--font-display` and `--font-body` → Plus Jakarta Sans; keep `--font-mono` as JetBrains Mono
- **New utility classes**:
  - `.noise-overlay` — pseudo-element with SVG noise texture at 4% opacity
  - `.gold-glow` — radial gradient glow (#F0B429 at 5% opacity)
  - Update `.glass-card` to use `rgba(13,20,33,0.7)`, gold-tinted border `rgba(240,180,41,0.08)`
  - Update scrollbar thumb to gold color
  - Card hover: `translateY(-4px)` + gold glow shadow
  - `.count-up` animation keyframes for number counter effect
  - `.draw-line` animation for chart line drawing
  - Staggered fade+slide-up utility classes
- **Border radius**: Update `--radius` to 12px (cards), add button/input radius at 8px
- **Uppercase label spacing**: `.tracking-label { letter-spacing: 0.08em }`

### 3. `tailwind.config.ts`
- Update `fontFamily.sans` and `fontFamily.display` to Plus Jakarta Sans
- Keep `fontFamily.mono` as JetBrains Mono
- Add new keyframes: `count-up`, `draw-line`, `hover-lift`, `stagger-fade`
- Add animations referencing the new keyframes
- Update border-radius defaults

### 4. `src/components/ui/card.tsx`
- Update Card default classes to use new glass-morphism styles, gold-tinted border, 12px radius
- Add hover transition: `hover:-translate-y-1` + gold glow shadow
- Update inline `boxShadow` to `0 4px 24px rgba(0,0,0,0.4)`

### 5. `src/components/ui/button.tsx`
- Update default variant: gold background (`bg-primary`), dark text
- Add 200ms gold fill-in hover transition
- Set border-radius to 8px (`rounded-lg`)
- Update all variant colors to match gold palette

### 6. `src/components/AppSidebar.tsx`
- Apply semi-transparent dark background with `backdrop-filter: blur(16px)`
- Active link: gold accent color instead of blue
- Update border colors to new `--border`

### 7. `src/components/AppLayout.tsx`
- Add noise texture overlay to main background
- Add gold radial glow behind hero area

### 8. `src/pages/LandingPage.tsx`
- Nav: semi-transparent dark bg + blur(16px), gold accent on CTA
- Hero: add gold radial gradient glow behind section
- Stats bar numbers: add `font-mono` class + count-up animation
- Feature cards: glass-morphism styling with gold-tinted borders
- Buttons: gold primary color
- "How it works" step numbers: gold accent
- Trust badges: gold icon color
- Staggered fade+slide-up animations on sections

### 9. `src/components/Sparkline.tsx`
- Change positive color to `#00D4B1` (teal)
- Change negative color to `#FF4D4D`

### 10. `src/pages/Dashboard.tsx`
- Update trust score colors to gold palette
- Apply glass-card styling to analysis cards
- Add count-up animation to numeric values

### 11. `src/components/TrendingStocks.tsx`
- Update gain/loss colors to teal/red
- Apply `font-mono` to all price/percentage values
- Add count-up animation to price numbers

### 12. `src/pages/Watchlists.tsx`
- Apply glass-morphism to watchlist cards
- Gold accent on filter buttons (active state)
- `font-mono` on all price/percentage data

### 13. `src/components/StockNewsFeed.tsx` & `src/components/StockNews.tsx`
- Update trust score badge colors to gold palette
- Glass-card styling on news items

### 14. `src/pages/HomePage.tsx`
- Gold accents, glass cards, staggered animations

### 15. Other pages (AuthPage, Quiz, Forum, Settings, Pricing, AIChat, StockDetail)
- Apply consistent gold palette via CSS variable changes (most will inherit automatically)
- Ensure `font-mono` on all numeric/financial data

---

## Technical notes

- **~80% of the color change** happens automatically via CSS custom properties in `index.css` — most component files only need minor class tweaks
- Typography change is primarily in the Google Fonts import + tailwind config + CSS vars
- Noise texture will use an inline SVG data URI (no external file needed)
- Count-up animation will be a reusable React hook (`useCountUp`) added to a new file `src/hooks/useCountUp.ts`
- No functionality, routing, or data logic will be modified

