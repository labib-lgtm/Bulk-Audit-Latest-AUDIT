
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
    'Exact': '#4f46e5', 'Phrase': '#818cf8', 'Broad': '#c7d2fe', 'PAT': '#db2777', 'Category': '#f472b6',
    'Auto Close': '#059669', 'Auto Loose': '#34d399', 'Auto Sub': '#d97706', 'Auto Comp': '#fbbf24', 'Other': '#94a3b8', 'TARGETING': '#94a3b8'
};

export const SPDashboard: React.FC<{ data: DashboardData }> = ({ data }) => {
  const [view, setView] = useState<'campaigns' | 'targets' | 'matchTypes' | 'placements'>('campaigns');
  const [selectedMetric, setSelectedMetric] = useState<string>('Spend');
  const [searchTerm, setSearchTerm] = useState('');
  
  const normSearch = searchTerm.toLowerCase().trim();

  // --- Campaign Logic ---
  const filteredCampaigns = useMemo(() => {
    if (!normSearch) return data.spCampaigns;
    return data.spCampaigns.filter(c => c.name.toLowerCase().includes(normSearch));
  }, [data.spCampaigns, normSearch]);

  const stats = useMemo(() => {
    const s = data.spCampaigns.reduce((acc, c) => {
      acc.spend += (c.spend || 0);
      acc.sales += (c.sales || 0);
      acc.orders += (c.orders || 0);
      acc.impressions += (c.impressions || 0);
      acc.clicks += (c.clicks || 0);
      acc.units += (c.units || 0);
      return acc;
    }, { spend: 0, sales: 0, orders: 0, impressions: 0, clicks: 0, units: 0 });

    return {
      ...s,
      acos: safeDiv(s.spend, s.sales),
      roas: safeDiv(s.sales, s.spend),
      ctr: safeDiv(s.clicks, s.impressions),
      cpc: safeDiv(s.spend, s.clicks),
      cvr: safeDiv(s.orders, s.clicks),
      aov: safeDiv(s.sales, s.orders),
      cpo: safeDiv(s.spend, s.orders),
    };
  }, [data.spCampaigns]);

  const campaignTableData = useMemo(() => {
    return filteredCampaigns.map(c => ({
        ...c,
        spendShare: safeDiv(c.spend, stats.spend),
        roas: safeDiv(c.sales, c.spend),
        acos: safeDiv(c.spend, c.sales),
        cpc: safeDiv(c.spend, c.clicks),
        ctr: safeDiv(c.clicks, c.impressions)
    }));
  }, [filteredCampaigns, stats.spend]);

  const allTargets = useMemo(() => {
    const campaignMap = new Map(data.spCampaigns.map(c => [c.campaignId, c.name]));
    const keywords = data.spKeywords.map(k => ({
        id: k.keywordId,
        text: k.keywordText,
        type: 'KEYWORD',
        matchType: k.matchType === 'EXACT' ? 'Exact' : k.matchType === 'PHRASE' ? 'Phrase' : 'Broad',
        campaignId: k.campaignId,
        campaignName: campaignMap.get(k.campaignId) || k.campaignId,
        bid: k.bid,
        spend: k.spend,
        sales: k.sales,
        orders: k.orders,
        clicks: k.clicks,
        impressions: k.impressions
    }));
    const targets = data.spProductTargets.map(t => {
        const expr = (t.resolvedExpression || t.expression || '').toLowerCase();
        let granularType = 'TARGETING';
        if (expr.includes('close-match') || expr.includes('queryhighrelmatches')) granularType = 'Auto Close';
        else if (expr.includes('loose-match') || expr.includes('querybroadrelmatches')) granularType = 'Auto Loose';
        else if (expr.includes('substitutes') || expr.includes('asinsubstituterelated')) granularType = 'Auto Sub';
        else if (expr.includes('complements') || expr.includes('asinaccessoryrelated')) granularType = 'Auto Comp';
        else if (expr.includes('asin=') || expr.includes('asin="')) granularType = 'PAT';
        else if (expr.includes('category=') || expr.includes('category="')) granularType = 'Category';
        return {
            id: t.targetId,
            text: t.resolvedExpression || t.expression,
            type: 'TARGET',
            matchType: granularType, 
            campaignId: t.campaignId,
            campaignName: campaignMap.get(t.campaignId) || t.campaignId,
            bid: t.bid,
            spend: t.spend,
            sales: t.sales,
            orders: t.orders,
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
  }, [data.spKeywords, data.spProductTargets, data.spCampaigns, normSearch, stats.spend]);

  const visibleCampaignIds = useMemo(() => new Set(filteredCampaigns.map(c => c.campaignId)), [filteredCampaigns]);

  const matchTypeData = useMemo(() => {
    const initialStats = {
      'Exact': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Phrase': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Broad': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'PAT': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Category': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Auto Close': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Auto Loose': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Auto Sub': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Auto Comp': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
    };
    const stats: Record<string, typeof initialStats['Exact']> = { ...initialStats };
    const addStats = (type: string, item: any) => {
        if (!stats[type]) stats[type] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 };
        stats[type].spend += item.spend;
        stats[type].sales += item.sales;
        stats[type].clicks += item.clicks;
        stats[type].impressions += item.impressions;
        stats[type].orders += item.orders;
        stats[type].count++;
    };
    data.spKeywords.forEach(k => {
      if (!visibleCampaignIds.has(k.campaignId)) return;
      let type = 'Broad';
      if (k.matchType === 'EXACT') type = 'Exact';
      else if (k.matchType === 'PHRASE') type = 'Phrase';
      addStats(type, k);
    });
    data.spProductTargets.forEach(t => {
       if (!visibleCampaignIds.has(t.campaignId)) return;
       const expr = (t.resolvedExpression || t.expression || '').toLowerCase();
       let type = 'Other';
       if (expr.includes('close-match') || expr.includes('queryhighrelmatches')) type = 'Auto Close';
       else if (expr.includes('loose-match') || expr.includes('querybroadrelmatches')) type = 'Auto Loose';
       else if (expr.includes('substitutes') || expr.includes('asinsubstituterelated')) type = 'Auto Sub';
       else if (expr.includes('complements') || expr.includes('asinaccessoryrelated')) type = 'Auto Comp';
       else if (expr.includes('asin=') || expr.includes('asin="')) type = 'PAT';
       else if (expr.includes('category=') || expr.includes('category="')) type = 'Category';
       addStats(type, t);
    });
    const totalSpend = Object.values(stats).reduce((acc, curr) => acc + curr.spend, 0);
    return Object.entries(stats).filter(([_, d]) => d.spend > 0 || d.sales > 0 || d.clicks > 0 || d.count > 0).map(([type, d]) => ({
        type, ...d, acos: safeDiv(d.spend, d.sales), roas: safeDiv(d.sales, d.spend), cpc: safeDiv(d.spend, d.clicks), ctr: safeDiv(d.clicks, d.impressions), cvr: safeDiv(d.orders, d.clicks), spendShare: safeDiv(d.spend, totalSpend)
    })).sort((a, b) => b.spend - a.spend);
  }, [data.spKeywords, data.spProductTargets, data.spCampaigns, visibleCampaignIds]);

  const placementData = useMemo(() => {
    const stats: Record<string, any> = {
      'Top of Search (First Page)': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Rest of Search': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
      'Product Pages': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
    };
    data.spPlacements.forEach(p => {
        if (!visibleCampaignIds.has(p.campaignId)) return;
        let name = p.placement;
        if (name.includes('Top of Search')) name = 'Top of Search (First Page)';
        else if (name.includes('Product Pages')) name = 'Product Pages';
        else if (name.includes('Rest of Search')) name = 'Rest of Search';
        if (!stats[name]) stats[name] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 };
        stats[name].spend += p.spend;
        stats[name].sales += p.sales;
        stats[name].clicks += p.clicks;
        stats[name].impressions += p.impressions;
        stats[name].orders += p.orders;
        stats[name].count++;
    });
    const totalSpend = Object.values(stats).reduce((acc, curr) => acc + curr.spend, 0);
    return Object.entries(stats).filter(([_, d]) => d.spend > 0 || d.impressions > 0).map(([placement, d]) => ({
        placement, ...d, acos: safeDiv(d.spend, d.sales), roas: safeDiv(d.sales, d.spend), cpc: safeDiv(d.spend, d.clicks), ctr: safeDiv(d.clicks, d.impressions), cvr: safeDiv(d.orders, d.clicks), spendShare: safeDiv(d.spend, totalSpend)
    })).sort((a, b) => b.spend - a.spend);
  }, [data.spPlacements, visibleCampaignIds]);

  const metricsRow1 = [
    { title: 'Spend', value: formatCurrency(stats.spend), typeLabel: 'TOTAL' as const },
    { title: 'Impressions', value: formatInt(stats.impressions), typeLabel: 'TOTAL' as const },
    { title: 'Clicks', value: formatInt(stats.clicks), typeLabel: 'TOTAL' as const },
    { title: 'Cost-per-click (CPC)', value: formatCurrency(stats.cpc), typeLabel: 'AVERAGE' as const },
    { title: 'Clickthrough rate (CTR)', value: formatPct(stats.ctr), typeLabel: 'AVERAGE' as const },
  ];
  const metricsRow2 = [
    { title: 'Sales', value: formatCurrency(stats.sales), typeLabel: 'TOTAL' as const },
    { title: 'Orders', value: formatInt(stats.orders), typeLabel: 'TOTAL' as const },
    { title: 'Advertising cost of sales (ACOS)', value: formatPct(stats.acos), typeLabel: 'AVERAGE' as const },
    { title: 'Return on ad spend (ROAS)', value: formatNum(stats.roas), typeLabel: 'AVERAGE' as const },
    { title: 'Conversion Rate (CVR)', value: formatPct(stats.cvr), typeLabel: 'AVERAGE' as const },
  ];
  const metricsRow3 = [
    { title: 'Units', value: formatInt(stats.units), typeLabel: 'TOTAL' as const },
    { title: 'Avg Order Value (AOV)', value: formatCurrency(stats.aov), typeLabel: 'AVERAGE' as const },
    { title: 'Cost Per Order (CPO)', value: formatCurrency(stats.cpo), typeLabel: 'AVERAGE' as const },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
        <SectionHeader title="Sponsored Products Intelligence" description="Operational PPC diagnostics and target analysis." />
        <div className="flex items-center gap-3 w-full lg:w-auto">
             <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  placeholder={view === 'campaigns' ? "Search Campaigns..." : "Search Keywords & Targets..."}
                  className="pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0 transition-all shadow-sm w-full sm:w-64"
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
          {[{ id: 'campaigns', label: 'Campaign Summary', icon: LayoutGrid }, { id: 'targets', label: 'Target Analysis', icon: Target }, { id: 'matchTypes', label: 'Match Type Analysis', icon: PieIcon }, { id: 'placements', label: 'Placement Analysis', icon: Monitor }].map(t => (
            <button key={t.id} onClick={() => setView(t.id as any)} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all flex-1 sm:flex-none justify-center ${view === t.id ? 'bg-card text-primary shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                <t.icon size={16} />{t.label}
            </button>
          ))}
      </div>
      <div className="bg-card/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border">
        {view === 'campaigns' && <DataTable data={campaignTableData} columns={[
                { key: 'name', header: 'Campaign Name', sortable: true },
                { key: 'state', header: 'State', render: r => <span className={`uppercase text-[10px] font-bold px-2 py-1 rounded-full ${r.state === 'enabled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{r.state}</span> },
                { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
                { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
                { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                { key: 'acos', header: 'ACoS', render: r => formatPct(safeDiv(r.spend, r.sales)), align: 'right', sortable: true },
                { key: 'orders', header: 'Orders', align: 'right', sortable: true },
                { key: 'cpc', header: 'CPC', render: (r: any) => formatCurrency(safeDiv(r.spend, r.clicks)), align: 'right', sortable: true },
                { key: 'ctr', header: 'CTR', render: (r: any) => formatPct(safeDiv(r.clicks, r.impressions)), align: 'right', sortable: true },
        ]} initialSortKey="spend" />}
        {view === 'targets' && <DataTable data={allTargets} columns={[
                { key: 'text', header: 'Target / Keyword', render: (r: any) => (<div className="flex flex-col"><span className="font-bold text-foreground">{r.text}</span><span className="text-[10px] text-muted-foreground font-bold uppercase">{r.type}</span></div>), sortable: true },
                { key: 'matchType', header: 'Match Type', render: r => { const color = MATCH_TYPE_COLORS[r.matchType] || MATCH_TYPE_COLORS['Other']; return (<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border`} style={{ backgroundColor: `${color}20`, color: color, borderColor: `${color}40` }}>{r.matchType}</span>); }, sortable: true },
                { key: 'campaignName', header: 'Campaign', sortable: true },
                { key: 'bid', header: 'Bid', render: r => formatCurrency(r.bid), align: 'right', sortable: true },
                { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
                { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
                { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-400 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                { key: 'orders', header: 'Orders', align: 'right', sortable: true },
                { key: 'cvr', header: 'CVR', render: r => formatPct(r.cvr), align: 'right', sortable: true }
        ]} initialSortKey="spend" />}
        {view === 'matchTypes' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 w-full text-left">Spend Distribution</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={matchTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="spend" nameKey="type">{matchTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={MATCH_TYPE_COLORS[entry.type] || '#ccc'} stroke="none" />))}</Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} /><Legend verticalAlign="bottom" height={36} iconType="circle" /></PieChart></ResponsiveContainer></div>
                    </div>
                    <div className="lg:col-span-2">
                         <DataTable data={matchTypeData} columns={[
                            { key: 'type', header: 'Match Type', render: r => (<div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: MATCH_TYPE_COLORS[r.type] }}></div><span className="font-bold text-foreground">{r.type}</span></div>), sortable: true },
                            { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
                            { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
                            { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                            { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-400 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                            { key: 'cvr', header: 'CVR', render: r => formatPct(r.cvr), align: 'right', sortable: true },
                            { key: 'cpc', header: 'CPC', render: r => formatCurrency(r.cpc), align: 'right', sortable: true },
                            { key: 'count', header: 'Target Count', align: 'right', sortable: true },
                        ]} initialSortKey="spend" />
                    </div>
                </div>
            </div>
        )}
        {view === 'placements' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card rounded-2xl border border-border p-6">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Placement Efficiency (CPC vs CVR)</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={placementData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" /><XAxis type="number" hide /><YAxis type="category" dataKey="placement" width={100} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} /><RechartsTooltip formatter={(value: number, name: string) => name === 'CPC' ? formatCurrency(value) : formatPct(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Legend /><Bar dataKey="cpc" name="CPC" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} /><Bar dataKey="cvr" name="CVR" fill="#34d399" radius={[0, 4, 4, 0]} barSize={20} /></BarChart></ResponsiveContainer></div>
                    </div>
                    <div className="bg-card rounded-2xl border border-border p-6">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Spend vs Sales</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={placementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="placement" tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} interval={0} /><YAxis tick={{fill: 'hsl(var(--muted-foreground))'}} /><RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Legend /><Bar dataKey="spend" name="Spend" fill="#f43f5e" radius={[4, 4, 0, 0]} /><Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                    </div>
                </div>
                <DataTable data={placementData} columns={[
                    { key: 'placement', header: 'Placement', render: r => <span className="font-bold text-foreground">{r.placement}</span>, sortable: true },
                    { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
                    { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
                    { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                    { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-400 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                    { key: 'cvr', header: 'CVR', render: r => formatPct(r.cvr), align: 'right', sortable: true },
                    { key: 'cpc', header: 'CPC', render: r => formatCurrency(r.cpc), align: 'right', sortable: true },
                    { key: 'ctr', header: 'CTR', render: r => formatPct(r.ctr), align: 'right', sortable: true },
                ]} initialSortKey="spend" />
            </div>
        )}
      </div>
    </div>
  );
};
