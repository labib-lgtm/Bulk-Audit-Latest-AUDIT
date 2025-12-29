
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DashboardData } from '../types';
import { MetricCard, SectionHeader, DataTable } from '../components/Widgets';
import { LayoutGrid, Target, PieChart as PieIcon, Monitor, Search } from 'lucide-react';

const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export const SBDashboard: React.FC<{ data: DashboardData }> = ({ data }) => {
  const [view, setView] = useState<'campaigns' | 'targets' | 'matchTypes' | 'placements'>('campaigns');
  const [selectedMetric, setSelectedMetric] = useState<string>('Spend');
  const [searchTerm, setSearchTerm] = useState('');
  
  const normSearch = searchTerm.toLowerCase().trim();

  const filteredCampaigns = useMemo(() => {
    if (!normSearch) return data.sbCampaigns;
    return data.sbCampaigns.filter(c => c.name.toLowerCase().includes(normSearch));
  }, [data.sbCampaigns, normSearch]);

  const stats = useMemo(() => {
    return data.sbCampaigns.reduce((acc, c) => {
      acc.spend += c.spend;
      acc.sales += c.sales;
      acc.orders += c.orders;
      acc.impressions += c.impressions;
      acc.clicks += c.clicks;
      return acc;
    }, { spend: 0, sales: 0, orders: 0, impressions: 0, clicks: 0 });
  }, [data.sbCampaigns]);

  const campaignTableData = useMemo(() => filteredCampaigns.map(c => ({
    ...c,
    spendShare: safeDiv(c.spend, stats.spend),
    acos: safeDiv(c.spend, c.sales),
    roas: safeDiv(c.sales, c.spend),
    cpc: safeDiv(c.spend, c.clicks),
    ctr: safeDiv(c.clicks, c.impressions),
    cvr: safeDiv(c.orders, c.clicks)
  })), [filteredCampaigns, stats.spend]);

  const visibleCampaignIds = useMemo(() => new Set(filteredCampaigns.map(c => c.campaignId)), [filteredCampaigns]);

  const allTargets = useMemo(() => {
    const campaignMap = new Map(data.sbCampaigns.map(c => [c.campaignId, { name: c.name, format: c.adFormat }]));
    
    // Helper to get prefix
    const getPrefix = (fmt: string) => {
        if (fmt === 'Video') return '(Vid)';
        if (fmt === 'Store Spotlight') return '(Store)';
        return '(HSA)'; // Default for Product Collection / Legacy
    };

    const keywords = data.sbKeywords.filter(k => visibleCampaignIds.has(k.campaignId)).map(k => {
        const camp = campaignMap.get(k.campaignId) || { name: k.campaignId, format: 'Product Collection' };
        const prefix = getPrefix(camp.format || 'Product Collection');
        const baseType = (k.matchType || '').toLowerCase();
        const typeLabel = baseType === 'exact' ? 'Exact' : baseType === 'phrase' ? 'Phrase' : 'Broad';
        
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

  const matchTypeData = useMemo(() => {
    const stats: Record<string, any> = {};
    const add = (type: string, item: any) => {
        if (!stats[type]) stats[type] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 };
        stats[type].spend += item.spend;
        stats[type].sales += item.sales;
        stats[type].clicks += item.clicks;
        stats[type].impressions += item.impressions;
        stats[type].orders += item.orders;
        stats[type].count++;
    };

    allTargets.forEach(t => add(t.matchType, t));
    
    const totalSpend = Object.values(stats).reduce((acc, curr) => acc + curr.spend, 0);
    return Object.entries(stats).map(([type, d]) => ({
        type, ...d, acos: safeDiv(d.spend, d.sales), roas: safeDiv(d.sales, d.spend), cpc: safeDiv(d.spend, d.clicks), ctr: safeDiv(d.clicks, d.impressions), cvr: safeDiv(d.orders, d.clicks), spendShare: safeDiv(d.spend, totalSpend)
    })).sort((a, b) => b.spend - a.spend);
  }, [allTargets]);

  const placementData = useMemo(() => {
    const stats: Record<string, any> = {};
    data.sbPlacements.forEach(p => {
        if (!visibleCampaignIds.has(p.campaignId)) return;
        const name = p.placement;
        if (!stats[name]) stats[name] = { spend: 0, sales: 0, clicks: 0, impressions: 0, count: 0 };
        stats[name].spend += p.spend;
        stats[name].sales += p.sales;
        stats[name].clicks += p.clicks;
        stats[name].impressions += p.impressions;
        stats[name].count++;
    });
    
    const totalSpend = Object.values(stats).reduce((acc, curr) => acc + curr.spend, 0);
    return Object.entries(stats).filter(([_, d]) => d.spend > 0 || d.impressions > 0).map(([placement, d]) => ({
        placement, ...d, acos: safeDiv(d.spend, d.sales), roas: safeDiv(d.sales, d.spend), cpc: safeDiv(d.spend, d.clicks), ctr: safeDiv(d.clicks, d.impressions), spendShare: safeDiv(d.spend, totalSpend)
    })).sort((a, b) => b.spend - a.spend);
  }, [data.sbPlacements, visibleCampaignIds]);

  const metrics = [
    { title: 'Spend', value: formatCurrency(stats.spend), typeLabel: 'TOTAL' as const },
    { title: 'Sales', value: formatCurrency(stats.sales), typeLabel: 'TOTAL' as const },
    { title: 'ROAS', value: formatNum(safeDiv(stats.sales, stats.spend)), typeLabel: 'AVERAGE' as const },
    { title: 'Orders', value: formatInt(stats.orders), typeLabel: 'TOTAL' as const },
    { title: 'CTR', value: formatPct(safeDiv(stats.clicks, stats.impressions)), typeLabel: 'AVERAGE' as const },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-24">
       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
          <SectionHeader title="Sponsored Brands" description="Brand awareness and video campaign performance." />
           <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                 <input 
                   type="text" 
                   placeholder={view === 'campaigns' ? "Search Campaigns..." : "Search Keywords..."}
                   className="pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold text-foreground focus:border-brand-500 focus:ring-0 transition-all shadow-sm w-full sm:w-64"
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
       
        <div className="flex flex-wrap gap-2 p-1.5 bg-muted rounded-2xl w-full sm:w-fit border border-border">
           <button onClick={() => setView('campaigns')} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all ${view === 'campaigns' ? 'bg-card text-brand-600 shadow-md' : 'text-muted-foreground'}`}><LayoutGrid size={16} /> Campaign Summary</button>
           <button onClick={() => setView('targets')} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all ${view === 'targets' ? 'bg-card text-brand-600 shadow-md' : 'text-muted-foreground'}`}><Target size={16} /> Target Analysis</button>
           <button onClick={() => setView('matchTypes')} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all ${view === 'matchTypes' ? 'bg-card text-brand-600 shadow-md' : 'text-muted-foreground'}`}><PieIcon size={16} /> Match Type Analysis</button>
           <button onClick={() => setView('placements')} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all ${view === 'placements' ? 'bg-card text-brand-600 shadow-md' : 'text-muted-foreground'}`}><Monitor size={16} /> Placement Analysis</button>
        </div>

        <div className="bg-muted/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/50">
          {view === 'campaigns' && (
            <DataTable data={campaignTableData} columns={[
              { key: 'name', header: 'Campaign Name', sortable: true },
              { key: 'state', header: 'State', render: r => <span className={`uppercase text-[10px] font-bold px-2 py-1 rounded-full ${r.state === 'enabled' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{r.state}</span> },
              { key: 'adFormat', header: 'Format', sortable: true },
              { key: 'impressions', header: 'Impressions', align: 'right', sortable: true, render: r => formatInt(r.impressions) },
              { key: 'clicks', header: 'Clicks', align: 'right', sortable: true, render: r => formatInt(r.clicks) },
              { key: 'ctr', header: 'CTR', align: 'right', sortable: true, render: r => formatPct(r.ctr) },
              { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
              { key: 'cpc', header: 'CPC', align: 'right', sortable: true, render: r => formatCurrency(r.cpc) },
              { key: 'orders', header: 'Orders', align: 'right', sortable: true, render: r => formatInt(r.orders) },
              { key: 'cvr', header: 'CVR', align: 'right', sortable: true, render: r => formatPct(r.cvr) },
              { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
              { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
              { key: 'acos', header: 'ACoS', render: r => formatPct(r.acos), align: 'right', sortable: true },
            ]} initialSortKey="spend" />
          )}
          {view === 'targets' && (
              <DataTable data={allTargets} columns={[
                 { key: 'text', header: 'Target / Keyword', render: (r: any) => (<div className="flex flex-col"><span className="font-bold text-foreground">{r.text}</span><span className="text-[10px] text-muted-foreground font-bold uppercase">{r.type}</span></div>), sortable: true },
                 { key: 'matchType', header: 'Match Type', render: r => { const color = MATCH_TYPE_COLORS[r.matchType] || '#94a3b8'; return (<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border`} style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}30` }}>{r.matchType}</span>); }, sortable: true },
                 { key: 'campaignName', header: 'Campaign', sortable: true },
                 { key: 'bid', header: 'Bid', render: r => formatCurrency(r.bid), align: 'right', sortable: true },
                 { key: 'impressions', header: 'Impressions', align: 'right', sortable: true, render: r => formatInt(r.impressions) },
                 { key: 'clicks', header: 'Clicks', align: 'right', sortable: true, render: r => formatInt(r.clicks) },
                 { key: 'ctr', header: 'CTR', align: 'right', sortable: true, render: r => formatPct(r.ctr) },
                 { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
                 { key: 'cpc', header: 'CPC', align: 'right', sortable: true, render: r => formatCurrency(r.cpc) },
                 { key: 'orders', header: 'Orders', align: 'right', sortable: true, render: r => formatInt(r.orders) },
                 { key: 'cvr', header: 'CVR', align: 'right', sortable: true, render: r => formatPct(r.cvr) },
                 { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
                 { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                 { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
              ]} initialSortKey="spend" />
           )}
           {view === 'matchTypes' && (
             <div className="space-y-6">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center">
                          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 w-full text-left">Spend Distribution</h4>
                          <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={matchTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="spend" nameKey="type">{matchTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={MATCH_TYPE_COLORS[entry.type] || '#ccc'} stroke="none" />))}</Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} /><Legend verticalAlign="bottom" height={36} iconType="circle" /></PieChart></ResponsiveContainer></div>
                      </div>
                     <div className="lg:col-span-2">
                          <DataTable data={matchTypeData} columns={[
                             { key: 'type', header: 'Match Type', render: r => (<div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: MATCH_TYPE_COLORS[r.type] || '#ccc' }}></div><span className="font-bold text-foreground">{r.type}</span></div>), sortable: true },
                            { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
                            { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
                            { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                            { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                            { key: 'cpc', header: 'CPC', render: r => formatCurrency(r.cpc), align: 'right', sortable: true },
                            { key: 'cvr', header: 'CVR', render: r => formatPct(r.cvr), align: 'right', sortable: true },
                            { key: 'count', header: 'Count', align: 'right', sortable: true },
                        ]} initialSortKey="spend" />
                    </div>
                </div>
            </div>
          )}
          {view === 'placements' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Placement Efficiency</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={placementData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="placement" width={100} tick={{fontSize: 10}} /><RechartsTooltip formatter={(value: number, name: string) => name === 'CPC' ? formatCurrency(value) : formatPct(value)} cursor={{fill: '#f8fafc'}} /><Legend /><Bar dataKey="cpc" name="CPC" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} /><Bar dataKey="ctr" name="CTR" fill="#34d399" radius={[0, 4, 4, 0]} barSize={20} /></BarChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Spend vs Sales</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={placementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="placement" tick={{fontSize: 10}} interval={0} /><YAxis /><RechartsTooltip formatter={(value: number) => formatCurrency(value)} /><Legend /><Bar dataKey="spend" name="Spend" fill="#f43f5e" radius={[4, 4, 0, 0]} /><Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                    </div>
                </div>
                <DataTable data={placementData} columns={[
                    { key: 'placement', header: 'Placement', render: r => <span className="font-bold text-slate-900">{r.placement}</span>, sortable: true },
                    { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
                    { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
                    { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                    { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                    { key: 'cpc', header: 'CPC', render: r => formatCurrency(r.cpc), align: 'right', sortable: true },
                    { key: 'ctr', header: 'CTR', render: r => formatPct(r.ctr), align: 'right', sortable: true },
                ]} initialSortKey="spend" />
            </div>
        )}
      </div>
    </div>
  );
};
