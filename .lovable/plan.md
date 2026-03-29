

## Fix Stacking Cards — Each Card Covers the Previous One

**Problem**: Currently card 1 has the highest z-index and card 4 the lowest. This means later cards slide *behind* earlier ones. The user wants the opposite: card 2 covers card 1, card 3 covers card 2, etc.

### Change — `src/pages/LandingPage.tsx` (StackingCard component, line 147)

**Single fix**: Reverse the z-index so later cards stack on top of earlier ones:

```
// Before
style={{ top: `${topOffset}px`, zIndex: total - index }}

// After  
style={{ top: `${topOffset}px`, zIndex: index + 1 }}
```

This ensures as you scroll, each new card rises above the previous one, creating the layered stacking effect shown in the reference image.

