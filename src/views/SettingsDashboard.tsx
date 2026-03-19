
import React, { useState, useMemo, useEffect } from 'react';
import { DashboardData, AppSettings, ProductGoal, AttributionModel, Currency, CURRENCY_SYMBOLS } from '../types';
import { SectionHeader, DataTable } from '../components/Widgets';
// Fix: Added missing icon imports from lucide-react
import { Settings, Save, DollarSign, Target, Globe, Rocket, Ban, Scale, AlertTriangle, Search } from 'lucide-react';

interface SettingsProps {
    data: DashboardData;
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    productGoals?: Record<string, ProductGoal>;
    onUpdateProductGoals?: (goals: Record<string, ProductGoal>) => void;
    userRole?: string;
}

const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

const SmartInput: React.FC<{ 
    value: number | string; 
    placeholder?: string;
    onCommit: (val: string) => void;
    className?: string;
}> = ({ value, placeholder, onCommit, className }) => {
    const [localValue, setLocalValue] = useState<string>(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleBlur = () => {
        if (localValue !== value.toString()) {
            onCommit(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); 
        }
    };

    return (
        <input 
            type="number" 
            placeholder={placeholder}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={className}
        />
    );
};

export const SettingsDashboard: React.FC<SettingsProps> = ({ 
    data, 
    settings, 
    onUpdateSettings,
    productGoals = {},
    onUpdateProductGoals
}) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [productSearch, setProductSearch] = useState('');
    const [saved, setSaved] = useState(false);

    const productList = useMemo(() => {
        const map = new Map<string, any>();
        
        data.businessReport.forEach(r => {
            map.set(r.childAsin, {
                asin: r.childAsin,
                title: r.title || r.childAsin,
                sales: r.orderedProductSales,
                spend: 0 
            });
        });

        data.spSkus.forEach(s => {
            if (!s.asin) return;
            if (!map.has(s.asin)) {
                map.set(s.asin, { asin: s.asin, title: `Product (${s.asin})`, sales: 0, spend: 0 });
            }
            const p = map.get(s.asin);
            p.spend += s.spend;
            if (p.sales === 0) p.sales += s.sales; 
        });

        let products = Array.from(map.values()).map(p => {
            const goal = productGoals[p.asin];
            return {
                ...p,
                acos: safeDiv(p.spend, p.sales),
                currentGoal: goal?.targetAcos || '',
                strategy: goal?.strategy || 'Profit'
            };
        });

        if (productSearch) {
            const term = productSearch.toLowerCase();
            products = products.filter(p => p.asin.toLowerCase().includes(term) || p.title.toLowerCase().includes(term));
        }

        return products.sort((a,b) => b.sales - a.sales);
    }, [data, productGoals, productSearch]);

    const handleChange = (field: keyof AppSettings, value: any) => {
        setLocalSettings(prev => {
            const next = { ...prev, [field]: value };
            // Auto-update symbol if code changed
            if (field === 'currencyCode') {
                next.currencySymbol = CURRENCY_SYMBOLS[value as Currency] || '$';
            }
            return next;
        });
        setSaved(false);
    };

    const handleProductGoalChange = (asin: string, val: string, field: 'targetAcos' | 'strategy') => {
        if (!onUpdateProductGoals) return;
        
        const newGoals = { ...productGoals };
        const existing = newGoals[asin] || { asin, targetAcos: settings.targetAcos, strategy: 'Profit' };

        if (field === 'targetAcos') {
            const numVal = parseFloat(val);
            if (isNaN(numVal) || val === '') {
                delete newGoals[asin]; 
            } else {
                newGoals[asin] = { ...existing, targetAcos: numVal / 100 };
            }
        } else if (field === 'strategy') {
             let presetAcos = existing.targetAcos;
             if (val === 'Launch') presetAcos = 0.60;
             if (val === 'Profit') presetAcos = 0.30;
             if (val === 'Liquidate') presetAcos = 1.00;
             
             newGoals[asin] = { ...existing, strategy: val as any, targetAcos: presetAcos };
        }

        onUpdateProductGoals(newGoals);
        setSaved(false);
    };

    const handleSave = () => {
        onUpdateSettings(localSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <SectionHeader title="Strategy Configuration" description="Configure global profitability thresholds and individual product goals." />
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-brand-500 hover:text-black dark:hover:bg-brand-400 transition-all shadow-lg"
                >
                    {saved ? <span className="flex items-center gap-2">Settings Saved!</span> : <><Save size={16} /> Save Changes</>}
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm h-full">
                    <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2"><Target size={18} className="text-brand-600 dark:text-brand-400"/> Global Account Goals</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Default Target ACOS (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" step="0.01" 
                                        value={localSettings.targetAcos * 100}
                                        onChange={(e) => handleChange('targetAcos', parseFloat(e.target.value) / 100)}
                                        className="w-full pl-4 pr-12 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-brand-500 focus:ring-0 font-bold text-slate-900 dark:text-white"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">Break-Even ACOS (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" step="0.01" 
                                        value={localSettings.breakEvenAcos * 100}
                                        onChange={(e) => handleChange('breakEvenAcos', parseFloat(e.target.value) / 100)}
                                        className="w-full pl-4 pr-12 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:border-brand-500 focus:ring-0 font-bold text-slate-900 dark:text-white"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-bold">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Marketplace Currency Selector */}
                        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                             <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                                <Globe size={16} className="text-indigo-500" /> Marketplace & Currency
                             </label>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.values(Currency).map(curr => (
                                    <button
                                        key={curr}
                                        onClick={() => handleChange('currencyCode', curr)}
                                        className={`px-3 py-2 rounded-lg border text-[10px] font-black transition-all ${
                                            localSettings.currencyCode === curr
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' 
                                            : 'bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-indigo-300'
                                        }`}
                                    >
                                        {curr} ({CURRENCY_SYMBOLS[curr]})
                                    </button>
                                ))}
                             </div>
                             <p className="text-[10px] text-slate-400 mt-2 italic">Currency is usually auto-detected from file headers but can be manually corrected here.</p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                             <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2 flex items-center gap-2">
                                <Scale size={16} className="text-violet-500" /> Attribution Model
                             </label>
                             <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl w-full">
                                {(['Standard', 'Conservative', 'Aggressive'] as AttributionModel[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => handleChange('attributionModel', m)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${localSettings.attributionModel === m ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                             </div>
                             <p className="text-[10px] text-slate-400 mt-2">Adjusts how SB/SD sales are weighted relative to SP. Standard = 100%.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Waste Thresholds */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
                            <h3 className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2"><AlertTriangle size={18} className="text-rose-500"/> Waste Thresholds</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">Min Spend for "Bleeder" Flag</span>
                                <div className="relative w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{localSettings.currencySymbol}</span>
                                    <input 
                                        type="number" 
                                        value={localSettings.minSpendThreshold}
                                        onChange={(e) => handleChange('minSpendThreshold', parseFloat(e.target.value))}
                                        className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-bold text-right"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600 dark:text-zinc-400">Min Clicks for Stat. Significance</span>
                                <div className="w-32">
                                    <input 
                                        type="number" 
                                        value={localSettings.minClickThreshold}
                                        onChange={(e) => handleChange('minClickThreshold', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm font-bold text-right"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2"><Rocket size={18} className="text-brand-600 dark:text-brand-400"/> Individual Product Strategy</h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search ASIN or Title..." 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                        />
                    </div>
                </div>
                <div className="p-0">
                    <DataTable 
                        data={productList}
                        columns={[
                            { key: 'asin', header: 'ASIN', render: (r: any) => <span className="font-mono text-[10px] font-bold text-slate-500">{r.asin}</span>, sortable: true },
                            { key: 'title', header: 'Product Name', sortable: true, render: (r: any) => <span className="text-xs truncate max-w-[200px] block font-bold text-slate-800 dark:text-zinc-100">{r.title}</span> },
                            { key: 'sales', header: 'Total Sales', align: 'right', sortable: true, render: (r: any) => `${localSettings.currencySymbol}${r.sales.toLocaleString()}` },
                            { key: 'acos', header: 'Ad ACOS', align: 'right', sortable: true, render: (r: any) => <span className={r.acos > 0.4 ? 'text-rose-500' : 'text-slate-600'}>{safeDiv(r.spend, r.sales) > 0 ? (safeDiv(r.spend, r.sales) * 100).toFixed(1) + '%' : '-'}</span> },
                            { key: 'strategy', header: 'Strategy Preset', align: 'center', render: (r: any) => (
                                <div className="flex items-center gap-1">
                                    {(['Launch', 'Profit', 'Liquidate'] as const).map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => handleProductGoalChange(r.asin, s, 'strategy')}
                                            className={`px-2 py-1 rounded text-[9px] font-black uppercase border transition-all ${r.strategy === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )},
                            { key: 'currentGoal', header: 'Target ACOS (%)', align: 'right', render: (r: any) => (
                                <div className="relative w-24 ml-auto group">
                                    <SmartInput 
                                        value={r.currentGoal ? Math.round(r.currentGoal * 100) : ''}
                                        placeholder={(localSettings.targetAcos * 100).toString()}
                                        onCommit={(val) => handleProductGoalChange(r.asin, val, 'targetAcos')}
                                        className="w-full pl-3 pr-6 py-1 text-right text-xs font-black bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded outline-none focus:border-brand-500 transition-all"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                                </div>
                            )},
                            { key: 'actions', header: '', align: 'right', render: (r: any) => r.currentGoal && (
                                <button 
                                    onClick={() => handleProductGoalChange(r.asin, '', 'targetAcos')}
                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                    title="Reset to Global"
                                >
                                    <Ban size={14} />
                                </button>
                            )}
                        ]}
                        initialSortKey="sales"
                    />
                </div>
            </div>
        </div>
    );
};
