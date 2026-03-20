import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [marketplace, setMarketplace] = useState('US');

  const marketplaceConfig: Record<string, { flag: string; sellerCentral: string; advertising: string }> = {
    US: { flag: '🇺🇸', sellerCentral: 'sellercentral.amazon.com', advertising: 'advertising.amazon.com' },
    UK: { flag: '🇬🇧', sellerCentral: 'sellercentral.amazon.co.uk', advertising: 'advertising.amazon.co.uk' },
    DE: { flag: '🇩🇪', sellerCentral: 'sellercentral.amazon.de', advertising: 'advertising.amazon.de' },
    FR: { flag: '🇫🇷', sellerCentral: 'sellercentral.amazon.fr', advertising: 'advertising.amazon.fr' },
    ES: { flag: '🇪🇸', sellerCentral: 'sellercentral.amazon.es', advertising: 'advertising.amazon.es' },
    IT: { flag: '🇮🇹', sellerCentral: 'sellercentral.amazon.it', advertising: 'advertising.amazon.it' },
    CA: { flag: '🇨🇦', sellerCentral: 'sellercentral.amazon.ca', advertising: 'advertising.amazon.ca' },
    MX: { flag: '🇲🇽', sellerCentral: 'sellercentral.amazon.com.mx', advertising: 'advertising.amazon.com.mx' },
    IN: { flag: '🇮🇳', sellerCentral: 'sellercentral.amazon.in', advertising: 'advertising.amazon.in' },
    JP: { flag: '🇯🇵', sellerCentral: 'sellercentral.amazon.co.jp', advertising: 'advertising.amazon.co.jp' },
    AU: { flag: '🇦🇺', sellerCentral: 'sellercentral.amazon.com.au', advertising: 'advertising.amazon.com.au' },
    AE: { flag: '🇦🇪', sellerCentral: 'sellercentral.amazon.ae', advertising: 'advertising.amazon.ae' },
    BR: { flag: '🇧🇷', sellerCentral: 'sellercentral.amazon.com.br', advertising: 'advertising.amazon.com.br' },
  };

  const mp = marketplaceConfig[marketplace];
  const downloadUrls = [
    { key: 'bulk', label: 'Bulk Operations', enabled: bulkEnabled, setEnabled: setBulkEnabled, url: `https://${mp.advertising}/bulksheet/HomePage` },
    { key: 'business', label: 'Business Report', enabled: businessEnabled, setEnabled: setBusinessEnabled, url: `https://${mp.sellerCentral}/business-reports/ref=xx_sitemetric_favb_xx#/report?id=102%3ADetailSalesTrafficByChildItem&chartCols=&columns=` },
    { key: 'inventory', label: 'FBA Inventory', enabled: inventoryEnabled, setEnabled: setInventoryEnabled, url: `https://${mp.sellerCentral}/inventoryplanning/manageinventoryhealth` },
    { key: 'hourly', label: 'Hourly Data', enabled: hourlyEnabled, setEnabled: setHourlyEnabled, url: `https://${mp.advertising}/reports` },
  ];

  const handleOpenDownloadTabs = () => {
    const enabled = downloadUrls.filter(d => d.enabled);
    enabled.forEach((d, i) => {
      setTimeout(() => window.open(d.url, '_blank'), i * 300);
    });
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
    const uploadSlots = [
      { id: 'bulk', label: 'Bulk Operations', subtitle: 'Required', icon: CloudUpload, loaded: !!bulkData, loadedLabel: 'Bulk File Loaded', accept: '.xlsx,.xls', onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleBulkUpload(e, false), disabled: isLoading || !!bulkData, accentClass: 'primary' },
      { id: 'business', label: 'Business Report', subtitle: 'Recommended', icon: FileSpreadsheet, loaded: !!businessReport, loadedLabel: 'Report Loaded', accept: '.xlsx,.csv', onChange: handleBusinessReportUpload, disabled: isLoading, accentClass: 'primary' },
      { id: 'prev', label: 'Prev Period Bulk', subtitle: 'For Comparisons', icon: History, loaded: !!previousBulkData, loadedLabel: 'Prev Period Loaded', accept: '.xlsx,.xls', onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleBulkUpload(e, true), disabled: isLoading || !!previousBulkData, accentClass: 'accent' },
      { id: 'inventory', label: 'FBA Inventory', subtitle: 'For Stock Risk', icon: Package, loaded: !!inventoryReport, loadedLabel: 'Inventory Loaded', accept: '.csv,.txt,.xlsx', onChange: handleInventoryReportUpload, disabled: isLoading || !!inventoryReport, accentClass: 'primary' },
      { id: 'hourly', label: 'Hourly Data', subtitle: 'For Dayparting', icon: Clock, loaded: !!hourlyReport, loadedLabel: 'Hourly Loaded', accept: '.xlsx,.csv', onChange: handleHourlyReportUpload, disabled: isLoading || !!hourlyReport, accentClass: 'primary' },
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col items-center p-6 relative overflow-hidden dark">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/8 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-400/5 rounded-full blur-[180px]" />

        <div className="relative z-10 max-w-4xl w-full pt-12 pb-8">
          {/* Header */}
          <div className="text-center mb-14 animate-fade-in">
            <img src={lynxLogoWhite} alt="Lynx Media" className="h-12 w-auto mx-auto mb-8 opacity-90" />
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3 tracking-tight">
              Upload Your <span className="text-gradient">Data</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Drop your Amazon reports below to unlock powerful advertising insights.
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 glass-dark rounded-2xl text-destructive text-sm flex items-center justify-center gap-3 border border-destructive/30 animate-fade-in max-w-2xl mx-auto">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Upload Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            {uploadSlots.map((slot, idx) => {
              const Icon = slot.icon;
              return (
                <div key={slot.id} className="relative group" style={{ animationDelay: `${0.1 + idx * 0.05}s` }}>
                  <input type="file" accept={slot.accept} onChange={slot.onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={slot.disabled} />
                  <div className={`relative flex flex-col items-center justify-center h-36 px-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                    slot.loaded
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 group-hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.2)]'
                  }`}>
                    {/* Subtle shimmer on hover */}
                    {!slot.loaded && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />}
                    
                    {slot.loaded ? (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-2.5">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">{slot.loadedLabel}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center mb-2.5 transition-colors duration-300">
                          <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                        </div>
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider text-center mb-1">
                          {idx + 1}. {slot.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">{slot.subtitle}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Demo Data Card */}
            <div className="relative group cursor-pointer" onClick={() => !isLoading && loadDemoData()}>
              <div className="flex flex-col items-center justify-center h-36 px-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-2.5">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Load Demo Data</span>
                <span className="text-[10px] text-muted-foreground font-medium mt-1">Try it instantly</span>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center text-muted-foreground font-bold mb-8 bg-card/60 py-3.5 rounded-xl animate-pulse border border-border/50 max-w-lg mx-auto">
              <Loader2 className="animate-spin mr-3 w-5 h-5 text-primary" /> PROCESSING DATA...
            </div>
          )}

          {/* Quick Download Section */}
          <div className="max-w-4xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ExternalLink size={14} className="text-primary" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Quick Download</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={marketplace} onValueChange={setMarketplace}>
                    <SelectTrigger className="w-[110px] h-8 text-xs text-foreground bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(marketplaceConfig).map(([code, { flag }]) => (
                        <SelectItem key={code} value={code} className="text-xs">
                          {flag} {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    onClick={handleOpenDownloadTabs}
                    disabled={!downloadUrls.some(d => d.enabled)}
                    className="flex items-center gap-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <ExternalLink size={13} /> Open Tabs
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {downloadUrls.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                      item.enabled
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/30 bg-background/30 opacity-50'
                    }`}
                    onClick={() => item.setEnabled(!item.enabled)}
                  >
                    <Switch
                      id={`toggle-${item.key}`}
                      checked={item.enabled}
                      onCheckedChange={item.setEnabled}
                      className="scale-90"
                    />
                    <Label htmlFor={`toggle-${item.key}`} className="text-[11px] text-foreground cursor-pointer font-medium leading-tight">{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Import Workspace */}
          <div className="max-w-sm mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="relative group">
              <input type="file" accept=".lynx,.json" onChange={handleImportWorkspace} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isLoading} />
              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border/50 hover:bg-card/40">
                <Upload size={14} className="text-primary" />
                Import Workspace (.lynx)
              </button>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/60 mt-8 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            🔒 Your data is processed locally. Nothing leaves your browser.
          </p>
        </div>
      </div>
    );
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
