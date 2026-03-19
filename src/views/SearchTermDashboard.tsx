
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { AppSettings, DashboardData, ATTRIBUTION_MULTIPLIERS } from '../types';
import { MetricCard, SectionHeader, DataTable } from '../components/Widgets';
import { 
  Search, Check, X, Percent, Target, Tags, Globe, AlertCircle, Ban, FileDown, Sprout, Cloud,
  ArrowRight, Copy, ChevronDown, ChevronUp, MousePointerClick, ShieldCheck, Download, History, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import * as XLSX from 'xlsx';

const formatCurrency = (val: number, sym: string) => `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompactCurrency = (val: number, sym: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: sym === '$' ? 'USD' : (sym === '£' ? 'GBP' : 'EUR'), notation: "compact", maximumFractionDigits: 1 }).format(val);
const formatCompactNum = (val: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(val);
const formatPct = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${(val * 100).toFixed(1)}%`;
};
const formatInt = (val: number) => Math.round(val).toLocaleString();
const formatNum = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

interface NegativeRec {
    term: string;
    type: 'Negative Exact' | 'Negative Phrase';
    reason: string;
    confidence: 'High' | 'Medium' | 'Low';
    spend: number;
    clicks: number;
    campaignId?: string;
    adGroupId?: string;
    campaignName?: string;
}

