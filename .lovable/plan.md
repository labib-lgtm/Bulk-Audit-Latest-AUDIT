

## Fix ScrollTextReveal Scroll Sync and Spacing

**Problem**: The word-by-word reveal is not properly synchronized with scrolling, and there's excessive spacing around the section.

### Root Causes

1. **Scroll offset `["start start", "end start"]`** means tracking starts when container top hits viewport top and ends when container bottom hits viewport top. With a very tall container (`totalWords * 3 = ~120vh`), the progress spreads too thin across too much scroll distance.
2. **No overlap in word ranges** — each word occupies a tiny `1/totalWords` slice, making transitions feel abrupt rather than smooth.
3. **Container height formula** `totalWords * 3` is excessive for ~40 words, creating unnecessary scroll distance.

### Changes — `src/components/landing/ScrollTextReveal.tsx`

1. **Reduce container height** to `200vh` (fixed) — enough for the animation without excessive scrolling.
2. **Fix scroll offset** to `["start 0.35", "end start"]` so the reveal begins when the section is near center and completes as it scrolls out.
3. **Add overlapping word ranges** — each word starts revealing slightly before the previous one finishes, creating a smoother wave effect:
   ```
   start = (index / totalWords) * 0.85
   end = start + (1 / totalWords) * 1.5
   ```
4. **Remove fade-out at end** — let the section scroll away naturally instead of fading.
5. **Increase base opacity** from `0.15` to `0.12` for dimmed words (matching the reference's contrast).

### Changes — `src/pages/LandingPage.tsx`

6. **Remove any extra padding/margin** around the `<ScrollTextReveal>` wrapper to tighten spacing between adjacent sections.

### Technical Details

- The key fix is ensuring `scrollYProgress` maps 0→1 across a reasonable scroll distance (~200vh) with the offset tuned so the animation starts mid-viewport entry.
- Overlapping ranges prevent the "popcorn" effect where words snap on one-at-a-time too quickly.

