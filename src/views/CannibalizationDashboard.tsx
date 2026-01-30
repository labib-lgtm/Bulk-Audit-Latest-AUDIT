
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { DashboardData } from '../types';
import { SectionHeader, MetricCard, DataTable } from '../components/Widgets';
import { AlertTriangle, Filter, ArrowUpRight, MousePointerClick, Eye, Target, AlertOctagon, Layers } from 'lucide-react';

const formatCurrency = (val: number, sym: string) => `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;
const formatInt = (val: number) => Math.round(val).toLocaleString();
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

interface CampaignConflict {
    campaignName: string;
    matchType: string;
    spend: number;
    sales: number;
    orders: number;
    clicks: number;
    impressions: number;
    cpc: number;
    acos: number;
    cvr: number;
    ctr: number;
    role: 'Primary' | 'Cannibal' | 'Intentional';
    type: 'Competitor' | 'Brand' | 'Category' | 'Auto' | 'Standard';
}

interface TermOverlap {
    term: string;
    totalSpend: number;
    totalSales: number;
    totalOrders: number;
    totalClicks: number;
    totalImpressions: number;
    campaignCount: number;
    matchTypes: string[];
    
    // Counts for Matrix Columns
    exactCount: number;
    phraseCount: number;
    broadCount: number;
    autoCount: number;

    conflicts: CampaignConflict[];
    wastedSpend: number;
    severityScore: number;
    severityLabel: 'High' | 'Medium' | 'Low';
    primaryCampaign: string;
}

interface SaturationMetric {
    rootTerm: string;
    campaignCount: number;
    adGroupCount: number;
    totalSpend: number;
    minCpc: number;
    maxCpc: number;
    avgCpc: number;
    cpcSpread: number; // (Max - Min) / Avg
    recommendation: string;
}

export const CannibalizationDashboard: React.FC<{ data: DashboardData; currencySymbol: string }> = ({ data, currencySymbol }) => {
    const [view, setView] = useState<'overlap' | 'saturation'>('overlap');
    const [minSpendFilter, setMinSpendFilter] = useState(10);

    // Feature C1 (Original) - Cannibalization Checker
    const overlapData = useMemo(() => {
        const termMap = new Map<string, any[]>();
        
        // 1. Group Data by Search Term (Normalized)
        data.searchTerms.forEach(row => {
            const term = (row.customerSearchTerm || row.searchTerm || '').toLowerCase().trim();
            if (!term || row.spend === 0) return;
            if (!termMap.has(term)) termMap.set(term, []);
            termMap.get(term)?.push(row);
        });

        const results: TermOverlap[] = [];

        // 2. Process Each Term Group
        termMap.forEach((rows, term) => {
            const uniqueCampaigns = new Set(rows.map(r => r.campaignName));
            if (uniqueCampaigns.size < 2) return;

            const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
            if (totalSpend < minSpendFilter) return;

            const totalSales = rows.reduce((s, r) => s + r.sales, 0);
            const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
            const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
            const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);

            const campStats = new Map<string, CampaignConflict>();
            
            rows.forEach(r => {
                if (!campStats.has(r.campaignName)) {
                    let type: any = 'Standard';
                    const nameLower = r.campaignName.toLowerCase();
                    if (nameLower.includes('competitor') || nameLower.includes('pat')) type = 'Competitor';
                    else if (nameLower.includes('brand') || nameLower.includes('defens')) type = 'Brand';
                    else if (nameLower.includes('auto')) type = 'Auto';
                    else if (nameLower.includes('category')) type = 'Category';

                    campStats.set(r.campaignName, {
                        campaignName: r.campaignName,
                        matchType: r.matchType || 'AUTO', 
                        spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0, cpc: 0, acos: 0, cvr: 0, ctr: 0,
                        role: 'Cannibal',
                        type
                    });
                }
                const c = campStats.get(r.campaignName)!;
                c.spend += r.spend;
                c.sales += r.sales;
                c.orders += r.orders;
                c.clicks += r.clicks;
                c.impressions += r.impressions;
                
                if (r.matchType === 'EXACT') c.matchType = 'EXACT';
                else if (r.matchType === 'PHRASE' && c.matchType !== 'EXACT') c.matchType = 'PHRASE';
                else if (r.matchType === 'BROAD' && c.matchType !== 'EXACT' && c.matchType !== 'PHRASE') c.matchType = 'BROAD';
            });

            const conflicts = Array.from(campStats.values()).map(c => ({
                ...c,
                cpc: safeDiv(c.spend, c.clicks),
                acos: safeDiv(c.spend, c.sales),
                cvr: safeDiv(c.orders, c.clicks),
                ctr: safeDiv(c.clicks, c.impressions)
            })).sort((a,b) => b.sales - a.sales || b.spend - a.spend); 

            if (conflicts.length > 0) {
                conflicts[0].role = 'Primary';
            }

            const wastedSpend = conflicts.filter(c => c.role !== 'Primary').reduce((s, c) => s + c.spend, 0);
            
            let exactCount = 0, phraseCount = 0, broadCount = 0, autoCount = 0;
            conflicts.forEach(c => {
                if (c.matchType === 'EXACT') exactCount++;
                else if (c.matchType === 'PHRASE') phraseCount++;
                else if (c.matchType === 'BROAD') broadCount++;
                else autoCount++;
            });

            const uniqueTypes = new Set(conflicts.map(c => c.matchType));
            const hasExactVsExact = exactCount > 1;
            
            let score = 0;
            if (wastedSpend > 50) score += 20;
            if (wastedSpend > 200) score += 20;
            if (hasExactVsExact) score += 40;
            if (conflicts.length > 2) score += 10;
            if (conflicts[0].acos > 0.5) score += 10;

            let severityLabel: 'High' | 'Medium' | 'Low' = 'Low';
            if (score >= 60) severityLabel = 'High';
            else if (score >= 30) severityLabel = 'Medium';

            results.push({
                term,
                totalSpend,
                totalSales,
                totalOrders,
                totalClicks,
                totalImpressions,
                campaignCount: conflicts.length,
                matchTypes: Array.from(uniqueTypes),
                exactCount,
                phraseCount,
                broadCount,
                autoCount,
                conflicts,
                wastedSpend,
                severityScore: score,
                severityLabel,
                primaryCampaign: conflicts[0].campaignName
            });
        });

        return results.sort((a,b) => b.wastedSpend - a.wastedSpend);
    }, [data.searchTerms, minSpendFilter]);

    // Feature C2 - Saturation Index
    const saturationData = useMemo(() => {
        // Map Stem -> Target/Keyword Info
        const stemMap = new Map<string, { campaigns: Set<string>, adGroups: Set<string>, spend: number, cpcs: number[] }>();

        const processItem = (text: string, campId: string, agId: string, spend: number, cpc: number) => {
            if (!text || spend === 0) return;
            // Simple stem: remove special chars, lowercase, singularize basic 's'
            const stem = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/s$/, '').trim(); 
            if (stem.length < 3) return;

            if (!stemMap.has(stem)) {
                stemMap.set(stem, { campaigns: new Set(), adGroups: new Set(), spend: 0, cpcs: [] });
            }
            const entry = stemMap.get(stem)!;
            entry.campaigns.add(campId);
            entry.adGroups.add(agId);
            entry.spend += spend;
            if(cpc > 0) entry.cpcs.push(cpc);
        };

        data.spKeywords.forEach(k => processItem(k.keywordText, k.campaignId, k.adGroupId, k.spend, safeDiv(k.spend, k.clicks)));
        data.sbKeywords.forEach(k => processItem(k.keywordText, k.campaignId, k.adGroupId, k.spend, safeDiv(k.spend, k.clicks)));
        // Targets? Maybe less relevant for keyword saturation, but could map if expression has ASIN
        
        const results: SaturationMetric[] = [];
        stemMap.forEach((stats, rootTerm) => {
            if (stats.campaigns.size < 3) return; // Threshold for "Saturation"

            const minCpc = Math.min(...stats.cpcs);
            const maxCpc = Math.max(...stats.cpcs);
            const avgCpc = stats.cpcs.reduce((a,b) => a+b, 0) / stats.cpcs.length;
            
            const cpcSpread = avgCpc > 0 ? (maxCpc - minCpc) / avgCpc : 0;

            let recommendation = 'Monitor';
            if (stats.campaigns.size > 5) recommendation = 'Consolidate Structure';
            else if (cpcSpread > 0.5) recommendation = 'Unify Bids';

            results.push({
                rootTerm,
                campaignCount: stats.campaigns.size,
                adGroupCount: stats.adGroups.size,
                totalSpend: stats.spend,
                minCpc,
                maxCpc,
                avgCpc,
                cpcSpread,
                recommendation
            });
        });

        return results.sort((a,b) => b.campaignCount - a.campaignCount);
    }, [data.spKeywords, data.sbKeywords]);

    // Stats for Overlap
    const stats = useMemo(() => {
        return overlapData.reduce((acc, curr) => ({
            uniqueTerms: acc.uniqueTerms + 1,
            duplicatedSpend: acc.duplicatedSpend + curr.totalSpend,
            duplicatedSales: acc.duplicatedSales + curr.totalSales,
            wastedSpend: acc.wastedSpend + curr.wastedSpend,
            highSeverity: acc.highSeverity + (curr.severityLabel === 'High' ? 1 : 0)
        }), { uniqueTerms: 0, duplicatedSpend: 0, duplicatedSales: 0, wastedSpend: 0, highSeverity: 0 });
    }, [overlapData]);

    const topWastedTerms = useMemo(() => overlapData.slice(0, 10), [overlapData]);

    const renderMatchBadge = (count: number, typeColorClass: string) => {
        if (count === 0) return <span className="text-slate-300 dark:text-zinc-700">-</span>;
        return (
            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${typeColorClass} min-w-[24px] text-center inline-block`}>
                {count > 1 ? `${count} campaigns` : `1 campaign`}
            </span>
        );
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            <SectionHeader 
                title="Cannibalization & Saturation" 
                description="Detect internal competition and structural inefficiencies." 
                rightElement={
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 shadow-sm">
                        <Filter size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Min Spend:</span>
                        <input 
                            type="number" 
                            value={minSpendFilter} 
                            onChange={(e) => setMinSpendFilter(Number(e.target.value))}
                            className="w-16 bg-transparent text-sm font-bold outline-none text-right" 
                        />
                    </div>
                }
            />

            {/* Toggle View */}
            <div className="flex bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-xl w-fit border border-slate-200 dark:border-zinc-700 mb-6">
                <button 
                    onClick={() => setView('overlap')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${view === 'overlap' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}`}
                >
                    <AlertTriangle size={16} /> Cannibalization Checker
                </button>
                <button 
                    onClick={() => setView('saturation')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${view === 'saturation' ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}`}
                >
                    <Layers size={16} /> Saturation Index
                </button>
            </div>

            {/* OVERLAP VIEW */}
            {view === 'overlap' && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard 
                            title="Total Unique Terms" 
                            value={data.searchTerms.length > 0 ? formatInt(new Set(data.searchTerms.map(t => t.searchTerm)).size) : '0'} 
                            subValue="Total terms analyzed"
                            color="blue"
                        />
                        <MetricCard 
                            title="Duplicated Terms" 
                            value={formatInt(stats.uniqueTerms)} 
                            subValue={`${formatPct(safeDiv(stats.uniqueTerms, new Set(data.searchTerms.map(t => t.searchTerm)).size))} of total terms`}
                            // Fix: Changed 'orange' to 'indigo' to satisfy allowed MetricCard color values
                            color="indigo"
                            alert={stats.uniqueTerms > 50}
                        />
                        <MetricCard 
                            title="Duplicated Spend" 
                            value={formatCurrency(stats.duplicatedSpend, currencySymbol)} 
                            subValue="Total spend on conflicts"
                            color="red"
                        />
                        <MetricCard 
                            title="Est. Wasted Spend" 
                            value={formatCurrency(stats.wastedSpend, currencySymbol)} 
                            subValue={`~${formatPct(safeDiv(stats.wastedSpend, stats.duplicatedSpend))} of duplicated spend`}
                            color="indigo"
                        />
                    </div>

                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                        <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-lg mb-1">Top 10 Duplicated Search Terms by Spend</h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">Terms appearing across multiple match types or campaigns causing highest volume spend.</p>
                        
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topWastedTerms} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="term" tick={{fontSize: 10}} interval={0} tickFormatter={(val) => val.length > 12 ? val.substring(0,10)+'..' : val} />
                                    <YAxis tickFormatter={(val) => `${currencySymbol}${val}`} tick={{fontSize: 10}} />
                                    <RechartsTooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="totalSpend" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Keyword Duplication Matrix</h3>
                        </div>
                        
                        <DataTable 
                            data={overlapData}
                            initialSortKey="wastedSpend"
                            columns={[
                                { key: 'term', header: 'Search Term', sortable: true, render: (r: TermOverlap) => <span className="font-bold text-foreground text-sm">{r.term}</span> },
                                { key: 'autoCount', header: 'AUTO/PAT', align: 'center', render: (r: TermOverlap) => renderMatchBadge(r.autoCount, r.autoCount > 1 ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300' : 'bg-muted border-border text-muted-foreground') },
                                { key: 'exactCount', header: 'EXACT', align: 'center', render: (r: TermOverlap) => renderMatchBadge(r.exactCount, r.exactCount > 1 ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-300' : 'bg-primary/10 border-primary/20 text-primary') },
                                { key: 'phraseCount', header: 'PHRASE', align: 'center', render: (r: TermOverlap) => renderMatchBadge(r.phraseCount, 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-400') },
                                { key: 'broadCount', header: 'BROAD', align: 'center', render: (r: TermOverlap) => renderMatchBadge(r.broadCount, 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400') },
                                { key: 'totalSales', header: 'Sales', align: 'right', sortable: true, render: (r: TermOverlap) => formatCurrency(r.totalSales, currencySymbol) },
                                { key: 'totalSpend', header: 'Spend', align: 'right', sortable: true, render: (r: TermOverlap) => formatCurrency(r.totalSpend, currencySymbol) },
                                { key: 'totalOrders', header: 'Orders', align: 'right', sortable: true, render: (r: TermOverlap) => formatInt(r.totalOrders) },
                                { key: 'acos', header: 'ACOS', align: 'right', sortable: true, render: (r: TermOverlap) => <span className={safeDiv(r.totalSpend, r.totalSales) > 0.4 ? 'text-destructive font-bold' : ''}>{formatPct(safeDiv(r.totalSpend, r.totalSales))}</span> },
                                { key: 'wastedSpend', header: 'Est. Waste', align: 'right', sortable: true, render: (r: TermOverlap) => <span className="font-bold text-destructive">{formatCurrency(r.wastedSpend, currencySymbol)}</span> },
                                { key: 'primaryCampaign', header: 'Primary Campaign', sortable: true, render: (r: TermOverlap) => <span className="text-sm text-muted-foreground truncate max-w-[200px]" title={r.primaryCampaign}>{r.primaryCampaign}</span> },
                            ]}
                        />
                    </div>
                </>
            )}

            {/* SATURATION VIEW */}
            {view === 'saturation' && (
                <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-indigo-900 dark:text-indigo-300 font-bold text-lg mb-2 flex items-center gap-2">
                                <AlertOctagon className="w-5 h-5" />
                                Over-segmentation Detector
                            </h3>
                            <p className="text-indigo-800 dark:text-indigo-400 text-sm mb-4 sm:mb-0">
                                Identifying root keywords targeted by <strong>3+ campaigns</strong>. High overlap often leads to bid inflation and split data.
                            </p>
                        </div>
                    </div>

                    <DataTable 
                        data={saturationData}
                        columns={[
                            { key: 'rootTerm', header: 'Root Keyword', sortable: true, render: (r: SaturationMetric) => <span className="font-bold text-slate-900 dark:text-zinc-100">{r.rootTerm}</span> },
                            { key: 'campaignCount', header: 'Campaigns', align: 'center', sortable: true, render: (r: SaturationMetric) => <span className={`font-bold px-2 py-1 rounded ${r.campaignCount > 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>{r.campaignCount}</span> },
                            { key: 'adGroupCount', header: 'Ad Groups', align: 'center', sortable: true, render: (r: SaturationMetric) => <span className="text-slate-500">{r.adGroupCount}</span> },
                            { key: 'totalSpend', header: 'Total Spend', align: 'right', sortable: true, render: (r: SaturationMetric) => formatCurrency(r.totalSpend, currencySymbol) },
                            { key: 'minCpc', header: 'Min CPC', align: 'right', sortable: true, render: (r: SaturationMetric) => formatCurrency(r.minCpc, currencySymbol) },
                            { key: 'maxCpc', header: 'Max CPC', align: 'right', sortable: true, render: (r: SaturationMetric) => formatCurrency(r.maxCpc, currencySymbol) },
                            { key: 'cpcSpread', header: 'CPC Variance', align: 'right', sortable: true, render: (r: SaturationMetric) => <span className={r.cpcSpread > 0.5 ? 'text-rose-500 font-bold' : 'text-emerald-500'}>{formatPct(r.cpcSpread)}</span> },
                            { key: 'recommendation', header: 'Suggestion', align: 'right', render: (r: SaturationMetric) => (
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${r.recommendation === 'Consolidate Structure' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    {r.recommendation}
                                </span>
                            )}
                        ]}
                        initialSortKey="campaignCount"
                    />
                </div>
            )}
        </div>
    );
};
