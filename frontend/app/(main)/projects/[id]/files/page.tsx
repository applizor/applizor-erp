
'use client';

import { FileText, Folder, UploadCloud, Download, Trash2, Search } from 'lucide-react';

export default function ProjectFiles() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Digital Ledger</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Assets & Contracts</p>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                    <UploadCloud size={14} /> Upload Asset
                </button>
            </div>

            {/* Folder Structure Visualization */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Contracts', 'Design Assets', 'Specifications', 'Invoices'].map(folder => (
                    <div key={folder} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group">
                        <Folder className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-bold text-gray-900">{folder}</h4>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Empty</p>
                    </div>
                ))}
            </div>

            <div className="ent-card min-h-[300px] flex items-center justify-center">
                <div className="text-center">
                    <Search className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Repository Indexed. No files found.</p>
                </div>
            </div>
        </div>
    )
}
