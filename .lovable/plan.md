
# Plan: Add Cannibalization Dashboard

## Overview
Add the new `CannibalizationDashboard.tsx` component to the project. This dashboard provides two key features:
1. **Cannibalization Checker** - Detects when the same search terms are being targeted by multiple campaigns, causing internal competition
2. **Saturation Index** - Identifies keywords that are over-segmented across too many campaigns

## Changes Required

### 1. Copy Dashboard File
Copy `CannibalizationDashboard.tsx` to `src/views/CannibalizationDashboard.tsx`

### 2. Update Dashboard Exports
Add the new dashboard to `src/views/Dashboards.tsx`:
- Import `CannibalizationDashboard`
- Add to exports

### 3. Add Navigation Item
Update `src/components/Layout.tsx`:
- Add new nav item for "Cannibalization" with the `Layers` icon (already imported)
- Position it logically after Search Terms sections

### 4. Add View Routing
Update `src/pages/Index.tsx`:
- Import `CannibalizationDashboard`
- Add case in `renderView()` function to render the dashboard
- Pass required props: `data` and `currencySymbol`

## Technical Details

The dashboard expects two props:
- `data: DashboardData` - Already available from existing state
- `currencySymbol: string` - Available from `settings.currencySymbol`

No new dependencies required - the dashboard uses:
- `recharts` (already installed)
- `lucide-react` (already installed)
- Existing `Widgets` components (`SectionHeader`, `MetricCard`, `DataTable`)

## File Changes Summary

| File | Action |
|------|--------|
| `src/views/CannibalizationDashboard.tsx` | Create (copy from upload) |
| `src/views/Dashboards.tsx` | Add import and export |
| `src/components/Layout.tsx` | Add nav item |
| `src/pages/Index.tsx` | Add routing case |
