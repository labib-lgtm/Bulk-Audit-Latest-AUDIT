
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { generateMockData } from './services/mockData';
import { processBulkFile, processBusinessReport, processInventoryReport, processHourlyReport } from './services/dataProcessor';
import { saveState, loadState, clearState, exportWorkspace, importWorkspace } from './services/persistence';
import { DashboardData, BusinessReportRow, AppSettings, ProductGoal, InventoryRow, HourlyPerformanceRow, Currency, ProductCost, ProfitSettings, UserRole, CURRENCY_SYMBOLS } from './types';
import { 
  ExecutiveDashboard, 
  PortfolioDashboard, 
  SPDashboard, 
  SBDashboard, 
  SDDashboard, 
  SearchTermDashboard, 
  DiagnosticsDashboard, 
  SettingsDashboard,
  AsinAuditDashboard,
  DaypartingDashboard,
  ForecastingDashboard,
  CannibalizationDashboard,
  ProfitDashboard
} from './views/Dashboards';
import { CloudUpload, FileSpreadsheet, Loader2, Shield, CheckCircle, Package, History, Clock, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('executive');
  const [userRole, setUserRole] = useState<UserRole>('Admin'); 
  const [bulkData, setBulkData] = useState<DashboardData | null>(null);
  const [previousBulkData, setPreviousBulkData] = useState<DashboardData | null>(null);
  const [businessReport, setBusinessReport] = useState<BusinessReportRow[] | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryRow[] | null>(null);
  const [hourlyReport, setHourlyReport] = useState<HourlyPerformanceRow[] | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataRestored, setDataRestored] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
      const saved = localStorage.getItem('lynx_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('lynx_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('lynx_theme', 'light');
      }
  }, [isDarkMode]);

  // Default Global Settings
  const [settings, setSettings] = useState<AppSettings>({
    targetAcos: 0.30,      
    breakEvenAcos: 0.40,   
    minSpendThreshold: 30, 
    minClickThreshold: 15, 
    currencySymbol: '$',
    currencyCode: Currency.USD,
    attributionModel: 'Standard' 
  });

  const [productGoals, setProductGoals] = useState<Record<string, ProductGoal>>({});
  const [productCosts, setProductCosts] = useState<Record<string, ProductCost>>({});
  const [profitSettings, setProfitSettings] = useState<ProfitSettings>({
      defaultReferralFee: 0.15,
      returnsProvision: 0.05,
      taxProvision: 0.00,
      lastUpdated: Date.now()
  });

  // 1. Load Data on Mount
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
            if (saved.userRole) setUserRole(saved.userRole);
            
            setDataRestored(true);
        }
    };
    init();
  }, []);

  // 2. Save Data on Change (Debounced)
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
                  userRole
              });
          }
      }, 2000); 

      return () => clearTimeout(timeoutId);
  }, [bulkData, previousBulkData, businessReport, inventoryReport, hourlyReport, settings, productGoals, productCosts, profitSettings, userRole]);

  const updateCurrencyFromData = (currency: Currency) => {
      const sym = CURRENCY_SYMBOLS[currency] || '$';
      setSettings(prev => ({ ...prev, currencySymbol: sym, currencyCode: currency }));
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>, isPrevious: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      setTimeout(async () => {
          try {
            const processedData = await processBulkFile(file);
            if (isPrevious) {
                setPreviousBulkData(processedData);
            } else {
                setBulkData(processedData);
                // AUTO-SELECT MARKETPLACE LOGIC
                if (processedData.detectedCurrency) {
                    updateCurrencyFromData(processedData.detectedCurrency);
                }
            }
          } catch (err) {
            console.error(err);
            setError("Failed to parse the Bulk Operations file. Please ensure it is valid.");
          } finally {
            setLoading(false);
          }
      }, 100);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleBusinessReportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    setTimeout(async () => {
        try {
          const report = await processBusinessReport(file);
          setBusinessReport(report);
        } catch (err) {
          console.error(err);
          setError("Failed to parse the Business Report. Ensure it contains Child ASIN data.");
        } finally {
          setLoading(false);
        }
    }, 100);
  };

  const handleInventoryReportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    setTimeout(async () => {
        try {
          const report = await processInventoryReport(file);
          setInventoryReport(report);
        } catch (err) {
          console.error(err);
          setError("Failed to parse FBA Inventory Report.");
        } finally {
          setLoading(false);
        }
    }, 100);
  };

  const handleHourlyReportUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    setTimeout(async () => {
        try {
          const report = await processHourlyReport(file);
          setHourlyReport(report);
        } catch (err) {
          console.error(err);
          setError("Failed to parse Hourly Performance Report.");
        } finally {
          setLoading(false);
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
          setLoading(true);
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
                  if (data.userRole) setUserRole(data.userRole);
                  
                  setError(null);
                  setCurrentView('executive'); 
              }
          } catch (err) {
              console.error(err);
              setError("Failed to import workspace file. It may be corrupted.");
          } finally {
              setLoading(false);
          }
      }
  };

  const loadDemoData = () => {
    setLoading(true);
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

      setLoading(false);
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
        setSettings({
            targetAcos: 0.30,      
            breakEvenAcos: 0.40,   
            minSpendThreshold: 30, 
            minClickThreshold: 15, 
            currencySymbol: '$',
            currencyCode: Currency.USD,
            attributionModel: 'Standard' 
        });
        setCurrentView('executive');
        window.location.reload();
    }
  };

  const dashboardData = bulkData ? { 
      ...bulkData, 
      businessReport: businessReport || [], 
      inventory: inventoryReport || [], 
      hourlyReport: hourlyReport || [] 
  } : null;

  const renderView = () => {
    if (!dashboardData) return null;

    switch (currentView) {
      case 'executive': return <ExecutiveDashboard data={dashboardData} previousData={previousBulkData} settings={settings} />;
      case 'profit': return <ProfitDashboard data={dashboardData} currencySymbol={settings.currencySymbol} costs={productCosts} profitSettings={profitSettings} onUpdateCosts={setProductCosts} onUpdateProfitSettings={setProfitSettings} userRole={userRole} />;
      case 'portfolio': return <PortfolioDashboard data={dashboardData} currencySymbol={settings.currencySymbol} />;
      case 'forecasting': return <ForecastingDashboard data={dashboardData} currencySymbol={settings.currencySymbol} settings={settings} />;
      case 'asin-audit': return <AsinAuditDashboard data={dashboardData} previousData={previousBulkData} currencySymbol={settings.currencySymbol} settings={settings} />;
      case 'cannibalization': return <CannibalizationDashboard data={dashboardData} currencySymbol={settings.currencySymbol} />;
      case 'sp': return <SPDashboard data={dashboardData} currencySymbol={settings.currencySymbol} />;
      case 'sb': return <SBDashboard data={dashboardData} currencySymbol={settings.currencySymbol} />;
      case 'sd': return <SDDashboard data={dashboardData} currencySymbol={settings.currencySymbol} />;
      case 'search-terms': return <SearchTermDashboard data={dashboardData} previousData={previousBulkData} targetType="SP" currencySymbol={settings.currencySymbol} settings={settings} />;
      case 'sb-search-terms': return <SearchTermDashboard data={dashboardData} previousData={previousBulkData} targetType="SB" currencySymbol={settings.currencySymbol} settings={settings} />;
      case 'dayparting': return <DaypartingDashboard data={dashboardData} currencySymbol={settings.currencySymbol} />;
      case 'diagnostics': return <DiagnosticsDashboard data={dashboardData} settings={settings} productGoals={productGoals} />;
      case 'settings': return <SettingsDashboard data={dashboardData} settings={settings} onUpdateSettings={setSettings} productGoals={productGoals} onUpdateProductGoals={setProductGoals} userRole={userRole} />;
      default: return <ExecutiveDashboard data={dashboardData} previousData={previousBulkData} settings={settings} />;
    }
  };

  if (!bulkData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
        
        <div className="absolute top-6 right-6 z-20">
            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 shadow-md transition-colors"
            >
                {isDarkMode ? '☀️' : '🌙'}
            </button>
        </div>

        <div className="absolute top-0 left-0 w-full h-2 bg-brand-400"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-100 dark:bg-brand-900/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-100 dark:bg-slate-800 rounded-full blur-3xl opacity-50"></div>

        <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 lg:p-12 text-center border border-slate-100 dark:border-slate-800 relative z-10 transition-colors duration-300">
           
           <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none mb-8 transform -rotate-3">
              <Shield className="text-brand-400 w-12 h-12 fill-current" strokeWidth={2} />
           </div>
           
           <h1 className="text-5xl font-heading font-black text-slate-900 dark:text-white mb-2 tracking-tighter">
             LYNX<span className="text-brand-500">MEDIA</span>
           </h1>
           <p className="text-slate-400 mb-10 text-lg font-medium tracking-wide">
             EXPERT SOLUTIONS FOR AMAZON STORES
           </p>
           
           {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
               <Shield className="w-4 h-4" /> {error}
             </div>
           )}

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              <div className="relative group">
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={(e) => handleBulkUpload(e, false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={loading || !!bulkData}
                />
                <div className={`
                  flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300
                  ${bulkData ? 'bg-brand-50 border-brand-400 dark:bg-brand-900/20 dark:border-brand-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-zinc-700 group-hover:border-brand-500 group-hover:bg-brand-50/30'}
                `}>
                  {bulkData ? (
                     <>
                       <CheckCircle className="w-8 h-8 text-brand-600 mb-2" />
                       <span className="text-xs font-bold text-brand-800 dark:text-brand-400 uppercase tracking-wider">Bulk File Loaded</span>
                     </>
                  ) : (
                     <>
                        <CloudUpload className="w-8 h-8 text-slate-400 group-hover:text-brand-500 transition-colors mb-2" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-wider text-center">1. Bulk Operations</span>
                        <span className="text-[10px] text-slate-400 mt-1">Required</span>
                     </>
                  )}
                </div>
              </div>

              <div className="relative group">
                <input 
                  type="file" 
                  accept=".xlsx, .csv"
                  onChange={handleBusinessReportUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={loading}
                />
                <div className={`
                  flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300
                  ${businessReport ? 'bg-brand-50 border-brand-400 dark:bg-brand-900/20 dark:border-brand-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-zinc-700 group-hover:border-brand-500 group-hover:bg-brand-50/30'}
                `}>
                   {businessReport ? (
                     <>
                       <CheckCircle className="w-8 h-8 text-brand-600 mb-2" />
                       <span className="text-xs font-bold text-brand-800 dark:text-brand-400 uppercase tracking-wider">Report Loaded</span>
                     </>
                  ) : (
                     <>
                        <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-brand-500 transition-colors mb-2" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-wider text-center">2. Business Report</span>
                        <span className="text-[10px] text-slate-400 mt-1">Recommended</span>
                     </>
                  )}
                </div>
              </div>

              <div className="relative group">
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={(e) => handleBulkUpload(e, true)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={loading || !!previousBulkData}
                />
                <div className={`
                  flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300
                  ${previousBulkData ? 'bg-indigo-50 border-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-zinc-700 group-hover:border-indigo-500 group-hover:bg-indigo-50/30'}
                `}>
                   {previousBulkData ? (
                     <>
                       <CheckCircle className="w-8 h-8 text-indigo-600 mb-2" />
                       <span className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">Prev Period Loaded</span>
                     </>
                  ) : (
                     <>
                        <History className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-wider text-center">3. Prev Period Bulk</span>
                        <span className="text-[10px] text-slate-400 mt-1">For Comparisons</span>
                     </>
                  )}
                </div>
              </div>

              <div className="relative group">
                <input 
                  type="file" 
                  accept=".csv, .txt, .xlsx"
                  onChange={handleInventoryReportUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={loading || !!inventoryReport}
                />
                <div className={`
                  flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300
                  ${inventoryReport ? 'bg-emerald-50 border-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-zinc-700 group-hover:border-emerald-500 group-hover:bg-emerald-50/30'}
                `}>
                   {inventoryReport ? (
                     <>
                       <CheckCircle className="w-8 h-8 text-emerald-600 mb-2" />
                       <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Inventory Loaded</span>
                     </>
                  ) : (
                     <>
                        <Package className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors mb-2" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-wider text-center">4. FBA Inventory</span>
                        <span className="text-[10px] text-slate-400 mt-1">For Stock Risk</span>
                     </>
                  )}
                </div>
              </div>

              <div className="relative group">
                <input 
                  type="file" 
                  accept=".xlsx, .csv"
                  onChange={handleHourlyReportUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={loading || !!hourlyReport}
                />
                <div className={`
                  flex flex-col items-center justify-center h-40 px-3 border-2 border-dashed rounded-2xl transition-all duration-300
                  ${hourlyReport ? 'bg-fuchsia-50 border-fuchsia-400 dark:bg-fuchsia-900/20 dark:border-fuchsia-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-zinc-700 group-hover:border-fuchsia-500 group-hover:bg-fuchsia-50/30'}
                `}>
                   {hourlyReport ? (
                     <>
                       <CheckCircle className="w-8 h-8 text-fuchsia-600 mb-2" />
                       <span className="text-xs font-bold text-fuchsia-800 dark:text-fuchsia-400 uppercase tracking-wider">Hourly Loaded</span>
                     </>
                  ) : (
                     <>
                        <Clock className="w-8 h-8 text-slate-400 group-hover:text-fuchsia-500 transition-colors mb-2" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-wider text-center">5. Hourly Data</span>
                        <span className="text-[10px] text-slate-400 mt-1">For Dayparting</span>
                     </>
                  )}
                </div>
              </div>
           </div>

           <div className="max-w-lg mx-auto mb-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex flex-col items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Or load existing workspace</p>
                    <div className="relative group w-full">
                        <input 
                            type="file" 
                            accept=".lynx,.json"
                            onChange={handleImportWorkspace}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={loading}
                        />
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm group-hover:border-slate-300">
                            <Upload size={16} className="text-indigo-500" />
                            Import Team Workspace File (.lynx)
                        </button>
                    </div>
                </div>
           </div>

           {loading && (
              <div className="flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold mb-6 bg-slate-50 dark:bg-slate-800 py-3 rounded-xl animate-pulse border border-slate-200 dark:border-zinc-700">
                  <Loader2 className="animate-spin mr-3 w-5 h-5 text-brand-500" /> PROCESSING DATA...
              </div>
           )}

           <button 
                onClick={loadDemoData}
                disabled={loading}
                className="w-full py-4 px-6 bg-black text-white font-bold tracking-wide rounded-xl hover:bg-slate-900 hover:shadow-lg hover:shadow-slate-200 dark:hover:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 group border border-transparent dark:border-slate-700"
           >
                <Shield className="w-5 h-5 text-brand-400 fill-current group-hover:scale-110 transition-transform" />
                LOAD DEMO DATA
           </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onReset={handleReset}
        onExport={handleExportWorkspace}
        onImport={handleImportWorkspace}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        userRole={userRole}
        onSetUserRole={setUserRole}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
