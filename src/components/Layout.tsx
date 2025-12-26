
import React from 'react';
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
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, signOut } = useAuth();
  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground font-sans">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Dark Theme */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-card text-foreground transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none border-r border-border`}>
        
        {/* Logo Area */}
        <div className="flex items-center justify-between h-24 px-8 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.4)] text-primary-foreground">
               <Shield className="w-6 h-6 fill-current" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-heading font-extrabold tracking-tight text-foreground leading-none">
                LYNX
              </span>
              <span className="text-lg font-heading font-bold tracking-tight text-primary leading-none">
                MEDIA
              </span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-heading">Dashboards</div>
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
                className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.25)] scale-[1.02]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        {/* User / Footer */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted border border-border">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-black text-primary-foreground">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user?.email || 'User'}</p>
              <p className="text-xs text-primary font-medium">Expert Mode</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-card border-b border-border shadow-sm z-30 relative">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary fill-current" />
            <span className="font-heading font-bold text-foreground">LYNX MEDIA</span>
          </div>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-8xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
