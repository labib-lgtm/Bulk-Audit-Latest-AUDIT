
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
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Updated for Lynx Branding */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-black text-white transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none`}>
        
        {/* Logo Area */}
        <div className="flex items-center justify-between h-24 px-8 bg-black border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-400 flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.4)] text-black">
               <Shield className="w-6 h-6 fill-current" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-heading font-extrabold tracking-tight text-white leading-none">
                LYNX
              </span>
              <span className="text-lg font-heading font-bold tracking-tight text-brand-400 leading-none">
                MEDIA
              </span>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest font-heading">Dashboards</div>
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
                    ? 'bg-brand-400 text-black shadow-[0_0_20px_rgba(204,255,0,0.25)] scale-[1.02]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-black' : 'text-slate-500 group-hover:text-brand-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        {/* User / Footer */}
        <div className="p-4 border-t border-white/10 bg-black">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center text-xs font-black text-black">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.email || 'User'}</p>
              <p className="text-xs text-brand-400 font-medium">Expert Mode</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 shadow-sm z-30 relative">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-500 hover:text-slate-700">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600 fill-current" />
            <span className="font-heading font-bold text-slate-900">LYNX MEDIA</span>
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
