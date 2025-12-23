import {
  DashboardData,
  Portfolio,
  SPCampaign,
  SPAdGroup,
  SBCampaign,
  SDCampaign,
  SearchTermData,
  Currency,
  SPSku,
  SPKeyword,
  SPProductTargeting,
  SBMAGEntity,
  SPPlacement,
  SBKeyword,
  SBTarget,
  SDTarget,
  BusinessReportRow,
  SBAd,
  SBPlacement
} from '../types';

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const generateMetrics = (budget: number) => {
  const spend = getRandomFloat(0, budget * 30);
  const impressions = Math.floor(spend * getRandomInt(800, 1500));
  const clicks = Math.floor(impressions * getRandomFloat(0.002, 0.015));
  const orders = Math.floor(clicks * getRandomFloat(0.05, 0.15));
  const sales = orders * getRandomFloat(20, 50);
  const units = orders * getRandomInt(1, 2);
  
  return { spend, impressions, clicks, orders, sales, units };
};

export const generateMockData = (): DashboardData => {
  const portfolios: Portfolio[] = Array.from({ length: 5 }).map((_, i) => ({
    id: `PF-${i}`,
    name: `Portfolio ${i + 1} - ${['Launch', 'Core', 'Defensive', 'Category', 'Brand'][i]}`,
    budgetAmount: getRandomInt(15000, 60000), 
    currency: Currency.USD,
    budgetPolicy: i % 2 === 0 ? 'Recurring Monthly' : 'Date Range',
    startDate: '2023-01-01',
    state: i === 4 ? 'archived' : 'enabled',
    inBudget: i !== 3,
  }));

  const spCampaigns: SPCampaign[] = Array.from({ length: 20 }).map((_, i) => {
    const budget = getRandomInt(20, 100);
    const metrics = generateMetrics(budget);
    return {
      campaignId: `SP-${i}`,
      name: `SP - Campaign ${i}`,
      portfolioId: portfolios[i % portfolios.length].id,
      startDate: '2023-01-01',
      state: i % 10 === 0 ? 'paused' : 'enabled',
      dailyBudget: budget,
      targetingType: i % 2 === 0 ? 'MANUAL' : 'AUTO',
      biddingStrategy: 'Dynamic Bids - Down Only',
      placement: 'Top of Search (First Page)',
      percentage: getRandomInt(0, 50),
      status: 'Running',
      ...metrics
    };
  });

  const spPlacements: SPPlacement[] = [];
  spCampaigns.forEach(c => {
    const tosMetrics = generateMetrics(c.dailyBudget * 0.4);
    const ppMetrics = generateMetrics(c.dailyBudget * 0.3);
    const rosMetrics = generateMetrics(c.dailyBudget * 0.2);
    const abMetrics = generateMetrics(c.dailyBudget * 0.1);
    
    spPlacements.push({
      campaignId: c.campaignId,
      campaignName: c.name,
      placement: 'Top of Search (First Page)',
      percentage: getRandomInt(10, 100),
      ...tosMetrics
    });
    
    spPlacements.push({
      campaignId: c.campaignId,
      campaignName: c.name,
      placement: 'Product Pages',
      percentage: getRandomInt(0, 50),
      ...ppMetrics
    });

    spPlacements.push({
      campaignId: c.campaignId,
      campaignName: c.name,
      placement: 'Rest of Search',
      percentage: 0,
      ...rosMetrics
    });

    if (Math.random() > 0.5) {
        spPlacements.push({
            campaignId: c.campaignId,
            campaignName: c.name,
            placement: 'Amazon Business',
            percentage: getRandomInt(0, 20),
            ...abMetrics
        });
    }
  });

  const spAdGroups: SPAdGroup[] = Array.from({ length: 40 }).map((_, i) => {
    const campaignId = `SP-${i % 20}`;
    const metrics = generateMetrics(20);
    return {
      adGroupId: `AG-${i}`,
      campaignId: campaignId,
      name: `Ad Group ${i} - ${['Exact', 'Phrase', 'Broad', 'Auto'][i % 4]}`,
      defaultBid: getRandomFloat(0.5, 2.0),
      state: i % 15 === 0 ? 'paused' : 'enabled',
      ...metrics
    };
  });

  const spSkus: SPSku[] = Array.from({ length: 60 }).map((_, i) => {
    const adGroupId = `AG-${i % 40}`;
    const campaignId = `SP-${i % 20}`;
    return {
      sku: `SKU-${getRandomInt(100, 999)}`,
      asin: `B00${getRandomInt(10000, 99999)}`,
      campaignId,
      adGroupId,
      state: i % 10 === 0 ? 'paused' : 'enabled',
      eligibilityStatus: i % 15 === 0 ? 'Ineligible' : 'Eligible',
      reasonForIneligibility: i % 15 === 0 ? 'Listing Suppressed' : undefined,
      ...generateMetrics(10)
    };
  });

  const spKeywords: SPKeyword[] = Array.from({ length: 150 }).map((_, i) => {
    const adGroupId = `AG-${i % 40}`;
    const campaignId = `SP-${i % 20}`;
    return {
      keywordId: `KW-${i}`,
      keywordText: `keyword ${i}`,
      matchType: ['BROAD', 'PHRASE', 'EXACT'][i % 3] as any,
      bid: getRandomFloat(0.5, 3.0),
      state: 'enabled',
      campaignId,
      adGroupId,
      ...generateMetrics(5)
    };
  });

  const spProductTargets: SPProductTargeting[] = Array.from({ length: 60 }).map((_, i) => {
    const adGroupId = `AG-${i % 40}`;
    const campaignId = `SP-${i % 20}`;
    
    const rand = Math.random();
    let expression = '';
    let resolvedExpression = '';

    if (rand < 0.3) {
        const asin = `B00${getRandomInt(50000, 99999)}`;
        expression = `asin="${asin}"`;
        resolvedExpression = expression;
    } else if (rand < 0.5) {
        expression = `category="12345"`;
        resolvedExpression = expression;
    } else if (rand < 0.625) {
        expression = `productType="queryHighRelMatches"`;
        resolvedExpression = expression;
    } else if (rand < 0.75) {
        expression = `productType="queryBroadRelMatches"`;
        resolvedExpression = expression;
    } else if (rand < 0.875) {
        expression = `productType="asinSubstituteRelated"`;
        resolvedExpression = expression;
    } else {
        expression = `productType="asinAccessoryRelated"`;
        resolvedExpression = expression;
    }

    return {
      targetId: `PT-${i}`,
      expression: expression,
      resolvedExpression: resolvedExpression,
      bid: getRandomFloat(0.75, 4.0),
      state: 'enabled',
      campaignId,
      adGroupId,
      ...generateMetrics(8)
    };
  });

  const sbCampaigns: SBCampaign[] = Array.from({ length: 10 }).map((_, i) => {
    const budget = getRandomInt(50, 200);
    const metrics = generateMetrics(budget);
    const formats: any[] = ['Video', 'Product Collection', 'Store Spotlight'];
    return {
      campaignId: `SB-${i}`,
      name: `SB - Brand ${i}`,
      portfolioId: portfolios[i % portfolios.length].id,
      startDate: '2023-02-01',
      budget,
      budgetType: 'DAILY',
      state: 'enabled',
      servingStatus: i === 2 ? 'REJECTED' : 'RUNNING',
      adFormat: formats[i % 3],
      landingPageUrl: 'https://amazon.com/store',
      ...metrics
    };
  });

  const sbPlacements: SBPlacement[] = [];
  sbCampaigns.forEach(c => {
     const tosMetrics = generateMetrics(c.budget * 0.4);
     const otherMetrics = generateMetrics(c.budget * 0.2);
     const detailMetrics = generateMetrics(c.budget * 0.3);
     const homeMetrics = generateMetrics(c.budget * 0.1);

     sbPlacements.push({
         campaignId: c.campaignId,
         placement: 'Top of Search',
         percentage: getRandomInt(0, 50),
         ...tosMetrics
     });
     sbPlacements.push({
        campaignId: c.campaignId,
        placement: 'Other',
        percentage: 0,
        ...otherMetrics
     });
     sbPlacements.push({
        campaignId: c.campaignId,
        placement: 'Detail Page',
        percentage: 0,
        ...detailMetrics
     });
     if (Math.random() > 0.5) {
       sbPlacements.push({
          campaignId: c.campaignId,
          placement: 'Home',
          percentage: 0,
          ...homeMetrics
       });
     }
  });

  const sbAds: SBAd[] = sbCampaigns.map((c, i) => {
      const metrics = generateMetrics(c.budget / 2);
      return {
          adId: `SBAD-${i}`,
          campaignId: c.campaignId,
          adGroupId: `${c.campaignId}-AG1`,
          name: `Ad for ${c.name}`,
          headline: `Discover the best ${['Running', 'Kitchen', 'Tech'][i % 3]} Gear`,
          format: c.adFormat,
          videoMediaIds: c.adFormat === 'Video' ? 'media-123' : undefined,
          landingPageUrl: c.landingPageUrl,
          brandLogoAssetId: 'logo-asset-123',
          ...metrics
      };
  });

  const sbKeywords: SBKeyword[] = Array.from({ length: 30 }).map((_, i) => {
      const campaign = sbCampaigns[i % 10];
      return {
          keywordId: `SBKW-${i}`,
          keywordText: `brand keyword ${i}`,
          matchType: ['BROAD', 'PHRASE', 'EXACT'][i % 3],
          bid: 1.5,
          campaignId: campaign.campaignId,
          adGroupId: `${campaign.campaignId}-AG1`,
          state: 'enabled',
          ...generateMetrics(10)
      };
  });

  const sbTargets: SBTarget[] = Array.from({ length: 10 }).map((_, i) => {
      const campaign = sbCampaigns[i % 10];
      return {
          targetId: `SBPT-${i}`,
          expression: `asin="B00${getRandomInt(50000, 99999)}"`,
          bid: 2.0,
          campaignId: campaign.campaignId,
          adGroupId: `${campaign.campaignId}-AG1`,
          state: 'enabled',
          ...generateMetrics(10)
      };
  });

  const sbMagEntities: SBMAGEntity[] = sbCampaigns.map(c => ({
    ...c,
    adGroupId: `${c.campaignId}-AG1`,
    adGroupName: 'Main Ad Group',
    creativeHeadline: 'Best Products for You'
  }));

  const sdCampaigns: SDCampaign[] = Array.from({ length: 8 }).map((_, i) => {
    const budget = getRandomInt(30, 150);
    const metrics = generateMetrics(budget);
    return {
      campaignId: `SD-${i}`,
      name: `SD - Retargeting ${i}`,
      portfolioId: portfolios[i % portfolios.length].id,
      startDate: '2023-03-01',
      state: 'enabled',
      tactic: i % 2 === 0 ? 'T00020' : 'T00030',
      costType: i % 2 === 0 ? 'CPC' : 'vCPM',
      viewableImpressions: metrics.impressions * 0.8,
      viewSales: metrics.sales * 1.2,
      viewOrders: metrics.orders * 1.2,
      viewUnits: metrics.units * 1.2,
      ...metrics
    };
  });

  const sdTargets: SDTarget[] = Array.from({ length: 20 }).map((_, i) => {
      const campaign = sdCampaigns[i % 8];
      return {
          targetId: `SDT-${i}`,
          expression: campaign.tactic === 'T00020' ? `asin="B00${getRandomInt(100, 900)}"` : 'audience="views"',
          bid: 1.5,
          campaignId: campaign.campaignId,
          adGroupId: `${campaign.campaignId}-AG1`,
          state: 'enabled',
          ...generateMetrics(15)
      };
  });

  const searchTerms: SearchTermData[] = Array.from({ length: 50 }).map((_, i) => {
    const metrics = generateMetrics(10);
    const matchType = ['EXACT', 'PHRASE', 'BROAD'][i % 3];
    return {
      searchTerm: `search query ${i}`,
      customerSearchTerm: `actual query ${i}`,
      targeting: matchType === 'EXACT' ? `actual query ${i}` : `keyword ${i}`,
      campaignName: `SP - Campaign ${i % 20}`,
      adGroupName: 'AG-1',
      matchType: matchType,
      type: 'SP',
      ...metrics,
      sales: i % 5 === 0 ? 0 : metrics.sales,
      spend: i % 5 === 0 ? 50 : metrics.spend,
    };
  });

  const businessReport: BusinessReportRow[] = [];
  const uniqueAsins = Array.from(new Set(spSkus.map(s => s.asin)));
  
  uniqueAsins.forEach(asin => {
      const refSku = spSkus.find(s => s.asin === asin);
      const basePrice = refSku && refSku.orders > 0 ? refSku.sales / refSku.orders : getRandomFloat(20, 100);
      
      const unitsOrdered = getRandomInt(50, 500);
      const orderedProductSales = unitsOrdered * basePrice;
      const sessions = Math.floor(unitsOrdered / getRandomFloat(0.05, 0.20));
      
      businessReport.push({
          childAsin: asin,
          parentAsin: `P-${asin}`,
          title: `Mock Product ${asin}`,
          sessions: sessions,
          sessionPercentage: 0.01,
          pageViews: Math.floor(sessions * 1.4),
          pageViewsPercentage: 0.01,
          buyBoxPercentage: getRandomFloat(0.85, 0.99),
          unitsOrdered: unitsOrdered,
          orderedProductSales: orderedProductSales,
          totalOrderItems: unitsOrdered
      });
  });

  return {
    portfolios,
    spCampaigns,
    spPlacements,
    spAdGroups,
    spSkus,
    spKeywords,
    spProductTargets,
    sbCampaigns,
    sbPlacements,
    sbKeywords,
    sbTargets,
    sbMagEntities,
    sbAds,
    sdCampaigns,
    sdTargets,
    searchTerms,
    businessReport,
  };
};
