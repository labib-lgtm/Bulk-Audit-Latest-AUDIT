
import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ReferenceLine, Line, BarChart, Bar, Legend, ComposedChart
} from 'recharts';
import { DashboardData, AppSettings } from '../types';
import { SectionHeader, MetricCard, DataTable } from '../components/Widgets';
import { TrendingUp, RefreshCw, Calculator, DollarSign, Sliders, Calendar, ArrowRight, Target, Crown, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const formatCurrency = (val: number, symbol: string) => `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatExactCurrency = (val: number, symbol: string) => `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

export const ForecastingDashboard: React.FC<{ data: DashboardData; currencySymbol: string; settings: AppSettings }> = ({ data, currencySymbol, settings }) => {
    const [bidModifier, setBidModifier] = useState<number>(0); // -50 to +100 percent
    const [seasonality, setSeasonality] = useState<number>(0); // -50 to +200 percent (Market Trend)

    // Margin estimation (using Break Even ACOS)
    const margin = settings.breakEvenAcos || 0.40;

    // 1. Advanced Base Aggregation (Split by Placement)
    const baseData = useMemo(() => {
        // We focus on SP mainly as it has the clearest placement data
        // Calculate TOS vs Rest metrics to build the elasticity model
        let tosSpend = 0, tosSales = 0, tosClicks = 0, tosImps = 0, tosOrders = 0;
        let rosSpend = 0, rosSales = 0, rosClicks = 0, rosImps = 0, rosOrders = 0;

        data.spPlacements.forEach(p => {
            if (p.placement.includes('Top of Search')) {
                tosSpend += p.spend;
                tosSales += p.sales;
                tosClicks += p.clicks;
                tosImps += p.impressions;
                tosOrders += p.orders;
            } else {
                rosSpend += p.spend;
                rosSales += p.sales;
                rosClicks += p.clicks;
                rosImps += p.impressions;
                rosOrders += p.orders;
            }
        });

        // Fallback if no placement data exists (rare)
        if (tosClicks + rosClicks === 0) {
             const targets = [...data.spKeywords, ...data.spProductTargets].filter(t => t.state === 'enabled');
             rosSpend = targets.reduce((s, t) => s + t.spend, 0);
             rosSales = targets.reduce((s, t) => s + t.sales, 0);
             rosClicks = targets.reduce((s, t) => s + t.clicks, 0);
             rosImps = targets.reduce((s, t) => s + t.impressions, 0);
             rosOrders = targets.reduce((s, t) => s + t.orders, 0);
        }

        const totalClicks = tosClicks + rosClicks;
        const tosShare = safeDiv(tosClicks, totalClicks);
        
        // Metrics per placement
        const tosCpc = safeDiv(tosSpend, tosClicks);
        const tosCvr = safeDiv(tosOrders, tosClicks);
        const tosAov = safeDiv(tosSales, tosOrders);

        const rosCpc = safeDiv(rosSpend, rosClicks);
        const rosCvr = safeDiv(rosOrders, rosClicks);
        const rosAov = safeDiv(rosSales, rosOrders);

        return { 
            tos: { cpc: tosCpc || rosCpc * 1.5, cvr: tosCvr || rosCvr * 1.5, aov: tosAov || rosAov, share: tosShare },
            ros: { cpc: rosCpc, cvr: rosCvr, aov: rosAov, share: 1 - tosShare },
            totalClicks,
            totalSpend: tosSpend + rosSpend,
            totalSales: tosSales + rosSales
        };
    }, [data]);

    // 2. Position-Aware Simulation Engine (Global)
    const simulationData = useMemo(() => {
        const points = [];
        
        // Simulate from -50% to +100% bid change
        for (let i = -50; i <= 100; i += 5) {
            const pctChange = i / 100;
            const seasonalMult = 1 + (seasonality / 100);

            // MODELING LOGIC:
            // 1. Bid Increase leads to higher TOS Share (Placement Shift)
            const logit = Math.log(Math.max(0.01, Math.min(0.99, baseData.tos.share)) / (1 - Math.max(0.01, Math.min(0.99, baseData.tos.share))));
            const sensitivity = 1.5; // How fast we shift to TOS given a bid increase
            const newShareTOS = 1 / (1 + Math.exp(-(logit + (pctChange * sensitivity))));
            const newShareROS = 1 - newShareTOS;

            // 2. Traffic Elasticity (Total Clicks increase with Bid + Seasonality)
            const trafficElasticity = i > 0 ? 0.8 : 1.1; 
            const projectedClicks = baseData.totalClicks * Math.pow(1 + pctChange, trafficElasticity) * seasonalMult;

            // 3. Calculated Blended Metrics
            const projTosCpc = baseData.tos.cpc * (1 + (pctChange * 0.9)); 
            const projRosCpc = baseData.ros.cpc * (1 + (pctChange * 0.7)); 

            const newSpend = (projectedClicks * newShareTOS * projTosCpc) + (projectedClicks * newShareROS * projRosCpc);
            
            const newSales = (projectedClicks * newShareTOS * baseData.tos.cvr * baseData.tos.aov) + 
                             (projectedClicks * newShareROS * baseData.ros.cvr * baseData.ros.aov);

            // CORRECT PROFIT CALCULATION: (Sales * Margin) - Spend
            // Assuming Break Even ACOS ~ Profit Margin
            const profit = (newSales * margin) - newSpend;
            
            const roas = safeDiv(newSales, newSpend);
            const acos = safeDiv(newSpend, newSales);
            const blendedCvr = (newShareTOS * baseData.tos.cvr) + (newShareROS * baseData.ros.cvr);

            points.push({
                modifier: i,
                label: `${i > 0 ? '+' : ''}${i}%`,
                spend: newSpend,
                sales: newSales,
                profit: profit,
                acos: acos,
                roas: roas,
                blendedCvr: blendedCvr,
                tosShare: newShareTOS,
                rosShare: newShareROS
            });
        }
        return points;
    }, [baseData, seasonality, margin]);

    // 2.5 Per-Campaign Simulation (For Table)
    const campaignProjections = useMemo(() => {
        // Group Placements by Campaign
        const campPlacements = new Map<string, any[]>();
        data.spPlacements.forEach(p => {
            if(!campPlacements.has(p.campaignId)) campPlacements.set(p.campaignId, []);
            campPlacements.get(p.campaignId)?.push(p);
        });

        // Loop Campaigns
        return data.spCampaigns
            .filter(c => c.state === 'enabled' && c.spend > 10) // Only relevant active campaigns
            .map(c => {
                const placements = campPlacements.get(c.campaignId) || [];
                
                // Extract Campaign Specific Metrics
                let tosSpend = 0, tosSales = 0, tosClicks = 0;
                let rosSpend = 0, rosSales = 0, rosClicks = 0;

                placements.forEach(p => {
                    if(p.placement.includes('Top of Search')) {
                        tosSpend += p.spend; tosSales += p.sales; tosClicks += p.clicks;
                    } else {
                        rosSpend += p.spend; rosSales += p.sales; rosClicks += p.clicks;
                    }
                });

                // Fallback
                if(tosClicks + rosClicks === 0) {
                    rosSpend = c.spend; rosSales = c.sales; rosClicks = c.clicks;
                }

                const totalClicks = tosClicks + rosClicks;
                if(totalClicks === 0) return null;

                const tosShare = safeDiv(tosClicks, totalClicks);
                const tosCpc = safeDiv(tosSpend, tosClicks) || (safeDiv(rosSpend, rosClicks) * 1.5) || 1.0;
                const rosCpc = safeDiv(rosSpend, rosClicks) || (tosCpc / 1.5) || 0.7;
                
                // --- SIMULATION (Same logic as global but applied to local baseline) ---
                const pctChange = bidModifier / 100;
                const seasonalMult = 1 + (seasonality / 100);
                
                const logit = Math.log(Math.max(0.01, Math.min(0.99, tosShare)) / (1 - Math.max(0.01, Math.min(0.99, tosShare))));
                const sensitivity = 1.5;
                const newShareTOS = 1 / (1 + Math.exp(-(logit + (pctChange * sensitivity))));
                const newShareROS = 1 - newShareTOS;

                const trafficElasticity = bidModifier > 0 ? 0.8 : 1.1;
                const projectedClicks = totalClicks * Math.pow(1 + pctChange, trafficElasticity) * seasonalMult;

                const projTosCpc = tosCpc * (1 + (pctChange * 0.9));
                const projRosCpc = rosCpc * (1 + (pctChange * 0.7));

                const newSpend = (projectedClicks * newShareTOS * projTosCpc) + (projectedClicks * newShareROS * projRosCpc);
                
                const tosSalesPerClick = safeDiv(tosSales, tosClicks);
                const rosSalesPerClick = safeDiv(rosSales, rosClicks);

                const newSales = (projectedClicks * newShareTOS * tosSalesPerClick) + (projectedClicks * newShareROS * rosSalesPerClick);
                
                // Correct Profit Logic
                const currentProfit = (c.sales * margin) - c.spend;
                const projectedProfit = (newSales * margin) - newSpend;
                const profitDelta = projectedProfit - currentProfit;

                return {
                    id: c.campaignId,
                    name: c.name,
                    currentSpend: c.spend,
                    currentSales: c.sales,
                    currentAcos: safeDiv(c.spend, c.sales),
                    projectedSpend: newSpend,
                    projectedSales: newSales,
                    projectedAcos: safeDiv(newSpend, newSales),
                    profitDelta,
                    tosShare,
                    newShareTOS
                };
            })
            .filter(Boolean)
            .sort((a,b) => (b!.profitDelta) - (a!.profitDelta)); // Sort by Opportunity
    }, [data.spCampaigns, data.spPlacements, bidModifier, seasonality, margin]);

    // 3. Find Optimal Points
    const optimalPoints = useMemo(() => {
        if(simulationData.length === 0) return null;
        const maxProfit = [...simulationData].sort((a,b) => b.profit - a.profit)[0];
        const breakEvenAcos = margin; 
        const profitableScenarios = simulationData.filter(d => d.acos <= breakEvenAcos);
        const maxRevenue = profitableScenarios.length > 0 
            ? profitableScenarios.sort((a,b) => b.sales - a.sales)[0] 
            : simulationData[0];

        return { maxProfit, maxRevenue };
    }, [simulationData, margin]);

    const currentScenario = useMemo(() => {
        return simulationData.find(p => p.modifier === bidModifier) || simulationData.find(p => p.modifier === 0)!; 
    }, [simulationData, bidModifier]);

    const deltaSpend = currentScenario.spend - baseData.totalSpend;
    const deltaSales = currentScenario.sales - baseData.totalSales;

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            <SectionHeader 
                title="Forecasting & Bid Simulation" 
                description={`Predict outcomes using a position-aware model. Profitability is estimated based on your configured Break-Even ACOS (${formatPct(margin)}).`} 
            />

            {/* CONTROLS AREA */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Bid Modifier */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-zinc-100">
                                <Sliders size={18} className="text-brand-500" /> Global Bid Adjustment
                            </label>
                            <span className={`px-3 py-1 rounded-lg text-white font-bold ${bidModifier > 0 ? 'bg-emerald-500' : bidModifier < 0 ? 'bg-rose-500' : 'bg-slate-400'}`}>
                                {bidModifier > 0 ? '+' : ''}{bidModifier}%
                            </span>
                        </div>
                        <input 
                            type="range" min="-50" max="100" step="5" 
                            value={bidModifier} onChange={(e) => setBidModifier(parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-400"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-wider">
                            <span>-50% (Conservative)</span>
                            <span>0% (Baseline)</span>
                            <span>+100% (Aggressive)</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-zinc-100">
                                <Calendar size={18} className="text-indigo-500" /> Seasonality / Market Demand
                            </label>
                            <span className={`px-3 py-1 rounded-lg font-bold border ${seasonality > 0 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' : seasonality < 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'}`}>
                                {seasonality > 0 ? '+' : ''}{seasonality}% Traffic
                            </span>
                        </div>
                        <input 
                            type="range" min="-50" max="200" step="10" 
                            value={seasonality} onChange={(e) => setSeasonality(parseInt(e.target.value))}
                            className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-wider">
                            <span>Low Season (-50%)</span>
                            <span>Normal</span>
                            <span>Prime Day (+200%)</span>
                        </div>
                    </div>
                </div>

                {/* 2. Impact Summary */}
                <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-5 border border-slate-100 dark:border-zinc-700 flex flex-col justify-center gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase">Projected Sales</span>
                        <span className={`text-xl font-black ${deltaSales >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatCurrency(currentScenario.sales, currencySymbol)}
                            <span className="text-xs ml-1 opacity-70">({deltaSales > 0 ? '+' : ''}{formatCurrency(deltaSales, currencySymbol)})</span>
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase">Projected Spend</span>
                        <span className={`text-xl font-black ${deltaSpend <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatCurrency(currentScenario.spend, currencySymbol)}
                            <span className="text-xs ml-1 opacity-70">({deltaSpend > 0 ? '+' : ''}{formatCurrency(deltaSpend, currencySymbol)})</span>
                        </span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-zinc-700 my-1"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase">Projected ACOS</span>
                        <span className={`text-lg font-bold ${currentScenario.acos > 0.4 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-zinc-100'}`}>
                            {formatPct(currentScenario.acos)}
                        </span>
                    </div>
                    
                    {/* Position Shift Insight */}
                    <div className="mt-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed shadow-sm">
                        <div className="flex items-center gap-2 mb-1 font-bold">
                            <Crown size={12} /> Position Impact
                        </div>
                        At this bid level, your <strong>Top-of-Search share</strong> is projected to be <strong>{formatPct(currentScenario.tosShare)}</strong> (Baseline: {formatPct(baseData.tos.share)}).
                    </div>
                </div>
            </div>

            {/* RECOMMENDATION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                    onClick={() => setBidModifier(0)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${bidModifier === 0 ? 'bg-slate-800 dark:bg-zinc-700 text-white ring-2 ring-slate-800 dark:ring-zinc-600' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider opacity-70 ${bidModifier === 0 ? 'text-white' : 'text-slate-500 dark:text-zinc-400'}`}>Current Baseline</span>
                        {bidModifier === 0 && <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>}
                    </div>
                    <div className={`text-lg font-bold mb-1 ${bidModifier === 0 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(simulationData.find(p=>p.modifier===0)?.profit || 0, currencySymbol)} Est. Net Profit</div>
                    <div className={`text-xs opacity-70 ${bidModifier === 0 ? 'text-white' : 'text-slate-500 dark:text-zinc-400'}`}>0% Adjustment</div>
                </div>

                <div 
                    onClick={() => setBidModifier(optimalPoints?.maxProfit.modifier || 0)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${bidModifier === optimalPoints?.maxProfit.modifier ? 'bg-emerald-600 text-white ring-2 ring-emerald-600' : 'bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-800'}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1 ${bidModifier === optimalPoints?.maxProfit.modifier ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`}><Target size={12} /> Max Profit Goal</span>
                        {bidModifier === optimalPoints?.maxProfit.modifier && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className={`text-lg font-bold mb-1 ${bidModifier === optimalPoints?.maxProfit.modifier ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(optimalPoints?.maxProfit.profit || 0, currencySymbol)} Est. Net Profit</div>
                    <div className={`text-xs opacity-70 ${bidModifier === optimalPoints?.maxProfit.modifier ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        Recommendation: <span className="font-bold">{optimalPoints?.maxProfit.modifier > 0 ? '+' : ''}{optimalPoints?.maxProfit.modifier}% Bid</span>
                    </div>
                </div>

                <div 
                    onClick={() => setBidModifier(optimalPoints?.maxRevenue.modifier || 0)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${bidModifier === optimalPoints?.maxRevenue.modifier ? 'bg-indigo-600 text-white ring-2 ring-indigo-600' : 'bg-white dark:bg-zinc-900 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-800'}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-1 ${bidModifier === optimalPoints?.maxRevenue.modifier ? 'text-white' : 'text-indigo-700 dark:text-indigo-400'}`}><TrendingUp size={12} /> Max Growth Goal</span>
                        {bidModifier === optimalPoints?.maxRevenue.modifier && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className={`text-lg font-bold mb-1 ${bidModifier === optimalPoints?.maxRevenue.modifier ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(optimalPoints?.maxRevenue.sales || 0, currencySymbol)} Sales</div>
                    <div className={`text-xs opacity-70 ${bidModifier === optimalPoints?.maxRevenue.modifier ? 'text-white' : 'text-indigo-700 dark:text-indigo-400'}`}>
                        Recommendation: <span className="font-bold">{optimalPoints?.maxRevenue.modifier > 0 ? '+' : ''}{optimalPoints?.maxRevenue.modifier}% Bid</span>
                    </div>
                </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm h-[400px] flex flex-col">
                    <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-emerald-500"/> Profit & Revenue Projection
                    </h4>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={simulationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="modifier" tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`} tick={{fontSize: 10}} />
                                <YAxis yAxisId="left" tickFormatter={v => `${currencySymbol}${v/1000}k`} tick={{fontSize: 10}} />
                                <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{fontSize: 10}} />
                                <RechartsTooltip 
                                    formatter={(val: number, name) => name === 'ACOS' ? formatPct(val/100) : formatCurrency(val, currencySymbol)}
                                    labelFormatter={(l) => `Bid Adjustment: ${l > 0 ? '+' : ''}${l}%`}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="sales" name="Sales" stroke="#10b981" fill="url(#colorSales)" />
                                <Line yAxisId="left" type="monotone" dataKey="profit" name="Net Ad Profit" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                                <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="acos" name="ACOS" stroke="#f43f5e" strokeWidth={2} dot={false} />
                                <ReferenceLine x={bidModifier} stroke="black" strokeDasharray="3 3" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm h-[400px] flex flex-col">
                    <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <Layers size={18} className="text-indigo-500"/> Projected Placement Mix
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                        As bids increase, more traffic comes from Top of Search (Higher CVR, Higher CPC).
                    </p>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={simulationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} stackOffset="expand">
                                <XAxis dataKey="modifier" tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`} tick={{fontSize: 10}} />
                                <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{fontSize: 10}} />
                                <RechartsTooltip formatter={(val: number) => formatPct(val)} labelFormatter={(l) => `Bid Adjustment: ${l > 0 ? '+' : ''}${l}%`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Legend />
                                <Area type="monotone" dataKey="tosShare" stackId="1" stroke="#6366f1" fill="#6366f1" name="Top of Search Share" />
                                <Area type="monotone" dataKey="rosShare" stackId="1" stroke="#cbd5e1" fill="#cbd5e1" name="Rest of Search Share" />
                                <ReferenceLine x={bidModifier} stroke="black" strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* NEW: CAMPAIGN LEVEL PROJECTIONS */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold font-heading text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                            <Calculator className="text-indigo-600 w-5 h-5" /> Campaign Forecasting
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400">
                            See how the current global adjustment ({bidModifier > 0 ? '+' : ''}{bidModifier}%) affects individual campaigns. 
                            Sorted by <strong>Profit Opportunity</strong>.
                        </p>
                    </div>
                </div>

                <DataTable 
                    data={campaignProjections}
                    columns={[
                        { key: 'name', header: 'Campaign Name', sortable: true, render: (r: any) => <span className="font-bold text-slate-700 dark:text-zinc-300 text-xs">{r.name}</span> },
                        { key: 'currentSpend', header: 'Current Spend', align: 'right', sortable: true, render: (r: any) => formatCurrency(r.currentSpend, currencySymbol) },
                        { key: 'projectedSpend', header: 'Projected Spend', align: 'right', sortable: true, render: (r: any) => (
                            <div className="flex flex-col items-end">
                                <span className="font-bold text-slate-900 dark:text-zinc-100">{formatCurrency(r.projectedSpend, currencySymbol)}</span>
                                {r.projectedSpend !== r.currentSpend && (
                                    <span className={`text-[10px] font-bold px-1.5 rounded ${r.projectedSpend > r.currentSpend ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'}`}>
                                        {r.projectedSpend > r.currentSpend ? '+' : ''}{formatCurrency(r.projectedSpend - r.currentSpend, currencySymbol)}
                                    </span>
                                )}
                            </div>
                        )},
                        { key: 'currentSales', header: 'Current Sales', align: 'right', sortable: true, render: (r: any) => formatCurrency(r.currentSales, currencySymbol) },
                        { key: 'projectedSales', header: 'Projected Sales', align: 'right', sortable: true, render: (r: any) => (
                            <div className="flex flex-col items-end">
                                <span className="font-bold text-slate-900 dark:text-zinc-100">{formatCurrency(r.projectedSales, currencySymbol)}</span>
                                {r.projectedSales !== r.currentSales && (
                                    <span className={`text-[10px] font-bold px-1.5 rounded ${r.projectedSales > r.currentSales ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/30'}`}>
                                        {r.projectedSales > r.currentSales ? '+' : ''}{formatCurrency(r.projectedSales - r.currentSales, currencySymbol)}
                                    </span>
                                )}
                            </div>
                        )},
                        { key: 'currentAcos', header: 'Base ACOS', align: 'right', sortable: true, render: (r: any) => formatPct(r.currentAcos) },
                        { key: 'projectedAcos', header: 'Proj. ACOS', align: 'right', sortable: true, render: (r: any) => (
                            <span className={`font-bold ${r.projectedAcos > r.currentAcos ? 'text-rose-500' : 'text-emerald-600'}`}>{formatPct(r.projectedAcos)}</span>
                        )},
                        { key: 'profitDelta', header: 'Net Profit Impact', align: 'right', sortable: true, render: (r: any) => (
                            <div className="flex items-center justify-end gap-1">
                                {r.profitDelta > 0 ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />}
                                <span className={`font-black ${r.profitDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {r.profitDelta > 0 ? '+' : ''}{formatCurrency(r.profitDelta, currencySymbol)}
                                </span>
                            </div>
                        )},
                    ]}
                    initialSortKey="profitDelta"
                />
            </div>
        </div>
    );
};
