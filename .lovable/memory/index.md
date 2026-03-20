PortAI - AI-powered investor helper app with dark/light theme support

## Design System
- Dark mode default, light mode toggle available (sun/moon icon in top bar)
- Theme stored in localStorage key "portai-theme", default "dark"
- Primary: #2D7DD2 (electric blue) → HSL 210 66% 50%
- Highlight: #00B4D8 (cyan blue) → HSL 193 100% 42%
- Success/Gain: #00C896 (green) → HSL 162 100% 39%
- Loss: #FF4D4D (red) → HSL 0 100% 65%
- Dark bg: #080C14 → HSL 220 45% 5%, Cards: HSL 220 35% 9%
- Light bg: #F0F4FF → HSL 226 100% 97%, Cards: white
- Light border: #BFDBFE → HSL 213 97% 87%
- Font: Manrope (headings) + Inter (body) + JetBrains Mono (data)
- Buttons: electric blue with .btn-glow hover effect
- Cards use glass-card effect in dark mode
- 0.3s transition on bg/border/color for theme switching

## Pages
- Dashboard, AI Chat, Quiz, Forum, Watchlists (with sparklines), Settings
- Landing page has trust badges
- All AI outputs show DisclaimerBanner
- Sidebar nav with PortAI branding + theme toggle + notification bell

## Architecture
- Frontend with Lovable Cloud backend
- 561 assets: 328 stocks, 153 ETFs, 80 crypto
