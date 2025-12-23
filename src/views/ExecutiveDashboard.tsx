
import React, { useMemo, useState } from 'react';
import { DashboardData } from '../types';
import { SectionHeader, DataTable, MetricCard } from '../components/Widgets';
import { TrendingUp, Target, LayoutGrid, Video, PieChart, Layers, Shield, Globe, Tags, Search } from 'lucide-react';

const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatExactCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCompactCurrency = (val: number) => {
  if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
};
const formatCompactNum = (val: number) => {
  if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toLocaleString();
};
const formatPct = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${(val * 100).toFixed(0)}%`;
};
const formatExactPct = (val: number) => {
  if (isNaN(val) || !isFinite(val)) return '0.00%';
  return `${(val * 100).toFixed(2)}%`;
};
const formatInt = (val: number) => Math.round(val).toLocaleString();
const formatNum = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

// Helper to extract ASIN from target expression
const extractAsin = (expr: string | undefined | null) => {
    if (!expr) return null;
    try {
        const match = expr.toLowerCase().match(/asin="([^"]+)"/);
        return match ? match[1].toUpperCase() : null;
    } catch(e) {
        return null;
    }
};

const isEnabled = (state?: string) => {
    if (!state) return true; // Default to enabled if missing/undefined
    return state.toLowerCase() === 'enabled';
};

export const ExecutiveDashboard: React.FC<{ data: DashboardData }> = ({ data }) => {
  const [brandInput, setBrandInput] = useState('');

  // 0. Pre-calc Own ASINs for Defensive vs Competitor logic
  const myAsins = useMemo(() => new Set(data.spSkus.map(s => (s.asin || '').toUpperCase()).filter(Boolean)), [data.spSkus]);

  // 1. Aggregated Ad Metrics
  const adStats = useMemo(() => {
    const allCampaigns = [...data.spCampaigns, ...data.sbCampaigns, ...data.sdCampaigns];
    const totalSpend = allCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const totalSales = allCampaigns.reduce((sum, c) => sum + (c.sales || 0), 0);
    const totalOrders = allCampaigns.reduce((sum, c) => sum + (c.orders || 0), 0);
    const totalImpressions = allCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = allCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    
    return {
      spend: totalSpend,
      sales: totalSales,
      orders: totalOrders,
      impressions: totalImpressions,
      clicks: totalClicks,
      acos: safeDiv(totalSpend, totalSales),
      roas: safeDiv(totalSales, totalSpend),
      ctr: safeDiv(totalClicks, totalImpressions),
      cpc: safeDiv(totalSpend, totalClicks),
      cvr: safeDiv(totalOrders, totalClicks),
    };
  }, [data]);

  // 1.5 Channel Metrics & Detailed Breakdown
  const channelStats = useMemo(() => {
    // --- SP Logic ---
    const spAgKwCount = new Map<string, number>();
    data.spKeywords.forEach(k => {
        if(isEnabled(k.state)) spAgKwCount.set(k.adGroupId, (spAgKwCount.get(k.adGroupId) || 0) + 1);
    });

    const spBreakdown = {
        exactSkw: 0, exact: 0, phrase: 0, broad: 0,
        auto: 0, competitorPat: 0, defensivePat: 0,
        count: 0
    };

    data.spKeywords.forEach(k => {
        if (!isEnabled(k.state)) return;
        spBreakdown.count++;
        if (k.matchType === 'EXACT') {
            if (spAgKwCount.get(k.adGroupId) === 1) spBreakdown.exactSkw++;
            else spBreakdown.exact++;
        } else if (k.matchType === 'PHRASE') spBreakdown.phrase++;
        else if (k.matchType === 'BROAD') spBreakdown.broad++;
    });

    data.spProductTargets.forEach(t => {
        if (!isEnabled(t.state)) return;
        spBreakdown.count++;
        const asin = extractAsin(t.expression);
        if (asin) {
            if (myAsins.has(asin)) spBreakdown.defensivePat++;
            else spBreakdown.competitorPat++;
        } else {
            spBreakdown.auto++;
        }
    });

    // --- SB Logic ---
    const sbBreakdown = {
        exact: 0, phrase: 0, broad: 0,
        competitorPat: 0, defensivePat: 0,
        video: 0, hsa: 0,
        count: 0
    };
    const sbCampMap = new Map(data.sbCampaigns.map(c => [c.campaignId, c.adFormat]));

    const processSb = (item: any, isKw: boolean) => {
        if (!isEnabled(item.state)) return;

        sbBreakdown.count++;
        const format = sbCampMap.get(item.campaignId);
        if (format === 'Video') sbBreakdown.video++;
        else sbBreakdown.hsa++;

        if (isKw) {
            const mt = (item.matchType || '').toUpperCase();
            if (mt === 'EXACT') sbBreakdown.exact++;
            else if (mt === 'PHRASE') sbBreakdown.phrase++;
            else if (mt === 'BROAD') sbBreakdown.broad++;
        } else {
            const asin = extractAsin(item.expression);
            if (asin) {
                if (myAsins.has(asin)) sbBreakdown.defensivePat++;
                else sbBreakdown.competitorPat++;
            }
        }
    };
    data.sbKeywords.forEach(k => processSb(k, true));
    data.sbTargets.forEach(t => processSb(t, false));

    // --- SD Logic ---
    const sdBreakdown = {
        competitorPat: 0, defensivePat: 0, offsite: 0,
        count: 0
    };
    data.sdTargets.forEach(t => {
        if (!isEnabled(t.state)) return;
        sdBreakdown.count++;
        const asin = extractAsin(t.expression);
        if (asin) {
            if (myAsins.has(asin)) sdBreakdown.defensivePat++;
            else sdBreakdown.competitorPat++;
        } else {
            sdBreakdown.offsite++;
        }
    });

    // --- Totals ---
    const calc = (campaigns: any[]) => {
      const spend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
      const sales = campaigns.reduce((sum, c) => sum + (c.sales || 0), 0);
      return { spend, sales };
    };

    const sp = calc(data.spCampaigns);
    const sb = calc(data.sbCampaigns);
    const sd = calc(data.sdCampaigns);
    
    const totalSales = sp.sales + sb.sales + sd.sales;
    const div = totalSales || 1;

    return [
        { 
            key: 'sp', 
            label: 'Sponsored Products', 
            icon: LayoutGrid,
            bg: 'bg-brand-50',
            border: 'border-brand-200',
            text: 'text-brand-900',
            iconColor: 'text-brand-600',
            valueColor: 'text-brand-950',
            subColor: 'text-brand-800',
            ...sp, 
            roas: safeDiv(sp.sales, sp.spend), 
            share: safeDiv(sp.sales, div),
            details: [
                { l: 'Target Summary', v: formatInt(spBreakdown.count), h: true },
                { l: 'Exact SKW', v: spBreakdown.exactSkw },
                { l: 'Exact', v: spBreakdown.exact },
                { l: 'Phrase', v: spBreakdown.phrase },
                { l: 'Broad', v: spBreakdown.broad },
                { l: 'Competitor PAT', v: spBreakdown.competitorPat },
                { l: 'Defensive PAT', v: spBreakdown.defensivePat },
                { l: 'Auto / Category', v: spBreakdown.auto },
            ]
        },
        { 
            key: 'sb', 
            label: 'Sponsored Brands', 
            icon: Video,
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-900',
            iconColor: 'text-blue-600',
            valueColor: 'text-blue-950',
            subColor: 'text-blue-800',
            ...sb, 
            roas: safeDiv(sb.sales, sb.spend), 
            share: safeDiv(sb.sales, div),
            details: [
                { l: 'Target Summary', v: formatInt(sbBreakdown.count), h: true },
                { l: 'Exact', v: sbBreakdown.exact },
                { l: 'Phrase', v: sbBreakdown.phrase },
                { l: 'Broad', v: sbBreakdown.broad },
                { l: 'Video Targets', v: sbBreakdown.video },
                { l: 'HSA/Collection', v: sbBreakdown.hsa },
                { l: 'Competitor PAT', v: sbBreakdown.competitorPat },
                { l: 'Defensive PAT', v: sbBreakdown.defensivePat },
            ]
        },
        { 
            key: 'sd', 
            label: 'Sponsored Display', 
            icon: Target,
            bg: 'bg-fuchsia-50',
            border: 'border-fuchsia-200',
            text: 'text-fuchsia-900',
            iconColor: 'text-fuchsia-600',
            valueColor: 'text-fuchsia-950',
            subColor: 'text-fuchsia-800',
            ...sd, 
            roas: safeDiv(sd.sales, sd.spend), 
            share: safeDiv(sd.sales, div),
            details: [
                { l: 'Target Summary', v: formatInt(sdBreakdown.count), h: true },
                { l: 'Competitor PAT', v: sdBreakdown.competitorPat },
                { l: 'Defensive PAT', v: sdBreakdown.defensivePat },
                { l: 'Offsite / Audiences', v: sdBreakdown.offsite },
            ]
        }
    ];
  }, [data, myAsins]);

  // 1.7 Branded vs Non-Branded Stats
  const brandStats = useMemo(() => {
      if (!brandInput.trim() || data.searchTerms.length === 0) return null;
      
      const terms = brandInput.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
      const stats = {
          branded: { spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0, count: 0 },
          nonBranded: { spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0, count: 0 }
      };

      data.searchTerms.forEach(st => {
          const term = (st.customerSearchTerm || st.searchTerm || '').toLowerCase();
          const isBranded = terms.some(t => term.includes(t));
          const bucket = isBranded ? stats.branded : stats.nonBranded;
          
          bucket.spend += st.spend;
          bucket.sales += st.sales;
          bucket.orders += st.orders;
          bucket.clicks += st.clicks;
          bucket.impressions += st.impressions;
          bucket.count++;
      });

      const totalSpend = stats.branded.spend + stats.nonBranded.spend;
      const totalSales = stats.branded.sales + stats.nonBranded.sales;

      return {
          branded: { 
              ...stats.branded, 
              acos: safeDiv(stats.branded.spend, stats.branded.sales),
              roas: safeDiv(stats.branded.sales, stats.branded.spend),
              cpc: safeDiv(stats.branded.spend, stats.branded.clicks),
              spendShare: safeDiv(stats.branded.spend, totalSpend),
              salesShare: safeDiv(stats.branded.sales, totalSales)
          },
          nonBranded: { 
              ...stats.nonBranded, 
              acos: safeDiv(stats.nonBranded.spend, stats.nonBranded.sales),
              roas: safeDiv(stats.nonBranded.sales, stats.nonBranded.spend),
              cpc: safeDiv(stats.nonBranded.spend, stats.nonBranded.clicks),
              spendShare: safeDiv(stats.nonBranded.spend, totalSpend),
              salesShare: safeDiv(stats.nonBranded.sales, totalSales)
          },
          totalSpend,
          totalSales
      };
  }, [data.searchTerms, brandInput]);

  // 2. Business Report Metrics (Total/Organic)
  const bizStats = useMemo(() => {
    const br = data.businessReport || [];
    const totalSales = br.reduce((acc, r) => acc + r.orderedProductSales, 0);
    const totalUnits = br.reduce((acc, r) => acc + r.unitsOrdered, 0);
    const totalOrders = br.reduce((acc, r) => acc + r.totalOrderItems, 0);
    const totalSessions = br.reduce((acc, r) => acc + r.sessions, 0);
    const totalPageViews = br.reduce((acc, r) => acc + r.pageViews, 0);
    
    return { 
        totalSales, 
        totalUnits, 
        totalOrders, 
        totalSessions, 
        totalPageViews 
    };
  }, [data.businessReport]);

  // 3. Derived KPIs for Matrix Table
  const kpis = {
      // Row 1 (Total / Organic)
      tacos: safeDiv(adStats.spend, bizStats.totalSales),
      totalCvr: safeDiv(bizStats.totalOrders, bizStats.totalSessions),
      totalSales: bizStats.totalSales,
      totalOrders: bizStats.totalOrders,
      orgOrders: bizStats.totalOrders - adStats.orders,
      sessions: bizStats.totalSessions,
      totalCpa: safeDiv(adStats.spend, bizStats.totalOrders),
      pageViews: bizStats.totalPageViews,
      sessionPct: safeDiv(bizStats.totalUnits, bizStats.totalSessions),
      units: bizStats.totalUnits,
      aov: safeDiv(bizStats.totalSales, bizStats.totalOrders),

      // Row 2 (Ads)
      acos: adStats.acos,
      adCvr: adStats.cvr,
      adSales: adStats.sales,
      adOrders: adStats.orders,
      adPct: safeDiv(adStats.sales, bizStats.totalSales),
      clicks: adStats.clicks,
      adCpa: safeDiv(adStats.spend, adStats.orders),
      spend: adStats.spend,
      cpc: adStats.cpc,
      ctr: adStats.ctr,
      impressions: adStats.impressions
  };

  // 4. Detailed Breakdown Data (The new Table)
  const breakdownData = useMemo(() => {
      // Helpers & Maps
      const adGroupKwCount = new Map<string, number>();
      data.spKeywords.forEach(k => {
          adGroupKwCount.set(k.adGroupId, (adGroupKwCount.get(k.adGroupId) || 0) + 1);
      });

      const sbCampMap = new Map(data.sbCampaigns.map(c => [c.campaignId, c.adFormat]));
      const sdCampMap = new Map(data.sdCampaigns.map(c => [c.campaignId, c.tactic]));

      const buckets: Record<string, any> = {
          // SP
          'SP SKW Exact': { group: 'SP', order: 1, label: '(SP) SKW Exact' },
          'SP Exact': { group: 'SP', order: 2, label: '(SP) Exact' },
          'SP Phrase': { group: 'SP', order: 3, label: '(SP) Phrase' },
          'SP Broad': { group: 'SP', order: 4, label: '(SP) Broad' },
          'SP Product Targeting': { group: 'SP', order: 5, label: '(SP) Product Targeting' },
          'SP Category Targeting': { group: 'SP', order: 6, label: '(SP) Category Targeting' },
          'SP Auto': { group: 'SP', order: 7, label: '(SP) Auto' },
          
          // HSA
          '(HSA) Exact': { group: 'SB', order: 10, label: '(HSA) Exact' },
          '(HSA) Phrase': { group: 'SB', order: 11, label: '(HSA) Phrase' },
          '(HSA) Broad': { group: 'SB', order: 12, label: '(HSA) Broad' },
          '(HSA) Product Targeting': { group: 'SB', order: 13, label: '(HSA) Product Targeting' },
          '(HSA) Category Targeting': { group: 'SB', order: 14, label: '(HSA) Category Targeting' },
          
          // Store
          '(Store) Exact': { group: 'SB', order: 20, label: '(Store) Exact' },
          '(Store) Phrase': { group: 'SB', order: 21, label: '(Store) Phrase' },
          '(Store) Broad': { group: 'SB', order: 22, label: '(Store) Broad' },
          '(Store) Product Targeting': { group: 'SB', order: 23, label: '(Store) Product Targeting' },
          '(Store) Category Targeting': { group: 'SB', order: 24, label: '(Store) Category Targeting' },
          
          // Vid
          '(Vid) Exact': { group: 'SB', order: 30, label: '(Vid) Exact' },
          '(Vid) Phrase': { group: 'SB', order: 31, label: '(Vid) Phrase' },
          '(Vid) Broad': { group: 'SB', order: 32, label: '(Vid) Broad' },
          '(Vid) Product Targeting': { group: 'SB', order: 33, label: '(Vid) Product Targeting' },
          '(Vid) Category Targeting': { group: 'SB', order: 34, label: '(Vid) Category Targeting' },
          
          // SD
          '(SD) PAT': { group: 'SD', order: 40, label: '(SD) PAT' },
          '(SD) Audience': { group: 'SD', order: 41, label: '(SD) Audience' },
      };

      // Initialize stats
      Object.keys(buckets).forEach(k => {
          buckets[k] = { ...buckets[k], key: k, spend: 0, sales: 0, orders: 0, imps: 0, clicks: 0, targets: 0 };
      });

      // --- Process SP ---
      data.spKeywords.forEach(k => {
          let key = '';
          if (k.matchType === 'EXACT') {
               key = (adGroupKwCount.get(k.adGroupId) === 1) ? 'SP SKW Exact' : 'SP Exact';
          }
          else if (k.matchType === 'PHRASE') key = 'SP Phrase';
          else if (k.matchType === 'BROAD') key = 'SP Broad';
          
          if (key && buckets[key]) {
              buckets[key].spend += k.spend;
              buckets[key].sales += k.sales;
              buckets[key].orders += k.orders;
              buckets[key].imps += k.impressions;
              buckets[key].clicks += k.clicks;
              buckets[key].targets += 1;
          }
      });
      data.spProductTargets.forEach(t => {
          let key = '';
          const expr = t.expression.toLowerCase();
          if (expr.includes('producttype=')) key = 'SP Auto';
          else if (expr.includes('asin=')) key = 'SP Product Targeting';
          else if (expr.includes('category=')) key = 'SP Category Targeting';

          if (key && buckets[key]) {
              buckets[key].spend += t.spend;
              buckets[key].sales += t.sales;
              buckets[key].orders += t.orders;
              buckets[key].imps += t.impressions;
              buckets[key].clicks += t.clicks;
              buckets[key].targets += 1;
          }
      });

      // --- Process SB ---
      const processSB = (item: any, isKeyword: boolean) => {
          const fmt = sbCampMap.get(item.campaignId);
          let prefix = '(HSA)';
          if (fmt === 'Store Spotlight') prefix = '(Store)';
          else if (fmt === 'Video') prefix = '(Vid)';
          else prefix = '(HSA)'; 

          let key = '';
          if (isKeyword) {
              const mt = item.matchType?.toUpperCase();
              if (mt === 'EXACT') key = `${prefix} Exact`;
              else if (mt === 'PHRASE') key = `${prefix} Phrase`;
              else if (mt === 'BROAD') key = `${prefix} Broad`;
          } else {
              const expr = item.expression?.toLowerCase() || '';
              if (expr.includes('category=')) key = `${prefix} Category Targeting`;
              else key = `${prefix} Product Targeting`;
          }

          if (key && buckets[key]) {
              buckets[key].spend += item.spend;
              buckets[key].sales += item.sales;
              buckets[key].orders += item.orders || 0;
              buckets[key].imps += item.impressions;
              buckets[key].clicks += item.clicks;
              buckets[key].targets += 1;
          }
      };
      data.sbKeywords.forEach(k => processSB(k, true));
      data.sbTargets.forEach(t => processSB(t, false));

      // --- Process SD ---
      data.sdTargets.forEach(t => {
          const tactic = sdCampMap.get(t.campaignId);
          const key = (tactic === 'T00030') ? '(SD) Audience' : '(SD) PAT';
          if (key && buckets[key]) {
              buckets[key].spend += t.spend;
              buckets[key].sales += t.sales;
              buckets[key].orders += t.orders;
              buckets[key].imps += t.impressions;
              buckets[key].clicks += t.clicks;
              buckets[key].targets += 1;
          }
      });

      const rows = Object.values(buckets).sort((a,b) => a.order - b.order);

      const getSummary = (group: string, lbl: string) => {
          const groupRows = rows.filter(r => r.group === group);
          return groupRows.reduce((acc, r) => ({
              ...acc,
              spend: acc.spend + r.spend,
              sales: acc.sales + r.sales,
              orders: acc.orders + r.orders,
              imps: acc.imps + r.imps,
              clicks: acc.clicks + r.clicks,
              targets: acc.targets + r.targets,
          }), { label: lbl, group: group, key: `SUMMARY_${group}`, spend: 0, sales: 0, orders: 0, imps: 0, clicks: 0, targets: 0, isSummary: true });
      };

      const spSum = getSummary('SP', 'SP');
      const sbSum = getSummary('SB', 'SB');
      const sdSum = getSummary('SD', 'SD');
      
      const total = {
          label: 'Total',
          group: 'TOTAL',
          key: 'TOTAL_ALL',
          spend: spSum.spend + sbSum.spend + sdSum.spend,
          sales: spSum.sales + sbSum.sales + sdSum.sales,
          orders: spSum.orders + sbSum.orders + sdSum.orders,
          imps: spSum.imps + sbSum.imps + sdSum.imps,
          clicks: spSum.clicks + sbSum.clicks + sdSum.clicks,
          targets: spSum.targets + sbSum.targets + sdSum.targets,
          isTotal: true
      };

      const grandSpend = total.spend || 1;
      const grandSales = total.sales || 1;

      const calc = (r: any) => ({
          ...r,
          acos: safeDiv(r.spend, r.sales),
          cvr: safeDiv(r.orders, r.clicks),
          ctr: safeDiv(r.clicks, r.imps),
          cpa: safeDiv(r.spend, r.orders),
          pctSales: safeDiv(r.sales, grandSales),
          pctSpend: safeDiv(r.spend, grandSpend)
      });

      return [
          ...rows.filter(r => r.group === 'SP').map(calc),
          calc(spSum),
          ...rows.filter(r => r.group === 'SB').map(calc),
          calc(sbSum),
          ...rows.filter(r => r.group === 'SD').map(calc),
          calc(sdSum),
          calc(total)
      ];
  }, [data]);

  // Matrix Definition
  const matrixCols = [
    { label: "Efficiency", top: { l: "TACOS", v: formatExactPct(kpis.tacos) }, bot: { l: "ACOS", v: formatExactPct(kpis.acos) } },
    { label: "Conversion", top: { l: "TOTAL CVR", v: formatExactPct(kpis.totalCvr) }, bot: { l: "AD CVR", v: formatExactPct(kpis.adCvr) } },
    { label: "Revenue", top: { l: "TOTAL SALES", v: formatCompactCurrency(kpis.totalSales) }, bot: { l: "AD SALES", v: formatCompactCurrency(kpis.adSales) } },
    { label: "Volume", top: { l: "TOTAL ORDERS", v: formatInt(kpis.totalOrders) }, bot: { l: "AD ORDERS", v: formatInt(kpis.adOrders) } },
    { label: "Contribution", top: { l: "ORG ORDERS", v: formatInt(kpis.orgOrders) }, bot: { l: "AD CONTRIBUTION %", v: formatPct(kpis.adPct) } },
    { label: "Traffic", top: { l: "SESSIONS", v: formatInt(kpis.sessions) }, bot: { l: "CLICKS", v: formatCompactNum(kpis.clicks) } },
    { label: "Acquisition", top: { l: "TOTAL CPA", v: formatExactCurrency(kpis.totalCpa) }, bot: { l: "AD CPA", v: formatExactCurrency(kpis.adCpa) } },
    { label: "Cost", top: { l: "PAGE VIEWS", v: formatInt(kpis.pageViews) }, bot: { l: "SPEND", v: formatCompactCurrency(kpis.spend) } },
    { label: "Engagement", top: { l: "SESSION %", v: formatPct(kpis.sessionPct) }, bot: { l: "CPC", v: formatExactCurrency(kpis.cpc) } },
    { label: "Product", top: { l: "UNITS", v: formatInt(kpis.units) }, bot: { l: "CTR", v: formatExactPct(kpis.ctr) } },
    { label: "Basket", top: { l: "AOV", v: formatExactCurrency(kpis.aov) }, bot: { l: "IMPRESSIONS", v: formatCompactNum(kpis.impressions) } },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <SectionHeader title="Executive Summary" description="High-level performance overview across all ad types." />

      {/* 1. PERFORMANCE OVERVIEW MATRIX */}
      <div className="rounded-xl shadow-sm border border-slate-200 overflow-hidden bg-white">
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
             <h3 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-brand-500" />
               Performance Overview
             </h3>
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Real-time</span>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
             <div className="min-w-[1000px]">
                 {/* Top Row: Total / Organic (Dark Theme) */}
                 <div className="grid grid-cols-11 bg-[#0f172a] text-white">
                     {matrixCols.map((col, idx) => (
                        <div key={`top-${idx}`} className={`flex flex-col items-center justify-center py-5 px-2 ${idx !== matrixCols.length - 1 ? 'border-r border-slate-700' : ''}`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 mb-1.5">{col.top.l}</span>
                            <span className="text-base font-bold font-heading">{col.top.v}</span>
                        </div>
                     ))}
                 </div>
                 {/* Bottom Row: Ad Metrics (Light Theme) */}
                 <div className="grid grid-cols-11 bg-white text-slate-900">
                     {matrixCols.map((col, idx) => (
                        <div key={`bot-${idx}`} className={`flex flex-col items-center justify-center py-5 px-2 ${idx !== matrixCols.length - 1 ? 'border-r border-slate-100' : ''}`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{col.bot.l}</span>
                            <span className="text-base font-bold font-heading">{col.bot.v}</span>
                        </div>
                     ))}
                 </div>
             </div>
          </div>
      </div>

      {/* 2. CHANNEL PERFORMANCE WITH BREAKDOWN */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2 text-slate-500 pl-1">
             <PieChart className="w-4 h-4" /> Channel Performance & Targets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {channelStats.map((channel) => {
               const Icon = channel.icon;
               return (
                   <div key={channel.key} className={`rounded-xl border ${channel.border} ${channel.bg} p-5 flex flex-col relative overflow-hidden h-full`}>
                       {/* Header */}
                       <div className="flex items-center gap-3 mb-4 z-10">
                           <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center ${channel.iconColor} shadow-sm`}>
                               <Icon size={16} strokeWidth={2.5} />
                           </div>
                           <h4 className={`text-sm font-bold font-heading uppercase tracking-wide ${channel.text}`}>{channel.label}</h4>
                           <div className="ml-auto flex items-center gap-1 bg-white/60 px-2 py-1 rounded text-[10px] font-bold shadow-sm">
                               <span className={channel.subColor}>{formatPct(channel.share)}</span> SHARE
                           </div>
                       </div>
                       
                       {/* Metrics Grid */}
                       <div className="grid grid-cols-2 gap-4 z-10 mb-4 pb-4 border-b border-black/5">
                           <div>
                               <p className={`text-[10px] uppercase font-bold ${channel.subColor} opacity-70 mb-1`}>Sales</p>
                               <p className={`text-2xl font-black ${channel.valueColor} tracking-tight`}>{formatCompactCurrency(channel.sales)}</p>
                           </div>
                           <div className="text-right">
                               <p className={`text-[10px] uppercase font-bold ${channel.subColor} opacity-70 mb-1`}>ROAS</p>
                               <p className={`text-2xl font-black ${channel.valueColor} tracking-tight`}>{formatNum(channel.roas)}</p>
                           </div>
                       </div>

                       {/* Target Summary Table */}
                       <div className="flex-1 z-10">
                           <table className="w-full text-xs">
                               <tbody>
                                   {channel.details.map((detail, idx) => (
                                       <tr key={idx} className={`${detail.h ? 'font-bold border-b border-black/5' : ''}`}>
                                           <td className={`py-1 ${detail.h ? channel.text : channel.subColor} ${detail.h ? 'text-[11px] uppercase tracking-wider' : 'opacity-90'}`}>
                                               {detail.h && <Target className="w-3 h-3 inline-block mr-1 mb-0.5" />}
                                               {detail.l}
                                           </td>
                                           <td className={`py-1 text-right font-bold ${channel.valueColor}`}>
                                               {detail.v}
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                       
                       {/* Footer */}
                       <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between z-10">
                           <span className={`text-xs font-bold ${channel.subColor}`}>Spend: {formatCurrency(channel.spend)}</span>
                       </div>
                   </div>
               );
           })}
        </div>
      </div>

      {/* 3. DETAILED MATCH TYPE BREAKDOWN (Replaced with DataTable for Export) */}
      <div className="space-y-2">
          <div className="flex items-center gap-2 pl-1">
               <Layers className="w-4 h-4 text-slate-500" />
               <h3 className="text-sm font-bold font-heading uppercase tracking-wide text-slate-500">Detailed Performance Breakdown</h3>
          </div>
          <DataTable 
            data={breakdownData}
            initialSortKey="spend"
            fileName="Lynx_Executive_Breakdown"
            columns={[
                { key: 'label', header: 'Match / Segment', render: (r: any) => (
                    <span className={`font-bold ${r.isTotal ? 'text-black text-sm' : r.isSummary ? 'text-slate-900' : 'text-slate-600'}`}>
                        {r.label}
                    </span>
                )},
                { key: 'spend', header: 'Spend', align: 'right', sortable: true, render: (r: any) => formatCurrency(r.spend) },
                { key: 'orders', header: 'Orders', align: 'right', sortable: true, render: (r: any) => formatInt(r.orders) },
                { key: 'sales', header: 'Sales', align: 'right', sortable: true, render: (r: any) => formatCompactCurrency(r.sales) },
                { key: 'imps', header: 'Impressions', align: 'right', sortable: true, render: (r: any) => formatCompactNum(r.imps) },
                { key: 'clicks', header: 'Clicks', align: 'right', sortable: true, render: (r: any) => formatCompactNum(r.clicks) },
                { key: 'acos', header: 'ACOS', align: 'right', sortable: true, render: (r: any) => <span className={r.acos > 0.4 ? 'text-rose-600 font-bold' : ''}>{formatPct(r.acos)}</span> },
                { key: 'cvr', header: 'CVR', align: 'right', sortable: true, render: (r: any) => formatPct(r.cvr) },
                { key: 'ctr', header: 'CTR', align: 'right', sortable: true, render: (r: any) => formatExactPct(r.ctr) },
                { key: 'targets', header: 'Targets', align: 'right', sortable: true, render: (r: any) => formatInt(r.targets) },
                { key: 'cpa', header: 'CPA', align: 'right', sortable: true, render: (r: any) => formatNum(r.cpa) },
                { key: 'pctSales', header: '% Sales', align: 'right', sortable: true, render: (r: any) => formatPct(r.pctSales) },
                { key: 'pctSpend', header: '% Spend', align: 'right', sortable: true, render: (r: any) => formatPct(r.pctSpend) },
            ]}
          />
      </div>

      {/* 4. BRANDED vs NON-BRANDED */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                     <h3 className="text-sm font-bold font-heading uppercase tracking-wide flex items-center gap-2">
                       <Tags className="w-4 h-4 text-slate-900" /> Branded vs Non-Branded Analysis
                     </h3>
                     <p className="text-xs text-slate-500 mt-1">Based on search term report data. Define your brand terms below.</p>
                 </div>
                 
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="e.g. nike, adidas (comma separated)" 
                        value={brandInput}
                        onChange={(e) => setBrandInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-white text-black placeholder:text-slate-400"
                    />
                 </div>
             </div>
          </div>

          <div className="p-6">
              {brandStats ? (
                  <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex justify-between items-center">
                              <div>
                                  <div className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1">Branded Spend</div>
                                  <div className="text-2xl font-black text-indigo-900">{formatCurrency(brandStats.branded.spend)}</div>
                              </div>
                              <div className="text-right">
                                  <div className="text-xs font-bold text-indigo-600 mb-1">ROAS</div>
                                  <div className="text-xl font-bold text-indigo-900">{formatNum(brandStats.branded.roas)}</div>
                              </div>
                          </div>
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                              <div>
                                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1">Non-Branded Spend</div>
                                  <div className="text-2xl font-black text-emerald-900">{formatCurrency(brandStats.nonBranded.spend)}</div>
                              </div>
                              <div className="text-right">
                                  <div className="text-xs font-bold text-emerald-600 mb-1">ROAS</div>
                                  <div className="text-xl font-bold text-emerald-900">{formatNum(brandStats.nonBranded.roas)}</div>
                              </div>
                          </div>
                      </div>

                      {/* Comparative Table */}
                      <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                              <thead>
                                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                                      <th className="py-3 px-4 text-left">Metric</th>
                                      <th className="py-3 px-4 text-right text-indigo-700">Branded</th>
                                      <th className="py-3 px-4 text-right text-emerald-700">Non-Branded</th>
                                      <th className="py-3 px-4 text-right text-slate-700">Total (Search Terms)</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                  <tr>
                                      <td className="py-3 px-4 font-bold">Spend</td>
                                      <td className="py-3 px-4 text-right">{formatCurrency(brandStats.branded.spend)} <span className="text-[10px] text-slate-400">({formatPct(brandStats.branded.spendShare)})</span></td>
                                      <td className="py-3 px-4 text-right">{formatCurrency(brandStats.nonBranded.spend)} <span className="text-[10px] text-slate-400">({formatPct(brandStats.nonBranded.spendShare)})</span></td>
                                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(brandStats.totalSpend)}</td>
                                  </tr>
                                  <tr>
                                      <td className="py-3 px-4 font-bold">Sales</td>
                                      <td className="py-3 px-4 text-right">{formatCurrency(brandStats.branded.sales)} <span className="text-[10px] text-slate-400">({formatPct(brandStats.branded.salesShare)})</span></td>
                                      <td className="py-3 px-4 text-right">{formatCurrency(brandStats.nonBranded.sales)} <span className="text-[10px] text-slate-400">({formatPct(brandStats.nonBranded.salesShare)})</span></td>
                                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(brandStats.totalSales)}</td>
                                  </tr>
                                  <tr>
                                      <td className="py-3 px-4 font-bold">ACOS</td>
                                      <td className="py-3 px-4 text-right font-bold text-indigo-600">{formatPct(brandStats.branded.acos)}</td>
                                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatPct(brandStats.nonBranded.acos)}</td>
                                      <td className="py-3 px-4 text-right">{formatPct(safeDiv(brandStats.totalSpend, brandStats.totalSales))}</td>
                                  </tr>
                                  <tr>
                                      <td className="py-3 px-4 font-bold">CPC</td>
                                      <td className="py-3 px-4 text-right">{formatExactCurrency(brandStats.branded.cpc)}</td>
                                      <td className="py-3 px-4 text-right">{formatExactCurrency(brandStats.nonBranded.cpc)}</td>
                                      <td className="py-3 px-4 text-right">-</td>
                                  </tr>
                                  <tr>
                                      <td className="py-3 px-4 font-bold">Orders</td>
                                      <td className="py-3 px-4 text-right">{formatInt(brandStats.branded.orders)}</td>
                                      <td className="py-3 px-4 text-right">{formatInt(brandStats.nonBranded.orders)}</td>
                                      <td className="py-3 px-4 text-right font-bold">{formatInt(brandStats.branded.orders + brandStats.nonBranded.orders)}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Tags className="w-10 h-10 mb-3 opacity-20" />
                      <p className="font-bold text-sm">Enter brand terms above to see the breakdown.</p>
                      <p className="text-xs mt-1">We'll analyze your search term data instantly.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
