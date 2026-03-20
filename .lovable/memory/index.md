# Memory: index.md
Updated: now

PortAI - AI-powered investor helper app with dark finance theme

## Design System
- Dark mode default, no light mode toggle
- Primary: #2D7DD2 (electric blue) → HSL 210 66% 50%
- Highlight: #00B4D8 (cyan blue) → HSL 193 100% 42%
- Success/Gain: #00C896 (green) → HSL 162 100% 39%
- Loss: #FF4D4D (red) → HSL 0 100% 65%
- Warning: HSL 40 90% 55% (amber)
- Background: #080C14 → HSL 220 45% 5%
- Cards: #0F1724 → HSL 220 35% 9% (glassmorphism: backdrop-blur-md, 60% opacity)
- Border: #1E3A5F → HSL 212 60% 24%
- Text primary: #F1F5F9 → HSL 213 33% 96%
- Text secondary: #94A3B8 → HSL 215 16% 47%
- Font: Manrope (headings) + Inter (body) + JetBrains Mono (data)
- Buttons: electric blue with .btn-glow hover effect
- All cards use glass-card effect (backdrop-blur + blue-tinted border)
- Price animations: .flash-gain / .flash-loss CSS classes
- Sparkline component for inline stock charts

## Pages
- Dashboard (news + trust scores), AI Chat, Quiz (5-step wizard), Forum, Watchlists (with sparklines), Settings
- Landing page has trust badges: 256-bit Encryption, Bank-level Security, SOC 2 Compliant
- All AI outputs show DisclaimerBanner ("Not financial advice")
- Sidebar nav with PortAI branding

## Architecture
- Frontend with Lovable Cloud backend
- 561 assets: 328 stocks, 153 ETFs, 80 crypto
