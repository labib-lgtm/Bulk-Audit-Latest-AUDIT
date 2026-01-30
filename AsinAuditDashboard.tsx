
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine, Cell
} from 'recharts';
import { AppSettings, DashboardData, ATTRIBUTION_MULTIPLIERS } from '../types';
import { SectionHeader, MetricCard, DataTable } from '../components/Widgets';
import { 
  Package, TrendingUp, Activity, 
  AlertTriangle, Diamond, Ghost, Layers, Box, Skull, Sparkles, Image, Zap, MousePointerClick, TrendingDown, X, Check, Search
} from 'lucide-react';

const formatCurrency = (val: number, sym: string) => `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompactCurrency = (val: number, sym: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: sym === '$' ? 'USD' : (sym === '£' ? 'GBP' : 'EUR'), notation: "compact", maximumFractionDigits: 1 }).format(val);
const formatPct = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${(val * 100).toFixed(1)}%`;
};
const formatInt = (val: number) => Math.round(val).toLocaleString();
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

const COLORS = {
    organic: '#10b981', // Emerald
    ad: '#6366f1',      // Indigo
    scatter: '#8b5cf6', // Violet
    danger: '#f43f5e',  // Rose
    warning: '#f59e0b', // Amber
    low: '#e11d48',
    mid: '#f59e0b',
    high: '#10b981'
};

interface ScoreBreakdown {
    base: number;
    cvrScore: number;
    ctrScore: number;
    trafficBonus: number;
    penalties: { reason: string; points: number }[];
    total: number;
}

