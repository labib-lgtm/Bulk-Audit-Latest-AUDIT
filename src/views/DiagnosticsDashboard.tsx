
import React, { useMemo } from 'react';
import { DashboardData, AppSettings, ProductGoal } from '../types';
import { SectionHeader, DataTable } from '../components/Widgets';
import { AlertCircle, TrendingUp, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';

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

    // Helper to calculate optimized bid
    const getOptimizedBid = (cpc: number, currentAcos: number, targetAcos: number) => {
        if (currentAcos === 0) return 0;
        const newBid = cpc * (targetAcos / currentAcos);
        return Math.max(0.02, parseFloat(newBid.toFixed(2))); 
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
        return all.filter(x => x.spend > settings.minSpendThreshold && x.sales === 0).sort((a,b) => b.spend - a.spend);
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

    const getFilename = (prefix: string) => {
        const date = new Date().toISOString().split('T')[0];
        return `${prefix}_${date}.xlsx`;
    };

    const handleExportBleeders = () => {
        const ws = XLSX.utils.json_to_sheet(bleeders.map(b => {
             const row: any = {
                 'Campaign Id': b.campaignId,
                 'Ad Group Id': b.adGroupId,
                 'Entity': b.entity,
                 'State': 'paused',
                 'Operation': 'Update'
             };
             if (b.entity === 'Keyword') {
                 row['Keyword Id'] = b.id;
                 row['Keyword Text'] = b.name; 
             } else {
                 row['Product Targeting Id'] = b.id;
                 row['Product Targeting Expression'] = b.name; 
             }
             return row;
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bulk_Pauses");
        XLSX.writeFile(wb, getFilename("Lynx_Bleeders"));
    };

    const handleExportOptimization = () => {
        const ws = XLSX.utils.json_to_sheet(highAcos.map(h => {
             const row: any = {
                 'Campaign Id': h.campaignId,
                 'Ad Group Id': h.adGroupId,
                 'Entity': h.entity,
                 'Bid': h.recommendedBid,
                 'Operation': 'Update',
                 'Comment': `Optimized to ${formatPct(h.targetAcos)} ACOS`
             };
             if (h.entity === 'Keyword') {
                 row['Keyword Id'] = h.id;
                 row['Keyword Text'] = h.name; 
             } else {
                 row['Product Targeting Id'] = h.id;
                 row['Product Targeting Expression'] = h.name; 
             }
             return row;
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bulk_Bids");
        XLSX.writeFile(wb, getFilename("Lynx_Optimizations"));
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-12">
            <SectionHeader title="Diagnostics & Optimization" description={`Identify inefficiencies based on your Target ACOS (${formatPct(settings.targetAcos)} Global, with Product overrides).`} />
            
            {/* Bleeders Section */}
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
                <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="text-rose-600 w-5 h-5" />
                        <div>
                            <h3 className="font-bold text-rose-900">Bleeders (Zero Sales)</h3>
                            <p className="text-xs text-rose-700">Spend {'>'} {formatCurrency(settings.minSpendThreshold, settings.currencySymbol)} with 0 orders.</p>
                        </div>
                    </div>
                    <button onClick={handleExportBleeders} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm">
                        <FileDown size={14} /> Export Bulk File (Pauses)
                    </button>
                </div>
                <div className="p-4">
                    <DataTable data={bleeders} columns={[
                        { key: 'name', header: 'Target / Keyword', sortable: true },
                        { key: 'type', header: 'Type', sortable: true },
                        { key: 'matchType', header: 'Match', sortable: true, render: (r: any) => <span className="text-[10px] font-mono bg-slate-100 px-1 rounded">{r.matchType}</span> },
                        { key: 'spend', header: 'Wasted Spend', render: (r: any) => <span className="font-bold text-rose-600">{formatCurrency(r.spend, settings.currencySymbol)}</span>, align: 'right', sortable: true },
                        { key: 'clicks', header: 'Clicks', align: 'right', sortable: true },
                        { key: 'cpc', header: 'CPC', render: (r: any) => formatCurrency(safeDiv(r.spend, r.clicks), settings.currencySymbol), align: 'right', sortable: true },
                    ]} initialSortKey="spend" />
                </div>
            </div>

            {/* Optimization Section */}
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                 <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-amber-600 w-5 h-5" />
                        <div>
                            <h3 className="font-bold text-amber-900">Bid Optimization Opportunities</h3>
                            <p className="text-xs text-amber-700">Targets performing worse than their assigned Target ACOS.</p>
                        </div>
                    </div>
                    <button onClick={handleExportOptimization} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm">
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
                        { key: 'currentAcos', header: 'Current ACOS', render: (r: any) => <span className="font-bold text-rose-600">{formatPct(r.currentAcos)}</span>, align: 'right', sortable: true },
                        { key: 'targetAcos', header: 'Target', render: (r: any) => <span className="font-bold text-slate-500 text-xs bg-slate-100 px-1 rounded">{formatPct(r.targetAcos)}</span>, align: 'right', sortable: true },
                        { key: 'recommendedBid', header: 'Rec. Bid', render: (r: any) => <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{formatCurrency(r.recommendedBid, settings.currencySymbol)}</span>, align: 'right', sortable: true },
                     ]} initialSortKey="spend" />
                </div>
            </div>
        </div>
    );
};
