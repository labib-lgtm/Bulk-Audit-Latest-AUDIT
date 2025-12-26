
import React, { useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { 
  ExecutiveDashboard, 
  PortfolioDashboard, 
  AsinAuditDashboard,
  SPDashboard, 
  SBDashboard, 
  SDDashboard, 
  SearchTermDashboard, 
  DiagnosticsDashboard, 
  SettingsDashboard 
} from '../views/Dashboards';
import { processBulkFile, processBusinessReport } from '../services/dataProcessor';
import { generateMockData } from '../services/mockData';
import { DashboardData, AppSettings, ProductGoal } from '../types';
import { Upload, FileSpreadsheet, Zap, Shield, AlertCircle } from 'lucide-react';

const EMPTY_DATA: DashboardData = {
  portfolios: [], spCampaigns: [], spAdGroups: [], spKeywords: [], spProductTargets: [], spPlacements: [], spSkus: [],
  sbCampaigns: [], sbKeywords: [], sbTargets: [], sbPlacements: [], sbAds: [], sbMagEntities: [],
  sdCampaigns: [], sdTargets: [],
  searchTerms: [], businessReport: []
};

const DEFAULT_SETTINGS: AppSettings = {
  targetAcos: 0.30,
  breakEvenAcos: 0.40,
  minSpendThreshold: 20,
  minClickThreshold: 20,
  currencySymbol: '$'
};

const Index = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [currentView, setCurrentView] = useState('executive');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [productGoals, setProductGoals] = useState<Record<string, ProductGoal>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, type: 'bulk' | 'business') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      if (type === 'bulk') {
        const parsed = await processBulkFile(file);
        setDashboardData(prev => {
          const base = prev || EMPTY_DATA;
          return { ...base, ...parsed };
        });
      } else {
        const businessReport = await processBusinessReport(file);
        setDashboardData(prev => {
          const base = prev || EMPTY_DATA;
          return { ...base, businessReport };
        });
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      setError('Failed to parse file. Please ensure it is a valid Amazon Bulk Operations or Business Report file.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadDemo = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setDashboardData(generateMockData());
      setIsLoading(false);
    }, 500);
  }, []);

  const renderView = () => {
    if (!dashboardData) return null;

    switch (currentView) {
      case 'executive': return <ExecutiveDashboard data={dashboardData} />;
      case 'portfolio': return <PortfolioDashboard data={dashboardData} />;
      case 'asin-audit': return <AsinAuditDashboard data={dashboardData} />;
      case 'sp': return <SPDashboard data={dashboardData} />;
      case 'sb': return <SBDashboard data={dashboardData} />;
      case 'sd': return <SDDashboard data={dashboardData} />;
      case 'search-terms': return <SearchTermDashboard data={dashboardData} targetType="SP" />;
      case 'sb-search-terms': return <SearchTermDashboard data={dashboardData} targetType="SB" />;
      case 'diagnostics': return <DiagnosticsDashboard data={dashboardData} settings={settings} productGoals={productGoals} />;
      case 'settings': return <SettingsDashboard data={dashboardData} settings={settings} onUpdateSettings={setSettings} productGoals={productGoals} onUpdateProductGoals={setProductGoals} />;
      default: return <ExecutiveDashboard data={dashboardData} />;
    }
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-400/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-400/5 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-2xl w-full text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-400 flex items-center justify-center shadow-[0_0_40px_rgba(204,255,0,0.4)]">
              <Shield className="w-9 h-9 text-black fill-current" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-4xl font-heading font-black tracking-tight text-white">LYNX</span>
              <span className="text-2xl font-heading font-bold tracking-tight text-brand-400">MEDIA</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white mb-2">Amazon Advertising Analytics</h1>
          <p className="text-slate-400 mb-10 max-w-md mx-auto">Upload your Bulk Operations file to unlock powerful insights across all your campaigns.</p>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center justify-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Bulk Ops Upload */}
            <label className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${isLoading ? 'opacity-50 cursor-wait' : 'border-slate-700 hover:border-brand-400 hover:bg-brand-400/5'}`}>
              <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFileUpload(e, 'bulk')} className="hidden" disabled={isLoading} />
              <Upload className="w-10 h-10 text-slate-500 group-hover:text-brand-400 mb-3 transition-colors" />
              <span className="font-bold text-white text-sm">Bulk Operations File</span>
              <span className="text-xs text-slate-500 mt-1">Campaigns, Targets, Keywords</span>
            </label>

            {/* Business Report Upload */}
            <label className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${isLoading ? 'opacity-50 cursor-wait' : 'border-slate-700 hover:border-brand-400 hover:bg-brand-400/5'}`}>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleFileUpload(e, 'business')} className="hidden" disabled={isLoading} />
              <FileSpreadsheet className="w-10 h-10 text-slate-500 group-hover:text-brand-400 mb-3 transition-colors" />
              <span className="font-bold text-white text-sm">Business Report</span>
              <span className="text-xs text-slate-500 mt-1">By Child ASIN (Optional)</span>
            </label>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <button
            onClick={handleLoadDemo}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-brand-400 text-black font-bold rounded-2xl hover:bg-brand-300 transition-all shadow-[0_0_30px_rgba(204,255,0,0.2)] hover:shadow-[0_0_40px_rgba(204,255,0,0.3)] disabled:opacity-50"
          >
            <Zap size={18} /> Load Demo Data
          </button>

          <p className="text-xs text-slate-600 mt-6">Your data is processed locally. Nothing is uploaded to any server.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default Index;
