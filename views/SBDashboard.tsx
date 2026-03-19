
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DashboardData } from '../types';
import { MetricCard, SectionHeader, DataTable } from '../components/Widgets';
import { LayoutGrid, Target, PieChart as PieIcon, Monitor, Search, Filter, ChevronDown, X, Calculator, ArrowRight, TrendingUp, FileDown } from 'lucide-react';

const formatCurrency = (val: number, sym: string) => `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPct = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${(val * 100).toFixed(1)}%`;
};
const formatInt = (val: number) => Math.round(val).toLocaleString();
const formatNum = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

const MATCH_TYPE_COLORS: Record<string, string> = {
    // HSA (Blue/Cyan)
    '(HSA) Exact': '#2563eb', 
    '(HSA) Phrase': '#60a5fa', 
    '(HSA) Broad': '#93c5fd', 
    '(HSA) Product Targeting': '#0891b2', 
    '(HSA) Category Targeting': '#22d3ee',

    // Store (Purple/Pink)
    '(Store) Exact': '#7c3aed',
    '(Store) Phrase': '#a78bfa',
    '(Store) Broad': '#c4b5fd',
    '(Store) Product Targeting': '#db2777',
    '(Store) Category Targeting': '#f472b6',

    // Video (Red/Orange)
    '(Vid) Exact': '#dc2626',
    '(Vid) Phrase': '#f87171',
    '(Vid) Broad': '#fca5a5',
    '(Vid) Product Targeting': '#ea580c',
    '(Vid) Category Targeting': '#fb923c'
};

