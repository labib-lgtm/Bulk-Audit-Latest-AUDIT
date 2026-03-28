

## Upgrade Section-by-Section Animations (AttendFlow-Style)

The current landing page uses basic `fadeInUp` and `stagger` variants everywhere. The plan upgrades **each section** with distinct, polished animations matching AttendFlow's patterns.

### Section-by-Section Animation Spec

| # | Section | Current Animation | Upgraded Animation |
|---|---------|------------------|--------------------|
| 1 | **Site frame** | Static CSS | Fade-in on page load (opacity 0→1 over 1s with 0.5s delay) |
| 2 | **Floating nav** | None | Slide down from -20px + fade-in on mount, `backdrop-blur` transition on scroll |
| 3 | **Hero badge** | Basic fadeInUp | `fadeInBlur`: opacity 0→1, y 20→0, filter blur(8px)→blur(0), 0.6s ease-out |
| 4 | **Hero headline** | Single fadeInUp | **Line-by-line stagger**: each line reveals independently with 0.2s delay between lines, blur(6px)→clear |
| 5 | **Hero CTA buttons** | Basic fade | Scale-in from 0.9→1 + opacity, with spring physics (`stiffness: 400, damping: 25`) |
| 6 | **Demo mockup** | opacity+y(60) | Scale 0.95→1 + y(80→0) + blur(12px→0), custom cubic-bezier, 0.8s duration, 1s delay |
| 7 | **Marketplace carousel** | CSS marquee only | Add `whileInView` fade-in for the label; marquee already has CSS `@keyframes` |
| 8 | **Result counters** | fadeInUp + stagger | Add `whileHover={{ scale: 1.05, y: -4 }}` with spring transition; keep count-up animation |
| 9 | **Bento grid cards** | fadeInUp + stagger | `fadeInBlur` (blur entrance) + `whileHover={{ scale: 1.03, y: -6, boxShadow: "0 0 40px hsl(78 100% 50%/0.15)" }}` with spring transition |
| 10 | **Problem items** | x(-20) slide-in | Keep staggered slide-in; add subtle `whileHover={{ x: 4 }}` nudge |
| 11 | **Dashboard cards** | fadeInUp + stagger | `fadeInBlur` + `whileHover={{ scale: 1.04, y: -4 }}` spring hover |
| 12 | **How It Works steps** | fadeInUp + stagger | Scale-in from 0.9 + connecting arrow fade-in separately with longer delay |
| 13 | **File type cards** | fadeInUp + stagger | Add `whileHover={{ scale: 1.05, rotate: 1 }}` micro-interaction |
| 14 | **Pricing cards** | fadeInUp + stagger | `fadeInBlur` + highlighted card gets a `whileHover={{ scale: 1.05 }}` with glow shadow |
| 15 | **Objection cards** | fadeInUp + stagger | `fadeInBlur` + `whileHover={{ y: -4 }}` |
| 16 | **FAQ accordion** | AnimatePresence height | Add spring physics (`type: "spring", stiffness: 300, damping: 25`) to open/close; icon rotation gets spring too |
| 17 | **Final CTA** | None (static) | `whileInView` scale 0.96→1 + opacity with radial glow pulse (`@keyframes glow-pulse`) |
| 18 | **Footer** | No changes | No changes |

### New Animation Variants to Add

```text
fadeInBlur:
  hidden:  { opacity: 0, y: 30, filter: "blur(8px)" }
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7 } }

heroLineReveal:
  hidden:  { opacity: 0, y: 20, filter: "blur(6px)" }
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5 } }
  (parent stagger: 0.2s between lines)

scaleSpring:
  whileHover: { scale: 1.03, y: -6 }
  transition: { type: "spring", stiffness: 300, damping: 20 }

cardGlowHover:
  whileHover: { 
    scale: 1.03, 
    boxShadow: "0 0 40px -8px hsl(78 100% 50% / 0.2)" 
  }
```

### CSS Additions (`src/index.css`)

- `@keyframes glow-pulse` for the final CTA radial glow pulsing
- `.animate-reveal` class for hero section clip-path/scale entrance
- Update `.glass-card:hover` to include `transform: translateY(-2px)` as CSS fallback

### Hero Text Restructure

Current hero headline is a single `<h1>` block. Will be split into 3-4 `<motion.span>` elements wrapped in a stagger container so each line animates independently:

```text
Line 1: "Stop Guessing."         → delay 0.0s
Line 2: "Start Seeing."          → delay 0.2s  
Line 3: "Your Amazon PPC"        → delay 0.4s
Line 4: "Analytics Suite"        → delay 0.6s (gradient text)
```

### Files Modified
- `src/pages/LandingPage.tsx` — all animation variants + per-section motion props
- `src/index.css` — glow-pulse keyframe, reveal animation, glass-card hover refinement

### No Changes To
- Dashboard pages, Index.tsx, routing, content data arrays, footer

