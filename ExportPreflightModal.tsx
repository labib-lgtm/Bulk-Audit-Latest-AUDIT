
import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, FileDown, AlertCircle, X, RotateCcw, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportPreflightModalProps {
    isOpen: boolean;
    onClose: () => void;
    filename: string;
    data: any[]; // The rows intended for the Bulk Upload
    rollbackData?: any[]; // The rows to revert changes (original state)
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    criticalCount: number;
}

const validateRows = (rows: any[]): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let criticalCount = 0;

    if (!rows || rows.length === 0) {
        return { isValid: false, errors: ["No data to export."], warnings: [], criticalCount: 1 };
    }

    rows.forEach((row, idx) => {
        const rowNum = idx + 2; // Header is 1
        
        // Critical: Missing Campaign ID
        if (!row['Campaign Id'] && !row['Campaign ID']) {
            errors.push(`Row ${rowNum}: Missing Campaign Id`);
            criticalCount++;
        }

        // Contextual Checks
        const entity = row['Entity'];
        if ((entity === 'Keyword' || entity === 'Product Targeting') && (!row['Ad Group Id'] && !row['Ad Group ID'])) {
            errors.push(`Row ${rowNum}: Missing Ad Group Id for ${entity}`);
            criticalCount++;
        }

        // Value Checks
        if (row['Bid'] !== undefined) {
            const bid = parseFloat(row['Bid']);
            if (isNaN(bid) || bid <= 0) {
                errors.push(`Row ${rowNum}: Invalid Bid value (${row['Bid']})`);
                criticalCount++;
            } else if (bid > 50) {
                warnings.push(`Row ${rowNum}: unusually high Bid ($${bid})`);
            }
        }

        if (row['State']) {
            const state = row['State'].toLowerCase();
            if (!['enabled', 'paused', 'archived'].includes(state)) {
                errors.push(`Row ${rowNum}: Invalid State '${row['State']}'`);
                criticalCount++;
            }
        }
        
        if (row['Operation'] && row['Operation'] !== 'Update' && row['Operation'] !== 'Create' && row['Operation'] !== 'Archive') {
             errors.push(`Row ${rowNum}: Invalid Operation '${row['Operation']}'`);
             criticalCount++;
        }
    });

    return {
        isValid: criticalCount === 0,
        errors: errors.slice(0, 50), // Limit display
        warnings: warnings.slice(0, 50),
        criticalCount
    };
};

export const ExportPreflightModal: React.FC<ExportPreflightModalProps> = ({ isOpen, onClose, filename, data, rollbackData }) => {
    const [acknowledged, setAcknowledged] = useState(false);

    const validation = useMemo(() => validateRows(data), [data]);

    if (!isOpen) return null;

    const downloadFile = (rows: any[], suffix: string = '') => {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bulk_Data");
        XLSX.writeFile(wb, `${filename}${suffix}.xlsx`);
    };

    const handleDownloadPrimary = () => {
        downloadFile(data);
        if (!rollbackData) onClose();
    };

    const handleDownloadRollback = () => {
        if (rollbackData) {
            downloadFile(rollbackData, '_ROLLBACK');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-900/50 rounded-t-2xl">
                    <div>
                        <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-brand-500" />
                            Export Preflight Check
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Validating {data.length} rows for Bulk Operations...</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Status Banner */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${validation.isValid ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
                        {validation.isValid ? (
                            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                        )}
                        <div>
                            <h4 className={`font-bold text-lg ${validation.isValid ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>
                                {validation.isValid ? 'Validation Passed' : `${validation.criticalCount} Critical Errors Found`}
                            </h4>
                            <p className={`text-sm mt-1 ${validation.isValid ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'}`}>
                                {validation.isValid 
                                    ? "Your file structure looks good. No critical issues detected."
                                    : "Please review the errors below. Uploading this file may result in failures."}
                            </p>
                        </div>
                    </div>

                    {/* Error Log */}
                    {!validation.isValid && (
                        <div className="bg-slate-50 dark:bg-zinc-800 rounded-xl p-4 border border-slate-200 dark:border-zinc-700 max-h-48 overflow-y-auto custom-scrollbar">
                            <h5 className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-400 mb-2 sticky top-0 bg-slate-50 dark:bg-zinc-800 pb-2">Error Log</h5>
                            <ul className="space-y-1">
                                {validation.errors.map((err, i) => (
                                    <li key={i} className="text-xs text-rose-600 dark:text-rose-400 font-mono flex items-start gap-2">
                                        <span>•</span> {err}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Warnings */}
                    {validation.warnings.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50 max-h-48 overflow-y-auto custom-scrollbar">
                            <h5 className="text-xs font-bold uppercase text-amber-700 dark:text-amber-500 mb-2 sticky top-0 bg-amber-50 dark:bg-amber-900/10 pb-2">Warnings</h5>
                            <ul className="space-y-1">
                                {validation.warnings.map((warn, i) => (
                                    <li key={i} className="text-xs text-amber-700 dark:text-amber-400 font-mono flex items-start gap-2">
                                        <span>•</span> {warn}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Rollback Info */}
                    {rollbackData && rollbackData.length > 0 && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl flex justify-between items-center">
                            <div>
                                <h5 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                                    <RotateCcw size={16} /> Rollback File Available
                                </h5>
                                <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                                    Contains original values for {rollbackData.length} rows. Download this to safely revert changes if needed.
                                </p>
                            </div>
                            <button 
                                onClick={handleDownloadRollback}
                                className="px-4 py-2 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
                            >
                                Download Rollback
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 rounded-b-2xl flex justify-between items-center">
                    {!validation.isValid && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={acknowledged} 
                                onChange={e => setAcknowledged(e.target.checked)}
                                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                            />
                            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 select-none">
                                Ignore errors and force export
                            </span>
                        </label>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleDownloadPrimary}
                            disabled={!validation.isValid && !acknowledged}
                            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all ${
                                !validation.isValid && !acknowledged 
                                ? 'bg-slate-300 dark:bg-zinc-700 cursor-not-allowed text-slate-500 dark:text-zinc-500' 
                                : 'bg-brand-500 hover:bg-brand-600 text-black shadow-brand-500/20'
                            }`}
                        >
                            <FileDown size={18} />
                            Download Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
