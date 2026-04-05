
import { DashboardData, BusinessReportRow, InventoryRow, HourlyPerformanceRow, AppSettings, ProductGoal, ProductCost, ProfitSettings, UserRole } from '../types';

const DB_NAME = 'LynxMediaDB';
const STORE_NAME = 'appState';
const DB_VERSION = 2; // Incremented version for schema change if needed (IndexedDB handles this gracefully usually for simple key-val)

interface AppState {
  bulkData: DashboardData | null;
  previousBulkData: DashboardData | null;
  businessReport: BusinessReportRow[] | null;
  inventoryReport: InventoryRow[] | null;
  hourlyReport: HourlyPerformanceRow[] | null;
  settings: AppSettings;
  productGoals: Record<string, ProductGoal>;
  productCosts: Record<string, ProductCost>; // New
  profitSettings: ProfitSettings; // New
  userRole: UserRole; // New
  timestamp: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveState = async (state: Partial<AppState>): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    if (state.bulkData !== undefined) store.put(state.bulkData, 'bulkData');
    if (state.previousBulkData !== undefined) store.put(state.previousBulkData, 'previousBulkData');
    if (state.businessReport !== undefined) store.put(state.businessReport, 'businessReport');
    if (state.inventoryReport !== undefined) store.put(state.inventoryReport, 'inventoryReport');
    if (state.hourlyReport !== undefined) store.put(state.hourlyReport, 'hourlyReport');
    if (state.settings !== undefined) store.put(state.settings, 'settings');
    if (state.productGoals !== undefined) store.put(state.productGoals, 'productGoals');
    if (state.productCosts !== undefined) store.put(state.productCosts, 'productCosts');
    if (state.profitSettings !== undefined) store.put(state.profitSettings, 'profitSettings');
    if (state.userRole !== undefined) store.put(state.userRole, 'userRole');
    
    store.put(Date.now(), 'timestamp');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    if (import.meta.env.DEV) console.error("Failed to save state to DB", e);
  }
};

export const loadState = async (): Promise<Partial<AppState>> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const keys = ['bulkData', 'previousBulkData', 'businessReport', 'inventoryReport', 'hourlyReport', 'settings', 'productGoals', 'productCosts', 'profitSettings', 'userRole', 'timestamp'];
    const results: any = {};

    await Promise.all(keys.map(key => new Promise<void>((resolve) => {
       const req = store.get(key);
       req.onsuccess = () => {
         if (req.result) results[key] = req.result;
         resolve();
       };
       req.onerror = () => resolve();
    })));

    return results;
  } catch (e) {
    if (import.meta.env.DEV) console.error("Failed to load state from DB", e);
    return {};
  }
};

export const clearState = async (): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
};

export const exportWorkspace = async (): Promise<void> => {
    const state = await loadState();
    if (!state || Object.keys(state).length === 0) {
        alert("No data to export.");
        return;
    }
    
    const jsonString = JSON.stringify(state);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lynx_Workspace_${new Date().toISOString().split('T')[0]}.lynx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importWorkspace = async (file: File): Promise<Partial<AppState>> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const json = JSON.parse(content);
                // Clear existing state before importing to ensure clean slate
                await clearState();
                await saveState(json);
                resolve(json);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};