export const SBDashboard: React.FC<{ data: DashboardData; currencySymbol: string }> = ({ data, currencySymbol }) => {
  const [view, setView] = useState<'campaigns' | 'targets' | 'matchTypes' | 'placements'>('campaigns');
  const [selectedMetric, setSelectedMetric] = useState<string>('Spend');
  const [searchTerm, setSearchTerm] = useState('');
  const [placementCampaignFilter, setPlacementCampaignFilter] = useState<string | null>(null);
  
  const normSearch = searchTerm.toLowerCase().trim();

  // Filter Campaigns
  const filteredCampaigns = useMemo(() => {
    if (!normSearch) return data.sbCampaigns;
    return data.sbCampaigns.filter(c => c.name.toLowerCase().includes(normSearch));
  }, [data.sbCampaigns, normSearch]);

  const visibleCampaignIds = useMemo(() => new Set(filteredCampaigns.map(c => c.campaignId)), [filteredCampaigns]);

  // List of SB campaigns that have placement data for the dropdown
  const campaignsWithPlacement = useMemo(() => {
      const campIds = new Set(data.sbPlacements.map(p => p.campaignId));
      return data.sbCampaigns
          .filter(c => campIds.has(c.campaignId))
          .sort((a,b) => b.spend - a.spend);
  }, [data.sbPlacements, data.sbCampaigns]);

  // Global Stats
  const stats = useMemo(() => {
    const s = filteredCampaigns.reduce((acc, c) => {
      acc.spend += c.spend;
      acc.sales += c.sales;
      acc.orders += c.orders;
      acc.impressions += c.impressions;
      acc.clicks += c.clicks;
      return acc;
    }, { spend: 0, sales: 0, orders: 0, impressions: 0, clicks: 0 });
    
    return {
        ...s,
        acos: safeDiv(s.spend, s.sales),
        roas: safeDiv(s.sales, s.spend),
        ctr: safeDiv(s.clicks, s.impressions),
        cpc: safeDiv(s.spend, s.clicks),
        cvr: safeDiv(s.orders, s.clicks)
    };
  }, [filteredCampaigns]);

  // Campaign Table Data
  const campaignTableData = useMemo(() => filteredCampaigns.map(c => ({
    ...c,
    spendShare: safeDiv(c.spend, stats.spend),
    acos: safeDiv(c.spend, c.sales),
    roas: safeDiv(c.sales, c.spend),
    cpc: safeDiv(c.spend, c.clicks),
    ctr: safeDiv(c.clicks, c.impressions),
    cvr: safeDiv(c.orders, c.clicks)
  })), [filteredCampaigns, stats.spend]);

  // Targets Data (Keywords + Targets)
  const allTargets = useMemo(() => {
    const campaignMap = new Map<string, { name: string; format: string }>(data.sbCampaigns.map(c => [c.campaignId, { name: c.name, format: c.adFormat }]));
    
    const getPrefix = (fmt: string) => {
        if (fmt === 'Video') return '(Vid)';
        if (fmt === 'Store Spotlight') return '(Store)';
        return '(HSA)';
    };

    const keywords = data.sbKeywords.filter(k => visibleCampaignIds.has(k.campaignId)).map(k => {
        const camp = campaignMap.get(k.campaignId) || { name: k.campaignId, format: 'Product Collection' };
        const prefix = getPrefix(camp.format || 'Product Collection');
        let typeLabel = (k.matchType || 'Broad').toLowerCase();
        typeLabel = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
        
        return {
            id: k.keywordId,
            text: k.keywordText,
            type: 'KEYWORD',
            matchType: `${prefix} ${typeLabel}`,
            campaignId: k.campaignId,
            campaignName: camp.name,
            bid: k.bid,
            spend: k.spend,
            sales: k.sales,
            orders: k.orders || 0, 
            clicks: k.clicks,
            impressions: k.impressions
        };
    });

    const targets = data.sbTargets.filter(t => visibleCampaignIds.has(t.campaignId)).map(t => {
        const camp = campaignMap.get(t.campaignId) || { name: t.campaignId, format: 'Product Collection' };
        const prefix = getPrefix(camp.format || 'Product Collection');
        const isCategory = t.expression.toLowerCase().includes('category=');
        const typeLabel = isCategory ? 'Category Targeting' : 'Product Targeting';

        return {
            id: t.targetId,
            text: t.expression,
            type: 'TARGET',
            matchType: `${prefix} ${typeLabel}`,
            campaignId: t.campaignId,
            campaignName: camp.name,
            bid: t.bid,
            spend: t.spend,
            sales: t.sales,
            orders: t.orders || 0,
            clicks: t.clicks,
            impressions: t.impressions
        };
    });

    const merged = [...keywords, ...targets].map(t => ({
        ...t,
        acos: safeDiv(t.spend, t.sales),
        roas: safeDiv(t.sales, t.spend),
        ctr: safeDiv(t.clicks, t.impressions),
        cpc: safeDiv(t.spend, t.clicks),
        cvr: safeDiv(t.orders, t.clicks),
        spendShare: safeDiv(t.spend, stats.spend)
    }));

    if (!normSearch) return merged;
    return merged.filter(t => t.text.toLowerCase().includes(normSearch) || t.campaignName.toLowerCase().includes(normSearch));
  }, [data.sbKeywords, data.sbTargets, data.sbCampaigns, visibleCampaignIds, normSearch, stats.spend]);

  // Match Type Aggregation
  const matchTypeData = useMemo(() => {
    const aggStats: Record<string, any> = {};
    const add = (type: string, item: any) => {
        if (!aggStats[type]) aggStats[type] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 };
        aggStats[type].spend += item.spend;
        aggStats[type].sales += item.sales;
        aggStats[type].clicks += item.clicks;
        aggStats[type].impressions += item.impressions;
        aggStats[type].orders += (item.orders || 0);
        aggStats[type].count++;
    };

    allTargets.forEach(t => add(t.matchType, t));

    const totalSpend = Object.values(aggStats).reduce((acc, curr) => acc + curr.spend, 0);
    return Object.entries(aggStats)
        .filter(([_, d]) => d.spend > 0 || d.impressions > 0)
        .map(([type, d]) => ({
            type, ...d, 
            acos: safeDiv(d.spend, d.sales), 
            roas: safeDiv(d.sales, d.spend), 
            cpc: safeDiv(d.spend, d.clicks), 
            ctr: safeDiv(d.clicks, d.impressions), 
            cvr: safeDiv(d.orders, d.clicks), 
            spendShare: safeDiv(d.spend, totalSpend)
        })).sort((a, b) => b.spend - a.spend);
  }, [allTargets]);

  // Placement Aggregation
  const placementData = useMemo(() => {
      const aggStats: Record<string, any> = {
          'Top of Search': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
          'Other Placements': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 }
      };

      data.sbPlacements.forEach(p => {
          // Filter by selected campaign if active
          if (placementCampaignFilter) {
              if (p.campaignId !== placementCampaignFilter) return;
          } else {
              if (!visibleCampaignIds.has(p.campaignId)) return;
          }

          let name = p.placement;
          // SB reports often have "Other placements" or "Rest of Search"
          if (name.includes('Top of Search')) name = 'Top of Search';
          else name = 'Other Placements';

          if (!aggStats[name]) aggStats[name] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 };
          aggStats[name].spend += p.spend;
          aggStats[name].sales += p.sales;
          aggStats[name].clicks += p.clicks;
          aggStats[name].impressions += p.impressions;
          aggStats[name].orders += p.orders;
          aggStats[name].count++;
      });
      
      const totalSpend = Object.values(aggStats).reduce((acc, curr) => acc + curr.spend, 0);
      return Object.entries(aggStats)
        .filter(([_, d]) => d.spend > 0 || d.impressions > 0)
        .map(([placement, d]) => {
            const cvr = safeDiv(d.orders, d.clicks);
            return {
                placement, ...d, 
                acos: safeDiv(d.spend, d.sales), 
                roas: safeDiv(d.sales, d.spend), 
                cpc: safeDiv(d.spend, d.clicks), 
                ctr: safeDiv(d.clicks, d.impressions), 
                cvr, 
                spendShare: safeDiv(d.spend, totalSpend)
            };
        }).sort((a, b) => b.spend - a.spend);
  }, [data.sbPlacements, visibleCampaignIds, placementCampaignFilter]);

  // SB Strategic Optimizer Logic
  const calcLogic = useMemo(() => {
      const tos = placementData.find(p => p.placement === 'Top of Search');
      const other = placementData.find(p => p.placement === 'Other Placements');
      
      const tosCvr = tos?.cvr || 0;
      const baseCvr = other?.cvr || 0;
      
      const tosRatio = baseCvr > 0 ? tosCvr / baseCvr : 0;
      const tosModifier = Math.max(0, Math.min(900, (tosRatio - 1) * 100));

      return { tosModifier, tosCvr, baseCvr };
  }, [placementData]);

  const metrics = [
    { title: 'Spend', value: formatCurrency(stats.spend, currencySymbol), typeLabel: 'TOTAL' as const },
    { title: 'Impressions', value: formatInt(stats.impressions), typeLabel: 'TOTAL' as const },
    { title: 'Clicks', value: formatInt(stats.clicks), typeLabel: 'TOTAL' as const },
    { title: 'Cost-per-click (CPC)', value: formatCurrency(stats.cpc, currencySymbol), typeLabel: 'AVERAGE' as const },
    { title: 'Clickthrough rate (CTR)', value: formatPct(stats.ctr), typeLabel: 'AVERAGE' as const },
    { title: 'Sales', value: formatCurrency(stats.sales, currencySymbol), typeLabel: 'TOTAL' as const },
    { title: 'Orders', value: formatInt(stats.orders), typeLabel: 'TOTAL' as const },
    { title: 'Advertising cost of sales (ACOS)', value: formatPct(stats.acos), typeLabel: 'AVERAGE' as const },
    { title: 'Return on ad spend (ROAS)', value: formatNum(stats.roas), typeLabel: 'AVERAGE' as const },
    { title: 'Conversion Rate (CVR)', value: formatPct(stats.cvr), typeLabel: 'AVERAGE' as const },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
        <SectionHeader title="Sponsored Brands Intelligence" description="Analysis of Headline Search Ads (HSA), Video, and Store Spotlight campaigns." />
        <div className="flex items-center gap-3 w-full lg:w-auto">
             <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={view === 'campaigns' ? "Search Campaigns..." : "Search Targets..."}
                  className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold focus:border-brand-500 focus:ring-0 transition-all shadow-sm w-full sm:w-64 text-slate-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.title} title={m.title} value={m.value} typeLabel={m.typeLabel} isSelected={selectedMetric === m.title} onClick={() => setSelectedMetric(m.title)} />
          ))}
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-full sm:w-fit border border-slate-200 dark:border-zinc-700">
          {[{ id: 'campaigns', label: 'Campaign Summary', icon: LayoutGrid }, { id: 'targets', label: 'Target Analysis', icon: Target }, { id: 'matchTypes', label: 'Format & Match Type', icon: PieIcon }, { id: 'placements', label: 'Placement Analysis', icon: Monitor }].map(t => (
            <button key={t.id} onClick={() => setView(t.id as any)} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all flex-1 sm:flex-none justify-center ${view === t.id ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}>
                <t.icon size={16} />{t.label}
            </button>
          ))}
      </div>

      <div className="bg-slate-50/50 dark:bg-zinc-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-zinc-800/50">
          {view === 'campaigns' && <DataTable data={campaignTableData} columns={[
                { key: 'name', header: 'Campaign Name', sortable: true },
                { key: 'adFormat', header: 'Format', sortable: true },
                { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend, currencySymbol), align: 'right', sortable: true },
                { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales, currencySymbol), align: 'right', sortable: true },
                { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                { key: 'orders', header: 'Orders', align: 'right', sortable: true },
                { key: 'ctr', header: 'CTR', render: r => formatPct(r.ctr), align: 'right', sortable: true },
            ]} initialSortKey="spend" />}
            
          {view === 'targets' && <DataTable data={allTargets} columns={[
                { key: 'text', header: 'Target / Keyword', render: (r: any) => (<div className="flex flex-col"><span className="font-bold text-slate-900 dark:text-zinc-100">{r.text}</span><span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">{r.type}</span></div>), sortable: true },
                { key: 'matchType', header: 'Type', render: r => { const color = MATCH_TYPE_COLORS[r.matchType] || '#94a3b8'; return (<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border`} style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}30` }}>{r.matchType}</span>); }, sortable: true },
                { key: 'campaignName', header: 'Campaign', sortable: true },
                { key: 'bid', header: 'Bid', render: r => formatCurrency(r.bid, currencySymbol), align: 'right', sortable: true },
                { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend, currencySymbol), align: 'right', sortable: true },
                { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales, currencySymbol), align: 'right', sortable: true },
                { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                { key: 'orders', header: 'Orders', align: 'right', sortable: true },
            ]} initialSortKey="spend" />}

          {view === 'matchTypes' && (
             <div className="space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-4 w-full text-left">Spend by Type</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={matchTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="spend" nameKey="type">{matchTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={MATCH_TYPE_COLORS[entry.type] || '#ccc'} stroke="none" />))}</Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} /><Legend verticalAlign="bottom" height={36} iconType="circle" /></PieChart></ResponsiveContainer></div>
                    </div>
                    <div className="lg:col-span-2">
                         <DataTable data={matchTypeData} columns={[
                            { key: 'type', header: 'Format / Match Type', render: r => (<div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: MATCH_TYPE_COLORS[r.type] || '#ccc' }}></div><span className="font-bold text-slate-900 dark:text-zinc-100">{r.type}</span></div>), sortable: true },
                            { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend, currencySymbol), align: 'right', sortable: true },
                            { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales, currencySymbol), align: 'right', sortable: true },
                            { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                            { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                            { key: 'cvr', header: 'CVR', render: r => formatPct(r.cvr), align: 'right', sortable: true },
                            { key: 'count', header: 'Count', align: 'right', sortable: true },
                        ]} initialSortKey="spend" />
                    </div>
                 </div>
             </div>
          )}

          {view === 'placements' && (
              <div className="space-y-6">
                {/* Placement Campaign Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-50 dark:bg-brand-900/30 p-2 rounded-lg">
                            <Filter size={18} className="text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">SB Placement Scope</h4>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                                {placementCampaignFilter ? 'Single Campaign Analysis' : 'Aggregated Brand Analysis'}
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-80 group">
                        <select 
                            value={placementCampaignFilter || ''} 
                            onChange={(e) => setPlacementCampaignFilter(e.target.value || null)}
                            className="appearance-none w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-brand-500 transition-all pr-10 cursor-pointer"
                        >
                            <option value="">All SB Campaigns (Average)</option>
                            {campaignsWithPlacement.map(c => (
                                <option key={c.campaignId} value={c.campaignId}>{c.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-brand-500 transition-colors">
                            {placementCampaignFilter ? (
                                <button onClick={(e) => { e.stopPropagation(); setPlacementCampaignFilter(null); }} className="pointer-events-auto">
                                    <X size={16} />
                                </button>
                            ) : (
                                <ChevronDown size={16} />
                            )}
                        </div>
                    </div>
                </div>

                {/* SB Placement Optimizer */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 p-6 rounded-2xl">
                   <div className="flex flex-col lg:flex-row gap-8 items-center">
                        <div className="lg:w-1/3">
                            <h4 className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300 mb-2">
                                <Calculator className="w-5 h-5" /> 
                                SB Strategic Optimizer
                            </h4>
                            <p className="text-xs text-indigo-800 dark:text-indigo-400 leading-relaxed mb-4">
                                {placementCampaignFilter 
                                    ? "Analyzing specific SB campaign real estate performance." 
                                    : "Calculating blended SB performance. HSA and Video placements vary significantly."}
                            </p>
                            <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase">Other Placements CVR</span><span className="text-sm font-black text-slate-800 dark:text-zinc-100">{formatPct(calcLogic.baseCvr)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">Top of Search CVR</span><span className="text-sm font-black text-slate-800 dark:text-zinc-100">{formatPct(calcLogic.tosCvr)}</span></div>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowRight size={40} className="-rotate-45" /></div>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Rec. TOS Modifier</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">+{Math.round(calcLogic.tosModifier)}%</div>
                                <p className="text-[10px] text-slate-400 mt-2">Adjust to capture high-intent brand shoppers.</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={40} className="scale-75" /></div>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Efficiency Multiplier</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">x{(safeDiv(calcLogic.tosCvr, calcLogic.baseCvr) || 1).toFixed(1)}</div>
                                <p className="text-[10px] text-slate-400 mt-2">TOS relative conversion strength.</p>
                            </div>
                        </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-4">Volume Distribution</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={placementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="placement" tick={{fontSize: 10}} interval={0} /><YAxis tickFormatter={(val) => `${currencySymbol}${val}`} /><RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} /><Legend /><Bar dataKey="spend" name="Spend" fill="#6366f1" radius={[4, 4, 0, 0]} /><Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-4">Conversion Strength</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={placementData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="orders" nameKey="placement">{placementData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} stroke="none" />))}</Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div>
                    </div>
                </div>

                <DataTable data={placementData} columns={[
                    { key: 'placement', header: 'Placement', render: r => <span className="font-bold text-slate-900 dark:text-zinc-100">{r.placement}</span>, sortable: true },
                    { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend, currencySymbol), align: 'right', sortable: true },
                    { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales, currencySymbol), align: 'right', sortable: true },
                    { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                    { key: 'cvr', header: 'CVR', render: r => <span className="font-bold">{formatPct(r.cvr)}</span>, align: 'right', sortable: true },
                    { key: 'cpc', header: 'CPC', render: r => formatCurrency(r.cpc, currencySymbol), align: 'right', sortable: true },
                    { key: 'ctr', header: 'CTR', render: r => formatPct(r.ctr), align: 'right', sortable: true },
                ]} initialSortKey="spend" />
              </div>
          )}
      </div>
    </div>
  );
};
