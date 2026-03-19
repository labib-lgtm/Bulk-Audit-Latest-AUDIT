
import React, { useMemo, useState } from 'react';
import { DashboardData, AppSettings, ProductGoal } from '../types';
import { SectionHeader, DataTable } from '../components/Widgets';
import { AlertCircle, TrendingUp, FileDown, PackageX } from 'lucide-react';
import { ExportPreflightModal } from '../components/ExportPreflightModal';

const formatCurrency = (val: number, symbol: string) => `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPct = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${(val * 100).toFixed(1)}%`;
};
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

interface DiagnosticsProps {
    data: DashboardData;
    settings: AppSettings;
    productGoals?: Record<string, ProductGoal>;
}

export const DiagnosticsDashboard: React.FC<DiagnosticsProps> = ({ data, settings, productGoals = {} }) => {
    // Export State
    const [exportData, setExportData] = useState<{ rows: any[], rollback: any[], filename: string } | null>(null);

    // 1. Build AdGroup -> ASIN Map for Lookup (Because keywords attach to ad groups, and ad groups contain ASINs)
    const adGroupAsinMap = useMemo(() => {
        const map = new Map<string, string[]>();
        data.spSkus.forEach(s => {
            if (!s.adGroupId || !s.asin) return;
            if (!map.has(s.adGroupId)) map.set(s.adGroupId, []);
            map.get(s.adGroupId)?.push(s.asin);
        });
        return map;
    }, [data.spSkus]);

    // 2. Build Inventory Map (ASIN -> Weeks of Cover)
    const inventoryMap = useMemo(() => {
        const map = new Map<string, { woc: number, qty: number }>();
        if (!data.inventory) return map;

        data.inventory.forEach(row => {
            // Simplified Weeks of Cover Calc: Available / (Units Sold last 30 days / 4)
            // Note: We need sales velocity. We will try to get it from Business Report if available for this ASIN.
            
            // Get Velocity from Biz Report
            const bizRow = data.businessReport.find(b => b.childAsin === row.asin);
            const unitsSold30Days = bizRow ? bizRow.unitsOrdered : 0;
            
            // Avoid division by zero
            const weeklyVelocity = unitsSold30Days > 0 ? unitsSold30Days / 4 : 0;
            const woc = weeklyVelocity > 0 ? row.afnFulfillableQuantity / weeklyVelocity : 999; // 999 if no sales (safe)

            map.set(row.asin, { woc, qty: row.afnFulfillableQuantity });
        });
        return map;
    }, [data.inventory, data.businessReport]);

    // 2. Helper to determine Target ACOS for a given Ad Group
    const getTargetAcosForAdGroup = (adGroupId: string): number => {
        const asins = adGroupAsinMap.get(adGroupId);
        // If no ASINs in ad group (rare), fallback to global
        if (!asins || asins.length === 0) return settings.targetAcos;

        // Check if any of these ASINs have a specific goal
        let goalSum = 0;
        let goalCount = 0;

        asins.forEach(asin => {
            const goal = productGoals[asin];
            if (goal && goal.targetAcos) {
                goalSum += goal.targetAcos;
                goalCount++;
            }
        });

        // If found specific goals, return average of them, else global
        return goalCount > 0 ? (goalSum / goalCount) : settings.targetAcos;
    };

    // Helper to calculate optimized bid (Enhanced with Elasticity Power Curve)
    const getOptimizedBid = (cpc: number, currentAcos: number, targetAcos: number) => {
        if (currentAcos === 0 || targetAcos === 0) return 0;
        
        // Elasticity Factor (k):
        // k < 1 : Conservative (Changes bid less than the ratio)
        // k = 1 : Linear (Standard)
        // k > 1 : Aggressive
        // We use k=0.8 for "Sweet Spot" estimation to avoid over-correcting.
        const k = 0.8;
        
        const ratio = targetAcos / currentAcos;
        const newBid = cpc * Math.pow(ratio, k);
        
        return Math.max(0.02, parseFloat(newBid.toFixed(2))); 
    };

    // Helper: Check for Low Stock in Ad Group
    const hasLowStockRisk = (adGroupId: string) => {
        const asins = adGroupAsinMap.get(adGroupId);
        if (!asins || asins.length === 0) return false;
        
        // If ANY ASIN in the ad group has < 4 weeks cover, flag it
        return asins.some(asin => {
            const inv = inventoryMap.get(asin);
            return inv && inv.woc < 4;
        });
    };

    // Bleeders: Spend > Threshold, Sales = 0
    const bleeders = useMemo(() => {
        const all = [
            ...data.spKeywords.map(k => ({ ...k, id: k.keywordId, name: k.keywordText, type: 'SP Keyword', entity: 'Keyword', matchType: k.matchType || 'KEYWORD' })),
            ...data.spProductTargets.map(t => ({ ...t, id: t.targetId, name: t.expression, type: 'SP Target', entity: 'Product Targeting', matchType: 'TARGET' })),
            ...data.sbKeywords.map(k => ({ ...k, id: k.keywordId, name: k.keywordText, type: 'SB Keyword', entity: 'Keyword', matchType: k.matchType || 'KEYWORD' })),
            ...data.sbTargets.map(t => ({ ...t, id: t.targetId, name: t.expression, type: 'SB Target', entity: 'Product Targeting', matchType: 'TARGET' })),
            ...data.sdTargets.map(t => ({ ...t, id: t.targetId, name: t.expression, type: 'SD Target', entity: 'Product Targeting', matchType: 'TARGET' }))
        ];
        
        // Feature 3.1: Enhanced Waste Logic
        return all
            .filter(x => x.spend > settings.minSpendThreshold && x.sales === 0)
            .map(x => ({
                ...x,
                // If clicks > 30 and no sales -> Pause
                // If clicks < 30 but high spend (high CPC) -> Reduce Bid
                recommendedAction: x.clicks > 30 ? 'Pause' : 'Reduce Bid'
            }))
            .sort((a,b) => b.spend - a.spend);
    }, [data, settings.minSpendThreshold]);

    // High ACOS: Spend > Threshold, ACOS > Target ACOS (Dynamic)
    const highAcos = useMemo(() => {
        const all = [
             ...data.spKeywords.map(k => ({ ...k, id: k.keywordId, name: k.keywordText, type: 'SP Keyword', entity: 'Keyword' })),
             ...data.spProductTargets.map(t => ({ ...t, id: t.targetId, name: t.expression, type: 'SP Target', entity: 'Product Targeting' })),
             // SB logic simplified (using global for now as attribution is complex)
             ...data.sbKeywords.map(k => ({ ...k, id: k.keywordId, name: k.keywordText, type: 'SB Keyword', entity: 'Keyword' })),
             ...data.sbTargets.map(t => ({ ...t, id: t.targetId, name: t.expression, type: 'SB Target', entity: 'Product Targeting' })),
        ];
        
        return all
            .map(x => {
                const currentAcos = safeDiv(x.spend, x.sales);
                // Dynamic Lookup based on Ad Group
                const specificTarget = x.type.startsWith('SP') ? getTargetAcosForAdGroup(x.adGroupId) : settings.targetAcos;
                
                return {
                    ...x,
                    currentAcos,
                    targetAcos: specificTarget,
                    cpc: safeDiv(x.spend, x.clicks),
                    recommendedBid: getOptimizedBid(safeDiv(x.spend, x.clicks), currentAcos, specificTarget)
                };
            })
            // Filter where sales exist AND ACOS is higher than the SPECIFIC target
            .filter(x => x.spend > settings.minSpendThreshold && x.sales > 0 && x.currentAcos > x.targetAcos)
            .sort((a,b) => b.spend - a.spend);
    }, [data, settings, productGoals, adGroupAsinMap]);

    // Inventory Risks (Low Cover)
    const inventoryRisks = useMemo(() => {
        if (!data.inventory || data.inventory.length === 0) return [];
        
        const all = [
             ...data.spKeywords.map(k => ({ ...k, id: k.keywordId, name: k.keywordText, type: 'SP Keyword', entity: 'Keyword' })),
             ...data.spProductTargets.map(t => ({ ...t, id: t.targetId, name: t.expression, type: 'SP Target', entity: 'Product Targeting' })),
        ];

        return all
            .filter(x => x.spend > 0 && hasLowStockRisk(x.adGroupId))
            .map(x => {
                // Find which ASIN triggered it
                const asins = adGroupAsinMap.get(x.adGroupId) || [];
                const riskyAsin = asins.find(a => {
                    const inv = inventoryMap.get(a);
                    return inv && inv.woc < 4;
                }) || 'Unknown';
                const woc = inventoryMap.get(riskyAsin)?.woc || 0;

                return {
                    ...x,
                    riskyAsin,
                    woc,
                    recommendation: 'Pause / Lower Bid'
                };
            })
            .sort((a,b) => b.spend - a.spend);

    }, [data, adGroupAsinMap, inventoryMap]);

    const getFilename = (prefix: string) => {
        const date = new Date().toISOString().split('T')[0];
        return `${prefix}_${date}`;
    };

    const handleExportBleeders = () => {
        const primary = bleeders.map(b => {
             const isPause = b.recommendedAction === 'Pause';
             const row: any = {
                 'Campaign Id': b.campaignId,
                 'Ad Group Id': b.adGroupId,
                 'Entity': b.entity,
                 'Operation': 'Update'
             };
             
             if (isPause) {
                 row['State'] = 'paused';
             } else {
                 // FIX: Added parseFloat to ensure Math.max receives numbers
                 row['Bid'] = Math.max(0.02, parseFloat((b.bid * 0.5).toFixed(2))); 
                 row['Comment'] = 'Reduced bid due to high waste (Low CVR)';
             }

             if (b.entity === 'Keyword') {
                 row['Keyword Id'] = b.id;
                 row['Keyword Text'] = b.name; 
             } else {
                 row['Product Targeting Id'] = b.id;
                 row['Product Targeting Expression'] = b.name; 
             }
             return row;
        });

        // Rollback
        const rollback = bleeders.map(b => {
             const row: any = {
                 'Campaign Id': b.campaignId,
                 'Ad Group Id': b.adGroupId,
                 'Entity': b.entity,
                 'Operation': 'Update'
             };
             
             // Restore State or Bid
             row['State'] = 'enabled';
             row['Bid'] = b.bid;

             if (b.entity === 'Keyword') {
                 row['Keyword Id'] = b.id;
                 row['Keyword Text'] = b.name; 
             } else {
                 row['Product Targeting Id'] = b.id;
                 row['Product Targeting Expression'] = b.name; 
             }
             return row;
        });

        setExportData({
            rows: primary,
            rollback: rollback,
            filename: getFilename("Lynx_Bleeders")
        });
    };

    const handleExportOptimization = () => {
        const primary = highAcos.map(h => {
             const row: any = {
                 'Campaign Id': h.campaignId,
                 'Ad Group Id': h.adGroupId,
                 'Entity': h.entity,
                 'Bid': h.recommendedBid,
                 'Operation': 'Update',
                 'Comment': `Optimized to ${formatPct(h.targetAcos)} ACOS (Elasticity Model)`
             };
             if (h.entity === 'Keyword') {
                 row['Keyword Id'] = h.id;
                 row['Keyword Text'] = h.name; 
             } else {
                 row['Product Targeting Id'] = h.id;
                 row['Product Targeting Expression'] = h.name; 
             }
             return row;
        });

        // Rollback: Revert to original Bid
        const rollback = highAcos.map(h => {
             const row: any = {
                 'Campaign Id': h.campaignId,
                 'Ad Group Id': h.adGroupId,
                 'Entity': h.entity,
                 'Bid': h.bid, // Original Bid
                 'Operation': 'Update',
                 'Comment': `Rollback to Original Bid`
             };
             if (h.entity === 'Keyword') {
                 row['Keyword Id'] = h.id;
                 row['Keyword Text'] = h.name; 
             } else {
                 row['Product Targeting Id'] = h.id;
                 row['Product Targeting Expression'] = h.name; 
             }
             return row;
        });

        setExportData({
            rows: primary,
            rollback: rollback,
            filename: getFilename("Lynx_Optimizations")
        });
    };

    const handleExportStockRisks = () => {
        const primary = inventoryRisks.map(r => {
             const row: any = {
                 'Campaign Id': r.campaignId,
                 'Ad Group Id': r.adGroupId,
                 'Entity': r.entity,
                 'State': 'paused',
                 'Operation': 'Update',
                 'Comment': `Low Stock Risk (WOC: ${r.woc.toFixed(1)})`
             };
             if (r.entity === 'Keyword') {
                 row['Keyword Id'] = r.id;
                 row['Keyword Text'] = r.name; 
             } else {
                 row['Product Targeting Id'] = r.id;
                 row['Product Targeting Expression'] = r.name; 
             }
             return row;
        });

        // Rollback: Enable
        const rollback = primary.map(r => ({ ...r, 'State': 'enabled', 'Comment': 'Rollback Stock Pause' }));

        setExportData({
            rows: primary,
            rollback: rollback,
            filename: getFilename("Lynx_Stock_Risks")
        });
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-12">
            <SectionHeader title="Diagnostics & Optimization" description={`Identify inefficiencies based on your Target ACOS (${formatPct(settings.targetAcos)} Global, with Product overrides) and Inventory Health.`} />
            
            {exportData && (
                <ExportPreflightModal 
                    isOpen={!!exportData}
                    onClose={() => setExportData(null)}
                    data={exportData.rows}
                    rollbackData={exportData.rollback}
                    filename={exportData.filename}
                />
            )}

            {/* Inventory Risk Section (New in Phase 1) */}
            {data.inventory && data.inventory.length > 0 && inventoryRisks.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 shadow-sm overflow-hidden ring-4 ring-rose-50 dark:ring-rose-900/20">
                    <div className="bg-rose-100 dark:bg-rose-900/40 px-6 py-4 border-b border-rose-200 dark:border-rose-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <PackageX className="text-rose-700 dark:text-rose-400 w-5 h-5" />
                            <div>
                                <h3 className="font-bold text-rose-900 dark:text-rose-300">Low Stock Risk (Weeks of Cover {'<'} 4)</h3>
                                <p className="text-xs text-rose-800 dark:text-rose-400">You are spending money on products that are about to stock out.</p>
                            </div>
                        </div>
                        <button onClick={handleExportStockRisks} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-rose-300 dark:border-rose-700 rounded-lg text-xs font-bold text-rose-800 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors shadow-sm">
                            <FileDown size={14} /> Export Pauses
                        </button>
                    </div>
                    <div className="p-4">
                        <DataTable data={inventoryRisks} columns={[
                            { key: 'name', header: 'Target / Keyword', sortable: true },
                            { key: 'riskyAsin', header: 'Risk ASIN', sortable: true, render: (r: any) => <span className="font-mono text-xs">{r.riskyAsin}</span> },
                            { key: 'woc', header: 'Weeks Cover', render: (r: any) => <span className="font-bold text-rose-600 dark:text-rose-400">{r.woc.toFixed(1)}</span>, align: 'right', sortable: true },
                            { key: 'spend', header: 'Spend', render: (r: any) => formatCurrency(r.spend, settings.currencySymbol), align: 'right', sortable: true },
                            { key: 'sales', header: 'Sales', render: (r: any) => formatCurrency(r.sales, settings.currencySymbol), align: 'right', sortable: true },
                        ]} initialSortKey="spend" />
                    </div>
                </div>
            )}

            {/* Bleeders Section */}
            <div className="bg-white dark:bg-zinc-900 border border-rose-100 dark:border-rose-900/30 shadow-sm overflow-hidden">
                <div className="bg-rose-50 dark:bg-rose-900/20 px-6 py-4 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="text-rose-600 dark:text-rose-400 w-5 h-5" />
                        <div>
                            <h3 className="font-bold text-rose-900 dark:text-rose-300">Bleeders & Ad Waste</h3>
                            <p className="text-xs text-rose-700 dark:text-rose-400">Targets with Spend {'>'} {formatCurrency(settings.minSpendThreshold, settings.currencySymbol)} and 0 sales.</p>
                        </div>
                    </div>
                    <button onClick={handleExportBleeders} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors shadow-sm">
                        <FileDown size={14} /> Export Actions (Pause/Reduce)
                    </button>
                </div>
                <div className="p-4">
                    <DataTable data={bleeders} columns={[
                        { key: 'name', header: 'Target / Keyword', sortable: true },
                        { key: 'type', header: 'Type', sortable: true },
                        { key: 'matchType', header: 'Match', sortable: true, render: (r: any) => <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-700 px-1 rounded">{r.matchType}</span> },
                        { key: 'spend', header: 'Wasted Spend', render: (r: any) => <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(r.spend, settings.currencySymbol)}</span>, align: 'right', sortable: true },
                        { key: 'clicks', header: 'Clicks', align: 'right', sortable: true },
                        { key: 'cpc', header: 'CPC', render: (r: any) => formatCurrency(safeDiv(r.spend, r.clicks), settings.currencySymbol), align: 'right', sortable: true },
                        { key: 'recommendedAction', header: 'Action', render: (r: any) => <span className={`text-[10px] font-bold px-2 py-1 rounded border ${r.recommendedAction === 'Pause' ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-800' : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800'}`}>{r.recommendedAction}</span>, sortable: true, align: 'center' }
                    ]} initialSortKey="spend" />
                </div>
            </div>

            {/* Optimization Section */}
            <div className="bg-white dark:bg-zinc-900 border border-amber-100 dark:border-amber-900/30 shadow-sm overflow-hidden">
                 <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-4 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-amber-600 dark:text-amber-400 w-5 h-5" />
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-300">Bid Optimization Opportunities</h3>
                            <p className="text-xs text-amber-700 dark:text-amber-400">Elasticity-based bid suggestions for high ACOS targets.</p>
                        </div>
                    </div>
                    <button onClick={handleExportOptimization} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors shadow-sm">
                        <FileDown size={14} /> Export Bulk File (Bids)
                    </button>
                </div>
                <div className="p-4">
                     <DataTable data={highAcos} columns={[
                        { key: 'name', header: 'Target / Keyword', sortable: true },
                        { key: 'bid', header: 'Current Bid', render: (r: any) => formatCurrency(r.bid, settings.currencySymbol), align: 'right', sortable: true },
                        { key: 'cpc', header: 'Actual CPC', render: (r: any) => formatCurrency(r.cpc, settings.currencySymbol), align: 'right', sortable: true },
                        { key: 'spend', header: 'Spend', render: (r: any) => formatCurrency(r.spend, settings.currencySymbol), align: 'right', sortable: true },
                        { key: 'sales', header: 'Sales', render: (r: any) => formatCurrency(r.sales, settings.currencySymbol), align: 'right', sortable: true },
                        { key: 'currentAcos', header: 'Current ACOS', render: (r: any) => <span className="font-bold text-rose-600 dark:text-rose-400">{formatPct(r.currentAcos)}</span>, align: 'right', sortable: true },
                        { key: 'targetAcos', header: 'Target', render: (r: any) => <span className="font-bold text-slate-500 dark:text-zinc-400 text-xs bg-slate-100 dark:bg-zinc-700 px-1 rounded">{formatPct(r.targetAcos)}</span>, align: 'right', sortable: true },
                        { key: 'recommendedBid', header: 'Sweet Spot Bid', render: (r: any) => <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800">{formatCurrency(r.recommendedBid, settings.currencySymbol)}</span>, align: 'right', sortable: true },
                     ]} initialSortKey="spend" />
                </div>
            </div>
        </div>
    );
};
