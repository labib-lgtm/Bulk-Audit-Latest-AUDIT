

## Redesign Landing Page (AttendFlow-inspired)

Only `src/pages/LandingPage.tsx` and `src/index.css` will be modified. No dashboard or Index page changes.

### Structure (mapping AttendFlow sections to Lynx content)

1. **Decorative site frame** -- Rounded border around viewport with corner accents (CSS only)
2. **Floating pill nav** -- Rounded-pill navbar (centered, glassmorphic) with logo, Feature/FAQ links, Login + Get Started CTA
3. **Hero section** -- Rounded-bottom container with gradient background. Social proof shimmer badge ("Free Amazon PPC Analytics"), staggered line-by-line headline reveal, sub-text, dual CTA buttons, trust indicators
4. **Glassmorphic demo mockup** -- Overlapping card below hero with a browser-frame style screenshot placeholder showing dashboard preview
5. **Marketplace logo carousel** -- Infinite scrolling strip of Amazon marketplace flags (US, UK, DE, CA, JP, IN, etc.) with "Works with all Amazon marketplaces" label
6. **Results counter strip** -- 3 animated counter cards (4+ hrs saved, 23% waste reduction, 13 dashboards)
7. **Feature bento grid** ("Why Sellers Choose Lynx") -- 6 asymmetric glassmorphic cards: TACOS, AI Analyst, Privacy, Dayparting, Diagnostics, Forecasting with icon + hover glow
8. **Problem agitation** -- Keep existing content, restyle with AttendFlow's cleaner card layout
9. **Dashboard showcase** -- 13 dashboard cards in 3-column grid (existing content, refined styling)
10. **How it works** -- 3-step horizontal cards with connecting arrows
11. **5 file types** -- Compact card grid (existing content)
12. **Pricing** -- 3-tier cards (existing content, refined with AttendFlow border/shadow style)
13. **Objection handling** -- 6 cards grid (existing content)
14. **FAQ accordion** -- Existing FAQs with smoother accordion animation
15. **Final CTA** -- Gradient section with radial glow
16. **Footer** -- Keep existing footer exactly as-is

### CSS additions (`src/index.css`)

- `.site-frame` -- 12px inset border with rounded corners, pointer-events-none overlay
- `.shimmer-badge` -- Animated shimmer gradient on social proof pill
- `.marquee` / `.marquee-track` -- Infinite horizontal scroll for marketplace carousel
- `.glass-card` -- Enhanced glassmorphic card variant with layered borders

### Animation patterns

- Hero text: staggered `framer-motion` line reveals (0.2s delay between lines)
- Bento cards: `whileInView` fade-up with stagger
- Marketplace carousel: CSS `@keyframes marquee` infinite scroll
- FAQ: `AnimatePresence` with height + opacity
- All sections: `whileInView` with `viewport={{ once: true }}`

### What stays unchanged
- All content arrays (problems, dashboards, steps, objections, faqs, tiers)
- Footer content and structure
- Navigation routes (`/auth`, `/dashboard`)
- SEO helmet tags
- **No changes to any dashboard or Index page files**

