import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layout } from '../components/Layout';
import { ExecutiveDashboard, PortfolioDashboard, AsinAuditDashboard, SPDashboard, SBDashboard, SDDashboard, SearchTermDashboard, DiagnosticsDashboard, SettingsDashboard, ProfitDashboard, DaypartingDashboard, ForecastingDashboard, CannibalizationDashboard } from '../views/Dashboards';
import { TeamManagement } from '../views/TeamManagement';
import { processBulkFile, processBusinessReport, processInventoryReport, processHourlyReport } from '../services/dataProcessor';
import { saveState, loadState, clearState, exportWorkspace, importWorkspace } from '../services/persistence';
import { generateMockData } from '../services/mockData';
import { DashboardData, BusinessReportRow, AppSettings, ProductGoal, InventoryRow, HourlyPerformanceRow, Currency, ProductCost, ProfitSettings, CURRENCY_SYMBOLS } from '../types';
import { Upload, FileSpreadsheet, Zap, Shield, AlertCircle, X, CheckCircle, History, Package, Clock, Loader2, CloudUpload, ExternalLink } from 'lucide-react';
import lynxLogoWhite from '@/assets/lynx-logo-white.png';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

const DEFAULT_SETTINGS: AppSettings = {
  targetAcos: 0.30,
  breakEvenAcos: 0.40,
  minSpendThreshold: 30,
  minClickThreshold: 15,
  currencySymbol: '$',
  currencyCode: Currency.USD,
  attributionModel: 'Standard',
};

const DEFAULT_PROFIT_SETTINGS: ProfitSettings = {
  defaultReferralFee: 0.15,
  returnsProvision: 0.05,
  taxProvision: 0.00,
  lastUpdated: Date.now(),
};