export const SearchTermDashboard: React.FC<{ data: DashboardData, previousData?: DashboardData | null, targetType: 'SP' | 'SB', currencySymbol: string; settings?: AppSettings }> = ({ data, previousData, targetType, currencySymbol, settings }) => {
    const [currentTab, setCurrentTab] = useState<'summary' | 'ngram' | 'cloud' | 'brand' | 'distribution' | 'wasted' | 'harvesting' | 'negatives' | 'lifecycle'>('summary');
    const [ngramSize, setNgramSize] = useState<1 | 2 | 3>(1);
    const [brandText, setBrandText] = useState('');
    const [selectedCloudGram, setSelectedCloudGram] = useState<string | null>(null);
    const [showExportPreview, setShowExportPreview] = useState(false);
    
    // Attribution Multiplier
    const multiplier = settings 
        ? ATTRIBUTION_MULTIPLIERS[settings.attributionModel || 'Standard'][targetType] 
        : 1.0;

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
                    campaignName: t.campaignName,
                    impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0,
                    matchTypes: new Set<string>()
                });
            }
            const entry = map.get(term);
            entry.impressions += t.impressions;
            entry.clicks += t.clicks;
            entry.spend += t.spend;
            entry.sales += t.sales * multiplier;
            entry.orders += (t.orders || 0) * multiplier;
            
            // If this row has more spend, update the ID references (heuristic for "main" source)
            if (t.spend > (entry.spend - t.spend)) {
                entry.campaignId = t.campaignId || entry.campaignId;
                entry.adGroupId = t.adGroupId || entry.adGroupId;
                entry.campaignName = t.campaignName || entry.campaignName;
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
    }, [data.searchTerms, targetType, multiplier]);

    // 1.5 Lifecycle Analysis (Feature 3.4)
    const lifecycleData = useMemo(() => {
        if (!previousData) return [];

        const prevMap = new Map<string, number>();
        previousData.searchTerms.filter(t => t.type === targetType).forEach(t => {
            const term = t.customerSearchTerm || t.searchTerm;
            if (!term) return;
            prevMap.set(term, (prevMap.get(term) || 0) + (t.sales * multiplier));
        });

        return aggregatedTerms.map(t => {
            const prevSales = prevMap.get(t.term) || 0;
            const currentSales = t.sales;
            const delta = currentSales - prevSales;
            const pctChange = prevSales > 0 ? delta / prevSales : 1;

            let status = 'Stable';
            if (prevSales === 0 && currentSales > 0) status = 'New / Emerging';
            else if (pctChange > 0.5) status = 'Growing';
            else if (pctChange < -0.2) status = 'Declining';
            else if (currentSales === 0 && prevSales > 0) status = 'Lost';

            return {
                ...t,
                prevSales,
                salesDelta: delta,
                status
            };
        }).filter(t => t.status !== 'Stable' || t.spend > 50).sort((a,b) => b.salesDelta - a.salesDelta); // Show mostly movers
    }, [aggregatedTerms, previousData, multiplier, targetType]);

    // 2. N-Gram Analysis (Shared by List and Cloud)
    const ngramData = useMemo(() => {
        const map = new Map<string, any>();
        
        aggregatedTerms.forEach(term => {
             const words = term.term.toLowerCase().split(/\s+/).map(s => s.replace(/[^a-z0-9]/g, ''));
             if (words.length < ngramSize) return;

             const grams = new Set<string>();
             for (let i = 0; i <= words.length - ngramSize; i++) {
                 grams.add(words.slice(i, i + ngramSize).join(' '));
             }

             grams.forEach(gram => {
                 if (!gram) return;
                 if (!map.has(gram)) {
                     map.set(gram, { gram, count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 });
                 }
                 const entry = map.get(gram);
                 entry.count += 1;
                 entry.spend += term.spend;
                 entry.sales += term.sales;
                 entry.orders += term.orders;
                 entry.clicks += term.clicks;
             });
        });

        return Array.from(map.values()).map(x => ({
            ...x,
            acos: safeDiv(x.spend, x.sales),
            roas: safeDiv(x.sales, x.spend),
            cpc: safeDiv(x.spend, x.clicks),
            cvr: safeDiv(x.orders, x.clicks)
        })).sort((a, b) => b.spend - a.spend);
    }, [aggregatedTerms, ngramSize]);

    // 8. Negative Recommendations Engine (Feature C1)
    const negativeRecommendations = useMemo(() => {
        const recs: NegativeRec[] = [];

        // 8a. Negative Exact Candidates
        aggregatedTerms.forEach(t => {
            if (t.isExact) return; // Already exact match, maybe pause instead of negate?
            
            // Rule 1: Bleeder (Zero Sales)
            if (t.sales === 0 && t.clicks > 15) {
                recs.push({
                    term: t.term,
                    type: 'Negative Exact',
                    reason: 'Zero Sales (Bleeder)',
                    confidence: t.clicks > 30 ? 'High' : 'Medium',
                    spend: t.spend,
                    clicks: t.clicks,
                    campaignId: t.campaignId,
                    adGroupId: t.adGroupId,
                    campaignName: t.campaignName
                });
            }
            // Rule 2: Inefficient (High ACOS)
            else if (t.sales > 0 && t.acos > 1.2 && t.spend > 50) {
                recs.push({
                    term: t.term,
                    type: 'Negative Exact',
                    reason: `High ACOS (${formatPct(t.acos)})`,
                    confidence: t.spend > 100 ? 'High' : 'Medium',
                    spend: t.spend,
                    clicks: t.clicks,
                    campaignId: t.campaignId,
                    adGroupId: t.adGroupId,
                    campaignName: t.campaignName
                });
            }
        });

        // 8b. Negative Phrase Candidates (Using 1-gram data)
        // Improved logic: Iterate raw data to find ALL contributing campaigns/adgroups
        const badGramMap = new Map<string, { 
            spend: number, clicks: number, count: number, sales: number,
            contributions: Map<string, { campaignId: string, adGroupId: string, campaignName: string, spend: number, clicks: number }>
        }>();

        data.searchTerms.filter(t => t.type === targetType).forEach(t => {
            const termStr = t.customerSearchTerm || t.searchTerm || '';
            const words = termStr.split(/\s+/);
            const uniqueWords = new Set(words);
            
            uniqueWords.forEach((w: string) => {
                if (w.length < 3) return; // Skip small words
                if (!badGramMap.has(w)) {
                    badGramMap.set(w, { spend: 0, clicks: 0, count: 0, sales: 0, contributions: new Map() });
                }
                const entry = badGramMap.get(w)!;
                entry.spend += t.spend;
                entry.clicks += t.clicks;
                entry.sales += t.sales;
                entry.count += 1;

                // Track contribution per Ad Group
                if (t.campaignId && t.adGroupId) {
                    const key = t.adGroupId;
                    if (!entry.contributions.has(key)) {
                        entry.contributions.set(key, { 
                            campaignId: t.campaignId, 
                            adGroupId: t.adGroupId, 
                            campaignName: t.campaignName || `Campaign ${t.campaignId}`,
                            spend: 0,
                            clicks: 0
                        });
                    }
                    const contrib = entry.contributions.get(key)!;
                    contrib.spend += t.spend;
                    contrib.clicks += t.clicks;
                }
            });
        });

        badGramMap.forEach((stats, word) => {
            // Rule: Word appears in at least 3 distinct search terms, ZERO total sales, High Clicks
            if (stats.sales === 0 && stats.count >= 3 && stats.clicks > 25) {
                // Generate recommendations for the specific ad groups contributing to this waste
                stats.contributions.forEach((contrib) => {
                    // Filter out negligible contributions to avoid clutter
                    if (contrib.clicks >= 2 || contrib.spend > 5) {
                        recs.push({
                            term: word,
                            type: 'Negative Phrase',
                            reason: `Root "${word}" has 0 sales across ${stats.count} terms (${formatCurrency(stats.spend, currencySymbol)} total waste)`,
                            confidence: stats.clicks > 50 ? 'High' : 'Medium',
                            spend: contrib.spend,
                            clicks: contrib.clicks,
                            campaignId: contrib.campaignId,
                            adGroupId: contrib.adGroupId,
                            campaignName: contrib.campaignName
                        });
                    }
                });
            }
        });

        return recs.sort((a,b) => b.spend - a.spend);
    }, [aggregatedTerms, data.searchTerms, targetType, currencySymbol]);

    // 2.5 Detailed Data for Selected Cloud Gram
    const selectedGramDetails = useMemo(() => {
        if (!selectedCloudGram) return null;
        
        // Find all terms containing this gram
        const relatedTerms = aggregatedTerms.filter(t => t.term.toLowerCase().includes(selectedCloudGram.toLowerCase()));
        
        const stats = relatedTerms.reduce((acc, t) => ({
            spend: acc.spend + t.spend,
            sales: acc.sales + t.sales,
            orders: acc.orders + t.orders,
            clicks: acc.clicks + t.clicks,
            impressions: acc.impressions + t.impressions
        }), { spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0 });

        return {
            gram: selectedCloudGram,
            stats: {
                ...stats,
                acos: safeDiv(stats.spend, stats.sales),
                cpc: safeDiv(stats.spend, stats.clicks),
                ctr: safeDiv(stats.clicks, stats.impressions),
                cvr: safeDiv(stats.orders, stats.clicks)
            },
            terms: relatedTerms.sort((a,b) => b.spend - a.spend)
        };
    }, [selectedCloudGram, aggregatedTerms]);

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
            '>20%': { range: '>20%', count: 0, spend: 0, sales: 0, orders: 0, clicks: 0 },
        };

        let totalSpend = 0;

        aggregatedTerms.forEach(t => {
            if (t.clicks === 0) return;
            const cvr = t.orders / t.clicks;
            let key = '>20%';
            
            if (cvr === 0) key = '0%';
            else if (cvr <= 0.02) key = '0.1-2%';
            else if (cvr <= 0.05) key = '2-5%';
            else if (cvr <= 0.10) key = '5-10%';
            else if (cvr <= 0.20) key = '10-20%';

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

    const handleExportRecommendations = () => {
        // Only export rows with valid IDs
        const validRecs = negativeRecommendations.filter(r => r.campaignId && r.adGroupId);
        
        if (validRecs.length === 0) {
            alert("No actionable recommendations found with valid IDs.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(validRecs.map(r => ({
             'Campaign Id': r.campaignId,
             'Ad Group Id': r.adGroupId,
             'Entity': 'Negative Keyword',
             'Keyword Text': r.term,
             'Match Type': r.type === 'Negative Phrase' ? 'Negative Phrase' : 'Negative Exact',
             'State': 'Enabled',
             'Operation': 'Create',
             'Comment': `Lynx Rec: ${r.reason} (${r.confidence} Conf)`
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Lynx_Negatives_Export");
        XLSX.writeFile(wb, `Lynx_Negatives_Recs_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowExportPreview(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(`Copied "${text}" to clipboard!`);
    };

    const CheckIcon = () => <div className="flex justify-center"><Check size={16} className="text-emerald-500" strokeWidth={3} /></div>;
    const CrossIcon = () => <div className="flex justify-center"><X size={16} className="text-slate-200 dark:text-zinc-600" strokeWidth={3} /></div>;

    // Define the specific columns requested
    const summaryColumns = [
        { key: 'term', header: 'Search Term', render: (r: any) => <span className="font-bold text-slate-900 dark:text-zinc-100">{r.term}</span>, sortable: true },
        { key: 'impressions', header: 'Impressions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.impressions) },
        { key: 'clicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.clicks) },
        { key: 'ctr', header: 'CTR %', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.ctr) },
        { key: 'cpc', header: 'CPC', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.cpc, currencySymbol) },
        { key: 'spend', header: 'Spend', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.spend, currencySymbol) },
        { key: 'spendShare', header: '% Spend', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.spendShare) },
        { key: 'orders', header: 'Orders', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.orders) },
        { key: 'cvr', header: 'CVR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.cvr) },
        { key: 'sales', header: 'Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.sales, currencySymbol) },
        { key: 'acos', header: 'ACOS %', align: 'right' as const, sortable: true, render: (r: any) => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span> },
        { key: 'roas', header: 'ROAS', align: 'right' as const, sortable: true, render: (r: any) => formatNum(r.roas) },
        { key: 'isExact', header: 'EXACT', align: 'center' as const, render: (r: any) => r.isExact ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isPhrase', header: 'PHRASE', align: 'center' as const, render: (r: any) => r.isPhrase ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isBroad', header: 'BROAD', align: 'center' as const, render: (r: any) => r.isBroad ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isAuto', header: 'AUTO/PAT', align: 'center' as const, render: (r: any) => r.isAuto ? <CheckIcon /> : <CrossIcon /> },
    ];

    const distributionColumns = [
        { key: 'range', header: 'Range', render: (r: any) => <span className="font-bold text-slate-900 dark:text-zinc-100">{r.range}</span> },
        { key: 'spendShare', header: '% Spend', align: 'right' as const, render: (r: any) => formatPct(r.spendShare) },
        { key: 'spend', header: 'Spend', align: 'right' as const, render: (r: any) => formatCurrency(r.spend, currencySymbol) },
        { key: 'sales', header: 'Sales', align: 'right' as const, render: (r: any) => formatCurrency(r.sales, currencySymbol) },
        { key: 'orders', header: 'Orders', align: 'right' as const, render: (r: any) => formatInt(r.orders) },
        { key: 'clicks', header: 'Clicks', align: 'right' as const, render: (r: any) => formatInt(r.clicks) },
        { key: 'cpc', header: 'CPC', align: 'right' as const, render: (r: any) => formatCurrency(r.cpc, currencySymbol) },
        { key: 'cvr', header: 'CVR', align: 'right' as const, render: (r: any) => formatPct(r.cvr) },
        { key: 'acos', header: 'ACOS', align: 'right' as const, render: (r: any) => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span> },
    ];

    const wastedColumns = [
        { key: 'term', header: 'Inefficient Search Term', render: (r: any) => <span className="font-bold text-slate-900 dark:text-zinc-100">{r.term}</span>, sortable: true },
        { key: 'spend', header: 'Wasted Spend', align: 'right' as const, sortable: true, render: (r: any) => <span className="text-rose-600 font-bold">{formatCurrency(r.spend, currencySymbol)}</span> },
        { key: 'clicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.clicks) },
        { key: 'cpc', header: 'CPC', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.cpc, currencySymbol) },
        { key: 'impressions', header: 'Impressions', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.impressions) },
        { key: 'ctr', header: 'CTR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.ctr) },
        { key: 'isExact', header: 'EXACT', align: 'center' as const, render: (r: any) => r.isExact ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isPhrase', header: 'PHRASE', align: 'center' as const, render: (r: any) => r.isPhrase ? <CheckIcon /> : <CrossIcon /> },
        { key: 'isBroad', header: 'BROAD', align: 'center' as const, render: (r: any) => r.isBroad ? <CheckIcon /> : <CrossIcon /> },
    ];

    const recommendationColumns = [
        { key: 'term', header: 'Term / Root', sortable: true, render: (r: NegativeRec) => <span className="font-bold text-slate-800 dark:text-zinc-200">{r.term}</span> },
        { key: 'type', header: 'Suggestion', sortable: true, render: (r: NegativeRec) => (
            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${r.type === 'Negative Exact' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:border-fuchsia-800 dark:text-fuchsia-400'}`}>
                {r.type.toUpperCase()}
            </span>
        )},
        { key: 'confidence', header: 'Confidence', sortable: true, render: (r: NegativeRec) => (
            <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 w-fit ${r.confidence === 'High' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : r.confidence === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600'}`}>
                {r.confidence === 'High' && <ShieldCheck size={10} />} {r.confidence}
            </span>
        )},
        { key: 'reason', header: 'Rationale', render: (r: NegativeRec) => <span className="text-xs text-slate-500 dark:text-zinc-400">{r.reason}</span> },
        { key: 'spend', header: 'Est. Waste', align: 'right' as const, sortable: true, render: (r: NegativeRec) => <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(r.spend, currencySymbol)}</span> },
        { key: 'clicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: NegativeRec) => formatInt(r.clicks) },
        { key: 'campaignName', header: 'Impacted Campaign', sortable: true, render: (r: NegativeRec) => <span className="text-xs text-slate-400 dark:text-zinc-500 truncate max-w-[150px]" title={r.campaignName}>{r.campaignName || 'Multiple'}</span> }
    ];

    const lifecycleColumns = [
        { key: 'term', header: 'Search Term', sortable: true, render: (r: any) => <span className="font-bold text-slate-900 dark:text-zinc-100">{r.term}</span> },
        { key: 'status', header: 'Lifecycle Status', sortable: true, render: (r: any) => (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                r.status === 'New / Emerging' ? 'bg-emerald-100 border-emerald-200 text-emerald-700' :
                r.status === 'Growing' ? 'bg-indigo-100 border-indigo-200 text-indigo-700' :
                r.status === 'Declining' ? 'bg-rose-100 border-rose-200 text-rose-700' :
                'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
                {r.status}
            </span>
        )},
        { key: 'salesDelta', header: 'Sales Change', align: 'right' as const, sortable: true, render: (r: any) => (
            <div className={`flex items-center justify-end gap-1 ${r.salesDelta > 0 ? 'text-emerald-600' : r.salesDelta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {r.salesDelta > 0 ? <TrendingUp size={12} /> : r.salesDelta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                <span className="font-bold">{formatCurrency(Math.abs(r.salesDelta), currencySymbol)}</span>
            </div>
        )},
        { key: 'sales', header: 'Current Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.sales, currencySymbol) },
        { key: 'prevSales', header: 'Previous Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.prevSales, currencySymbol) },
        { key: 'acos', header: 'Current ACOS', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.acos) },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-24">
            <SectionHeader title={`${targetType === 'SP' ? 'Sponsored Products' : 'Sponsored Brands'} Search Terms`} description="Deep dive into customer search queries, match types, and wasted spend." />
            
            {/* Tabs - Updated for Responsiveness */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl w-full sm:w-fit border border-slate-200 dark:border-zinc-700">
                {[
                  { id: 'summary', label: 'Summary' },
                  { id: 'lifecycle', label: 'Lifecycle (New)', icon: History },
                  { id: 'negatives', label: 'Negative Recs' },
                  { id: 'harvesting', label: 'Harvesting' },
                  { id: 'ngram', label: 'N-Grams' },
                  { id: 'cloud', label: 'Cloud' }, 
                  { id: 'brand', label: 'Brand Split' },
                  { id: 'distribution', label: 'Distribution' },
                  { id: 'wasted', label: 'Wasted' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => { setCurrentTab(tab.id as any); setSelectedCloudGram(null); }} 
                    className={`flex-1 sm:flex-none px-4 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap justify-center flex items-center gap-2 ${
                      currentTab === tab.id 
                        ? (tab.id === 'wasted' || tab.id === 'negatives' ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-md' : tab.id === 'harvesting' || tab.id === 'lifecycle' ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-md' : 'bg-white dark:bg-zinc-900 text-brand-600 dark:text-brand-400 shadow-md') 
                        : (tab.id === 'wasted' || tab.id === 'negatives' ? 'text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400' : tab.id === 'harvesting' ? 'text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200')
                    }`}
                  >
                    {tab.id === 'harvesting' && <Sprout size={14} />}
                    {tab.id === 'cloud' && <Cloud size={14} />}
                    {tab.id === 'negatives' && <ShieldCheck size={14} />}
                    {tab.id === 'lifecycle' && <History size={14} />}
                    {tab.label}
                  </button>
                ))}
            </div>

            <div className="bg-slate-50/50 dark:bg-zinc-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-zinc-800/50 min-h-[500px]">
                
                {/* 1. SUMMARY TAB */}
                {currentTab === 'summary' && (
                    <div className="space-y-4">
                        <DataTable data={aggregatedTerms} columns={summaryColumns} initialSortKey="spend" fileName="Lynx_SearchTerms" />
                    </div>
                )}

                {/* 1.1 LIFECYCLE TAB (NEW) */}
                {currentTab === 'lifecycle' && (
                    <div className="space-y-6">
                        {!previousData ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700">
                                <History className="w-12 h-12 text-slate-300 dark:text-zinc-600 mb-4" />
                                <h3 className="font-bold text-slate-600 dark:text-zinc-400 text-lg">No Previous Data</h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-500">Upload a "Previous Period Bulk File" to see lifecycle trends.</p>
                            </div>
                        ) : (
                            <DataTable data={lifecycleData} columns={lifecycleColumns} initialSortKey="salesDelta" fileName="Lynx_SearchTerm_Lifecycle" />
                        )}
                    </div>
                )}

                {/* 1.2 NEGATIVE RECOMMENDATIONS TAB (NEW) */}
                {currentTab === 'negatives' && (
                    <div className="space-y-6">
                        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-rose-900 dark:text-rose-300 font-bold text-lg mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5" />
                                    Negative Keyword Recommendations
                                </h3>
                                <p className="text-rose-700 dark:text-rose-400 text-sm mb-4 sm:mb-0">
                                    AI-driven suggestions to reduce waste. 
                                    <strong> High Confidence</strong> suggestions have significant data ({'>'}30 clicks). 
                                    Review before exporting.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowExportPreview(true)} 
                                className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-lg shadow-rose-200/50 transition-all"
                            >
                                <FileDown size={16} /> Preview & Export Bulk File
                            </button>
                        </div>

                        {/* Export Preview Modal Overlay */}
                        {showExportPreview && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                                <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 flex flex-col max-h-[90vh]">
                                    <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                                        <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                            <FileDown size={20} className="text-rose-500" /> Export Preview
                                        </h3>
                                        <button onClick={() => setShowExportPreview(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 overflow-y-auto">
                                        <div className="bg-slate-50 dark:bg-zinc-800 p-4 rounded-xl mb-6 text-sm text-slate-600 dark:text-zinc-400">
                                            You are about to export <strong>{negativeRecommendations.length}</strong> negative keyword updates.
                                            <br/>
                                            Total Estimated Annualized Savings: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(negativeRecommendations.reduce((s,r)=>s+r.spend,0) * 12, currencySymbol)}</strong>
                                        </div>
                                        <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-500 mb-3 tracking-wider">Breakdown by Type</h4>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between items-center p-3 border border-slate-100 dark:border-zinc-700 rounded-lg">
                                                <span className="font-bold text-indigo-700 dark:text-indigo-400">Negative Exact</span>
                                                <span className="font-mono text-xs">{negativeRecommendations.filter(r => r.type === 'Negative Exact').length} terms</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 border border-slate-100 dark:border-zinc-700 rounded-lg">
                                                <span className="font-bold text-fuchsia-700 dark:text-fuchsia-400">Negative Phrase</span>
                                                <span className="font-mono text-xs">{negativeRecommendations.filter(r => r.type === 'Negative Phrase').length} terms</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3">
                                        <button onClick={() => setShowExportPreview(false)} className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
                                        <button onClick={handleExportRecommendations} className="px-6 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-lg shadow-rose-200/50 transition-colors flex items-center gap-2">
                                            <Download size={16} /> Download File
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DataTable 
                            data={negativeRecommendations} 
                            columns={recommendationColumns} 
                            initialSortKey="confidence" 
                            fileName="Lynx_Negative_Recs" 
                        />
                    </div>
                )}

                {/* 1.5 HARVESTING TAB */}
                {currentTab === 'harvesting' && (
                    <div className="space-y-6">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-emerald-900 dark:text-emerald-300 font-bold text-lg mb-2 flex items-center gap-2">
                                    <Sprout className="w-5 h-5" />
                                    Search Term Harvesting
                                </h3>
                                <p className="text-emerald-800 dark:text-emerald-400 text-sm mb-4 sm:mb-0">
                                    The following search terms have generated <strong>2+ orders</strong> with healthy ACOS but are <strong>not</strong> targeted as Exact Match yet. 
                                    Create new Manual Exact targets for these to scale performance.
                                </p>
                            </div>
                        </div>

                        <DataTable data={harvestingCandidates} columns={[
                            { key: 'term', header: 'High Performing Search Term', render: (r: any) => <span className="font-bold text-slate-900 dark:text-zinc-100">{r.term}</span>, sortable: true },
                            { key: 'orders', header: 'Orders', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.orders) },
                            { key: 'sales', header: 'Sales', align: 'right' as const, sortable: true, render: (r: any) => formatCurrency(r.sales, currencySymbol) },
                            { key: 'acos', header: 'ACOS', align: 'right' as const, sortable: true, render: (r: any) => <span className="font-bold text-emerald-600">{formatPct(r.acos)}</span> },
                            { key: 'cvr', header: 'CVR', align: 'right' as const, sortable: true, render: (r: any) => formatPct(r.cvr) },
                            { key: 'clicks', header: 'Clicks', align: 'right' as const, sortable: true, render: (r: any) => formatInt(r.clicks) },
                        ]} initialSortKey="orders" fileName="Lynx_Harvesting_Candidates" />
                    </div>
                )}

                {/* 2. N-GRAM TAB */}
                {currentTab === 'ngram' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-slate-500 dark:text-zinc-400">N-Gram Size:</span>
                            <div className="flex bg-white dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 p-1">
                                {[1, 2, 3].map(n => (
                                    <button key={n} onClick={() => setNgramSize(n as 1|2|3)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${ngramSize === n ? 'bg-brand-400 text-black shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>{n}-Word</button>
                                ))}
                            </div>
                        </div>
                        <DataTable data={ngramData} columns={[
                            { key: 'gram', header: 'N-Gram Phrase', render: r => <span className="font-bold text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-700 px-2 py-1 rounded-md">{r.gram}</span>, sortable: true },
                            { key: 'count', header: 'Frequency', align: 'right', sortable: true, render: r => formatInt(r.count) },
                            { key: 'spend', header: 'Spend', align: 'right', sortable: true, render: r => formatCurrency(r.spend, currencySymbol) },
                            { key: 'sales', header: 'Sales', align: 'right', sortable: true, render: r => formatCurrency(r.sales, currencySymbol) },
                            { key: 'acos', header: 'ACOS', align: 'right', sortable: true, render: r => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span> },
                            { key: 'orders', header: 'Orders', align: 'right', sortable: true },
                            { key: 'cpc', header: 'CPC', align: 'right', sortable: true, render: r => formatCurrency(r.cpc, currencySymbol) },
                            { key: 'cvr', header: 'CVR', align: 'right', sortable: true, render: r => formatPct(r.cvr) },
                        ]} initialSortKey="spend" fileName="Lynx_NGrams" />
                    </div>
                )}

                {/* 2.5 VISUAL CLOUD TAB (Improved) */}
                {currentTab === 'cloud' && (
                    <div className="space-y-6">
                        {/* Control & Legend Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-500 dark:text-zinc-400">N-Gram Size:</span>
                                <div className="flex bg-slate-50 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700 p-1">
                                    {[1, 2, 3].map(n => (
                                        <button key={n} onClick={() => { setNgramSize(n as 1|2|3); setSelectedCloudGram(null); }} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${ngramSize === n ? 'bg-brand-400 text-black shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-700'}`}>{n}-Word</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-zinc-700">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">ACOS Health:</span>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{'<30%'}</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-xs font-bold text-amber-700 dark:text-amber-400">{'30-50%'}</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-xs font-bold text-rose-700 dark:text-rose-400">{'>50%'}</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-600"></div><span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Zero Sales</span></div>
                            </div>
                        </div>

                        {/* Interactive Cloud */}
                        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm min-h-[400px] flex flex-wrap content-center justify-center gap-x-6 gap-y-3 relative overflow-hidden">
                            {ngramData.length === 0 && <div className="text-slate-400 dark:text-zinc-500">No data available.</div>}
                            {ngramData.slice(0, 100).map((gram, i) => {
                                const maxSpend = ngramData[0]?.spend || 1;
                                // Logarithmic scaling for better visualization of outliers
                                const size = Math.max(0.7, Math.min(3.0, 0.7 + (Math.log(gram.spend + 1) / Math.log(maxSpend + 1)) * 2.3));
                                
                                let colorClass = 'text-slate-300 hover:text-slate-500 dark:text-zinc-600 dark:hover:text-zinc-400';
                                if (gram.sales > 0) {
                                    if (gram.acos < 0.3) colorClass = 'text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300';
                                    else if (gram.acos < 0.5) colorClass = 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300';
                                    else colorClass = 'text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300';
                                } else {
                                    if (gram.spend > 50) colorClass = 'text-rose-400 hover:text-rose-600 dark:text-rose-500 dark:hover:text-rose-400'; // High wasted spend
                                }

                                const isSelected = selectedCloudGram === gram.gram;

                                return (
                                    <button 
                                        key={i} 
                                        onClick={() => setSelectedCloudGram(gram.gram)}
                                        className={`font-heading font-bold cursor-pointer transition-all duration-200 leading-tight ${colorClass} ${isSelected ? 'opacity-100 scale-110 ring-2 ring-brand-400 rounded-lg px-2 bg-brand-50 dark:bg-brand-900/20' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                                        style={{ fontSize: `${size}rem` }}
                                        title={`Spend: ${formatCurrency(gram.spend, currencySymbol)} | ACOS: ${formatPct(gram.acos)}`}
                                    >
                                        {gram.gram}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Drill Down Panel */}
                        {selectedGramDetails && (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-1 shadow-2xl animate-fadeIn mt-4 border border-slate-200 dark:border-zinc-700">
                                <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-[20px] p-6 text-slate-900 dark:text-white">
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-brand-600 dark:text-brand-400 font-bold uppercase text-xs tracking-wider">Root Word Analysis</span>
                                                {selectedGramDetails.stats.acos > 0.5 && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">High ACOS</span>}
                                            </div>
                                            <h3 className="text-3xl font-heading font-black text-slate-900 dark:text-white flex items-center gap-3">
                                                "{selectedGramDetails.gram}"
                                            </h3>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setSelectedCloudGram(null)}
                                                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm transition-colors"
                                            >
                                                Close Analysis
                                            </button>
                                            <button 
                                                onClick={() => copyToClipboard(selectedGramDetails.gram)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm transition-colors shadow-lg shadow-rose-900/20"
                                                title="Copy root word to clipboard for negative phrase match"
                                            >
                                                <Ban size={14} /> Copy Negative Phrase
                                            </button>
                                        </div>
                                    </div>

                                    {/* Context Metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Total Spend</p>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(selectedGramDetails.stats.spend, currencySymbol)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Total Sales</p>
                                            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(selectedGramDetails.stats.sales, currencySymbol)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Aggregate ACOS</p>
                                            <p className={`text-2xl font-bold ${selectedGramDetails.stats.acos > 0.4 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{formatPct(selectedGramDetails.stats.acos)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Conversion Rate</p>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPct(selectedGramDetails.stats.cvr)}</p>
                                        </div>
                                    </div>

                                    {/* Contributing Terms Table */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700">
                                        <div className="px-4 py-3 bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 font-bold text-xs text-slate-500 dark:text-zinc-400 uppercase flex justify-between items-center">
                                            <span>Contributing Search Terms</span>
                                            <span className="text-slate-400 dark:text-zinc-500">{selectedGramDetails.terms.length} Terms found</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-xs sm:text-sm text-left">
                                                <thead className="bg-slate-50 dark:bg-zinc-800 sticky top-0 z-10 text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2">Search Term</th>
                                                        <th className="px-4 py-2 text-right">Spend</th>
                                                        <th className="px-4 py-2 text-right">Sales</th>
                                                        <th className="px-4 py-2 text-right">ACOS</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                                    {selectedGramDetails.terms.slice(0, 50).map((t, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                                                            <td className="px-4 py-2 font-medium text-slate-700 dark:text-zinc-200">{t.term}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(t.spend, currencySymbol)}</td>
                                                            <td className="px-4 py-2 text-right">{formatCurrency(t.sales, currencySymbol)}</td>
                                                            <td className={`px-4 py-2 text-right font-bold ${t.acos > 0.4 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatPct(t.acos)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. BRANDED TAB */}
                {currentTab === 'brand' && (
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                             <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Define Brand Terms (Comma Separated)</label>
                             <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    value={brandText} 
                                    onChange={(e) => setBrandText(e.target.value)}
                                    placeholder="e.g. nike, adidas, puma"
                                    className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"
                                />
                             </div>
                             <p className="text-xs text-slate-400 mt-2">Enter your brand name and misspellings to separate Branded vs Non-Branded performance.</p>
                         </div>
                         
                         {brandData ? (
                             <div className="space-y-8">
                                 {/* Summary Cards */}
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                     <div className="p-6 rounded-2xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
                                         <h4 className="text-lg font-heading font-bold mb-4 text-indigo-900 dark:text-indigo-300">Branded Overview</h4>
                                         <div className="grid grid-cols-2 gap-y-4 text-slate-900 dark:text-zinc-100">
                                             <div><p className="text-xs uppercase font-bold opacity-60">Spend</p><p className="text-2xl font-bold">{formatCompactCurrency(brandData.branded.spend, currencySymbol)}</p></div>
                                             <div><p className="text-xs uppercase font-bold opacity-60">Sales</p><p className="text-2xl font-bold">{formatCompactCurrency(brandData.branded.sales, currencySymbol)}</p></div>
                                             <div><p className="text-xs uppercase font-bold opacity-60">ROAS</p><p className="text-2xl font-bold">{formatNum(brandData.branded.roas)}</p></div>
                                             <div><p className="text-xs uppercase font-bold opacity-60">ACOS</p><p className="text-2xl font-bold">{formatPct(brandData.branded.acos)}</p></div>
                                         </div>
                                     </div>
                                     <div className="p-6 rounded-2xl border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                                         <h4 className="text-lg font-heading font-bold mb-4 text-emerald-900 dark:text-emerald-300">Non-Branded Overview</h4>
                                         <div className="grid grid-cols-2 gap-y-4 text-slate-900 dark:text-zinc-100">
                                             <div><p className="text-xs uppercase font-bold opacity-60">Spend</p><p className="text-2xl font-bold">{formatCompactCurrency(brandData.nonBranded.spend, currencySymbol)}</p></div>
                                             <div><p className="text-xs uppercase font-bold opacity-60">Sales</p><p className="text-2xl font-bold">{formatCompactCurrency(brandData.nonBranded.sales, currencySymbol)}</p></div>
                                             <div><p className="text-xs uppercase font-bold opacity-60">ROAS</p><p className="text-2xl font-bold">{formatNum(brandData.nonBranded.roas)}</p></div>
                                             <div><p className="text-xs uppercase font-bold opacity-60">ACOS</p><p className="text-2xl font-bold">{formatPct(brandData.nonBranded.acos)}</p></div>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Detailed Tables */}
                                 <div className="space-y-6">
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 overflow-hidden">
                                        <div className="px-6 py-4 bg-indigo-50/50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-900/50">
                                            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2"><Tags className="w-4 h-4" /> Branded Search Terms</h3>
                                        </div>
                                        <div className="p-4">
                                            <DataTable data={brandData.branded.list} columns={summaryColumns} initialSortKey="spend" fileName="Lynx_Branded_Terms" />
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden">
                                        <div className="px-6 py-4 bg-emerald-50/50 dark:bg-emerald-900/30 border-b border-emerald-100 dark:border-emerald-900/50">
                                            <h3 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2"><Globe className="w-4 h-4" /> Non-Branded Search Terms</h3>
                                        </div>
                                        <div className="p-4">
                                            <DataTable data={brandData.nonBranded.list} columns={summaryColumns} initialSortKey="spend" fileName="Lynx_NonBranded_Terms" />
                                        </div>
                                    </div>
                                 </div>
                             </div>
                         ) : (
                             <div className="text-center py-12 bg-slate-100 dark:bg-zinc-800 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 text-slate-400 dark:text-zinc-500 font-medium">
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
                            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                <Percent className="w-5 h-5 text-indigo-500" /> ACOS Distribution
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                                    <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-6">Spend by ACOS Range</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={distributionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="range" tick={{fontSize: 10}} />
                                                <YAxis tickFormatter={val => `${currencySymbol}${val}`} />
                                                <RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                                                <Bar dataKey="spend" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spend" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                                    <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-6">Sales by ACOS Range</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={distributionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="range" tick={{fontSize: 10}} />
                                                <YAxis tickFormatter={val => `${currencySymbol}${val}`} />
                                                <RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                                                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} name="Sales" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                             <DataTable data={distributionData} columns={distributionColumns} fileName="Lynx_ACOS_Distribution" />
                        </div>

                        {/* CVR Distribution */}
                        <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-zinc-800">
                            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                <Target className="w-5 h-5 text-emerald-500" /> CVR Distribution
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                                    <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-6">Spend by CVR Range</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={cvrDistributionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="range" tick={{fontSize: 10}} />
                                                <YAxis tickFormatter={val => `${currencySymbol}${val}`} />
                                                <RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
                                                <Bar dataKey="spend" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Spend" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                                    <h4 className="font-bold text-slate-900 dark:text-zinc-100 mb-6">Sales by CVR Range</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={cvrDistributionData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="range" tick={{fontSize: 10}} />
                                                <YAxis tickFormatter={val => `${currencySymbol}${val}`} />
                                                <RechartsTooltip formatter={(value: number) => formatCurrency(value, currencySymbol)} />
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
                        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-rose-900 dark:text-rose-300 font-bold text-lg mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Wasted Ad Spend Detected
                                </h3>
                                <p className="text-rose-700 dark:text-rose-400 text-sm mb-4 sm:mb-0">
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
                                <span className="text-xs uppercase font-bold text-rose-400 dark:text-rose-500">Total Wasted Spend</span>
                                <p className="text-2xl font-black text-rose-900 dark:text-rose-300">{formatCompactCurrency(wastedTerms.reduce((sum, t) => sum + t.spend, 0), currencySymbol)}</p>
                            </div>
                            <div>
                                <span className="text-xs uppercase font-bold text-rose-400 dark:text-rose-500">Wasted Clicks</span>
                                <p className="text-2xl font-black text-rose-900 dark:text-rose-300">{formatCompactNum(wastedTerms.reduce((sum, t) => sum + t.clicks, 0))}</p>
                            </div>
                            <div>
                                <span className="text-xs uppercase font-bold text-rose-400 dark:text-rose-500">Term Count</span>
                                <p className="text-2xl font-black text-rose-900 dark:text-rose-300">{wastedTerms.length}</p>
                            </div>
                        </div>

                        <DataTable data={wastedTerms} columns={wastedColumns} initialSortKey="spend" fileName="Lynx_Wasted_Spend" />
                    </div>
                )}

            </div>
        </div>
    );
};
