
import React, { useRef, useState, useEffect } from 'react';
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
  Clock,
  LineChart,
  Share2,
  Upload,
  Download,
  Sun,
  Moon,
  ShieldAlert,
  Wallet,
  Sparkles,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { generateContextualAdvice } from '../services/aiService';

interface LayoutProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userRole?: string;
  onSetUserRole?: (role: any) => void;
  children: React.ReactNode;
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

export const Layout: React.FC<LayoutProps> = ({ 
    currentView, 
    setCurrentView, 
    onReset, 
    onExport, 
    onImport, 
    isDarkMode, 
    onToggleTheme, 
    children 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const fetchAdvice = async () => {
      setIsAiLoading(true);
      setAiAdvice(null);
      // In a real app, we'd pass actual data here. For now, we signal the view.
      const advice = await generateContextualAdvice(currentView, { view: currentView });
      setAiAdvice(advice);
      setIsAiLoading(false);
  };

  useEffect(() => {
    if (isAiPanelOpen) fetchAdvice();
  }, [currentView, isAiPanelOpen]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black overflow-hidden text-slate-900 dark:text-zinc-100 font-sans transition-colors duration-300 relative">
      
      {/* AI Contextual FAB */}
      <button 
        onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full bg-brand-400 text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        {isAiPanelOpen ? <X size={24} /> : <Sparkles size={24} className="group-hover:animate-pulse" />}
        {!isAiPanelOpen && (
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Analyze this View
            </span>
        )}
      </button>

      {/* AI Insight Drawer */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-zinc-950 shadow-2xl border-l border-slate-200 dark:border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${isAiPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-brand-500 w-5 h-5" />
                    <h3 className="font-heading font-black text-lg">AI ANALYST</h3>
                  </div>
                  <button onClick={() => setIsAiPanelOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="bg-slate-50 dark:bg-zinc-900 rounded-2xl p-4 border border-slate-100 dark:border-zinc-800 mb-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Focus</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{currentView.replace('-', ' ')}</p>
                  </div>

                  {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                          <Loader2 className="animate-spin mb-4 text-brand-500" size={32} />
                          <p className="text-xs font-bold animate-pulse">Consulting Gemini...</p>
                      </div>
                  ) : (
                      <div className="prose prose-sm dark:prose-invert">
                          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAdvice?.replace(/\n/g, '<br/>') || '' }} />
                      </div>
                  )}
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                  <button onClick={fetchAdvice} className="w-full py-3 bg-zinc-900 dark:bg-brand-400 text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <RefreshCw size={14} className={isAiLoading ? 'animate-spin' : ''} /> Refresh Insight
                  </button>
              </div>
          </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-zinc-950/80 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-black text-white transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none flex flex-col border-r border-white/5 dark:border-zinc-800`}>
        
        {/* Logo Area */}
        <div className="flex items-center justify-between h-24 px-8 bg-black border-b border-white/10 dark:border-zinc-800 shrink-0">
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
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest font-heading">Dashboards</div>
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
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-black' : 'text-zinc-500 group-hover:text-brand-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        {/* User / Footer */}
        <div className="p-4 border-t border-white/10 dark:border-zinc-800 bg-black shrink-0 space-y-3">
          <div className="bg-zinc-900/50 rounded-2xl p-3 border border-white/5 mb-2">
              <div className="flex items-center justify-between gap-2 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <Share2 className="text-brand-400 w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Team Workspace</span>
                  </div>
                  <button onClick={onToggleTheme} className="text-zinc-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10" title="Toggle Dark Mode">
                      {isDarkMode ? <Sun size={14} className="text-brand-400" /> : <Moon size={14} />}
                  </button>
              </div>
              <div className="flex gap-2">
                  <button onClick={onExport} className="flex-1 flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-2 text-[10px] font-bold text-zinc-300 transition-colors">
                      <Download size={14} className="text-emerald-400" /> Save
                  </button>
                  <button onClick={handleImportClick} className="flex-1 flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-2 text-[10px] font-bold text-zinc-300 transition-colors">
                      <Upload size={14} className="text-indigo-400" /> Load
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".lynx,.json" onChange={onImport} />
              </div>
          </div>

          <button onClick={onReset} className="flex items-center justify-center w-full gap-2 px-4 py-2 text-xs font-bold text-rose-400 bg-rose-950/30 border border-rose-900/50 rounded-xl hover:bg-rose-900/50 hover:text-rose-300 transition-colors">
             <LogOut size={14} /> Clear Data & Exit
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc] dark:bg-black transition-colors duration-300">
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800 shadow-sm z-30 relative transition-colors duration-300">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600 fill-current" />
            <span className="font-heading font-bold text-slate-900 dark:text-white">LYNX MEDIA</span>
          </div>
          <button onClick={onToggleTheme} className="text-slate-500 dark:text-zinc-400">
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-8xl mx-auto w-full">
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
