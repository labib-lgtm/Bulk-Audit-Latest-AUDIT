
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
  SBPlacement,
  InventoryRow,
  HourlyPerformanceRow,
  ProductCost,
  ProductGoal
} from '../types';

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

// Realistic E-commerce terms for Word Cloud / N-Gram
const ROOT_WORDS = ['Running', 'Walking', 'Gym', 'Training', 'Marathon', 'Trail', 'Hiking', 'Casual'];
const MODIFIERS = ['Shoes', 'Sneakers', 'Boots', 'Socks', 'Gear', 'Equipment', 'Accessories'];
const ADJECTIVES = ['Mens', 'Womens', 'Kids', 'Blue', 'Red', 'Black', 'White', 'Cheap', 'Best', 'Comfortable', 'Lightweight', 'Waterproof'];

const generateSearchTerm = () => {
    const adj = ADJECTIVES[getRandomInt(0, ADJECTIVES.length - 1)];
    const root = ROOT_WORDS[getRandomInt(0, ROOT_WORDS.length - 1)];
    const mod = MODIFIERS[getRandomInt(0, MODIFIERS.length - 1)];
    return `${adj} ${root} ${mod}`.toLowerCase();
};

const generateMetrics = (budget: number) => {
  const spend = getRandomFloat(0, budget * 30); // Monthly spend approx
  const impressions = Math.floor(spend * getRandomInt(800, 1500)); // CPM variance
  const clicks = Math.floor(impressions * getRandomFloat(0.002, 0.015)); // CTR 0.2% - 1.5%
  const orders = Math.floor(clicks * getRandomFloat(0.05, 0.15)); // CVR 5% - 15%
  const sales = orders * getRandomFloat(20, 50); // AOV $20-$50
  const units = orders * getRandomInt(1, 2);
  
  return { spend, impressions, clicks, orders, sales, units };
};

