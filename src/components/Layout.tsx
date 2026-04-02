
import React, { useRef, useState, useEffect } from 'react';
import lynxLogoWhite from '@/assets/lynx-logo-white.png';
import { 
  PieChart, 
  LayoutGrid, 
  Search, 
  AlertTriangle, 
  Video, 
  Target, 
  Menu,
  X,
  TrendingUp,
  Settings,
  ScanSearch,
  Shield,
  Package,
  LogOut,
  Users,
  Crown,
  Upload,
  Download,
  Wallet,
  LineChart,
  ShieldAlert,
  Clock,
  Sparkles,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';
import { generateContextualAdvice } from '@/services/aiService';

interface LayoutProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  children: React.ReactNode;
  onReupload?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NAV_ITEMS = [
  { id: 'executive', label: 'Executive Summary', icon: TrendingUp },
  { id: 'profit', label: 'Profit Analytics', icon: Wallet },
  { id: 'portfolio', label: 'Portfolios', icon: PieChart },
  { id: 'forecasting', label: 'Forecasting', icon: LineChart },
  { id: 'asin-audit', label: 'ASIN Level Audit', icon: Package },
  { id: 'cannibalization', label: 'Cannibalization Checker', icon: ShieldAlert },
  { id: 'sp', label: 'Sponsored Products', icon: LayoutGrid },
  { id: 'sb', label: 'Sponsored Brands', icon: Video },
  { id: 'sd', label: 'Sponsored Display', icon: Target },
  { id: 'search-terms', label: 'SP Search Terms', icon: Search },
  { id: 'sb-search-terms', label: 'SB Search Terms', icon: ScanSearch },
  { id: 'dayparting', label: 'Dayparting', icon: Clock },
  { id: 'diagnostics', label: 'Global Diagnostics', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV_ITEMS = [
  { id: 'team', label: 'Team Management', icon: Users },
];

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children, onReupload, onReset, onExport, onImport }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();
  const { isAdmin, role, hasAccess, isLoading } = useUserRole();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const fetchAdvice = async () => {
    setIsAiLoading(true);
    setAiAdvice(null);
    const advice = await generateContextualAdvice(currentView, { view: currentView });
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  useEffect(() => {
    if (isAiPanelOpen) fetchAdvice();
  }, [currentView, isAiPanelOpen]);

  // Block access for users without a role
  if (!isLoading && !hasAccess && user) {
    return (
      <div className="flex h-screen bg-background items-center justify-center text-foreground font-sans dark">
        <div className="text-center max-w-md p-8">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Revoked</h1>
          <p className="text-muted-foreground mb-6">
            Your access to this application has been revoked. Please contact an administrator if you believe this is an error.
          </p>
          <button
            onClick={signOut}
            className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground font-sans dark relative">
      
      {/* AI Contextual FAB */}
      <button 
        onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        {isAiPanelOpen ? <X size={24} /> : <Sparkles size={24} className="group-hover:animate-pulse" />}
        {!isAiPanelOpen && (
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-card text-foreground text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border">
            Analyze this View
          </span>
        )}
      </button>

      {/* AI Insight Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-card shadow-2xl border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${isAiPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary w-5 h-5" />
              <h3 className="font-heading font-black text-lg">AI ANALYST</h3>
            </div>
            <button onClick={() => setIsAiPanelOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="bg-muted rounded-2xl p-4 border border-border mb-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Focus</p>
              <p className="text-sm font-bold text-foreground capitalize">{currentView.replace('-', ' ')}</p>
            </div>

            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="animate-spin mb-4 text-primary" size={32} />
                <p className="text-xs font-bold animate-pulse">Analyzing...</p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert">
                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAdvice?.replace(/\n/g, '<br/>') || '' }} />
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-border">
            <button onClick={fetchAdvice} className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <RefreshCw size={14} className={isAiLoading ? 'animate-spin' : ''} /> Refresh Insight
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300 animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-sidebar transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarCollapsed ? 'w-[72px]' : 'w-72'} ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full'} border-r border-sidebar-border flex flex-col`}>
        
        {/* Logo Area */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-sidebar-border shrink-0">
          <div className={`flex items-center overflow-hidden transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'w-10 justify-center' : ''}`}>
            <img src={lynxLogoWhite} alt="Lynx Media" className={`transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'h-8 w-auto' : 'h-10 w-auto'}`} />
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Collapse Toggle - Desktop only */}
        <div className="hidden lg:flex justify-end px-2 py-2 shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {!isSidebarCollapsed && (
            <div className="px-3 mb-4 text-[10px] font-bold text-sidebar-foreground/60 uppercase tracking-[0.2em] font-heading">
              Dashboards
            </div>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const collapsed = isSidebarCollapsed && !isMobileMenuOpen;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`relative flex items-center w-full ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'} text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_30px_-5px_hsl(var(--sidebar-primary)/0.5)]'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${collapsed ? '' : 'mr-3'} transition-all ${
                  isActive 
                    ? 'bg-sidebar-primary-foreground/10' 
                    : 'bg-transparent group-hover:bg-sidebar-primary/10'
                }`}>
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 group-hover:text-sidebar-primary'}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary-foreground rounded-r-full" />
                )}
              </button>
            );
          })}

          {/* Admin Section */}
          {isAdmin && (
            <>
              {!isSidebarCollapsed && (
                <div className="px-3 mb-4 mt-8 text-[10px] font-bold text-sidebar-foreground/60 uppercase tracking-[0.2em] font-heading">
                  Admin
                </div>
              )}
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const collapsed = isSidebarCollapsed && !isMobileMenuOpen;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`relative flex items-center w-full ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'} text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_30px_-5px_hsl(var(--sidebar-primary)/0.5)]'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${collapsed ? '' : 'mr-3'} transition-all ${
                      isActive 
                        ? 'bg-sidebar-primary-foreground/10' 
                        : 'bg-transparent group-hover:bg-sidebar-primary/10'
                    }`}>
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 group-hover:text-sidebar-primary'}`} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {isActive && !collapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary-foreground rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </nav>
        
        {/* Workspace Controls - hidden when collapsed */}
        {(onExport || onImport) && !isSidebarCollapsed && (
          <div className="px-3 pb-3 shrink-0">
            <div className="bg-sidebar-accent/50 rounded-2xl p-3 border border-sidebar-border/50 mb-2">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-[10px] font-bold uppercase text-sidebar-foreground/60 tracking-wider">Team Workspace</span>
              </div>
              <div className="flex gap-2">
                {onExport && (
                  <button onClick={onExport} className="flex-1 flex flex-col items-center justify-center gap-1 bg-sidebar-accent hover:bg-sidebar-primary/10 border border-sidebar-border/50 rounded-xl py-2 text-[10px] font-bold text-sidebar-foreground/80 transition-colors">
                    <Download size={14} className="text-primary" /> Save
                  </button>
                )}
                {onImport && (
                  <button onClick={handleImportClick} className="flex-1 flex flex-col items-center justify-center gap-1 bg-sidebar-accent hover:bg-sidebar-primary/10 border border-sidebar-border/50 rounded-xl py-2 text-[10px] font-bold text-sidebar-foreground/80 transition-colors">
                    <Upload size={14} className="text-accent" /> Load
                  </button>
                )}
                {onImport && <input type="file" ref={fileInputRef} className="hidden" accept=".lynx,.json" onChange={onImport} />}
              </div>
            </div>
          </div>
        )}

        {/* Reset Button - hidden when collapsed */}
        {onReset && !isSidebarCollapsed && (
          <div className="px-3 pb-3 shrink-0">
            <button
              onClick={onReset}
              className="flex items-center justify-center w-full gap-2 px-4 py-2 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl hover:bg-destructive/20 transition-colors"
            >
              <LogOut size={14} /> Clear Data & Exit
            </button>
          </div>
        )}

        {/* User / Footer */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          {isSidebarCollapsed && !isMobileMenuOpen ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-brand-600 flex items-center justify-center text-sm font-bold text-sidebar-primary-foreground">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                onClick={signOut}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-brand-600 flex items-center justify-center text-sm font-bold text-sidebar-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email || 'User'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isAdmin ? (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-400 bg-amber-500/10 font-medium">
                      <Crown className="w-2.5 h-2.5 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-sidebar-primary/50 text-sidebar-primary bg-sidebar-primary/10 font-medium">
                      {role || 'User'}
                    </Badge>
                  )}
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-card border-b border-border z-30 relative">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Menu size={22} />
          </button>
          <img src={lynxLogoWhite} alt="Lynx Media" className="h-8 w-auto" />
          <div className="w-10" />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-dots">
          <div className="max-w-8xl mx-auto w-full animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const RefreshCw = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
);
