
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Download, ChevronDown, Search, X, TrendingUp, TrendingDown, 
  ArrowUp, ArrowDown, Eye, Settings, SlidersHorizontal, Info, 
  Maximize2, Minimize2, ChevronLeft, ChevronRight, Filter, Trash2,
  ListFilter, Check, MoreVertical, ArrowUpDown, SortAsc, SortDesc,
  CheckSquare, Square, MinusSquare
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
          ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-1 ring-primary' 
          : 'bg-card border-border hover:border-primary/50 hover:shadow-md'
        }`}
    >
      <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
        <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-tight ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
          {title}
        </span>
        <Info size={14} className={`${isSelected ? 'text-primary' : 'text-muted-foreground/50'} cursor-help opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block`} />
      </div>
      
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`text-xl sm:text-[26px] font-heading font-bold tracking-tight text-foreground`}>
          {value || '—'}
        </span>
        {typeLabel && value !== '—' && (
          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
            {typeLabel}
          </span>
        )}
      </div>
      
      {subValue && (
        <div className={`mt-2 text-[10px] sm:text-[11px] font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
          {subValue}
        </div>
      )}
      
      {/* Visual selection indicator */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-b-xl"></div>
      )}
      
      {alert && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export const SectionHeader: React.FC<{ title: string; description: string; rightElement?: React.ReactNode }> = ({ title, description, rightElement }) => (
  <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">{title}</h2>
      <p className="mt-1 text-sm sm:text-base text-muted-foreground max-w-2xl">{description}</p>
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
}

interface FilterState {
  type: 'value' | 'condition';
  selectedValues?: string[]; // stored as strings
  operator?: 'contains' | 'equals' | 'startsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'neq';
  value?: string;
}

// Helper to safely render cell content to prevent React crashes with objects
const safeRender = (val: any): React.ReactNode => {
    if (val === null || val === undefined) return <span className="text-slate-300">-</span>;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') {
        if (val instanceof Date) return val.toLocaleDateString();
        // Fallback for objects/arrays to avoid crash
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
    fileName = 'Lynx_Export'
}: DataTableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    initialSortKey ? { key: initialSortKey, direction: 'desc' } : null
  );
  
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isAutoFit, setIsAutoFit] = useState(false);
  
  // Advanced Filtering State
  const [filters, setFilters] = useState<Record<string, FilterState>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const colMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, filters]); 

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

  // Compute unique values for each column (Memoized)
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
       // Toggle
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

  // 1. Filter Data
  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return data;

    return data.filter(row => {
        return Object.entries(filters).every(([key, filterState]) => {
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

  // 2. Sort Data
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

  // Handle Export
  const handleExport = () => {
      // Create a clean export object with only visible columns
      const visibleCols = columns.filter(c => !hiddenColumns.has(String(c.key)));
      const exportData = sortedData.map(row => {
          const cleanRow: Record<string, any> = {};
          visibleCols.forEach(col => {
             // For export, we prefer raw values or stringified versions, not React nodes
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

  // 3. Paginate Data
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const visibleColumns = columns.filter(col => !hiddenColumns.has(String(col.key)));

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm flex flex-col relative min-h-[400px]">
      
      {/* Top Controls Bar */}
      <div className={`px-4 py-3 sm:px-6 sm:py-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card gap-3 rounded-t-xl sm:rounded-t-2xl z-20`}>
        <div className="flex items-center gap-4">
             <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
                Table Controls
             </div>
             {Object.keys(filters).length > 0 && (
                <button 
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive rounded-lg text-xs font-bold hover:bg-destructive/20 transition-colors"
                >
                    <Trash2 size={12} /> Clear Filters ({Object.keys(filters).length})
                </button>
             )}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {enableExport && (
              <button 
                 onClick={handleExport}
                 className="flex items-center px-3 py-2 text-xs font-bold text-muted-foreground bg-muted border border-border rounded-xl hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                 title="Export current view to Excel"
              >
                  <Download size={14} className="mr-2" />
                  <span className="hidden sm:inline">Export</span>
              </button>
          )}

          <button 
              onClick={() => setIsAutoFit(!isAutoFit)}
              className="flex items-center px-3 py-2 text-xs font-bold text-muted-foreground bg-muted border border-border rounded-xl hover:bg-muted hover:text-foreground transition-colors"
          >
              {isAutoFit ? <Maximize2 size={14} className="mr-2" /> : <Minimize2 size={14} className="mr-2" />}
              <span className="hidden sm:inline">{isAutoFit ? 'Stretch' : 'Auto Fit'}</span>
              <span className="sm:hidden">{isAutoFit ? 'Full' : 'Fit'}</span>
          </button>

          <div className="relative" ref={colMenuRef}>
            <button 
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="flex items-center px-3 py-2 text-xs font-bold text-muted-foreground bg-muted border border-border rounded-xl hover:bg-muted hover:text-foreground transition-colors"
            >
              <SlidersHorizontal size={14} className="mr-2" />
              Columns
            </button>
            
            {isColumnMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-popover rounded-2xl shadow-2xl border border-border z-50 p-3 animate-fadeIn">
                <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase mb-2 tracking-widest border-b border-border">Filter Columns</div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 mt-2">
                  {columns.map(col => (
                    <label key={String(col.key)} className="flex items-center px-2 py-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={!hiddenColumns.has(String(col.key))}
                        onChange={() => toggleColumn(String(col.key))}
                        className="w-4 h-4 text-primary rounded-md border-border focus:ring-primary bg-background"
                      />
                      <span className="ml-3 text-sm font-medium text-foreground">{col.header}</span>
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
        <table className={`${isAutoFit ? 'w-auto' : 'min-w-full'} divide-y divide-border border-separate border-spacing-0`}>
          <thead className="bg-muted z-10 sticky top-0">
            <tr className="divide-x divide-border">
              {visibleColumns.map((col, i) => {
                 const colKey = String(col.key);
                 const isFiltered = !!filters[colKey];
                 const isSorted = sortConfig?.key === colKey;
                 const isActive = activeFilterCol === colKey;
                 
                 return (
                  <th 
                    key={colKey} 
                    className={`px-3 py-3 text-left text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-heading border-b border-border bg-muted z-20 group`}
                    style={{ textAlign: col.align || 'left', minWidth: '150px' }}
                  >
                    <div className={`flex items-center justify-between w-full`}>
                      <div 
                         className={`flex items-center gap-2 cursor-pointer hover:text-primary truncate flex-1 select-none`} 
                         onClick={() => col.sortable !== false && handleSort(colKey)}
                      >
                        <span className={`truncate ${isSorted ? 'text-primary' : ''}`}>{col.header}</span>
                        {isSorted && (
                          <span className="text-primary">
                            {sortConfig.direction === 'asc' ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
                          </span>
                        )}
                      </div>
                      
                      {col.filterable !== false && (
                         <button 
                            data-filter-trigger="true"
                            onClick={(e) => handleFilterClick(e, colKey)}
                            className={`p-1.5 rounded-md transition-colors ml-2 flex-shrink-0 ${isFiltered || isActive ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
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
          <tbody className="divide-y divide-border bg-card z-0 relative">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, i) => (
                <tr key={i} className="hover:bg-primary/5 transition-colors group divide-x divide-border bg-card">
                  {visibleColumns.map((col, j) => (
                    <td key={j} className={`px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-foreground font-medium`} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row) : safeRender(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-16 text-center text-muted-foreground bg-card">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-12 h-12 mb-4 text-muted-foreground/30" />
                    <p className="font-heading font-medium text-lg text-foreground">No matching records</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters or upload a different file.</p>
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
             className="fixed w-72 bg-popover rounded-2xl shadow-2xl border border-border z-[9999] overflow-hidden text-foreground animate-fadeIn"
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

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-t border-border bg-card gap-4 z-20 rounded-b-xl sm:rounded-b-2xl">
        <div className="text-[10px] sm:text-xs font-medium text-muted-foreground text-center sm:text-left">
          Showing <span className="font-bold text-foreground">{Math.min(startIndex + 1, totalItems)}</span> to <span className="font-bold text-foreground">{endIndex}</span> of <span className="font-bold text-foreground">{totalItems}</span> results
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
           <div className="flex items-center gap-2">
             <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide">Rows:</span>
             <select 
               value={rowsPerPage} 
               onChange={(e) => {
                 setRowsPerPage(Number(e.target.value));
                 setCurrentPage(1);
               }}
               className="bg-muted border border-border text-foreground text-xs rounded-lg focus:ring-primary focus:border-primary block p-1.5 font-bold outline-none"
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${currentPage === 1 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
             >
               <ChevronLeft size={14} /> Prev
             </button>
             
             <span className="text-xs font-bold text-foreground px-2">
               {currentPage} / {Math.max(1, totalPages)}
             </span>
             
             <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${currentPage === totalPages || totalPages === 0 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
             >
               Next <ChevronRight size={14} />
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// Internal Component for the Filter Dropdown Menu
const FilterMenu: React.FC<{
    column: ColumnDef<any>;
    uniqueValues: any[];
    currentFilter?: FilterState;
    onApply: (filter: FilterState | null) => void;
    onSort: (direction: 'asc' | 'desc') => void;
    onClose: () => void;
}> = ({ column, uniqueValues, currentFilter, onApply, onSort, onClose }) => {
    const [mode, setMode] = useState<'values' | 'condition'>(
        currentFilter?.type === 'condition' ? 'condition' : 'values'
    );
    
    // Condition State
    const [operator, setOperator] = useState<string>(currentFilter?.operator || 'contains');
    const [conditionVal, setConditionVal] = useState<string>(currentFilter?.value || '');

    // Values State
    const [searchTerm, setSearchTerm] = useState('');
    // Ensure checkedItems are strings
    const [checkedItems, setCheckedItems] = useState<Set<string>>(
        currentFilter?.type === 'value' && currentFilter.selectedValues 
        ? new Set(currentFilter.selectedValues) 
        : new Set(uniqueValues.map(String)) // Default all checked
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
            // If all are checked, it means no filter effectively, but we can store explicitly or null
            if (checkedItems.size === stringValues.length && checkedItems.size > 0) {
                 onApply(null); // Clear filter if all selected
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
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted">
                <span className="text-xs font-bold text-muted-foreground uppercase">{column.header}</span>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14}/></button>
            </div>
            
            <div className="flex p-2 gap-2 border-b border-border">
                <button onClick={() => onSort('asc')} className="flex-1 py-1.5 px-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg flex items-center justify-center gap-1 border border-border"><SortAsc size={14}/> Asc</button>
                <button onClick={() => onSort('desc')} className="flex-1 py-1.5 px-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg flex items-center justify-center gap-1 border border-border"><SortDesc size={14}/> Desc</button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-border">
                <button 
                    onClick={() => setMode('values')} 
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${mode === 'values' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Values
                </button>
                <button 
                    onClick={() => setMode('condition')} 
                    className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${mode === 'condition' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    Conditions
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-[250px]">
                {mode === 'values' ? (
                    <>
                        <div className="p-3 border-b border-border">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                                <input 
                                    type="text" 
                                    placeholder="Search values..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg focus:border-primary outline-none bg-background text-foreground"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-2 space-y-0.5 flex-1">
                            <label className="flex items-center px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer group">
                                <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                                    <input type="checkbox" checked={isAllSelected} ref={input => { if (input) input.indeterminate = isIndeterminate; }} onChange={toggleAll} className="peer appearance-none w-4 h-4 border border-border rounded bg-background checked:bg-primary checked:border-primary transition-colors" />
                                    <Check size={10} className="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                                    {isIndeterminate && <div className="absolute w-2 h-0.5 bg-primary pointer-events-none" />}
                                </div>
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">(Select All)</span>
                            </label>
                            <div className="h-px bg-border my-1" />
                            {filteredValues.length > 0 ? (
                                filteredValues.map(val => (
                                    <label key={val} className="flex items-center px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer group">
                                        <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                                            <input 
                                                type="checkbox" 
                                                checked={checkedItems.has(val)} 
                                                onChange={() => toggleItem(val)}
                                                className="peer appearance-none w-4 h-4 border border-border rounded bg-background checked:bg-primary checked:border-primary transition-colors" 
                                            />
                                            <Check size={10} className="absolute text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate group-hover:text-foreground select-none">{val || '(Empty)'}</span>
                                    </label>
                                ))
                            ) : (
                                <div className="text-xs text-muted-foreground text-center py-4">No values found</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Operator</label>
                            <select 
                                value={operator} 
                                onChange={(e) => setOperator(e.target.value)} 
                                className="w-full text-xs p-2 border border-border rounded-lg outline-none focus:border-primary bg-background text-foreground"
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
                            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Value</label>
                            <input 
                                type="text" 
                                value={conditionVal}
                                onChange={(e) => setConditionVal(e.target.value)}
                                placeholder="Enter value..."
                                className="w-full text-xs p-2 border border-border rounded-lg outline-none focus:border-primary bg-background text-foreground"
                            />
                        </div>
                        <div className="text-[10px] text-muted-foreground bg-muted p-2 rounded-lg border border-border">
                            Use numeric operators for price, spend, etc. String operators are case-insensitive.
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Buttons */}
            <div className="p-3 border-t border-border bg-muted flex gap-2">
                <button 
                    onClick={() => onApply(null)} 
                    className="flex-1 py-2 text-xs font-bold text-muted-foreground bg-background border border-border rounded-lg hover:bg-muted"
                >
                    Clear
                </button>
                <button 
                    onClick={handleApply} 
                    className="flex-1 py-2 text-xs font-bold text-primary-foreground bg-primary border border-primary rounded-lg hover:bg-primary/90 shadow-sm"
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
          selectedValues.length > 0 ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card text-foreground border-border hover:border-primary/50'
        }`}
      >
        <span>{label} {selectedValues.length > 0 && `(${selectedValues.length})`}</span>
        <ChevronDown className={`w-4 h-4 ml-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 w-full sm:w-64 mt-2 origin-top-right bg-popover rounded-2xl shadow-2xl border border-border ring-1 ring-background/5 focus:outline-none max-h-72 overflow-y-auto custom-scrollbar">
          <div className="p-3 space-y-1">
            {options.map((option) => (
              <div
                key={option.value}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${selectedValues.includes(option.value) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`}
                onClick={() => handleToggle(option.value)}
              >
                <div className={`w-5 h-5 mr-3 rounded-lg border flex items-center justify-center transition-all ${selectedValues.includes(option.value) ? 'bg-primary border-primary shadow-inner' : 'border-border bg-background'}`}>
                  {selectedValues.includes(option.value) && <div className="w-2 h-2 bg-primary-foreground rounded-sm" />}
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
