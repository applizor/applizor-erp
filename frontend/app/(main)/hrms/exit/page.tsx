'use client';

import { useState } from 'react';
import { LogOut, FileText, Package, CheckCircle2, AlertCircle, Calendar, Download, DollarSign, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function ExitManagementPage() {
    const toast = useToast();
    const [step, setStep] = useState(1);

    // Mock Data for FnF Preview
    const fnfData = {
        employeeName: "Aditya Sharma",
        lastWorkingDay: "2026-03-31",
        earnings: [
            { label: "Basic Salary (Pro-rata)", amount: 45000 },
            { label: "HRA", amount: 18000 },
            { label: "Notice Pay Recovery Refund", amount: 0 },
            { label: "Leave Encashment (12 Days)", amount: 12500 },
        ],
        deductions: [
            { label: "Professional Tax", amount: 200 },
            { label: "Unreturned Asset Penalty (Laptop Charger)", amount: 2500 },
            { label: "Income Tax (TDS)", amount: 4800 },
        ]
    };

    const totalEarnings = fnfData.earnings.reduce((sum, item) => sum + item.amount, 0);
    const totalDeductions = fnfData.deductions.reduce((sum, item) => sum + item.amount, 0);
    const netPayable = totalEarnings - totalDeductions;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-rose-900 rounded-md shadow-lg shadow-rose-900/10">
                        <LogOut size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">Exit Hub (Offboarding)</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">End-of-Cycle Protocol & FnF Settlement</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="ent-button-secondary py-2 px-4 text-[10px] font-black uppercase tracking-widest border-rose-200 text-rose-700 hover:bg-rose-50">
                        Initiate Resignation
                    </button>
                    <button className="btn-primary py-2 px-4 text-[10px] font-black uppercase tracking-widest bg-rose-900 hover:bg-rose-950 shadow-rose-900/10">
                        Terminate Session
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Protocol Progress */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Offboarding Lifecycle</h3>

                        <div className="space-y-8 relative">
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 -z-0" />

                            {[
                                { title: "Resignation Registered", status: "completed", date: "Feb 10, 2026", icon: CheckCircle2 },
                                { title: "Notice Period Protocol", status: "active", date: "Mar 31 Target", icon: Calendar },
                                { title: "Asset Recovery & Clearance", status: "pending", date: "In Progress", icon: Package },
                                { title: "Final Settlement (FnF)", status: "pending", date: "Awaiting Clearance", icon: DollarSign },
                            ].map((s, i) => (
                                <div key={i} className="flex gap-4 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors i ${s.status === 'completed' ? 'border-emerald-500 text-emerald-500' :
                                        s.status === 'active' ? 'border-primary-600 text-primary-600 animate-pulse' :
                                            'border-slate-200 text-slate-300'
                                        }`}>
                                        <s.icon size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{s.title}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 p-5 rounded-md border border-amber-100 border-l-4 border-l-amber-500">
                        <div className="flex gap-3">
                            <AlertCircle size={18} className="text-amber-600 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight leading-tight">Pending Assets Detected</p>
                                <p className="text-[9px] font-bold text-amber-700/70 uppercase tracking-widest mt-1">
                                    MacBook Pro (M2) and Building Access Key card must be returned to HR before settlement execution.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FnF Visualization */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-md border border-gray-200 shadow-xl overflow-hidden">
                        <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Full & Final Settlement</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Preview of Discharge Statement</p>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-all text-[9px] font-black uppercase tracking-widest">
                                <Download size={12} /> Get Digitally Signed PDF
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Summary Metadata */}
                            <div className="grid grid-cols-3 gap-6 py-4 border-b border-slate-100">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Associate Identity</p>
                                    <p className="text-xs font-black text-gray-900 uppercase">{fnfData.employeeName}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Closure Chronology</p>
                                    <p className="text-xs font-black text-gray-900 uppercase">LWD: {fnfData.lastWorkingDay}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Protocol Identifier</p>
                                    <p className="text-xs font-black text-gray-900 uppercase">FNF-2026-990-A</p>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Earnings Column */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Credits</h4>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">(+) ADDITIONS</span>
                                    </div>
                                    <div className="space-y-2">
                                        {fnfData.earnings.map((e, i) => (
                                            <div key={i} className="flex justify-between group">
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{e.label}</span>
                                                <span className="text-[10px] font-black text-gray-900">₹{e.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-900 uppercase">Total Credits</span>
                                        <span className="text-xs font-black text-emerald-600">₹{totalEarnings.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Deductions Column */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Debits</h4>
                                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">(-) RECOVERIES</span>
                                    </div>
                                    <div className="space-y-2">
                                        {fnfData.deductions.map((d, i) => (
                                            <div key={i} className="flex justify-between group">
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{d.label}</span>
                                                <span className="text-[10px] font-black text-gray-900">₹{d.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-900 uppercase">Total Debits</span>
                                        <span className="text-xs font-black text-rose-600">₹{totalDeductions.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Settlement Banner */}
                            <div className="mt-8 p-6 bg-primary-900 rounded-md shadow-2xl shadow-primary-900/40 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                                        <DollarSign size={24} className="text-primary-100" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-primary-200 font-bold uppercase tracking-widest mb-1">Terminal Disbursement Amount</p>
                                        <p className="text-4xl font-black text-white leading-none tracking-tighter">₹{netPayable.toLocaleString()}</p>
                                    </div>
                                </div>
                                <button className="w-full md:w-auto px-8 py-3 bg-white text-primary-900 text-xs font-black uppercase tracking-widest rounded shadow-xl hover:bg-primary-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    Approve Settlement <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                            <FileText size={14} className="text-slate-400" />
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                This statement is a computational preview and remains subject to final audit clearance and asset recovery verification.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
