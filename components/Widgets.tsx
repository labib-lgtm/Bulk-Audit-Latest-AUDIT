
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Download, ChevronDown, Search, X, TrendingUp, TrendingDown, 
  ArrowUp, ArrowDown, Eye, Settings, SlidersHorizontal, Info, 
  Maximize2, Minimize2, ChevronLeft, ChevronRight, Filter, Trash2,
  ListFilter, Check, MoreVertical, ArrowUpDown, SortAsc, SortDesc,
  CheckSquare, Square, MinusSquare, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  typeLabel?: string;
  color?: 'blue' | 'green' | 'red' | 'indigo' | 'slate';
  alert?: boolean;
  onClick?: () => void;
  dense?: boolean;
  isSelected?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subValue, 
  typeLabel = 'TOTAL', 
  isSelected = false,
  alert = false, 
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`relative rounded-xl p-4 sm:p-5 border transition-all duration-200 h-full flex flex-col justify-between group
        ${onClick ? 'cursor-pointer' : ''}
        ${isSelected 
          ? 'bg-brand-50 dark:bg-zinc-900/50 border-brand-500 dark:border-brand-500 shadow-lg shadow-brand-400/20 ring-1 ring-brand-500 dark:ring-brand-500' 
          : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md'
        }`}
    >
      <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
        <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-tight ${isSelected ? 'text-brand-900 dark:text-brand-400' : 'text-slate-500 dark:text-zinc-400'}`}>
          {title}
        </span>
        <Info size={14} className={`${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-300 dark:text-zinc-600'} cursor-help opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block`} />
      </div>
      
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`text-xl sm:text-[26px] font-heading font-bold tracking-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
          {value || '—'}
        </span>
        {typeLabel && value !== '—' && (
          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-400 dark:text-zinc-500'}`}>
            {typeLabel}
          </span>
        )}
      </div>
      
      {subValue && (
        <div className={`mt-2 text-[10px] sm:text-[11px] font-semibold ${isSelected ? 'text-brand-800 dark:text-brand-200' : 'text-slate-500 dark:text-zinc-400'}`}>
          {subValue}
        </div>
      )}
      
      {/* Visual selection indicator */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 dark:bg-brand-500 rounded-b-xl"></div>
      )}
      
      {alert && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export const SectionHeader: React.FC<{ title: string; description: string; rightElement?: React.ReactNode }> = ({ title, description, rightElement }) => (
  <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">{title}</h2>
      <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-zinc-400 max-w-2xl">{description}</p>
    </div>
    {rightElement && <div className="w-full lg:w-auto">{rightElement}</div>}
  </div>
);

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  initialSortKey?: string;
  dense?: boolean;
  enableExport?: boolean;
  fileName?: string;
  renderSubComponent?: (row: T) => React.ReactNode; // Added support for drill-down rows
}

interface FilterState {
  type: 'value' | 'condition';
  selectedValues?: string[]; // stored as strings
  operator?: 'contains' | 'equals' | 'startsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'neq';
  value?: string;
}

// Helper to safely render cell content to prevent React crashes with objects
const safeRender = (val: any): React.ReactNode => {
    if (val === null || val === undefined) return <span className="text-slate-300 dark:text-zinc-600">-</span>;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') {
        if (val instanceof Date) return val.toLocaleDateString();
        return JSON.stringify(val);
    }
    return String(val);
};

