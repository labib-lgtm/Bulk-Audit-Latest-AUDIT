

## Add Quick-Open Download Tabs with Toggle Controls

### What we're building
A section on the upload screen with 4 toggle switches (Bulk Operations, Business Report, FBA Inventory, Hourly Data) and a single "Open All" button that opens Amazon Seller Central download pages in new browser tabs for whichever toggles are enabled.

### Changes to `src/pages/Index.tsx`

1. **Add state** for 4 toggles, all defaulting to `true`:
   - `bulkEnabled`, `businessEnabled`, `inventoryEnabled`, `hourlyEnabled`

2. **Define URL mapping** for each file type pointing to Amazon Seller Central:
   - Bulk Operations → `https://advertising.amazon.com/bulk-operations`
   - Business Report → `https://sellercentral.amazon.com/business-reports`
   - FBA Inventory → `https://sellercentral.amazon.com/inventoryplanning/manageinventoryhealth`
   - Hourly Data → `https://advertising.amazon.com/reports`

3. **Add UI section** between the upload grid and the workspace import area:
   - A row of 4 toggle switches (using the existing `Switch` component from `src/components/ui/switch.tsx`) with labels for each file type
   - A prominent "Open Download Tabs" button that calls `window.open()` for each enabled toggle
   - Styled consistently with the existing dark theme

### UI Layout (below the 5 upload slots)

```text
┌─────────────────────────────────────────────────┐
│  Quick Download from Seller Central             │
│                                                 │
│  [✓] Bulk Operations   [✓] Business Report      │
│  [✓] FBA Inventory     [✓] Hourly Data          │
│                                                 │
│  [ 🔗 Open Download Tabs ]                      │
└─────────────────────────────────────────────────┘
```

### Technical details
- Uses `window.open(url, '_blank')` for each enabled toggle
- Import `Switch` from `@/components/ui/switch` and `Label` from `@/components/ui/label`
- No backend changes needed

