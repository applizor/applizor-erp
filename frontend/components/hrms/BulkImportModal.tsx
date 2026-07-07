'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { getBaseUrl } from '@/lib/utils/url';
import { Download, Upload, AlertCircle, CheckCircle, FileSpreadsheet, RefreshCw, XCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const toast = useToast();
  const [importType, setImportType] = useState('employees');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Results State
  const [result, setResult] = useState<{
    successCount: number;
    failureCount: number;
    failures: Array<{ row: number; error: string; details?: any }>;
  } | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.type === "text/csv") {
        setFile(droppedFile);
        setResult(null);
      } else {
        toast.error("Please drop a valid CSV file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    const baseUrl = getBaseUrl();
    const token = localStorage.getItem('token');
    
    // Direct link to stream template download
    const url = `${baseUrl}/api/bulk-import/template/${importType}?token=${token}`;
    window.open(url, '_blank');
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select or drop a CSV file to upload.');
      return;
    }

    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/bulk-import/${importType}`, formData);
      const data = response.data;
      
      setResult({
        successCount: data.successCount ?? 0,
        failureCount: data.failureCount ?? 0,
        failures: data.failures || [],
      });

      if ((data.failureCount ?? 0) === 0) {
        toast.success(`Successfully processed CSV. Imported ${data.successCount} records.`);
      } else if ((data.successCount ?? 0) > 0) {
        toast.warning(`Partial success. Imported ${data.successCount} records, but failed ${data.failureCount} rows.`);
      } else {
        toast.error(`CSV upload failed validation constraints on all ${data.failureCount} rows.`);
      }

      if (onSuccess && (data.successCount ?? 0) > 0) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Import upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to process bulk import CSV');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Data Registry Upload"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Grid Setup */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="ent-form-group md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Target Entity Protocol
            </label>
            <CustomSelect
              options={[
                { label: 'Employee Registry (Bio & Profile Schema)', value: 'employees' },
                { label: 'Daily Attendance Ledger (Check-In/Out Entries)', value: 'attendance' },
                { label: 'Shift Roster Allocations (Weekly Schedules)', value: 'shift-roster' },
              ]}
              value={importType}
              onChange={(val) => {
                setImportType(val);
                resetModal();
              }}
              className="w-full"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={downloadTemplate}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 border border-dashed border-gray-200 hover:border-primary-300 rounded-md text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 bg-primary-50/10 transition-all hover:bg-primary-50/20"
            >
              <Download size={14} />
              Template
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        {!result && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-md p-10 transition-all ${
              dragActive ? 'border-primary-500 bg-primary-50/20' : 'border-gray-200 bg-gray-50/30'
            }`}
          >
            {file ? (
              <div className="text-center space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-primary-600 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-none truncate max-w-[280px]">
                    {file.name}
                  </p>
                  <p className="text-[9px] text-gray-500 mt-1 font-medium">
                    Size: {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-[9px] text-gray-500 mt-1 font-medium">
                    Only CSV (.csv) file formats are parsed by import engine
                  </p>
                </div>
                <label className="inline-block mt-4">
                  <span className="cursor-pointer px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-[10px] font-black uppercase tracking-widest text-gray-700 shadow-sm transition-all">
                    Browse File
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Results Reporting Panel */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-md p-4 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-2xl font-black text-emerald-800 leading-none">
                    {result.successCount}
                  </p>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                    Processed & Committed
                  </p>
                </div>
              </div>

              <div className={`rounded-md p-4 flex items-center gap-3 border ${
                result.failureCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}>
                {result.failureCount > 0 ? (
                  <AlertCircle className="w-8 h-8 text-rose-500 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-gray-400 shrink-0" />
                )}
                <div>
                  <p className={`text-2xl font-black leading-none ${
                    result.failureCount > 0 ? 'text-rose-800' : 'text-gray-600'
                  }`}>
                    {result.failureCount}
                  </p>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                    result.failureCount > 0 ? 'text-rose-600' : 'text-gray-400'
                  }`}>
                    Validation Failures
                  </p>
                </div>
              </div>
            </div>

            {/* Error logs scroll area */}
            {result.failureCount > 0 && (
              <div className="border border-rose-100 bg-rose-50/20 rounded-md overflow-hidden">
                <div className="px-4 py-2 border-b border-rose-100 bg-rose-50/50">
                  <h4 className="text-[9px] font-black text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    Detailed Error Logs
                  </h4>
                </div>
                <div className="max-h-[220px] overflow-y-auto divide-y divide-rose-100/50 p-2 font-mono text-[10px] text-rose-700">
                  {result.failures.map((f, idx) => (
                    <div key={idx} className="py-1.5 px-2 hover:bg-rose-50/30 transition-colors flex items-start gap-3">
                      <span className="font-bold text-rose-900 uppercase shrink-0">Row {f.row}:</span>
                      <span className="flex-1 font-medium">{f.error}</span>
                      {f.details && (
                        <span className="text-[9px] text-rose-400 italic">
                          ({JSON.stringify(f.details)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          {result ? (
            <button
              type="button"
              onClick={resetModal}
              className="px-6 py-2 rounded border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              Upload Another
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-all"
          >
            {result ? 'Done' : 'Cancel'}
          </button>

          {!result && (
            <button
              type="button"
              disabled={loading || !file}
              onClick={handleUpload}
              className="px-8 py-2 rounded bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Processing CSV...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Initiate Upload
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
