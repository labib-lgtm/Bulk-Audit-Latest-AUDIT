
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import { DashboardData, HourlyPerformanceRow } from '../types';
import { SectionHeader, MetricCard } from '../components/Widgets';
import { Clock, Sun, Moon, AlertOctagon, CheckCircle, Search, Filter } from 'lucide-react';

const formatCurrency = (val: number, symbol: string) => `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

export const DaypartingDashboard: React.FC<{ data: DashboardData; currencySymbol: string }> = ({ data, currencySymbol }) => {
    const [selectedAsin, setSelectedAsin] = useState<string>('');

    // 1. Map ASINs to Campaign Names
    // Use SP SKU data to find which campaigns contain which ASINs
    const asinCampaignMap = useMemo(() => {
        const map = new Map<string, Set<string>>();
        const campaignIdNameMap = new Map<string, string>(
            data.spCampaigns.map(c => [c.campaignId, c.name] as [string, string])
        );

        data.spSkus.forEach(s => {
            if (!s.asin || !s.campaignId) return;
            const cName = campaignIdNameMap.get(s.campaignId);
            if (!cName) return;

            if (!map.has(s.asin)) map.set(s.asin, new Set());
            map.get(s.asin)?.add(cName);
        });
        return map;
    }, [data.spSkus, data.spCampaigns]);

    // 2. Available ASIN List for Dropdown
    const asinOptions = useMemo(() => {
        return Array.from(asinCampaignMap.keys()).sort();
    }, [asinCampaignMap]);

    // 3. Filter Hourly Rows
    const filteredHourlyData = useMemo(() => {
        if (!data.hourlyReport) return [];
        if (!selectedAsin) return data.hourlyReport; // Return all if no filter

        const targetCampaigns = asinCampaignMap.get(selectedAsin);
        if (!targetCampaigns) return [];

        return data.hourlyReport.filter(r => r.campaignName && targetCampaigns.has(r.campaignName));
    }, [data.hourlyReport, selectedAsin, asinCampaignMap]);
    
    // 4. Aggregate by Hour of Day (0-23) based on FILTERED data
    const hourlyStats = useMemo(() => {
        if (filteredHourlyData.length === 0) return [];

        const map = new Map<number, { hour: number; spend: number; sales: number; clicks: number; impressions: number; orders: number }>();
        
        // Initialize 0-23
        for (let i = 0; i < 24; i++) {
            map.set(i, { hour: i, spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 });
        }

        filteredHourlyData.forEach(row => {
            const h = map.get(row.hour);
            if (h) {
                h.spend += row.spend;
                h.sales += row.sales;
                h.clicks += row.clicks;
                h.impressions += row.impressions;
                h.orders += row.orders;
            }
        });

        const totalSpend = Array.from(map.values()).reduce((sum, h) => sum + h.spend, 0);

        return Array.from(map.values()).map(h => ({
            ...h,
            acos: safeDiv(h.spend, h.sales),
            cpc: safeDiv(h.spend, h.clicks),
            cvr: safeDiv(h.orders, h.clicks),
            spendShare: safeDiv(h.spend, totalSpend),
            roas: safeDiv(h.sales, h.spend)
        }));
    }, [filteredHourlyData]);

    // Derived Recommendations
    const recommendations = useMemo(() => {
        if (hourlyStats.length === 0) return [];
        const recs: { hour: number; type: 'Pause' | 'Boost'; reason: string }[] = [];
        
        // Simple logic: 
        // Pause if Spend > Avg AND ROAS < 2 (or ACOS > 50%)
        // Boost if CVR > Avg AND ACOS < 20%
        const avgCvr = safeDiv(hourlyStats.reduce((s, h) => s + h.orders, 0), hourlyStats.reduce((s, h) => s + h.clicks, 0));
        
        hourlyStats.forEach(h => {
            if (h.spend > 10 && h.acos > 0.6) {
                recs.push({ hour: h.hour, type: 'Pause', reason: `High ACOS (${formatPct(h.acos)})` });
            } else if (h.orders > 2 && h.cvr > (avgCvr * 1.5) && h.acos < 0.25) {
                recs.push({ hour: h.hour, type: 'Boost', reason: `High Conversion (${formatPct(h.cvr)})` });
            }
        });
        return recs;
    }, [hourlyStats]);

    const formatHour = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}${ampm}`;
    };

    if (!data.hourlyReport || data.hourlyReport.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-50 dark:bg-zinc-800 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-3xl">
                <Clock className="w-16 h-16 text-slate-300 dark:text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-600 dark:text-zinc-400">No Hourly Data Found</h3>
                <p className="text-slate-400 dark:text-zinc-500 mt-2">Please upload an "Hourly Sponsored Products" report to see Dayparting analysis.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <SectionHeader title="Dayparting Analysis" description="Optimize bids by hour of day based on conversion rates and sales volume." />
                
                {/* ASIN Filter Dropdown */}
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Filter size={16} />
                    </div>
                    <select
                        value={selectedAsin}
                        onChange={(e) => setSelectedAsin(e.target.value)}
                        className="appearance-none w-full pl-10 pr-8 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-slate-700 dark:text-zinc-300 focus:ring-brand-500 focus:border-brand-500 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                    >
                        <option value="">All Products (Account Level)</option>
                        {asinOptions.map(asin => (
                            <option key={asin} value={asin}>{asin}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={14} />
                    </div>
                </div>
            </div>

            {selectedAsin && (
                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl flex items-center gap-3 text-sm text-brand-900 dark:text-brand-300">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>
                        Analysis filtered for <strong>{selectedAsin}</strong>. Data is derived from <strong>{asinCampaignMap.get(selectedAsin)?.size}</strong> associated campaigns.
                    </span>
                </div>
            )}

            {/* Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 p-6 rounded-2xl">
                    <h4 className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-400 mb-4">
                        <Sun className="w-5 h-5" /> Best Hours (Boost Candidates)
                    </h4>
                    {recommendations.filter(r => r.type === 'Boost').length > 0 ? (
                        <div className="space-y-2">
                            {recommendations.filter(r => r.type === 'Boost').map(r => (
                                <div key={r.hour} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                                    <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatHour(r.hour)}</span>
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">{r.reason}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-emerald-700 italic">No clear peak hours identified yet.</p>
                    )}
                </div>

                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 p-6 rounded-2xl">
                    <h4 className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-400 mb-4">
                        <Moon className="w-5 h-5" /> Worst Hours (Pause Candidates)
                    </h4>
                    {recommendations.filter(r => r.type === 'Pause').length > 0 ? (
                        <div className="space-y-2">
                            {recommendations.filter(r => r.type === 'Pause').map(r => (
                                <div key={r.hour} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 shadow-sm">
                                    <span className="font-bold text-rose-800 dark:text-rose-300">{formatHour(r.hour)}</span>
                                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded">{r.reason}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-rose-700 italic">No bleeders identified by hour.</p>
                    )}
                </div>
            </div>

            {/* Heatmap Grid - Updated to 6-col grid for cleaner 4-row (24h) layout */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-6 flex items-center gap-2"><Clock size={18} className="text-brand-500"/> Performance Heatmap (24h)</h4>
                
                <div className="grid grid-cols-6 md:grid-cols-6 lg:grid-cols-6 gap-2">
                    {hourlyStats.map((h) => {
                        // Color Logic: 
                        let bgColor = 'bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700';
                        let textColor = 'text-slate-400 dark:text-zinc-500';
                        
                        if (h.sales > 0) {
                            if (h.acos < 0.3) { bgColor = 'bg-emerald-500 border border-emerald-600'; textColor = 'text-white'; }
                            else if (h.acos < 0.6) { bgColor = 'bg-emerald-200 border border-emerald-300 dark:bg-emerald-900 dark:border-emerald-800'; textColor = 'text-emerald-900 dark:text-emerald-200'; }
                            else { bgColor = 'bg-amber-200 border border-amber-300 dark:bg-amber-900 dark:border-amber-800'; textColor = 'text-amber-900 dark:text-amber-200'; }
                        } else {
                            if (h.spend > 20) { bgColor = 'bg-rose-500 border border-rose-600'; textColor = 'text-white'; }
                            else if (h.spend > 5) { bgColor = 'bg-rose-100 border border-rose-200 dark:bg-rose-900 dark:border-rose-800'; textColor = 'text-rose-800 dark:text-rose-200'; }
                        }

                        return (
                            <div key={h.hour} className={`flex flex-col items-center justify-center p-3 rounded-xl ${bgColor} transition-transform hover:scale-105 hover:shadow-lg cursor-help group relative h-20`}>
                                <span className={`text-xs font-bold ${textColor}`}>{formatHour(h.hour)}</span>
                                {h.sales > 0 ? (
                                    <span className={`text-[10px] font-bold ${textColor} mt-1`}>${Math.round(h.sales)}</span>
                                ) : h.spend > 5 ? (
                                    <span className={`text-[10px] font-bold ${textColor} mt-1`}>-${Math.round(h.spend)}</span>
                                ) : (
                                    <span className={`text-[10px] ${textColor} opacity-50 mt-1`}>-</span>
                                )}
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-slate-900 text-white text-xs rounded-xl p-3 opacity-0 group-hover:opacity-100 pointer-events-none z-20 shadow-2xl border border-slate-700">
                                    <p className="font-heading font-bold mb-2 text-brand-400 text-sm border-b border-white/20 pb-1">{formatHour(h.hour)} Stats</p>
                                    <div className="flex justify-between mb-1"><span>Spend:</span> <span className="font-mono">{formatCurrency(h.spend, currencySymbol)}</span></div>
                                    <div className="flex justify-between mb-1"><span>Sales:</span> <span className="font-mono">{formatCurrency(h.sales, currencySymbol)}</span></div>
                                    <div className="flex justify-between mb-1"><span>ACOS:</span> <span className={h.acos > 0.5 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{formatPct(h.acos)}</span></div>
                                    <div className="flex justify-between"><span>CVR:</span> <span className="font-mono">{formatPct(h.cvr)}</span></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sales vs Spend Chart */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={hourlyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} />
                        <YAxis yAxisId="left" orientation="left" stroke="#6366f1" tickFormatter={(v) => `${currencySymbol}${v}`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                        <RechartsTooltip />
                        <Bar yAxisId="left" dataKey="spend" name="Spend" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="sales" name="Sales" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
