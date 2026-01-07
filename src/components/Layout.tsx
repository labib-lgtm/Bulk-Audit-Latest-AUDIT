
import React from 'react';
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
  Layers,
  Settings,
  ScanSearch,
  Shield,
  Package,
  LogOut,
  Users,
  Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'executive', label: 'Executive Summary', icon: TrendingUp },
  { id: 'portfolio', label: 'Portfolios', icon: PieChart },
  { id: 'asin-audit', label: 'ASIN Level Audit', icon: Package },
  { id: 'sp', label: 'Sponsored Products', icon: LayoutGrid },
  { id: 'sb', label: 'Sponsored Brands', icon: Video },
  { id: 'sd', label: 'Sponsored Display', icon: Target },
  { id: 'search-terms', label: 'SP Search Terms', icon: Search },
  { id: 'sb-search-terms', label: 'SB Search Terms', icon: ScanSearch },
  { id: 'diagnostics', label: 'Global Diagnostics', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV_ITEMS = [
  { id: 'team', label: 'Team Management', icon: Users },
];

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, role, hasAccess, isLoading } = useUserRole();

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
    <div className="flex h-screen bg-background overflow-hidden text-foreground font-sans dark">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300 animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Premium Dark Theme */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-sidebar-border`}>
        
        {/* Logo Area */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-sidebar-border">
          <div className="flex items-center">
            <img src={lynxLogoWhite} alt="Lynx Media" className="h-10 w-auto" />
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-4 text-[10px] font-bold text-sidebar-foreground/60 uppercase tracking-[0.2em] font-heading">
            Dashboards
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`relative flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_30px_-5px_hsl(var(--sidebar-primary)/0.5)]'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all ${
                  isActive 
                    ? 'bg-sidebar-primary-foreground/10' 
                    : 'bg-transparent group-hover:bg-sidebar-primary/10'
                }`}>
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 group-hover:text-sidebar-primary'}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary-foreground rounded-r-full" />
                )}
              </button>
            );
          })}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="px-3 mb-4 mt-8 text-[10px] font-bold text-sidebar-foreground/60 uppercase tracking-[0.2em] font-heading">
                Admin
              </div>
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`relative flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_30px_-5px_hsl(var(--sidebar-primary)/0.5)]'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all ${
                      isActive 
                        ? 'bg-sidebar-primary-foreground/10' 
                        : 'bg-transparent group-hover:bg-sidebar-primary/10'
                    }`}>
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 group-hover:text-sidebar-primary'}`} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary-foreground rounded-r-full" />
                    )}
                  </button>
                );
              })}
            </>
          )}
        </nav>
        
        {/* User / Footer */}
        <div className="p-3 border-t border-sidebar-border">
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
