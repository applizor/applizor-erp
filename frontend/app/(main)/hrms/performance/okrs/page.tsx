'use client';

import { useEffect, useState } from 'react';
import { Target, Plus, TrendingUp, Calendar, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { performanceApi, OKR } from '@/lib/api/performance';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';

export default function OKRsPage() {
    const [okrs, setOkrs] = useState<OKR[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadOKRs();
    }, []);

    const loadOKRs = async () => {
        try {
            setLoading(false);
            const data = await performanceApi.getOKRs();
            setOkrs(data);
        } catch (error) {
            console.error('Failed to load OKRs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg shadow-primary-900/10">
                        <Target size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">Strategic Objectives (OKRs)</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Outcome-Driven Performance Tracking</p>
                    </div>
                </div>

                <button className="btn-primary py-2 px-4 text-[10px] font-black uppercase tracking-widest">
                    <Plus size={14} className="mr-2" /> Define Objective
                </button>
            </div>

            {/* OKR Cards Grid */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <CardSkeleton />
                ) : okrs.length === 0 ? (
                    <div className="bg-white p-12 rounded-md border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <Target size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase">No active objectives discovered</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Initialize the first protocol to begin tracking.</p>
                    </div>
                ) : okrs.map((okr) => (
                    <div key={okr.id} className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden group hover:border-primary-300 transition-all duration-300">
                        <div className="p-6 flex flex-col lg:flex-row gap-6">
                            {/* Primary Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${okr.status === 'active' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {okr.status}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <Calendar size={12} />
                                        {new Date(okr.startDate).toLocaleDateString()} - {new Date(okr.endDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-tight mb-2 group-hover:text-primary-600 transition-colors">
                                    {okr.title}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">
                                    {okr.description}
                                </p>
                            </div>

                            {/* Progress Indicator */}
                            <div className="lg:w-64 flex flex-col justify-center items-center lg:items-end gap-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-6">
                                <div className="flex items-center gap-3 w-full lg:w-48">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${okr.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-gray-900">{okr.progress}%</span>
                                </div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aggregate Achievement</div>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                                    <TrendingUp size={12} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Steady Progress</span>
                                </div>
                            </div>
                        </div>

                        {/* Key Results Breakdown */}
                        <div className="bg-slate-50 border-t border-gray-100 p-4">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Measurement Protcols (Key Results)</h4>
                                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{okr.keyResults.length} Dimensions</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {okr.keyResults.map((kr) => (
                                    <div key={kr.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-bold text-gray-900 leading-tight uppercase line-clamp-2 pr-4">{kr.title}</span>
                                            {kr.currentValue >= kr.targetValue ? (
                                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                            ) : (
                                                <AlertCircle size={14} className="text-blue-500 shrink-0" />
                                            )}
                                        </div>
                                        <div className="mt-auto">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                                <span className="text-[10px] font-black text-gray-900">{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-600"
                                                    style={{ width: `${(kr.currentValue / kr.targetValue) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
