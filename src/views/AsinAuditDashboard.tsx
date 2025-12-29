
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine, Cell
} from 'recharts';
import { DashboardData } from '../types';
import { SectionHeader, MetricCard, DataTable } from '../components/Widgets';
import { 
  Package, TrendingUp, Activity, 
  AlertTriangle, Diamond, Ghost, Layers, Box
} from 'lucide-react';

const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompactCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact", maximumFractionDigits: 1 }).format(val);
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
};

export const AsinAuditDashboard: React.FC<{ data: DashboardData }> = ({ data }) => {
    const [hitListFilter, setHitListFilter] = useState<'all' | 'gems' | 'drainers' | 'ghosts'>('all');
    const [groupByParent, setGroupByParent] = useState(false);

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
             entry.adSales += sku.sales;
             entry.adOrders += sku.orders;
             entry.adClicks += sku.clicks;
             entry.adImpressions += sku.impressions;
             
             totalAdSpend += sku.spend;
             totalAdSales += sku.sales;
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
    }, [data, activeTargetMap, asinToAdGroupsMap]);

    // 2. Handle Grouping (Child vs Parent)
    const displayData = useMemo(() => {
        if (!groupByParent) {
            // Standard Child ASIN View with calculated ratios
            return rawAsinData.map(item => ({
                ...item,
                ctr: safeDiv(item.adClicks, item.adImpressions),
                acos: safeDiv(item.adSpend, item.adSales),
                tacos: safeDiv(item.adSpend, item.totalSales),
                roas: safeDiv(item.adSales, item.adSpend),
                cpc: safeDiv(item.adSpend, item.adClicks),
                adCvr: safeDiv(item.adOrders, item.adClicks),
                totalCvr: safeDiv(item.totalUnits, item.sessions), 
                adDependency: safeDiv(item.adSales, item.totalSales),
                organicWinRate: safeDiv(item.organicOrders, item.totalOrders),
                cpa: safeDiv(item.adSpend, item.adOrders),
                isParent: false,
                variantCount: 1
            })).sort((a, b) => b.totalSales - a.totalSales);
        } else {
            // Group by Parent ASIN
            const parentMap = new Map<string, any>();
            
            rawAsinData.forEach(item => {
                const key = item.parentAsin !== '-' ? item.parentAsin : `No Parent (${item.asin})`;
                
                if (!parentMap.has(key)) {
                    parentMap.set(key, {
                        asin: key,
                        parentAsin: key,
                        title: item.parentAsin !== '-' ? `Parent: ${item.parentAsin}` : item.title,
                        totalSales: 0, totalUnits: 0, totalOrders: 0, sessions: 0, pageViews: 0,
                        adSpend: 0, adSales: 0, adOrders: 0, adClicks: 0, adImpressions: 0,
                        organicSales: 0, organicOrders: 0, activeTargets: 0,
                        variantCount: 0,
                        isParent: true,
                        // Weighted averages accumulators
                        weightedBuyBox: 0
                    });
                }
                
                const p = parentMap.get(key);
                p.totalSales += item.totalSales;
                p.totalUnits += item.totalUnits;
                p.totalOrders += item.totalOrders;
                p.sessions += item.sessions;
                p.pageViews += item.pageViews;
                p.adSpend += item.adSpend;
                p.adSales += item.adSales;
                p.adOrders += item.adOrders;
                p.adClicks += item.adClicks;
                p.adImpressions += item.adImpressions;
                p.organicSales += item.organicSales;
                p.organicOrders += item.organicOrders;
                p.activeTargets += item.activeTargets;
                p.variantCount += 1;
                
                // Weight buy box by sessions
                p.weightedBuyBox += (item.buyBox * item.sessions);
            });

            return Array.from(parentMap.values()).map(p => ({
                ...p,
                buyBox: safeDiv(p.weightedBuyBox, p.sessions),
                // Recalculate Ratios
                ctr: safeDiv(p.adClicks, p.adImpressions),
                acos: safeDiv(p.adSpend, p.adSales),
                tacos: safeDiv(p.adSpend, p.totalSales),
                roas: safeDiv(p.adSales, p.adSpend),
                cpc: safeDiv(p.adSpend, p.adClicks),
                adCvr: safeDiv(p.adOrders, p.adClicks),
                totalCvr: safeDiv(p.totalUnits, p.sessions), 
                adDependency: safeDiv(p.adSales, p.totalSales),
                organicWinRate: safeDiv(p.organicOrders, p.totalOrders),
                cpa: safeDiv(p.adSpend, p.adOrders),
                
                // For sorting
                totSpendShare: 0, // Recalc later if needed or ignore
                adSalesShare: 0
            })).sort((a, b) => b.totalSales - a.totalSales);
        }
    }, [rawAsinData, groupByParent]);

    // 3. Pulse KPIs (Uses raw data so it's always accurate)
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

    // 4. Chart Data Preparation
    const topProducts = useMemo(() => displayData.slice(0, 10), [displayData]);
    
    const scatterData = useMemo(() => {
        return displayData
            .filter(r => r.totalSales > 100 || r.adSpend > 50)
            .map(r => ({
                ...r,
                tacosPct: r.tacos * 100, // For chart axis
            }));
    }, [displayData]);

    // 5. Hit Lists Filtering
    const hitListData = useMemo(() => {
        switch (hitListFilter) {
            case 'gems': return displayData.filter(r => r.totalCvr > 0.10 && r.sessions < (groupByParent ? 500 : 200) && r.sessions > 0);
            case 'drainers': return displayData.filter(r => r.tacos > 0.25 && r.adSpend > 50);
            case 'ghosts': return displayData.filter(r => r.sessions > 200 && r.totalCvr < 0.02);
            default: return displayData;
        }
    }, [displayData, hitListFilter, groupByParent]);

    // Columns Definition
    const columns = [
        { 
            key: 'title', header: groupByParent ? 'Parent Product' : 'Product', sortable: true,
            render: (r: any) => (
                <div className="flex flex-col max-w-[180px]">
                    <span className="font-bold text-foreground text-xs truncate mb-1" title={r.title}>{r.title}</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono w-fit px-1.5 rounded ${r.isParent ? 'bg-violet-500/20 text-violet-400 font-bold' : 'bg-muted text-muted-foreground'}`}>
                            {r.asin}
                        </span>
                        {r.isParent && (
                            <span className="text-[9px] font-bold text-muted-foreground bg-muted border border-border px-1 rounded flex items-center gap-1">
                                <Layers size={10} /> {r.variantCount} Vars
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        // Hide Parent ASIN column if grouped, show if not
        ...(groupByParent ? [] : [{ key: 'parentAsin', header: 'Parent ASIN', sortable: true, render: (r: any) => <span className="text-xs font-mono text-muted-foreground">{r.parentAsin}</span> }]),
        
        // Traffic (Ads)
        { key: 'adImpressions', header: 'Impressions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.adImpressions) },
        { key: 'adClicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.adClicks) },
        { key: 'ctr', header: 'CTR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.ctr) },
        
        // Spend
        { key: 'adSpend', header: 'Spend', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.adSpend) },
        
        // Ad Efficiency
        { key: 'cpc', header: 'CPC', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.cpc) },
        { key: 'cpa', header: 'CPA', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.cpa) },
        
        // Sales (Ad)
        { key: 'adSales', header: 'Ad Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.adSales) },
        { key: 'acos', header: 'ACOS', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.acos) },
        
        // Orders (Ad)
        { key: 'adOrders', header: 'Ad Orders', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.adOrders) },
        { key: 'adCvr', header: 'Ad CVR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.adCvr) },
        
        // Targets
        { key: 'activeTargets', header: 'Active Targets', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.activeTargets) },
        
        // Total Performance
        { key: 'totalSales', header: 'Tot Sales', align: 'right' as const, sortable: true, render: (r: any) => <span className="font-bold text-foreground">{formatCurrency(r.totalSales)}</span> },
        { key: 'tacos', header: 'TACOS', align: 'right' as const, sortable: true, render: (r: any) => <span className={r.tacos > 0.2 ? 'text-rose-400 font-bold' : ''}>{formatPct(r.tacos)}</span> },
        { key: 'adDependency', header: 'Ad Rev %', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.adDependency) },
        
        // Organic / Total Efficiency
        { key: 'totalCvr', header: 'Tot CVR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.totalCvr) },
        { key: 'sessions', header: 'Sessions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.sessions) },
    ];

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
             <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <SectionHeader title="ASIN Level Audit" description="Profitability analysis and growth opportunities by product." />
                
                {/* Group By Parent Toggle */}
                <div className="bg-card border border-border p-1 rounded-xl flex items-center shadow-sm self-start lg:self-end">
                    <button 
                        onClick={() => setGroupByParent(false)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!groupByParent ? 'bg-foreground text-background shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Box size={14} /> Child Items
                    </button>
                    <button 
                        onClick={() => setGroupByParent(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${groupByParent ? 'bg-violet-600 text-white shadow' : 'text-muted-foreground hover:text-violet-400'}`}
                    >
                        <Layers size={14} /> Group by Parent
                    </button>
                </div>
             </div>
            
            {/* 1. PULSE KPIS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                    title="Gross Revenue" 
                    value={formatCompactCurrency(stats.totalSales)} 
                    subValue={formatCurrency(stats.totalSales)} 
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
                    subValue={`Total Spend: ${formatCompactCurrency(stats.adSpend)}`}
                    color={safeDiv(stats.adSpend, stats.totalSales) > 0.15 ? 'red' : 'green'}
                />
                <MetricCard 
                    title="Organic Win Rate" 
                    value={formatPct(safeDiv(stats.organicOrders, stats.totalOrders))} 
                    subValue={`${formatInt(stats.organicOrders)} Organic Orders`}
                    color="green"
                />
            </div>

            {/* 2. CHARTS ROW */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2 mb-6 text-foreground">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue Composition (Top 10 {groupByParent ? 'Parents' : 'Products'})
                    </h4>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                <XAxis type="number" tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: 'hsl(var(--foreground))' }} />
                                <YAxis type="category" dataKey="asin" width={80} tick={{fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--foreground))'}} />
                                <RechartsTooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="organicSales" name="Organic Sales" stackId="a" fill={COLORS.organic} radius={[0, 0, 0, 0]} barSize={20} />
                                <Bar dataKey="adSales" name="Ad Sales" stackId="a" fill={COLORS.ad} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                    <h4 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2 mb-6 text-foreground">
                        <Activity className="w-4 h-4 text-violet-500" /> Profitability Matrix ({groupByParent ? 'Parent Level' : 'Child Level'})
                    </h4>
                    <div className="h-80 w-full relative">
                        <div className="absolute top-2 right-2 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">Problem Children</div>
                        <div className="absolute bottom-2 right-2 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">Stars / Cash Cows</div>
                        
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis 
                                    type="number" 
                                    dataKey="totalSales" 
                                    name="Total Sales" 
                                    unit="$" 
                                    tick={{fontSize: 10, fill: 'hsl(var(--foreground))'}} 
                                    tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val}
                                />
                                <YAxis 
                                    type="number" 
                                    dataKey="tacosPct" 
                                    name="TACOS" 
                                    unit="%" 
                                    tick={{fontSize: 10, fill: 'hsl(var(--foreground))'}}
                                />
                                <RechartsTooltip 
                                    cursor={{ strokeDasharray: '3 3' }} 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-card p-3 border border-border shadow-xl rounded-xl text-xs">
                                                    <p className="font-bold text-foreground mb-1">{data.asin}</p>
                                                    <p className="text-muted-foreground mb-2 max-w-[150px] truncate">{data.title}</p>
                                                    <div className="flex justify-between gap-4 text-foreground">
                                                        <span>Sales:</span> <span className="font-bold">{formatCurrency(data.totalSales)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-4 text-foreground">
                                                        <span>TACOS:</span> <span className={`font-bold ${data.tacos > 0.2 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatPct(data.tacos)}</span>
                                                    </div>
                                                    {groupByParent && (
                                                         <div className="mt-1 text-muted-foreground italic">{data.variantCount} Variations</div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReferenceLine y={15} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'insideTopLeft',  value: 'Healthy (15%)', fontSize: 10, fill: '#94a3b8' }} />
                                <Scatter name="Products" data={scatterData} fill={COLORS.scatter}>
                                    {scatterData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.tacos > 0.3 ? COLORS.danger : (entry.tacos < 0.15 ? COLORS.organic : COLORS.scatter)} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
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
                      { id: 'ghosts', label: `Ghost ${groupByParent ? 'Parents' : 'Listings'}`, icon: Ghost }
                    ].map(item => (
                      <button 
                          key={item.id}
                          onClick={() => setHitListFilter(item.id as any)} 
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 sm:flex-none ${
                             hitListFilter === item.id 
                                ? (item.id === 'gems' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                                   item.id === 'drainers' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 
                                   item.id === 'ghosts' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' :
                                   'bg-slate-900 text-white shadow-lg shadow-slate-200')
                                : (item.id === 'gems' ? 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200' :
                                   item.id === 'drainers' ? 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200' :
                                   item.id === 'ghosts' ? 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200' :
                                   'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')
                          }`}
                      >
                          <item.icon size={16} /> <span className="whitespace-nowrap">{item.label}</span>
                      </button>
                    ))}
                </div>

                {hitListFilter !== 'all' && (
                    <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                        hitListFilter === 'gems' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                        hitListFilter === 'drainers' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                        'bg-amber-50 border-amber-100 text-amber-800'
                    }`}>
                        {hitListFilter === 'gems' && <Diamond className="w-5 h-5 flex-shrink-0" />}
                        {hitListFilter === 'drainers' && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                        {hitListFilter === 'ghosts' && <Ghost className="w-5 h-5 flex-shrink-0" />}
                        
                        <div>
                            <strong>
                                {hitListFilter === 'gems' ? 'Hidden Gems Strategy:' : 
                                 hitListFilter === 'drainers' ? 'Profit Drainer Strategy:' : 
                                 'Ghost Listing Strategy:'}
                            </strong>
                            <p className="mt-1 opacity-90">
                                {hitListFilter === 'gems' && 'These products have a high Total CVR (>10%) but low sessions. They are converting well but need more traffic. Consider increasing bids or launching new campaigns.'}
                                {hitListFilter === 'drainers' && 'These products have a high TACOS (>25%) and high spend. They are eating into your profits. Consider lowering bids, adding negatives, or optimizing the listing content.'}
                                {hitListFilter === 'ghosts' && 'These products have traffic (>200 sessions) but very low conversion (<2%). Ads might be driving irrelevant traffic, or the listing price/images need improvement.'}
                            </p>
                        </div>
                    </div>
                )}

                <DataTable 
                    data={hitListData} 
                    columns={columns} 
                    initialSortKey={hitListFilter === 'gems' ? 'totalCvr' : hitListFilter === 'drainers' ? 'tacos' : 'sessions'} 
                />
            </div>
            
            {rawAsinData.every(r => r.totalSales === 0) && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm flex items-start gap-3">
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
