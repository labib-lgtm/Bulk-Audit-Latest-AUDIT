
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
const formatCompactNum = (val: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(val);
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

const TACTIC_COLORS: Record<string, string> = {
    'Product / Contextual': '#8b5cf6',
    'Audiences': '#06b6d4'
};

export const SDDashboard: React.FC<{ data: DashboardData }> = ({ data }) => {
  const [view, setView] = useState<'campaigns' | 'targets' | 'tactics'>('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const normSearch = searchTerm.toLowerCase().trim();

  const filteredCampaigns = useMemo(() => {
    if (!normSearch) return data.sdCampaigns;
    return data.sdCampaigns.filter(c => c.name.toLowerCase().includes(normSearch));
  }, [data.sdCampaigns, normSearch]);

  const stats = useMemo(() => {
     return data.sdCampaigns.reduce((acc, c) => {
      acc.spend += c.spend;
      acc.sales += c.sales;
      acc.impressions += c.impressions;
      acc.clicks += c.clicks;
      acc.orders += c.orders;
      return acc;
    }, { spend: 0, sales: 0, orders: 0, impressions: 0, clicks: 0 });
  }, [data.sdCampaigns]);

   const campaigns = useMemo(() => filteredCampaigns.map(c => ({
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
      const campaignMap = new Map<string, { name: string; tactic: string }>(
          data.sdCampaigns.map(c => [c.campaignId, { name: c.name, tactic: c.tactic }])
      );
      return data.sdTargets.filter(t => visibleCampaignIds.has(t.campaignId)).map(t => {
          const camp = campaignMap.get(t.campaignId) || { name: t.campaignId, tactic: 'Unknown' };
          return {
              ...t,
              campaignName: camp.name,
              tactic: camp.tactic,
              acos: safeDiv(t.spend, t.sales),
              roas: safeDiv(t.sales, t.spend),
              ctr: safeDiv(t.clicks, t.impressions),
              cpc: safeDiv(t.spend, t.clicks),
              cvr: safeDiv(t.orders, t.clicks),
              spendShare: safeDiv(t.spend, stats.spend)
          };
      }).filter(t => !normSearch || t.expression.toLowerCase().includes(normSearch) || t.campaignName.toLowerCase().includes(normSearch));
  }, [data.sdTargets, data.sdCampaigns, visibleCampaignIds, normSearch, stats.spend]);

  const tacticData = useMemo(() => {
      const stats: Record<string, any> = {};
      const add = (type: string, item: any) => {
          if (!stats[type]) stats[type] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 };
          stats[type].spend += item.spend;
          stats[type].sales += item.sales;
          stats[type].clicks += item.clicks;
          stats[type].impressions += item.impressions;
          stats[type].orders += item.orders || 0;
          stats[type].count++;
      };
      
      filteredCampaigns.forEach(c => add(c.tactic === 'T00020' ? 'Product / Contextual' : 'Audiences', c));
      
      const totalSpend = Object.values(stats).reduce((acc, curr) => acc + curr.spend, 0);
      return Object.entries(stats).map(([type, d]) => ({
          type, ...d, acos: safeDiv(d.spend, d.sales), roas: safeDiv(d.sales, d.spend), cpc: safeDiv(d.spend, d.clicks), ctr: safeDiv(d.clicks, d.impressions), cvr: safeDiv(d.orders, d.clicks), spendShare: safeDiv(d.spend, totalSpend)
      })).sort((a, b) => b.spend - a.spend);
  }, [filteredCampaigns]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <SectionHeader title="Sponsored Display" description="Retargeting and audience-based campaigns." />
            <div className="flex items-center gap-3 w-full lg:w-auto">
             <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={view === 'campaigns' ? "Search Campaigns..." : "Search Targets..."}
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-brand-500 focus:ring-0 transition-all shadow-sm w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
            </div>
        </div>

         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <MetricCard title="Spend" value={formatCurrency(stats.spend)} />
             <MetricCard title="Sales" value={formatCurrency(stats.sales)} />
             <MetricCard title="ROAS" value={formatNum(safeDiv(stats.sales, stats.spend))} />
             <MetricCard title="Impressions" value={formatCompactNum(stats.impressions)} />
         </div>

         <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-full sm:w-fit border border-slate-200">
            <button onClick={() => setView('campaigns')} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all ${view === 'campaigns' ? 'bg-white text-brand-600 shadow-md' : 'text-slate-500'}`}><LayoutGrid size={16} /> Campaign Summary</button>
            <button onClick={() => setView('targets')} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all ${view === 'targets' ? 'bg-white text-brand-600 shadow-md' : 'text-slate-500'}`}><Target size={16} /> Target Analysis</button>
            <button onClick={() => setView('tactics')} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all ${view === 'tactics' ? 'bg-white text-brand-600 shadow-md' : 'text-slate-500'}`}><PieIcon size={16} /> Tactic Analysis</button>
         </div>

         <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50">
            {view === 'campaigns' && (
                <DataTable data={campaigns} columns={[
                { key: 'name', header: 'Campaign Name', sortable: true },
                { key: 'tactic', header: 'Tactic', sortable: true },
                { key: 'costType', header: 'Cost Type', sortable: true },
                { key: 'impressions', header: 'Impressions', align: 'right', sortable: true, render: r => formatCompactNum(r.impressions) },
                { key: 'clicks', header: 'Clicks', align: 'right', sortable: true, render: r => formatInt(r.clicks) },
                { key: 'ctr', header: 'CTR', align: 'right', sortable: true, render: r => formatPct(r.ctr) },
                { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend), align: 'right', sortable: true },
                { key: 'cpc', header: 'CPC', align: 'right', sortable: true, render: r => formatCurrency(r.cpc) },
                { key: 'orders', header: 'Orders', align: 'right', sortable: true, render: r => formatInt(r.orders) },
                { key: 'cvr', header: 'CVR', align: 'right', sortable: true, render: r => formatPct(r.cvr) },
                { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales), align: 'right', sortable: true },
                { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                { key: 'viewableImpressions', header: 'Viewable Impr.', render: r => formatCompactNum(r.viewableImpressions), align: 'right', sortable: true },
                ]} initialSortKey="spend" />
            )}
            {view === 'targets' && (
                <DataTable data={allTargets} columns={[
                    { key: 'expression', header: 'Targeting Expression', render: r => <span className="font-bold text-slate-900">{r.expression}</span>, sortable: true },
                    { key: 'tactic', header: 'Tactic', sortable: true },
                    { key: 'campaignName', header: 'Campaign', sortable: true },
                    { key: 'bid', header: 'Bid', render: r => formatCurrency(r.bid), align: 'right', sortable: true },
                    { key: 'impressions', header: 'Impressions', align: 'right', sortable: true, render: r => formatCompactNum(r.impressions) },
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
            {view === 'tactics' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 w-full text-left">Spend by Tactic</h4>
                            <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={tacticData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="spend" nameKey="type">{tacticData.map((entry, index) => (<Cell key={`cell-${index}`} fill={TACTIC_COLORS[entry.type] || '#ccc'} stroke="none" />))}</Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value)} /><Legend verticalAlign="bottom" height={36} iconType="circle" /></PieChart></ResponsiveContainer></div>
                        </div>
                        <div className="lg:col-span-2">
                            <DataTable data={tacticData} columns={[
                                { key: 'type', header: 'Tactic', render: r => (<div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: TACTIC_COLORS[r.type] }}></div><span className="font-bold text-slate-900">{r.type}</span></div>), sortable: true },
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
         </div>
    </div>
  );
};
