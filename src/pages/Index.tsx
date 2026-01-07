import React, { useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { ExecutiveDashboard, PortfolioDashboard, AsinAuditDashboard, SPDashboard, SBDashboard, SDDashboard, SearchTermDashboard, DiagnosticsDashboard, SettingsDashboard } from '../views/Dashboards';
import { TeamManagement } from '../views/TeamManagement';
import { processBulkFile, processBusinessReport } from '../services/dataProcessor';
import { generateMockData } from '../services/mockData';
import { DashboardData, AppSettings, ProductGoal } from '../types';
import { Upload, FileSpreadsheet, Zap, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
const EMPTY_DATA: DashboardData = {
  portfolios: [],
  spCampaigns: [],
  spAdGroups: [],
  spKeywords: [],
  spProductTargets: [],
  spPlacements: [],
  spSkus: [],
  sbCampaigns: [],
  sbKeywords: [],
  sbTargets: [],
  sbPlacements: [],
  sbAds: [],
  sbMagEntities: [],
  sdCampaigns: [],
  sdTargets: [],
  searchTerms: [],
  businessReport: []
};
const DEFAULT_SETTINGS: AppSettings = {
  targetAcos: 0.30,
  breakEvenAcos: 0.40,
  minSpendThreshold: 20,
  minClickThreshold: 20,
  currencySymbol: '$'
};
const Index = () => {
  const {
    user,
    signOut
  } = useAuth();
  const {
    hasAccess,
    isLoading: roleLoading
  } = useUserRole();
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
          return {
            ...base,
            ...parsed
          };
        });
      } else {
        const businessReport = await processBusinessReport(file);
        setDashboardData(prev => {
          const base = prev || EMPTY_DATA;
          return {
            ...base,
            businessReport
          };
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
    // Team management can be accessed without dashboard data
    if (currentView === 'team') {
      return <TeamManagement />;
    }
    if (!dashboardData) return null;
    switch (currentView) {
      case 'executive':
        return <ExecutiveDashboard data={dashboardData} />;
      case 'portfolio':
        return <PortfolioDashboard data={dashboardData} />;
      case 'asin-audit':
        return <AsinAuditDashboard data={dashboardData} />;
      case 'sp':
        return <SPDashboard data={dashboardData} />;
      case 'sb':
        return <SBDashboard data={dashboardData} />;
      case 'sd':
        return <SDDashboard data={dashboardData} />;
      case 'search-terms':
        return <SearchTermDashboard data={dashboardData} targetType="SP" />;
      case 'sb-search-terms':
        return <SearchTermDashboard data={dashboardData} targetType="SB" />;
      case 'diagnostics':
        return <DiagnosticsDashboard data={dashboardData} settings={settings} productGoals={productGoals} />;
      case 'settings':
        return <SettingsDashboard data={dashboardData} settings={settings} onUpdateSettings={setSettings} productGoals={productGoals} onUpdateProductGoals={setProductGoals} />;
      default:
        return <ExecutiveDashboard data={dashboardData} />;
    }
  };

  // Show loading while checking role
  if (roleLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center dark">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>;
  }

  // Block access for users without a role
  if (!hasAccess && user) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground font-sans dark">
        <div className="text-center max-w-md p-8">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Revoked</h1>
          <p className="text-muted-foreground mb-6">
            Your access to this application has been revoked. Please contact an administrator if you believe this is an error.
          </p>
          <button onClick={signOut} className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-all">
            Sign Out
          </button>
        </div>
      </div>;
  }
  if (!dashboardData) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden dark">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        
        {/* Floating Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[180px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-400/8 rounded-full blur-[150px] animate-float-slow" style={{
        animationDelay: '-5s'
      }} />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-brand-600/6 rounded-full blur-[120px] animate-float-slow" style={{
        animationDelay: '-10s'
      }} />

        <div className="relative z-10 max-w-2xl w-full text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-10 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-primary blur-xl opacity-50" />
              <div className="relative w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl">
                
              </div>
            </div>
            <div className="flex flex-col items-start">
              
              
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3 animate-fade-in" style={{
          animationDelay: '0.1s'
        }}>
            Amazon Advertising Analytics
          </h1>
          <p className="text-muted-foreground mb-12 max-w-md mx-auto animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            Upload your Bulk Operations file to unlock powerful insights across all your campaigns.
          </p>

          {error && <div className="mb-6 p-4 glass-dark rounded-2xl text-destructive text-sm flex items-center justify-center gap-3 border-destructive/30 animate-fade-in">
              <AlertCircle size={18} /> {error}
            </div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-fade-in" style={{
          animationDelay: '0.3s'
        }}>
            {/* Bulk Ops Upload */}
            <label className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${isLoading ? 'opacity-50 cursor-wait' : 'border-border hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_60px_-15px_hsl(var(--primary)/0.3)]'}`}>
              <input type="file" accept=".xlsx,.xls" onChange={e => handleFileUpload(e, 'bulk')} className="hidden" disabled={isLoading} />
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                <Upload className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="font-heading font-bold text-foreground">Bulk Operations File</span>
              <span className="text-sm text-muted-foreground mt-1">Campaigns, Targets, Keywords</span>
            </label>

            {/* Business Report Upload */}
            <label className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${isLoading ? 'opacity-50 cursor-wait' : 'border-border hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_60px_-15px_hsl(var(--primary)/0.3)]'}`}>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={e => handleFileUpload(e, 'business')} className="hidden" disabled={isLoading} />
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                <FileSpreadsheet className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="font-heading font-bold text-foreground">Business Report</span>
              <span className="text-sm text-muted-foreground mt-1">By Child ASIN (Optional)</span>
            </label>
          </div>

          <div className="flex items-center gap-4 mb-8 animate-fade-in" style={{
          animationDelay: '0.4s'
        }}>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={handleLoadDemo} disabled={isLoading} className="flex items-center justify-center gap-3 w-full px-8 py-5 bg-primary text-primary-foreground font-heading font-bold text-lg rounded-2xl btn-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 animate-fade-in" style={{
          animationDelay: '0.5s'
        }}>
            <Zap size={20} /> Load Demo Data
          </button>

          <p className="text-xs text-muted-foreground mt-8 animate-fade-in" style={{
          animationDelay: '0.6s'
        }}>
            🔒 Your data is processed locally. Nothing is uploaded to any server.
          </p>
        </div>
      </div>;
  }
  return <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </Layout>;
};
export default Index;