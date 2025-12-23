import * as XLSX from 'xlsx';
import { 
  DashboardData, Portfolio, SPCampaign, SPAdGroup, SPSku, SPKeyword, SPProductTargeting, 
  SBCampaign, SDCampaign, SearchTermData, Currency, SPPlacement, SBKeyword, SBTarget, SDTarget, BusinessReportRow, SBAd
} from '../types';

// Helper to safely parse numbers
const parseNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const clean = val.replace(/[^0-9.-]+/g, '');
    return parseFloat(clean) || 0;
  }
  return 0;
};

// Helper to safely parse percentage strings (e.g. "12%")
const parsePct = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const clean = val.replace(/[^0-9.-]+/g, '');
        return (parseFloat(clean) || 0) / 100;
    }
    return 0;
};

// Helper to safely parse dates
const parseDate = (val: any): string => {
    if (!val) return '';
    return String(val);
};

// Robust helper to get value from row with fuzzy key matching
const getVal = (row: any, possibleKeys: string[]): any => {
  for (const targetKey of possibleKeys) {
    if (row[targetKey] !== undefined) return row[targetKey];
  }
  const rowKeys = Object.keys(row);
  for (const targetKey of possibleKeys) {
    const cleanTarget = targetKey.trim().toLowerCase();
    const matchingKey = rowKeys.find(k => {
        const cleanK = k.trim().toLowerCase();
        if (cleanK === cleanTarget) return true;
        if (cleanK.startsWith(cleanTarget + ' ') || cleanK.startsWith(cleanTarget + '(')) return true;
        return false;
    });
    if (matchingKey && row[matchingKey] !== undefined) return row[matchingKey];
  }
  return undefined;
};

// Helper to normalize state to 'enabled', 'paused', 'archived'
const normalizeState = (val: any): string => {
    if (!val) return 'enabled'; // Default to enabled if missing
    return String(val).toLowerCase();
};

const findHeaderRowAndGetData = (sheet: XLSX.WorkSheet, requiredHeaders: string[]): any[] => {
    if (!sheet) return [];
    const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    let headerIndex = 0;
    let found = false;
    for (let i = 0; i < Math.min(aoa.length, 50); i++) {
        const row = aoa[i];
        if (Array.isArray(row)) {
            const rowValues = row.map(c => String(c).toLowerCase().trim());
            const hasMatch = requiredHeaders.some(h => rowValues.includes(h.toLowerCase()));
            if (hasMatch) {
                headerIndex = i;
                found = true;
                break;
            }
        }
    }
    if (found) {
        const rawHeaderRow = aoa[headerIndex] as any[];
        const cleanHeaders = rawHeaderRow.map(cell => String(cell || '').trim());
        return XLSX.utils.sheet_to_json(sheet, { header: cleanHeaders, range: headerIndex + 1 });
    }
    return XLSX.utils.sheet_to_json(sheet, { range: 0 });
};

const normalizePlacementName = (raw: string): string => {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('top of search')) return 'Top of Search';
  if (lower.includes('product page') || lower.includes('detail page')) return 'Detail Page';
  if (lower.includes('rest of search')) return 'Rest of Search';
  if (lower.includes('home')) return 'Home';
  if (lower.includes('other')) return 'Other';
  if (lower.includes('amazon business')) return 'Amazon Business';
  return raw;
};

const getMetrics = (row: any) => {
  return {
    impressions: parseNum(getVal(row, ['Impressions', 'Imps'])),
    clicks: parseNum(getVal(row, ['Clicks'])),
    spend: parseNum(getVal(row, ['Spend', 'Cost', 'Spend(USD)', 'Spend (USD)'])),
    sales: parseNum(getVal(row, ['Sales', '7 Day Total Sales', '14 Day Total Sales', '30 Day Total Sales', 'Total Sales', '14 Day Total Sales (USD)'])),
    orders: parseNum(getVal(row, ['Orders', '7 Day Total Orders', '14 Day Total Orders', '30 Day Total Orders', 'Total Orders'])),
    units: parseNum(getVal(row, ['Units', '7 Day Total Units', '14 Day Total Units', 'Total Units']))
  };
};

