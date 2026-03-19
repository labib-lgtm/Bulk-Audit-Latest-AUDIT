
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DashboardData } from '../types';
import { MetricCard, SectionHeader, DataTable } from '../components/Widgets';
import { PieChart as PieIcon, TrendingUp, Wallet, BarChart as BarChartIcon, TrendingDown, FileDown, AlertTriangle } from 'lucide-react';
import { ExportPreflightModal } from '../components/ExportPreflightModal';

const formatCurrency = (val: number, sym: string) => `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompactCurrency = (val: number, sym: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: sym === '$' ? 'USD' : (sym === '£' ? 'GBP' : 'EUR'), notation: "compact", maximumFractionDigits: 1 }).format(val);
const formatPct = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${(val * 100).toFixed(1)}%`;
};
const formatInt = (val: number) => Math.round(val).toLocaleString();
const formatNum = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export const PortfolioDashboard: React.FC<{ data: DashboardData; currencySymbol: string }> = ({ data, currencySymbol }) => {
  const [exportData, setExportData] = useState<{ rows: any[], rollback: any[], filename: string } | null>(null);

  const portfolioMetrics = useMemo(() => {
    const map = new Map<string, any>();
    
    // 1. Initialize from Portfolios definition (to get budgets/names)
    data.portfolios.forEach(p => {
      map.set(p.id, { 
          id: p.id,
          name: p.name, 
          budget: p.budgetAmount || 0,
          inBudget: p.inBudget,
          state: p.state,
          policy: p.budgetPolicy,
          spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0 
      });
    });
    
    // Add "Unassigned" bucket if not exists
    if (!map.has('null')) {
        map.set('null', { id: 'null', name: 'Unassigned', budget: 0, inBudget: true, state: 'N/A', spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0 });
    }

    // 2. Aggregate Campaign Data
    const process = (campaigns: any[]) => {
      campaigns.forEach(c => {
        const pid = c.portfolioId || 'null';
        if (!map.has(pid)) {
           // Handle case where campaign has a portfolio ID that isn't in the portfolio list
           map.set(pid, { id: pid, name: `Unknown (${pid})`, budget: 0, inBudget: true, state: 'N/A', spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0 });
        }
        const pf = map.get(pid);
        pf.spend += c.spend || 0;
        pf.sales += c.sales || 0;
        pf.orders += c.orders || 0;
        pf.clicks += c.clicks || 0;
        pf.impressions += c.impressions || 0;
      });
    };

    process(data.spCampaigns);
    process(data.sbCampaigns);
    process(data.sdCampaigns);

    // 3. Final Calculations & Budget Recommendations
    return Array.from(map.values()).map(p => {
      const acos = safeDiv(p.spend, p.sales);
      const utilization = p.budget > 0 ? safeDiv(p.spend, p.budget) : 0;
      
      let recommendation = 'Maintain';
      let recBudget = p.budget;
      let reason = '';

      if (p.budget > 0 && p.state === 'enabled') {
          if (acos < 0.25 && utilization > 0.8) {
              recommendation = 'Increase';
              recBudget = p.budget * 1.2;
              reason = `High Performance (ACOS ${formatPct(acos)}) + High Util.`;
          } else if (acos > 0.40) {
              recommendation = 'Decrease';
              recBudget = p.budget * 0.8;
              reason = `Low Efficiency (ACOS ${formatPct(acos)})`;
          }
      }

      return {
        ...p,
        acos,
        roas: safeDiv(p.sales, p.spend),
        cpc: safeDiv(p.spend, p.clicks),
        ctr: safeDiv(p.clicks, p.impressions),
        cvr: safeDiv(p.orders, p.clicks),
        utilization,
        recommendation,
        recBudget,
        reason
      };
    }).sort((a, b) => b.spend - a.spend);
  }, [data]);

  // Totals for Summary Cards
  const totals = useMemo(() => {
      return portfolioMetrics.reduce((acc, p) => ({
          spend: acc.spend + p.spend,
          sales: acc.sales + p.sales,
          budget: acc.budget + p.budget,
          activeCount: acc.activeCount + (p.state === 'enabled' ? 1 : 0)
      }), { spend: 0, sales: 0, budget: 0, activeCount: 0 });
  }, [portfolioMetrics]);

  // Chart Data: Top 10 by Spend
  const chartData = useMemo(() => {
      return portfolioMetrics.slice(0, 8);
  }, [portfolioMetrics]);

  // Handle Export
  const handleExportBudgets = () => {
      const actionable = portfolioMetrics.filter(p => p.recommendation !== 'Maintain');
      
      if (actionable.length === 0) {
          alert("No budget recommendations available.");
          return;
      }

      const primary = actionable.map(p => ({
          'Portfolio ID': p.id,
          'Entity': 'Portfolio',
          'Budget Amount': Math.round(p.recBudget),
          'Budget Policy': p.policy, // Required to update
          'Operation': 'Update',
          'Comment': `Lynx Rec: ${p.recommendation} (${p.reason})`
      }));

      const rollback = actionable.map(p => ({
          'Portfolio ID': p.id,
          'Entity': 'Portfolio',
          'Budget Amount': p.budget,
          'Budget Policy': p.policy,
          'Operation': 'Update',
          'Comment': 'Rollback Budget'
      }));

      setExportData({
          rows: primary,
          rollback: rollback,
          filename: "Lynx_Portfolio_Budgets"
      });
  };

  const columns = [
     { key: 'name', header: 'Portfolio Name', sortable: true, render: (r: any) => <span className="font-bold text-slate-700 dark:text-zinc-100">{r.name}</span> },
     { key: 'state', header: 'Status', sortable: true, render: (r: any) => (
         <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${r.state === 'enabled' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
             {r.state}
         </span>
     )},
     { key: 'spend', header: 'Spend', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.spend, currencySymbol) },
     { key: 'sales', header: 'Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.sales, currencySymbol) },
     { key: 'roas', header: 'ROAS', align: 'right' as const, sortable: true, render: (r: any) => <span className={r.roas > 4 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>{formatNum(r.roas)}</span> },
     { key: 'acos', header: 'ACOS', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.acos) },
     { key: 'utilization', header: 'Budget Util.', align: 'right' as const, sortable: true, render: (r: any) => r.budget > 0 ? (
        <div className="flex flex-col items-end">
            <span className={`text-xs font-bold ${r.utilization > 1 ? 'text-rose-600 dark:text-rose-400' : r.utilization > 0.9 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-zinc-400'}`}>{formatPct(r.utilization)}</span>
            <div className="w-16 h-1.5 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${r.utilization > 1 ? 'bg-rose-500' : r.utilization > 0.9 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(r.utilization * 100, 100)}%` }}></div>
            </div>
        </div>
     ) : <span className="text-slate-300 dark:text-zinc-600">-</span> },
     { key: 'recommendation', header: 'Budget Action', align: 'right' as const, sortable: true, render: (r: any) => (
         <div className="flex items-center justify-end gap-2">
             {r.recommendation === 'Increase' && <TrendingUp size={14} className="text-emerald-500" />}
             {r.recommendation === 'Decrease' && <TrendingDown size={14} className="text-rose-500" />}
             <span className={`text-xs font-bold uppercase ${r.recommendation === 'Increase' ? 'text-emerald-600' : r.recommendation === 'Decrease' ? 'text-rose-600' : 'text-slate-400'}`}>
                 {r.recommendation}
             </span>
         </div>
     )}
  ];

  return (
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
          {exportData && (
              <ExportPreflightModal 
                  isOpen={!!exportData}
                  onClose={() => setExportData(null)}
                  data={exportData.rows}
                  rollbackData={exportData.rollback}
                  filename={exportData.filename}
              />
          )}

          <SectionHeader title="Portfolio Performance" description="Budget allocation and efficiency analysis by portfolio." />
          
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Spend" value={formatCompactCurrency(totals.spend, currencySymbol)} subValue={formatCurrency(totals.spend, currencySymbol)} />
              <MetricCard title="Total Sales" value={formatCompactCurrency(totals.sales, currencySymbol)} subValue={formatCurrency(totals.sales, currencySymbol)} />
              <MetricCard title="Total Budget" value={formatCompactCurrency(totals.budget, currencySymbol)} subValue={`${totals.activeCount} Active Portfolios`} />
              <MetricCard title="Blended ROAS" value={formatNum(safeDiv(totals.sales, totals.spend))} subValue={`ACOS: ${formatPct(safeDiv(totals.spend, totals.sales))}`} />
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                        <Wallet className="w-5 h-5" /> Budget Optimization
                    </h3>
                    <p className="text-sm text-indigo-800 dark:text-indigo-400 mt-1">
                        Identify portfolios needing more budget (High ROAS + High Util) vs waste reduction (Low ROAS).
                    </p>
                </div>
                <button 
                    onClick={handleExportBudgets} 
                    className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 dark:shadow-none transition-all"
                >
                    <FileDown size={16} /> Export Budget Updates
                </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Spend Mix Pie Chart */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
                  <h4 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2 mb-6 text-slate-900 dark:text-zinc-100">
                    <PieChartIcon className="w-4 h-4 text-indigo-500" /> Spend Allocation
                  </h4>
                  <div className="flex-1 min-h-[250px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie 
                                data={chartData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="spend"
                              >
                                  {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                              </Pie>
                              <RechartsTooltip formatter={(val: number) => formatCurrency(val, currencySymbol)} />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Top 8</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">Portfolios</span>
                      </div>
                  </div>
              </div>

              {/* Spend vs Sales Bar Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col">
                   <h4 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2 mb-6 text-slate-900 dark:text-zinc-100">
                    <BarChartIcon className="w-4 h-4 text-emerald-500" /> Spend vs. Sales (Top Portfolios)
                  </h4>
                  <div className="flex-1 min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} tickFormatter={(val) => val.length > 15 ? val.substring(0,15)+'...' : val} />
                              <YAxis tickFormatter={(val) => `${currencySymbol}${val}`} tick={{fontSize: 11}} />
                              <RechartsTooltip formatter={(val: number) => formatCurrency(val, currencySymbol)} cursor={{fill: 'transparent'}} />
                              <Legend iconType="circle" />
                              <Bar dataKey="spend" name="Spend" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                              <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>

          <DataTable data={portfolioMetrics} columns={columns} initialSortKey="spend" />
      </div>
  );
};

const PieChartIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
);
