export enum Currency {
  USD = 'USD',
  GBP = 'GBP',
  EUR = 'EUR',
}

export interface AppSettings {
  targetAcos: number;
  breakEvenAcos: number;
  minSpendThreshold: number; 
  minClickThreshold: number; 
  currencySymbol: string;
}

export interface ProductGoal {
  asin: string;
  targetAcos: number;
  strategy?: 'Launch' | 'Profit' | 'Liquidate';
}

export interface Portfolio {
  id: string;
  name: string;
  budgetAmount: number;
  currency: Currency;
  budgetPolicy: 'Date Range' | 'Recurring Monthly' | 'None';
  startDate: string;
  endDate?: string;
  state: 'enabled' | 'paused' | 'archived';
  inBudget: boolean;
}

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  sales: number;
  orders: number;
  units: number;
}

export interface BusinessReportRow {
  childAsin: string;
  parentAsin?: string;
  title?: string;
  sessions: number;
  sessionPercentage: number;
  pageViews: number;
  pageViewsPercentage: number;
  buyBoxPercentage: number;
  unitsOrdered: number;
  orderedProductSales: number;
  totalOrderItems: number;
}

export interface SPCampaign extends PerformanceMetrics {
  campaignId: string;
  name: string;
  portfolioId: string | null;
  startDate: string;
  endDate?: string;
  state: string;
  dailyBudget: number;
  targetingType: 'MANUAL' | 'AUTO';
  biddingStrategy: 'Legacy For Sales' | 'Dynamic Bids - Down Only' | 'Dynamic Bids - Up and Down' | 'Fixed Bids';
  placement?: string;
  percentage?: number;
  status: string;
}

export interface SPPlacement extends PerformanceMetrics {
  campaignId: string;
  placement: string;
  percentage: number;
  campaignName?: string;
}

export interface SPAdGroup extends PerformanceMetrics {
  adGroupId: string;
  campaignId: string;
  name: string;
  defaultBid: number;
  state: string;
}

export interface SPSku extends PerformanceMetrics {
  sku: string;
  asin: string;
  campaignId: string;
  adGroupId: string;
  state: string;
  eligibilityStatus: string;
  reasonForIneligibility?: string;
}

export interface SPKeyword extends PerformanceMetrics {
  keywordId: string;
  keywordText: string;
  matchType: 'BROAD' | 'PHRASE' | 'EXACT';
  bid: number;
  state: string;
  campaignId: string;
  adGroupId: string;
}

export interface SPProductTargeting extends PerformanceMetrics {
  targetId: string;
  expression: string;
  resolvedExpression: string;
  bid: number;
  state: string;
  campaignId: string;
  adGroupId: string;
}

export interface SBCampaign extends PerformanceMetrics {
  campaignId: string;
  name: string;
  portfolioId: string | null;
  budget: number;
  budgetType: 'DAILY' | 'LIFETIME';
  startDate: string;
  endDate?: string;
  state: string;
  servingStatus: string;
  adFormat: 'Video' | 'Product Collection' | 'Store Spotlight' | 'Legacy';
  landingPageUrl?: string;
  bidOptimization?: string;
}

export interface SBPlacement extends PerformanceMetrics {
  campaignId: string;
  placement: string;
  percentage: number;
}

export interface SBAd extends PerformanceMetrics {
  adId: string;
  campaignId: string;
  adGroupId: string;
  name?: string;
  headline?: string;
  creativeAsins?: string[];
  brandLogoAssetId?: string;
  videoMediaIds?: string;
  customImageAssetId?: string;
  landingPageUrl?: string;
  format: 'Video' | 'Product Collection' | 'Store Spotlight' | 'Legacy';
}

export interface SBKeyword extends PerformanceMetrics {
  keywordId: string;
  keywordText: string;
  matchType: string;
  bid: number;
  campaignId: string;
  adGroupId: string;
  state?: string;
}

export interface SBTarget extends PerformanceMetrics {
  targetId: string;
  expression: string;
  bid: number;
  campaignId: string;
  adGroupId: string;
  state?: string;
}

export interface SBMAGEntity extends SBCampaign {
  adGroupId: string;
  adGroupName: string;
  creativeHeadline: string;
}

export interface SDCampaign extends PerformanceMetrics {
  campaignId: string;
  name: string;
  portfolioId: string | null;
  tactic: 'T00020' | 'T00030';
  costType: 'CPC' | 'vCPM';
  state: string;
  viewableImpressions: number;
  viewSales: number;
  viewOrders: number;
  viewUnits: number;
}

export interface SDTarget extends PerformanceMetrics {
  targetId: string;
  expression: string;
  bid: number;
  campaignId: string;
  adGroupId: string;
  state?: string;
}

export interface SearchTermData extends PerformanceMetrics {
  searchTerm: string;
  customerSearchTerm: string;
  targeting: string;
  campaignName: string;
  adGroupName: string;
  campaignId?: string;
  adGroupId?: string;
  matchType: string;
  type: 'SP' | 'SB';
  asin?: string;
  lifecycle?: 'Discovery' | 'Validation' | 'Scaling' | 'Harvested' | 'Excluded';
  intent?: 'Branded' | 'Competitor' | 'Generic';
  recommendation?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

export interface DashboardData {
  portfolios: Portfolio[];
  spCampaigns: SPCampaign[];
  spPlacements: SPPlacement[];
  spAdGroups: SPAdGroup[];
  spSkus: SPSku[];
  spKeywords: SPKeyword[];
  spProductTargets: SPProductTargeting[];
  sbCampaigns: SBCampaign[];
  sbPlacements: SBPlacement[];
  sbAds: SBAd[];
  sbKeywords: SBKeyword[];
  sbTargets: SBTarget[];
  sbMagEntities: SBMAGEntity[];
  sdCampaigns: SDCampaign[];
  sdTargets: SDTarget[];
  searchTerms: SearchTermData[];
  businessReport: BusinessReportRow[]; 
}
