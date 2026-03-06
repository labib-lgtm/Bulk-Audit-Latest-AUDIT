

## Sponsored Products Dashboard — Add Missing KPI Cards

The SP dashboard currently has 10 KPI cards (Spend, Impressions, Clicks, CPC, CTR, Sales, Orders, ACoS, ROAS, CVR) but is missing the additional KPIs that were added to the SB and SD dashboards: **Units**, **Avg Order Value (AOV)**, and **Cost Per Order (CPO)**.

### Changes to `src/views/SPDashboard.tsx`

1. **Update `stats` useMemo** — add `units` aggregation from `data.spCampaigns` (summing `c.units || 0`), then compute `aov = safeDiv(sales, orders)` and `cpo = safeDiv(spend, orders)`.

2. **Expand metrics into 3 rows** (matching SB layout):
   - **Row 1** (5 cards): Spend, Impressions, Clicks, CPC, CTR
   - **Row 2** (5 cards): Sales, Orders, ACoS, ROAS, CVR
   - **Row 3** (3 cards): Units, Avg Order Value, Cost Per Order

3. **Update grid rendering** — split the single `metrics.map()` grid into three separate `grid-cols-5` grids (row 3 uses `grid-cols-5` with only 3 items, consistent with SB/SD).

