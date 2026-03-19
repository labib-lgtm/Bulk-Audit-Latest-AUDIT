
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DashboardData } from '../types';
import { MetricCard, SectionHeader, DataTable } from '../components/Widgets';
import { LayoutGrid, Target, PieChart as PieIcon, Monitor, Search, Calculator, ArrowRight, FileDown, TrendingUp, Filter, ChevronDown, X } from 'lucide-react';
import { ExportPreflightModal } from '../components/ExportPreflightModal';

const formatCurrency = (val: number, sym: string) => `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export const SPDashboard: React.FC<{ data: DashboardData; currencySymbol: string }> = ({ data, currencySymbol }) => {
  const [view, setView] = useState<'campaigns' | 'targets' | 'matchTypes' | 'placements'>('campaigns');
  const [selectedMetric, setSelectedMetric] = useState<string>('Spend');
  const [searchTerm, setSearchTerm] = useState('');
  const [placementCampaignFilter, setPlacementCampaignFilter] = useState<string | null>(null);
  const [exportData, setExportData] = useState<{ rows: any[], rollback: any[], filename: string } | null>(null);
  
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

  // List of campaigns that have placement data for the dropdown
  const campaignsWithPlacement = useMemo(() => {
      const campIds = new Set(data.spPlacements.map(p => p.campaignId));
      return data.spCampaigns
          .filter(c => campIds.has(c.campaignId))
          .sort((a,b) => b.spend - a.spend);
  }, [data.spPlacements, data.spCampaigns]);

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
      'Amazon Business': { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 },
    };
    data.spPlacements.forEach(p => {
        // If a campaign filter is active, only show that campaign's placement data
        if (placementCampaignFilter) {
            if (p.campaignId !== placementCampaignFilter) return;
        } else {
            // Otherwise show all visible campaigns
            if (!visibleCampaignIds.has(p.campaignId)) return;
        }

        let name = p.placement;
        if (name.includes('Top of Search')) name = 'Top of Search (First Page)';
        else if (name.includes('Product Pages')) name = 'Product Pages';
        else if (name.includes('Rest of Search')) name = 'Rest of Search';
        else if (name.includes('Amazon Business')) name = 'Amazon Business';
        
        if (!stats[name]) stats[name] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0, count: 0 };
        stats[name].spend += p.spend;
        stats[name].sales += p.sales;
        stats[name].clicks += p.clicks;
        stats[name].impressions += p.impressions;
        stats[name].orders += p.orders;
        stats[name].count++;
    });
    const totalSpend = Object.values(stats).reduce((acc, curr) => acc + curr.spend, 0);
    return Object.entries(stats).filter(([_, d]) => d.spend > 0 || d.impressions > 0).map(([placement, d]) => {
        const cvr = safeDiv(d.orders, d.clicks);
        return {
            placement, ...d, acos: safeDiv(d.spend, d.sales), roas: safeDiv(d.sales, d.spend), cpc: safeDiv(d.spend, d.clicks), ctr: safeDiv(d.clicks, d.impressions), cvr, spendShare: safeDiv(d.spend, totalSpend)
        };
    }).sort((a, b) => b.spend - a.spend);
  }, [data.spPlacements, visibleCampaignIds, placementCampaignFilter]);

  // Phase 2: Placement Modifier Calculator Logic (Reactive to Filter)
  const calcLogic = useMemo(() => {
      const tos = placementData.find(p => p.placement === 'Top of Search (First Page)');
      const pp = placementData.find(p => p.placement === 'Product Pages');
      const ros = placementData.find(p => p.placement === 'Rest of Search');
      
      const tosCvr = tos?.cvr || 0;
      const ppCvr = pp?.cvr || 0;
      const rosCvr = ros?.cvr || 0;
      
      const baseCvr = Math.max(rosCvr, ppCvr); 
      const tosRatio = baseCvr > 0 ? tosCvr / baseCvr : 0;
      const tosModifier = Math.max(0, Math.min(900, (tosRatio - 1) * 100));
      
      const ppRatio = rosCvr > 0 ? ppCvr / rosCvr : 0;
      const ppModifier = Math.max(0, Math.min(900, (ppRatio - 1) * 100));

      let baseBidAdjustment = 0;
      if (tosModifier > 50) baseBidAdjustment = -20;
      if (tosModifier > 100) baseBidAdjustment = -30;

      return { tosModifier, ppModifier, tosRatio, tosCvr, baseCvr, baseBidAdjustment };
  }, [placementData]);

  // Phase 4: Campaign Level Placement Optimization
  const campaignPlacementOptimizations = useMemo(() => {
      const map = new Map<string, { 
          id: string; 
          name: string; 
          tos: { spend: number, sales: number, orders: number, clicks: number, pct: number };
          ros: { spend: number, sales: number, orders: number, clicks: number };
      }>();

      data.spCampaigns.forEach(c => {
          if (!map.has(c.campaignId)) {
              map.set(c.campaignId, {
                  id: c.campaignId,
                  name: c.name,
                  tos: { spend: 0, sales: 0, orders: 0, clicks: 0, pct: 0 },
                  ros: { spend: 0, sales: 0, orders: 0, clicks: 0 }
              });
          }
      });

      data.spPlacements.forEach(p => {
          const c = map.get(p.campaignId);
          if (!c) return;
          const isTOS = p.placement.includes('Top of Search');
          if (isTOS) {
              c.tos.spend += p.spend;
              c.tos.sales += p.sales;
              c.tos.orders += p.orders;
              c.tos.clicks += p.clicks;
              c.tos.pct = p.percentage;
          } else {
              // Aggregate "Rest of Search" AND "Product Pages" into the baseline "Non-TOS" bucket
              c.ros.spend += p.spend;
              c.ros.sales += p.sales;
              c.ros.orders += p.orders;
              c.ros.clicks += p.clicks;
          }
      });

      return Array.from(map.values())
          .filter(c => c.tos.clicks >= 5 && c.ros.clicks >= 5) // Minimum data threshold for BOTH placements
          .map(c => {
              const tosRoas = safeDiv(c.tos.sales, c.tos.spend);
              const rosRoas = safeDiv(c.ros.sales, c.ros.spend);
              let recPct = c.tos.pct;
              let action = 'Maintain';
              
              if (tosRoas > (rosRoas * 1.3)) {
                  recPct = Math.min(900, c.tos.pct + 25);
                  action = 'Increase';
              } else if (tosRoas < (rosRoas * 0.7)) {
                  recPct = Math.max(0, c.tos.pct - 25);
                  action = 'Decrease';
              }

              return { ...c, tosRoas, rosRoas, recPct, action };
          })
          .filter(c => c.action !== 'Maintain')
          .sort((a,b) => b.tos.spend - a.tos.spend);
  }, [data.spCampaigns, data.spPlacements]);

  const handleExportPlacements = () => {
      const primary = campaignPlacementOptimizations.map(c => ({
          'Campaign Id': c.id,
          'Entity': 'Bidding Adjustment',
          'Placement': 'Top of Search (First Page)',
          'Percentage': c.recPct,
          'Operation': 'Update',
          'Comment': `Optimized from ${c.tos.pct}% based on performance`
      }));

      // Rollback: Revert to original percentage
      const rollback = campaignPlacementOptimizations.map(c => ({
          'Campaign Id': c.id,
          'Entity': 'Bidding Adjustment',
          'Placement': 'Top of Search (First Page)',
          'Percentage': c.tos.pct, // Original
          'Operation': 'Update',
          'Comment': `Rollback to Original Placement Pct`
      }));

      setExportData({
          rows: primary,
          rollback: rollback,
          filename: "Lynx_Placement_Optimizations"
      });
  };

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
      {exportData && (
          <ExportPreflightModal 
              isOpen={!!exportData}
              onClose={() => setExportData(null)}
              data={exportData.rows}
              rollbackData={exportData.rollback}
              filename={exportData.filename}
          />
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
        <SectionHeader title="Sponsored Products Intelligence" description="Operational PPC diagnostics and target analysis." />
        <div className="flex items-center gap-3 w-full lg:w-auto">
             <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={view === 'campaigns' ? "Search Campaigns..." : (view === 'placements' ? "Search Placements..." : "Search Keywords & Targets...")}
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
          {[{ id: 'campaigns', label: 'Campaign Summary', icon: LayoutGrid }, { id: 'targets', label: 'Target Analysis', icon: Target }, { id: 'matchTypes', label: 'Match Type Analysis', icon: PieIcon }, { id: 'placements', label: 'Placement Analysis', icon: Monitor }].map(t => (
            <button key={t.id} onClick={() => setView(t.id as any)} className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 text-sm font-bold rounded-xl transition-all flex-1 sm:flex-none justify-center ${view === t.id ? 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}>
                <t.icon size={16} />{t.label}
            </button>
          ))}
      </div>
      <div className="bg-slate-50/50 dark:bg-zinc-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-zinc-800/50">
        {view === 'campaigns' && <DataTable data={campaignTableData} columns={[
                { key: 'name', header: 'Campaign Name', sortable: true },
                { key: 'state', header: 'State', render: r => <span className={`uppercase text-[10px] font-bold px-2 py-1 rounded-full ${r.state === 'enabled' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>{r.state}</span> },
                { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend, currencySymbol), align: 'right', sortable: true },
                { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales, currencySymbol), align: 'right', sortable: true },
                { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                { key: 'acos', header: 'ACoS', render: r => formatPct(safeDiv(r.spend, r.sales)), align: 'right', sortable: true },
                { key: 'orders', header: 'Orders', align: 'right', sortable: true },
                { key: 'cpc', header: 'CPC', render: (r: any) => formatCurrency(safeDiv(r.spend, r.clicks), currencySymbol), align: 'right', sortable: true },
                { key: 'ctr', header: 'CTR', render: (r: any) => formatPct(safeDiv(r.clicks, r.impressions)), align: 'right', sortable: true },
        ]} initialSortKey="spend" />}
        {view === 'targets' && <DataTable data={allTargets} columns={[
                { key: 'text', header: 'Target / Keyword', render: (r: any) => (<div className="flex flex-col"><span className="font-bold text-slate-900 dark:text-zinc-100">{r.text}</span><span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">{r.type}</span></div>), sortable: true },
                { key: 'matchType', header: 'Match Type', render: r => { const color = MATCH_TYPE_COLORS[r.matchType] || MATCH_TYPE_COLORS['Other']; return (<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border`} style={{ backgroundColor: `${color}15`, color: color, borderColor: `${color}30` }}>{r.matchType}</span>); }, sortable: true },
                { key: 'campaignName', header: 'Campaign', sortable: true },
                { key: 'bid', header: 'Bid', render: r => formatCurrency(r.bid, currencySymbol), align: 'right', sortable: true },
                { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend, currencySymbol), align: 'right', sortable: true },
                { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales, currencySymbol), align: 'right', sortable: true },
                { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                { key: 'orders', header: 'Orders', align: 'right', sortable: true },
                { key: 'cvr', header: 'CVR', render: r => formatPct(r.cvr), align: 'right', sortable: true }
        ]} initialSortKey="spend" />}
        {view === 'matchTypes' && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-4 w-full text-left">Spend Distribution</h4>
                        <div className="w-full h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={matchTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="spend" nameKey="type">{matchTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={MATCH_TYPE_COLORS[entry.type] || '#ccc'} stroke="none" />))}</Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} /><Legend verticalAlign="bottom" height={36} iconType="circle" /></PieChart></ResponsiveContainer></div>
                    </div>
                    <div className="lg:col-span-2">
                         <DataTable data={matchTypeData} columns={[
                            { key: 'type', header: 'Match Type', render: r => (<div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: MATCH_TYPE_COLORS[r.type] }}></div><span className="font-bold text-slate-900 dark:text-zinc-100">{r.type}</span></div>), sortable: true },
                            { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend, currencySymbol), align: 'right', sortable: true },
                            { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales, currencySymbol), align: 'right', sortable: true },
                            { key: 'spendShare', header: '% Spend', render: r => formatPct(r.spendShare), align: 'right', sortable: true },
                            { key: 'acos', header: 'ACoS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                            { key: 'cvr', header: 'CVR', render: r => formatPct(r.cvr), align: 'right', sortable: true },
                            { key: 'cpc', header: 'CPC', render: r => formatCurrency(r.cpc, currencySymbol), align: 'right', sortable: true },
                            { key: 'count', header: 'Target Count', align: 'right', sortable: true },
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
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Placement Analysis Scope</h4>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                                {placementCampaignFilter ? 'Campaign Specific View' : 'Account Wide Average'}
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-80 group">
                        <select 
                            value={placementCampaignFilter || ''} 
                            onChange={(e) => setPlacementCampaignFilter(e.target.value || null)}
                            className="appearance-none w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-brand-500 transition-all pr-10 cursor-pointer"
                        >
                            <option value="">All Campaigns (Account Blended)</option>
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

                {/* Global Calculator (Reactive to Filter) */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 p-6 rounded-2xl">
                   <div className="flex flex-col lg:flex-row gap-8 items-center">
                        <div className="lg:w-1/3">
                            <h4 className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300 mb-2">
                                <Calculator className="w-5 h-5" /> 
                                {placementCampaignFilter ? 'Campaign-Specific Strategy' : 'Strategic Placement Optimizer'}
                            </h4>
                            <p className="text-xs text-indigo-800 dark:text-indigo-400 leading-relaxed mb-4">
                                {placementCampaignFilter 
                                    ? "Calculating optimal modifiers based purely on this campaign's historical placement performance." 
                                    : "Calculating blended account-wide modifiers. High variance across campaigns is expected."}
                            </p>
                            <div className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase">Baseline CVR</span><span className="text-sm font-black text-slate-800 dark:text-zinc-100">{formatPct(calcLogic.baseCvr)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase">TOS CVR</span><span className="text-sm font-black text-slate-800 dark:text-zinc-100">{formatPct(calcLogic.tosCvr)}</span></div>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowRight size={40} className="-rotate-45" /></div>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Recommended Top of Search</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">+{Math.round(calcLogic.tosModifier)}%</div>
                                <p className="text-[10px] text-slate-400 mt-2">Targeted boost to capture high-CVR real estate.</p>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><ArrowRight size={40} className="-rotate-45" /></div>
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Base Bid Adjustment</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{calcLogic.baseBidAdjustment}%</div>
                                <p className="text-[10px] text-slate-400 mt-2">Deflate bids to offset placement multiplier cost.</p>
                            </div>
                        </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-6">Efficiency vs Volume</h4>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={placementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="placement" tick={{fontSize: 10}} interval={0} tickFormatter={(val) => val.includes('(') ? val.split('(')[0] : val} />
                                    <YAxis yAxisId="left" tickFormatter={(val) => `${currencySymbol}${val}`} tick={{fontSize: 10}} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `${(val*100).toFixed(0)}%`} tick={{fontSize: 10}} />
                                    <RechartsTooltip formatter={(value: number) => typeof value === 'number' ? (value < 1 ? formatPct(value) : formatCurrency(value, currencySymbol)) : value} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="spend" name="Spend" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar yAxisId="right" dataKey="acos" name="ACOS" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col">
                         <h4 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-6">Conversion Strength</h4>
                         <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={placementData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="orders" nameKey="placement">
                                        {placementData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : (index === 1 ? '#6366f1' : '#f59e0b')} stroke="none" />))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>

                <DataTable data={placementData} columns={[
                    { key: 'placement', header: 'Placement', render: r => <span className="font-bold text-slate-900 dark:text-zinc-100">{r.placement}</span>, sortable: true },
                    { key: 'spend', header: 'Spend', render: r => formatCurrency(r.spend, currencySymbol), align: 'right', sortable: true },
                    { key: 'sales', header: 'Sales', render: r => formatCurrency(r.sales, currencySymbol), align: 'right', sortable: true },
                    { key: 'acos', header: 'ACOS', render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span>, align: 'right', sortable: true },
                    { key: 'roas', header: 'ROAS', render: r => formatNum(r.roas), align: 'right', sortable: true },
                    { key: 'cvr', header: 'CVR', render: r => <span className="font-bold">{formatPct(r.cvr)}</span>, align: 'right', sortable: true },
                    { key: 'cpc', header: 'CPC', render: r => formatCurrency(r.cpc, currencySymbol), align: 'right', sortable: true },
                    { key: 'ctr', header: 'CTR', render: r => formatPct(r.ctr), align: 'right', sortable: true },
                ]} initialSortKey="spend" />

                {/* Campaign Level Suggestions Section (Only if no filter is applied) */}
                {!placementCampaignFilter && (
                    <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-zinc-800">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold font-heading text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                    <TrendingUp className="text-emerald-500 w-5 h-5" /> Campaign Placement Optimizer
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-400">Identify campaigns where Top-of-Search performance significantly outperforms Rest-of-Search.</p>
                            </div>
                            <button 
                                onClick={handleExportPlacements}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200/50 transition-all active:scale-95"
                            >
                                <FileDown size={16} /> Export All Changes
                            </button>
                        </div>

                        <DataTable 
                            data={campaignPlacementOptimizations}
                            columns={[
                                { key: 'name', header: 'Campaign Name', sortable: true, render: (r: any) => <span className="font-bold text-slate-700 dark:text-zinc-200 text-xs">{r.name}</span> },
                                { key: 'tosRoas', header: 'TOS ROAS', align: 'right', sortable: true, render: (r: any) => <span className="text-emerald-600 font-bold">{formatNum(r.tosRoas)}</span> },
                                { key: 'rosRoas', header: 'ROS ROAS', align: 'right', sortable: true, render: (r: any) => formatNum(r.rosRoas) },
                                { key: 'pct', header: 'Current %', align: 'right', render: (r: any) => `${r.tos.pct}%` },
                                { key: 'recPct', header: 'Target %', align: 'right', render: (r: any) => <span className="text-indigo-600 font-black">{r.recPct}%</span> },
                                { key: 'action', header: 'Action', align: 'center', render: (r: any) => (
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${r.action === 'Increase' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {r.action}
                                    </span>
                                )},
                            ]}
                            initialSortKey="tosRoas"
                        />
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
