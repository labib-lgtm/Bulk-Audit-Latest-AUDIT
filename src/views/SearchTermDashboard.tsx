
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DashboardData } from '../types';
import { MetricCard, SectionHeader, DataTable } from '../components/Widgets';
import { 
  Search, Check, X, Percent, Target, Tags, Globe, AlertCircle, Ban, FileDown, Sprout
} from 'lucide-react';
import * as XLSX from 'xlsx';

const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompactCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact", maximumFractionDigits: 1 }).format(val);
const formatCompactNum = (val: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(val);
const formatPct = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${(val * 100).toFixed(1)}%`;
};
const formatInt = (val: number) => Math.round(val).toLocaleString();
const formatNum = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const SearchTermDashboard: React.FC<{ data: DashboardData, targetType: 'SP' | 'SB' }> = ({ data, targetType }) => {
    const [currentTab, setCurrentTab] = useState<'summary' | 'ngram' | 'brand' | 'distribution' | 'wasted' | 'harvesting'>('summary');
    const [ngramSize, setNgramSize] = useState<1 | 2 | 3>(1);
    const [brandText, setBrandText] = useState('');
    
    // 1. Aggregated Search Term Data (Deduplicated by term)
    const aggregatedTerms = useMemo(() => {
        const map = new Map<string, any>();
        let totalSpend = 0;

        data.searchTerms.filter(t => t.type === targetType).forEach(t => {
            const term = t.customerSearchTerm || t.searchTerm;
            if (!term) return;

            if (!map.has(term)) {
                map.set(term, {
                    term,
                    // Keep one reference for IDs if possible, though aggregation makes this tricky. 
                    // We will prioritize the row with highest spend for ID reference if we need to export.
                    campaignId: t.campaignId, 
                    adGroupId: t.adGroupId,
                    impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0,
                    matchTypes: new Set<string>()
                });
            }
            const entry = map.get(term);
            entry.impressions += t.impressions;
            entry.clicks += t.clicks;
            entry.spend += t.spend;
            entry.sales += t.sales;
            entry.orders += t.orders;
            
            // If this row has more spend, update the ID references (heuristic for "main" source)
            if (t.spend > (entry.spend - t.spend)) {
                entry.campaignId = t.campaignId || entry.campaignId;
                entry.adGroupId = t.adGroupId || entry.adGroupId;
            }
            
            totalSpend += t.spend;

            // Normalize Match Type
            let mt = (t.matchType || '').toUpperCase();
            if (t.targeting && (t.targeting.includes('*') || t.targeting.toLowerCase().includes('auto') || t.targeting.includes('productType='))) {
                mt = 'AUTO';
            }
            if (t.matchType === '-' || !t.matchType) mt = 'AUTO'; // Fallback
            
            entry.matchTypes.add(mt);
        });

        return Array.from(map.values()).map(x => ({
            ...x,
            spendShare: safeDiv(x.spend, totalSpend),
            acos: safeDiv(x.spend, x.sales),
            roas: safeDiv(x.sales, x.spend),
            ctr: safeDiv(x.clicks, x.impressions),
            cpc: safeDiv(x.spend, x.clicks),
            cvr: safeDiv(x.orders, x.clicks),
            isExact: x.matchTypes.has('EXACT'),
            isPhrase: x.matchTypes.has('PHRASE'),
            isBroad: x.matchTypes.has('BROAD'),
            isAuto: x.matchTypes.has('AUTO') || x.matchTypes.has('TARGETING') // Catch-all for non-keywords
        }));
    }, [data.searchTerms, targetType]);

    // 2. N-Gram Analysis
    const ngramData = useMemo(() => {
        const map = new Map<string, any>();
        
        aggregatedTerms.forEach(term => {
             const words = term.term.toLowerCase().split(/\s+/).map((s: string) => s.replace(/[^a-z0-9]/g, ''));
             if (words.length < ngramSize) return;

             const grams = new Set<string>();
             for (let i = 0; i <= words.length - ngramSize; i++) {
                 grams.add(words.slice(i, i + ngramSize).join(' '));
             }

             grams.forEach(gram => {
                 if (!gram) return;
                 if (!map.has(gram)) {
                     map.set(gram, { gram, count: 0, spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0 });
                 }
                 const entry = map.get(gram);
                 entry.count += 1;
                 entry.spend += term.spend;
                 entry.sales += term.sales;
                 entry.orders += term.orders;
                 entry.clicks += term.clicks;
                 entry.impressions += term.impressions;
             });
        });

        return Array.from(map.values()).map(x => ({
            ...x,
            acos: safeDiv(x.spend, x.sales),
            roas: safeDiv(x.sales, x.spend),
            cpc: safeDiv(x.spend, x.clicks),
            cvr: safeDiv(x.orders, x.clicks),
            ctr: safeDiv(x.clicks, x.impressions)
        })).sort((a, b) => b.spend - a.spend);
    }, [aggregatedTerms, ngramSize]);

    // 3. Branded vs Non-Branded
    const brandData = useMemo(() => {
        if (!brandText.trim()) return null;
        const brandTerms = brandText.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        
        const brandedList: any[] = [];
        const nonBrandedList: any[] = [];
        const brandedStats = { spend: 0, sales: 0, orders: 0, clicks: 0, count: 0 };
        const nonBrandedStats = { spend: 0, sales: 0, orders: 0, clicks: 0, count: 0 };

        aggregatedTerms.forEach(t => {
            const isBranded = brandTerms.some(bt => t.term.toLowerCase().includes(bt));
            const bucket = isBranded ? brandedStats : nonBrandedStats;
            const list = isBranded ? brandedList : nonBrandedList;
            
            bucket.spend += t.spend;
            bucket.sales += t.sales;
            bucket.orders += t.orders;
            bucket.clicks += t.clicks;
            bucket.count += 1;
            
            list.push(t);
        });

        return {
            branded: { ...brandedStats, roas: safeDiv(brandedStats.sales, brandedStats.spend), acos: safeDiv(brandedStats.spend, brandedStats.sales), list: brandedList },
            nonBranded: { ...nonBrandedStats, roas: safeDiv(nonBrandedStats.sales, nonBrandedStats.spend), acos: safeDiv(nonBrandedStats.spend, nonBrandedStats.sales), list: nonBrandedList }
        };
    }, [aggregatedTerms, brandText]);

    // 4. Distribution Data (ACOS buckets)
    const distributionData = useMemo(() => {
        const buckets: Record<string, any> = {
            '0-10%': { range: '0-10%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '10-20%': { range: '10-20%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '20-30%': { range: '20-30%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '30-40%': { range: '30-40%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '40-60%': { range: '40-60%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '60-80%': { range: '60-80%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '80-100%': { range: '80-100%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '>100%': { range: '>100%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
        };

        let totalSpend = 0;

        aggregatedTerms.forEach(t => {
            if (t.sales === 0) return;
            
            const acos = t.spend / t.sales;
            let key = '>100%';
            if (acos <= 0.1) key = '0-10%';
            else if (acos <= 0.2) key = '10-20%';
            else if (acos <= 0.3) key = '20-30%';
            else if (acos <= 0.4) key = '30-40%';
            else if (acos <= 0.6) key = '40-60%';
            else if (acos <= 0.8) key = '60-80%';
            else if (acos <= 1.0) key = '80-100%';
            
            buckets[key].count++;
            buckets[key].spend += t.spend;
            buckets[key].sales += t.sales;
            buckets[key].orders += t.orders;
            buckets[key].clicks += t.clicks;
            
            totalSpend += t.spend;
        });

        return Object.values(buckets).map((b: any) => ({
            ...b,
            spendShare: safeDiv(b.spend, totalSpend),
            cpc: safeDiv(b.spend, b.clicks),
            cvr: safeDiv(b.orders, b.clicks),
            acos: safeDiv(b.spend, b.sales)
        }));
    }, [aggregatedTerms]);

    // 5. CVR Distribution Logic (Orders / Clicks)
    const cvrDistributionData = useMemo(() => {
        const buckets: Record<string, any> = {
            '0%': { range: '0% (No Sales)', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '0.1-2%': { range: '0.1-2%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '2-5%': { range: '2-5%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '5-10%': { range: '5-10%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '10-20%': { range: '10-20%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '20-40%': { range: '20-40%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
            '>40%': { range: '>40%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
        };

        let totalSpend = 0;

        aggregatedTerms.forEach(t => {
            if (t.clicks === 0) return;
            const cvr = t.orders / t.clicks;
            let key = '>40%';
            
            if (cvr === 0) key = '0%';
            else if (cvr <= 0.02) key = '0.1-2%';
            else if (cvr <= 0.05) key = '2-5%';
            else if (cvr <= 0.10) key = '5-10%';
            else if (cvr <= 0.20) key = '10-20%';
            else if (cvr <= 0.40) key = '20-40%';

            buckets[key].count++;
            buckets[key].spend += t.spend;
            buckets[key].sales += t.sales;
            buckets[key].orders += t.orders;
            buckets[key].clicks += t.clicks;
            totalSpend += t.spend;
        });

        return Object.values(buckets).map((b: any) => ({
            ...b,
            spendShare: safeDiv(b.spend, totalSpend),
            cpc: safeDiv(b.spend, b.clicks),
            cvr: safeDiv(b.orders, b.clicks),
            acos: safeDiv(b.spend, b.sales)
        }));
    }, [aggregatedTerms]);

    // 6. Wasted Spend Terms
    const wastedTerms = useMemo(() => {
        return aggregatedTerms.filter(t => t.orders === 0 && t.clicks > 20).sort((a,b) => b.spend - a.spend);
    }, [aggregatedTerms]);

    // 7. Harvesting Candidates (Auto terms with sales that aren't exact yet)
    // Note: In a real scenario, we'd cross-reference with existing Exact keywords. 
    // Here we check if `isExact` is false but performance is good.
    const harvestingCandidates = useMemo(() => {
        return aggregatedTerms
            .filter(t => !t.isExact && t.orders >= 2 && t.acos < 0.40) // Configurable thresholds: >2 orders, healthy ACOS
            .sort((a, b) => b.sales - a.sales);
    }, [aggregatedTerms]);

    const handleExportNegatives = () => {
        // Filter terms that actually have Campaign ID (needed for bulk upload)
        const validTerms = wastedTerms.filter(t => t.campaignId && t.adGroupId);
        
        if (validTerms.length === 0) {
            alert("Cannot export: Missing Campaign/Ad Group IDs in data source.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(validTerms.map(t => ({
             'Campaign Id': t.campaignId,
             'Ad Group Id': t.adGroupId,
             'Entity': 'Negative Keyword',
             'Keyword Text': t.term,
             'Match Type': 'Negative Exact',
             'State': 'Enabled',
             'Operation': 'Create'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bulk_Negatives");
        XLSX.writeFile(wb, "Lynx_Negative_Keywords_Bulk_Upload.xlsx");
    };

    const CheckIcon = () => <div className="flex justify-center"><Check size={16} className="text-emerald-500" strokeWidth={3} /></div>;
    const CrossIcon = () => <div className="flex justify-center"><X size={16} className="text-muted-foreground/30" strokeWidth={3} /></div>;

    // Define the specific columns requested
    const summaryColumns = [
        { key: 'term', header: 'Search Term', render: (r: any) => <span className="font-bold text-foreground">{r.term}</span>, sortable: true },
        { key: 'impressions', header: 'Impressions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.impressions) },
        { key: 'clicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.clicks) },
        { key: 'ctr', header: 'CTR %', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.ctr) },
        { key: 'cpc', header: 'CPC', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.cpc) },
        { key: 'spend', header: 'Spend', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.spend) },
        { key: 'spendShare', header: '% Spend', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.spendShare) },
        { key: 'orders', header: 'Orders', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.orders) },
        { key: 'cvr', header: 'CVR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.cvr) },
        { key: 'sales', header: 'Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.sales) },
        { key: 'acos', header: 'ACOS %', align: 'right' as const, sortable: true, render: (r: any) => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span> },
        { key: 'roas', header: 'ROAS', align: 'right' as const, sortable: true, render: (r: any) => formatNum(r.roas) },
        { key: 'isExact', header: 'EXACT', align: 'center' as const, render: (r: any) => r.isExact ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isPhrase', header: 'PHRASE', align: 'center' as const, render: (r: any) => r.isPhrase ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isBroad', header: 'BROAD', align: 'center' as const, render: (r: any) => r.isBroad ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isAuto', header: 'AUTO/PAT', align: 'center' as const, render: (r: any) => r.isAuto ? <CheckIcon /> : <CrossIcon /> },
    ];

    const distributionColumns = [
        { key: 'range', header: 'Range', render: (r: any) => <span className="font-bold text-foreground">{r.range}</span> },
        { key: 'spendShare', header: '% Spend', align: 'right' as const, render: (r: any) => formatPct(r.spendShare) },
        { key: 'spend', header: 'Spend', align: 'right' as const, render: (r: any) => formatCurrency(r.spend) },
        { key: 'sales', header: 'Sales', align: 'right' as const, render: (r: any) => formatCurrency(r.sales) },
        { key: 'orders', header: 'Orders', align: 'right' as const, render: (r: any) => formatInt(r.orders) },
        { key: 'clicks', header: 'Clicks', align: 'right' as const, render: (r: any) => formatInt(r.clicks) },
        { key: 'cpc', header: 'CPC', align: 'right' as const, render: (r: any) => formatCurrency(r.cpc) },
        { key: 'cvr', header: 'CVR', align: 'right' as const, render: (r: any) => formatPct(r.cvr) },
        { key: 'acos', header: 'ACOS', align: 'right' as const, render: (r: any) => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span> },
    ];

    const wastedColumns = [
        { key: 'term', header: 'Inefficient Search Term', render: (r: any) => <span className="font-bold text-foreground">{r.term}</span>, sortable: true },
        { key: 'spend', header: 'Wasted Spend', align: 'right' as const, sortable: true, render: (r: any) => <span className="text-rose-600 font-bold">{formatCurrency(r.spend)}</span> },
        { key: 'clicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.clicks) },
        { key: 'cpc', header: 'CPC', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.cpc) },
        { key: 'impressions', header: 'Impressions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.impressions) },
        { key: 'ctr', header: 'CTR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.ctr) },
        { key: 'isExact', header: 'EXACT', align: 'center' as const, render: (r: any) => r.isExact ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isPhrase', header: 'PHRASE', align: 'center' as const, render: (r: any) => r.isPhrase ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isBroad', header: 'BROAD', align: 'center' as const, render: (r: any) => r.isBroad ? <CheckIcon /> : <CrossIcon /> },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-24">
            <SectionHeader title={`${targetType === 'SP' ? 'Sponsored Products' : 'Sponsored Brands'} Search Terms`} description="Deep dive into customer search queries, match types, and wasted spend." />
            
            {/* Tabs - Updated for Responsiveness */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-muted rounded-2xl w-full sm:w-fit border border-border">
                {[
                  { id: 'summary', label: 'Search Term Summary' },
                  { id: 'harvesting', label: 'Harvesting Candidates' },
                  { id: 'ngram', label: 'N-Gram Analysis' },
                  { id: 'brand', label: 'Branded vs Non-Branded' },
                  { id: 'distribution', label: 'Performance Distribution' },
                  { id: 'wasted', label: 'Wasted Spend' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)} 
                    className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap justify-center flex items-center gap-2 ${
                      currentTab === tab.id 
                        ? (tab.id === 'wasted' ? 'bg-card text-rose-600 shadow-md' : tab.id === 'harvesting' ? 'bg-card text-emerald-600 shadow-md' : 'bg-card text-brand-600 shadow-md') 
                        : (tab.id === 'wasted' ? 'text-muted-foreground hover:text-rose-600' : tab.id === 'harvesting' ? 'text-muted-foreground hover:text-emerald-600' : 'text-muted-foreground hover:text-foreground')
                    }`}
                  >
                    {tab.id === 'harvesting' && <Sprout size={14} />}
                    {tab.label}
                  </button>
                ))}
            </div>

            <div className="bg-muted/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/50 min-h-[500px]">
                
                {/* 1. SUMMARY TAB */}
                {currentTab === 'summary' && (
                    <div className="space-y-4">
                        <DataTable data={aggregatedTerms} columns={summaryColumns} initialSortKey="spend" fileName="Lynx_SearchTerms" />
                    </div>
                )}

                {/* 1.5 HARVESTING TAB */}
                {currentTab === 'harvesting' && (
                    <div className="space-y-6">
                        <div className="bg-emerald-950/50 border border-emerald-800/50 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-emerald-400 font-bold text-lg mb-2 flex items-center gap-2">
                                    <Sprout className="w-5 h-5" />
                                    Search Term Harvesting
                                </h3>
                                <p className="text-emerald-300/80 text-sm mb-4 sm:mb-0">
                                    The following search terms have generated <strong className="text-emerald-400">2+ orders</strong> with healthy ACOS but are <strong className="text-emerald-400">not</strong> targeted as Exact Match yet. 
                                    Create new Manual Exact targets for these to scale performance.
                                </p>
                            </div>
                        </div>

                        <DataTable data={harvestingCandidates} columns={[
                            { key: 'term', header: 'High Performing Search Term', render: (r: any) => <span className="font-bold text-foreground">{r.term}</span>, sortable: true },
                            { key: 'orders', header: 'Orders', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.orders) },
                            { key: 'sales', header: 'Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.sales) },
                            { key: 'spend', header: 'Spend', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.spend) },
                            { key: 'acos', header: 'ACOS', align: 'right' as const, sortable: true, render: (r: any) => <span className="font-bold text-emerald-500">{formatPct(r.acos)}</span> },
                            { key: 'roas', header: 'ROAS', align: 'right' as const, sortable: true, render: (r: any) => formatNum(r.roas) },
                            { key: 'cvr', header: 'CVR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.cvr) },
                            { key: 'clicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.clicks) },
                            { key: 'impressions', header: 'Impressions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.impressions) },
                            { key: 'ctr', header: 'CTR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.ctr) },
                            { key: 'cpc', header: 'CPC', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.cpc) },
                        ]} initialSortKey="orders" fileName="Lynx_Harvesting_Candidates" />
                    </div>
                )}

                {/* 2. N-GRAM TAB */}
                {currentTab === 'ngram' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-muted-foreground">N-Gram Size:</span>
                            <div className="flex bg-card rounded-lg border border-border p-1">
                                {[1, 2, 3].map(n => (
                                    <button key={n} onClick={() => setNgramSize(n as 1|2|3)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${ngramSize === n ? 'bg-brand-400 text-background shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}>{n}-Word</button>
                                ))}
                            </div>
                        </div>
                        <DataTable data={ngramData} columns={[
                            { key: 'gram', header: 'N-Gram Phrase', render: (r: any) => <span className="font-bold text-foreground bg-muted px-2 py-1 rounded-md">{r.gram}</span>, sortable: true },
                            { key: 'count', header: 'Frequency', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.count) },
                            { key: 'spend', header: 'Spend', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.spend) },
                            { key: 'sales', header: 'Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.sales) },
                            { key: 'acos', header: 'ACOS', align: 'right' as const, sortable: true, render: (r: any) => <span className={r.acos > 0.4 ? 'text-rose-500 font-bold' : ''}>{formatPct(r.acos)}</span> },
                            { key: 'roas', header: 'ROAS', align: 'right' as const, sortable: true, render: (r: any) => formatNum(r.roas) },
                            { key: 'orders', header: 'Orders', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.orders) },
                            { key: 'clicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.clicks) },
                            { key: 'impressions', header: 'Impressions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.impressions) },
                            { key: 'cpc', header: 'CPC', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.cpc) },
                            { key: 'cvr', header: 'CVR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.cvr) },
                            { key: 'ctr', header: 'CTR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.ctr) },
                        ]} initialSortKey="spend" fileName="Lynx_NGrams" />
                    </div>
                )}

                {/* 3. BRANDED TAB */}
                {currentTab === 'brand' && (
                    <div className="space-y-6">
                         <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                             <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Define Brand Terms (Comma Separated)</label>
                             <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    value={brandText} 
                                    onChange={(e) => setBrandText(e.target.value)}
                                    placeholder="e.g. nike, adidas, puma"
                                    className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                             </div>
                             <p className="text-xs text-muted-foreground mt-2">Enter your brand name and misspellings to separate Branded vs Non-Branded performance.</p>
                         </div>
                         
                         {brandData ? (
                             <div className="space-y-8">
                                 {/* Summary Cards */}
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                     <div className="p-6 rounded-2xl border bg-indigo-950/50 border-indigo-800/50">
                                         <h4 className="text-lg font-heading font-bold mb-4 text-indigo-400">Branded Overview</h4>
                                         <div className="grid grid-cols-2 gap-y-4">
                                             <div><p className="text-xs uppercase font-bold text-indigo-400/60">Spend</p><p className="text-2xl font-bold text-foreground">{formatCompactCurrency(brandData.branded.spend)}</p></div>
                                             <div><p className="text-xs uppercase font-bold text-indigo-400/60">Sales</p><p className="text-2xl font-bold text-foreground">{formatCompactCurrency(brandData.branded.sales)}</p></div>
                                             <div><p className="text-xs uppercase font-bold text-indigo-400/60">ROAS</p><p className="text-2xl font-bold text-foreground">{formatNum(brandData.branded.roas)}</p></div>
                                             <div><p className="text-xs uppercase font-bold text-indigo-400/60">ACOS</p><p className="text-2xl font-bold text-foreground">{formatPct(brandData.branded.acos)}</p></div>
                                         </div>
                                     </div>
                                     <div className="p-6 rounded-2xl border bg-emerald-950/50 border-emerald-800/50">
                                         <h4 className="text-lg font-heading font-bold mb-4 text-emerald-400">Non-Branded Overview</h4>
                                         <div className="grid grid-cols-2 gap-y-4">
                                             <div><p className="text-xs uppercase font-bold text-emerald-400/60">Spend</p><p className="text-2xl font-bold text-foreground">{formatCompactCurrency(brandData.nonBranded.spend)}</p></div>
                                             <div><p className="text-xs uppercase font-bold text-emerald-400/60">Sales</p><p className="text-2xl font-bold text-foreground">{formatCompactCurrency(brandData.nonBranded.sales)}</p></div>
                                             <div><p className="text-xs uppercase font-bold text-emerald-400/60">ROAS</p><p className="text-2xl font-bold text-foreground">{formatNum(brandData.nonBranded.roas)}</p></div>
                                             <div><p className="text-xs uppercase font-bold text-emerald-400/60">ACOS</p><p className="text-2xl font-bold text-foreground">{formatPct(brandData.nonBranded.acos)}</p></div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Detailed Tables */}
                                 <div className="space-y-6">
                                    <div className="bg-card rounded-2xl border border-indigo-500/30 overflow-hidden">
                                        <div className="px-6 py-4 bg-indigo-500/10 border-b border-indigo-500/20">
                                            <h3 className="font-bold text-indigo-400 flex items-center gap-2"><Tags className="w-4 h-4" /> Branded Search Terms</h3>
                                        </div>
                                        <div className="p-4">
                                            <DataTable data={brandData.branded.list} columns={summaryColumns} initialSortKey="spend" fileName="Lynx_Branded_Terms" />
                                        </div>
                                    </div>

                                    <div className="bg-card rounded-2xl border border-emerald-500/30 overflow-hidden">
                                        <div className="px-6 py-4 bg-emerald-500/10 border-b border-emerald-500/20">
                                            <h3 className="font-bold text-emerald-400 flex items-center gap-2"><Globe className="w-4 h-4" /> Non-Branded Search Terms</h3>
                                        </div>
                                        <div className="p-4">
                                            <DataTable data={brandData.nonBranded.list} columns={summaryColumns} initialSortKey="spend" fileName="Lynx_NonBranded_Terms" />
                                        </div>
                                    </div>
                                 </div>
                             </div>
                         ) : (
                             <div className="text-center py-12 bg-muted rounded-2xl border border-dashed border-border text-muted-foreground font-medium">
                                 Enter brand terms above to see analysis.
                             </div>
                         )}
                    </div>
                )}

                {/* 4. DISTRIBUTION TAB */}
                {currentTab === 'distribution' && (
                    <div className="space-y-8">
                        {/* ACOS Distribution */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                                <Percent className="w-5 h-5 text-indigo-500" /> ACOS Distribution
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-card p-6 rounded-2xl border border-border">
                                    <h4 className="font-bold text-foreground mb-6">Spend by ACOS Range</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={distributionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="range" tick={{fontSize: 10, fill: 'hsl(var(--foreground))'}} />
                                                <YAxis tickFormatter={val => `$${val}`} tick={{fill: 'hsl(var(--foreground))'}} />
                                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                                                <Bar dataKey="spend" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spend" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-card p-6 rounded-2xl border border-border">
                                    <h4 className="font-bold text-foreground mb-6">Sales by ACOS Range</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={distributionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="range" tick={{fontSize: 10, fill: 'hsl(var(--foreground))'}} />
                                                <YAxis tickFormatter={val => `$${val}`} tick={{fill: 'hsl(var(--foreground))'}} />
                                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                                                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} name="Sales" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                             <DataTable data={distributionData} columns={distributionColumns} fileName="Lynx_ACOS_Distribution" />
                        </div>

                        {/* CVR Distribution */}
                        <div className="space-y-4 pt-8 border-t border-border">
                            <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                                <Target className="w-5 h-5 text-emerald-500" /> CVR Distribution
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-card p-6 rounded-2xl border border-border">
                                    <h4 className="font-bold text-foreground mb-6">Spend by CVR Range</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={cvrDistributionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="range" tick={{fontSize: 10, fill: 'hsl(var(--foreground))'}} />
                                                <YAxis tickFormatter={val => `$${val}`} tick={{fill: 'hsl(var(--foreground))'}} />
                                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                                                <Bar dataKey="spend" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Spend" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-card p-6 rounded-2xl border border-border">
                                    <h4 className="font-bold text-foreground mb-6">Sales by CVR Range</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={cvrDistributionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="range" tick={{fontSize: 10, fill: 'hsl(var(--foreground))'}} />
                                                <YAxis tickFormatter={val => `$${val}`} tick={{fill: 'hsl(var(--foreground))'}} />
                                                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} itemStyle={{ color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                                                <Bar dataKey="sales" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Sales" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                             <DataTable data={cvrDistributionData} columns={distributionColumns} fileName="Lynx_CVR_Distribution" />
                        </div>
                    </div>
                )}

                {/* 5. WASTED SPEND TAB */}
                {currentTab === 'wasted' && (
                    <div className="space-y-6">
                        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-rose-900 font-bold text-lg mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Wasted Ad Spend Detected
                                </h3>
                                <p className="text-rose-700 text-sm mb-4 sm:mb-0">
                                    The following search terms have <strong>0 orders</strong> but have accumulated <strong>over 20 clicks</strong>. 
                                    These are prime candidates for negative matching.
                                </p>
                            </div>
                            <button onClick={handleExportNegatives} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-lg shadow-rose-200/50 transition-all">
                                <FileDown size={16} /> Export Bulk File (Negatives)
                            </button>
                        </div>
                        
                        <div className="flex gap-8 mb-4 px-2">
                            <div>
                                <span className="text-xs uppercase font-bold text-rose-400">Total Wasted Spend</span>
                                <p className="text-2xl font-black text-rose-900">{formatCompactCurrency(wastedTerms.reduce((sum, t) => sum + t.spend, 0))}</p>
                            </div>
                            <div>
                                <span className="text-xs uppercase font-bold text-rose-400">Wasted Clicks</span>
                                <p className="text-2xl font-black text-rose-900">{formatCompactNum(wastedTerms.reduce((sum, t) => sum + t.clicks, 0))}</p>
                            </div>
                            <div>
                                <span className="text-xs uppercase font-bold text-rose-400">Term Count</span>
                                <p className="text-2xl font-black text-rose-900">{wastedTerms.length}</p>
                            </div>
                        </div>

                        <DataTable data={wastedTerms} columns={wastedColumns} initialSortKey="spend" fileName="Lynx_Wasted_Spend" />
                    </div>
                )}

            </div>
        </div>
    );
};