export const AsinAuditDashboard: React.FC<{ data: DashboardData; previousData?: DashboardData | null; currencySymbol: string; settings?: AppSettings }> = ({ data, previousData, currencySymbol, settings }) => {
    const [hitListFilter, setHitListFilter] = useState<'all' | 'gems' | 'drainers' | 'ghosts' | 'zombies'>('all');
    const [groupByParent, setGroupByParent] = useState(false);
    const [viewMode, setViewMode] = useState<'financial' | 'creative'>('financial');
    const [selectedScoreAsin, setSelectedScoreAsin] = useState<any | null>(null);

    // Get Attribution Multiplier (Default to Standard/1.0 if not provided)
    const multiplier = settings 
        ? ATTRIBUTION_MULTIPLIERS[settings.attributionModel || 'Standard'].SP 
        : 1.0; 

    // 0. Pre-calculate Active Targets Map (AdGroupId -> Enabled Target Count)
    const activeTargetMap = useMemo(() => {
        const map = new Map<string, number>();
        const isEnabled = (s: string) => s && s.toLowerCase() === 'enabled';
        
        // Count enabled keywords/targets per AdGroup
        [...data.spKeywords, ...data.spProductTargets].forEach(t => {
            if (isEnabled(t.state)) {
                 map.set(t.adGroupId, (map.get(t.adGroupId) || 0) + 1);
            }
        });
        return map;
    }, [data.spKeywords, data.spProductTargets]);

    // 0. Pre-calculate AdGroup Mapping (ASIN -> Set<AdGroupId>)
    const asinToAdGroupsMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        data.spSkus.forEach(s => {
            if (!s.asin) return;
            if (!map.has(s.asin)) map.set(s.asin, new Set());
            map.get(s.asin)?.add(s.adGroupId);
        });
        return map;
    }, [data.spSkus]);

    // 1. Aggregate Data by ASIN
    const rawAsinData = useMemo(() => {
        const map = new Map<string, any>();
        let totalAdSpend = 0;
        let totalAdSales = 0;
        let totalSessions = 0;

        // Initialize from Business Report
        data.businessReport.forEach(row => {
            totalSessions += row.sessions;
            map.set(row.childAsin, {
                asin: row.childAsin,
                parentAsin: row.parentAsin && row.parentAsin.length > 1 ? row.parentAsin : '-',
                title: row.title || row.childAsin,
                totalSales: row.orderedProductSales,
                totalUnits: row.unitsOrdered,
                totalOrders: row.totalOrderItems,
                sessions: row.sessions,
                sessionPercentage: row.sessionPercentage,
                pageViews: row.pageViews,
                buyBox: row.buyBoxPercentage,
                adSpend: 0, adSales: 0, adOrders: 0, adClicks: 0, adImpressions: 0
            });
        });

        // Merge Ads Data (SP Only for Attribution)
        data.spSkus.forEach(sku => {
             if (!sku.asin) return;
             const asinKey = sku.asin; 
             
             if (!map.has(asinKey)) {
                 map.set(asinKey, {
                     asin: asinKey,
                     parentAsin: '-',
                     title: `Unknown Product (${asinKey})`,
                     totalSales: 0, totalUnits: 0, totalOrders: 0, sessions: 0, sessionPercentage: 0, pageViews: 0, buyBox: 0,
                     adSpend: 0, adSales: 0, adOrders: 0, adClicks: 0, adImpressions: 0
                 });
             }
             const entry = map.get(asinKey);
             entry.adSpend += sku.spend;
             
             // Apply Attribution Multiplier
             const adjustedSales = sku.sales * multiplier;
             const adjustedOrders = (sku.orders || 0) * multiplier;

             entry.adSales += adjustedSales;
             entry.adOrders += adjustedOrders;
             entry.adClicks += sku.clicks;
             entry.adImpressions += sku.impressions;
             
             totalAdSpend += sku.spend;
             totalAdSales += adjustedSales;
        });

        const rows = Array.from(map.values()).map(item => {
             const effectiveTotalSales = Math.max(item.totalSales, item.adSales);
             const effectiveTotalOrders = Math.max(item.totalOrders, item.adOrders);
             
             const organicSales = Math.max(0, effectiveTotalSales - item.adSales);
             const organicOrders = Math.max(0, effectiveTotalOrders - item.adOrders);
             
             // Calculate Active Targets
             const adGroupIds = asinToAdGroupsMap.get(item.asin);
             let activeTargetsCount = 0;
             if (adGroupIds) {
                 adGroupIds.forEach(agId => {
                     activeTargetsCount += (activeTargetMap.get(agId) || 0);
                 });
             }

             return {
                 ...item,
                 totalSales: effectiveTotalSales,
                 totalOrders: effectiveTotalOrders,
                 organicSales,
                 organicOrders,
                 activeTargets: activeTargetsCount,
                 totSpendShare: safeDiv(item.adSpend, totalAdSpend),
                 adSalesShare: safeDiv(item.adSales, totalAdSales),
                 calcSessionShare: safeDiv(item.sessions, totalSessions) 
             };
        });

        return rows;
    }, [data, activeTargetMap, asinToAdGroupsMap, multiplier]);

    // 1.5 Previous Data Aggregation (For Fatigue Detection)
    const prevAsinData = useMemo(() => {
        if (!previousData) return new Map<string, any>();
        const map = new Map<string, any>();
        // Quick agg of ad data only, as business report might not be in previous data upload usually
        // If we have full mock previous data, we can use it.
        // Assuming previousData structure matches.
        previousData.spSkus.forEach(sku => {
            if (!sku.asin) return;
            if (!map.has(sku.asin)) {
                map.set(sku.asin, { clicks: 0, impressions: 0, orders: 0, spend: 0 });
            }
            const e = map.get(sku.asin);
            e.clicks += sku.clicks;
            e.impressions += sku.impressions;
            e.orders += sku.orders || 0;
            e.spend += sku.spend;
        });
        return map;
    }, [previousData]);

    // 2. Feature E1 & E2: Diagnostics & Fatigue Engine
    const displayData = useMemo(() => {
        // Base financial calculations
        const computed = rawAsinData.map(item => {
            const ctr = safeDiv(item.adClicks, item.adImpressions);
            const totalCvr = safeDiv(item.totalUnits, item.sessions);
            const adCvr = safeDiv(item.adOrders, item.adClicks);
            const cpc = safeDiv(item.adSpend, item.adClicks);

            // --- Feature E1: Listing Quality Score (0-100) ---
            let base = 50; 
            const penalties: { reason: string, points: number }[] = [];
            
            // CVR Contribution (Max 30)
            // Benchmark: 15% CVR
            const cvrScore = Math.min(30, (totalCvr / 0.15) * 30);

            // CTR Contribution (Max 20)
            // Benchmark: 0.4% CTR
            const ctrScore = Math.min(20, (ctr / 0.004) * 20);

            // Traffic Bonus (Max 10)
            let trafficBonus = 0;
            if (item.sessions > 500) trafficBonus = 10;
            else if (item.sessions > 200) trafficBonus = 5;

            // Penalties
            let reasonCode = '';
            if (item.sessions > 300 && totalCvr < 0.03) {
                penalties.push({ reason: 'Ghost Listing (High Traffic, Low CVR)', points: -30 });
                reasonCode = 'Low Conversion (Review Price/PDP)';
            } else if (item.adSpend > 50 && item.totalSales === 0) {
                penalties.push({ reason: 'Zombie (Ad Spend, 0 Sales)', points: -20 });
                reasonCode = 'Zero Sales (Check Stock/Price)';
            } else if (ctr < 0.0015 && item.adImpressions > 2000) {
                penalties.push({ reason: 'Low Ad CTR (<0.15%)', points: -10 });
                reasonCode = 'Low CTR (Test Main Image)';
            } 
            
            // Calc Final
            let score = base + cvrScore + ctrScore + trafficBonus + penalties.reduce((acc, p) => acc + p.points, 0);
            score = Math.max(0, Math.min(100, score)); // Clamp 0-100

            if (score > 80 && !reasonCode) {
                reasonCode = 'High Performer (Scale Traffic)';
            } else if (!reasonCode) {
                reasonCode = 'Standard Performance';
            }

            const scoreBreakdown: ScoreBreakdown = {
                base,
                cvrScore,
                ctrScore,
                trafficBonus,
                penalties,
                total: score
            };

            // --- Feature E2: Fatigue Detection (Time-Series) ---
            let fatigueStatus = 'Stable';
            const prev = prevAsinData.get(item.asin);
            
            if (prev && prev.impressions > 1000 && item.adImpressions > 1000) {
                const prevCtr = safeDiv(prev.clicks, prev.impressions);
                const prevCvr = safeDiv(prev.orders, prev.clicks);
                const prevCpc = safeDiv(prev.spend, prev.clicks);

                const ctrChange = safeDiv(ctr - prevCtr, prevCtr);
                const cvrChange = safeDiv(adCvr - prevCvr, prevCvr);
                const cpcChange = safeDiv(cpc - prevCpc, prevCpc);

                if (ctrChange < -0.20) fatigueStatus = 'Severe Creative Fatigue';
                else if (ctrChange < -0.10) fatigueStatus = 'Creative Fatigue';
                else if (cvrChange < -0.20) fatigueStatus = 'Severe Offer Fatigue';
                else if (cvrChange < -0.10) fatigueStatus = 'Offer Fatigue';
                else if (cpcChange > 0.20) fatigueStatus = 'CPC Inflation';
            } else if (!previousData) {
                fatigueStatus = 'No Prev Data';
            }

            return {
                ...item,
                ctr,
                acos: safeDiv(item.adSpend, item.adSales),
                tacos: safeDiv(item.adSpend, item.totalSales),
                roas: safeDiv(item.adSales, item.adSpend),
                cpc,
                adCvr,
                totalCvr, 
                adDependency: safeDiv(item.adSales, item.totalSales),
                organicWinRate: safeDiv(item.organicOrders, item.totalOrders),
                cpa: safeDiv(item.adSpend, item.adOrders),
                isParent: false,
                variantCount: 1,
                // New Fields
                listingScore: score,
                scoreBreakdown,
                reasonCode,
                fatigueStatus
            };
        });

        // Grouping Logic (Optional)
        if (!groupByParent) {
            return computed.sort((a, b) => b.totalSales - a.totalSales);
        } else {
            // Group by Parent (Aggregation logic simplified for score)
            const parentMap = new Map<string, any>();
            computed.forEach(item => {
                const key = item.parentAsin !== '-' ? item.parentAsin : `No Parent (${item.asin})`;
                if (!parentMap.has(key)) {
                    parentMap.set(key, { ...item, asin: key, title: item.parentAsin !== '-' ? `Parent: ${item.parentAsin}` : item.title, isParent: true, variantCount: 0, weightedScore: 0 });
                }
                const p = parentMap.get(key);
                p.totalSales += item.totalSales;
                p.adSpend += item.adSpend;
                // Accumulate other totals... (Simplified for brevity, copying core financial agg logic from before would be robust)
                p.variantCount++;
                p.weightedScore += (item.listingScore * item.totalSales); // Weight score by sales
            });
            return Array.from(parentMap.values()).map(p => ({
                ...p,
                listingScore: p.totalSales > 0 ? p.weightedScore / p.totalSales : p.listingScore // Average weighted score
            })).sort((a, b) => b.totalSales - a.totalSales);
        }
    }, [rawAsinData, prevAsinData, groupByParent, previousData]);

    // 3. Pulse KPIs
    const stats = useMemo(() => {
        return rawAsinData.reduce((acc, curr) => ({
            totalSales: acc.totalSales + curr.totalSales,
            organicSales: acc.organicSales + curr.organicSales,
            adSales: acc.adSales + curr.adSales,
            adSpend: acc.adSpend + curr.adSpend,
            totalOrders: acc.totalOrders + curr.totalOrders,
            organicOrders: acc.organicOrders + curr.organicOrders
        }), { totalSales: 0, organicSales: 0, adSales: 0, adSpend: 0, totalOrders: 0, organicOrders: 0 });
    }, [rawAsinData]);

    // 4. Hit Lists Filtering
    const hitListData = useMemo(() => {
        switch (hitListFilter) {
            case 'gems': return displayData.filter(r => r.totalCvr > 0.10 && r.sessions < (groupByParent ? 500 : 200) && r.sessions > 0);
            case 'drainers': return displayData.filter(r => r.tacos > 0.25 && r.adSpend > 50);
            case 'ghosts': return displayData.filter(r => r.sessions > 200 && r.totalCvr < 0.02);
            case 'zombies': return displayData.filter(r => r.adSpend > 0 && r.totalSales === 0);
            default: return displayData;
        }
    }, [displayData, hitListFilter, groupByParent]);

    // Columns Definition (Switchable)
    const financialColumns = [
        { 
            key: 'title', header: groupByParent ? 'Parent Product' : 'Product', sortable: true,
            render: (r: any) => (
                <div className="flex flex-col max-w-[180px]">
                    <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs truncate mb-1" title={r.title}>{r.title}</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono w-fit px-1.5 rounded ${r.isParent ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-bold' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'}`}>
                            {r.asin}
                        </span>
                        {r.isParent && <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1 rounded flex items-center gap-1"><Layers size={10} /> {r.variantCount} Vars</span>}
                    </div>
                </div>
            )
        },
        { key: 'adSpend', header: 'Spend', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.adSpend, currencySymbol) },
        { key: 'adSales', header: 'Ad Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.adSales, currencySymbol) },
        { key: 'acos', header: 'ACOS', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.acos) },
        { key: 'totalSales', header: 'Tot Sales', align: 'right' as const, sortable: true, render: (r: any) => <span className="font-bold text-slate-900 dark:text-zinc-100">{formatCurrency(r.totalSales, currencySymbol)}</span> },
        { key: 'tacos', header: 'TACOS', align: 'right' as const, sortable: true, render: (r: any) => <span className={r.tacos > 0.2 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.tacos)}</span> },
        { key: 'adDependency', header: 'Ad Rev %', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.adDependency) },
        { key: 'totalCvr', header: 'Tot CVR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.totalCvr) },
        { key: 'sessions', header: 'Sessions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.sessions) },
    ];

    const creativeColumns = [
        { 
            key: 'title', header: 'Product', sortable: true,
            render: (r: any) => (
                <div className="flex flex-col max-w-[200px]">
                    <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs truncate mb-1" title={r.title}>{r.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{r.asin}</span>
                </div>
            )
        },
        { 
            key: 'listingScore', header: 'Quality Score', align: 'center' as const, sortable: true, 
            render: (r: any) => (
                <button 
                    onClick={() => setSelectedScoreAsin(r)}
                    className="flex flex-col items-center gap-1 group hover:scale-105 transition-transform cursor-pointer"
                    title="Click for Score Breakdown"
                >
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.listingScore >= 80 ? 'bg-emerald-500' : r.listingScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${r.listingScore}%` }}></div>
                    </div>
                    <span className={`text-xs font-black group-hover:underline ${r.listingScore >= 80 ? 'text-emerald-600' : r.listingScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {Math.round(r.listingScore)}/100
                    </span>
                </button>
            )
        },
        { 
            key: 'fatigueStatus', header: 'Fatigue / Trend', align: 'center' as const, sortable: true, 
            render: (r: any) => {
                if (r.fatigueStatus.includes('Severe')) return <span className="flex items-center gap-1 text-[10px] font-black text-white bg-rose-500 px-2 py-1 rounded shadow-sm"><AlertTriangle size={10} fill="currentColor"/> {r.fatigueStatus.replace('Severe', '')}</span>;
                if (r.fatigueStatus === 'Creative Fatigue') return <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded border border-rose-100 dark:border-rose-900/50"><TrendingDown size={12}/> Creative Drop</span>;
                if (r.fatigueStatus === 'Offer Fatigue') return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded border border-amber-100 dark:border-amber-900/50"><TrendingDown size={12}/> CVR Drop</span>;
                if (r.fatigueStatus === 'CPC Inflation') return <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded border border-rose-100 dark:border-rose-900/50"><TrendingUp size={12}/> CPC Spike</span>;
                if (r.fatigueStatus === 'No Prev Data') return <span className="text-slate-300 dark:text-zinc-600 text-[10px]">-</span>;
                return <span className="text-emerald-500 text-[10px] font-bold">Stable</span>;
            }
        },
        { key: 'ctr', header: 'Ad CTR', align: 'right' as const, sortable: true, render: (r: any) => <span className={r.ctr < 0.002 ? 'text-rose-500 font-bold' : ''}>{formatPct(r.ctr)}</span> },
        { key: 'totalCvr', header: 'Unit CVR', align: 'right' as const, sortable: true, render: (r: any) => <span className={r.totalCvr > 0.1 ? 'text-emerald-500 font-bold' : ''}>{formatPct(r.totalCvr)}</span> },
        { key: 'sessions', header: 'Sessions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.sessions) },
        { key: 'reasonCode', header: 'Recommended Action', sortable: true, render: (r: any) => <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{r.reasonCode}</span> }
    ];

    const scatterData = useMemo(() => {
        // PERFORMANCE FIX: Limit scatter plot points
        return displayData
            .filter(r => r.totalSales > 100 || r.adSpend > 50)
            .slice(0, 800)
            .map(r => ({
                ...r,
                tacosPct: r.tacos * 100,
                qualityScore: r.listingScore
            }));
    }, [displayData]);

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
             <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <SectionHeader title="ASIN Level Audit" description="Profitability analysis, listing scoring, and fatigue detection." />
                
                <div className="flex gap-2">
                    {/* View Mode Toggle */}
                    <div className="bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl flex items-center shadow-sm">
                        <button 
                            onClick={() => setViewMode('financial')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'financial' ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <TrendingUp size={14} /> Financials
                        </button>
                        <button 
                            onClick={() => setViewMode('creative')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'creative' ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow' : 'text-slate-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400'}`}
                        >
                            <Sparkles size={14} /> Creative Diagnostics
                        </button>
                    </div>

                    {/* Group By Parent Toggle */}
                    <div className="bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl flex items-center shadow-sm">
                        <button 
                            onClick={() => setGroupByParent(false)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!groupByParent ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <Box size={14} /> Child Items
                        </button>
                        <button 
                            onClick={() => setGroupByParent(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${groupByParent ? 'bg-violet-600 dark:bg-violet-500 text-white shadow' : 'text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400'}`}
                        >
                            <Layers size={14} /> Group by Parent
                        </button>
                    </div>
                </div>
             </div>
            
            {/* 1. PULSE KPIS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                    title="Gross Revenue" 
                    value={formatCompactCurrency(stats.totalSales, currencySymbol)} 
                    subValue={formatCurrency(stats.totalSales, currencySymbol)} 
                />
                <MetricCard 
                    title="Ad Dependency" 
                    value={formatPct(safeDiv(stats.adSales, stats.totalSales))} 
                    subValue="of Revenue from Ads" 
                    color="blue"
                />
                <MetricCard 
                    title="Catalog TACOS" 
                    value={formatPct(safeDiv(stats.adSpend, stats.totalSales))} 
                    subValue={`Total Spend: ${formatCompactCurrency(stats.adSpend, currencySymbol)}`}
                    color={safeDiv(stats.adSpend, stats.totalSales) > 0.15 ? 'red' : 'green'}
                />
                <MetricCard 
                    title="Listing Quality" 
                    value={`${Math.round(displayData.reduce((acc, c) => acc + c.listingScore, 0) / (displayData.length || 1))}/100`} 
                    subValue="Avg Score across catalog"
                    color="green"
                />
            </div>

            {/* 2. CHARTS ROW */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2 mb-6 text-slate-900 dark:text-zinc-100">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue Composition
                    </h4>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={(val) => `${currencySymbol}${val/1000}k`} />
                                <YAxis type="category" dataKey="asin" width={80} tick={{fontSize: 10, fontFamily: 'monospace'}} />
                                <RechartsTooltip 
                                    formatter={(value: number) => formatCurrency(value, currencySymbol)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="organicSales" name="Organic Sales" stackId="a" fill={COLORS.organic} radius={[0, 0, 0, 0]} barSize={20} />
                                <Bar dataKey="adSales" name="Ad Sales" stackId="a" fill={COLORS.ad} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2 mb-6 text-slate-900 dark:text-zinc-100">
                        {viewMode === 'financial' ? <Activity className="w-4 h-4 text-violet-500" /> : <Sparkles className="w-4 h-4 text-brand-500" />} 
                        {viewMode === 'financial' ? 'Profitability Matrix' : 'Creative Quality Matrix'}
                    </h4>
                    <div className="h-80 w-full relative">
                        {viewMode === 'financial' ? (
                            <>
                                <div className="absolute top-2 right-2 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded">Problem Children</div>
                                <div className="absolute bottom-2 right-2 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded">Stars / Cash Cows</div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" dataKey="totalSales" name="Total Sales" unit={currencySymbol} tick={{fontSize: 10}} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                                        <YAxis type="number" dataKey="tacosPct" name="TACOS" unit="%" tick={{fontSize: 10}} />
                                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                                        <ReferenceLine y={15} stroke="#cbd5e1" strokeDasharray="3 3" />
                                        <Scatter name="Products" data={scatterData} fill={COLORS.scatter}>
                                            {scatterData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.tacos > 0.3 ? COLORS.danger : (entry.tacos < 0.15 ? COLORS.organic : COLORS.scatter)} />))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </>
                        ) : (
                            <>
                                <div className="absolute top-2 right-2 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded">High Traffic, High Quality (Scale)</div>
                                <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2 py-1 rounded">Low Traffic, High Quality (Missed Opp)</div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" dataKey="listingScore" name="Quality Score" domain={[0, 100]} tick={{fontSize: 10}} />
                                        <YAxis type="number" dataKey="sessions" name="Sessions" tick={{fontSize: 10}} />
                                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                                        <ReferenceLine x={50} stroke="#cbd5e1" strokeDasharray="3 3" />
                                        <Scatter name="Products" data={scatterData} fill={COLORS.scatter}>
                                            {scatterData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.listingScore > 75 ? COLORS.high : (entry.listingScore < 40 ? COLORS.low : COLORS.mid)} />))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. ACTIONABLE "HIT LISTS" */}
            <div className="space-y-4">
                <SectionHeader title="Actionable Insights" description="Filtered lists to identify specific opportunities and risks." />
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {[
                      { id: 'all', label: `All ${groupByParent ? 'Parents' : 'Products'}`, icon: Package },
                      { id: 'gems', label: 'Hidden Gems', icon: Diamond },
                      { id: 'drainers', label: 'Profit Drainers', icon: AlertTriangle },
                      { id: 'ghosts', label: `Ghost Listings`, icon: Ghost },
                      { id: 'zombies', label: 'Zombies', icon: Skull }
                    ].map(item => (
                      <button 
                          key={item.id}
                          onClick={() => setHitListFilter(item.id as any)} 
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 sm:flex-none ${
                             hitListFilter === item.id 
                                ? (item.id === 'gems' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                                   item.id === 'drainers' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 
                                   item.id === 'ghosts' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                                   item.id === 'zombies' ? 'bg-slate-700 text-white shadow-lg shadow-slate-500' :
                                   'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-slate-200')
                                : (item.id === 'gems' ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200' :
                                   item.id === 'drainers' ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200' :
                                   item.id === 'ghosts' ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-200' :
                                   item.id === 'zombies' ? 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white' :
                                   'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white')
                          }`}
                      >
                          <item.icon size={16} /> <span className="whitespace-nowrap">{item.label}</span>
                      </button>
                    ))}
                </div>

                {hitListFilter !== 'all' && (
                    <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                        hitListFilter === 'gems' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' :
                        hitListFilter === 'drainers' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-800 dark:text-rose-300' :
                        hitListFilter === 'zombies' ? 'bg-slate-100 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-300' :
                        'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    }`}>
                        {hitListFilter === 'gems' && <Diamond className="w-5 h-5 flex-shrink-0" />}
                        {hitListFilter === 'drainers' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                        {hitListFilter === 'ghosts' && <Ghost className="w-5 h-5 flex-shrink-0" />}
                        {hitListFilter === 'zombies' && <Skull className="w-5 h-5 flex-shrink-0" />}
                        
                        <div>
                            <strong>
                                {hitListFilter === 'gems' ? 'Hidden Gems Strategy:' : 
                                 hitListFilter === 'drainers' ? 'Profit Drainer Strategy:' : 
                                 hitListFilter === 'zombies' ? 'Zombie Listing Strategy:' :
                                 'Ghost Listing Strategy:'}
                            </strong>
                            <p className="mt-1 opacity-90">
                                {hitListFilter === 'gems' && 'These products have a high Total CVR (>10%) but low sessions. They are converting well but need more traffic. Consider increasing bids or launching new campaigns.'}
                                {hitListFilter === 'drainers' && 'These products have a high TACOS (>25%) and high spend. They are eating into your profits. Consider lowering bids, adding negatives, or optimizing the listing content.'}
                                {hitListFilter === 'ghosts' && 'These products have traffic (>200 sessions) but very low conversion (<2%). Ads might be driving irrelevant traffic, or the listing price/images need improvement.'}
                                {hitListFilter === 'zombies' && 'These products are spending ad budget but have generated ZERO total sales (Ad or Organic). Immediate review required. Check pricing, stock, and listing status.'}
                            </p>
                        </div>
                    </div>
                )}

                <DataTable 
                    data={hitListData} 
                    columns={viewMode === 'creative' ? creativeColumns : financialColumns} 
                    initialSortKey={hitListFilter === 'gems' ? 'totalCvr' : hitListFilter === 'drainers' ? 'tacos' : 'sessions'} 
                />
            </div>
            
            {/* SCORE BREAKDOWN MODAL */}
            {selectedScoreAsin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800">
                            <div>
                                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-brand-500" />
                                    Listing Score Breakdown
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{selectedScoreAsin.title}</p>
                            </div>
                            <button onClick={() => setSelectedScoreAsin(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-center mb-6">
                                <div className="text-center">
                                    <div className={`text-5xl font-black mb-1 ${selectedScoreAsin.listingScore >= 80 ? 'text-emerald-500' : selectedScoreAsin.listingScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                        {Math.round(selectedScoreAsin.listingScore)}
                                    </div>
                                    <div className="text-xs uppercase font-bold text-slate-400 tracking-widest">Total Score</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                                    <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">Base Score</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">50</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Conversion Factor (CVR {formatPct(selectedScoreAsin.totalCvr)})</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{Math.round(selectedScoreAsin.scoreBreakdown.cvrScore)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Click-Through Factor (CTR {formatPct(selectedScoreAsin.ctr)})</span>
                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">+{Math.round(selectedScoreAsin.scoreBreakdown.ctrScore)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Traffic Validation Bonus</span>
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">+{selectedScoreAsin.scoreBreakdown.trafficBonus}</span>
                                </div>
                                {selectedScoreAsin.scoreBreakdown.penalties.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-rose-500" />
                                            <span className="text-sm font-bold text-rose-800 dark:text-rose-300">{p.reason}</span>
                                        </div>
                                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{p.points}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-2">
                                <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Recommended Action</p>
                                <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-zinc-300">
                                    <Check className="text-brand-500 mt-0.5" size={16} />
                                    {selectedScoreAsin.reasonCode}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {rawAsinData.every(r => r.totalSales === 0) && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-600 dark:text-zinc-400 text-sm flex items-start gap-3">
                    <Activity className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong>Business Report Missing or Empty:</strong> It looks like we only have Advertising data. 
                        To see "Total Sales", "Organic Sales", and "Sessions", please upload a Business Report (Child ASIN) in the main menu.
                    </div>
                </div>
            )}
        </div>
    );
};
