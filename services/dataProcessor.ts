
import * as XLSX from 'xlsx';
import { 
  DashboardData, Portfolio, SPCampaign, SPAdGroup, SPSku, SPKeyword, SPProductTargeting, 
  SBCampaign, SDCampaign, SearchTermData, Currency, SPPlacement, SBKeyword, SBTarget, SDTarget, BusinessReportRow, SBAd, InventoryRow, HourlyPerformanceRow
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

// Helper to safely parse percentage strings
const parsePct = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const clean = val.replace(/[^0-9.-]+/g, '');
        return (parseFloat(clean) || 0) / 100;
    }
    return 0;
};

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
  
  // Dynamic check for Spend/Sales with currency suffixes like "Spend(GBP)"
  if (possibleKeys.includes('Spend')) {
     const spendKey = rowKeys.find(k => k.toLowerCase().startsWith('spend') && !k.toLowerCase().includes('share'));
     if (spendKey) return row[spendKey];
  }
  if (possibleKeys.includes('Sales')) {
     const salesKey = rowKeys.find(k => k.toLowerCase().includes('sales') && !k.toLowerCase().includes('percentage'));
     if (salesKey) return row[salesKey];
  }

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

const normalizeState = (val: any): string => {
    if (!val) return 'enabled';
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

// IMPROVED: Robust Auto-Currency Detection Engine
const detectCurrencyFromWorkbook = (workbook: XLSX.WorkBook): Currency => {
    // Scan up to 3 sheets for currency clues
    const sheetsToScan = workbook.SheetNames.slice(0, 3);
    
    for (const sheetName of sheetsToScan) {
        const sheet = workbook.Sheets[sheetName];
        const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, range: 0, nrows: 10 });
        
        for (const row of aoa) {
            if (!Array.isArray(row)) continue;
            const rowStr = row.join(' ').toLowerCase();
            
            // Check for explicit Amazon Bulk File currency strings
            if (rowStr.includes('(gbp)') || rowStr.includes('£')) return Currency.GBP;
            if (rowStr.includes('(eur)') || rowStr.includes('€')) return Currency.EUR;
            if (rowStr.includes('(cad)')) return Currency.CAD;
            if (rowStr.includes('(aud)')) return Currency.AUD;
            if (rowStr.includes('(jpy)') || rowStr.includes('¥')) return Currency.JPY;
            if (rowStr.includes('(inr)') || rowStr.includes('₹')) return Currency.INR;
            if (rowStr.includes('(usd)') || rowStr.includes('$')) return Currency.USD;
        }
    }
    
    return Currency.USD; // Default fallback
};

const normalizePlacementName = (raw: string): string => {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('top of search')) return 'Top of Search (First Page)';
  if (lower.includes('product page') || lower.includes('detail page')) return 'Product Pages';
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
    spend: parseNum(getVal(row, ['Spend', 'Cost'])),
    sales: parseNum(getVal(row, ['Sales', 'Total Sales', '7 Day Total Sales'])),
    orders: parseNum(getVal(row, ['Orders', '7 Day Total Orders'])),
    units: parseNum(getVal(row, ['Units', '7 Day Total Units']))
  };
};

export const processHourlyReport = async (file: File): Promise<HourlyPerformanceRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = findHeaderRowAndGetData(sheet, ['Date', 'Hour', 'Spend']);
                const processedRows: HourlyPerformanceRow[] = rows.map(r => ({
                    date: String(getVal(r, ['Date'])),
                    hour: parseNum(getVal(r, ['Hour of Day', 'Start Time', 'Time'])),
                    campaignName: String(getVal(r, ['Campaign Name', 'Campaign'])), 
                    impressions: parseNum(getVal(r, ['Impressions'])),
                    clicks: parseNum(getVal(r, ['Clicks'])),
                    spend: parseNum(getVal(r, ['Spend'])),
                    sales: parseNum(getVal(r, ['Sales'])),
                    orders: parseNum(getVal(r, ['Orders'])),
                })).filter(r => r.date);
                resolve(processedRows);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

