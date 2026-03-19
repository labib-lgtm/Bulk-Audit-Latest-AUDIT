

## Plan: Full Sync — Replace All Files to Match GitHub Codebase

The `src/` directory (which builds the preview) is out of sync with your GitHub codebase (root-level files). This plan replaces/creates 17 files to bring them in sync.

---

### Files to Update/Create

| # | File | Action | Why |
|---|------|--------|-----|
| 1 | `src/types.ts` | **Replace** | Add `Currency` (CAD/AUD/JPY/INR), `CURRENCY_SYMBOLS`, `UserRole`, `AttributionModel`, `ATTRIBUTION_MULTIPLIERS`, `ProductCost`, `ProfitSettings`, `InventoryRow`, `HourlyPerformanceRow`, and extended `DashboardData` |
| 2 | `src/services/dataProcessor.ts` | **Replace** | Copy from root `services/dataProcessor.ts` — adds `processInventoryReport`, `processHourlyReport`, `detectCurrencyFromWorkbook` |
| 3 | `src/services/mockData.ts` | **Replace** | Copy from root `services/mockData.ts` — adds inventory, hourly, profit mock data |
| 4 | `src/services/aiService.ts` | **Create** | Copy from root `services/aiService.ts` — AI insights using `@google/genai` (already in package.json) |
| 5 | `src/services/persistence.ts` | **Create** | Copy from root `services/persistence.ts` — IndexedDB state persistence |
| 6 | `src/components/Widgets.tsx` | **Replace** | Copy from root `components/Widgets.tsx` — adds `ChevronRightIcon` and other features |
| 7 | `src/components/ExportPreflightModal.tsx` | **Create** | Copy from root `components/ExportPreflightModal.tsx` — used by Portfolio & Diagnostics dashboards |
| 8 | `src/views/ExecutiveDashboard.tsx` | **Replace** | 690 lines, adds AI insights, attribution model, previous period comparison |
| 9 | `src/views/PortfolioDashboard.tsx` | **Replace** | Adds budget recommendations, export functionality |
| 10 | `src/views/SPDashboard.tsx` | **Replace** | Adds currencySymbol prop, enhanced metrics |
| 11 | `src/views/SBDashboard.tsx` | **Replace** | Adds currencySymbol prop |
| 12 | `src/views/SDDashboard.tsx` | **Replace** | Adds currencySymbol prop |
| 13 | `src/views/SearchTermDashboard.tsx` | **Replace** | 1104 lines, adds lifecycle analysis, currencySymbol/settings props |
| 14 | `src/views/DiagnosticsDashboard.tsx` | **Replace** | Enhanced with export preflight |
| 15 | `src/views/SettingsDashboard.tsx` | **Replace** | Adds attribution model, currency settings |
| 16 | `src/views/AsinAuditDashboard.tsx` | **Replace** | Enhanced profitability analysis |
| 17 | `src/views/ProfitDashboard.tsx` | **Create** | 562 lines — cost analysis, profit waterfall, bid optimization |
| 18 | `src/views/DaypartingDashboard.tsx` | **Create** | 257 lines — hourly performance visualization |
| 19 | `src/views/ForecastingDashboard.tsx` | **Create** | 482 lines — bid/seasonality simulation |
| 20 | `src/views/CannibalizationDashboard.tsx` | **Create** | 465 lines — keyword cannibalization detection |
| 21 | `src/views/Dashboards.tsx` | **Replace** | Export all 13 dashboards |
| 22 | `src/components/Layout.tsx` | **Update** | Add nav items: Profit Analytics, Forecasting, Cannibalization Checker, Dayparting (with icons Wallet, LineChart, ShieldAlert, Clock) |
| 23 | `src/pages/Index.tsx` | **Update** | Add state for `previousBulkData`, `inventoryReport`, `hourlyReport`, `productCosts`, `profitSettings`; add upload slots for Previous Period, Inventory, Hourly; update `renderView()` with all 13 dashboard cases passing correct props; update `EMPTY_DATA` and `DEFAULT_SETTINGS` |

### What Stays Unchanged
- `src/App.tsx` — auth wrapper preserved
- `src/hooks/` — useAuth, useUserRole unchanged
- `src/integrations/supabase/` — untouched
- `src/views/TeamManagement.tsx` — untouched
- All UI components (`src/components/ui/`) — untouched

### Import Path Strategy
Root-level files use `'../types'`, `'../components/Widgets'`, `'../services/aiService'`. When placed in `src/views/`, these resolve to `src/types.ts`, `src/components/Widgets.tsx`, `src/services/aiService.ts` — all correct. No path changes needed for most files.

### Dependency Note
`@google/genai` is already in `package.json`. `xlsx` is already present. No new dependencies needed.

