import React, { useState, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { ExecutiveDashboard, PortfolioDashboard, AsinAuditDashboard, SPDashboard, SBDashboard, SDDashboard, SearchTermDashboard, DiagnosticsDashboard, SettingsDashboard } from '../views/Dashboards';
import { TeamManagement } from '../views/TeamManagement';
import { processBulkFile, processBusinessReport } from '../services/dataProcessor';
import { generateMockData } from '../services/mockData';
import { DashboardData, AppSettings, ProductGoal } from '../types';
import { Upload, FileSpreadsheet, Zap, Shield, AlertCircle, X } from 'lucide-react';
import lynxLogoWhite from '@/assets/lynx-logo-white.png';
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
  const [pendingData, setPendingData] = useState<Partial<DashboardData>>({});
  const [bulkFileUploaded, setBulkFileUploaded] = useState(false);
  const [businessFileUploaded, setBusinessFileUploaded] = useState(false);
  const [currentView, setCurrentView] = useState('executive');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [productGoals, setProductGoals] = useState<Record<string, ProductGoal>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, type: 'bulk' | 'business') => {
    const file = event.target.files?.[0];
    console.log('File upload triggered:', type, file?.name);
    if (!file) {
      console.log('No file selected');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (type === 'bulk') {
        console.log('Processing bulk file...');
        const parsed = await processBulkFile(file);
        console.log('Bulk file parsed successfully');
        setPendingData(prev => ({
          ...prev,
          ...parsed
        }));
        setBulkFileUploaded(true);
      } else {
        console.log('Processing business report...');
        const businessReport = await processBusinessReport(file);
        console.log('Business report parsed successfully');
        setPendingData(prev => ({
          ...prev,
          businessReport
        }));
        setBusinessFileUploaded(true);
      }
    } catch (err) {
      console.error('Error parsing file:', err);
      setError('Failed to parse file. Please ensure it is a valid Amazon Bulk Operations or Business Report file.');
    } finally {
      setIsLoading(false);
      // Reset input value so same file can be selected again
      event.target.value = '';
    }
  }, []);

  const handleProceedToDashboard = useCallback(() => {
    if (bulkFileUploaded) {
      setDashboardData({
        ...EMPTY_DATA,
        ...pendingData
      });
    }
  }, [bulkFileUploaded, pendingData]);

  const handleRemoveFile = useCallback((type: 'bulk' | 'business') => {
    if (type === 'bulk') {
      const { businessReport, ...rest } = pendingData;
      // Remove all bulk data, keep business report if exists
      setPendingData(businessReport ? { businessReport } : {});
      setBulkFileUploaded(false);
    } else {
      const { businessReport, ...rest } = pendingData;
      setPendingData(rest);
      setBusinessFileUploaded(false);
    }
  }, [pendingData]);

  const handleReupload = useCallback(() => {
    setDashboardData(null);
    setPendingData({});
    setBulkFileUploaded(false);
    setBusinessFileUploaded(false);
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
          <div className="flex items-center justify-center mb-10 animate-fade-in">
            <img src={lynxLogoWhite} alt="Lynx Media" className="h-16 w-auto" />
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
            <div className="relative">
              <label className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${bulkFileUploaded ? 'border-primary bg-primary/10' : isLoading ? 'opacity-50 cursor-wait' : 'border-border hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_60px_-15px_hsl(var(--primary)/0.3)]'}`}>
                <input type="file" accept=".xlsx,.xls" onChange={e => handleFileUpload(e, 'bulk')} className="hidden" disabled={isLoading} />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${bulkFileUploaded ? 'bg-primary/20 scale-110' : 'bg-muted group-hover:bg-primary/10 group-hover:scale-110'}`}>
                  <Upload className={`w-7 h-7 transition-colors ${bulkFileUploaded ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                </div>
                <span className="font-heading font-bold text-foreground">Bulk Operations File</span>
                <span className="text-sm text-muted-foreground mt-1">Campaigns, Targets, Keywords</span>
                {bulkFileUploaded && <span className="text-xs text-primary mt-2 font-medium">✓ Uploaded</span>}
              </label>
              {bulkFileUploaded && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile('bulk'); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/20 hover:bg-destructive/40 flex items-center justify-center text-destructive transition-all"
                  title="Remove file"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Business Report Upload */}
            <div className="relative">
              <label className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${businessFileUploaded ? 'border-primary bg-primary/10' : isLoading ? 'opacity-50 cursor-wait' : 'border-border hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_60px_-15px_hsl(var(--primary)/0.3)]'}`}>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={e => handleFileUpload(e, 'business')} className="hidden" disabled={isLoading} />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${businessFileUploaded ? 'bg-primary/20 scale-110' : 'bg-muted group-hover:bg-primary/10 group-hover:scale-110'}`}>
                  <FileSpreadsheet className={`w-7 h-7 transition-colors ${businessFileUploaded ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                </div>
                <span className="font-heading font-bold text-foreground">Business Report</span>
                <span className="text-sm text-muted-foreground mt-1">By Child ASIN (Optional)</span>
                {businessFileUploaded && <span className="text-xs text-primary mt-2 font-medium">✓ Uploaded</span>}
              </label>
              {businessFileUploaded && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile('business'); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/20 hover:bg-destructive/40 flex items-center justify-center text-destructive transition-all"
                  title="Remove file"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Proceed Button - shows when bulk file is uploaded */}
          {bulkFileUploaded && (
            <div className="mb-8 animate-fade-in">
              <button 
                onClick={handleProceedToDashboard} 
                disabled={isLoading} 
                className="flex items-center justify-center gap-3 w-full px-8 py-5 bg-primary text-primary-foreground font-heading font-bold text-lg rounded-2xl btn-glow transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                <Zap size={20} /> {businessFileUploaded ? 'View Dashboard' : 'Continue with Bulk File Only'}
              </button>
              {!businessFileUploaded && (
                <p className="text-xs text-muted-foreground mt-3">
                  You can also add the Business Report for enhanced analytics
                </p>
              )}
            </div>
          )}

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
  return <Layout currentView={currentView} setCurrentView={setCurrentView} onReupload={handleReupload}>
      {renderView()}
    </Layout>;
};
export default Index;