export const processInventoryReport = async (file: File): Promise<InventoryRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = findHeaderRowAndGetData(sheet, ['sku', 'asin', 'afn-fulfillable-quantity']);
                const processedRows: InventoryRow[] = rows.map(r => ({
                    sku: String(getVal(r, ['sku', 'SKU']) || ''),
                    fnsku: String(getVal(r, ['fnsku']) || ''),
                    asin: String(getVal(r, ['asin', 'ASIN']) || ''),
                    productName: String(getVal(r, ['product-name', 'Product Name']) || ''),
                    condition: String(getVal(r, ['condition']) || ''),
                    price: parseNum(getVal(r, ['your-price', 'Price'])),
                    mfnListingExists: String(getVal(r, ['mfn-listing-exists'])).toLowerCase() === 'yes',
                    mfnFulfillableQuantity: parseNum(getVal(r, ['mfn-fulfillable-quantity'])),
                    afnListingExists: String(getVal(r, ['afn-listing-exists'])).toLowerCase() === 'yes',
                    afnWarehouseQuantity: parseNum(getVal(r, ['afn-warehouse-quantity'])),
                    afnFulfillableQuantity: parseNum(getVal(r, ['afn-fulfillable-quantity', 'Available'])),
                    afnUnsellableQuantity: parseNum(getVal(r, ['afn-unsellable-quantity'])),
                    afnReservedQuantity: parseNum(getVal(r, ['afn-reserved-quantity'])),
                    afnTotalQuantity: parseNum(getVal(r, ['afn-total-quantity'])),
                    perUnitVolume: parseNum(getVal(r, ['per-unit-volume'])),
                    afnInboundWorkingQuantity: parseNum(getVal(r, ['afn-inbound-working-quantity'])),
                    afnInboundShippedQuantity: parseNum(getVal(r, ['afn-inbound-shipped-quantity'])),
                    afnInboundReceivingQuantity: parseNum(getVal(r, ['afn-inbound-receiving-quantity'])),
                })).filter(r => r.sku && r.asin);
                resolve(processedRows);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
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
                    sessions: parseNum(getVal(r, ['Sessions', 'Sessions - Total'])),
                    sessionPercentage: parsePct(getVal(r, ['Session Percentage'])),
                    pageViews: parseNum(getVal(r, ['Page Views', 'Page views'])),
                    pageViewsPercentage: parsePct(getVal(r, ['Page Views Percentage'])),
                    buyBoxPercentage: parsePct(getVal(r, ['Buy Box Percentage', 'Featured Offer (Buy Box) Percentage'])),
                    unitsOrdered: parseNum(getVal(r, ['Units Ordered', 'Units ordered'])),
                    orderedProductSales: parseNum(getVal(r, ['Ordered Product Sales', 'Ordered product sales'])),
                    totalOrderItems: parseNum(getVal(r, ['Total Order Items']))
                })).filter(r => r.childAsin && r.childAsin.length > 0);
                resolve(processedRows);
            } catch (err) {
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
        
        // Auto-Detect Marketplace based on Sheet deep-scan
        const detectedCurrency = detectCurrencyFromWorkbook(workbook);
        
        const dashboardData: DashboardData = {
          portfolios: [], spCampaigns: [], spPlacements: [], spAdGroups: [], spSkus: [], spKeywords: [], spProductTargets: [],
          sbCampaigns: [], sbPlacements: [], sbAds: [], sbKeywords: [], sbTargets: [], sbMagEntities: [],
          sdCampaigns: [], sdTargets: [], searchTerms: [], businessReport: [], inventory: [], hourlyReport: [],
          detectedCurrency
        };

        const spSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('sponsored products'));
        const spSheet = spSheetName ? workbook.Sheets[spSheetName] : null;
        if (spSheet) {
          const rows = findHeaderRowAndGetData(spSheet, ['Campaign ID', 'Entity']);
          dashboardData.spCampaigns = rows.filter(r => {
                const entity = getVal(r, ['Entity']);
                if (entity && entity.trim() === 'Campaign') return true;
                const campaignId = getVal(r, ['Campaign ID', 'Campaign Id']);
                const adGroupId = getVal(r, ['Ad Group ID', 'Ad Group Id']);
                return campaignId && !adGroupId;
            }).map(r => ({
                campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                name: getVal(r, ['Campaign Name', 'Campaign']) || `Campaign ${getVal(r, ['Campaign ID'])}`, 
                portfolioId: getVal(r, ['Portfolio ID']) ? String(getVal(r, ['Portfolio ID'])) : null,
                startDate: parseDate(getVal(r, ['Start Date'])),
                endDate: parseDate(getVal(r, ['End Date'])),
                state: normalizeState(getVal(r, ['State'])),
                dailyBudget: parseNum(getVal(r, ['Daily Budget'])),
                targetingType: getVal(r, ['Targeting Type']) as any,
                biddingStrategy: getVal(r, ['Bidding Strategy']) as any,
                status: String(getVal(r, ['Campaign State']) || 'Running'),
                ...getMetrics(r)
            }));

          dashboardData.spPlacements = rows.filter(r => {
               const entity = String(getVal(r, ['Entity']) || '').trim();
               const placement = String(getVal(r, ['Placement', 'Placement Type']) || '').trim();
               return (entity === 'Bidding Adjustment' || placement.length > 2) && !getVal(r, ['Keyword Text']) && !getVal(r, ['SKU']);
            }).map(r => ({
                 campaignId: String(getVal(r, ['Campaign ID', 'Campaign Id'])),
                 placement: normalizePlacementName(String(getVal(r, ['Placement', 'Placement Type']) || '')),
                 percentage: parseNum(getVal(r, ['Percentage'])),
                 ...getMetrics(r)
            }));

          dashboardData.spAdGroups = rows.filter(r => {
                const entity = getVal(r, ['Entity']);
                if (entity && entity === 'Ad Group') return true;
                const adGroupId = getVal(r, ['Ad Group ID']);
                const keywordText = getVal(r, ['Keyword Text']);
                return adGroupId && !keywordText;
            }).map(r => ({
                adGroupId: String(getVal(r, ['Ad Group ID'])),
                campaignId: String(getVal(r, ['Campaign ID'])),
                name: getVal(r, ['Ad Group Name']) || `AG ${getVal(r, ['Ad Group ID'])}`,
                defaultBid: parseNum(getVal(r, ['Ad Group Default Bid'])),
                state: normalizeState(getVal(r, ['State'])),
                ...getMetrics(r)
            }));

          dashboardData.spSkus = rows.filter(r => getVal(r, ['Entity']) === 'Product Ad' || (getVal(r, ['SKU']) && getVal(r, ['Ad Group ID']))).map(r => ({
                sku: String(getVal(r, ['SKU']) || ''),
                asin: String(getVal(r, ['ASIN']) || '').trim(),
                campaignId: String(getVal(r, ['Campaign ID'])),
                adGroupId: String(getVal(r, ['Ad Group ID'])),
                state: normalizeState(getVal(r, ['State'])),
                eligibilityStatus: getVal(r, ['Eligibility Status']) || 'Eligible',
                ...getMetrics(r)
            }));

          dashboardData.spKeywords = rows.filter(r => getVal(r, ['Entity']) === 'Keyword' || (getVal(r, ['Keyword Text']) && getVal(r, ['Match Type']))).map(r => ({
                keywordId: String(getVal(r, ['Keyword ID', 'Keyword Id'])),
                keywordText: getVal(r, ['Keyword Text']),
                matchType: String(getVal(r, ['Match Type']) || '').toUpperCase() as any,
                bid: parseNum(getVal(r, ['Bid'])),
                state: normalizeState(getVal(r, ['State'])),
                campaignId: String(getVal(r, ['Campaign ID'])),
                adGroupId: String(getVal(r, ['Ad Group ID'])),
                ...getMetrics(r)
            }));
            
           dashboardData.spProductTargets = rows.filter(r => getVal(r, ['Entity']) === 'Product Targeting' || getVal(r, ['Product Targeting Expression'])).map(r => ({
                 targetId: String(getVal(r, ['Product Targeting ID', 'Product Targeting Id'])),
                 expression: getVal(r, ['Product Targeting Expression']),
                 resolvedExpression: getVal(r, ['Resolved Product Targeting Expression']) || getVal(r, ['Product Targeting Expression']),
                 bid: parseNum(getVal(r, ['Bid'])),
                 state: normalizeState(getVal(r, ['State'])),
                 campaignId: String(getVal(r, ['Campaign ID'])),
                 adGroupId: String(getVal(r, ['Ad Group ID'])),
                 ...getMetrics(r)
            }));
        }

        const sbSheetNames = workbook.SheetNames.filter(n => n.toLowerCase().includes('brand') || n.toLowerCase().includes('collection'));
        let allSbRows: any[] = [];
        sbSheetNames.forEach(name => {
            const sheet = workbook.Sheets[name];
            const rows = findHeaderRowAndGetData(sheet, ['Campaign ID', 'Entity']);
            if (rows.length > 0) allSbRows = [...allSbRows, ...rows];
        });

        dashboardData.sbCampaigns = allSbRows.filter(r => getVal(r, ['Entity']) === 'Campaign').map(r => ({
            campaignId: String(getVal(r, ['Campaign ID'])),
            name: getVal(r, ['Campaign Name']) || `SB ${getVal(r, ['Campaign ID'])}`,
            portfolioId: getVal(r, ['Portfolio ID']) ? String(getVal(r, ['Portfolio ID'])) : null,
            startDate: parseDate(getVal(r, ['Start Date'])),
            endDate: parseDate(getVal(r, ['End Date'])),
            budget: parseNum(getVal(r, ['Budget'])),
            budgetType: getVal(r, ['Budget Type']) as any,
            state: normalizeState(getVal(r, ['State'])),
            servingStatus: String(getVal(r, ['Campaign Serving Status']) || ''),
            adFormat: getVal(r, ['Ad Format']) as any || 'Product Collection',
            ...getMetrics(r)
        }));

        const sdSheetName = workbook.SheetNames.find(n => n.includes('Sponsored Display'));
        const sdSheet = sdSheetName ? workbook.Sheets[sdSheetName] : null;
        if (sdSheet) {
            const rows = findHeaderRowAndGetData(sdSheet, ['Campaign ID', 'Entity']);
            dashboardData.sdCampaigns = rows.filter(r => getVal(r, ['Entity']) === 'Campaign').map(r => ({
                 campaignId: String(getVal(r, ['Campaign ID'])),
                 name: String(getVal(r, ['Campaign Name']) || `SD ${getVal(r, ['Campaign ID']) || ''}`),
                 portfolioId: getVal(r, ['Portfolio ID']) ? String(getVal(r, ['Portfolio ID'])) : null,
                 tactic: (getVal(r, ['Tactic']) === 'T00030' ? 'T00030' : 'T00020') as 'T00020' | 'T00030',
                 costType: (getVal(r, ['Cost Type']) === 'vCPM' ? 'vCPM' : 'CPC') as 'CPC' | 'vCPM',
                 state: normalizeState(getVal(r, ['State'])),
                 viewableImpressions: parseNum(getVal(r, ['Viewable Impressions'])),
                 viewSales: parseNum(getVal(r, ['Sales (Views & Clicks)'])) || 0,
                 viewOrders: parseNum(getVal(r, ['Orders (Views & Clicks)'])) || 0,
                 viewUnits: parseNum(getVal(r, ['Units (Views & Clicks)'])) || 0,
                 ...getMetrics(r)
            }));
        }

        resolve(dashboardData);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};