// Extended return type to include non-bulk state
export const generateMockData = (): DashboardData & { mockCosts: Record<string, ProductCost>, mockGoals: Record<string, ProductGoal> } => {
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
    // Make TOS perform better for the Calculator demo
    const tosMetrics = generateMetrics(c.dailyBudget * 0.4);
    tosMetrics.orders = Math.floor(tosMetrics.clicks * 0.15); // High CVR

    const ppMetrics = generateMetrics(c.dailyBudget * 0.3);
    ppMetrics.orders = Math.floor(ppMetrics.clicks * 0.05); // Lower CVR

    const rosMetrics = generateMetrics(c.dailyBudget * 0.2);
    
    // Add Amazon Business metrics
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

    spPlacements.push({
      campaignId: c.campaignId,
      campaignName: c.name,
      placement: 'Amazon Business',
      percentage: getRandomInt(0, 20),
      ...abMetrics
    });
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

  const uniqueAsinsList = Array.from({ length: 15 }).map((_, i) => `B00${getRandomInt(10000, 99999)}`);

  // Generate Mock Costs for Profitability
  const mockCosts: Record<string, ProductCost> = {};
  const mockGoals: Record<string, ProductGoal> = {};

  uniqueAsinsList.forEach((asin, i) => {
      // Assuming avg price is around 30-40 based on sales logic
      const estimatedPrice = 35;
      
      mockCosts[asin] = {
          asin,
          cogs: getRandomFloat(8, 12), // ~$10 COGS
          fbaFee: getRandomFloat(4, 7), // ~$5 FBA
          referralFeePct: 0.15,
          shipping: 0,
          miscCost: 0
      };

      // Set some specific goals for a few items
      if (i < 3) {
          mockGoals[asin] = {
              asin,
              targetAcos: 0.50, // Launching
              strategy: 'Launch'
          };
      } else if (i > 10) {
          mockGoals[asin] = {
              asin,
              targetAcos: 0.25, // Profit
              strategy: 'Profit'
          };
      }
  });

  const spSkus: SPSku[] = Array.from({ length: 60 }).map((_, i) => {
    const adGroupId = `AG-${i % 40}`;
    const campaignId = `SP-${i % 20}`;
    const asin = uniqueAsinsList[i % uniqueAsinsList.length];
    return {
      sku: `SKU-${getRandomInt(100, 999)}`,
      asin: asin,
      campaignId,
      adGroupId,
      state: i % 10 === 0 ? 'paused' : 'enabled',
      eligibilityStatus: 'Eligible',
      ...generateMetrics(10)
    };
  });

  const spKeywords: SPKeyword[] = Array.from({ length: 150 }).map((_, i) => {
    const adGroupId = `AG-${i % 40}`;
    const campaignId = `SP-${i % 20}`;
    return {
      keywordId: `KW-${i}`,
      keywordText: generateSearchTerm(),
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
    return {
      targetId: `PT-${i}`,
      expression: `asin="B00${getRandomInt(50000, 99999)}"`,
      resolvedExpression: `asin="B00${getRandomInt(50000, 99999)}"`,
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
      servingStatus: 'RUNNING',
      adFormat: formats[i % 3],
      landingPageUrl: 'https://amazon.com/store',
      ...metrics
    };
  });

  const sbPlacements: SBPlacement[] = [];
  sbCampaigns.forEach(c => {
     const tosMetrics = generateMetrics(c.budget * 0.4);
     sbPlacements.push({
         campaignId: c.campaignId,
         placement: 'Top of Search',
         percentage: getRandomInt(0, 50),
         ...tosMetrics
     });
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
          creativeAsins: [uniqueAsinsList[i % uniqueAsinsList.length]],
          ...metrics
      };
  });

  const sbKeywords: SBKeyword[] = Array.from({ length: 30 }).map((_, i) => {
      const campaign = sbCampaigns[i % 10];
      return {
          keywordId: `SBKW-${i}`,
          keywordText: generateSearchTerm(),
          matchType: 'BROAD',
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

  const sbMagEntities: SBMAGEntity[] = [];

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

  // Create a pool of high-volume "Root" terms to simulate cannibalization/overlap
  const duplicateRoots = ['running shoes', 'gym accessories', 'wireless headphones', 'yoga mat'];

  const searchTerms: SearchTermData[] = Array.from({ length: 150 }).map((_, i) => {
    let term = generateSearchTerm();
    let targeting = term; // Default targeting = term
    let matchType = ['EXACT', 'PHRASE', 'BROAD'][i % 3];
    
    // Simulate Cannibalization (Overlap)
    // For the first 30 rows, reuse the duplicateRoots
    if (i < 30) {
        const root = duplicateRoots[i % duplicateRoots.length];
        term = root; // Same search term
        
        // Spread across different campaigns to simulate conflict
        // e.g. Campaign 0 and Campaign 1 both target "running shoes"
        const campIndex = i % 5; 
        
        // Vary match types to show full matrix
        matchType = ['EXACT', 'PHRASE', 'BROAD', 'EXACT', 'PHRASE'][i % 5];
        
        // Sometimes targeting is the term, sometimes it's a slightly different keyword (Phrase/Broad match behavior)
        if (matchType !== 'EXACT') {
            targeting = `${root} for men`; 
        } else {
            targeting = root;
        }
    } else if (i < 50) {
        // Simulate "Targeting View" grouping
        // Different search terms triggering the SAME targeting
        targeting = "mens running sneakers"; // A broad keyword
        term = `${['blue', 'red', 'cheap', 'best'][i % 4]} mens running sneakers`;
    }

    const metrics = generateMetrics(15);
    // Simulate some bleeders and winners
    const isBleeder = i % 10 === 0;
    const isWinner = i % 15 === 0;

    // Ensure overlap terms have enough spend to show up
    if (i < 30) {
        metrics.spend += 50; 
        metrics.clicks += 20;
    }

    return {
      searchTerm: term,
      customerSearchTerm: term,
      targeting: targeting,
      campaignName: `SP - Campaign ${i % 20}`,
      adGroupName: 'AG-1',
      campaignId: `SP-${i % 20}`,
      adGroupId: `AG-${i % 40}`,
      matchType: matchType,
      type: 'SP',
      ...metrics,
      sales: isBleeder ? 0 : (isWinner ? metrics.spend * 5 : metrics.sales),
      orders: isBleeder ? 0 : (isWinner ? Math.floor(metrics.clicks * 0.3) : metrics.orders),
      clicks: isBleeder ? getRandomInt(20, 50) : metrics.clicks,
      spend: isBleeder ? getRandomFloat(30, 80) : metrics.spend
    };
  });

  const businessReport: BusinessReportRow[] = [];
  
  uniqueAsinsList.forEach(asin => {
      const unitsOrdered = getRandomInt(50, 500);
      const orderedProductSales = unitsOrdered * getRandomFloat(30, 45); // Aligns with estimated price
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

  // Generate Inventory (Ensure some are Low Stock)
  const inventory: InventoryRow[] = uniqueAsinsList.map((asin, i) => {
      // 20% chance of being low stock
      const isLowStock = i < 3; 
      const salesVelocity = businessReport.find(b => b.childAsin === asin)?.unitsOrdered || 10;
      const weeklySales = salesVelocity / 4;
      
      return {
          sku: `SKU-${asin}`,
          fnsku: `FNSKU-${asin}`,
          asin: asin,
          productName: `Mock Product ${asin}`,
          condition: 'New',
          price: 35.99,
          mfnListingExists: false,
          mfnFulfillableQuantity: 0,
          afnListingExists: true,
          afnWarehouseQuantity: 0,
          // If low stock, set qty to cover 1 week. Else 8 weeks.
          afnFulfillableQuantity: isLowStock ? Math.floor(weeklySales * 1) : Math.floor(weeklySales * 8),
          afnUnsellableQuantity: 0,
          afnReservedQuantity: 0,
          afnTotalQuantity: 0,
          perUnitVolume: 0.1,
          afnInboundWorkingQuantity: 0,
          afnInboundShippedQuantity: 0,
          afnInboundReceivingQuantity: 0
      };
  });

  // Generate Hourly Report (Dayparting Curve) with Campaign Context
  const hourlyReport: HourlyPerformanceRow[] = [];
  const date = '2023-10-01';
  
  // Create granular hourly data for top 5 campaigns
  const activeCampaigns = spCampaigns.slice(0, 5); 

  for (let hour = 0; hour < 24; hour++) {
      // Curve: Low 0-6, Rising 7-10, Stable 11-16, Peak 17-21, Drop 22-23
      let multiplier = 1;
      if (hour < 6) multiplier = 0.2;
      else if (hour < 10) multiplier = 0.8;
      else if (hour < 17) multiplier = 1.0;
      else if (hour < 22) multiplier = 1.5; // Peak
      else multiplier = 0.5;

      // Distribute across a few campaigns to allow filtering
      activeCampaigns.forEach((camp, idx) => {
          // Add some randomness per campaign so they don't look identical
          const campMult = multiplier * (0.8 + Math.random() * 0.4);
          const baseSpend = (20 + (idx * 5)) * campMult; // Vary base spend by campaign

          hourlyReport.push({
              date,
              hour,
              campaignName: camp.name,
              spend: baseSpend * getRandomFloat(0.8, 1.2),
              sales: baseSpend * (campMult > 1 ? 4 : 2) * getRandomFloat(0.8, 1.2), // Better ROAS during peak
              clicks: Math.floor(baseSpend / 1.5),
              impressions: Math.floor(baseSpend * 100),
              orders: Math.floor((baseSpend * (campMult > 1 ? 4 : 2)) / 30)
          });
      });
  }

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
    inventory,
    hourlyReport,
    mockCosts,
    mockGoals
  };
};