export const DataTable = <T extends Record<string, any>>({ 
    data, 
    columns, 
    initialSortKey, 
    dense = false,
    enableExport = true,
    fileName = 'Lynx_Export',
    renderSubComponent
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    initialSortKey ? { key: initialSortKey, direction: 'desc' } : null
  );
  
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isAutoFit, setIsAutoFit] = useState(false);
  
  const [filters, setFilters] = useState<Record<string, FilterState>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for expanded rows (stores indices relative to sortedData)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const colMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedRows(new Set()); // Reset expansion on data/filter change
  }, [data.length, filters]); 

  const toggleRowExpansion = (index: number) => {
      const newSet = new Set(expandedRows);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      setExpandedRows(newSet);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
        setIsColumnMenuOpen(false);
      }
      
      if (activeFilterCol && filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
          const target = event.target as HTMLElement;
          if (!target.closest('[data-filter-trigger]')) {
              setActiveFilterCol(null);
              setMenuPosition(null);
          }
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [activeFilterCol]);

  // ... (rest of logic: uniqueValuesMap, handleSort, toggleColumn, clearAllFilters, applyFilter, handleFilterClick, handleScroll, filteredData, sortedData, handleExport) ...
  // Re-using existing logic for brevity, only showing render changes below.
  
  const uniqueValuesMap = useMemo(() => {
    const map = new Map<string, any[]>();
    columns.forEach(col => {
       const set = new Set<any>();
       data.forEach(row => {
          const val = row[col.key];
          if (val !== null && val !== undefined) set.add(val);
       });
       map.set(String(col.key), Array.from(set).sort());
    });
    return map;
  }, [data, columns]);

  const handleSort = (key: string, direction?: 'asc' | 'desc') => {
    if (direction) {
       setSortConfig({ key, direction });
    } else {
       let newDir: 'asc' | 'desc' = 'asc';
       if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          newDir = 'desc';
       }
       setSortConfig({ key, direction: newDir });
    }
  };

  const toggleColumn = (key: string) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(key)) {
      newHidden.delete(key);
    } else {
      newHidden.add(key);
    }
    setHiddenColumns(newHidden);
  };

  const clearAllFilters = () => {
      setFilters({});
      setActiveFilterCol(null);
      setMenuPosition(null);
  };

  const applyFilter = (key: string, filterState: FilterState | null) => {
     setFilters(prev => {
         const next = { ...prev };
         if (filterState) {
             next[key] = filterState;
         } else {
             delete next[key];
         }
         return next;
     });
  };

  const handleFilterClick = (e: React.MouseEvent, colKey: string) => {
    e.stopPropagation();
    if (activeFilterCol === colKey) {
        setActiveFilterCol(null);
        setMenuPosition(null);
        return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const MENU_WIDTH = 288;
    let left = rect.right - MENU_WIDTH;
    if (left < 10) left = 10;
    if (left + MENU_WIDTH > window.innerWidth) left = window.innerWidth - MENU_WIDTH - 10;

    setMenuPosition({ 
        top: rect.bottom + 4, 
        left: left
    });
    setActiveFilterCol(colKey);
  };

  const handleScroll = () => {
    if (activeFilterCol) {
        setActiveFilterCol(null);
        setMenuPosition(null);
    }
  };

  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return data;

    return data.filter(row => {
        return Object.entries(filters).every(([key, filterState]: [string, FilterState]) => {
            const rowVal = row[key];
            const strVal = String(rowVal ?? '').toLowerCase();
            const numVal = typeof rowVal === 'number' ? rowVal : parseFloat(strVal);

            if (filterState.type === 'value') {
                if (!filterState.selectedValues || filterState.selectedValues.length === 0) return true;
                return filterState.selectedValues.includes(String(rowVal));
            }

            if (filterState.type === 'condition' && filterState.operator) {
                const targetStr = (filterState.value || '').toLowerCase();
                const targetNum = parseFloat(filterState.value || '0');

                switch(filterState.operator) {
                    case 'contains': return strVal.includes(targetStr);
                    case 'equals': return strVal === targetStr;
                    case 'startsWith': return strVal.startsWith(targetStr);
                    case 'neq': return strVal !== targetStr;
                    case 'gt': return !isNaN(numVal) && !isNaN(targetNum) && numVal > targetNum;
                    case 'lt': return !isNaN(numVal) && !isNaN(targetNum) && numVal < targetNum;
                    case 'gte': return !isNaN(numVal) && !isNaN(targetNum) && numVal >= targetNum;
                    case 'lte': return !isNaN(numVal) && !isNaN(targetNum) && numVal <= targetNum;
                    default: return true;
                }
            }
            return true;
        });
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const compareResult = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    });
  }, [filteredData, sortConfig]);

  const handleExport = () => {
      const visibleCols = columns.filter(c => !hiddenColumns.has(String(c.key)));
      const exportData = sortedData.map(row => {
          const cleanRow: Record<string, any> = {};
          visibleCols.forEach(col => {
             const val = row[col.key];
             cleanRow[col.header] = typeof val === 'object' ? JSON.stringify(val) : val;
          });
          return cleanRow;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const visibleColumns = columns.filter(col => !hiddenColumns.has(String(col.key)));

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col relative min-h-[400px]">
      
      {/* Top Controls Bar */}
      <div className={`px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-zinc-900 gap-3 rounded-t-xl sm:rounded-t-2xl z-20`}>
        <div className="flex items-center gap-4">
             <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest hidden sm:block">
                Table Controls
             </div>
             {Object.keys(filters).length > 0 && (
                <button 
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                >
                    <Trash2 size={12} /> Clear Filters ({Object.keys(filters).length})
                </button>
             )}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {enableExport && (
              <button 
                 onClick={handleExport}
                 className="flex items-center px-3 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-900 dark:hover:text-brand-300 hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
                 title="Export current view to Excel"
              >
                  <Download size={14} className="mr-2" />
                  <span className="hidden sm:inline">Export</span>
              </button>
          )}

          <button 
              onClick={() => setIsAutoFit(!isAutoFit)}
              className="flex items-center px-3 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
              {isAutoFit ? <Maximize2 size={14} className="mr-2" /> : <Minimize2 size={14} className="mr-2" />}
              <span className="hidden sm:inline">{isAutoFit ? 'Stretch' : 'Auto Fit'}</span>
              <span className="sm:hidden">{isAutoFit ? 'Full' : 'Fit'}</span>
          </button>

          <div className="relative" ref={colMenuRef}>
            <button 
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="flex items-center px-3 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <SlidersHorizontal size={14} className="mr-2" />
              Columns
            </button>
            
            {isColumnMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-zinc-700 z-50 p-3 animate-fadeIn">
                <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 px-2 py-1 uppercase mb-2 tracking-widest border-b border-slate-50 dark:border-zinc-700">Filter Columns</div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 mt-2">
                  {columns.map(col => (
                    <label key={String(col.key)} className="flex items-center px-2 py-2 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={!hiddenColumns.has(String(col.key))}
                        onChange={() => toggleColumn(String(col.key))}
                        className="w-4 h-4 text-brand-600 rounded-md border-slate-300 focus:ring-brand-500 dark:bg-zinc-700 dark:border-zinc-600"
                      />
                      <span className="ml-3 text-sm font-medium text-slate-700 dark:text-zinc-300">{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={tableContainerRef} 
        onScroll={handleScroll}
        className="overflow-x-auto custom-scrollbar flex-1 relative min-h-[300px]"
      >
        <table className={`${isAutoFit ? 'w-auto' : 'min-w-full'} divide-y divide-slate-100 dark:divide-zinc-800 border-separate border-spacing-0`}>
          <thead className="bg-slate-50 dark:bg-zinc-900/95 backdrop-blur z-10 sticky top-0">
            <tr className="divide-x divide-slate-200 dark:divide-zinc-800">
              {/* Expand Column Header */}
              {renderSubComponent && (
                  <th className="w-10 px-2 py-3 border-b border-slate-200 dark:border-zinc-800 sticky left-0 z-30 bg-slate-50 dark:bg-zinc-900"></th>
              )}
              {visibleColumns.map((col, i) => {
                 const colKey = String(col.key);
                 const isFiltered = !!filters[colKey];
                 const isSorted = sortConfig?.key === colKey;
                 const isActive = activeFilterCol === colKey;
                 
                 return (
                  <th 
                    key={colKey} 
                    className={`px-3 py-3 text-left text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-heading border-b border-slate-200 dark:border-zinc-800 z-20 group`}
                    style={{ textAlign: col.align || 'left', minWidth: '150px' }}
                  >
                    <div className={`flex items-center justify-between w-full`}>
                      <div 
                         className={`flex items-center gap-2 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 truncate flex-1 select-none`} 
                         onClick={() => col.sortable !== false && handleSort(colKey)}
                      >
                        <span className={`truncate ${isSorted ? 'text-brand-600 dark:text-brand-400' : ''}`}>{col.header}</span>
                        {isSorted && (
                          <span className="text-brand-500 dark:text-brand-400">
                            {sortConfig.direction === 'asc' ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
                          </span>
                        )}
                      </div>
                      
                      {col.filterable !== false && (
                         <button 
                            data-filter-trigger="true"
                            onClick={(e) => handleFilterClick(e, colKey)}
                            className={`p-1.5 rounded-md transition-colors ml-2 flex-shrink-0 ${isFiltered || isActive ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-800' : 'text-slate-400 dark:text-zinc-600 hover:text-slate-800 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                            title="Filter Column"
                         >
                            <ListFilter size={14} strokeWidth={isFiltered ? 2.5 : 2} />
                         </button>
                      )}
                    </div>
                  </th>
              )})}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 z-0 relative">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, i) => {
                // Determine absolute index for expansion tracking
                const absoluteIndex = startIndex + i;
                const isExpanded = expandedRows.has(absoluteIndex);

                return (
                <React.Fragment key={i}>
                    <tr className={`hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors group divide-x divide-slate-100 dark:divide-zinc-800 ${isExpanded ? 'bg-brand-50/30 dark:bg-brand-900/10' : 'bg-white dark:bg-zinc-900'}`}>
                    {/* Expand Button Cell */}
                    {renderSubComponent && (
                        <td className="w-10 px-2 py-3 text-center sticky left-0 bg-inherit z-10 border-r border-slate-100 dark:border-zinc-800">
                            <button 
                                onClick={() => toggleRowExpansion(absoluteIndex)}
                                className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors ${isExpanded ? 'text-brand-600 rotate-90' : 'text-slate-400'}`}
                            >
                                <ChevronRightIcon size={16} />
                            </button>
                        </td>
                    )}
                    {visibleColumns.map((col, j) => (
                        <td key={j} className={`px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-slate-700 dark:text-zinc-100 font-medium`} style={{ textAlign: col.align || 'left' }}>
                        {col.render ? col.render(row) : safeRender(row[col.key])}
                        </td>
                    ))}
                    </tr>
                    
                    {/* Expanded Content Row */}
                    {isExpanded && renderSubComponent && (
                        <tr>
                            <td colSpan={visibleColumns.length + 1} className="px-0 py-0 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                                <div className="animate-fadeIn p-4">
                                    {renderSubComponent(row)}
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
              )})
            ) : (
              <tr>
                <td colSpan={visibleColumns.length + (renderSubComponent ? 1 : 0)} className="px-6 py-16 text-center text-slate-400 dark:text-zinc-600 bg-white dark:bg-zinc-900">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-12 h-12 mb-4 text-slate-200 dark:text-zinc-700" />
                    <p className="font-heading font-medium text-lg text-slate-600 dark:text-zinc-400">No matching records</p>
                    <p className="text-sm text-slate-400 dark:text-zinc-600">Try adjusting your filters or upload a different file.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Filter Menu */}
      {activeFilterCol && menuPosition && (
          <div 
             ref={filterMenuRef}
             className="fixed w-72 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 z-[9999] overflow-hidden text-slate-700 dark:text-zinc-300 animate-fadeIn"
             style={{ top: menuPosition.top, left: menuPosition.left }}
             onClick={(e) => e.stopPropagation()} 
          >
               <FilterMenu 
                    column={columns.find(c => String(c.key) === activeFilterCol)!}
                    uniqueValues={uniqueValuesMap.get(activeFilterCol) || []}
                    currentFilter={filters[activeFilterCol]}
                    onApply={(f) => { applyFilter(activeFilterCol, f); setActiveFilterCol(null); setMenuPosition(null); }}
                    onSort={(dir) => handleSort(activeFilterCol, dir)}
                    onClose={() => { setActiveFilterCol(null); setMenuPosition(null); }}
               />
          </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-4 z-20 rounded-b-xl sm:rounded-b-2xl">
        <div className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 text-center sm:text-left">
          Showing <span className="font-bold text-slate-900 dark:text-white">{Math.min(startIndex + 1, totalItems)}</span> to <span className="font-bold text-slate-900 dark:text-white">{endIndex}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> results
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
           <div className="flex items-center gap-2">
             <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Rows:</span>
             <select 
               value={rowsPerPage} 
               onChange={(e) => {
                 setRowsPerPage(Number(e.target.value));
                 setCurrentPage(1);
               }}
               className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-1.5 font-bold outline-none"
             >
               <option value={10}>10</option>
               <option value={25}>25</option>
               <option value={50}>50</option>
               <option value={100}>100</option>
             </select>
           </div>
           
           <div className="flex items-center gap-1">
             <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${currentPage === 1 ? 'text-slate-300 dark:text-zinc-600 cursor-not-allowed' : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'}`}
             >
               <ChevronLeft size={14} /> Prev
             </button>
             
             <span className="text-xs font-bold text-slate-900 dark:text-white px-2">
               {currentPage} / {Math.max(1, totalPages)}
             </span>
             
             <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-slate-300 dark:text-zinc-600 cursor-not-allowed' : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'}`}
             >
               Next <ChevronRight size={14} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// ... FilterMenu and FilterDropdown remain unchanged ...
// (Retaining existing code for those components to ensure file completeness if copied fully, 
//  but focusing changes on DataTable above)
// ...
const FilterMenu: React.FC<{
    column: ColumnDef<any>;
    uniqueValues: any[];
    currentFilter?: FilterState;
    onApply: (filter: FilterState | null) => void;
    onSort: (direction: 'asc' | 'desc') => void;
    onClose: () => void;
}> = ({ column, uniqueValues, currentFilter, onApply, onSort, onClose }) => {
    // ... (same as previous file) ...
    const [mode, setMode] = useState<'values' | 'condition'>(
        currentFilter?.type === 'condition' ? 'condition' : 'values'
    );
    
    const [operator, setOperator] = useState<string>(currentFilter?.operator || 'contains');
    const [conditionVal, setConditionVal] = useState<string>(currentFilter?.value || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [checkedItems, setCheckedItems] = useState<Set<string>>(
        currentFilter?.type === 'value' && currentFilter.selectedValues 
        ? new Set(currentFilter.selectedValues) 
        : new Set(uniqueValues.map(String))
    );

    const stringValues = useMemo(() => uniqueValues.map(String), [uniqueValues]);
    const filteredValues = useMemo(() => stringValues.filter(v => v.toLowerCase().includes(searchTerm.toLowerCase())), [stringValues, searchTerm]);

    const isAllSelected = filteredValues.every(v => checkedItems.has(v));
    const isIndeterminate = !isAllSelected && filteredValues.some(v => checkedItems.has(v));

    const toggleItem = (val: string) => {
        const next = new Set(checkedItems);
        if (next.has(val)) next.delete(val);
        else next.add(val);
        setCheckedItems(next);
    };

    const toggleAll = () => {
        const next = new Set(checkedItems);
        if (isAllSelected) {
            filteredValues.forEach(v => next.delete(v));
        } else {
            filteredValues.forEach(v => next.add(v));
        }
        setCheckedItems(next);
    };

    const handleApply = () => {
        if (mode === 'values') {
            if (checkedItems.size === stringValues.length && checkedItems.size > 0) {
                 onApply(null); 
            } else {
                 onApply({ type: 'value', selectedValues: Array.from(checkedItems) });
            }
        } else {
            if (!conditionVal) {
                onApply(null);
            } else {
                onApply({ type: 'condition', operator: operator as any, value: conditionVal });
            }
        }
    };

    return (
        <div className="flex flex-col max-h-[450px]">
            {/* Header: Sort & Close */}
            <div className="p-3 border-b border-slate-100 dark:border-zinc-700 flex items-center justify-between bg-slate-50 dark:bg-zinc-800">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase">{column.header}</span>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"><X size={14}/></button>
            </div>
            
            <div className="flex p-2 gap-2 border-b border-slate-100 dark:border-zinc-700">
                <button onClick={() => onSort('asc')} className="flex-1 py-1.5 px-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-1 border border-slate-100 dark:border-zinc-700"><SortAsc size={14}/> Asc</button>
                <button onClick={() => onSort('desc')} className="flex-1 py-1.5 px-2 text-xs font-bold text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-1 border border-slate-100 dark:border-zinc-700"><SortDesc size={14}/> Desc</button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-100 dark:border-zinc-700">
                <button 
                    onClick={() => setMode('values')} 
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${mode === 'values' ? 'border-brand-500 text-brand-700 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/20' : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                >
                    Values
                </button>
                <button 
                    onClick={() => setMode('condition')} 
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${mode === 'condition' ? 'border-brand-500 text-brand-700 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/20' : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                >
                    Conditions
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-[250px]">
                {mode === 'values' ? (
                    <>
                        <div className="p-3 border-b border-slate-100 dark:border-zinc-700">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input 
                                    type="text" 
                                    placeholder="Search values..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-600 rounded-lg focus:border-brand-500 outline-none bg-white dark:bg-zinc-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-2 space-y-0.5 flex-1">
                            <label className="flex items-center px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-md cursor-pointer group">
                                <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                                    <input type="checkbox" checked={isAllSelected} ref={input => { if (input) input.indeterminate = isIndeterminate; }} onChange={toggleAll} className="peer appearance-none w-4 h-4 border border-slate-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 checked:bg-brand-500 checked:border-brand-500 transition-colors" />
                                    <Check size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                                    {isIndeterminate && <div className="absolute w-2 h-0.5 bg-brand-500 pointer-events-none" />}
                                </div>
                                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white">(Select All)</span>
                            </label>
                            <div className="h-px bg-slate-100 dark:bg-zinc-700 my-1" />
                            {filteredValues.length > 0 ? (
                                filteredValues.map(val => (
                                    <label key={val} className="flex items-center px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-md cursor-pointer group">
                                        <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                                            <input 
                                                type="checkbox" 
                                                checked={checkedItems.has(val)} 
                                                onChange={() => toggleItem(val)}
                                                className="peer appearance-none w-4 h-4 border border-slate-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 checked:bg-brand-500 checked:border-brand-500 transition-colors" 
                                            />
                                            <Check size={10} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                                        </div>
                                        <span className="text-xs text-slate-600 dark:text-zinc-400 truncate group-hover:text-slate-900 dark:group-hover:text-white select-none">{val || '(Empty)'}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4">No values found</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Operator</label>
                            <select 
                                value={operator} 
                                onChange={(e) => setOperator(e.target.value)} 
                                className="w-full text-xs p-2 border border-slate-200 dark:border-zinc-600 rounded-lg outline-none focus:border-brand-500 bg-white dark:bg-zinc-700 text-slate-900 dark:text-white"
                            >
                                <option value="contains">Contains</option>
                                <option value="equals">Equals</option>
                                <option value="startsWith">Starts with</option>
                                <option value="neq">Does not equal</option>
                                <option disabled>── Numeric ──</option>
                                <option value="gt">Greater than</option>
                                <option value="lt">Less than</option>
                                <option value="gte">Greater than or equal</option>
                                <option value="lte">Less than or equal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 mb-1.5">Value</label>
                            <input 
                                type="text" 
                                value={conditionVal}
                                onChange={(e) => setConditionVal(e.target.value)}
                                placeholder="Enter value..."
                                className="w-full text-xs p-2 border border-slate-200 dark:border-zinc-600 rounded-lg outline-none focus:border-brand-500 bg-white dark:bg-zinc-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-700/50 p-2 rounded-lg border border-slate-100 dark:border-zinc-700">
                            Use numeric operators for price, spend, etc. String operators are case-insensitive.
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Buttons */}
            <div className="p-3 border-t border-slate-100 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 flex gap-2">
                <button 
                    onClick={() => onApply(null)} 
                    className="flex-1 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-600"
                >
                    Clear
                </button>
                <button 
                    onClick={handleApply} 
                    className="flex-1 py-2 text-xs font-bold text-brand-900 dark:text-brand-950 bg-brand-400 border border-brand-500 rounded-lg hover:bg-brand-300 shadow-sm"
                >
                    Apply Filter
                </button>
            </div>
        </div>
    );
};

export const FilterDropdown: React.FC<{ label: string; options: { label: string; value: string }[]; selectedValues: string[]; onChange: (values: string[]) => void }> = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="relative inline-block text-left mr-0 sm:mr-3 mb-3 w-full sm:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between w-full px-5 py-2.5 text-sm font-bold border rounded-xl shadow-sm focus:outline-none transition-all ${
          selectedValues.length > 0 
            ? 'bg-brand-50 dark:bg-zinc-900/50 text-brand-900 dark:text-brand-300 border-brand-300 dark:border-brand-700' 
            : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
        }`}
      >
        <span>{label} {selectedValues.length > 0 && `(${selectedValues.length})`}</span>
        <ChevronDown className={`w-4 h-4 ml-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 w-full sm:w-64 mt-2 origin-top-right bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-zinc-700 ring-1 ring-black ring-opacity-5 focus:outline-none max-h-72 overflow-y-auto custom-scrollbar">
          <div className="p-3 space-y-1">
            {options.map((option) => (
              <div
                key={option.value}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${selectedValues.includes(option.value) ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-900 dark:text-brand-300' : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                onClick={() => handleToggle(option.value)}
              >
                <div className={`w-5 h-5 mr-3 rounded-lg border flex items-center justify-center transition-all ${selectedValues.includes(option.value) ? 'bg-brand-500 border-brand-500 shadow-inner' : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-700'}`}>
                  {selectedValues.includes(option.value) && <div className="w-2 h-2 bg-black dark:bg-white rounded-sm" />}
                </div>
                <span className="truncate flex-1">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
