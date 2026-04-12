PortAI - AI-powered investor helper app with dark/light theme support

## Design System — "Midnight Gold"
- Dark mode default, light mode toggle available
- Theme stored in localStorage key "portai-theme", default "dark"
- Primary: #F0B429 (gold) → HSL 43 87% 55%
- Success/Gain: #00D4B1 (teal) → HSL 168 100% 42%
- Loss/Destructive: #FF4D4D (red) → HSL 0 100% 65%
- Dark bg: #05080F → HSL 220 60% 3%, Cards: #0D1421 → HSL 220 40% 9%
- Secondary surface: #1A2540 → HSL 220 35% 17%
- Borders: #1E2D4A → HSL 220 40% 20%
- Primary text: #E8EDF5 → HSL 220 40% 93%
- Muted text: #6B7A99 → HSL 220 20% 50%
- Font: Plus Jakarta Sans (headings + body) + JetBrains Mono (data/prices)
- Cards: glassmorphism with rgba(13,20,33,0.7), gold-tinted borders rgba(240,180,41,0.08)
- Noise texture overlay at 4% opacity across all backgrounds
- Gold radial glow on hero sections
- Card hover: translateY(-4px) + gold glow shadow
- Scrollbar: thin with gold thumb color
- Border radius: 12px cards, 8px buttons/inputs
- Uppercase labels: letter-spacing 0.08em

## Pages
- Dashboard, AI Chat, Quiz, Forum, Watchlists (with sparklines), Settings
- Landing page has trust badges, glass-card features, gold accents
- All AI outputs show DisclaimerBanner
- Sidebar nav with PortAI branding + glass backdrop-blur

## Architecture
- Frontend with Lovable Cloud backend
- 10,000+ assets: stocks, ETFs, crypto, and index funds (MSCI, FTSE, S&P, etc.)
- useCountUp hook for animated number counters
