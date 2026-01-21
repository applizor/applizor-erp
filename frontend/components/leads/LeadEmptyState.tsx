import React from 'react';
import Link from 'next/link';
import { Users, Plus, Upload, Activity } from 'lucide-react';

export function LeadEmptyState() {
    return (
        <div className="ent-card p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 bg-gray-50/50">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100">
                <Activity className="w-8 h-8 text-primary-200" />
            </div>

            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">
                Registry Empty
            </h3>

            <p className="text-[11px] text-gray-500 font-medium max-w-sm mx-auto mb-8 leading-relaxed uppercase tracking-wide">
                The opportunity pipeline currently holds zero intelligence records. Initialize acquisition protocols to begin tracking.
            </p>

            <div className="flex items-center gap-3">
                <Link
                    href="/leads/create"
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-primary-900/10 active:scale-95"
                >
                    <Plus size={14} />
                    Acquire Intelligence
                </Link>
                <button
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all border border-gray-200 shadow-sm active:scale-95"
                >
                    <Upload size={14} />
                    Import Batch
                </button>
            </div>
        </div>
    );
}
