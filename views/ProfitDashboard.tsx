
import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
// Fix: Added UserRole to imports
import { DashboardData, ProductCost, ProfitSettings, ProductGoal, UserRole } from '../types';
import { SectionHeader, MetricCard, DataTable } from '../components/Widgets';
import { DollarSign, Upload, Save, Settings as SettingsIcon, TrendingUp, Calculator, Target, FileDown, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const formatCurrency = (val: number, sym: string) => `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatExactCurrency = (val: number, sym: string) => `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;
const formatInt = (val: number) => Math.round(val).toLocaleString();
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

// Component for performant input (commits only on blur)
const CostInput = ({ value, onChange, placeholder }: { value: number, onChange: (val: string) => void, placeholder?: string }) => {
    const [local, setLocal] = useState(value?.toString() || '');
    
    // Sync external changes
    useEffect(() => {
        if (value !== undefined && value !== null) setLocal(value.toString());
    }, [value]);
    
    const commit = () => {
        const parsed = parseFloat(local);
        if (parsed !== value && local !== '') {
            onChange(local);
        }
    };

    return (
        <input 
            type="number" 
            value={local} 
            placeholder={placeholder || "0.00"}
            onChange={e => setLocal(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-right focus:ring-1 focus:ring-brand-500 outline-none"
        />
    );
}

interface ProfitProps {
    data: DashboardData;
    currencySymbol: string;
    costs: Record<string, ProductCost>;
    profitSettings: ProfitSettings;
    onUpdateCosts: (costs: Record<string, ProductCost>) => void;
    onUpdateProfitSettings: (settings: ProfitSettings) => void;
    productGoals?: Record<string, ProductGoal>; // Optional dependency if passed
    settings?: any; // AppSettings
    // Fix: Added userRole to resolve type error in App.tsx
    userRole?: UserRole;
}

export const ProfitDashboard: React.FC<ProfitProps> = ({ 
    data, currencySymbol, costs, profitSettings, onUpdateCosts, onUpdateProfitSettings, productGoals = {}, settings = { targetAcos: 0.30 }, userRole
}) => {
    const [view, setView] = useState<'analysis' | 'bids' | 'config'>('analysis');
    
    // --- Data Calculation Engine ---
    const profitData = useMemo(() => {
        // 1. Map Ad Metrics to ASINs (SP only primarily)
        const adMap = new Map<string, { spend: number, clicks: number, orders: number }>();
        data.spSkus.forEach(s => {
            if (s.asin) {
                const exist = adMap.get(s.asin) || { spend: 0, clicks: 0, orders: 0 };
                exist.spend += s.spend;
                exist.clicks += s.clicks;
                exist.orders += s.orders;
                adMap.set(s.asin, exist);
            }
        });

        // Account Average CVR for Low Confidence Fallback
        const totalAdOrders = data.spCampaigns.reduce((s, c) => s + c.orders, 0);
        const totalAdClicks = data.spCampaigns.reduce((s, c) => s + c.clicks, 0);
        const accountCvr = safeDiv(totalAdOrders, totalAdClicks);

        // 2. Process Business Report
        let totalGrossSales = 0;
        let totalUnits = 0;
        let totalCogs = 0;
        let totalFbaFees = 0;
        let totalReferralFees = 0;
        let totalAdSpend = 0;
        
        const rows = data.businessReport.map(r => {
            const asin = r.childAsin;
            const cost = costs[asin] || { cogs: 0, fbaFee: 0, referralFeePct: profitSettings.defaultReferralFee };
            
            const grossSales = r.orderedProductSales;
            const units = r.unitsOrdered;
            const adStats = adMap.get(asin) || { spend: 0, clicks: 0, orders: 0 };
            const adSpend = adStats.spend;

            // Calculations
            const returnsValue = grossSales * profitSettings.returnsProvision;
            const netSales = grossSales - returnsValue;
            
            const totalItemCogs = units * cost.cogs;
            const totalItemFba = units * cost.fbaFee;
            const totalItemRef = netSales * cost.referralFeePct;
            
            // Contribution Margin (Pre-Ad)
            const preAdMargin = netSales - totalItemCogs - totalItemFba - totalItemRef;
            const contributionMargin = preAdMargin - adSpend;
            
            // Aggregates
            totalGrossSales += grossSales;
            totalUnits += units;
            totalCogs += totalItemCogs;
            totalFbaFees += totalItemFba;
            totalReferralFees += totalItemRef;
            totalAdSpend += adSpend;

            // --- Bid Optimization Metrics ---
            const asp = safeDiv(grossSales, units);
            const breakEvenAcos = safeDiv(preAdMargin, grossSales); // % of revenue available for ads before loss
            
            const asinCvr = safeDiv(adStats.orders, adStats.clicks);
            const confidence = adStats.clicks > 20 ? 'High' : (adStats.clicks > 5 ? 'Low' : 'None');
            const usedCvr = confidence === 'None' ? accountCvr : asinCvr;
            
            const targetAcos = productGoals[asin]?.targetAcos || settings.targetAcos;
            const targetCpc = asp * targetAcos * usedCvr;
            const currentCpc = safeDiv(adSpend, adStats.clicks);
            const cpcDelta = targetCpc - currentCpc;

            return {
                asin: asin,
                title: r.title,
                units,
                grossSales,
                returnsValue,
                netSales,
                cogs: totalItemCogs,
                fbaFees: totalItemFba,
                referralFees: totalItemRef,
                adSpend,
                adClicks: adStats.clicks,
                adOrders: adStats.orders,
                contributionMargin,
                netProfit: contributionMargin,
                marginPct: safeDiv(contributionMargin, netSales),
                roi: safeDiv(contributionMargin, adSpend + totalItemCogs + totalItemFba + totalItemRef),
                unitCogs: cost.cogs,
                unitFba: cost.fbaFee,
                
                // Bid Ops
                asp,
                breakEvenAcos,
                targetAcos,
                asinCvr,
                usedCvr,
                confidence,
                targetCpc,
                currentCpc,
                cpcDelta,
                currentAcos: safeDiv(adSpend, adStats.spend ? (adStats.orders * asp) : 0) // Approx ACOS based on Ad Sales derived from Orders * ASP
            };
        });

        // 3. Add Unattributed Ad Spend (SB/SD/Unmapped SP)
        const totalAccountSpend = data.spCampaigns.reduce((s,c)=>s+c.spend,0) + 
                                  data.sbCampaigns.reduce((s,c)=>s+c.spend,0) + 
                                  data.sdCampaigns.reduce((s,c)=>s+c.spend,0);
        
        const unattributedSpend = Math.max(0, totalAccountSpend - totalAdSpend);
        const finalNetProfit = (totalGrossSales - (totalGrossSales * profitSettings.returnsProvision) - totalCogs - totalFbaFees - totalReferralFees - totalAdSpend - unattributedSpend);

        return {
            rows,
            summary: {
                grossSales: totalGrossSales,
                returns: totalGrossSales * profitSettings.returnsProvision,
                netSales: totalGrossSales - (totalGrossSales * profitSettings.returnsProvision),
                cogs: totalCogs,
                fbaFees: totalFbaFees,
                referralFees: totalReferralFees,
                adSpend: totalAdSpend,
                unattributedSpend,
                totalSpend: totalAccountSpend,
                contributionMargin: finalNetProfit,
                netProfit: finalNetProfit
            }
        };
    }, [data, costs, profitSettings, productGoals, settings]);

    // --- Waterfall Data Prep ---
    const waterfallData = useMemo(() => {
        const s = profitData.summary;
        return [
            { name: 'Gross Sales', value: s.grossSales, type: 'positive' },
            { name: 'Returns', value: -s.returns, type: 'negative' },
            { name: 'COGS', value: -s.cogs, type: 'negative' },
            { name: 'Amazon Fees', value: -(s.fbaFees + s.referralFees), type: 'negative' },
            { name: 'Ad Spend', value: -s.totalSpend, type: 'negative' },
            { name: 'Net Profit', value: s.netProfit, type: 'total' }
        ];
    }, [profitData]);

    // --- Handlers ---
    const handleCostChange = (asin: string, field: keyof ProductCost, val: string) => {
        const numVal = parseFloat(val) || 0;
        const existing = costs[asin] || { asin, cogs: 0, fbaFee: 0, referralFeePct: profitSettings.defaultReferralFee };
        
        onUpdateCosts({
            ...costs,
            [asin]: { ...existing, [field]: numVal }
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            
            const newCosts = { ...costs };
            let count = 0;
            data.forEach(row => {
                const asin = row['ASIN'] || row['asin'];
                if (asin) {
                    newCosts[asin] = {
                        asin,
                        cogs: parseFloat(row['COGS'] || row['cogs'] || 0),
                        fbaFee: parseFloat(row['FBA Fee'] || row['fba_fee'] || 0),
                        referralFeePct: parseFloat(row['Referral %'] || row['referral_pct'] || profitSettings.defaultReferralFee),
                        shipping: 0,
                        miscCost: 0
                    };
                    count++;
                }
            });
            onUpdateCosts(newCosts);
            alert(`Updated costs for ${count} ASINs`);
        };
        reader.readAsBinaryString(file);
    };

    const handleExportBids = () => {
        const rows = profitData.rows.filter(r => r.cpcDelta !== 0).map(r => ({
            'ASIN': r.asin,
            'Title': r.title,
            'Target ACOS': r.targetAcos,
            'Break Even ACOS': r.breakEvenAcos,
            'Estimated CVR': r.usedCvr,
            'CVR Confidence': r.confidence,
            'Target CPC': r.targetCpc,
            'Current CPC': r.currentCpc,
            'CPC Delta': r.cpcDelta,
            'Recommendation': r.cpcDelta < 0 ? 'Decrease Bids' : 'Increase Bids'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bid_Recommendations");
        XLSX.writeFile(wb, "Lynx_Bid_Recommendations.xlsx");
    };

    if (view === 'config') {
        // Configuration View (Same as before)
        return (
            <div className="space-y-6 animate-fadeIn pb-24">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <SectionHeader title="Profit Configuration" description="Manage Unit Economics and Global Assumptions." />
                    <button 
                        onClick={() => setView('analysis')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 shadow-lg"
                    >
                        <Calculator size={16} /> View Analysis
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Global Settings */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 h-fit">
                        <h4 className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2 mb-6">
                            <SettingsIcon className="w-5 h-5 text-indigo-500" /> Global Assumptions
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Default Referral Fee</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" step="0.01" 
                                        value={profitSettings.defaultReferralFee}
                                        onChange={(e) => onUpdateProfitSettings({...profitSettings, defaultReferralFee: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-bold" 
                                    />
                                    <span className="text-sm font-bold">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1">Estimated Returns Rate</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" step="0.01" 
                                        value={profitSettings.returnsProvision}
                                        onChange={(e) => onUpdateProfitSettings({...profitSettings, returnsProvision: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-bold" 
                                    />
                                    <span className="text-sm font-bold">%</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-sm font-bold text-slate-600 dark:text-zinc-300 justify-center">
                                    <Upload size={16} /> Upload CSV
                                    <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" />
                                </label>
                                <p className="text-[10px] text-slate-400 mt-2 text-center">Columns: ASIN, COGS, FBA Fee, Referral %</p>
                            </div>
                        </div>
                    </div>

                    {/* Cost Grid */}
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
                            <h4 className="font-bold text-slate-800 dark:text-zinc-100">Unit Economics Manager</h4>
                        </div>
                        <div className="flex-1 overflow-auto max-h-[600px] p-0">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-800 sticky top-0 z-10 font-bold text-slate-500 dark:text-zinc-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">ASIN</th>
                                        <th className="px-4 py-3">Title</th>
                                        <th className="px-4 py-3 w-32">COGS ({currencySymbol})</th>
                                        <th className="px-4 py-3 w-32">FBA Fee ({currencySymbol})</th>
                                        <th className="px-4 py-3 w-32">Referral %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                    {profitData.rows.map(r => (
                                        <tr key={r.asin} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                                            <td className="px-4 py-2 font-mono text-slate-600 dark:text-zinc-400">{r.asin}</td>
                                            <td className="px-4 py-2 text-slate-800 dark:text-zinc-200 truncate max-w-[200px]" title={r.title}>{r.title}</td>
                                            <td className="px-4 py-1">
                                                <CostInput 
                                                    value={costs[r.asin]?.cogs || 0}
                                                    onChange={val => handleCostChange(r.asin, 'cogs', val)}
                                                />
                                            </td>
                                            <td className="px-4 py-1">
                                                <CostInput 
                                                    value={costs[r.asin]?.fbaFee || 0}
                                                    onChange={val => handleCostChange(r.asin, 'fbaFee', val)}
                                                />
                                            </td>
                                            <td className="px-4 py-1">
                                                <CostInput 
                                                    value={costs[r.asin]?.referralFeePct || profitSettings.defaultReferralFee}
                                                    onChange={val => handleCostChange(r.asin, 'referralFeePct', val)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <SectionHeader title="Profit & Unit Economics" description="Analyze net profitability after COGS, Fees, and Ad Spend." />
                
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setView('analysis')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${view === 'analysis' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Waterfall Analysis
                    </button>
                    <button 
                        onClick={() => setView('bids')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${view === 'bids' ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Bid Optimization
                    </button>
                    <button 
                        onClick={() => setView('config')}
                        // Fix: Cast view to string to avoid comparison error with narrowed union type
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${(view as string) === 'config' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Cost Settings
                    </button>
                </div>
            </div>

            {/* Top Level Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                    title="Gross Sales" 
                    value={formatCurrency(profitData.summary.grossSales, currencySymbol)} 
                    subValue={`${formatInt(profitData.rows.reduce((s,r)=>s+r.units,0))} Units`}
                />
                <MetricCard 
                    title="Net Profit" 
                    value={formatCurrency(profitData.summary.netProfit, currencySymbol)} 
                    color={profitData.summary.netProfit > 0 ? 'green' : 'red'}
                    subValue="After Ads & COGS"
                />
                <MetricCard 
                    title="Net Margin" 
                    value={formatPct(safeDiv(profitData.summary.netProfit, profitData.summary.netSales))} 
                    // Fix: Changed 'orange' to 'red' to satisfy allowed MetricCard color values
                    color={safeDiv(profitData.summary.netProfit, profitData.summary.netSales) > 0.15 ? 'blue' : 'red'}
                    subValue={`Target: 15%+`}
                />
                <MetricCard 
                    title="Total Ad Spend" 
                    value={formatCurrency(profitData.summary.totalSpend, currencySymbol)} 
                    color="indigo"
                    subValue={`TACOS: ${formatPct(safeDiv(profitData.summary.totalSpend, profitData.summary.grossSales))}`}
                />
            </div>

            {/* WATERFALL VIEW */}
            {view === 'analysis' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Waterfall Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Profit Waterfall
                            </h4>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={waterfallData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{fontSize: 11}} interval={0} />
                                        <YAxis tickFormatter={(val) => `${currencySymbol}${val/1000}k`} />
                                        <RechartsTooltip 
                                            formatter={(value: number) => formatCurrency(value, currencySymbol)} 
                                            cursor={{fill: 'transparent'}}
                                        />
                                        <ReferenceLine y={0} stroke="#000" />
                                        <Bar dataKey="value">
                                            {waterfallData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.type === 'positive' ? '#10b981' : entry.type === 'negative' ? '#f43f5e' : '#6366f1'} 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-center">
                            <h4 className="font-bold text-slate-800 dark:text-zinc-100 mb-6 text-center">Cost Structure</h4>
                            <div className="space-y-4">
                                {[
                                    { label: 'COGS', val: profitData.summary.cogs, color: 'bg-rose-500' },
                                    { label: 'FBA Fees', val: profitData.summary.fbaFees, color: 'bg-rose-400' },
                                    { label: 'Referral Fees', val: profitData.summary.referralFees, color: 'bg-rose-300' },
                                    { label: 'Ad Spend', val: profitData.summary.totalSpend, color: 'bg-indigo-500' },
                                    { label: 'Net Profit', val: profitData.summary.netProfit, color: 'bg-emerald-500' }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-slate-600 dark:text-zinc-300">
                                            <span>{item.label}</span>
                                            <span>{formatPct(safeDiv(item.val, profitData.summary.grossSales))}</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color}`} style={{ width: `${Math.min(100, Math.abs(safeDiv(item.val, profitData.summary.grossSales) * 100))}%` }}></div>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-400 font-mono mt-0.5">{formatCurrency(item.val, currencySymbol)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Profit Matrix */}
                    <DataTable 
                        data={profitData.rows}
                        initialSortKey="netProfit"
                        columns={[
                            { key: 'title', header: 'Product', sortable: true, render: (r: any) => (
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-zinc-200 text-xs truncate max-w-[200px]">{r.title}</div>
                                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{r.asin}</div>
                                </div>
                            )},
                            { key: 'grossSales', header: 'Sales', align: 'right', sortable: true, render: (r: any) => formatCurrency(r.grossSales, currencySymbol) },
                            { key: 'cogs', header: 'COGS', align: 'right', sortable: true, render: (r: any) => <span className="text-slate-500">{formatCurrency(r.cogs, currencySymbol)}</span> },
                            { key: 'fbaFees', header: 'Fees', align: 'right', sortable: true, render: (r: any) => <span className="text-slate-500">{formatCurrency(r.fbaFees + r.referralFees, currencySymbol)}</span> },
                            { key: 'adSpend', header: 'Ad Spend', align: 'right', sortable: true, render: (r: any) => formatCurrency(r.adSpend, currencySymbol) },
                            { key: 'netProfit', header: 'Net Profit', align: 'right', sortable: true, render: (r: any) => <span className={`font-bold ${r.netProfit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(r.netProfit, currencySymbol)}</span> },
                            { key: 'marginPct', header: 'Net Margin', align: 'right', sortable: true, render: (r: any) => <span className={`font-bold ${r.marginPct > 0.15 ? 'text-emerald-600' : r.marginPct > 0 ? 'text-amber-500' : 'text-rose-600'}`}>{formatPct(r.marginPct)}</span> },
                            { key: 'roi', header: 'ROI', align: 'right', sortable: true, render: (r: any) => formatPct(r.roi) },
                        ]}
                    />
                </>
            )}

            {/* BIDS VIEW */}
            {view === 'bids' && (
                <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                <Target className="w-5 h-5" /> Target CPC & Break-Even Analysis
                            </h3>
                            <p className="text-sm text-indigo-800 dark:text-indigo-400 mt-1">
                                Recommendations are based on your <strong>Unit Economics</strong> and <strong>Target ACOS</strong> settings. 
                                Target CPC = ASP × Target ACOS × CVR.
                            </p>
                        </div>
                        <button onClick={handleExportBids} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 dark:shadow-none transition-all">
                            <FileDown size={16} /> Export Bid Recommendations
                        </button>
                    </div>

                    <DataTable 
                        data={profitData.rows}
                        initialSortKey="cpcDelta"
                        columns={[
                            { key: 'title', header: 'Product', sortable: true, render: (r: any) => (
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-zinc-200 text-xs truncate max-w-[200px]">{r.title}</div>
                                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{r.asin}</div>
                                </div>
                            )},
                            { key: 'breakEvenAcos', header: 'Break-Even', align: 'right', sortable: true, render: (r: any) => <span className="font-mono">{formatPct(r.breakEvenAcos)}</span> },
                            { key: 'targetAcos', header: 'Target ACOS', align: 'right', sortable: true, render: (r: any) => <span className="font-bold text-slate-600 dark:text-zinc-300">{formatPct(r.targetAcos)}</span> },
                            { key: 'currentAcos', header: 'Current ACOS', align: 'right', sortable: true, render: (r: any) => <span className={r.currentAcos > r.targetAcos ? 'text-rose-600 font-bold' : 'text-emerald-600'}>{formatPct(r.currentAcos)}</span> },
                            { key: 'usedCvr', header: 'CVR', align: 'right', sortable: true, render: (r: any) => (
                                <div className="flex flex-col items-end">
                                    <span>{formatPct(r.usedCvr)}</span>
                                    {r.confidence !== 'High' && <span className="text-[9px] text-amber-500 uppercase font-bold flex items-center gap-1"><AlertCircle size={8}/> {r.confidence} Conf.</span>}
                                </div>
                            )},
                            { key: 'currentCpc', header: 'Actual CPC', align: 'right', sortable: true, render: (r: any) => formatExactCurrency(r.currentCpc, currencySymbol) },
                            { key: 'targetCpc', header: 'Target CPC', align: 'right', sortable: true, render: (r: any) => <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatExactCurrency(r.targetCpc, currencySymbol)}</span> },
                            { key: 'cpcDelta', header: 'Delta', align: 'right', sortable: true, render: (r: any) => (
                                <span className={`font-bold px-2 py-1 rounded text-xs ${r.cpcDelta < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'}`}>
                                    {r.cpcDelta > 0 ? '+' : ''}{formatExactCurrency(r.cpcDelta, currencySymbol)}
                                </span>
                            )},
                        ]}
                    />
                </div>
            )}
        </div>
    );
};