const Index = () => {
  const { user, signOut } = useAuth();
  const { hasAccess, isLoading: roleLoading } = useUserRole();

  const [currentView, setCurrentView] = useState('executive');
  const [bulkData, setBulkData] = useState<DashboardData | null>(null);
  const [previousBulkData, setPreviousBulkData] = useState<DashboardData | null>(null);
  const [businessReport, setBusinessReport] = useState<BusinessReportRow[] | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryRow[] | null>(null);
  const [hourlyReport, setHourlyReport] = useState<HourlyPerformanceRow[] | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [productGoals, setProductGoals] = useState<Record<string, ProductGoal>>({});
  const [productCosts, setProductCosts] = useState<Record<string, ProductCost>>({});
  const [profitSettings, setProfitSettings] = useState<ProfitSettings>(DEFAULT_PROFIT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataRestored, setDataRestored] = useState(false);
  const [bulkEnabled, setBulkEnabled] = useState(true);
  const [businessEnabled, setBusinessEnabled] = useState(true);
  const [inventoryEnabled, setInventoryEnabled] = useState(true);
  const [hourlyEnabled, setHourlyEnabled] = useState(true);

  const downloadUrls = [
    { key: 'bulk', label: 'Bulk Operations', enabled: bulkEnabled, setEnabled: setBulkEnabled, url: 'https://advertising.amazon.com/bulksheet/HomePage' },
    { key: 'business', label: 'Business Report', enabled: businessEnabled, setEnabled: setBusinessEnabled, url: 'https://sellercentral.amazon.com/business-reports/ref=xx_sitemetric_favb_xx#/report?id=102%3ADetailSalesTrafficByChildItem&chartCols=&columns=' },
    { key: 'inventory', label: 'FBA Inventory', enabled: inventoryEnabled, setEnabled: setInventoryEnabled, url: 'https://sellercentral.amazon.com/inventoryplanning/manageinventoryhealth' },
    { key: 'hourly', label: 'Hourly Data', enabled: hourlyEnabled, setEnabled: setHourlyEnabled, url: 'https://advertising.amazon.com/reports' },
  ];

  const handleOpenDownloadTabs = () => {
    downloadUrls.filter(d => d.enabled).forEach(d => window.open(d.url, '_blank'));
  };

  const currencySymbol = CURRENCY_SYMBOLS[settings.currencyCode] || '$';

  // Load persisted state on mount
  useEffect(() => {
    const init = async () => {
      const saved = await loadState();
      if (saved.bulkData) {
        setBulkData(saved.bulkData);
        setPreviousBulkData(saved.previousBulkData || null);
        setBusinessReport(saved.businessReport || null);
        setInventoryReport(saved.inventoryReport || null);
        setHourlyReport(saved.hourlyReport || null);
        if (saved.settings) setSettings(saved.settings);
        if (saved.productGoals) setProductGoals(saved.productGoals);
        if (saved.productCosts) setProductCosts(saved.productCosts);
        if (saved.profitSettings) setProfitSettings(saved.profitSettings);
        setDataRestored(true);
      }
    };
    init();
  }, []);

  // Save state on change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (bulkData) {
        saveState({
          bulkData,
          previousBulkData,
          businessReport,
          inventoryReport,
          hourlyReport,
          settings,
          productGoals,
          productCosts,
          profitSettings,
        });
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [bulkData, previousBulkData, businessReport, inventoryReport, hourlyReport, settings, productGoals, productCosts, profitSettings]);

  const updateCurrencyFromData = (currency: Currency) => {
    const sym = CURRENCY_SYMBOLS[currency] || '$';
    setSettings(prev => ({ ...prev, currencySymbol: sym, currencyCode: currency }));
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>, isPrevious: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      setTimeout(async () => {
        try {
          const processedData = await processBulkFile(file);
          if (isPrevious) {
            setPreviousBulkData(processedData);
          } else {
            setBulkData(processedData);
            if (processedData.detectedCurrency) {
              updateCurrencyFromData(processedData.detectedCurrency);
            }
          }
        } catch (err) {
          console.error(err);
          setError("Failed to parse the Bulk Operations file. Please ensure it is valid.");
        } finally {
          setIsLoading(false);
        }
      }, 100);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const handleBusinessReportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setTimeout(async () => {
      try {
        const report = await processBusinessReport(file);
        setBusinessReport(report);
      } catch (err) {
        console.error(err);
        setError("Failed to parse the Business Report. Ensure it contains Child ASIN data.");
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const handleInventoryReportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setTimeout(async () => {
      try {
        const report = await processInventoryReport(file);
        setInventoryReport(report);
      } catch (err) {
        console.error(err);
        setError("Failed to parse FBA Inventory Report.");
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const handleHourlyReportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setTimeout(async () => {
      try {
        const report = await processHourlyReport(file);
        setHourlyReport(report);
      } catch (err) {
        console.error(err);
        setError("Failed to parse Hourly Performance Report.");
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const handleExportWorkspace = async () => {
    await exportWorkspace();
  };

  const handleImportWorkspace = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (window.confirm("Importing a workspace will overwrite your current data. Continue?")) {
      setIsLoading(true);
      try {
        const data = await importWorkspace(file);
        if (data.bulkData) {
          setBulkData(data.bulkData);
          setPreviousBulkData(data.previousBulkData || null);
          setBusinessReport(data.businessReport || null);
          setInventoryReport(data.inventoryReport || null);
          setHourlyReport(data.hourlyReport || null);
          if (data.settings) setSettings(data.settings);
          if (data.productGoals) setProductGoals(data.productGoals);
          if (data.productCosts) setProductCosts(data.productCosts);
          if (data.profitSettings) setProfitSettings(data.profitSettings);
          setError(null);
          setCurrentView('executive');
        }
      } catch (err) {
        console.error(err);
        setError("Failed to import workspace file. It may be corrupted.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadDemoData = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockCurrent = generateMockData();
      const mockPrevious = generateMockData();
      const { mockCosts, mockGoals, ...bulkOnly } = mockCurrent;
      const { mockCosts: _pc, mockGoals: _pg, ...prevBulkOnly } = mockPrevious;

      setBulkData(bulkOnly as DashboardData);
      setPreviousBulkData(prevBulkOnly as DashboardData);

      if (mockCurrent.businessReport) setBusinessReport(mockCurrent.businessReport);
      if (mockCurrent.inventory) setInventoryReport(mockCurrent.inventory);
      if (mockCurrent.hourlyReport) setHourlyReport(mockCurrent.hourlyReport);

      if (mockCosts) setProductCosts(mockCosts);
      if (mockGoals) setProductGoals(mockGoals);

      setIsLoading(false);
    }, 800);
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to clear all data and return to the upload screen?")) {
      await clearState();
      setBulkData(null);
      setPreviousBulkData(null);
      setBusinessReport(null);
      setInventoryReport(null);
      setHourlyReport(null);
      setProductGoals({});
      setProductCosts({});
      setError(null);
      setSettings(DEFAULT_SETTINGS);
      setCurrentView('executive');
    }
  };

  const dashboardData = bulkData ? {
    ...bulkData,
    businessReport: businessReport || [],
    inventory: inventoryReport || [],
    hourlyReport: hourlyReport || []
  } : null;

  const renderView = () => {
    if (currentView === 'team') return <TeamManagement />;
    if (!dashboardData) return null;

    switch (currentView) {
      case 'executive': return <ExecutiveDashboard data={dashboardData} previousData={previousBulkData} settings={settings} />;
      case 'profit': return <ProfitDashboard data={dashboardData} currencySymbol={currencySymbol} costs={productCosts} profitSettings={profitSettings} onUpdateCosts={setProductCosts} onUpdateProfitSettings={setProfitSettings} productGoals={productGoals} settings={settings} />;
      case 'portfolio': return <PortfolioDashboard data={dashboardData} currencySymbol={currencySymbol} />;
      case 'forecasting': return <ForecastingDashboard data={dashboardData} currencySymbol={currencySymbol} settings={settings} />;
      case 'asin-audit': return <AsinAuditDashboard data={dashboardData} previousData={previousBulkData} currencySymbol={currencySymbol} settings={settings} />;
      case 'cannibalization': return <CannibalizationDashboard data={dashboardData} currencySymbol={currencySymbol} />;
      case 'sp': return <SPDashboard data={dashboardData} currencySymbol={currencySymbol} />;
      case 'sb': return <SBDashboard data={dashboardData} currencySymbol={currencySymbol} />;
      case 'sd': return <SDDashboard data={dashboardData} currencySymbol={currencySymbol} />;
      case 'search-terms': return <SearchTermDashboard data={dashboardData} previousData={previousBulkData} targetType="SP" currencySymbol={currencySymbol} settings={settings} />;
      case 'sb-search-terms': return <SearchTermDashboard data={dashboardData} previousData={previousBulkData} targetType="SB" currencySymbol={currencySymbol} settings={settings} />;
      case 'dayparting': return <DaypartingDashboard data={dashboardData} currencySymbol={currencySymbol} />;
      case 'diagnostics': return <DiagnosticsDashboard data={dashboardData} settings={settings} productGoals={productGoals} />;
      case 'settings': return <SettingsDashboard data={dashboardData} settings={settings} onUpdateSettings={setSettings} productGoals={productGoals} onUpdateProductGoals={setProductGoals} />;
      default: return <ExecutiveDashboard data={dashboardData} previousData={previousBulkData} settings={settings} />;
    }
  };

  if (roleLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center dark">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!hasAccess && user) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground font-sans dark">
      <div className="text-center max-w-md p-8">
        <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Revoked</h1>
        <p className="text-muted-foreground mb-6">Your access to this application has been revoked. Please contact an administrator.</p>
        <button onClick={signOut} className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-all">Sign Out</button>
      </div>
    </div>;
  }

  if (!bulkData) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden dark">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[180px] animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-400/8 rounded-full blur-[150px] animate-float-slow" style={{ animationDelay: '-5s' }} />

      <div className="relative z-10 max-w-5xl w-full text-center">
        <div className="flex items-center justify-center mb-10 animate-fade-in">
          <img src={lynxLogoWhite} alt="Lynx Media" className="h-16 w-auto" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Amazon Advertising Analytics
        </h1>
        <p className="text-muted-foreground mb-12 max-w-md mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Upload your files to unlock powerful insights across all your campaigns.
        </p>

        {error && <div className="mb-6 p-4 glass-dark rounded-2xl text-destructive text-sm flex items-center justify-center gap-3 border-destructive/30 animate-fade-in">
          <AlertCircle size={18} /> {error}
        </div>}

        {/* 5 Upload Slots */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {/* 1. Bulk Operations */}
          <div className="relative group">
            <input type="file" accept=".xlsx,.xls" onChange={(e) => handleBulkUpload(e, false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isLoading || !!bulkData} />
            <div className={`flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300 ${bulkData ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
              {bulkData ? (
                <><CheckCircle className="w-8 h-8 text-primary mb-2" /><span className="text-xs font-bold text-primary uppercase tracking-wider">Bulk File Loaded</span></>
              ) : (
                <><CloudUpload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" /><span className="text-xs font-bold text-foreground uppercase tracking-wider text-center">1. Bulk Operations</span><span className="text-[10px] text-muted-foreground mt-1">Required</span></>
              )}
            </div>
          </div>

          {/* 2. Business Report */}
          <div className="relative group">
            <input type="file" accept=".xlsx,.csv" onChange={handleBusinessReportUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isLoading} />
            <div className={`flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300 ${businessReport ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
              {businessReport ? (
                <><CheckCircle className="w-8 h-8 text-primary mb-2" /><span className="text-xs font-bold text-primary uppercase tracking-wider">Report Loaded</span></>
              ) : (
                <><FileSpreadsheet className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" /><span className="text-xs font-bold text-foreground uppercase tracking-wider text-center">2. Business Report</span><span className="text-[10px] text-muted-foreground mt-1">Recommended</span></>
              )}
            </div>
          </div>

          {/* 3. Previous Period Bulk */}
          <div className="relative group">
            <input type="file" accept=".xlsx,.xls" onChange={(e) => handleBulkUpload(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isLoading || !!previousBulkData} />
            <div className={`flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300 ${previousBulkData ? 'border-accent bg-accent/10' : 'border-border hover:border-accent hover:bg-accent/5'}`}>
              {previousBulkData ? (
                <><CheckCircle className="w-8 h-8 text-accent mb-2" /><span className="text-xs font-bold text-accent uppercase tracking-wider">Prev Period Loaded</span></>
              ) : (
                <><History className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors mb-2" /><span className="text-xs font-bold text-foreground uppercase tracking-wider text-center">3. Prev Period Bulk</span><span className="text-[10px] text-muted-foreground mt-1">For Comparisons</span></>
              )}
            </div>
          </div>

          {/* 4. FBA Inventory */}
          <div className="relative group">
            <input type="file" accept=".csv,.txt,.xlsx" onChange={handleInventoryReportUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isLoading || !!inventoryReport} />
            <div className={`flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300 ${inventoryReport ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
              {inventoryReport ? (
                <><CheckCircle className="w-8 h-8 text-primary mb-2" /><span className="text-xs font-bold text-primary uppercase tracking-wider">Inventory Loaded</span></>
              ) : (
                <><Package className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" /><span className="text-xs font-bold text-foreground uppercase tracking-wider text-center">4. FBA Inventory</span><span className="text-[10px] text-muted-foreground mt-1">For Stock Risk</span></>
              )}
            </div>
          </div>

          {/* 5. Hourly Data */}
          <div className="relative group">
            <input type="file" accept=".xlsx,.csv" onChange={handleHourlyReportUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isLoading || !!hourlyReport} />
            <div className={`flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300 ${hourlyReport ? 'border-primary bg-primary/10' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
              {hourlyReport ? (
                <><CheckCircle className="w-8 h-8 text-primary mb-2" /><span className="text-xs font-bold text-primary uppercase tracking-wider">Hourly Loaded</span></>
              ) : (
                <><Clock className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" /><span className="text-xs font-bold text-foreground uppercase tracking-wider text-center">5. Hourly Data</span><span className="text-[10px] text-muted-foreground mt-1">For Dayparting</span></>
              )}
            </div>
          </div>
        </div>

        {/* Quick Download Tabs */}
        <div className="max-w-5xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Download from Seller Central</h3>
            <button
              onClick={handleOpenDownloadTabs}
              disabled={!downloadUrls.some(d => d.enabled)}
              className="flex items-center gap-2 py-2 px-5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <ExternalLink size={14} /> Open All Tabs
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {downloadUrls.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  item.enabled
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card/30 opacity-60'
                }`}
                onClick={() => item.setEnabled(!item.enabled)}
              >
                <Switch
                  id={`toggle-${item.key}`}
                  checked={item.enabled}
                  onCheckedChange={item.setEnabled}
                />
                <Label htmlFor={`toggle-${item.key}`} className="text-xs text-foreground cursor-pointer font-medium">{item.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Import Workspace */}
        <div className="max-w-lg mx-auto mb-8 border-t border-border pt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col items-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Or load existing workspace</p>
            <div className="relative group w-full">
              <input type="file" accept=".lynx,.json" onChange={handleImportWorkspace} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isLoading} />
              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-card border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                <Upload size={16} className="text-primary" />
                Import Team Workspace File (.lynx)
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center text-muted-foreground font-bold mb-6 bg-card py-3 rounded-xl animate-pulse border border-border">
            <Loader2 className="animate-spin mr-3 w-5 h-5 text-primary" /> PROCESSING DATA...
          </div>
        )}

        <button onClick={loadDemoData} disabled={isLoading} className="w-full max-w-lg mx-auto flex items-center justify-center gap-3 px-8 py-5 bg-primary text-primary-foreground font-heading font-bold text-lg rounded-2xl btn-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <Zap size={20} /> Load Demo Data
        </button>

        <p className="text-xs text-muted-foreground mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          🔒 Your data is processed locally. Nothing is uploaded to any server.
        </p>
      </div>
    </div>;
  }

  return <Layout
    currentView={currentView}
    setCurrentView={setCurrentView}
    onReset={handleReset}
    onExport={handleExportWorkspace}
    onImport={handleImportWorkspace}
    onReupload={handleReset}
  >
    {renderView()}
  </Layout>;
};

export default Index;