export const processBusinessReport = async (file: File): Promise<BusinessReportRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = findHeaderRowAndGetData(sheet, ['(Child) ASIN', 'Child ASIN', 'ASIN']);
                const processedRows: BusinessReportRow[] = rows.map(r => ({
                    childAsin: String(getVal(r, ['(Child) ASIN', 'Child ASIN', 'ASIN']) || '').trim(),
                    parentAsin: String(getVal(r, ['(Parent) ASIN', 'Parent ASIN']) || '').trim(),
                    title: String(getVal(r, ['Title']) || ''),
                    sessions: parseNum(getVal(r, ['Sessions', 'Sessions - Total', 'Session'])),
                    sessionPercentage: parsePct(getVal(r, ['Session Percentage', 'Session percentage'])),
                    pageViews: parseNum(getVal(r, ['Page Views', 'Page views', 'Page Views - Total', 'Page View'])),
                    pageViewsPercentage: parsePct(getVal(r, ['Page Views Percentage'])),
                    buyBoxPercentage: parsePct(getVal(r, ['Buy Box Percentage', 'Featured Offer (Buy Box) Percentage'])),
                    unitsOrdered: parseNum(getVal(r, ['Units Ordered', 'Units ordered', 'Units Ordered - Total'])),
                    orderedProductSales: parseNum(getVal(r, ['Ordered Product Sales', 'Ordered product sales', 'Ordered Product Sales - Total'])),
                    totalOrderItems: parseNum(getVal(r, ['Total Order Items']))
                })).filter(r => r.childAsin && r.childAsin.length > 0);
                resolve(processedRows);
            } catch (err) {
                console.error("Error parsing business report", err);
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

export const processBulkFile = async (file: File): Promise<DashboardData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const dashboardData: DashboardData = {
          portfolios: [], spCampaigns: [], spPlacements: [], spAdGroups: [], spSkus: [], spKeywords: [], spProductTargets: [],
          sbCampaigns: [], sbPlacements: [], sbAds: [], sbKeywords: [], sbTargets: [], sbMagEntities: [],
          sdCampaigns: [], sdTargets: [], searchTerms: [], businessReport: []
        };

        const portfolioSheet = workbook.Sheets['Portfolios'];
        if (portfolioSheet) {
          const rows = XLSX.utils.sheet_to_json<any>(portfolioSheet);
          dashboardData.portfolios = rows.map(r => ({
            id: String(getVal(r, ['Portfolio ID', 'Portfolio Id'])),
            name: getVal(r, ['Portfolio Name']),
            budgetAmount: parseNum(getVal(r, ['Budget Amount'])),
            currency: getVal(r, ['Budget Currency Code']) as Currency || Currency.USD,
            budgetPolicy: getVal(r, ['Budget Policy']) as any,
            startDate: parseDate(getVal(r, ['Budget Start Date'])),
            endDate: parseDate(getVal(r, ['Budget End Date'])),
            state: normalizeState(getVal(r, ['State'])) as any,
            inBudget: String(getVal(r, ['In Budget'])).toLowerCase() === 'true'
          }));
        }

        const spSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('sponsored products'));
        const spSheet = spSheetName ? workbook.Sheets[spSheetName] : null;
        if (spSheet) {
          const rows = findHeaderRowAndGetData(spSheet, ['Campaign ID', 'Entity']);
          dashboardData.spCampaigns = rows.filter(r => {
                const entity = getVal(r, ['Entity']);
                if (entity && entity.trim() === 'Campaign') return true;
                const campaignId = getVal(r, ['Campaign ID', 'Campaign Id']);
                const adGroupId = getVal(r, ['Ad Group ID', 'Ad Group Id']);
                const name = getVal(r, ['Campaign Name', 'Campaign']);
                return campaignId && !adGroupId && name;
            }).map(r => {
              const metrics = getMetrics(r);
              const campaignId = String(getVal(r, ['Campaign ID', 'Campaign Id']));
              return {
                campaignId: campaignId,
                name: getVal(r, ['Campaign Name', 'Campaign']) || `Campaign ${campaignId}`, 
                portfolioId: getVal(r, ['Portfolio ID', 'Portfolio Id']) ? String(getVal(r, ['Portfolio ID', 'Portfolio Id'])) : null,
                startDate: parseDate(getVal(r, ['Start Date'])),
                endDate: parseDate(getVal(r, ['End Date'])),
                state: normalizeState(getVal(r, ['State'])),
                dailyBudget: parseNum(getVal(r, ['Daily Budget'])),
                targetingType: getVal(r, ['Targeting Type']) as any,
                biddingStrategy: getVal(r, ['Bidding Strategy']) as any,
                placement: getVal(r, ['Placement']),
                percentage: parseNum(getVal(r, ['Percentage'])),
                status: getVal(r, ['Campaign State']),
                ...metrics
              };
            });

          dashboardData.spPlacements = rows.filter(r => {
               const entity = String(getVal(r, ['Entity']) || '').trim();
               const placement = String(getVal(r, ['Placement', 'Placement Type', 'Placement Name']) || '').trim();
               const keyword = getVal(r, ['Keyword Text']);
               const sku = getVal(r, ['SKU']);
               const target = getVal(r, ['Product Targeting Expression']);
               const isPlacementEntity = entity === 'Bidding Adjustment' || entity === 'Placement';
               const hasPlacementValue = placement.length > 2;
               return (isPlacementEntity || hasPlacementValue) && !keyword && !sku && !target;
            }).map(r => {
              const metrics = getMetrics(r);
              const campaignId = String(getVal(r, ['Campaign ID', 'Campaign Id']));
              const rawPlacement = String(getVal(r, ['Placement', 'Placement Type', 'Placement Name']) || '').trim();
              return {
                 campaignId: campaignId,
                 placement: normalizePlacementName(rawPlacement),
                 percentage: parseNum(getVal(r, ['Percentage'])),
                 ...metrics
              };
            }).filter(p => p.placement.length > 0 && p.campaignId.length > 0);

          const placementCampaignIds = new Set(dashboardData.spPlacements.map(p => p.campaignId));
          const knownCampaignIds = new Set(dashboardData.spCampaigns.map(c => c.campaignId));
          placementCampaignIds.forEach(id => {
              if (id && !knownCampaignIds.has(id)) {
                  dashboardData.spCampaigns.push({
                      campaignId: id,
                      name: `Campaign ${id} (From Placement Data)`,
                      portfolioId: null,
                      startDate: '',
                      state: 'enabled',
                      dailyBudget: 0,
                      targetingType: 'MANUAL',
                      biddingStrategy: 'Fixed Bids',
                      status: 'Running',
                      impressions: 0, clicks: 0, spend: 0, sales: 0, orders: 0, units: 0
                  });
              }
          });

          dashboardData.spAdGroups = rows.filter(r => {
                const entity = getVal(r, ['Entity']);
                const adGroupId = getVal(r, ['Ad Group ID', 'Ad Group Id']);
                const keywordText = getVal(r, ['Keyword Text']);
                const sku = getVal(r, ['SKU']);
                if (entity && entity === 'Ad Group') return true;
                return adGroupId && !keywordText && !sku;
            }).map(r => {
               const metrics = getMetrics(r);
               return {
                  adGroupId: String(getVal(r, ['Ad Group ID', 'Ad Group Id'])),
                  campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                  name: getVal(r, ['Ad Group Name']) || `AG ${getVal(r, ['Ad Group ID', 'Ad Group Id'])}`,
                  defaultBid: parseNum(getVal(r, ['Ad Group Default Bid'])),
                  state: normalizeState(getVal(r, ['State'])),
                  ...metrics
               };
            });

          dashboardData.spSkus = rows.filter(r => {
                 const entity = getVal(r, ['Entity']);
                 const sku = getVal(r, ['SKU']);
                 if (entity && entity === 'Product Ad') return true;
                 return sku && getVal(r, ['Ad Group ID', 'Ad Group Id']);
            }).map(r => {
               const metrics = getMetrics(r);
               return {
                  sku: getVal(r, ['SKU']),
                  asin: String(getVal(r, ['ASIN']) || '').trim(),
                  campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                  adGroupId: String(getVal(r, ['Ad Group ID', 'Ad Group Id'])),
                  state: normalizeState(getVal(r, ['State'])),
                  eligibilityStatus: getVal(r, ['Eligibility Status']) || 'Eligible',
                  reasonForIneligibility: getVal(r, ['Reason for Ineligibility']),
                  ...metrics
               };
            });

          dashboardData.spKeywords = rows.filter(r => {
                 const entity = getVal(r, ['Entity']);
                 const keywordText = getVal(r, ['Keyword Text']);
                 if (entity && entity === 'Keyword') return true;
                 return keywordText && getVal(r, ['Match Type']);
            }).map(r => {
               const metrics = getMetrics(r);
               return {
                  keywordId: String(getVal(r, ['Keyword ID', 'Keyword Id'])),
                  keywordText: getVal(r, ['Keyword Text']),
                  matchType: String(getVal(r, ['Match Type']) || '').toUpperCase() as any,
                  bid: parseNum(getVal(r, ['Bid'])),
                  state: normalizeState(getVal(r, ['State'])),
                  campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                  adGroupId: String(getVal(r, ['Ad Group ID', 'Ad Group Id'])),
                  ...metrics
               };
            });
            
           dashboardData.spProductTargets = rows.filter(r => {
                 const entity = getVal(r, ['Entity']);
                 const target = getVal(r, ['Product Targeting Expression']);
                 if (entity && entity === 'Product Targeting') return true;
                 return target;
             }).map(r => {
               const metrics = getMetrics(r);
               return {
                 targetId: String(getVal(r, ['Product Targeting ID', 'Product Targeting Id'])),
                 expression: getVal(r, ['Product Targeting Expression']),
                 resolvedExpression: getVal(r, ['Resolved Product Targeting Expression']) || getVal(r, ['Product Targeting Expression']),
                 bid: parseNum(getVal(r, ['Bid'])),
                 state: normalizeState(getVal(r, ['State'])),
                 campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                 adGroupId: String(getVal(r, ['Ad Group ID', 'Ad Group Id'])),
                 ...metrics
               };
             });
        }

        const sbSheetNames = workbook.SheetNames.filter(n => {
            const lower = n.toLowerCase();
            if (lower.includes('search term') || lower.includes('search_term') || lower.includes('portfolio')) return false;
            if (lower.includes('brand') || lower.includes('sb multi ad group') || lower.includes('multi ad group')) return true;
            return false;
        });
        
        let allSbRows: any[] = [];
        sbSheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const rows = findHeaderRowAndGetData(sheet, ['Campaign ID', 'Entity']);
            if (rows.length > 0) allSbRows = [...allSbRows, ...rows];
        });

        dashboardData.sbCampaigns = allSbRows.filter(r => {
                 const entity = getVal(r, ['Entity']);
                 if (entity) return entity === 'Campaign';
                 const campaignId = getVal(r, ['Campaign ID', 'Campaign Id']);
                 const adGroupId = getVal(r, ['Ad Group ID', 'Ad Group Id']);
                 const name = getVal(r, ['Campaign Name']);
                 return campaignId && !adGroupId && name;
             }).map(r => {
                const metrics = getMetrics(r);
                const campaignId = String(getVal(r, ['Campaign ID', 'Campaign Id']));
                return {
                    campaignId: campaignId,
                    name: getVal(r, ['Campaign Name']) || `Campaign ${campaignId}`,
                    portfolioId: getVal(r, ['Portfolio ID', 'Portfolio Id']) ? String(getVal(r, ['Portfolio ID', 'Portfolio Id'])) : null,
                    startDate: parseDate(getVal(r, ['Start Date'])),
                    endDate: parseDate(getVal(r, ['End Date'])),
                    budget: parseNum(getVal(r, ['Budget'])),
                    budgetType: getVal(r, ['Budget Type']) as any,
                    state: normalizeState(getVal(r, ['State'])),
                    servingStatus: getVal(r, ['Campaign Serving Status']),
                    adFormat: getVal(r, ['Ad Format']) as any || 'Product Collection',
                    landingPageUrl: getVal(r, ['Landing Page URL']),
                    bidOptimization: getVal(r, ['Bid Optimization']),
                    ...metrics
                };
             });

        dashboardData.sbPlacements = allSbRows.filter(r => {
               const placement = String(getVal(r, ['Placement', 'Placement Type', 'Placement Name']) || '').trim();
               const lower = placement.toLowerCase();
               const isSbPlacement = lower.includes('top of search') || lower.includes('detail page') || lower.includes('product page') || lower.includes('home') || lower.includes('other') || lower.includes('rest of search');
               const campaignId = getVal(r, ['Campaign ID', 'Campaign Id']);
               return isSbPlacement && campaignId;
            }).map(r => {
                const metrics = getMetrics(r);
                return {
                    campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                    placement: normalizePlacementName(String(getVal(r, ['Placement', 'Placement Type', 'Placement Name']) || '')),
                    percentage: parseNum(getVal(r, ['Percentage', 'Bid Adjustment'])), 
                    ...metrics
                };
            });

        dashboardData.sbAds = allSbRows.filter(r => {
                const entity = getVal(r, ['Entity']);
                if (entity && entity === 'Ad') return true;
                const creative = getVal(r, ['Creative Headline', 'Headline', 'Brand Logo Asset ID']);
                const adGroupId = getVal(r, ['Ad Group ID']);
                return creative && adGroupId;
             }).map(r => {
                 const metrics = getMetrics(r);
                 const asinsStr = getVal(r, ['Creative ASINs', 'Sold on Amazon']);
                 return {
                     adId: String(getVal(r, ['Ad ID', 'Ad Id']) || `AD-${Math.random().toString(36).substr(2,9)}`),
                     campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                     adGroupId: String(getVal(r, ['Ad Group ID', 'Ad Group Id'])),
                     name: getVal(r, ['Ad Name']),
                     headline: getVal(r, ['Creative Headline', 'Headline']),
                     brandLogoAssetId: getVal(r, ['Brand Logo Asset ID']),
                     videoMediaIds: getVal(r, ['Video Media IDs', 'Media ID']),
                     customImageAssetId: getVal(r, ['Custom Image Asset ID']),
                     landingPageUrl: getVal(r, ['Landing Page URL']),
                     creativeAsins: asinsStr ? String(asinsStr).split(',').map(s => s.trim()) : [],
                     format: getVal(r, ['Ad Format']) || 'Legacy',
                     ...metrics
                 };
             });

        dashboardData.sbKeywords = allSbRows.filter(r => {
                 const entity = getVal(r, ['Entity']);
                 const keyword = getVal(r, ['Keyword Text']);
                 if (entity) return entity === 'Keyword';
                 return keyword && getVal(r, ['Match Type']);
             }).map(r => {
                 const metrics = getMetrics(r);
                 return {
                     keywordId: String(getVal(r, ['Keyword ID', 'Keyword Id']) || `KW-${Math.random()}`),
                     keywordText: getVal(r, ['Keyword Text']),
                     matchType: String(getVal(r, ['Match Type']) || '').toUpperCase(),
                     bid: parseNum(getVal(r, ['Bid'])),
                     campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                     adGroupId: String(getVal(r, ['Ad Group ID', 'Ad Group Id'])),
                     state: normalizeState(getVal(r, ['State'])),
                     ...metrics
                 };
             });

        dashboardData.sbTargets = allSbRows.filter(r => {
                 const entity = getVal(r, ['Entity']);
                 const target = getVal(r, ['Product Targeting Expression']);
                 if (entity) return entity === 'Product Targeting';
                 return target;
             }).map(r => {
                 const metrics = getMetrics(r);
                 return {
                     targetId: String(getVal(r, ['Product Targeting ID', 'Target Id']) || `PT-${Math.random()}`),
                     expression: getVal(r, ['Product Targeting Expression']),
                     bid: parseNum(getVal(r, ['Bid'])),
                     campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                     adGroupId: String(getVal(r, ['Ad Group ID', 'Ad Group Id'])),
                     state: normalizeState(getVal(r, ['State'])),
                     ...metrics
                 };
             });

        const uniqueCampaigns = new Map();
        dashboardData.sbCampaigns.forEach(c => {
            if (!uniqueCampaigns.has(c.campaignId)) {
                uniqueCampaigns.set(c.campaignId, c);
            } else {
                const existing = uniqueCampaigns.get(c.campaignId);
                existing.spend += c.spend;
                existing.sales += c.sales;
                existing.orders += c.orders;
                existing.clicks += c.clicks;
                existing.impressions += c.impressions;
            }
        });
        dashboardData.sbCampaigns = Array.from(uniqueCampaigns.values());
        
        const sdSheetName = workbook.SheetNames.find(n => n.includes('Sponsored Display'));
        const sdSheet = sdSheetName ? workbook.Sheets[sdSheetName] : null;
        if (sdSheet) {
            const rows = findHeaderRowAndGetData(sdSheet, ['Campaign ID', 'Entity']);
            dashboardData.sdCampaigns = rows.filter(r => {
                  const entity = getVal(r, ['Entity']);
                  if (entity) return entity === 'Campaign';
                  return false;
              }).map(r => {
                 const metrics = getMetrics(r);
                 return {
                     campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                     name: getVal(r, ['Campaign Name']),
                     portfolioId: getVal(r, ['Portfolio ID', 'Portfolio Id']) ? String(getVal(r, ['Portfolio ID', 'Portfolio Id'])) : null,
                     tactic: getVal(r, ['Tactic']),
                     costType: getVal(r, ['Cost Type']),
                     state: normalizeState(getVal(r, ['State'])),
                     viewableImpressions: parseNum(getVal(r, ['Viewable Impressions'])),
                     viewSales: parseNum(getVal(r, ['Sales (Views & Clicks)', 'View Sales'])) || 0,
                     viewOrders: parseNum(getVal(r, ['Orders (Views & Clicks)', 'View Orders'])) || 0,
                     viewUnits: parseNum(getVal(r, ['Units (Views & Clicks)', 'View Units'])) || 0,
                     ...metrics
                 };
              });

            dashboardData.sdTargets = rows.filter(r => {
                  const entity = getVal(r, ['Entity']);
                  if (entity) return entity === 'Product Targeting' || entity === 'Audience';
                  return getVal(r, ['Product Targeting Expression']) || getVal(r, ['Audience Expression']);
              }).map(r => {
                  const metrics = getMetrics(r);
                  return {
                      targetId: String(getVal(r, ['Targeting ID', 'Target Id']) || `SDT-${Math.random()}`),
                      expression: getVal(r, ['Product Targeting Expression']) || getVal(r, ['Audience Expression']) || 'Unknown Target',
                      bid: parseNum(getVal(r, ['Bid'])),
                      campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                      adGroupId: String(getVal(r, ['Ad Group ID', 'Ad Group Id'])),
                      state: normalizeState(getVal(r, ['State'])),
                      ...metrics
                  };
              });
        }

        dashboardData.searchTerms = [];
        const spStSheetName = workbook.SheetNames.find(n => {
            const lower = n.toLowerCase();
            return (lower.includes('sponsored products search term') || lower.includes('search term report')) && !lower.includes('sponsored brands') && !lower.includes('sb search term');
        });
        
        if (spStSheetName) {
            const rows = findHeaderRowAndGetData(workbook.Sheets[spStSheetName], ['Search Term', 'Customer Search Term', 'Impressions', 'Clicks']);
            const spTerms = rows.map(r => {
                const metrics = getMetrics(r);
                const t1 = getVal(r, ['Targeting', 'Target', 'Target Value']);
                const t2 = getVal(r, ['Keyword Text', 'Keyword']);
                const t3 = getVal(r, ['Product Targeting Expression', 'Product Targeting', 'Targeting Expression']);
                const finalTargeting = (t1 && String(t1).trim().length > 0) ? t1 : (t2 && String(t2).trim().length > 0) ? t2 : (t3 && String(t3).trim().length > 0) ? t3 : 'Unknown';
                return {
                    searchTerm: getVal(r, ['Customer Search Term', 'Search Term']),
                    customerSearchTerm: getVal(r, ['Customer Search Term', 'Search Term']),
                    targeting: finalTargeting,
                    campaignName: getVal(r, ['Campaign Name']),
                    adGroupName: getVal(r, ['Ad Group Name']),
                    campaignId: getVal(r, ['Campaign ID', 'Campaign Id']),
                    adGroupId: getVal(r, ['Ad Group ID', 'Ad Group Id']),
                    matchType: getVal(r, ['Match Type']),
                    type: 'SP' as const,
                    ...metrics
                };
            }).filter(r => r.searchTerm);
            dashboardData.searchTerms.push(...spTerms);
        }

        const sbStSheetName = workbook.SheetNames.find(n => {
            const lower = n.toLowerCase();
            return lower.includes('sponsored brands search term') || lower.includes('sb search term');
        });
        
        if (sbStSheetName) {
            const rows = findHeaderRowAndGetData(workbook.Sheets[sbStSheetName], ['Search Term', 'Customer Search Term', 'Impressions', 'Clicks']);
            const sbTerms = rows.map(r => {
                const metrics = getMetrics(r);
                const t1 = getVal(r, ['Targeting', 'Target']);
                const t2 = getVal(r, ['Keyword Text', 'Keyword']);
                const finalTargeting = (t1 && String(t1).trim().length > 0) ? t1 : (t2 && String(t2).trim().length > 0) ? t2 : 'Unknown';
                return {
                    searchTerm: getVal(r, ['Customer Search Term', 'Search Term']),
                    customerSearchTerm: getVal(r, ['Customer Search Term', 'Search Term']),
                    targeting: finalTargeting,
                    campaignName: getVal(r, ['Campaign Name']),
                    adGroupName: getVal(r, ['Ad Group Name']),
                    campaignId: getVal(r, ['Campaign ID', 'Campaign Id']),
                    adGroupId: getVal(r, ['Ad Group ID', 'Ad Group Id']),
                    matchType: getVal(r, ['Match Type']),
                    type: 'SB' as const,
                    ...metrics
                };
            }).filter(r => r.searchTerm);
            dashboardData.searchTerms.push(...sbTerms);
        }

        if (dashboardData.spCampaigns.length === 0 && dashboardData.sbCampaigns.length === 0) {
            console.warn("No campaigns found in file.");
        }
        resolve(dashboardData);
      } catch (err) {
        console.error("Error parsing file", err);
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};
