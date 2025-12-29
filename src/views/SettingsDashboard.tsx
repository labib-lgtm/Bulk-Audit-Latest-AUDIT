
import React, { useState, useMemo, useEffect } from 'react';
import { DashboardData, AppSettings, ProductGoal } from '../types';
import { SectionHeader, DataTable } from '../components/Widgets';
import { Settings, Save, RefreshCw, DollarSign, Target, AlertTriangle, Layers, Search, Rocket, Ban } from 'lucide-react';

interface SettingsProps {
    data: DashboardData;
    settings: AppSettings;
    onUpdateSettings: (s: AppSettings) => void;
    productGoals?: Record<string, ProductGoal>;
    onUpdateProductGoals?: (goals: Record<string, ProductGoal>) => void;
}

const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);
const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;

// Helper Component to handle local state and prevent focus loss on table re-renders
const SmartInput: React.FC<{ 
    value: number | string; 
    placeholder?: string;
    onCommit: (val: string) => void;
    className?: string;
}> = ({ value, placeholder, onCommit, className }) => {
    const [localValue, setLocalValue] = useState<string>(value.toString());

    // Sync with external prop changes only if not currently focused (simplified approach)
    // or just rely on initial mount. Here we sync when prop changes significantly to avoid stale data.
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
            e.currentTarget.blur(); // Triggers handleBlur
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

    // Prepare ASIN List for Table (Aggregates Business Report + Ad Data)
    const productList = useMemo(() => {
        const map = new Map<string, any>();
        
        // 1. From Business Report (Preferred for Titles)
        data.businessReport.forEach(r => {
            map.set(r.childAsin, {
                asin: r.childAsin,
                title: r.title || r.childAsin,
                sales: r.orderedProductSales,
                spend: 0 
            });
        });

        // 2. From SP Ads (To capture products with ads but no business report entry if any)
        data.spSkus.forEach(s => {
            if (!s.asin) return;
            if (!map.has(s.asin)) {
                map.set(s.asin, { asin: s.asin, title: `Product (${s.asin})`, sales: 0, spend: 0 });
            }
            const p = map.get(s.asin);
            p.spend += s.spend;
            if (p.sales === 0) p.sales += s.sales; // Fallback to ad sales if biz report missing
        });

        // 3. Convert to array and enrich
        let products = Array.from(map.values()).map(p => {
            const goal = productGoals[p.asin];
            return {
                ...p,
                acos: safeDiv(p.spend, p.sales),
                currentGoal: goal?.targetAcos || '',
                strategy: goal?.strategy || 'Profit'
            };
        });

        // 4. Filter
        if (productSearch) {
            const term = productSearch.toLowerCase();
            products = products.filter(p => p.asin.toLowerCase().includes(term) || p.title.toLowerCase().includes(term));
        }

        // 5. Sort by Sales descending
        return products.sort((a,b) => b.sales - a.sales);
    }, [data, productGoals, productSearch]);

    const handleChange = (field: keyof AppSettings, value: string | number) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleProductGoalChange = (asin: string, val: string, field: 'targetAcos' | 'strategy') => {
        if (!onUpdateProductGoals) return;
        
        const newGoals = { ...productGoals };
        const existing = newGoals[asin] || { asin, targetAcos: settings.targetAcos, strategy: 'Profit' };

        if (field === 'targetAcos') {
            const numVal = parseFloat(val);
            if (isNaN(numVal) || val === '') {
                delete newGoals[asin]; // Revert to global if cleared
            } else {
                newGoals[asin] = { ...existing, targetAcos: numVal / 100 };
            }
        } else if (field === 'strategy') {
             // Optional: Preset ACOS based on strategy
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
                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-brand-500 hover:text-black transition-all shadow-lg"
                >
                    {saved ? <span className="flex items-center gap-2">Settings Saved!</span> : <><Save size={16} /> Save Changes</>}
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Global Goals */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm h-full">
                    <div className="px-6 py-4 bg-muted border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-foreground flex items-center gap-2"><Target size={18} className="text-brand-600"/> Global Account Goals</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">Default Target ACOS (%)</label>
                            <p className="text-xs text-muted-foreground mb-3">Fallback target for products without specific overrides.</p>
                            <div className="relative max-w-xs">
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0.01" 
                                    max="1.00"
                                    value={localSettings.targetAcos}
                                    onChange={(e) => handleChange('targetAcos', parseFloat(e.target.value))}
                                    className="w-full pl-4 pr-12 py-2.5 bg-card border border-border rounded-xl focus:border-brand-500 focus:ring-0 font-bold text-foreground"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">Break-Even ACOS (%)</label>
                            <div className="relative max-w-xs">
                                <input 
                                    type="number" step="0.01" min="0.01" max="1.00"
                                    value={localSettings.breakEvenAcos}
                                    onChange={(e) => handleChange('breakEvenAcos', parseFloat(e.target.value))}
                                    className="w-full pl-4 pr-12 py-2.5 bg-card border border-border rounded-xl focus:border-brand-500 focus:ring-0 font-bold text-foreground"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Audit Thresholds */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm h-full">
                    <div className="px-6 py-4 bg-muted border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-foreground flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500"/> Audit Thresholds</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">Wasted Spend Threshold</label>
                            <div className="relative max-w-xs">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{localSettings.currencySymbol}</span>
                                <input 
                                    type="number" step="1"
                                    value={localSettings.minSpendThreshold}
                                    onChange={(e) => handleChange('minSpendThreshold', parseInt(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:border-brand-500 focus:ring-0 font-bold text-foreground"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">Click Threshold (No Sales)</label>
                            <div className="relative max-w-xs">
                                <input 
                                    type="number" step="1"
                                    value={localSettings.minClickThreshold}
                                    onChange={(e) => handleChange('minClickThreshold', parseInt(e.target.value))}
                                    className="w-full pl-4 pr-4 py-2.5 bg-card border border-border rounded-xl focus:border-brand-500 focus:ring-0 font-bold text-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Product Strategy Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-muted border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <Layers size={18} className="text-indigo-500"/> Product-Level Strategy Overrides
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Set aggressive targets for launches or conservative targets for profit cows.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search ASIN or Title..." 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-lg bg-card text-foreground focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>
                </div>
                <div className="p-4">
                    <DataTable 
                        data={productList}
                        columns={[
                            { key: 'title', header: 'Product', sortable: true, render: (r: any) => (
                                <div>
                                    <div className="font-bold text-foreground text-xs truncate max-w-[250px]">{r.title}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{r.asin}</div>
                                </div>
                            )},
                            { key: 'sales', header: 'Total Sales', align: 'right', sortable: true, render: (r: any) => `$${r.sales.toLocaleString()}` },
                            { key: 'spend', header: 'Ad Spend', align: 'right', sortable: true, render: (r: any) => `$${r.spend.toLocaleString()}` },
                            { key: 'acos', header: 'Real ACOS', align: 'right', sortable: true, render: (r: any) => (
                                <span className={`font-bold ${r.acos > (r.currentGoal || localSettings.targetAcos) ? 'text-rose-500' : 'text-emerald-600'}`}>{formatPct(r.acos)}</span>
                            )},
                            { key: 'strategy', header: 'Strategy', render: (r: any) => (
                                <div className="flex gap-1">
                                    {['Launch', 'Profit', 'Liquidate'].map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => handleProductGoalChange(r.asin, s, 'strategy')}
                                            title={s}
                                            className={`p-1.5 rounded-md border text-[10px] font-bold uppercase transition-all ${
                                                r.currentGoal && r.strategy === s 
                                                ? (s === 'Launch' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : s === 'Profit' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30')
                                                : 'bg-muted text-muted-foreground border-border hover:border-foreground/30'
                                            }`}
                                        >
                                            {s === 'Launch' && <Rocket size={12}/>}
                                            {s === 'Profit' && <DollarSign size={12}/>}
                                            {s === 'Liquidate' && <Ban size={12}/>}
                                        </button>
                                    ))}
                                </div>
                            )},
                            { key: 'currentGoal', header: 'Target ACOS %', align: 'right', render: (r: any) => (
                                <div className="flex justify-end">
                                    <div className="relative w-24">
                                        <SmartInput 
                                            value={r.currentGoal ? (r.currentGoal * 100) : ''}
                                            placeholder={(localSettings.targetAcos * 100).toFixed(0)}
                                            onCommit={(val) => handleProductGoalChange(r.asin, val, 'targetAcos')}
                                            className={`w-full text-right pr-6 pl-2 py-1.5 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none ${r.currentGoal ? 'border-brand-500 bg-brand-500/10 text-foreground' : 'border-border bg-muted text-muted-foreground'}`}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-bold">%</span>
                                    </div>
                                </div>
                            )}
                        ]}
                        initialSortKey="sales"
                    />
                </div>
            </div>
        </div>
    )
};
